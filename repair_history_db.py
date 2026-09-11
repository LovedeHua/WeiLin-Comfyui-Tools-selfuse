"""SQLite 历史数据库修复脚本 - 将损坏的 history 数据库中可读数据迁移到新数据库
用法:
    python repair_history_db.py
"""
import os
import shutil
import sqlite3
import datetime
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_DATA_DIR = os.path.join(BASE_DIR, 'user_data')
LANG = 'zh_CN'

HISTORY_DB = os.path.join(USER_DATA_DIR, f'userdatas_{LANG}_history.db')
HISTORY_DB_SHM = HISTORY_DB + '-shm'
HISTORY_DB_WAL = HISTORY_DB + '-wal'


def check_integrity(db_path):
    """检查数据库完整性，返回 (ok, 结果列表)"""
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute('PRAGMA integrity_check')
        rows = cur.fetchall()
        conn.close()
        results = [r[0] for r in rows]
        ok = (len(results) == 1 and results[0].lower() == 'ok')
        return ok, results
    except Exception as e:
        return False, [f'连接异常: {e}']


def salvage_table(old_cursor, table_name):
    """按表读取损坏数据库中的数据，尽可能保留可读行"""
    print(f'  -> 尝试读取表 {table_name} ...', end=' ')
    try:
        old_cursor.execute(f'SELECT * FROM {table_name}')
        columns = [desc[0] for desc in old_cursor.description]
        rows = []
        # 逐行读取，遇到损坏页时可能抛异常
        while True:
            try:
                row = old_cursor.fetchone()
            except sqlite3.DatabaseError as e:
                print(f'\n     !! 读取行时遇到错误: {e}，尝试跳过损坏页...')
                # 跳过损坏页的尝试：直接 break 放弃剩余行
                break
            if row is None:
                break
            rows.append(row)
        print(f'成功读出 {len(rows)} 行 (列: {columns})')
        return columns, rows
    except sqlite3.DatabaseError as e:
        print(f'失败 (DatabaseError: {e})，该表将跳过')
        return [], []
    except Exception as e:
        print(f'失败 ({type(e).__name__}: {e})，该表将跳过')
        return [], []


def create_clean_schema(new_cursor):
    """在新数据库中创建干净的表结构（与 dao.py 中 create_tables() 一致）"""
    new_cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id_index INTEGER PRIMARY KEY AUTOINCREMENT,
            tag TEXT,
            name TEXT,
            color TEXT,
            create_time INTEGER,
            is_deleted INTEGER DEFAULT 0
        )
    ''')
    new_cursor.execute('''
        CREATE TABLE IF NOT EXISTS collect_history (
            id_index INTEGER PRIMARY KEY AUTOINCREMENT,
            tag TEXT,
            name TEXT,
            color TEXT,
            create_time INTEGER,
            is_deleted INTEGER DEFAULT 0
        )
    ''')
    new_cursor.execute('''
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY
        )
    ''')


def insert_rows(new_cursor, table_name, columns, rows):
    if not rows or not columns:
        return
    col_list = ', '.join(columns)
    placeholders = ', '.join(['?'] * len(columns))
    # 忽略重复（以 id_index 作为主键冲突处理）
    insert_sql = f'INSERT OR IGNORE INTO {table_name} ({col_list}) VALUES ({placeholders})'
    try:
        new_cursor.executemany(insert_sql, rows)
    except Exception as e:
        # 如果批量插入失败，回退到逐行（能救一行算一行）
        print(f'     !! 批量插入失败，回退到逐行: {e}')
        saved = 0
        for row in rows:
            try:
                new_cursor.execute(insert_sql, row)
                saved += 1
            except Exception as e2:
                print(f'        跳过行: {e2}')
        print(f'        逐行保存 {saved}/{len(rows)} 行')


def main():
    print('=' * 60)
    print('WeiLin-Comfyui-Tools history 数据库修复工具')
    print('=' * 60)

    if not os.path.exists(HISTORY_DB):
        print(f'错误: 未找到数据库文件 {HISTORY_DB}')
        sys.exit(1)

    print(f'\n[1/5] 检查数据库完整性...')
    ok, results = check_integrity(HISTORY_DB)
    if ok:
        print('   ✓ 数据库结构完整，无需修复。')
    else:
        print('   ✗ 检测到损坏。前 10 条完整性检查输出:')
        for r in results[:10]:
            print(f'      - {r[:120]}')
        if len(results) > 10:
            print(f'      ... 还有 {len(results) - 10} 条')

    # 备份原始文件（无论是否损坏）
    print(f'\n[2/5] 备份原始数据库...')
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = HISTORY_DB + f'.backup_{timestamp}'
    shutil.copy2(HISTORY_DB, backup_path)
    print(f'   ✓ 已备份到 {os.path.basename(backup_path)}')

    # 清理 WAL / SHM 临时文件
    for f in (HISTORY_DB_SHM, HISTORY_DB_WAL):
        if os.path.exists(f):
            try:
                os.remove(f)
                print(f'   ✓ 已删除临时文件 {os.path.basename(f)}')
            except Exception as e:
                print(f'   ! 删除 {os.path.basename(f)} 失败: {e}')

    # 只读方式打开损坏数据库，尽力读取
    print(f'\n[3/5] 读取损坏数据库中的可读数据...')
    new_db_path = HISTORY_DB + '.new'
    if os.path.exists(new_db_path):
        os.remove(new_db_path)

    # 只读打开损坏库，避免写入让情况更糟
    old_uri = f'file:{HISTORY_DB}?mode=ro'
    old_conn = sqlite3.connect(old_uri, uri=True)
    old_cursor = old_conn.cursor()

    # 获取表清单
    old_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in old_cursor.fetchall()]
    print(f'   找到表: {tables}')

    # 新数据库
    new_conn = sqlite3.connect(new_db_path)
    new_cursor = new_conn.cursor()
    create_clean_schema(new_cursor)

    # 迁移每个表
    for table in ['history', 'collect_history']:
        if table in tables:
            columns, rows = salvage_table(old_cursor, table)
            insert_rows(new_cursor, table, columns, rows)
        else:
            print(f'  -> 表 {table} 在旧库中不存在，跳过')

    # 更新 schema_version
    try:
        new_cursor.execute('INSERT OR REPLACE INTO schema_version (version) VALUES (1)')
    except Exception:
        pass

    new_conn.commit()
    new_conn.close()
    old_conn.close()

    new_size = os.path.getsize(new_db_path)
    print(f'   ✓ 新数据库大小: {new_size} bytes')

    # 验证新库
    print(f'\n[4/5] 验证新数据库完整性...')
    new_ok, new_results = check_integrity(new_db_path)
    if new_ok:
        print('   ✓ 新数据库结构完整 OK')
    else:
        print('   ⚠ 新库仍有问题，建议排查后再替换')
        for r in new_results[:5]:
            print(f'      - {r[:120]}')

    # 显示新库表内容统计
    verify_conn = sqlite3.connect(new_db_path)
    vcur = verify_conn.cursor()
    for t in ['history', 'collect_history']:
        try:
            vcur.execute(f'SELECT COUNT(*) FROM {t}')
            print(f'   {t} 记录数: {vcur.fetchone()[0]}')
        except Exception as e:
            print(f'   {t} 统计失败: {e}')
    verify_conn.close()

    # 替换
    print(f'\n[5/5] 替换数据库文件...')
    try:
        os.remove(HISTORY_DB)
        shutil.move(new_db_path, HISTORY_DB)
        print(f'   ✓ 已替换 {os.path.basename(HISTORY_DB)}')
    except Exception as e:
        print(f'   ✗ 替换失败: {e}')
        print(f'   你可以手动把 {os.path.basename(new_db_path)} 重命名为 {os.path.basename(HISTORY_DB)}')

    print('\n' + '=' * 60)
    print('修复完成！可以重启 ComfyUI 验证插件是否正常。')
    print('原始损坏库备份: ', os.path.basename(backup_path))
    print('=' * 60)


if __name__ == '__main__':
    main()
