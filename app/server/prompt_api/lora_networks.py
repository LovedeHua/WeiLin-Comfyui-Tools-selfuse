# -*- coding: UTF-8 -*-
import os
import folder_paths
from PIL import Image
import base64
from io import BytesIO
import asyncio
import concurrent.futures
from tqdm import tqdm
import zlib
import base64

from .lora_info import get_model_info

loading_status = {
    "isLoading": False,
    "progress": 0,
    "total": 0,
    "current": 0
}

filters = [
    'search_term',
    'local_preview',
    'metadata',
]

def path_to_shortcode(path):
    compressed = zlib.compress(path.encode('utf-8'))
    shortcode = base64.b64encode(compressed).decode('utf-8').replace('+', '-').replace('/', '_').replace('=', '')
    return shortcode

def shortcode_to_path(shortcode):
    base64_str = shortcode.replace('-', '+').replace('_', '/')
    padding = 4 - (len(base64_str) % 4)
    if padding < 4:
        base64_str += '=' * padding
    compressed = base64.b64decode(base64_str)
    path = zlib.decompress(compressed).decode('utf-8')
    return path


def prepare_lora_item_data(item_path, auto_fetch=False):
    lora_path = folder_paths.get_full_path("loras", item_path)
    try:
        item_path = item_path.encode('utf-8', 'ignore').decode('utf-8')
        [model_name, model_extension] = os.path.splitext(item_path)
        file_name = os.path.basename(item_path)
    except Exception as e:
        print(f"文件名处理错误: {e}")
        model_name = os.path.splitext(os.path.basename(item_path))[0]
        model_extension = os.path.splitext(item_path)[1]
        file_name = os.path.basename(item_path)

    info_data = {}
    try:
        info_data = asyncio.run(get_model_info(item_path, light=True))
        if info_data is None:
            info_data = {}
    except Exception as e:
        print(f"[WeiLin] 获取Lora信息失败 ({item_path}): {e}")
        info_data = {}

    if auto_fetch:
        try:
            if len(info_data.get('images', [])) == 0:
                fetched = asyncio.run(get_model_info(item_path, maybe_fetch_civitai=True, maybe_fetch_metadata=True, light=False))
                if fetched is not None:
                    info_data = fetched
        except Exception as e:
            print(f"[WeiLin] 自动获取Lora信息失败 ({item_path}): {e}")

    if not isinstance(info_data, dict):
        info_data = {}

    item = {
            "basename": item_path,
            "name": item_path,
            "dirname": os.path.dirname(lora_path) if lora_path else "",
            "file_path": lora_path or "",
            "preview": preview_file(lora_path) if lora_path else None,
            "model_name": model_name,
            "model_filename": file_name,
        }
    item["local_info"] = info_data
    return item

def get_lora_folder():
    all_files = folder_paths.get_filename_list("loras")
    
    result = {
        "all": all_files,
        "/": {
            "/": {},
            "all": []
        }
    }
    
    for file_path in all_files:
        parts = file_path.replace('\\', '/').split('/')
        
        if len(parts) == 1:
            result["/"]["/"][parts[0]] = file_path
            result["/"]["all"].append(file_path)
        else:
            level1_dir = parts[0]
            
            if level1_dir not in result:
                result[level1_dir] = {
                    "all": [],
                    "/": {}
                }
            
            if len(parts) == 2:
                result[level1_dir]["/"][parts[1]] = file_path
                result[level1_dir]["all"].append(file_path)
            else:
                subdir = "\\".join(parts[1:-1])
                
                if subdir not in result[level1_dir]:
                    result[level1_dir][subdir] = {}
                
                result[level1_dir][subdir][parts[-1]] = file_path
                result[level1_dir]["all"].append(file_path)
    
    return result

async def search_lora_files(query):
    all_files = folder_paths.get_filename_list("loras")
    results = []
    
    query = query.lower()
    
    for file_path in all_files:
        file_name = os.path.basename(file_path)
        if query in file_name.lower():
            results.append(file_path)
    
    return results

async def get_rang_for_extra_networks(arr=[]):
    return_response = {"loras": []}
    if len(arr) > 0:
        items = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count()*2) as executor:
            futures = [executor.submit(prepare_lora_item_data, item_path, False) for item_path in arr]
            for future in tqdm(futures):
                try:
                    result = future.result()
                    if result is not None:
                        items.append(result)
                except Exception as e:
                    print(f"[WeiLin] 加载单个Lora失败，跳过: {e}")
        return_response["loras"] = items
    return return_response

async def get_extra_networks(auto_fetch=False):
    global loading_status
    loras_path  = folder_paths.get_filename_list("loras")
    return_response = {"path": "", "loras": []}
    return_response["path"] = loras_path
    items = []
    
    loading_status["isLoading"] = True
    loading_status["total"] = len(loras_path)
    loading_status["current"] = 0
    loading_status["progress"] = 0
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count()*2) as executor:
            futures = [executor.submit(prepare_lora_item_data, item_path, auto_fetch) for item_path in loras_path]
            for future in tqdm(futures):
                try:
                    result = future.result()
                    if result is not None:
                        items.append(result)
                except Exception as e:
                    print(f"[WeiLin] 加载单个Lora失败，跳过: {e}")
                loading_status["current"] += 1
                loading_status["progress"] = int((loading_status["current"] / loading_status["total"]) * 100)
    finally:
        loading_status["isLoading"] = False
        
    return_response["loras"] = items
    return return_response

def preview_file(filename: str):
    preview_exts = [".jpg", ".png", ".jpeg", ".gif", ".webp", ".mp4"]
    preview_exts = [*preview_exts, *[".preview" + x for x in preview_exts]]
    for ext in preview_exts:
        try:
            pathStr = os.path.splitext(filename)[0] + ext
            if os.path.exists(pathStr):
                if ext == ".mp4" or ext.endswith(".mp4"):
                    file_size = os.path.getsize(pathStr)
                    MAX_BASE64_SIZE = 2 * 1024 * 1024

                    if file_size < MAX_BASE64_SIZE:
                        with open(pathStr, "rb") as f:
                            video_bytes = f.read()
                        video_base64 = base64.b64encode(video_bytes).decode()
                        return f"data:video/mp4;base64,{video_base64}"
                    else:
                        import urllib.parse
                        rel_path = None
                        for model_dir in folder_paths.get_folder_paths("loras"):
                            if pathStr.startswith(model_dir):
                                rel_path = pathStr[len(model_dir):].lstrip(os.sep).replace(os.sep, "/")
                                break
                        if rel_path:
                            return f"/weilin/prompt_ui/api/lorainfo/api/loras/img?file={urllib.parse.quote(rel_path, safe='')}&fmt=mp4"
                        else:
                            if file_size < 10 * 1024 * 1024:
                                with open(pathStr, "rb") as f:
                                    video_bytes = f.read()
                                video_base64 = base64.b64encode(video_bytes).decode()
                                return f"data:video/mp4;base64,{video_base64}"
                            return None
                else:
                    bytes = get_thumbnail_for_image_file(pathStr)
                    img_base64 = base64.b64encode(bytes).decode()
                    return f"data:image/jpeg;base64,{img_base64}"
        except Exception as e:
            print(f"读取封面出错: {e}")
            return None


MAX_IMAGE_SIZE = 250

def get_thumbnail_for_image_file(file_path):
    try:
        with Image.open(file_path) as img:
            if img.width > MAX_IMAGE_SIZE and img.height > MAX_IMAGE_SIZE:
                width = int(img.width * MAX_IMAGE_SIZE / img.height)
                img = img.resize((width, MAX_IMAGE_SIZE))
            img = img.convert("RGB")
            buffer = BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            return buffer.getvalue()
    except Exception as e:
        print(f"打开封面出错: {e}")
        return None