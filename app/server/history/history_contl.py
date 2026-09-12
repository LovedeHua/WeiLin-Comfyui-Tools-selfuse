import time
import json
from ..dao.dao import execute_query, fetch_all, fetch_one
from ..user_init.user_init import get_history_limit_setting


def _history_dedup_key(tag_str):
    """从保存的 tag JSON 中提取语义去重键 (归一化 prompt + lora)。

    前端保存的 tag 是 {prompt, lora}（74.29 起不再存恒为空的 temp_prompt/temp_lora；
    旧数据仍带 temp_* 字段，读取时忽略）的 JSON 串，按语义键去重。
    解析失败（旧数据/非 JSON）时退化为原文匹配。

    74.29：prompt 做空白归一化（连续空白压为单空格、去首尾）。
    实证：带动态语法的模板反复执行/微调时，残留的行尾换行、双空格等
    无意义空白差异会让全文精确匹配绕过去重，同一模板堆积多条历史；
    归一化后仅空白不同的 prompt 视为同一条（刷新置顶）。
    DP 语法（{a|b|c}/__wildcard__）保留原文参与键：模板相同即同一条，
    每次展开结果不同不影响去重。
    """
    try:
        obj = json.loads(tag_str)
        if isinstance(obj, dict):
            prompt = obj.get('prompt', '') or ''
            prompt = ' '.join(prompt.split())
            lora = obj.get('lora', '')
            try:
                lora_str = json.dumps(lora, ensure_ascii=False, sort_keys=True)
            except Exception:
                lora_str = str(lora)
            return '\x00' + prompt + '\x00' + lora_str
    except Exception:
        pass
    return '\x01' + (tag_str or '')


async def _enforce_history_limit():
    """历史上限自动清理：激活记录数超出上限时，软删除最旧的记录。上限 <= 0 表示不限制。"""
    try:
        limit = get_history_limit_setting()
    except Exception:
        limit = 500
    if not limit or limit <= 0:
        return
    count_row = await fetch_one('history', "SELECT COUNT(*) FROM history WHERE is_deleted = 0")
    count = count_row[0] if count_row else 0
    if count <= limit:
        return
    rows = await fetch_all(
        'history',
        "SELECT id_index FROM history WHERE is_deleted = 0 ORDER BY create_time ASC, id_index ASC LIMIT ?",
        (count - limit,))
    if rows:
        ids = [r[0] for r in rows]
        await execute_query(
            'history',
            "UPDATE history SET is_deleted = 1 WHERE id_index IN ({seq})".format(
                seq=','.join(['?'] * len(ids))),
            tuple(ids))


async def read_history():
    """读取历史记录"""
    query = "SELECT id_index, tag, name, color, create_time FROM history WHERE is_deleted = 0 ORDER BY create_time DESC"
    data = await fetch_all('history',query)

    # 将数据转换为 JSON 格式
    result = []
    for row in data:
        result.append({
            "id_index": row[0],
            "tag": row[1],
            "name": row[2],
            "color": row[3],
            "create_time": row[4]
        })

    return result

async def add_history(tag, name="", color=""):
    """添加新的历史记录

    去重：内容相同（prompt+lora 语义键一致）的记录刷新时间置顶，不再新增；
    保存后按设置的上限自动清理最旧记录。
    """
    if not tag:
        return {"info": "Tag is required"}
    if len(tag) <= 0:
        return {"info": "Tag is required"}

    create_time = int(time.time())
    dedup_key = _history_dedup_key(tag)

    # 去重：同样内容的记录刷新时间置顶（并同步为最新 tag 结构）
    existing_rows = await fetch_all('history', "SELECT id_index, tag FROM history WHERE is_deleted = 0")
    matched_id = None
    for row in existing_rows:
        try:
            same = _history_dedup_key(row[1]) == dedup_key
        except Exception:
            same = False
        if same:
            matched_id = row[0]
            break

    if matched_id is not None:
        query = '''
            UPDATE history
            SET tag = ?, name = ?, color = ?, create_time = ?, is_deleted = 0
            WHERE id_index = ?
        '''
        await execute_query('history', query, (tag, name, color, create_time, matched_id))
        await _enforce_history_limit()
        return {"info": "Updated"}

    # 检查是否有可复用的 id_index
    query = "SELECT id_index FROM history WHERE is_deleted = 1 LIMIT 1"
    deleted_id = await fetch_one('history',query)

    if deleted_id:
        id_index = deleted_id[0]
        # 更新复用的 id_index
        query = '''
            UPDATE history
            SET tag = ?, name = ?, color = ?, create_time = ?, is_deleted = 0
            WHERE id_index = ?
        '''
        await execute_query('history',query, (tag, name, color, create_time, id_index))
    else:
        query = '''
            INSERT INTO history (tag, name, color, create_time)
            VALUES (?, ?, ?, ?)
        '''
        await execute_query('history',query, (tag, name, color, create_time))

    await _enforce_history_limit()
    return {"info": "Append"}

async def delete_history(id_index):
    """删除指定 id_index 的历史记录"""
    query = "UPDATE history SET is_deleted = 1 WHERE id_index = ?"
    await execute_query('history',query, (id_index,))
    return {"info": "Deleted"}

async def batch_delete_history(id_indices):
    """批量删除指定 id_index 的历史记录"""
    query = "UPDATE history SET is_deleted = 1 WHERE id_index IN ({seq})".format(
        seq=','.join(['?']*len(id_indices)))
    await execute_query('history',query, id_indices)
    return {"info": "Batch Deleted"}

async def clear_history():
    """清空全部历史记录（软删除，可复用 id_index）"""
    query = "UPDATE history SET is_deleted = 1 WHERE is_deleted = 0"
    await execute_query('history', query)
    return {"info": "Cleared"}
