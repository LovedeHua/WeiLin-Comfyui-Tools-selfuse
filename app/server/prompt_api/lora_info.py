import urllib.parse
import folder_paths
import os
import json
import re
import hashlib
import requests
from datetime import datetime


def _is_network_available():
  """
  检测网络是否可用，以能否访问 Civitai API 为准。
  使用缓存避免频繁请求，5分钟内只检测一次。
  """
  try:
    import time
    if hasattr(_is_network_available, '_last_check'):
      last_check_time, last_result = _is_network_available._last_check
      if time.time() - last_check_time < 300:
        return last_result
    
    response = requests.get('https://civitai.red/api/v1/models', timeout=(3, 5))
    result = response.status_code == 200
    
    _is_network_available._last_check = (time.time(), result)
    return result
  except Exception:
    try:
      import time
      _is_network_available._last_check = (time.time(), False)
    except Exception:
      pass
    return False


THIS_DIR = os.path.dirname(os.path.abspath(__file__))
USERDATA = os.path.join(THIS_DIR, '../../../', 'lora_userdatas')

# code from rgthree-comfy thanks

def image_upload(post, image_save_function=None):
  image = post.get("image")
  path = post.get("path")
  fileName = post.get("fileName")

  lora_path = folder_paths.get_full_path("loras", path)
  if not path_exists(lora_path):
    lora_path = os.path.abspath(lora_path)

  for ext in ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webp']:
    try_path = f'{os.path.splitext(lora_path)[0]}.{ext}'
    if path_exists(try_path):
      os.remove(try_path)
  
  file_name_with_extension = os.path.basename(lora_path)
  file_namea, _ = os.path.splitext(file_name_with_extension)
  model = file_namea

  upload_dir = os.path.dirname(os.path.abspath(lora_path))

  api_response = {'status': 200}
  
  if image and image.file:
      
      file_name, file_extension = os.path.splitext(fileName)
      
      filepath = os.path.join(upload_dir, model+file_extension)

      with open(filepath, "wb") as f:
        f.write(image.file.read())
      
      api_response['res'] = 'success'
      return api_response
  else:
      api_response['status'] = '404'
      return api_response

def get_param(request, param, default=None):
  """Gets a param from a request."""
  if param in request.rel_url.query:
      value = request.rel_url.query[param]
      try:
          import urllib.parse
          return urllib.parse.unquote(value)
      except:
          return value
  return default

def is_param_falsy(request, param):
  """Determines if a param is explicitly 0 or false."""
  val = get_param(request, param)
  return val is not None and (val == "0" or val.upper() == "FALSE")

def path_exists(path):
  """Checks if a path exists, accepting None type."""
  if path is not None:
    return os.path.exists(path)
  return False


def get_folder_path(file: str, model_type="loras"):
  """Gets the file path ensuring it exists."""
  try:
    import urllib.parse
    file = urllib.parse.unquote(file)
  except:
    pass
  file_path = folder_paths.get_full_path(model_type, file)
  if file_path and not path_exists(file_path):
    file_path = os.path.abspath(file_path)
  if not path_exists(file_path):
    file_path = None
  return file_path


async def get_loras_info_response(request, maybe_fetch_civitai=False, maybe_fetch_metadata=False):
  """Gets lora info for all or a single lora"""
  api_response = {'status': 200}
  lora_file = get_param(request, 'file')

  if get_param(request, 'light') is not None:
    light = is_param_falsy(request, 'light')
  else:
    light = False
  if lora_file is not None:
    if light:
      info_data = await get_model_info(lora_file,
                                       maybe_fetch_civitai=maybe_fetch_civitai,
                                       maybe_fetch_metadata=maybe_fetch_metadata,
                                       light=light)
    else:
      info_data = await get_model_info(lora_file,
                                       force_fetch_civitai=maybe_fetch_civitai,
                                       force_fetch_metadata=maybe_fetch_metadata,
                                       light=light)
    if info_data is None:
      api_response['status'] = '404'
      api_response['error'] = 'No Lora found at path'
    else:
      api_response['data'] = info_data
  else:
    api_response['data'] = []
    lora_files = folder_paths.get_filename_list("loras")
    for lora_file in lora_files:
      info_data = await get_model_info(lora_file,
                                       maybe_fetch_civitai=maybe_fetch_civitai,
                                       maybe_fetch_metadata=maybe_fetch_metadata,
                                       light=light)
      api_response['data'].append(info_data)
  return api_response



def load_json_file(file: str, default=None):
  """Reads a json file and returns the json dict, stripping out "//" comments first."""
  if path_exists(file):
    with open(file, 'r', encoding='UTF-8') as file:
      config = file.read()
      try:
        return json.loads(config)
      except json.decoder.JSONDecodeError:
        try:
          config = re.sub(r"^\s*//\s.*", "", config, flags=re.MULTILINE)
          return json.loads(config)
        except json.decoder.JSONDecodeError:
          try:
            config = re.sub(r"(?:^|\s)//.*", "", config, flags=re.MULTILINE)
            return json.loads(config)
          except json.decoder.JSONDecodeError:
            pass
  return default


def _update_data(info_data: dict) -> bool:
  """Ports old data to new data if necessary."""
  should_save = False
  if 'triggerWords' in info_data and len(info_data['triggerWords']) > 0:
    civitai_words = ','.join((get_dict_value(info_data, 'raw.civitai.triggerWords', default=[]) +
                              get_dict_value(info_data, 'raw.civitai.trainedWords', default=[])))
    if 'trainedWords' not in info_data:
      info_data['trainedWords'] = []
    for trigger_word in info_data['triggerWords']:
      word_data = next((data for data in info_data['trainedWords'] if data['word'] == trigger_word),
                       None)
      if word_data is None:
        word_data = {'word': trigger_word}
        info_data['trainedWords'].append(word_data)
      if trigger_word in civitai_words:
        word_data['civitai'] = True
      else:
        word_data['user'] = True

    del info_data['triggerWords']
    should_save = True
  return should_save


async def get_model_info(file: str,
                         model_type="loras",
                         default=None,
                         maybe_fetch_civitai=False,
                         force_fetch_civitai=False,
                         maybe_fetch_metadata=False,
                         force_fetch_metadata=False,
                         light=False):
  """Compiles a model info given a stored file next to the model, and/or metadata/civitai."""

  file_path = get_folder_path(file, model_type)
  if file_path is None:
    return default

  info_data = {}
  should_save = False
  
  try_info_path = f'{file_path}.weilin-info.json'
  local_info_exists = path_exists(try_info_path)
  
  if local_info_exists:
    info_data = load_json_file(try_info_path)

  if 'file' not in info_data:
    info_data['file'] = file
    should_save = True
  if 'path' not in info_data:
    info_data['path'] = file_path
    should_save = True

  # 统一本地封面查找逻辑，与 preview_file 保持一致
  # 扩展名列表和顺序必须与 preview_file 完全一致
  img_extensions = ['.jpg', '.png', '.jpeg', '.gif', '.webp', '.mp4']
  preview_extensions = [f'.preview{ext}' for ext in img_extensions]
  # 合并：preview 版本优先于普通版本（与 preview_file 一致）
  all_extensions = preview_extensions + img_extensions

  img_next_to_file = None
  for ext in all_extensions:
    try_path = f'{os.path.splitext(file_path)[0]}{ext}'
    if path_exists(try_path):
      img_next_to_file = try_path
      break

  if 'images' not in info_data:
    info_data['images'] = []
    should_save = True

  if img_next_to_file:
    # 根据实际文件扩展名判断类型（支持 .preview.mp4 等情况）
    file_lower = img_next_to_file.lower()
    is_video = file_lower.endswith('.mp4') or file_lower.endswith('.preview.mp4')
    # 为mp4添加fmt=mp4参数，让前端能正确识别
    img_next_to_file_url = f'/weilin/prompt_ui/api/lorainfo/api/loras/img?file={urllib.parse.quote(file, safe="")}{"&fmt=mp4" if is_video else ""}'
    info_data['images'] = [img for img in info_data['images'] if 'lorainfo/api/loras/img' not in img.get('url', '')]
    img_data = {'url': img_next_to_file_url}
    if is_video:
      img_data['type'] = 'video'
    else:
      img_data['type'] = 'image'
    info_data['images'].insert(0, img_data)
    should_save = True

  if light and not maybe_fetch_metadata and not force_fetch_metadata and not maybe_fetch_civitai and not force_fetch_civitai:
    return info_data

  # 当 light=False 且没有明确禁止时，默认获取 Civitai 数据
  if not light and not maybe_fetch_civitai and not force_fetch_civitai:
    maybe_fetch_civitai = True
  if not light and not maybe_fetch_metadata and not force_fetch_metadata:
    maybe_fetch_metadata = True

  if 'raw' not in info_data:
    info_data['raw'] = {}
    should_save = True

  should_save = _update_data(info_data) or should_save

  if local_info_exists and not force_fetch_civitai and not force_fetch_metadata:
    maybe_fetch_civitai = False
    maybe_fetch_metadata = False

  network_available = _is_network_available()
  
  should_fetch_civitai = force_fetch_civitai is True or (maybe_fetch_civitai is True and network_available and
                                                         ('civitai' not in info_data['raw'] or len(info_data['raw']['civitai']) == 0))
  should_fetch_metadata = force_fetch_metadata is True or (maybe_fetch_metadata is True and network_available and
                                                           ('metadata' not in info_data['raw'] or len(info_data['raw']['metadata']) == 0))

  if should_fetch_metadata:
    data_meta = _get_model_metadata(file,
                                    model_type=model_type,
                                    default={},
                                    refresh=force_fetch_metadata)
    if data_meta is None:
      data_meta = {}
    should_save = _merge_metadata(info_data, data_meta) or should_save

  if should_fetch_civitai:
    data_civitai = _get_model_civitai_data(file,
                                           model_type=model_type,
                                           default={},
                                           refresh=force_fetch_civitai)
    if data_civitai is None:
      data_civitai = {}
    should_save = _merge_civitai_data(info_data, data_civitai) or should_save

  if 'sha256' not in info_data:
    file_hash = _get_sha256_hash(file_path)
    if file_hash is not None:
      info_data['sha256'] = file_hash
      should_save = True
  
  # 检查是否已有本地封面
  has_local_cover = False
  for img in info_data.get('images', []):
    if isinstance(img, dict):
      img_url = img.get('url', '')
      if 'lorainfo/api/loras/img' in img_url or img_url.startswith('data:'):
        has_local_cover = True
        break

  # 没有本地封面时才尝试下载
  if not has_local_cover and len(info_data.get('images', [])) > 0:
    first_img = info_data['images'][0]
    is_video = isinstance(first_img, dict) and first_img.get('type') == 'video'
    if not is_video:
      file_name = os.path.basename(file)
      url = None
      for img in info_data['images']:
        if isinstance(img, dict) and img.get('type') == 'image':
          url = img.get('url')
          break
      if url is None and isinstance(first_img, dict):
        url = first_img.get('url')
      
      if url and isinstance(url, str) and url.startswith('http') and network_available:
        download_image(url=url, filename=file_name, directory=os.path.dirname(file_path))

  if should_save:
    if 'trainedWords' in info_data:
      info_data['trainedWords'] = sorted(info_data['trainedWords'],
                                         key=lambda w: w['count'] if 'count' in w else 99999,
                                         reverse=True)
    save_model_info(file, info_data, model_type=model_type)
  
  return info_data


def download_image(url, filename, directory):
    try:
        filename = filename.encode('utf-8', 'ignore').decode('utf-8')
        _, ext = os.path.splitext(url)
        filename_base, _ = os.path.splitext(filename)

        try:
            resp = requests.get(url, stream=True, timeout=(5, 15))
            resp.raise_for_status()

            # 根据Content-Type判断实际文件类型，修正扩展名
            content_type = resp.headers.get('Content-Type', '').lower()
            if 'video' in content_type or 'mp4' in content_type:
                ext = '.mp4'
            elif 'image/jpeg' in content_type or 'image/jpg' in content_type:
                ext = '.jpg'
            elif 'image/png' in content_type:
                ext = '.png'
            elif 'image/gif' in content_type:
                ext = '.gif'
            elif 'image/webp' in content_type:
                ext = '.webp'

            # 如果URL没有扩展名且Content-Type也无法判断，根据URL内容猜测
            if not ext:
                url_lower = url.lower()
                if any(url_lower.endswith(e) for e in ['.mp4', '.webm', '.mov']):
                    ext = '.mp4'
                elif url_lower.endswith('.png'):
                    ext = '.png'
                elif url_lower.endswith('.gif'):
                    ext = '.gif'
                elif url_lower.endswith('.webp'):
                    ext = '.webp'
                else:
                    ext = '.jpg'  # 默认jpg

            filepath = os.path.join(directory, f"{filename_base}{ext}")

            with open(filepath, 'wb') as f:
                for chunk in resp.iter_content(chunk_size=4096):
                    f.write(chunk)
        except requests.exceptions.Timeout:
            print(f"[WeiLin] 下载图片超时: {url}")
        except requests.exceptions.ConnectionError:
            print(f"[WeiLin] 下载图片网络错误: {url}")
        except Exception as e:
            print(f"[WeiLin] 下载图片失败: {e}")
        finally:
            if os.path.exists(filepath) and os.path.getsize(filepath) == 0:
                os.remove(filepath)

    except Exception as e:
        print(f"[WeiLin] 文件名处理错误: {e}")


def _merge_metadata(info_data: dict, data_meta: dict) -> bool:
  if data_meta is None or not isinstance(data_meta, dict):
    return False
  should_save = False

  base_model_file = get_dict_value(data_meta, 'ss_sd_model_name', None)
  if base_model_file:
    info_data['baseModelFile'] = base_model_file

  trained_words = {}
  if 'ss_tag_frequency' in data_meta and isinstance(data_meta['ss_tag_frequency'], dict):
    for bucket_value in data_meta['ss_tag_frequency'].values():
      if isinstance(bucket_value, dict):
        for tag, count in bucket_value.items():
          if tag not in trained_words:
            trained_words[tag] = {'word': tag, 'count': 0, 'metadata': True}
          trained_words[tag]['count'] = trained_words[tag]['count'] + count

  if 'trainedWords' not in info_data:
    info_data['trainedWords'] = list(trained_words.values())
    should_save = True
  else:
    merged_dict = {}
    for existing_word_data in info_data['trainedWords']:
      merged_dict[existing_word_data['word']] = existing_word_data
    for new_key, new_word_data in trained_words.items():
      if new_key not in merged_dict:
        merged_dict[new_key] = {}
      merged_dict[new_key] = {**merged_dict[new_key], **new_word_data}
    info_data['trainedWords'] = list(merged_dict.values())
    should_save = True

  info_data['raw']['metadata'] = data_meta
  should_save = True

  if 'sha256' not in info_data and '_sha256' in data_meta:
    info_data['sha256'] = data_meta['_sha256']
    should_save = True

  return should_save


def _merge_civitai_data(info_data: dict, data_civitai: dict) -> bool:
  if data_civitai is None or not isinstance(data_civitai, dict):
    return False
  should_save = False

  if 'name' not in info_data:
    info_data['name'] = get_dict_value(data_civitai, 'model.name', '')
    should_save = True
    version_name = get_dict_value(data_civitai, 'name')
    if version_name is not None:
      info_data['name'] += f' - {version_name}'

  if 'type' not in info_data:
    info_data['type'] = get_dict_value(data_civitai, 'model.type')
    should_save = True
  if 'baseModel' not in info_data:
    info_data['baseModel'] = get_dict_value(data_civitai, 'baseModel')
    should_save = True

  civitai_trigger = get_dict_value(data_civitai, 'triggerWords', default=[])
  civitai_trained = get_dict_value(data_civitai, 'trainedWords', default=[])
  civitai_words = ','.join(civitai_trigger + civitai_trained)
  if civitai_words:
    civitai_words = re.sub(r"\s*,\s*", ",", civitai_words)
    civitai_words = re.sub(r",+", ",", civitai_words)
    civitai_words = re.sub(r"^,", "", civitai_words)
    civitai_words = re.sub(r",$", "", civitai_words)
    if civitai_words:
      civitai_words = civitai_words.split(',')
      if 'trainedWords' not in info_data:
        info_data['trainedWords'] = []
      for trigger_word in civitai_words:
        word_data = next(
          (data for data in info_data['trainedWords'] if data['word'] == trigger_word), None)
        if word_data is None:
          word_data = {'word': trigger_word}
          info_data['trainedWords'].append(word_data)
        word_data['civitai'] = True

  if 'sha256' not in info_data:
    info_data['sha256'] = data_civitai['_sha256']
    should_save = True

  if 'modelId' in data_civitai:
    info_data['links'] = info_data['links'] if 'links' in info_data else []
    civitai_link = f'https://civitai.red/models/{get_dict_value(data_civitai, "modelId")}'
    if get_dict_value(data_civitai, "id"):
      civitai_link += f'?modelVersionId={get_dict_value(data_civitai, "id")}'
    info_data['links'].append(civitai_link)
    info_data['links'].append(data_civitai['_civitai_api'])
    should_save = True

  if 'images' in data_civitai:
    info_data_image_urls = list(map(lambda i: i['url']
                                    if 'url' in i else None, info_data.get('images', [])))
    for img in data_civitai['images']:
      img_url = get_dict_value(img, 'url')
      if img_url is not None and img_url not in info_data_image_urls:
        img_id = os.path.splitext(os.path.basename(img_url))[0] if img_url is not None else None
        img_data = {
          'url': img_url,
          'civitaiUrl': f'https://civitai.red/images/{img_id}' if img_id is not None else None,
          'width': get_dict_value(img, 'width'),
          'height': get_dict_value(img, 'height'),
          'type': get_dict_value(img, 'type'),
          'nsfwLevel': get_dict_value(img, 'nsfwLevel'),
          'seed': get_dict_value(img, 'meta.seed'),
          'positive': get_dict_value(img, 'meta.prompt'),
          'negative': get_dict_value(img, 'meta.negativePrompt'),
          'steps': get_dict_value(img, 'meta.steps'),
          'sampler': get_dict_value(img, 'meta.sampler'),
          'cfg': get_dict_value(img, 'meta.cfgScale'),
          'model': get_dict_value(img, 'meta.Model'),
          'resources': get_dict_value(img, 'meta.resources'),
        }
        info_data['images'].append(img_data)
        should_save = True

  if 'civitai' not in info_data['raw']:
    info_data['raw']['civitai'] = data_civitai
    should_save = True

  return should_save


def _get_model_civitai_data(file: str, model_type="loras", default=None, refresh=False):
  file_hash = _get_sha256_hash(get_folder_path(file, model_type))
  if file_hash is None:
    return None

  json_file_path = _get_info_cache_file(file_hash, 'civitai')

  api_url = f'https://civitai.red/api/v1/model-versions/by-hash/{file_hash}'
  file_data = read_userdata_json(json_file_path)
  if file_data is None or refresh is True:
    try:
      response = requests.get(api_url, timeout=(5, 10))
      data = response.json()
      save_userdata_json(json_file_path, {
        'url': api_url,
        'timestamp': datetime.now().timestamp(),
        'response': data
      })
      file_data = read_userdata_json(json_file_path)
    except requests.exceptions.Timeout:
      print(f"[WeiLin] Civitai API 请求超时: {file}")
    except requests.exceptions.ConnectionError:
      print(f"[WeiLin] Civitai API 网络错误: {file}")
    except Exception as e:
      print(f"[WeiLin] Civitai API 请求失败: {e}")
  response = file_data['response'] if file_data is not None and 'response' in file_data else None
  if response is not None:
    response['_sha256'] = file_hash
    response['_civitai_api'] = api_url
  return response if response is not None else default


def _get_model_metadata(file: str, model_type="loras", default=None, refresh=False):
  file_path = get_folder_path(file, model_type)
  file_hash = _get_sha256_hash(file_path)
  if file_hash is None:
    return default

  json_file_path = _get_info_cache_file(file_hash, 'metadata')

  file_data = read_userdata_json(json_file_path)
  if file_data is None or refresh is True:
    data = _read_file_metadata_from_header(file_path)
    if data is not None:
      file_data = {'url': file, 'timestamp': datetime.now().timestamp(), 'response': data}
      save_userdata_json(json_file_path, file_data)
  response = file_data['response'] if file_data is not None and 'response' in file_data else None
  if response is not None:
    response['_sha256'] = file_hash
  return response if response is not None else default


def _read_file_metadata_from_header(file_path: str) -> dict:
  data = None
  try:
    if file_path.endswith('.safetensors'):
      with open(file_path, "rb") as file:
        header_size = int.from_bytes(file.read(8), "little", signed=False)

        if header_size <= 0:
          raise BufferError("Invalid header size")

        header = file.read(header_size)
        if header is None:
          raise BufferError("Invalid header")

        header_json = json.loads(header)
        data = header_json["__metadata__"] if "__metadata__" in header_json else None

        if data is not None:
          for key, value in data.items():
            if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
              try:
                value_as_json = json.loads(value)
                data[key] = value_as_json
              except Exception:
                print(f'metdata for field {key} did not parse as json')
  except Exception as e:
    print(f"[WeiLin] 读取文件元数据失败: {e}")
    data = None

  return data


def get_folder_path(file: str, model_type="loras"):
  file_path = folder_paths.get_full_path(model_type, file)
  if file_path and not path_exists(file_path):
    file_path = os.path.abspath(file_path)
  if not path_exists(file_path):
    file_path = None
  return file_path


def _get_sha256_hash(file_path: str):
  if not file_path or not path_exists(file_path):
    return None
  file_hash = None
  sha256_hash = hashlib.sha256()
  with open(file_path, "rb") as f:
    for byte_block in iter(lambda: f.read(4096), b""):
      sha256_hash.update(byte_block)
    file_hash = sha256_hash.hexdigest()
  return file_hash


async def set_model_info_partial(file: str, info_data_partial, model_type="loras"):
  info_data = await get_model_info(file, model_type=model_type, default={})
  info_data = {**info_data, **info_data_partial}
  save_model_info(file, info_data, model_type=model_type)


def save_model_info(file: str, info_data, model_type="loras"):
  file_path = get_folder_path(file, model_type)
  if file_path is None:
    return
  try_info_path = f'{file_path}.weilin-info.json'
  save_json_file(try_info_path, info_data)

async def remove_user_diy_fields(file: str, fields_to_remove, model_type="loras"):
    info_data = await get_model_info(file, model_type=model_type, default={})
    
    if 'user_diy_fileds' not in info_data:
      return False

    if isinstance(fields_to_remove, str):
      fields_to_remove = [fields_to_remove]
    
    removed = False
    for field in fields_to_remove:
      if field in info_data['user_diy_fileds']:
        del info_data['user_diy_fileds'][field]
        removed = True
    
    if removed:
      save_model_info(file, info_data, model_type=model_type)
    
    return removed


def get_dict_value(data: dict, dict_key: str, default=None):
  if data is None or not isinstance(data, dict):
    return default
  keys = dict_key.split('.')
  key = keys.pop(0) if len(keys) > 0 else None
  found = data[key] if key in data else None
  if found is not None and len(keys) > 0:
    return get_dict_value(found, '.'.join(keys), default)
  return found if found is not None else default

def read_userdata_json(rel_path: str):
  file_path = clean_path(rel_path)
  return load_json_file(file_path)


def save_userdata_json(rel_path: str, data: dict):
  file_path = clean_path(rel_path)
  return save_json_file(file_path, data)


def clean_path(rel_path: str):
  cleaned = USERDATA
  paths = rel_path.split('/')
  for path in paths:
    cleaned = os.path.join(cleaned, path)
  return cleaned


def save_json_file(file_path: str, data: dict):
  os.makedirs(os.path.dirname(file_path), exist_ok=True)
  with open(file_path, 'w+', encoding='UTF-8') as file:
    json.dump(data, file, sort_keys=False, indent=2, separators=(",", ": "))



def _get_info_cache_file(file_hash: str, data_type: str):
  return f'info/{file_hash}.{data_type}.json'


async def delete_model_info(file: str,
                            model_type="loras",
                            del_info=True,
                            del_metadata=True,
                            del_civitai=True):
  file_path = get_folder_path(file, model_type)
  if file_path is None:
    return
  if del_info:
    try_info_path = f'{file_path}.weilin-info.json'
    if os.path.isfile(try_info_path):
      os.remove(try_info_path)
  if del_civitai or del_metadata:
    file_hash = _get_sha256_hash(file_path)
    if del_civitai:
      json_file_path = _get_info_cache_file(file_hash, 'civitai')
      delete_userdata_file(json_file_path)
    if del_metadata:
      json_file_path = _get_info_cache_file(file_hash, 'metadata')
      delete_userdata_file(json_file_path)


def delete_userdata_file(rel_path: str):
  file_path = clean_path(rel_path)
  if os.path.isfile(file_path):
    os.remove(file_path)