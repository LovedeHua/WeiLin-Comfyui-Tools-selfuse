<template>
  <Teleport to="#weilin_comfyui_tools_prompt_ui_div">
    <div
      class="weilin_prompt_ui_draggable-window"
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
      <div class="weilin_prompt_ui_window-header" @mousedown.stop="handleHeaderMouseDown" @dblclick="close">
        <div class="weilin_prompt_ui_window-title">{{ title }}</div>
        <button class="weilin_prompt_ui_close-btn" @click="close">×</button>
      </div>

      <!-- 内容区域 -->
      <div class="weilin_prompt_ui_window-content" @scroll="handleScroll">
        <slot></slot>
      </div>

      <!-- 调整大小的手柄：四边 -->
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-n" @mousedown.stop="startResize($event, 'n')" title="向上调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-s" @mousedown.stop="startResize($event, 's')" title="向下调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-w" @mousedown.stop="startResize($event, 'w')" title="向左调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-e" @mousedown.stop="startResize($event, 'e')" title="向右调整"></div>
      <!-- 调整大小的手柄：四角 -->
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-nw" @mousedown.stop="startResize($event, 'nw')" title="向左上调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-ne" @mousedown.stop="startResize($event, 'ne')" title="向右上调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-sw" @mousedown.stop="startResize($event, 'sw')" title="向左下调整"></div>
      <div class="weilin_prompt_ui_resize-handle weilin_prompt_ui_resize-se" @mousedown.stop="startResize($event, 'se')" title="向右下调整"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

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
const MIN_LEFT_SPACE = 100
const MIN_TOP_SPACE = 55
const MIN_BOTTOM_SPACE = 100
const MIN_RIGHT_SPACE = 100
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
})

// ESC 关闭（仅在聚焦时生效）
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    close()
  }
}

// 点击窗口：激活 + 聚焦 + 通知父组件置顶
const handleWindowMouseDown = () => {
  windowRef.value?.focus()
  emit('active')
}

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
    // 确保不超出左边界
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
    // 确保不超出上边界
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

// 标题栏点击：先激活，再拖动
const handleHeaderMouseDown = (event) => {
  handleWindowMouseDown()
  startDrag(event)
}
</script>

<style scoped>
.weilin_prompt_ui_draggable-window {
  position: absolute;
  background: var(--weilin-prompt-ui-primary-bg);
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
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
}

.weilin_prompt_ui_window-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
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
  color: #ff4d4f;
}

.weilin_prompt_ui_window-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: var(--weilin-prompt-ui-primary-bg);
}

/* 调整大小手柄基础样式 */
.weilin_prompt_ui_resize-handle {
  position: absolute;
  z-index: 10;
  user-select: none;
}

/* 四边手柄 */
.weilin_prompt_ui_resize-n {
  top: 0;
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}

.weilin_prompt_ui_resize-s {
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}

.weilin_prompt_ui_resize-w {
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

.weilin_prompt_ui_resize-e {
  right: 0;
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

/* 四角手柄 */
.weilin_prompt_ui_resize-nw {
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
}

.weilin_prompt_ui_resize-ne {
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: ne-resize;
}

.weilin_prompt_ui_resize-sw {
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: sw-resize;
}

.weilin_prompt_ui_resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}

/* 手柄悬停效果 */
.weilin_prompt_ui_resize-handle:hover {
  background: rgba(37, 117, 252, 0.3);
}

.weilin_prompt_ui_resize-n:hover,
.weilin_prompt_ui_resize-s:hover {
  background: linear-gradient(90deg, transparent, rgba(37, 117, 252, 0.3), transparent);
}

.weilin_prompt_ui_resize-w:hover,
.weilin_prompt_ui_resize-e:hover {
  background: linear-gradient(0deg, transparent, rgba(37, 117, 252, 0.3), transparent);
}

.weilin_prompt_ui_resize-nw:hover,
.weilin_prompt_ui_resize-ne:hover,
.weilin_prompt_ui_resize-sw:hover,
.weilin_prompt_ui_resize-se:hover {
  background: rgba(37, 117, 252, 0.4);
  border-radius: 2px;
}

/* 右下角特殊标记 */
.weilin_prompt_ui_resize-se::after {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 6px;
  height: 6px;
  border-right: 2px solid rgba(150, 150, 150, 0.5);
  border-bottom: 2px solid rgba(150, 150, 150, 0.5);
  pointer-events: none;
}

.weilin_prompt_ui_resize-se:hover::after {
  border-right-color: rgba(37, 117, 252, 0.8);
  border-bottom-color: rgba(37, 117, 252, 0.8);
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