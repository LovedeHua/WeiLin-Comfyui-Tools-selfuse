# -*- coding: utf-8 -*-
"""Dynamic Prompts 语法解析器（自用简化版，零依赖）

支持语法（参考 adieyal/dynamicprompts 与 exectails/comfyui-et_dynamicprompts）：
  {a|b|c}            随机选一个，支持嵌套
  {2$$a|b|c}         随机选 2 个（逗号+空格连接，不重复）
  {1-2$$a|b|c}       随机选 1~2 个
  __name__           读 wildcards/name.txt（一行一个变体，随机选一行），支持子目录
  \\{ \\| \\} \\\\    转义字面字符

说明：
  - 组合模式（输出所有组合）不适用于本插件的节点形态（单文本输出），未实现。
  - wildcard 文件不存在时保留原文并打印一次警告（不刷屏）。
"""

import os
import random
import re

MAX_DEPTH = 20
# 模块位于 app/server/prompt_api/ 下，向上 4 层到插件根
WILDCARD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    'wildcards')

# 转义遮蔽占位符（不会被任何 DP 正则触碰）
_ESC_BACKSLASH = '\x01'
_ESC_LBRACE = '\x02'
_ESC_RBRACE = '\x03'
_ESC_PIPE = '\x04'

# 通配文件不存在的警告只打一次
_wildcard_warned = set()

_INNER_VARIANT_RE = re.compile(r'\{([^{}]*)\}')
_WILDCARD_RE = re.compile(r'__([A-Za-z0-9_\-/\\]+)__')


def _mask_escapes(s):
    return (s.replace('\\\\', _ESC_BACKSLASH)
             .replace('\\{', _ESC_LBRACE)
             .replace('\\}', _ESC_RBRACE)
             .replace('\\|', _ESC_PIPE))


def _unmask_escapes(s):
    return (s.replace(_ESC_LBRACE, '{')
             .replace(_ESC_RBRACE, '}')
             .replace(_ESC_PIPE, '|')
             .replace(_ESC_BACKSLASH, '\\'))


def _load_wildcard_lines(rel_name):
    """读取 wildcards/<name>.txt，返回变体行列表；文件不存在返回 None。"""
    rel = rel_name.replace('\\', '/').strip('/ ')
    if not rel or '..' in rel or ':' in rel:
        return None
    path = os.path.join(WILDCARD_DIR, rel + '.txt')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = [ln.strip() for ln in f.read().splitlines()]
        return [ln for ln in lines if ln and not ln.startswith('#')]
    except OSError:
        return None


def _load_wildcard(match, depth):
    name = match.group(1)
    lines = _load_wildcard_lines(name)
    if not lines:
        if name not in _wildcard_warned:
            _wildcard_warned.add(name)
            print("[WeiLin] Dynamic Prompts: wildcard 文件不存在，保留原文: __%s__ "
                  "(预期路径: %s)" % (name, os.path.join(WILDCARD_DIR, name + '.txt')))
        return match.group(0)
    chosen = random.choice(lines)
    return expand_dynamic_prompts(chosen, depth + 1)


def _split_options(body):
    """按未转义的 | 分割选项。"""
    parts = body.split('|')
    return [p.strip() for p in parts]


def _expand_variant(inner, depth):
    """展开最内层 { ... } 的内容（inner 不含花括号）。"""
    lo, hi = 1, 1
    body = inner
    m = re.match(r'^\s*(\d+)\s*-\s*(\d+)\s*\$\$(.*)$', inner, re.S)
    if m:
        lo, hi, body = int(m.group(1)), int(m.group(2)), m.group(3)
    else:
        m = re.match(r'^\s*(\d+)\s*\$\$(.*)$', inner, re.S)
        if m:
            lo, body = int(m.group(1)), m.group(2)
            hi = lo

    options = _split_options(body)
    options = [o for o in options if o != '']
    if not options:
        return ''

    n = random.randint(max(1, lo), max(1, hi))
    n = max(1, min(n, len(options)))
    if n >= len(options):
        chosen = options
    else:
        chosen = random.sample(options, n)
    text = ', '.join(chosen)
    return expand_dynamic_prompts(text, depth + 1)


def has_dynamic_syntax(text):
    """静态检测文本是否含 DP 语法（不含随机操作），用于 IS_CHANGED 缓存判定。"""
    if not text:
        return False
    masked = _mask_escapes(text)
    # 变体：{ 后（到内层结束）出现 |；排除含引号的 JSON 串形态（{"prompt":"a|b"...}）
    if re.search(r'\{[^{}"]*\|', masked):
        return True
    for m in _WILDCARD_RE.finditer(masked):
        if _load_wildcard_lines(m.group(1)) is not None:
            return True
    return False


def expand_dynamic_prompts(text, depth=0):
    """展开文本中的 DP 语法。无语法时原样返回（开销可忽略）。"""
    if not text or depth > MAX_DEPTH:
        return text
    s = _mask_escapes(text)

    # 1. wildcard 引用（内容可能引入新的 {}，交给下面的循环继续展开）
    if _WILDCARD_RE.search(s):
        s = _WILDCARD_RE.sub(lambda m: _load_wildcard(m, depth), s)

    # 2. 反复展开最内层 variant，直到不再变化（嵌套由此实现）
    prev = None
    while prev != s:
        prev = s
        s = _INNER_VARIANT_RE.sub(lambda m: _expand_variant(m.group(1), depth), s)

    return _unmask_escapes(s)
