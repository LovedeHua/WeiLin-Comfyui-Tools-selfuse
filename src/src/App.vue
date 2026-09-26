<template>
  <div id="weilin_comfyui_tools_prompt_ui_container_main">
    <!-- 提示词窗口 -->
    <DraggableWindow name="promptBox" v-if="windows.prompt.visible"
      :title="promptManager === 'prompt' ? t('promptBox.windowTitle') : t('promptBox.windowTitleGlobal')"
      :position="windows.prompt.position" :size="windows.prompt.size" :z-index="windowManager.getZIndex('promptBox')"
      @update:position="updatePosition('prompt', $event)" @update:size="updateSize('prompt', $event)"
 @close="closeWindow('prompt')">
      <PromptBox :promptManager="promptManager" :hasPromptLoraStack="hasPromptLoraStack"
        :autoFitOnOpen="!promptSizeUserSized" ref="promptBoxRef"
        @request-window-size="onPromptRequestWindowSize" />
    </DraggableWindow>

    <!-- Tag管理窗口 -->
    <DraggableWindow name="tagManager" v-if="windows.tag.visible" :title="t('tagManager.windowTitle')"
      :position="windows.tag.position" :size="windows.tag.size" :z-index="windowManager.getZIndex('tagManager')"
      @update:position="updatePosition('tag', $event)" @update:size="updateSize('tag', $event)"
 @close="closeWindow('tag')">
      <TagManager :tagManager="tagManager" />
    </DraggableWindow>

    <!-- Lora管理窗口 -->
    <DraggableWindow name="loraManager" v-if="windows.lora.visible" :title="t('loraManager.windowTitle')"
      :position="windows.lora.position" :size="windows.lora.size" :z-index="windowManager.getZIndex('loraManager')"
      @update:position="updatePosition('lora', $event)" @update:size="updateSize('lora', $event)"
 @close="closeWindow('lora')">
      <LoraManager :loraManager="loraManager" ref="loraManagerRef" />
    </DraggableWindow>

    <!-- 历史记录窗口  -->
    <DraggableWindow name="historyManager" v-if="windows.history.visible" :title="t('history.windowTitle')"
      :position="windows.history.position" :size="windows.history.size" :z-index="windowManager.getZIndex('historyManager')"
      @update:position="updatePosition('history', $event)" @update:size="updateSize('history', $event)"
 @close="closeWindow('history')">
      <HistoryManager />
    </DraggableWindow>

    <!-- 收藏夹窗口（从历史记录窗口独立出来） -->
    <DraggableWindow name="favoritesManager" v-if="windows.favorites.visible" :title="t('history.favorites')"
      :position="windows.favorites.position" :size="windows.favorites.size"
      :z-index="windowManager.getZIndex('favoritesManager')"
      @update:position="updatePosition('favorites', $event)" @update:size="updateSize('favorites', $event)"
 @close="closeWindow('favorites')">
      <FavoritesManager @edit-favorite="openFavoriteEdit" />
    </DraggableWindow>

    <!-- AI窗口 -->
    <DraggableWindow name="aiWindow" v-if="windows.ai_window.visible" :title="t('aiWindow.windowTitle')"
      :position="windows.ai_window.position" :size="windows.ai_window.size"
      :z-index="windowManager.getZIndex('aiWindow')" @update:position="updatePosition('ai_window', $event)"
      @update:size="updateSize('ai_window', $event)"
      @close="closeWindow('ai_window')">
      <AiWindow />
    </DraggableWindow>

    <!-- 节点列表快捷窗口 -->
    <DraggableWindow name="nodeListWindow" v-if="windows.node_list_window.visible"
      :title="t('nodeListWindow.windowTitle')" :position="windows.node_list_window.position"
      :size="windows.node_list_window.size" :z-index="windowManager.getZIndex('nodeListWindow')"
      @update:position="updatePosition('node_list_window', $event)"
      @update:size="updateSize('node_list_window', $event)"
      @close="closeWindow('node_list_window')">
      <NodeListWindow />
    </DraggableWindow>

    <!-- 云仓库窗口 -->
    <DraggableWindow name="cloudWindow" v-if="windows.cloud_window.visible" :title="t('cloudWindow.windowTitle')"
      :position="windows.cloud_window.position" :size="windows.cloud_window.size"
      :z-index="windowManager.getZIndex('cloudWindow')" @update:position="updatePosition('cloud_window', $event)"
      @update:size="updateSize('cloud_window', $event)"
      @close="closeWindow('cloud_window')">
      <CloudWindow />
    </DraggableWindow>

    <!-- Lora堆窗口 -->
    <DraggableWindow name="loraStackWindow" v-if="windows.lora_stack_window.visible" :title="t('controls.loraStack')"
      :position="windows.lora_stack_window.position" :size="windows.lora_stack_window.size"
      :z-index="windowManager.getZIndex('loraStackWindow')"
      @update:position="updatePosition('lora_stack_window', $event)"
      @update:size="updateSize('lora_stack_window', $event)"
 @close="closeWindow('lora_stack_window')">
      <LoraStackWindow ref="loraStackRef" />
    </DraggableWindow>

    <!-- Danbooru管理器窗口 -->
    <DraggableWindow name="DanbooruManagerWindow" v-if="windows.danbooru_manager_window.visible"
      :title="t('controls.danbooruManager')" :position="windows.danbooru_manager_window.position"
      :size="windows.danbooru_manager_window.size" :z-index="windowManager.getZIndex('DanbooruManagerWindow')"
      @update:position="updatePosition('danbooru_manager_window', $event)"
      @update:size="updateSize('danbooru_manager_window', $event)"
      @close="closeWindow('danbooru_manager_window')">
      <DanbooruManagerWindow ref="danbooruManagerRef" />
    </DraggableWindow>

    <!-- 悬浮球 -->
    <FloatingBall v-if="isFloatingBallEnabled"></FloatingBall>
    <loraDetail ref="loraDetailLoraStackRef" />
    <FavoriteEditWindow ref="favoriteEditRef" />

    <!-- 版本更新提示 -->
    <div v-if="showVersionUpdate" class="version-update-notification">
      <div class="version-update-content">
        <span>{{ versionUpdateMessage }}</span>
        <div class="version-update-actions">
          <button class="goto-github-btn" @click="goToGitHub">前往GitHub</button>
          <button class="no-remind-btn" @click="noRemindUpdate">不再提醒</button>
          <button class="close-version-update" @click="closeVersionUpdate">×</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { isTrustedMessage } from '@/utils/post_message'
import { useI18n } from 'vue-i18n'
import DraggableWindow from '@/components/DraggableWindow.vue'
import PromptBox from './view/prompt_box/prompt_index.vue'
import TagManager from './view/tag_manager/tag_index.vue'
import LoraManager from './view/lora_manager/lora_index.vue'
import HistoryManager from './view/history_manager/history_index.vue'
import FavoritesManager from './view/favorites_manager/favorites_index.vue'
import { windowManager } from '@/utils/windowManager'
import FloatingBall from '@/components/FloatingBall.vue';
import { useTagStore } from '@/stores/tagStore';
import AiWindow from '@/view/ai_window/ai_window.vue'
import NodeListWindow from '@/view/node_list/index.vue'
import CloudWindow from '@/view/cloud/index.vue'
import LoraStackWindow from '@/view/lora_manager/lora_stack.vue'
import DanbooruManagerWindow from '@/view/danbooru/danbooru_manager.vue'
import FavoriteEditWindow from '@/view/favorites_manager/favorite_edit_window.vue'
import { translatorApi } from '@/api/translator'
import { tagsApi } from '@/api/tags'
import { historyApi } from '@/api/history'
import loraDetail from '@/view/lora_manager/lora_detail.vue'
import { version as localVersion } from './utils/version'
import { detectDark, watchComfyTheme, applyComfyPalette, clearComfyPalette } from './utils/comfyTheme'

const tagStore = useTagStore();

const isFloatingBallEnabled = ref(localStorage.getItem('weilin_prompt_ui_floatingBallEnabled') === 'true');
if (!localStorage.getItem('weilin_prompt_ui_floatingBallEnabled')) {
  localStorage.setItem('weilin_prompt_ui_floatingBallEnabled', 'true');
  isFloatingBallEnabled.value = true
}

const { t } = useI18n()

const thisEditPromptId = ref("")
const STORAGE_PREFIX = 'weilin_tools_'
const loraManager = ref('look')
const tagManager = ref('manager')
const promptManager = ref('prompt_global')
const hasPromptLoraStack = ref(false)
const THEME_KEY = `${STORAGE_PREFIX}theme`
// 主题模式（三态）：
//   'follow' —— 跟随 ComfyUI（默认，写容器 data-theme + 映射 ComfyUI 真实配色变量）
//   'dark'   —— 强制暗色（只写 data-theme，用插件自带暗色预设）
//   'light'  —— 强制亮色（同上）
// 兼容旧键 weilin_tools_theme_manual / weilin_tools_theme（曾用于二元开关）
const THEME_MODE_KEY = `${STORAGE_PREFIX}theme_mode`
const THEME_MANUAL_KEY = `${STORAGE_PREFIX}theme_manual`
const LEGACY_THEME_KEY = THEME_KEY

const readThemeMode = () => {
  try {
    const m = localStorage.getItem(THEME_MODE_KEY)
    if (m === 'follow' || m === 'dark' || m === 'light') return m
    // 兼容旧数据：旧 manual=true 时按旧 theme 值取强制档，否则跟随
    if (localStorage.getItem(THEME_MANUAL_KEY) === 'true') {
      return localStorage.getItem(LEGACY_THEME_KEY) === 'light' ? 'light' : 'dark'
    }
  } catch (e) {
    // 忽略
  }
  return 'follow'
}

const themeMode = ref(readThemeMode())
// 是否跟随 ComfyUI（非手动强制档）
const isManualTheme = ref(themeMode.value !== 'follow')
const isDark = ref(
  themeMode.value === 'follow' ? detectDark() : themeMode.value === 'dark'
)
// 取消 ComfyUI 主题监听的句柄
let stopComfyThemeWatch = null
// 全局提示词（悬浮球 →「打开全局提示词」）
// 持久化到 localStorage：此前它只存在这个内存 ref 里，刷新页面内容就丢了，
// 再打开只会得到一个空白编辑窗口。值格式与节点一致（与 prompt_index 的
// setPromptText 对应）：{prompt, lora, temp_prompt, temp_lora} 的 JSON 串。
const GLOBAL_PROMPT_KEY = 'weilin_prompt_ui_global_prompt'
// 空内容也要显式下发：setPromptText 对空串直接 return，不下发结构会残留上一个节点的提示词
const EMPTY_PROMPT_JSON = JSON.stringify({ prompt: '', lora: '', temp_prompt: [], temp_lora: '' })
const globalPrompt = ref(localStorage.getItem(GLOBAL_PROMPT_KEY) || '')

// 检查版本更新
const showVersionUpdate = ref(false);
const versionUpdateMessage = ref('');
const versionUpdateTimer = ref(null);
// 在现有的版本更新相关变量后添加
const VERSION_UPDATE_REMIND_KEY = `${STORAGE_PREFIX}version_update_remind`


// 关闭版本更新提示
const closeVersionUpdate = () => {
  showVersionUpdate.value = false;
  if (versionUpdateTimer.value) {
    clearTimeout(versionUpdateTimer.value);
    versionUpdateTimer.value = null;
  }
};
// 跳转到GitHub
const goToGitHub = () => {
  window.open('https://github.com/weilin9999/WeiLin-Comfyui-Tools', '_blank');
  closeVersionUpdate();
};

// 修改现有的函数
// 不再提醒版本更新
const noRemindUpdate = () => {
  // 将当前远程版本保存到localStorage，表示此版本不再提醒
  localStorage.setItem(VERSION_UPDATE_REMIND_KEY, 'false');
  closeVersionUpdate();
};


// 默认窗口配置
const DEFAULT_WINDOWS = {
  prompt: {
    visible: false,
    is_default_close: false,
    position: { x: 100, y: 100 },
    size: { width: 600, height: 500 }
  },
  tag: {
    visible: false,
    is_default_close: false,
    position: { x: 150, y: 150 },
    size: { width: 800, height: 600 }
  },
  lora: {
    visible: false,
    is_default_close: false,
    position: { x: 200, y: 200 },
    size: { width: 800, height: 600 }
  },
  history: {
    visible: false,
    is_default_close: false,
    position: { x: 300, y: 300 },
    size: { width: 800, height: 600 }
  },
  favorites: {
    visible: false,
    is_default_close: false,
    position: { x: 360, y: 240 },
    size: { width: 800, height: 600 }
  },
  ai_window: {
    visible: false,
    is_default_close: false,
    position: { x: 400, y: 400 },
    size: { width: 800, height: 600 }
  },
  node_list_window: {
    visible: false,
    is_default_close: false,
    position: { x: 100, y: 100 },
    size: { width: 300, height: 600 }
  },
  cloud_window: {
    visible: false,
    is_default_close: false,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 }
  },
  lora_stack_window: {
    visible: false,
    is_default_close: true,
    position: { x: 100, y: 100 },
    size: { width: 300, height: 600 }
  },
  danbooru_manager_window: {
    visible: false,
    is_default_close: true,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 }
  }
}

// 从 localStorage 获取窗口状态
const getInitialWindowState = () => {
  try {
    const savedState = localStorage.getItem(`${STORAGE_PREFIX}windowStates`)
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      const mergedState = { ...DEFAULT_WINDOWS }

      // 将保存的状态合并到默认配置中
      for (const key in parsedState) {
        if (key in mergedState) {
          mergedState[key] = {
            ...DEFAULT_WINDOWS[key],
            ...parsedState[key],
            // 如果is_default_close为true，则强制visible为false
            visible: parsedState[key].is_default_close ? false : parsedState[key].visible
          }
        }
      }

      return mergedState
    }
  } catch (error) {
    console.error('Error loading window states:', error)
  }

  return { ...DEFAULT_WINDOWS }
}

// 窗口状态管理
const windows = ref(getInitialWindowState())

// 监听窗口状态变化并保存
watch(windows, (newState) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}windowStates`, JSON.stringify(newState))
  } catch (error) {
    console.error('Error saving window states:', error)
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  // 窗口注册已由 DraggableWindow 挂载时以 props.name 自行完成
  // （这里不能用 windows 状态 key 注册——它与窗口 name 不同，会产生幽灵栈条目导致焦点切换失效）

  initTheme()
  startComfyThemeWatch()
  // 添加消息监听
  window.addEventListener('message', handleMessage)

  // getTagsData();

  // 检查版本更新
  checkForUpdates();

})

// ── 强制档（dark/light）下的调色板跟随 ──────────────────────────────
// 语义：data-theme 由用户档位强制决定（保证亮/暗观感），但**颜色**仍跟 ComfyUI 调色板。
// 做法：先走一遍映射，再用与档位同侧的预设覆盖关键项，
// 避免"强制亮却拿到 ComfyUI 暗色的文字/背景"。
const OVERRIDE_KEYS = [
  '--weilin-prompt-ui-primary-bg',
  '--weilin-prompt-ui-secondary-bg',
  '--weilin-prompt-ui-primary-text',
  '--weilin-prompt-ui-secondary-text',
  '--weilin-prompt-ui-input-bg',
  '--weilin-prompt-ui-input-text',
  '--weilin-prompt-ui-title-color',
  '--weilin-prompt-ui-label-color',
  '--weilin-prompt-ui-border-color',
  '--weilin-prompt-ui-header-bg',
  '--weilin-prompt-ui-card-bg',
  '--weilin-prompt-ui-button-bg',
  '--weilin-prompt-ui-button-text',
  '--weilin-prompt-ui-tag-bg',
  '--weilin-prompt-ui-tag-text',
  '--weilin-prompt-ui-token-bg',
  '--weilin-prompt-ui-icon-color',
  '--weilin-prompt-ui-primary',
  '--weilin-prompt-ui-background',
  '--weilin-prompt-ui-input-background',
  '--weilin-prompt-ui-border',
  '--weilin-prompt-ui-card-border',
  '--weilin-prompt-ui-label',
  '--weilin-prompt-ui-secondary-color'
]

// 与 theme.css 中 light / dark 预设一致的兜底色
const PRESET_FALLBACK = {
  light: {
    '--weilin-prompt-ui-primary-bg': '#ffffff',
    '--weilin-prompt-ui-secondary-bg': '#f5f5f5',
    '--weilin-prompt-ui-primary-text': '#333333',
    '--weilin-prompt-ui-secondary-text': '#666666',
    '--weilin-prompt-ui-input-bg': '#ffffff',
    '--weilin-prompt-ui-input-text': '#333333',
    '--weilin-prompt-ui-border-color': '#e8e8e8',
    '--weilin-prompt-ui-icon-color': '#666666',
    '--weilin-prompt-ui-token-bg': '#f0f0f0',
    '--weilin-prompt-ui-header-bg': '#f5f5f5',
    '--weilin-prompt-ui-card-bg': '#f4f7fd',
    '--weilin-prompt-ui-tag-bg': '#f5f5f5',
    '--weilin-prompt-ui-tag-text': '#333333',
    '--weilin-prompt-ui-button-bg': '#ffffff',
    '--weilin-prompt-ui-button-text': '#333333'
  },
  dark: {
    '--weilin-prompt-ui-primary-bg': '#1a1a1a',
    '--weilin-prompt-ui-secondary-bg': '#2d2d2d',
    '--weilin-prompt-ui-primary-text': '#e0e0e0',
    '--weilin-prompt-ui-secondary-text': '#a0a0a0',
    '--weilin-prompt-ui-input-bg': '#2d2d2d',
    '--weilin-prompt-ui-input-text': '#e0e0e0',
    '--weilin-prompt-ui-border-color': '#404040',
    '--weilin-prompt-ui-icon-color': '#a0a0a0',
    '--weilin-prompt-ui-token-bg': '#404040',
    '--weilin-prompt-ui-header-bg': '#2d2d2d',
    '--weilin-prompt-ui-card-bg': '#23243a',
    '--weilin-prompt-ui-tag-bg': '#2d2d2d',
    '--weilin-prompt-ui-tag-text': '#e0e0e0',
    '--weilin-prompt-ui-button-bg': '#2d2d2d',
    '--weilin-prompt-ui-button-text': '#e0e0e0'
  }
}

// 用某一侧的预设覆盖容器上的关键变量（覆盖跟随映射可能带来的异侧颜色）
const enforceSidePreset = (container, dark) => {
  if (!container) return
  const table = dark ? PRESET_FALLBACK.dark : PRESET_FALLBACK.light
  for (const key of OVERRIDE_KEYS) {
    const v = table[key]
    if (!v) continue
    try {
      container.style.setProperty(key, v)
    } catch (e) {
      // 忽略
    }
  }
}


// 把当前主题写到插件容器上（CSS 变量按 data-theme 生效）
// followComfy 为 true 时，额外把 ComfyUI 的真实主题变量映射到 --weilin-* 变量，
// 这样 Nord / Solarized / 自定义调色板等"非深浅"主题的配色也能跟随。
//
// darkOverride：显式指定本次渲染用亮/暗。ComfyUI 主题往往"慢一拍"——切换调色板时
// 插件先于 <html> 的 .dark-theme 类生效被通知，若此时读 isDark.value 会拿到旧值，
// 于是整套 UI（尤其跟随档下的深/浅预设）会与 ComfyUI 反色。因此跟随链路统一
// 以「刚从 DOM 探测到的 dark」为准，而不是 ref 的滞后值。
const applyTheme = (followComfy = false, darkOverride = undefined) => {
  const container = document.getElementById('weilin_comfyui_tools_prompt_ui_div')
  if (!container) return
  const dark = typeof darkOverride === 'boolean' ? darkOverride : isDark.value
  container.setAttribute('data-theme', dark ? 'dark' : 'light')
  let mapped = 0
  if (followComfy) {
    mapped = applyComfyPalette(container, dark)
  } else {
    // 强制档：清掉跟随期的覆盖，回到插件自身的 light/dark 预设
    clearComfyPalette(container)
    enforceSidePreset(container, dark)
  }
  if (typeof window !== 'undefined') {
    window.__weilinThemeState = {
      mode: themeMode.value,
      follow: followComfy,
      dark,
      mapped
    }
  }
}

// 初始化主题：默认跟随 ComfyUI；处于强制档时用强制值
const initTheme = () => {
  if (themeMode.value === 'follow') {
    const dark = detectDark()
    isDark.value = dark
    applyTheme(true, dark)
  } else {
    const dark = themeMode.value === 'dark'
    isDark.value = dark
    applyTheme(false, dark)
  }
}

// 切换主题档位（三态：follow → dark → light → follow）
// darkOnly=true 时兼容旧调用（传布尔），等价于在 dark / light 间切换
const setThemeMode = (mode) => {
  if (mode !== 'follow' && mode !== 'dark' && mode !== 'light') return
  themeMode.value = mode
  isManualTheme.value = mode !== 'follow'
  try {
    localStorage.setItem(THEME_MODE_KEY, mode)
    // 同步写旧键，保持向后兼容（外部脚本/旧版本回退时仍能读到）
    localStorage.setItem(THEME_MANUAL_KEY, mode === 'follow' ? 'false' : 'true')
    localStorage.setItem(LEGACY_THEME_KEY, mode === 'light' ? 'light' : 'dark')
  } catch (e) {
    // 忽略
  }
  initTheme()
  // 通知 ThemeSwitch 等订阅者：档位已变（用于同步图标）
  try {
    window.dispatchEvent(new CustomEvent('weilin-theme-mode-change', { detail: { mode } }))
  } catch (e) {
    // 忽略
  }
}

// 兼容旧签名：weilinSetThemeManually(dark) → 强制 dark/light
const setThemeManually = (dark) => setThemeMode(dark ? 'dark' : 'light')

// 显式恢复跟随
const resetThemeToComfy = () => setThemeMode('follow')

// 让 ThemeSwitch 组件（或外部脚本）能调用到主题控制
if (typeof window !== 'undefined') {
  window.weilinSetThemeManually = setThemeManually
  window.weilinSetThemeMode = setThemeMode
  window.weilinResetThemeToComfy = resetThemeToComfy
  window.weilinGetThemeMode = () => themeMode.value
  // 供 ThemeSwitch 兜底路径使用：把某一侧的预设压到容器上
  window.weilinApplySidePreset = (dark) => {
    const container = document.getElementById('weilin_comfyui_tools_prompt_ui_div')
    if (container) enforceSidePreset(container, !!dark)
  }
  // 诊断：在控制台执行 weilinThemeDiag() 可查看跟随链路的完整状态
  window.weilinThemeDiag = () => {
    const container = document.getElementById('weilin_comfyui_tools_prompt_ui_div')
    const root = document.documentElement
    const cs = container ? getComputedStyle(container) : null
    const newVars = [
      '--base-background',
      '--secondary-background',
      '--text-primary',
      '--primary-background',
      '--border-default'
    ]
    const oldVars = ['--bg-color', '--comfy-menu-bg', '--border-color', '--primary-bg']
    const probe = (el, names) => {
      const o = {}
      if (!el) return o
      const s = getComputedStyle(el)
      names.forEach(n => { o[n] = s.getPropertyValue(n) })
      return o
    }
    const result = {
      themeMode: themeMode.value,
      htmlClass: root.className,
      hasDarkTheme: root.classList.contains('dark-theme'),
      legacyManualKey: localStorage.getItem(THEME_MANUAL_KEY),
      state: window.__weilinThemeState,
      comfyNewVars: probe(root, newVars),
      comfyOldVars: probe(root, oldVars),
      containerInline: {},
      containerComputed: {}
    }
    if (container) {
      ;[
        '--weilin-prompt-ui-primary-bg',
        '--weilin-prompt-ui-primary-text',
        '--weilin-prompt-ui-primary-color',
        '--weilin-prompt-ui-border-color'
      ].forEach(n => {
        result.containerInline[n] = container.style.getPropertyValue(n)
        result.containerComputed[n] = cs ? cs.getPropertyValue(n) : ''
      })
    }
    console.log('weilin theme diag:', result)
    return result
  }

  /**
   * 调色板跟随探针：实测插件 UI 里各个关键元素**当前真实渲染出来的颜色**。
   * 用于回答"到底哪些元素跟随了、哪些没跟随"——比只看变量值直观。
   * 用法：控制台执行 weilinPaletteProbe()
   */
  window.weilinPaletteProbe = () => {
    const container = document.getElementById('weilin_comfyui_tools_prompt_ui_div')
    if (!container) return { error: 'container not found' }
    const pick = (sel, label, prop) => {
      const el = container.querySelector(sel)
      if (!el) return { label, sel, missing: true }
      const s = getComputedStyle(el)
      const v = s.getPropertyValue(prop)
      // 沿祖先链向上找第一个"有效"的背景（用于判断视觉上是否真的变了）
      return { label, sel, value: v }
    }
    const effBg = (el) => {
      let n = el
      while (n && n !== document.body) {
        const s = getComputedStyle(n)
        const bg = s.backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return { sel: null, bg }
        n = n.parentElement
      }
      return { bg: '' }
    }
    const probeList = [
      ['.weilin_prompt_ui_prompt-box', '根盒子', 'background-color'],
      ['.weilin_prompt_ui_draggable-window', '窗口外框', 'background-color'],
      ['.weilin_prompt_ui_draggable-window', '窗口边框', 'border-top-color'],
      ['.weilin_prompt_ui_window-header', '窗口标题栏', 'background-color'],
      ['.weilin_prompt_ui_window-title', '窗口标题文字', 'color'],
      ['.weilin_prompt_ui_close-btn', '关闭按钮', 'color'],
      ['.center-container', '操作栏容器', 'background-color'],
      ['.action-item .action-text', '操作项文字', 'color'],
      ['.action-item svg', '操作项图标', 'fill'],
      ['.input-area', '输入框', 'background-color'],
      ['.input-area', '输入框文字', 'color'],
      ['.input-area', '输入框边框', 'border-top-color'],
      ['.tokens-container', '标签容器', 'background-color'],
      ['.token-item-box', '提示词标签', 'background-color'],
      ['.token-item-box', '提示词标签文字', 'color'],
      ['.translate-btn', '功能按钮', 'color'],
      ['.tag-search-input', '搜索框', 'background-color'],
      ['.autocomplete-container', '补全弹窗', 'background-color'],
      ['.theme-switch .action-text', '主题按钮文案', 'color']
    ]
    const rootCs = getComputedStyle(document.documentElement)
    const gv = (n) => (rootCs.getPropertyValue(n) || '').trim()
    const out = {
      themeMode: themeMode.value,
      trueDark: isDark.value,
      // ComfyUI 面板/菜单层真实取值（决定插件窗口该跟谁）
      comfyPanel: {
        comfyMenuBg: gv('--comfy-menu-bg'),
        comfyMenuSecondaryBg: gv('--comfy-menu-secondary-bg'),
        bgColor: gv('--bg-color'),
        fgColor: gv('--fg-color'),
        comfyInputBg: gv('--comfy-input-bg'),
        borderColor: gv('--border-color'),
        contentBg: gv('--content-bg'),
        descripText: gv('--descrip-text'),
        inputText: gv('--input-text'),
        palettePanelSurface: gv('--palette-interface-panel-surface'),
        paletteHoverSurface: gv('--palette-interface-panel-hover-surface'),
        htmlInline_comfyMenuBg: document.documentElement.style.getPropertyValue('--comfy-menu-bg') || '(none)'
      },
      comfy: {
        baseBackground: gv('--base-background'),
        secondaryBackground: gv('--secondary-background'),
        tertiaryBackground: gv('--tertiary-background'),
        interfacePanelSurface: gv('--interface-panel-surface'),
        primaryBackground: gv('--primary-background'),
        textPrimary: gv('--text-primary'),
        borderDefault: gv('--border-default')
      },
      // 实测：ComfyUI 自己的右键菜单/对话框到底渲染成什么色
      comfyLive: (() => {
        const r = {}
        const probeSel = (sel) => {
          const el = document.querySelector(sel)
          if (!el) return '(missing)'
          const s = getComputedStyle(el)
          return s.backgroundColor + ' / ' + s.color
        }
        r.liteContextMenu = probeSel('.litegraph.litecontextmenu')
        r.comfyMenu = probeSel('.comfy-menu')
        r.liteDialog = probeSel('.litegraph .dialog')
        r.graphCanvas = probeSel('.graph-canvas-container') || probeSel('#graph-canvas')
        r.body = getComputedStyle(document.body).backgroundColor
        return r
      })(),
      switchMode: container.querySelector('.theme-switch')?.getAttribute('data-mode') || '(missing)',
      switchText: container.querySelector('.theme-switch .action-text')?.textContent || '(missing)',
      inlineVarCount: container.style.length,
      elements: probeList.map(([sel, label, prop]) => pick(sel, label, prop))
    }
    // 根盒子的有效背景（穿透透明层）
    const boxEl = container.querySelector('.weilin_prompt_ui_prompt-box')
    if (boxEl) out.effectiveRootBg = effBg(boxEl).bg
    console.log('weilin palette probe:', out)
    return out
  }
}

// 未处于强制档时，实时跟随 ComfyUI 主题/调色板变化
const startComfyThemeWatch = () => {
  if (stopComfyThemeWatch) return
  stopComfyThemeWatch = watchComfyTheme((dark) => {
    // 通知订阅者（如 ThemeSwitch 的图标状态）ComfyUI 主题已变
    try {
      window.dispatchEvent(new CustomEvent('weilin-comfy-theme-change', { detail: { dark } }))
    } catch (e) {
      // 忽略
    }
    const container = document.getElementById('weilin_comfyui_tools_prompt_ui_div')
    if (themeMode.value !== 'follow') {
      // 强制档：data-theme 保持不变，但 ComfyUI 换了调色板时仍需把"当前侧的预设"
      // 重新压上去——否则旧调色板残留的覆盖变量会一直挂在容器上。
      if (container) enforceSidePreset(container, isDark.value)
      return
    }
    isDark.value = dark
    // 用刚探测到的 dark，而非 ref（ref 可能已被别处写成旧值）
    applyTheme(true, dark)
  })
}

// 组件卸载时注销所有窗口
onUnmounted(() => {
  // 窗口注销由 DraggableWindow 卸载时按 props.name 自行完成

  // 移除消息监听
  window.removeEventListener('message', handleMessage)

  // 停止 ComfyUI 主题监听
  if (stopComfyThemeWatch) {
    stopComfyThemeWatch()
    stopComfyThemeWatch = null
  }

  // 清除版本更新定时器
  if (versionUpdateTimer.value) {
    clearTimeout(versionUpdateTimer.value);
    versionUpdateTimer.value = null;
  }
})

// 关闭窗口
const closeWindow = (windowName) => {
  if (windowName === 'prompt') {
    thisEditPromptId.value = ''
  }
  windows.value[windowName].visible = false
}

// 更新窗口位置
const updatePosition = (windowName, newPosition) => {
  if (windows.value[windowName]) {
    windows.value[windowName].position = { ...newPosition }
  }
}

// 提示词窗口是否被用户手动调整过大小（持久化）。
// 74.88 的「打开时自动收缩贴合内容」只应在用户没手动调过时生效——
// 否则每次打开都会把用户拖出来的尺寸覆盖掉（表现为「关闭再打开，尺寸被初始化」）。
const PROMPT_SIZE_USER_SIZED_KEY = `${STORAGE_PREFIX}prompt_size_user_sized`
const promptSizeUserSized = ref(localStorage.getItem(PROMPT_SIZE_USER_SIZED_KEY) === '1')
const markPromptSizeUserSized = () => {
  if (promptSizeUserSized.value) return
  promptSizeUserSized.value = true
  try {
    localStorage.setItem(PROMPT_SIZE_USER_SIZED_KEY, '1')
  } catch (e) {
    console.warn('[WeiLin] 提示词窗口尺寸标记保存失败:', e)
  }
}

// 更新窗口大小
const updateSize = (windowName, newSize) => {
  if (windows.value[windowName]) {
    windows.value[windowName].size = { ...newSize }
    // 只有用户拖拽 resize 会走到这里（DraggableWindow 仅在 handleResize 里 emit update:size），
    // 自动收缩走的是 onPromptRequestWindowSize，两者互不干扰
    if (windowName === 'prompt') markPromptSizeUserSized()
  }
}

// 74.88 收起空白：PromptBox 收起/展开内嵌 Lora 时请求调整提示词窗口大小
// （收起→收缩到内容高度去掉底部空白；展开→恢复收起前高度）。走同一条持久化链。
const onPromptRequestWindowSize = (newSize) => {
  if (windows.value.prompt && newSize && newSize.width > 0 && newSize.height > 0) {
    windows.value.prompt.size = {
      width: Math.round(newSize.width),
      height: Math.round(newSize.height)
    }
  }
}


// 复原所有窗口到默认位置和大小
const restoreWindowsToDefault = () => {
  const LORA_DETAIL_WINDOWS = {
    loraDetail: {
      visible: false,
      is_default_close: false,
      position: { x: 150, y: 150 },
      size: { width: 800, height: 600 }
    }
  }

  const DEFAULT_GOL_WINDOWS = {
    prompt: {
      visible: false,
      is_default_close: false,
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 }
    },
    tag: {
      visible: false,
      is_default_close: false,
      position: { x: 150, y: 150 },
      size: { width: 800, height: 600 }
    },
    lora: {
      visible: false,
      is_default_close: false,
      position: { x: 200, y: 200 },
      size: { width: 800, height: 600 }
    },
    history: {
      visible: false,
      is_default_close: false,
      position: { x: 300, y: 300 },
      size: { width: 800, height: 600 }
    },
    favorites: {
      visible: false,
      is_default_close: false,
      position: { x: 360, y: 240 },
      size: { width: 800, height: 600 }
    },
    ai_window: {
      visible: false,
      is_default_close: false,
      position: { x: 400, y: 400 },
      size: { width: 800, height: 600 }
    },
    node_list_window: {
      visible: false,
      is_default_close: false,
      position: { x: 100, y: 100 },
      size: { width: 400, height: 800 }
    },
    cloud_window: {
      visible: false,
      is_default_close: false,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 }
    },
    lora_stack_window: {
      visible: false,
      is_default_close: true,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 600 }
    },
    danbooru_manager_window: {
      visible: false,
      is_default_close: true,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 }
    }
  }


  localStorage.setItem(`${STORAGE_PREFIX}windowStates`, JSON.stringify(DEFAULT_GOL_WINDOWS))
  localStorage.setItem(`${STORAGE_PREFIX}loraDetailState`, JSON.stringify(LORA_DETAIL_WINDOWS))
  // 复原尺寸 = 用户主动放弃自定义尺寸 → 清掉标记，恢复「打开时自动收缩贴合内容」的默认行为
  promptSizeUserSized.value = false
  try {
    localStorage.removeItem(PROMPT_SIZE_USER_SIZED_KEY)
  } catch (e) { /* ignore */ }

  windows.value = getInitialWindowState()
};

const getTranslaterSetting = () => {
  translatorApi.getTranslateSetting().then(res => {
    // console.log(res)
    localStorage.setItem('weilin_prompt_ui_translater_setting', res.data);
  }).catch(err => {
    message({ type: "warn", str: 'message.getTranslaterFail' });
  })
};

getTranslaterSetting()

const promptBoxRef = ref()
const loraStackRef = ref()
const loraManagerRef = ref()
const loraDetailLoraStackRef = ref()
const favoriteEditRef = ref()

// 收藏夹 → 编辑收藏窗口：组件事件直调（引用传递，不经 postMessage 克隆）
const openFavoriteEdit = (item) => {
  console.log('[WeiLin] 编辑窗口 open, isEditing =', !!item, ', item =', item ? { id_index: item.id_index, name: item.name, tagLen: (item.tag || '').length } : null)
  favoriteEditRef.value.open(item)
}
const danbooruManagerRef = ref()

// 提示词编辑器工具栏的开关式打开：消息带 toggle 标记且目标窗口已可见时关闭它，否则打开并激活
const openOrToggleWindow = (msgData, win, wmKey) => {
  if (msgData?.data?.toggle && win.visible) {
    win.visible = false
  } else {
    win.visible = true
    // from=入口宿主窗口：抵消点击入口按钮时 mousedown 对宿主的隐式激活上浮，
    // 避免"打开新窗口"压低其他已打开窗口的层级（如 prompt>history 顺序翻转）
    windowManager.openWindowOnTop(wmKey)
  }
}

// 处理消息
const handleMessage = (event) => {
  if (!isTrustedMessage(event)) return
  if (event.data.type === 'weilin_prompt_ui_openTagManager') {
    tagManager.value = 'manager'
    windows.value.tag.visible = true
    windowManager.openWindowOnTop('tagManager')
  } else if (event.data.type === 'weilin_prompt_ui_openTagManager_prompt') {
    tagManager.value = 'prompt'
    openOrToggleWindow(event.data, windows.value.tag, 'tagManager')
  } else if (event.data.type === 'weilin_prompt_ui_openPromptBox') {
    // 按钮点击打开promptBox

    thisEditPromptId.value = event.data.id
    promptManager.value = 'prompt'
    windows.value.prompt.visible = true
    hasPromptLoraStack.value = false
    if (event.data.node === "WeiLinPromptUI") {
      hasPromptLoraStack.value = true
    }
    nextTick(() => {
      promptBoxRef.value.setPromptText(event.data.prompt)
    })
    windowManager.openWindowOnTop('promptBox')

  } else if (event.data.type === 'weilin_prompt_ui_openLoraManager') {
    loraManager.value = 'look'
    openOrToggleWindow(event.data, windows.value.lora, 'loraManager')
  } else if (event.data.type === 'weilin_prompt_ui_openLoraManager_addLora') {
    loraManager.value = 'addLora'
    windows.value.lora.visible = true
    nextTick(() => {
      loraManagerRef.value.openSetSeed(0, "")
    })
    windowManager.openWindowOnTop('loraManager')
  } else if (event.data.type === 'weilin_prompt_ui_openLoraManager_addLora_stack') {
    loraManager.value = 'addLora'
    windows.value.lora.visible = true
    nextTick(() => {
      loraManagerRef.value.openSetSeed(1, event.data.seed)
    })
    windowManager.openWindowOnTop('loraManager')
  } else if (event.data.type === 'weilin_prompt_ui_openLoraManager_addLora_stack_node') {
    loraManager.value = 'addLora'
    windows.value.lora.visible = true
    nextTick(() => {
      loraManagerRef.value.openSetSeed(2, event.data.seed)
    })
    windowManager.openWindowOnTop('loraManager')
  } else if (event.data.type === 'weilin_prompt_ui_openHistoryManager') {
    openOrToggleWindow(event.data, windows.value.history, 'historyManager')
  } else if (event.data.type === 'weilin_prompt_ui_openFavoritesManager') {
    openOrToggleWindow(event.data, windows.value.favorites, 'favoritesManager')
  } else if (event.data.type === 'weilin_prompt_ui_openAiWindow') {
    openOrToggleWindow(event.data, windows.value.ai_window, 'aiWindow')
  } else if (event.data.type === 'weilin_prompt_ui_open_node_list_window') {
    windows.value.node_list_window.visible = true
    windowManager.openWindowOnTop('nodeListWindow')

  } else if (event.data.type === 'weilin_prompt_ui_node_queued_save_history') {
    // 节点提交队列：把该节点的提示词存入历史（74.97 起入史统一在提交时，
    // 多节点工作流各自入史、不依赖窗口是否打开过；服务端按内容去重）
    // 74.29：对齐收藏夹 73 轮——只存 {prompt, lora}；temp_prompt/temp_lora 恒为空属无用数据，
    // 消费端 setPromptText 对缺失字段均有兜底，旧数据（带 temp_*）读取不受影响
    const executedPrompt = typeof event.data.prompt === 'string' ? event.data.prompt : ''
    if (executedPrompt.replace(/\s/g, '').length > 0) {
      historyApi.saveHistory({
        tag: JSON.stringify({
          prompt: executedPrompt,
          lora: event.data.lora || ""
        })
      }).catch((err) => {
        // 保存失败不能完全静默：否则该节点会被遗漏且无从排查
        console.warn('[WeiLin] 节点历史保存失败:', err);
      });
    }
  } else if (event.data.type === 'weilin_prompt_ui_prompt_finish_prompt') {
    window.postMessage({
      type: 'weilin_prompt_ui_prompt_update_prompt_' + thisEditPromptId.value,
      data: event.data.data
    }, '*')
  } else if (event.data.type === 'weilin_prompt_ui_open_global_prompt_box') {
    promptManager.value = 'prompt_global'
    thisEditPromptId.value = "global"
    windows.value.prompt.visible = true
    hasPromptLoraStack.value = false
    // 取持久化的内容并显式下发：空内容用 EMPTY_PROMPT_JSON，
    // 否则 setPromptText 会因空串直接 return，残留上一个节点的提示词
    const storedGlobalPrompt = localStorage.getItem(GLOBAL_PROMPT_KEY) || ''
    globalPrompt.value = storedGlobalPrompt
    nextTick(() => {
      promptBoxRef.value.setPromptText(storedGlobalPrompt || EMPTY_PROMPT_JSON)
    })
    windowManager.openWindowOnTop('promptBox')
  } else if (event.data.type === 'weilin_prompt_ui_open_global_tag_manager') {
    tagManager.value = 'manager'
    windows.value.tag.visible = true
    windowManager.openWindowOnTop('tagManager')
  } else if (event.data.type === 'weilin_prompt_ui_open_global_lora_manager') {
    loraManager.value = 'look'
    windows.value.lora.visible = true
    windowManager.openWindowOnTop('loraManager')
  } else if (event.data.type === 'weilin_prompt_ui_prompt_update_prompt_global') {
    // 全局提示词：只接受非空字符串，避免把 undefined 存成字面量 "undefined"
    // （那会让下次打开时 JSON.parse 失败）
    if (typeof event.data.data === 'string' && event.data.data.length > 0) {
      globalPrompt.value = event.data.data
      try {
        localStorage.setItem(GLOBAL_PROMPT_KEY, event.data.data)
      } catch (e) {
        console.warn('[WeiLin] 全局提示词保存失败（localStorage 不可用？）:', e)
      }
    }
  } else if (event.data.type === 'weilin_prompt_ui_floating_ball_setting') {
    isFloatingBallEnabled.value = localStorage.getItem('weilin_prompt_ui_floatingBallEnabled') === 'true';
  } else if (event.data.type === 'weilin_prompt_ui_restore_window') {
    restoreWindowsToDefault();
  } else if (event.data.type === 'weilin_prompt_ui_open_cloud_window') {
    openOrToggleWindow(event.data, windows.value.cloud_window, 'cloudWindow')
  } else if (event.data.type === 'weilin_prompt_ui_open_node_lora_stack_window') {
    windows.value.lora_stack_window.visible = true
    nextTick(() => {
      loraStackRef.value.initLoraStack(event.data.prompt, event.data.seed)
    })
    windowManager.openWindowOnTop('loraStackWindow')
  } else if (event.data.type === "weilin_prompt_ui_openLoraDetail") {
    loraDetailLoraStackRef.value.open({ name: event.data.lora })

  } else if (event.data.type === "weilin_prompt_ui_open_danbooru_manager_window") {
    openOrToggleWindow(event.data, windows.value.danbooru_manager_window, 'DanbooruManagerWindow')

  } else if (event.data.type === 'weilin_prompt_ui_prompt_inner_get_node_tag_template_id') {
    window.postMessage({
      type: 'weilin_prompt_ui_get_template_' + thisEditPromptId.value,
      data: event.data.data
    }, '*')
  } else if (event.data.type === 'weilin_prompt_ui_get_template_response') {
    if (thisEditPromptId.value === event.data.id) {
      window.postMessage({
        type: 'weilin_prompt_ui_prompt_inner_get_node_tag_template_id_response',
        data: event.data.data
      }, '*')
    }
  } else if (event.data.type === 'weilin_prompt_ui_prompt_inner_update_node_tag_template_id') {
    window.postMessage({
      type: 'weilin_prompt_ui_update_template_' + thisEditPromptId.value,
      data: event.data.data
    }, '*')
  } else if (event.data.type === 'weilin_prompt_ui_prompt_inner_get_node_tag_template_id_gorandom') {
    window.postMessage({
      type: 'weilin_prompt_ui_get_template_go_random_' + thisEditPromptId.value,
      data: event.data.data
    }, '*')
  } else if (event.data.type === 'weilin_prompt_ui_get_template_go_random_response') {
    if (thisEditPromptId.value === event.data.id) {
      window.postMessage({
        type: 'weilin_prompt_ui_prompt_inner_get_node_tag_template_id_go_random_response',
        data: event.data.data
      }, '*')
    }
  }
}


const getTagsData = async () => {
  try {
    const res = await tagsApi.getTagsList()
    tagStore.setCategories(res.data);
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
}

// 检查版本更新
const checkForUpdates = async () => {
  try {
    // 检查是否禁用了版本更新提醒
    const isRemindDisabled = localStorage.getItem(VERSION_UPDATE_REMIND_KEY) === 'false';
    if (isRemindDisabled) {
      console.info('WeiLin-Comfyui-Tools 版本更新提醒已禁用');
      return;
    }

    const response = await fetch('https://raw.githubusercontent.com/weilin9999/WeiLin-Comfyui-Tools/refs/heads/main/src/src/utils/version.js');
    if (!response.ok) {
      console.error('获取版本信息失败:', response.status);
      return;
    }

    const text = await response.text();
    // 使用正则表达式提取版本号
    const versionMatch = text.match(/export const version = "([^"]+)"/);

    if (versionMatch && versionMatch[1]) {
      const remoteVersion = versionMatch[1];
      console.info(`WeiLin-Comfyui-Tools GitHub版本： ${remoteVersion}`);
      // 比较版本号
      if (remoteVersion !== localVersion) {
        // 显示更新提示
        versionUpdateMessage.value = `WeiLin-Comfyui-Tools 发现新版本 ${remoteVersion}，当前版本 ${localVersion}`;
        showVersionUpdate.value = true;

        // 10秒后自动关闭
        if (versionUpdateTimer.value) {
          clearTimeout(versionUpdateTimer.value);
        }
        versionUpdateTimer.value = setTimeout(() => {
          showVersionUpdate.value = false;
          versionUpdateTimer.value = null;
        }, 10000);

        console.info(`WeiLin-Comfyui-Tools 发现新版本 ${remoteVersion}，当前版本 ${localVersion} GitHub链接：https://github.com/weilin9999/WeiLin-Comfyui-Tools`);
      }
    }
  } catch (error) {
    console.error('WeiLin-Comfyui-Tools 检查更新失败:', error);
  }
};

// 重新启用版本更新提醒（可以在设置页面调用）
const enableVersionUpdateRemind = () => {
  localStorage.removeItem(VERSION_UPDATE_REMIND_KEY);
  console.info('WeiLin-Comfyui-Tools 版本更新提醒已重新启用');
};

</script>

<style scoped>
.main-container {
  width: 100%;
  height: 100%;
}

/* 确保所有对话框都在窗口之上 */
:deep(.dialog-overlay) {
  z-index: 9999 !important;
}


/* 版本更新提示样式 */
.version-update-notification {
  position: fixed;
  right: 10px;
  bottom: 10px;
  z-index: 9999;
  background-color: var(--primary-color, #4caf50);
  color: white;
  padding: 10px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
}

.version-update-content {
  display: flex;
  flex-direction: column;
}

.version-update-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.goto-github-btn {
  background-color: white;
  color: var(--primary-color, #4caf50);
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-right: 10px;
  cursor: pointer;
  font-weight: bold;
}

.close-version-update {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.no-remind-btn {
  background-color: rgba(255, 255, 255, 0.8);
  color: var(--primary-color, #4caf50);
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-right: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.no-remind-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

/* 调整按钮容器的间距 */
.version-update-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 5px;
  /* 添加按钮间距 */
}
</style>
