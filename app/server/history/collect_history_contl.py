import time
from ..dao.dao import execute_query,fetch_all,fetch_one

async def read_collect_history():
    """读取 collect_history 表并返回内容"""
    query = "SELECT id_index, tag, name, color, create_time FROM collect_history WHERE is_deleted = 0 ORDER BY create_time DESC"
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

async def add_collect_history(tag, name="", color=""):
    """添加新的历史记录到 collect_history 表

    去重机制：已存在 tag 完全一致且未删除的收藏时不重复插入，
    返回 existed=True 及已存在条目信息；所有新增入口统一受益。
    """
    dup_query = "SELECT id_index, tag, name, color, create_time FROM collect_history WHERE is_deleted = 0 AND tag = ? LIMIT 1"
    existed_row = await fetch_one('history', dup_query, (tag,))
    if existed_row:
        return {
            "info": "Existed",
            "existed": True,
            "entry": {
                "id_index": existed_row[0],
                "tag": existed_row[1],
                "name": existed_row[2],
                "color": existed_row[3],
                "create_time": existed_row[4]
            }
        }

    create_time = int(time.time())
    
    # 检查是否有可复用的 id_index
    query = "SELECT id_index FROM collect_history WHERE is_deleted = 1 LIMIT 1"
    deleted_id = await fetch_one('history',query)
    
    if deleted_id:
        id_index = deleted_id[0]
        # 更新复用的 id_index
        query = '''
            UPDATE collect_history
            SET tag = ?, name = ?, color = ?, create_time = ?, is_deleted = 0
            WHERE id_index = ?
        '''
        await execute_query('history',query, (tag, name, color, create_time, id_index))
    else:
        query = '''
            INSERT INTO collect_history (tag, name, color, create_time)
            VALUES (?, ?, ?, ?)
        '''
        await execute_query('history',query, (tag, name, color, create_time))

    return {"info": "Append", "existed": False}

async def delete_collect_history(id_index):
    """删除指定 id_index 的历史记录"""
    query = "UPDATE collect_history SET is_deleted = 1 WHERE id_index = ?"
    await execute_query('history',query, (id_index,))
    return {"info": "Deleted"}

async def batch_delete_collect_history(id_indices):
    """批量删除指定 id_index 的历史记录"""
    query = "UPDATE collect_history SET is_deleted = 1 WHERE id_index IN ({seq})".format(
        seq=','.join(['?']*len(id_indices)))
    await execute_query('history',query, id_indices)
    return {"info": "Batch Deleted"}

async def edit_collect_history(id_index, name=None, color=None, tag=None):
    """编辑指定 id_index 的历史记录"""
    query = "SELECT id_index, tag, name, color, create_time FROM collect_history WHERE id_index = ?"
    entry = fetch_one('history',query, (id_index,))
    if not entry:
        return {"info": "Record not found"}

    update_fields = []
    params = []

    if name is not None:
        update_fields.append("name = ?")
        params.append(name)
    if color is not None:
        update_fields.append("color = ?")
        params.append(color)
    if tag is not None:
        update_fields.append("tag = ?")
        params.append(tag)

    if update_fields:
        query = f"UPDATE collect_history SET {', '.join(update_fields)} WHERE id_index = ?"
        params.append(id_index)
        await execute_query('history', query, tuple(params))

    return {"info": "Edited"}