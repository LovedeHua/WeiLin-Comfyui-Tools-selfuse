<template>
  <Teleport to="#weilin_comfyui_tools_prompt_ui_div">
    <div
      class="weilin_prompt_ui_draggable-window"
      :class="{ 'is-active-window': isActiveWindow }"
      :style="{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        width: `${currentSize.width}px`,
        height: `${currentSize.height}px`,
        zIndex: currentZIndex
      }"
      @mousedown="handleWindowMouseDown"
      tabindex="-1"
      ref="windowRef"
      @keydown="handleKeydown"
    >
      <!-- 窗口标题栏 -->
      <div class="weilin_prompt_ui_window-header" @mousedown.stop="handleHeaderMouseDown" @dblclick="close"
        @contextmenu="handleHeaderContextMenu" title="右键 / 中键 / 双击 关闭窗口">
        <div class="weilin_prompt_ui_window-title">{{ title }}</div>
        <button class="weilin_prompt_ui_pin-btn" :class="{ pinned: isPinned }" @click.stop="togglePin"
          :title="isPinned ? t('controls.unpinWindow') : t('controls.pinWindow')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H18v-2c-1.66 0-3-1.34-3-3z" />
          </svg>
        </button>
        <button class="weilin_prompt_ui_close-btn" @click="close">×</button>
      </div>

      <!-- 内容区域 -->
      <div class="weilin_prompt_ui_window-content" @scroll="handleScroll">
        <slot></slot>
      </div>

      <!-- 调整大小的手柄：四边 -->
      <!-- 调整大小的手柄：四角 -->
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-nw" @mousedown.stop="startResize($event, 'nw')" title="向左上调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-ne" @mousedown.stop="startResize($event, 'ne')" title="向右上调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-sw" @mousedown.stop="startResize($event, 'sw')" title="向左下调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-se" @mousedown.stop="startResize($event, 'se')" title="向右下调整"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { windowManager } from '@/utils/windowManager'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  position: {
    type: Object,
    required: true
  },
  size: {
    type: Object,
    required: true
  },
  zIndex: {
    type: Number,
    default: 0
  },
  name: {
    type: String,
    default: "default_window_name"
  }
})

const { t } = useI18n()

const emit = defineEmits(['update:position', 'update:size', 'active', 'close'])

const windowRef = ref(null)

// 当前状态
const currentPosition = ref({ x: 0, y: 0 })
const currentSize = ref({ width: 600, height: 400 })
const currentZIndex = ref(props.zIndex)

// 同步 props 变化
watch(() => props.position, (newPosition) => {
  if (newPosition) {
    currentPosition.value = { ...newPosition }
    window.parent.postMessage({ type: `weilin_prompt_ui_window_change_${props.name}_position` }, '*')
  }
}, { immediate: true, deep: true })

watch(() => props.size, (newSize) => {
  if (newSize) {
    currentSize.value = { ...newSize }
    window.parent.postMessage({ type: `weilin_prompt_ui_window_change_${props.name}_size` }, '*')
  }
}, { immediate: true, deep: true })

watch(() => props.zIndex, (newZ) => {
  currentZIndex.value = newZ
})

const handleScroll = () => {
  window.parent.postMessage({ type: `weilin_prompt_ui_window_change_${props.name}_scroll` }, '*')
}

// 边界常量
const MIN_LEFT_SPACE = 20
const MIN_TOP_SPACE = 55
const MIN_BOTTOM_SPACE = 20
const MIN_RIGHT_SPACE = 20
const MIN_WIDTH = 200
const MIN_HEIGHT = 200

// 初始化
onMounted(() => {
  if (props.position) {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = props.position.x
    let y = props.position.y

    x = Math.max(MIN_LEFT_SPACE - (props.size?.width || currentSize.value.width), x)
    x = Math.min(x, viewportWidth - MIN_RIGHT_SPACE)
    y = Math.max(MIN_TOP_SPACE, y)
    y = Math.min(y, viewportHeight - MIN_BOTTOM_SPACE)

    currentPosition.value = { x, y }
  }

  if (props.size) {
    currentSize.value = { ...props.size }
  }

  // 自动聚焦，ESC 立即生效
  nextTick(() => {
    windowRef.value?.focus()
  })

  // 自注册到窗口管理器（父组件重复注册是幂等的）
  windowManager.registerWindow(props.name)
})

// 卸载时注销（父组件重复注销是幂等的）
onUnmounted(() => {
  windowManager.unregisterWindow(props.name)
})

// ESC 关闭（仅在聚焦时生效）
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    close()
  }
}

// 点击窗口：激活 + 聚焦 + 通知父组件置顶
const handleWindowMouseDown = (event) => {
  // 智能焦点切换：点击窗口任意处即将该窗口提到最上层
  windowManager.setActiveWindow(props.name)
  // 点击输入框/文本域等可编辑元素时不抢焦点：
  // 否则 windowRef.focus() 会让正在编辑的输入框 blur（如标签编辑会意外退出编辑状态）
  const t = event && event.target
  const isEditable = !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable))
  if (!isEditable) {
    windowRef.value?.focus()
  }
  emit('active')
}

// 鼠标悬停智能切换焦点功能已取消：焦点切换仅由点击窗口触发

// 置顶与激活状态
const isPinned = computed(() => windowManager.isPinned(props.name))
const isActiveWindow = computed(() => windowManager.activeWindow.value === props.name)
const togglePin = () => {
  windowManager.togglePin(props.name)
}

// 程序性焦点交接：关闭窗口后自动交接 / Alt+Q 循环切换使本窗口成为激活窗口时，
// 主动聚焦窗口容器，保证 ESC 关闭等键盘操作立即生效（原先只交接了 z-index，
// DOM 键盘焦点仍留在已关闭窗口处，导致新激活窗口收不到 ESC）。
// 若焦点已在本窗口的 iframe 内（用户刚点击其中内容/输入框），则不抢焦点，
// 保留 handleWindowMouseDown 对可编辑元素的保护
watch(isActiveWindow, (active) => {
  if (!active) return
  nextTick(() => {
    const iframe = windowRef.value?.querySelector('iframe')
    if (iframe && document.activeElement === iframe) return
    windowRef.value?.focus()
  })
})

// 拖动
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const startDrag = (event) => {
  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - currentPosition.value.x,
    y: event.clientY - currentPosition.value.y
  }
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

const handleDrag = (event) => {
  if (!isDragging.value) return

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let newX = event.clientX - dragOffset.value.x
  let newY = event.clientY - dragOffset.value.y

  newX = Math.max(MIN_LEFT_SPACE - currentSize.value.width, newX)
  newX = Math.min(newX, viewportWidth - MIN_RIGHT_SPACE)
  newY = Math.max(MIN_TOP_SPACE, newY)
  newY = Math.min(newY, viewportHeight - MIN_BOTTOM_SPACE)

  const newPosition = { x: newX, y: newY }
  currentPosition.value = newPosition
  emit('update:position', newPosition)
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 调整大小 - 支持8个方向
const isResizing = ref(false)
const resizeDirection = ref('')
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })
const resizeStartPosition = ref({ x: 0, y: 0 })

const startResize = (event, direction) => {
  isResizing.value = true
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { ...currentSize.value }
  resizeStartPosition.value = { ...currentPosition.value }
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event) => {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y
  const direction = resizeDirection.value

  let newWidth = resizeStartSize.value.width
  let newHeight = resizeStartSize.value.height
  let newX = resizeStartPosition.value.x
  let newY = resizeStartPosition.value.y

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 水平方向调整
  if (direction.includes('e')) {
    newWidth = Math.max(MIN_WIDTH, resizeStartSize.value.width + deltaX)
    newWidth = Math.min(newWidth, viewportWidth - currentPosition.value.x - MIN_RIGHT_SPACE)
  }
  if (direction.includes('w')) {
    const maxDeltaX = resizeStartSize.value.width - MIN_WIDTH
    const constrainedDeltaX = Math.min(deltaX, maxDeltaX)
    newWidth = resizeStartSize.value.width - constrainedDeltaX
    newX = resizeStartPosition.value.x + constrainedDeltaX
    newX = Math.max(MIN_LEFT_SPACE - newWidth, newX)
  }

  // 垂直方向调整
  if (direction.includes('s')) {
    newHeight = Math.max(MIN_HEIGHT, resizeStartSize.value.height + deltaY)
    newHeight = Math.min(newHeight, viewportHeight - currentPosition.value.y - MIN_BOTTOM_SPACE)
  }
  if (direction.includes('n')) {
    const maxDeltaY = resizeStartSize.value.height - MIN_HEIGHT
    const constrainedDeltaY = Math.min(deltaY, maxDeltaY)
    newHeight = resizeStartSize.value.height - constrainedDeltaY
    newY = resizeStartPosition.value.y + constrainedDeltaY
    newY = Math.max(MIN_TOP_SPACE, newY)
  }

  currentSize.value = { width: newWidth, height: newHeight }
  currentPosition.value = { x: newX, y: newY }
  emit('update:size', { width: newWidth, height: newHeight })
  emit('update:position', { x: newX, y: newY })
}

const stopResize = () => {
  isResizing.value = false
  resizeDirection.value = ''
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

const setActive = () => {
  emit('active')
}

const close = () => {
  emit('close')
}

// 标题栏点击：中键关闭窗口；左键先激活再拖动；其余按键忽略
const handleHeaderMouseDown = (event) => {
  // 鼠标中键（button === 1）关闭窗口，并阻止浏览器默认的中键自动滚动
  // 注意：右键关闭不能在这里做——若在 mousedown 中关闭窗口，
  // 随后的 contextmenu 事件会落在下层页面上弹出浏览器菜单，需在 contextmenu 事件中处理
  if (event.button === 1) {
    event.preventDefault()
    close()
    return
  }
  // 仅左键（button === 0）允许拖动
  if (event.button !== 0) return
  handleWindowMouseDown()
  startDrag(event)
}

// 标题栏右键：阻止浏览器菜单并关闭窗口（菜单被抑制时窗口才卸载，顺序不能反）
const handleHeaderContextMenu = (event) => {
  event.preventDefault()
  close()
}
</script>

<style scoped>
.weilin_prompt_ui_draggable-window {
  position: fixed;
  background: var(--weilin-prompt-ui-primary-bg);
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 var(--weilin-prompt-ui-shadow-color);
  overflow: visible;
  display: flex;
  flex-direction: column;
  outline: none;
}

.weilin_prompt_ui_window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--weilin-prompt-ui-secondary-bg);
  cursor: move;
  user-select: none;
  border-radius: 8px 8px 0 0;
  /* 标题栏与内容区背景色接近，用一条低调的半透明分隔线区分（两种主题下都自然） */
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
}

.weilin_prompt_ui_window-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 5px;
  color: var(--weilin-prompt-ui-primary-text);
}

.weilin_prompt_ui_close-btn {
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  color: var(--weilin-prompt-ui-secondary-text);
}

.weilin_prompt_ui_close-btn:hover {
  color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
}

/* 置顶按钮 */
.weilin_prompt_ui_pin-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0 2px;
  color: var(--weilin-prompt-ui-secondary-text);
  opacity: 0.45;
  display: flex;
  align-items: center;
  transition: opacity 0.2s, color 0.2s;
}

.weilin_prompt_ui_pin-btn svg {
  width: 15px;
  height: 15px;
}

.weilin_prompt_ui_pin-btn:hover {
  opacity: 1;
}

/* 已置顶：图钉倒转 + 高亮 */
.weilin_prompt_ui_pin-btn.pinned {
  opacity: 1;
  color: var(--weilin-prompt-ui-primary-color);
}

.weilin_prompt_ui_pin-btn.pinned svg {
  transform: rotate(45deg);
}

/* 焦点窗口：在标题栏处指示（仅标题文字变主色） */
.weilin_prompt_ui_draggable-window.is-active-window .weilin_prompt_ui_window-title {
  color: var(--weilin-prompt-ui-primary-color);
}

/* 鼠标指针智能切换：非激活窗口显示手型提示"悬停/点击可切换焦点" */
.weilin_prompt_ui_draggable-window:not(.is-active-window) {
  cursor: pointer;
}

.weilin_prompt_ui_window-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: var(--weilin-prompt-ui-primary-bg);
  border-radius: 0 0 8px 8px;
}

/* ============================================
   调整大小手柄 - 基础样式（仅四角）
   ============================================ */
.weilin_prompt_ui_resize-handle {
  position: absolute;
  z-index: 10;
  user-select: none;
}

/* ============================================
   四边手柄 - 更大的热区，延伸到边框外面
   ============================================ */
/* ============================================
   四角手柄 - 更大的热区，延伸到边框外面
   ============================================ */
.weilin_prompt_ui_resize-nw,
.weilin_prompt_ui_resize-ne,
.weilin_prompt_ui_resize-sw,
.weilin_prompt_ui_resize-se {
  width: 12px;
  height: 12px;
  z-index: 11;
}

.weilin_prompt_ui_resize-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.weilin_prompt_ui_resize-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.weilin_prompt_ui_resize-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.weilin_prompt_ui_resize-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

/* ============================================
   四角角框 - 显示在边框外面
   ============================================ */
.weilin_prompt_ui_resize-nw::before,
.weilin_prompt_ui_resize-ne::before,
.weilin_prompt_ui_resize-sw::before,
.weilin_prompt_ui_resize-se::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  pointer-events: none;
  transition: all 0.15s ease;
  border-radius: 1px;
}

/* 左上 - 角框在左上角外面 */
.weilin_prompt_ui_resize-nw::before {
  top: 5px;
  left: 5px;
  border-top: 3px solid rgba(140, 140, 140, 0.7);
  border-left: 3px solid rgba(140, 140, 140, 0.7);
}

/* 右上 - 角框在右上角外面 */
.weilin_prompt_ui_resize-ne::before {
  top: 5px;
  right: 5px;
  border-top: 3px solid rgba(140, 140, 140, 0.7);
  border-right: 3px solid rgba(140, 140, 140, 0.7);
}

/* 左下 - 角框在左下角外面 */
.weilin_prompt_ui_resize-sw::before {
  bottom: 5px;
  left: 5px;
  border-bottom: 3px solid rgba(140, 140, 140, 0.7);
  border-left: 3px solid rgba(140, 140, 140, 0.7);
}

/* 右下 - 角框在右下角外面 */
.weilin_prompt_ui_resize-se::before {
  bottom: 5px;
  right: 5px;
  border-bottom: 3px solid rgba(140, 140, 140, 0.7);
  border-right: 3px solid rgba(140, 140, 140, 0.7);
}

/* ============================================
   四角角框 - 悬停高亮
   ============================================ */
.weilin_prompt_ui_resize-nw:hover::before,
.weilin_prompt_ui_resize-ne:hover::before,
.weilin_prompt_ui_resize-sw:hover::before,
.weilin_prompt_ui_resize-se:hover::before {
  border-color: rgba(37, 117, 252, 0.9);
  width: 12px;
  height: 12px;
}

/* ============================================
   四边手柄 - 悬停高亮
   ============================================ */
/* ============================================
   四角手柄 - 悬停背景
   ============================================ */
.weilin_prompt_ui_resize-nw:hover,
.weilin_prompt_ui_resize-ne:hover,
.weilin_prompt_ui_resize-sw:hover,
.weilin_prompt_ui_resize-se:hover {
  background: rgba(37, 117, 252, 0.1);
  border-radius: 4px;
}

.weilin_prompt_ui_window-content::-webkit-scrollbar {
  width: 6px;
}

.weilin_prompt_ui_window-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.weilin_prompt_ui_window-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.weilin_prompt_ui_window-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>