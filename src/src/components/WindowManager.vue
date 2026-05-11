<template>
  <div>
    <!-- 窗口列表 -->
    <DraggableWindow
      v-for="window in windowList"
      :key="window.id"
      :title="window.title"
      :position="window.position"
      :size="window.size"
      :zIndex="window.zIndex"
      :name="window.name"
      @update:position="(pos) => updatePosition(window.id, pos)"
      @update:size="(size) => updateSize(window.id, size)"
      @active="handleWindowActive(window.id)"
      @close="closeWindow(window.id)"
    >
      <!-- 动态内容 -->
      <component :is="window.component" v-bind="window.props" />
    </DraggableWindow>
  </div>
</template>

<script setup>
import { ref, reactive, markRaw } from 'vue'
import DraggableWindow from './DraggableWindow.vue'

// 基础层级，比 ComfyUI 设置界面低
const BASE_Z_INDEX = 1

// 窗口列表
const windowList = ref([])

// 窗口 ID 计数器
let windowIdCounter = 0

// 创建窗口
const createWindow = (config) => {
  const id = ++windowIdCounter
  
  const newWindow = reactive({
    id,
    name: config.name || `window_${id}`,
    title: config.title || '未命名窗口',
    position: reactive({
      x: config.position?.x ?? 100,
      y: config.position?.y ?? 100
    }),
    size: reactive({
      width: config.size?.width ?? 600,
      height: config.size?.height ?? 400
    }),
    zIndex: BASE_Z_INDEX,
    component: markRaw(config.component),
    props: config.props || {}
  })
  
  windowList.value.push(newWindow)
  
  // 新窗口自动置顶
  handleWindowActive(id)
  
  return id
}

// 关闭窗口
const closeWindow = (id) => {
  const index = windowList.value.findIndex(w => w.id === id)
  if (index > -1) {
    windowList.value.splice(index, 1)
  }
}

// 窗口激活（置顶）
const handleWindowActive = (activeId) => {
  windowList.value.forEach(w => {
    w.zIndex = w.id === activeId ? BASE_Z_INDEX + 1 : BASE_Z_INDEX
  })
}

// 更新位置
const updatePosition = (id, position) => {
  const window = windowList.value.find(w => w.id === id)
  if (window) {
    Object.assign(window.position, position)
  }
}

// 更新大小
const updateSize = (id, size) => {
  const window = windowList.value.find(w => w.id === id)
  if (window) {
    Object.assign(window.size, size)
  }
}

// 暴露方法给外部调用
defineExpose({
  createWindow,
  closeWindow,
  windowList
})
</script>