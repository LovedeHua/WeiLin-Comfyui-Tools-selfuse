# -*- coding: utf-8 -*-
"""
批量 SQL 导入的安全校验。

背景：/prompt/run_sql_text 与 /danbooru/run_sql_text 两个接口会把前端传入的
SQL 数组直接交给 cursor.execute 执行，等价于开放了一个"任意 SQL 执行"入口。
这里做白名单收敛：只允许对指定业务表执行单条 INSERT / REPLACE 语句，
并拒绝分号、注释、DDL、SELECT、ATTACH 等危险写法。
"""
import re

# 业务允许写入的表（小写）
ALLOWED_TABLES = {'tag_groups', 'tag_subgroups', 'tag_tags', 'danbooru_tag'}

# 允许的语句前缀
_STMT_RE = re.compile(
    r'^\s*(INSERT\s+OR\s+REPLACE\s+INTO|INSERT\s+OR\s+IGNORE\s+INTO|INSERT\s+INTO|REPLACE\s+INTO)'
    r'\s+["\'\[`]?([A-Za-z_][A-Za-z0-9_]*)',
    re.IGNORECASE,
)

# 危险关键字 / 写法（语句已去掉结尾分号，故出现分号即为多语句拼接）
_FORBIDDEN_RE = re.compile(
    r'(--|/\*|\*/|;|ATTACH|DETACH|PRAGMA|DROP|ALTER|CREATE|TRIGGER|VIEW|VACUUM'
    r'|SELECT\s|DELETE\s|UPDATE\s|EXEC|BEGIN|COMMIT|ROLLBACK|ATTACH\s)',
    re.IGNORECASE,
)

MAX_STATEMENTS = 10000


def validate_sql_statements(sql_array, allowed_tables=None):
    """
    校验批量 SQL 语句。

    :param sql_array: 前端传入的 SQL 字符串数组
    :param allowed_tables: 允许写入的表名集合（小写），默认 ALLOWED_TABLES
    :return: (True, '') 表示通过；(False, 原因) 表示拒绝
    """
    tables = allowed_tables or ALLOWED_TABLES

    if not isinstance(sql_array, list):
        return False, 'SQL 参数必须是数组'
    if len(sql_array) > MAX_STATEMENTS:
        return False, 'SQL 语句数量超过上限 %d' % MAX_STATEMENTS

    for sql in sql_array:
        if not isinstance(sql, str):
            return False, 'SQL 语句必须是字符串'

        stmt = sql.strip()
        # 允许结尾单个分号，去掉后再检查（防止多语句拼接）
        if stmt.endswith(';'):
            stmt = stmt[:-1].strip()

        if not stmt:
            return False, '存在空语句'

        if _FORBIDDEN_RE.search(stmt):
            return False, '语句包含不允许的关键字或多语句拼接'

        m = _STMT_RE.match(stmt)
        if not m:
            return False, '仅允许 INSERT / REPLACE 语句'

        table = (m.group(2) or '').lower()
        if table not in tables:
            return False, '不允许操作表：%s' % (table or '未知')

    return True, ''
