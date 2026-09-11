<template>
  <button
    class="theme-switch"
    :class="`mode-${mode}`"
    :data-mode="mode"
    @click="cycleTheme"
    :title="titleText"
  >
    <div class="switch-icon">
      <!-- 跟随模式：双环（跟随） -->
      <svg v-if="mode === 'follow'" class="follow" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" stroke="none"/>
      </svg>
      <!-- 月亮图标（强制暗） -->
      <svg v-else-if="isDark" class="moon" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      <!-- 太阳图标（强制亮） -->
      <svg v-else class="sun" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    </div>
    <!-- 添加插槽以支持文本显示 -->
    <slot :isDark="isDark" :mode="mode"></slot>
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { detectDark } from '@/utils/comfyTheme'

const { t } = useI18n()
const STORAGE_PREFIX = 'weilin_tools_'
const THEME_MODE_KEY = `${STORAGE_PREFIX}theme_mode`
const THEME_MANUAL_KEY = `${STORAGE_PREFIX}theme_manual`
const THEME_KEY = `${STORAGE_PREFIX}theme`

// 三态：follow（跟随 ComfyUI）/ dark（强制暗）/ light（强制亮）
const readMode = () => {
  try {
    const m = localStorage.getItem(THEME_MODE_KEY)
    if (m === 'follow' || m === 'dark' || m === 'light') return m
    if (localStorage.getItem(THEME_MANUAL_KEY) === 'true') {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
    }
  } catch (e) {
    // 忽略
  }
  return 'follow'
}

const mode = ref(readMode())
const isDark = ref(mode.value === 'follow' ? detectDark() : mode.value === 'dark')

const titleText = computed(() => {
  if (mode.value === 'follow') return t('theme.followComfy')
  if (mode.value === 'dark') return t('theme.forceDark')
  return t('theme.forceLight')
})

// 循环：follow → dark → light → follow
const cycleTheme = () => {
  const next = mode.value === 'follow' ? 'dark' : mode.value === 'dark' ? 'light' : 'follow'
  mode.value = next
  if (typeof window !== 'undefined' && typeof window.weilinSetThemeMode === 'function') {
    window.weilinSetThemeMode(next)
  } else {
    // 兜底：App 未挂载时直接落盘 + 写容器
    try {
      localStorage.setItem(THEME_MODE_KEY, next)
      localStorage.setItem(THEME_MANUAL_KEY, next === 'follow' ? 'false' : 'true')
      localStorage.setItem(THEME_KEY, next === 'light' ? 'light' : 'dark')
    } catch (e) {
      // 忽略
    }
    const container = document.getElementById('weilin_comfyui_tools_prompt_ui_div')
    if (container) {
      const dark = next === 'follow' ? detectDark() : next === 'dark'
      container.setAttribute('data-theme', dark ? 'dark' : 'light')
      // 强制档还需要把该侧预设压到容器上，避免残留的跟随覆盖继续生效
      if (next !== 'follow' && typeof window.weilinApplySidePreset === 'function') {
        window.weilinApplySidePreset(dark)
      }
    }
  }
  isDark.value = next === 'follow' ? detectDark() : next === 'dark'
}

// 跟随模式下 ComfyUI 切主题时，同步按钮图标状态
const syncFromComfy = () => {
  if (mode.value !== 'follow') return
  isDark.value = detectDark()
}

// 外部（如 weilinSetThemeMode）改动后同步本地
const syncFromApp = () => {
  mode.value = readMode()
  isDark.value = mode.value === 'follow' ? detectDark() : mode.value === 'dark'
}

onMounted(() => {
  syncFromComfy()
  window.addEventListener('weilin-comfy-theme-change', syncFromComfy)
  window.addEventListener('weilin-theme-mode-change', syncFromApp)
})

onUnmounted(() => {
  window.removeEventListener('weilin-comfy-theme-change', syncFromComfy)
  window.removeEventListener('weilin-theme-mode-change', syncFromApp)
})
</script>

<style scoped>
.theme-switch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.theme-switch:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.theme-switch:active {
  transform: scale(0.95);
}

.switch-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sun, .moon, .follow {
  width: 20px;
  height: 20px;
  stroke: var(--weilin-prompt-ui-icon-color);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.3s ease;
}

.moon {
  fill: var(--weilin-prompt-ui-icon-color);
}

/* 跟随模式：图标用主题主色，与非跟随档做区分 */
.mode-follow .follow {
  stroke: var(--weilin-prompt-ui-primary-color);
  fill: none;
  opacity: 0.9;
}
.mode-follow .follow path {
  fill: var(--weilin-prompt-ui-primary-color);
}

/* 添加旋转动画 */
.theme-switch:hover .sun,
.theme-switch:hover .moon {
  transform: rotate(30deg);
}
.theme-switch:hover .follow {
  transform: scale(1.1);
}
</style>
