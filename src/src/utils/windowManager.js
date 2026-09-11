import { ref } from 'vue'

/**
 * 窗口层级管理器
 *
 * 层级模型（栈式）：
 *  - 普通窗口：baseZIndex 起步，按激活顺序递增（后激活的在上）
 *  - 置顶窗口：PINNED_BASE 区间，恒高于所有普通窗口；置顶窗口之间仍按激活顺序
 *  - 点击窗口任意处（DraggableWindow 的 mousedown）即激活并置顶该窗口（智能焦点切换）
 *  - 新窗口打开（注册）即自动获得焦点并排在普通窗口最上层
 *  - Alt+Q 可在已打开窗口间循环切换焦点（cycleActiveWindow）
 *
 * 置顶记忆：
 *  - togglePin 时把窗口名写入 localStorage（weilin_prompt_ui_pinned_windows）
 *  - 页面刷新后初始化恢复；窗口关闭再打开（registerWindow）也会自动恢复置顶
 *  - 再点一次图钉取消置顶即同时清除该窗口的记忆
 */

const baseZIndex = 100
const PINNED_BASE = 1000
const Z_STEP = 10

const PINNED_STORAGE_KEY = 'weilin_prompt_ui_pinned_windows'

const activeWindow = ref('')
const windowZIndexes = ref({})
// 激活顺序栈：越靠后越新激活；仅包含当前已注册（打开）的窗口
const stackOrder = ref([])
// 置顶窗口集合（当前实际置顶）
const pinnedWindows = ref(new Set())
// 置顶记忆（持久化偏好）：窗口关闭后仍保留，供下次打开时恢复
const pinnedMemory = ref(new Set(readPinnedMemory()))

function readPinnedMemory() {
  try {
    const arr = JSON.parse(localStorage.getItem(PINNED_STORAGE_KEY) || '[]')
    return Array.isArray(arr) ? arr.filter(n => typeof n === 'string') : []
  } catch (e) {
    return []
  }
}

function persistPinnedMemory() {
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...pinnedMemory.value]))
  } catch (e) { /* 忽略写入失败（如隐私模式） */ }
}

const recomputeZIndexes = () => {
  const z = {}
  let normal = 0
  let pinned = 0
  stackOrder.value.forEach(name => {
    if (pinnedWindows.value.has(name)) {
      z[name] = PINNED_BASE + pinned * Z_STEP
      pinned++
    } else {
      z[name] = baseZIndex + normal * Z_STEP
      normal++
    }
  })
  windowZIndexes.value = z
}

export const windowManager = {
  activeWindow,

  // 设置活动窗口：移到激活栈顶并重算层级（同一区间内后激活者在上）
  setActiveWindow(windowName) {
    if (!stackOrder.value.includes(windowName)) return
    activeWindow.value = windowName
    stackOrder.value = [...stackOrder.value.filter(n => n !== windowName), windowName]
    recomputeZIndexes()
  },

  // 获取窗口的 z-index（模板中调用，读取 ref 保证响应式）
  getZIndex(windowName) {
    if (windowZIndexes.value[windowName] === undefined) {
      windowZIndexes.value[windowName] = baseZIndex
    }
    return windowZIndexes.value[windowName]
  },

  // 注册窗口：新窗口排在激活栈顶，并自动获得焦点（打开即激活）
  registerWindow(windowName) {
    if (!stackOrder.value.includes(windowName)) {
      stackOrder.value = [...stackOrder.value, windowName]
    }
    if (windowZIndexes.value[windowName] === undefined) {
      windowZIndexes.value[windowName] = baseZIndex
    }
    // 置顶记忆恢复：之前置顶过的窗口，再次打开时自动回到置顶
    if (pinnedMemory.value.has(windowName)) {
      pinnedWindows.value.add(windowName)
    }
    activeWindow.value = windowName
    recomputeZIndexes()
  },

  // 注销窗口：仅移除当前的置顶状态；持久化记忆保留（下次打开自动恢复置顶）
  unregisterWindow(windowName) {
    stackOrder.value = stackOrder.value.filter(n => n !== windowName)
    if (pinnedWindows.value.has(windowName)) {
      pinnedWindows.value.delete(windowName)
    }
    if (activeWindow.value === windowName) {
      // 关闭焦点窗口时，自动把焦点切换到上一个窗口（剩余窗口中最近激活的栈顶）
      const remaining = stackOrder.value
      activeWindow.value = remaining.length > 0 ? remaining[remaining.length - 1] : ''
    }
    recomputeZIndexes()
  },

  // 置顶开关：置顶时同时激活该窗口，并把偏好写入持久化记忆（再点一次取消并清除记忆）
  togglePin(windowName) {
    if (pinnedWindows.value.has(windowName)) {
      pinnedWindows.value.delete(windowName)
      pinnedMemory.value.delete(windowName)
    } else {
      pinnedWindows.value.add(windowName)
      pinnedMemory.value.add(windowName)
      this.setActiveWindow(windowName)
    }
    persistPinnedMemory()
    recomputeZIndexes()
  },

  isPinned(windowName) {
    return pinnedWindows.value.has(windowName)
  },

  isRegistered(windowName) {
    return stackOrder.value.includes(windowName)
  },

  // 智能切换焦点：在已打开窗口间循环切换（无激活窗口时从第一个开始）
  cycleActiveWindow() {
    const open = stackOrder.value.slice()
    if (open.length === 0) return null
    const idx = open.indexOf(activeWindow.value)
    const next = open[(idx + 1) % open.length]
    this.setActiveWindow(next)
    return next
  }
}
