/**
 * 跟随 ComfyUI 主题 / 调色板。
 *
 * ── 关键结论（读 comfyui_frontend_package 1.51.10 源码 + main-*.css 实测）──
 *
 * ComfyUI 存在**两代**主题变量，同时挂载，优先级不同：
 *
 * 【新代·语义变量】定义在 main-*.css 的 :root{} 与 .dark-theme{} 两处，
 *   两处都有值，所以会真正随深浅切换；彩色调色板也会覆盖它们。
 *   --base-background / --secondary-background / --tertiary-background
 *   --text-primary / --text-secondary / --muted-foreground
 *   --primary-background / --primary-background-hover      ← 强调色
 *   --destructive-background / --success-background / --warning-background
 *   --border-default / --border-subtle / --input-surface
 *   --interface-panel-surface / --interface-stroke
 *
 * 【⚠️⚠️ 面板底色的正确来源（第 62 轮定案，前两轮都判断错了）】
 *   ComfyUI 的**菜单 / 对话框 / 右键菜单 / 模态框**统一用 --comfy-menu-bg：
 *     .comfy-menu            {background-color:var(--comfy-menu-bg)}
 *     .litegraph .dialog     {background-color:var(--comfy-menu-bg)}
 *     .litegraph.litecontextmenu {background-color:var(--comfy-menu-bg)}
 *     .comfy-modal           {background-color:var(--comfy-menu-bg)}
 *     --palette-interface-panel-surface: var(--comfy-menu-bg)
 *   该变量由 loadComfyColorPalette 写到 <html> 行内 style，**跟随一切调色板**：
 *     dark 表 comfy-menu-bg=#171718 · Nord=#242730 · Solarized=#073642 · light=#FFFFFF
 *
 *   对比：--secondary-background / --tertiary-background / --base-background
 *   都是 :root + .dark-theme 里的**固定** charcoal/smoke 色，调色板不改它们。
 *   → 拿它们当窗口底，无论选哪个都会和原生菜单不同色，表现为"没跟随"。
 *
 *   结论：窗口/面板底首选 --comfy-menu-bg；标题栏等次级面用 --comfy-menu-secondary-bg；
 *   --secondary-background 系列只作兜底。
 *
 * 【调色板写入路径】settingStore-*.js
 *   loadComfyColorPalette(colors.comfy_base) → 逐项 setProperty('--'+key, value)
 *     写到 documentElement 的**行内 style** 上（含 --bg-color/--comfy-menu-bg 等键）。
 *   loadLitegraphForVueNodes(colors.litegraph_base, paletteId)
 *     当 paletteId 为内置 'dark'/'light' 时 removeProperty 那批键，否则写入。
 *   GraphView-*.js: watch(completedActivePalette, p => {
 *     p.light_theme ? documentElement.classList.remove('dark-theme')
 *                   : documentElement.classList.add('dark-theme') })
 *     注意：只要 .light-theme 类——它并不存在，明暗只靠 .dark-theme 的有无。
 *
 * 【所以插件的正确做法】
 *   1. 明暗 = <html> 是否有 .dark-theme（官方唯一开关）
 *   2. 颜色 = 把 ComfyUI 的 CSS 变量映射到插件 --weilin-* 变量
 *      → 面板/菜单类优先 --comfy-menu-bg / --comfy-menu-secondary-bg（调色板写入）
 *      → 语义色（文字/边框/强调）用新代语义变量
 *      → 其余旧代变量兜底
 *
 * CSS 自定义属性沿 DOM 继承，插件容器挂在 <body> 下，
 * 因此 getComputedStyle(container) 能直接取到当前生效值。
 *
 * 注：早期"读 documentElement 行内 style"的做法是错的 —— 变量定义在
 * :root / .dark-theme 规则里，不在行内 style 上，读出来只会是 :root 默认值。
 */

// 插件变量 -> ComfyUI 变量候选列表（取第一个有值的）
// ⚠️ 顺序即优先级：新代语义变量在前，旧代菜单变量在后兜底
const VAR_MAP = {
  // ── 背景 ──────────────────────────────────────────────
  // ⚠️⚠️ 面板/窗口底色必须首选 --comfy-menu-bg（第 62 轮定案）。
  //
  // 为什么不是 --secondary-background？
  //   实测 main-*.css：ComfyUI 自己的**菜单 / 对话框 / 右键菜单**统一用 --comfy-menu-bg——
  //     .comfy-menu{background-color:var(--comfy-menu-bg)}
  //     .litegraph .dialog{background-color:var(--comfy-menu-bg)}
  //     .litegraph.litecontextmenu{background-color:var(--comfy-menu-bg)}
  //     .comfy-modal{background-color:var(--comfy-menu-bg)}
  //     --palette-interface-panel-surface: var(--comfy-menu-bg)
  //   而 --comfy-menu-bg 由调色板经 loadComfyColorPalette 写到 <html> 行内 style，
  //   **跟随任何主题/自定义调色板**（内置 dark 表里它是 #171718，Nord 是 #242730，
  //   Solarized 是 #073642，亮色是 #FFFFFF）。
  //   --secondary-background 则是 :root/.dark-theme 里的**固定** charcoal/smoke 值
  //   （暗 #262729），任何调色板都不改它。拿它当窗口底 → 与原生菜单明显不同色，
  //   看起来就是"没跟随"。这是第 60→61 轮两次误判的最终根因。
  //
  // 层级（按"离用户视觉焦点由近及远"）：
  //   --comfy-menu-bg        面板/菜单/弹窗（首选）
  //   --comfy-menu-secondary-bg  次级面板（标题栏、分组）
  //   --bg-color             画布/页面底（仅兜底）
  '--weilin-prompt-ui-primary-bg': [
    '--comfy-menu-bg',
    '--palette-interface-panel-surface',
    '--secondary-background',
    '--bg-color'
  ],
  // 次级面板/卡片底（标题栏、分组头）：调色板提供的次级面板色优先
  '--weilin-prompt-ui-secondary-bg': [
    '--comfy-menu-secondary-bg',
    '--tertiary-background',
    '--secondary-background-hover',
    '--content-bg'
  ],
  // 输入框底：沿用 ComfyUI 自己的输入控件色（调色板写入 --comfy-input-bg）
  '--weilin-prompt-ui-input-bg': [
    '--comfy-input-bg',
    '--input-surface',
    '--component-node-widget-background',
    '--base-background'
  ],
  // 按钮底：与面板同源，用调色板面板色，避免撞色
  '--weilin-prompt-ui-button-bg': [
    '--comfy-menu-secondary-bg',
    '--comfy-menu-bg',
    '--tertiary-background',
    '--secondary-background'
  ],
  '--weilin-prompt-ui-button-hover': [
    '--palette-interface-button-hover-surface',
    '--tertiary-background-hover',
    '--secondary-background-hover',
    '--content-hover-bg'
  ],
  // 标题栏 / 头部
  '--weilin-prompt-ui-header-bg': [
    '--comfy-menu-secondary-bg',
    '--palette-interface-panel-hover-surface',
    '--tertiary-background',
    '--interface-menu-surface'
  ],
  '--weilin-prompt-ui-tag-bg': [
    '--comfy-menu-secondary-bg',
    '--palette-interface-panel-hover-surface',
    '--tertiary-background',
    '--secondary-background'
  ],
  '--weilin-prompt-ui-token-bg': [
    '--comfy-menu-secondary-bg',
    '--palette-interface-panel-hover-surface',
    '--tertiary-background',
    '--content-bg'
  ],
  '--weilin-prompt-ui-card-bg': [
    '--comfy-menu-secondary-bg',
    '--palette-interface-panel-hover-surface',
    '--tertiary-background',
    '--interface-panel-surface'
  ],

  // ── 文字 ──────────────────────────────────────────────
  // ComfyUI 菜单文字用 --fg-color（调色板写入）与 --descrip-text，语义变量兜底
  '--weilin-prompt-ui-primary-text': ['--fg-color', '--text-primary', '--base-foreground', '--input-text'],
  '--weilin-prompt-ui-secondary-text': ['--descrip-text', '--text-secondary', '--muted-foreground'],
  '--weilin-prompt-ui-input-text': ['--input-text', '--fg-color', '--text-primary', '--base-foreground'],
  '--weilin-prompt-ui-title-color': ['--fg-color', '--text-primary', '--base-foreground'],
  '--weilin-prompt-ui-label-color': ['--fg-color', '--text-primary', '--base-foreground'],
  '--weilin-prompt-ui-tag-text': ['--fg-color', '--text-primary', '--base-foreground'],
  '--weilin-prompt-ui-button-text': ['--fg-color', '--base-foreground', '--text-primary'],
  '--weilin-prompt-ui-icon-color': ['--descrip-text', '--text-secondary', '--muted-foreground'],

  // ── 边框 / 分隔 ───────────────────────────────────────
  // ComfyUI 菜单边框用 --border-color（调色板写入）
  '--weilin-prompt-ui-border-color': ['--border-color', '--border-default', '--interface-stroke'],
  '--weilin-prompt-ui-input-border': ['--border-color', '--border-subtle', '--border-default'],

  // ── 强调色 ────────────────────────────────────────────
  // 注意：不能用 --primary-bg（死变量，恒 #236692）
  '--weilin-prompt-ui-primary-color': ['--primary-background', '--color-azure-400', '--primary-bg'],
  '--weilin-prompt-ui-primary-color-hover': [
    '--primary-background-hover',
    '--primary-background',
    '--color-azure-600',
    '--primary-hover-bg'
  ],
  '--weilin-prompt-ui-btn-bg': ['--primary-background', '--color-azure-400', '--primary-bg'],
  '--weilin-prompt-ui-btn-bg-hover': [
    '--primary-background-hover',
    '--primary-background',
    '--color-azure-600'
  ],
  // 按钮文字：在强调色底上取反色，用 --base-foreground 更稳
  '--weilin-prompt-ui-btn-text': ['--primary-hover-fg', '--primary-fg', '#fff'],
  '--weilin-prompt-ui-btn-gradient': ['--primary-background', '--color-azure-400'],
  '--weilin-prompt-ui-btn-gradient-hover': [
    '--primary-background-hover',
    '--primary-background',
    '--color-azure-600'
  ],
  '--weilin-prompt-ui-btn-gradient-text': ['--primary-hover-fg', '--primary-fg', '#fff'],
  '--weilin-prompt-ui-input-focus': ['--primary-background', '--color-azure-400'],

  // ── 危险 / 错误 ───────────────────────────────────────
  '--weilin-prompt-ui-danger-color': [
    '--destructive-background',
    '--color-coral-500',
    '--error-text',
    '#ff4d4f'
  ],

  // ── 颜色选择器 ────────────────────────────────────────
  '--weilin-prompt-ui-color-picker-bg': [
    '--comfy-menu-bg',
    '--comfy-menu-secondary-bg',
    '--secondary-background'
  ],
  '--weilin-prompt-ui-color-picker-border': ['--border-default', '--interface-stroke', '--border-color'],

  // ── 历史别名变量 ──────────────────────────────────────
  // 这些名字在组件里被大量引用，但 theme.css 原先从未定义（一直走 fallback）。
  // 此处直接映射到 ComfyUI 变量，保证跟随态下也是真实主题色。
  '--weilin-prompt-ui-primary': ['--primary-background', '--color-azure-400'],
  '--weilin-prompt-ui-primary-hover': ['--primary-background-hover', '--primary-background'],
  '--weilin-prompt-ui-background': ['--comfy-menu-bg', '--palette-interface-panel-surface', '--secondary-background'],
  '--weilin-prompt-ui-background-secondary': ['--comfy-menu-secondary-bg', '--secondary-background', '--tertiary-background'],
  '--weilin-prompt-ui-input-background': ['--comfy-input-bg', '--component-node-widget-background', '--secondary-background'],
  '--weilin-prompt-ui-border': ['--border-color', '--border-default', '--interface-stroke'],
  '--weilin-prompt-ui-card-border': ['--border-color', '--border-default', '--interface-stroke'],
  '--weilin-prompt-ui-label': ['--fg-color', '--text-primary', '--base-foreground'],
  '--weilin-prompt-ui-secondary-color': ['--descrip-text', '--text-secondary', '--muted-foreground'],
  '--weilin-prompt-ui-secondary-color-hover': ['--fg-color', '--text-primary', '--base-foreground'],
  '--weilin-prompt-ui-disabled-bg': ['--comfy-menu-secondary-bg', '--secondary-background'],
  '--weilin-prompt-ui-disabled-text': ['--muted-foreground', '--text-secondary', '--descrip-text'],
  '--weilin-prompt-ui-disabled-color': ['--muted-foreground', '--text-secondary', '--descrip-text'],
  '--weilin-prompt-ui-cancel-color': ['--text-secondary', '--muted-foreground'],
  '--weilin-prompt-ui-tag-bg-hover': ['--palette-interface-panel-hover-surface', '--tertiary-background-hover', '--content-hover-bg'],
  '--weilin-prompt-ui-success-color': ['--success-background', '--color-jade-600', '#52c41a'],
  '--weilin-prompt-ui-warning-color': ['--warning-background', '--color-gold-600', '#faad14'],
  '--weilin-prompt-ui-warning-color-hover': [
    '--warning-background-hover',
    '--warning-background',
    '--color-gold-500'
  ],
  '--weilin-prompt-ui-danger-color-hover': [
    '--destructive-background-hover',
    '--destructive-background',
    '--color-coral-600'
  ],

  // ── 设置面板的渐变底色 ────────────────────────────────
  // 原为固定渐变（亮:蓝白 / 暗:深紫），与彩色调色板不协调；
  // 改为映射到普通主题色，look 更统一。
  '--weilin-prompt-ui-gradient-bg': ['--comfy-menu-bg', '--palette-interface-panel-surface', '--secondary-background'],
  '--weilin-prompt-ui-gradient-primary': ['--primary-background', '--color-azure-400']
}

// 由明暗派生的变量（ComfyUI 未提供对应语义）
const DERIVED_VARS = [
  '--weilin-prompt-ui-hover-bg-color',
  '--weilin-prompt-ui-shadow-color',
  '--weilin-prompt-ui-scrollbar-track',
  '--weilin-prompt-ui-scrollbar-thumb',
  '--weilin-prompt-ui-scrollbar-thumb-hover',
  '--weilin-prompt-ui-tag-hover',
  // 由强调色派生的半透明/裸 RGB 形式
  '--weilin-prompt-ui-primary-color-fade',
  '--weilin-prompt-ui-primary-color-10',
  '--weilin-prompt-ui-primary-color-rgb',
  '--weilin-prompt-ui-danger-color-10',
  '--weilin-prompt-ui-danger-color-fade'
]

/** 颜色 -> 亮度（#rgb / #rrggbb / rgb() / rgba()），失败返回 null */
function luminance(color) {
  if (!color || typeof color !== 'string') return null
  const s = color.trim()
  let m = s.match(/^#([0-9a-f]{3})$/i)
  if (m) {
    const [r, g, b] = m[1].split('').map(c => parseInt(c + c, 16))
    return (r * 299 + g * 587 + b * 114) / 1000
  }
  m = s.match(/^#([0-9a-f]{6})$/i)
  if (m) {
    const h = m[1]
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000
  }
  m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (m) {
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
    return (r * 299 + g * 587 + b * 114) / 1000
  }
  return null
}

/**
 * 颜色 -> { r, g, b }。支持 #rgb / #rrggbb / rgb() / rgba()。
 * 用于生成 --*-rgb（裸 "R, G, B"）与半透明变体。失败返回 null。
 */
function toRgb(color) {
  if (!color || typeof color !== 'string') return null
  const s = color.trim()
  let m = s.match(/^#([0-9a-f]{3})$/i)
  if (m) {
    const [r, g, b] = m[1].split('').map(c => parseInt(c + c, 16))
    return { r, g, b }
  }
  m = s.match(/^#([0-9a-f]{6})$/i)
  if (m) {
    const h = m[1]
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    }
  }
  m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
  return null
}

/** 取元素上生效的 CSS 变量值（行内 style 优先，再退回计算样式） */
function readVar(el, name) {
  if (!el || !name) return ''
  try {
    const inline = el.style?.getPropertyValue?.(name)
    if (inline && inline.trim()) return inline.trim()
  } catch (e) {
    // 忽略
  }
  try {
    const v = getComputedStyle(el).getPropertyValue(name)
    return v ? v.trim() : ''
  } catch (e) {
    return ''
  }
}

/** 按候选列表解析出颜色（第一个有值的胜出；字面量直接返回） */
function resolveCandidates(el, candidates) {
  for (const c of candidates) {
    if (c.startsWith('--')) {
      const v = readVar(el, c)
      if (v) return v
    } else if (c) {
      return c
    }
  }
  return ''
}

/**
 * 判定 ComfyUI 当前是否为暗色。
 * 官方唯一开关是 <html> 上的 .dark-theme 类，其余为兜底。
 */
export function detectDark() {
  try {
    if (typeof document === 'undefined') return true
    const root = document.documentElement

    if (root) {
      // 1) 官方开关
      let cls = ''
      try {
        if (root.classList) {
          if (root.classList.contains('dark-theme')) return true
          cls = Array.from(root.classList).join(' ')
        }
      } catch (e) {
        // 忽略
      }
      if (!cls) cls = (root.className || '').toString()
      cls = cls.toLowerCase()

      if (/\bdark(-theme)?\b/.test(cls)) return true
      if (/\blight(-theme)?\b/.test(cls)) return false

      // 2) --bg-color 亮度兜底
      const bg = readVar(root, '--bg-color') || readVar(document.body, '--bg-color')
      if (bg) {
        const lum = luminance(bg)
        if (lum !== null) return lum < 128
      }
    }

    // 3) body 类名兜底
    const bc = (document.body?.className || '').toString().toLowerCase()
    if (/\bdark(-theme)?\b/.test(bc)) return true
    if (/\blight(-theme)?\b/.test(bc)) return false
  } catch (e) {
    // 忽略
  }
  return true
}

/**
 * 把 ComfyUI 生效中的 CSS 变量映射到插件容器的 --weilin-* 变量上。
 * 容器内联变量优先级高于 theme.css 的 data-theme 规则，能覆盖插件预设。
 *
 * @param {HTMLElement} container 插件根容器
 * @param {boolean} dark 当前明暗（用于派生 hover / shadow）
 * @returns {number} 实际映射成功的变量个数
 */
export function applyComfyPalette(container, dark) {
  if (!container) return 0
  let ok = 0
  let _diag = null
  try {
    for (const [target, candidates] of Object.entries(VAR_MAP)) {
      const val = resolveCandidates(container, candidates)
      if (val) {
        container.style.setProperty(target, val)
        ok++
      } else {
        container.style.removeProperty(target)
      }
    }

    // 派生色（ComfyUI 没有对应语义变量，按明暗推导）
    container.style.setProperty(
      '--weilin-prompt-ui-hover-bg-color',
      dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
    )
    container.style.setProperty(
      '--weilin-prompt-ui-shadow-color',
      dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.12)'
    )

    // 滚动条 / 标签 hover 也取自真实主题变量（调色板优先）
    const border = resolveCandidates(container, ['--border-color', '--border-default', '--border-subtle'])
    const secondary = resolveCandidates(container, [
      '--comfy-menu-secondary-bg',
      '--palette-interface-panel-hover-surface',
      '--tertiary-background',
      '--content-bg'
    ])
    const descrip = resolveCandidates(container, [
      '--descrip-text',
      '--muted-foreground',
      '--text-secondary'
    ])
    const primary = resolveCandidates(container, ['--primary-background', '--color-azure-400'])

    if (secondary) container.style.setProperty('--weilin-prompt-ui-scrollbar-track', secondary)
    if (border) container.style.setProperty('--weilin-prompt-ui-scrollbar-thumb', border)
    if (descrip) container.style.setProperty('--weilin-prompt-ui-scrollbar-thumb-hover', descrip)
    if (primary) container.style.setProperty('--weilin-prompt-ui-tag-hover', primary)

    // ── 诊断快照（供 window.weilinThemeDiag() 与 weilinPaletteProbe 读取）──
    try {
      const r = document.documentElement
      _diag = {
        dark: !!dark,
        mapped: ok,
        primary,
        border,
        secondary,
        descrip,
        // 背景链路的原始解析结果（无 DOM 环境无法求 var() 链，仅记录候选命中）
        bgResolved: readVar(container, '--weilin-prompt-ui-primary-bg'),
        bgRootVar: r ? readVar(r, '--base-background') : ''
      }
    } catch (e) {
      _diag = null
    }

    // 强调色的半透明 / 裸 RGB 变体
    // -fade / -10 用于 box-shadow 描边；-rgb 配合 rgba(var(--x-rgb), a) 使用
    const pRgb = toRgb(primary)
    if (pRgb) {
      const { r, g, b } = pRgb
      container.style.setProperty('--weilin-prompt-ui-primary-color-rgb', `${r}, ${g}, ${b}`)
      const fadeA = dark ? 0.28 : 0.22
      const tenA = dark ? 0.14 : 0.1
      container.style.setProperty(
        '--weilin-prompt-ui-primary-color-fade',
        `rgba(${r}, ${g}, ${b}, ${fadeA})`
      )
      container.style.setProperty(
        '--weilin-prompt-ui-primary-color-10',
        `rgba(${r}, ${g}, ${b}, ${tenA})`
      )
    }
    // 危险色的 10% 变体
    const dangerColor = resolveCandidates(container, [
      '--destructive-background',
      '--color-coral-500',
      '--error-text'
    ])
    const dRgb = toRgb(dangerColor)
    if (dRgb) {
      container.style.setProperty(
        '--weilin-prompt-ui-danger-color-10',
        `rgba(${dRgb.r}, ${dRgb.g}, ${dRgb.b}, 0.1)`
      )
      container.style.setProperty(
        '--weilin-prompt-ui-danger-color-fade',
        `rgba(${dRgb.r}, ${dRgb.g}, ${dRgb.b}, 0.4)`
      )
    }

    if (_diag) {
      _diag.danger = dangerColor
      try {
        window.__weilinPaletteSnapshot = _diag
      } catch (e) {
        // 忽略
      }
    }

    return ok
  } catch (e) {
    return ok
  }
}

/** 清掉容器上的覆盖，回到 theme.css 的 data-theme 预设 */
export function clearComfyPalette(container) {
  if (!container) return
  const names = Object.keys(VAR_MAP).concat(DERIVED_VARS)
  for (const n of names) {
    try {
      container.style.removeProperty(n)
    } catch (e) {
      // 忽略
    }
  }
}

/**
 * 监听 ComfyUI 主题 / 调色板变化。
 *
 * 触发源：
 *   1. <html> 的 class 变化 -> dark/light 切换（官方就是切 .dark-theme）
 *   2. <html> 的行内 style 变化 -> 调色板写入 --* 变量
 *   3. 轮询兜底
 *
 * 签名取的两组变量：
 *   - 新代语义变量（--base-background 等）：深浅切换与彩色调色板都会改
 *   - 旧代变量（--bg-color 等）：彩色调色板直接写行内 style 时改
 * 两组都纳入，任一变化即可感知。
 *
 * onChange(dark) 在检测到变化时调用。返回取消监听的函数。
 */
export function watchComfyTheme(onChange) {
  if (typeof document === 'undefined') return () => {}

  // 参与签名的变量（调色板写入的 comfy-menu-* 最关键，放最前）
  const SIGNATURE_VARS = [
    '--comfy-menu-bg',
    '--comfy-menu-secondary-bg',
    '--bg-color',
    '--base-background',
    '--secondary-background',
    '--text-primary',
    '--text-secondary',
    '--primary-background',
    '--border-color',
    '--border-default',
    '--fg-color',
    '--input-text'
  ]

  const signature = () => {
    const root = document.documentElement
    if (!root) return ''
    const cls = (root.className || '').toString()
    let vals = ''
    try {
      const cs = getComputedStyle(root)
      vals = SIGNATURE_VARS.map(n => cs.getPropertyValue(n) || '').join('|')
    } catch (e) {
      vals = ''
    }
    // 行内 style 也要纳入：调色板把颜色写在 html 行内，class 可能不变
    let inline = ''
    try {
      inline = SIGNATURE_VARS.map(n => root.style?.getPropertyValue?.(n) || '').join('|')
    } catch (e) {
      inline = ''
    }
    return cls + '::' + vals + '::' + inline
  }

  // 轮询兜底：调色板切换可能只改 CSS 变量而不动 class/style
  // 注意：ComfyUI 的 .dark-theme 类有时比调色板变量晚一拍写入，
  // 若只在签名变化时回调，可能出现"变量已换、类还没换"的中间态被漏掉，
  // 因此这里额外比对 detectDark() 的结果，明暗翻转也视为一次变化。
  let lastDark = detectDark()

  let last = signature()
  const emit = () => {
    const now = signature()
    const nowDark = detectDark()
    if (now === last && nowDark === lastDark) return
    last = now
    lastDark = nowDark
    onChange(nowDark)
  }

  let observer = null
  try {
    observer = new MutationObserver(emit)
    const root = document.documentElement
    if (root) {
      observer.observe(root, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme']
      })
    }
    if (document.body && document.body !== root) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] })
    }
  } catch (e) {
    // 忽略
  }

  // 轮询兜底：调色板切换可能只改 CSS 变量而不动 class/style
  const timer = setInterval(emit, 400)

  return () => {
    try {
      observer?.disconnect()
    } catch (e) {
      // 忽略
    }
    clearInterval(timer)
  }
}

export default { detectDark, watchComfyTheme, applyComfyPalette, clearComfyPalette }
