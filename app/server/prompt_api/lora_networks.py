# -*- coding: UTF-8 -*-
import os
import json
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
    # 文件大小 / 修改时间：供前端 Lora 卡片列表按大小、时间排序使用
    item["file_size"] = 0
    item["file_mtime"] = 0
    if lora_path:
        try:
            _st = os.stat(lora_path)
            item["file_size"] = _st.st_size
            item["file_mtime"] = _st.st_mtime
        except Exception as _e:
            print(f"[WeiLin] 读取Lora文件stat失败 ({lora_path}): {_e}")
    item["local_info"] = info_data
    return item

def get_lora_folder():
    # 目录重扫（首次加载 / 刷新）时失效排序与 stat 缓存，
    # 保证「按大小 / 按时间」排序在文件被替换后能拿到最新值。
    invalidate_lora_sort_caches()
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

def check_lora_files_exist(names):
    """批量检查 Lora 路径是否在 loras 目录列表中（正反斜杠归一化后比对）。
    兼容不带文件后缀的名字：带后缀精确匹配完整文件名；无后缀名与"去扩展名路径集合"
    直接比对，或去掉扩展名后比对。三重判定覆盖：带后缀精确命中、无后缀命中（含文件名
    本身带点的场景，如 "xxx_alpha16.0_rank32"——splitext 会把 16.0 的点当扩展名截断，
    所以必须有无后缀直比这一路，避免把这类名字误判为文件不存在）。
    用于收藏跟随 Lora 的存在性检测：文件被移动/删除/改名后旧收藏能标出失效项。"""
    try:
        all_files = folder_paths.get_filename_list("loras")
    except Exception as e:
        print(f"[WeiLin] 检查Lora存在性失败: {e}")
        return {}
    full_set = set()
    noext_set = set()
    for p in all_files:
        if isinstance(p, str) and p:
            norm = p.replace('\\', '/')
            full_set.add(norm)
            noext_set.add(os.path.splitext(norm)[0])
    result = {}
    for n in names:
        if isinstance(n, str) and n:
            norm = n.replace('\\', '/')
            result[n] = norm in full_set or norm in noext_set or os.path.splitext(norm)[0] in noext_set
    return result

# —— 排序/分页 性能设计 ——
# 关键：排序只依赖「轻量信息」（路径字符串 / os.stat / sidecar 里的显示名），
# **只对当前页**做 prepare_lora_item_data（读元数据+缩略图，开销大）。
# 切换目录时只需准备一页（约 50 条），因此不会因为要全量排序而变慢。
_order_cache = {}        # (range哈希, sort_key, sort_dir) → 已排序的路径数组
_order_cache_max = 8
_stat_cache = {}         # 路径 → (size, mtime)，供 size/mtime 排序复用
_name_cache = {}         # 路径 → 卡片显示名，供 name 排序复用（免重复读 sidecar）


def _stat_info(path):
    """返回 (size, mtime)；失败兜底 (0, 0.0)。带缓存，避免重复 stat。

    注意：path 来自 folder_paths.get_filename_list('loras')，是**相对路径**
    （形如 sub/A.safetensors），直接 os.stat 会按进程工作目录解析而失败，
    导致大小/时间排序全部退化为 0（表现为"排序无效"）。
    必须先经 get_full_path 解析成 loras 目录下的真实完整路径。
    """
    info = _stat_cache.get(path)
    if info is None:
        try:
            full_path = folder_paths.get_full_path("loras", path) or path
            st = os.stat(full_path)
            info = (st.st_size, st.st_mtime)
        except Exception as e:
            print(f"[WeiLin] 读取Lora文件stat失败 ({path}): {e}")
            info = (0, 0.0)
        _stat_cache[path] = info
    return info


def _display_name_of(path):
    """取「卡片上实际显示的名字」，与前端 retLoraName 保持一致：

    lora_index.vue 的 retLoraName 优先用 `local_info.name`，为空才回退 `lora.name`
    （= 相对路径）；而 `local_info.name` 来自 sidecar `<模型文件>.weilin-info.json`
    的顶层 name（由 civitai / safetensors 元数据缓存而来），**常与文件名完全不同**
    （例：文件名 noobaiXLNAIXL_... 显示为 "PornMaster-noobXL & Illustrious-…"）。
    所以「按名称排序」必须用这个显示名，用文件名排会让人觉得"根本没排序"。

    只读该 JSON，不做 prepare（不探测封面、不读图片）。
    """
    cached = _name_cache.get(path)
    if cached is not None:
        return cached
    name = ''
    try:
        full_path = folder_paths.get_full_path("loras", path)
        if full_path:
            sidecar = f'{full_path}.weilin-info.json'
            if os.path.exists(sidecar):
                with open(sidecar, 'r', encoding='utf-8') as fp:
                    data = json.load(fp)
                if isinstance(data, dict):
                    name = data.get('name') or ''
    except Exception as e:
        print(f"[WeiLin] 读取Lora显示名失败 ({path}): {e}")
        name = ''
    if not name:
        name = str(path)   # 与 retLoraName 的兜底（lora.name = 相对路径）保持一致
    _name_cache[path] = name
    return name


def _warm_lora_name_cache(paths):
    """并行预热「显示名」缓存。读上千个小 JSON 属 I/O 密集任务，线程池加速显著
    （实测 2400 条约 0.5s，且每个刷新周期只付一次）；若留给 sort 内部逐个读盘，
    会串行阻塞、明显更慢。"""
    todo = [p for p in paths if p not in _name_cache]
    if not todo:
        return
    workers = min(32, (os.cpu_count() or 4) * 4)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        list(executor.map(_display_name_of, todo))


def _sort_value_of(path, key):
    """轻量排序键（不触发 prepare）：
    name → 卡片显示名的小写字典序（与用户看到的顺序一致），同名再用路径兜底；
    size/mtime → os.stat 数值（同样用路径兜底保证稳定）。"""
    if key == 'size':
        return (_stat_info(path)[0], str(path).lower())
    if key == 'mtime':
        return (_stat_info(path)[1], str(path).lower())
    return (_display_name_of(path).lower(), str(path).lower())


def invalidate_lora_sort_caches():
    """清空排序/stat/显示名缓存：目录重扫（刷新）后让排序拿到最新值。"""
    _order_cache.clear()
    _stat_cache.clear()
    _name_cache.clear()


async def get_rang_for_extra_networks(arr=None, sort_key='name', sort_dir='asc', page=1, page_size=50):
    if not arr:
        return {"loras": [], "total": 0}
    try:
        page = max(1, int(page))
        page_size = max(1, int(page_size))
    except Exception:
        page, page_size = 1, 50

    # 已排序路径数组缓存：同一 range + 同一排序方式翻页时直接命中，不重复排序/stat
    order_key = None
    try:
        order_key = (hash(tuple(arr)), sort_key, sort_dir)
    except Exception:
        order_key = None
    paths = _order_cache.get(order_key) if order_key is not None else None
    if paths is None:
        paths = list(arr)
        # sort_key == 'default'（或其它未知值）→ 保持 get_filename_list 的原始目录顺序，不排序
        if sort_key in ('name', 'size', 'mtime'):
            try:
                if sort_key == 'name':
                    # 显示名排序键需读 sidecar JSON：先并行预热，
                    # 否则会在 sort 内部逐个串行读盘（上千条时明显卡顿）
                    _warm_lora_name_cache(paths)
                paths.sort(key=lambda p: _sort_value_of(p, sort_key), reverse=(sort_dir != 'asc'))
            except Exception as e:
                print(f"[WeiLin] Lora排序失败: {e}")
        if order_key is not None:
            _order_cache[order_key] = paths
            if len(_order_cache) > _order_cache_max:
                _order_cache.pop(next(iter(_order_cache)))

    total = len(paths)
    start = (page - 1) * page_size
    page_paths = paths[start:start + page_size]

    # 只对当前页做「重活」（读元数据 + 缩略图），与改动前每页的开销一致
    items = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count() * 2) as executor:
        futures = [executor.submit(prepare_lora_item_data, p, False) for p in page_paths]
        for future in tqdm(futures):
            try:
                result = future.result()
                if result is not None:
                    items.append(result)
            except Exception as e:
                print(f"[WeiLin] 加载单个Lora失败，跳过: {e}")
    return {"loras": items, "total": total}

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

def preview_file(filename: str, video_as_url: bool = False):
    """读取 Lora 本地封面：图片返回缩略 base64；视频默认 base64（<2MB），video_as_url=True 时
    一律返回流式 URL（批量预查场景避免多个视频 base64 撑爆响应体）。"""
    preview_exts = [".jpg", ".png", ".jpeg", ".gif", ".webp", ".mp4"]
    preview_exts = [*preview_exts, *[".preview" + x for x in preview_exts]]
    for ext in preview_exts:
        try:
            pathStr = os.path.splitext(filename)[0] + ext
            if os.path.exists(pathStr):
                if ext == ".mp4" or ext.endswith(".mp4"):
                    file_size = os.path.getsize(pathStr)
                    MAX_BASE64_SIZE = 2 * 1024 * 1024

                    import urllib.parse
                    rel_path = None
                    for model_dir in folder_paths.get_folder_paths("loras"):
                        if pathStr.startswith(model_dir):
                            rel_path = pathStr[len(model_dir):].lstrip(os.sep).replace(os.sep, "/")
                            break
                    if rel_path and (video_as_url or file_size >= MAX_BASE64_SIZE):
                        import time
                        mtime = int(os.path.getmtime(pathStr))
                        return f"/weilin/prompt_ui/api/lorainfo/api/loras/img?file={urllib.parse.quote(rel_path, safe='')}&fmt=mp4&t={mtime}"

                    if file_size < MAX_BASE64_SIZE:
                        with open(pathStr, "rb") as f:
                            video_bytes = f.read()
                        video_base64 = base64.b64encode(video_bytes).decode()
                        return f"data:video/mp4;base64,{video_base64}"
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

def resolve_lora_path(name):
    """把 lora 名解析为 loras 目录中的真实相对路径：兼容带后缀 / 无后缀(wlr 标签里的
    model_name 就是去扩展名后的形式) / 正反斜杠。解析不到时原样返回。"""
    if not isinstance(name, str) or not name:
        return name
    try:
        all_files = folder_paths.get_filename_list("loras")
    except Exception as e:
        print(f"[WeiLin] 解析Lora路径失败: {e}")
        return name
    full_map = {}
    noext_map = {}
    for p in all_files:
        if isinstance(p, str) and p:
            norm = p.replace('\\', '/')
            full_map[norm] = p
            noext_map.setdefault(os.path.splitext(norm)[0], p)
    norm = name.replace('\\', '/')
    if norm in full_map:
        return full_map[norm]
    if norm in noext_map:
        return noext_map[norm]
    noext = os.path.splitext(norm)[0]
    if noext in noext_map:
        return noext_map[noext]
    return name


def get_lora_previews(names):
    """批量获取 Lora 本地封面缩略图（base64 data URL），无本地封面返回 None。
    名字兼容带后缀/无后缀/正反斜杠（与 check_lora_files_exist 同一套归一化与三重判定），
    用于提示词 wlr 标签的封面缩略图预查。"""
    result = {}
    paths = {}
    for name in names or []:
        if not isinstance(name, str) or not name:
            continue
        # resolve_lora_path 兼容带后缀/无后缀(wlr 标签的 model_name)/正反斜杠
        matched = resolve_lora_path(name)
        paths[name] = matched
        try:
            full_path = folder_paths.get_full_path("loras", matched)
            # video_as_url=True：视频封面返回流式 URL，避免批量预查时多个 base64 视频撑爆响应体
            result[name] = preview_file(full_path, video_as_url=True) if full_path else None
        except Exception as e:
            print(f"[WeiLin] 获取Lora封面出错 {name}: {e}")
            result[name] = None
    return result, paths


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