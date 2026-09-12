<template>
  <div :class="`${prefix}lora-stack`"
    :style="[{ width: isOpen ? '300px' : '0' }, { paddingRight: isOpen ? '16px' : '0' }]">
    <div :class="`${prefix}lora-content`">
      <div :class="`${prefix}lora-header`">
        <!-- 三段式启用切换：全部启用 / 默认 / 全部禁用，固定在最左侧。
             "默认" = 恢复进入强制状态前各卡片的启用状态 -->
        <div class="enable-segments" v-if="selectedLoras.length > 0">
          <button class="segment" :class="{ active: enableMode === 'all' }"
            @click="setEnableMode('all')">{{ t('loraManager.enableAllLora') }}</button>
          <button class="segment" :class="{ active: enableMode === 'default' }"
            @click="setEnableMode('default')">{{ t('loraManager.defaultMode') }}</button>
          <button class="segment" :class="{ active: enableMode === 'none' }"
            @click="setEnableMode('none')">{{ t('loraManager.disableAllLora') }}</button>
        </div>
        <div class="header-actions">
          <button :class="`${prefix}add-btn`" @click="openLoraManager" :title="t('controls.addLora')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
          <button :class="`${prefix}close-btn`" @click="$emit('close')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
      <div :class="`${prefix}lora-body`">
        <div :class="`${prefix}lora-list`">
          <div v-for="(lora, idx) in selectedLoras" ref="loraStackItemRef" :key="lora.name" class="lora-item"
            :class="{ 'hidden-lora': lora.hidden }" @mouseenter="(e) => handleMouseHover(lora.lora, e)"
            @mouseleave="handleMouseLeave" draggable="true" @dragstart="handleDragStart(idx)"
            @dragover.prevent @drop="handleDrop(idx)">
            <div class="lora-info">
              <div class="lora-header">
                <span class="lora-name" :title="lora.name">{{ lora.name }}</span>
                <div class="lora-actions">
                  <button class="look-on-btn" @click.stop.prevent="lookOnLora(lora)" :title="t('controls.lookOnLora')">
                    <svg viewBox="0 0 1024 1024" width="14" height="14">
                      <path
                        d="M576.5 930.2H163.1c-52.9 0-96-43.1-96-96v-672c0-52.9 43.1-96 96-96h672c52.9 0 96 43.1 96 96V577c0 17.7-14.3 32-32 32s-32-14.3-32-32V162.2c0-17.6-14.4-32-32-32h-672c-17.6 0-32 14.4-32 32v672c0 17.6 14.4 32 32 32h413.4c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                        p-id="3466"></path>
                      <path
                        d="M692.4 322.3H245.7c-17.7 0-32-14.3-32-32s14.3-32 32-32h446.7c17.7 0 32 14.3 32 32s-14.3 32-32 32zM388.5 530.2H245.7c-17.7 0-32-14.3-32-32s14.3-32 32-32h142.7c17.7 0 32 14.3 32 32 0.1 17.6-14.3 32-31.9 32zM388.5 738H245.7c-17.7 0-32-14.3-32-32s14.3-32 32-32h142.7c17.7 0 32 14.3 32 32 0.1 17.7-14.3 32-31.9 32z"
                        p-id="3467"></path>
                      <path
                        d="M624.1 792.5c-94.8 0-172-77.2-172-172s77.2-172 172-172 172 77.2 172 172-77.1 172-172 172z m0-280c-59.6 0-108 48.4-108 108s48.4 108 108 108 108-48.4 108-108-48.4-108-108-108z"
                        p-id="3468"></path>
                      <path
                        d="M820.8 864.2L710.5 753.9c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L866 818.9c12.5 12.5 12.5 32.8 0 45.3s-32.7 12.5-45.2 0z"
                        p-id="3469"></path>
                    </svg>
                  </button>
                  <button class="remove-btn" @click="removeLora(lora)" :title="t('controls.removeLora')">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- 输入框一行显示 -->
              <div class="lora-weights-row">
                <div class="weight-item-col">
                  <label>{{ t('loraManager.modelWeight') }}</label>
                  <input type="number" v-model="lora.weight" @input="onWeightInput(lora, 'weight')"
                    @wheel="onWeightWheel($event, lora, 'weight')" class="lora-weight" step="0.1" />
                </div>
                <div class="weight-item-col">
                  <label>{{ t('loraManager.textEncoderWeight') }}</label>
                  <input type="number" v-model="lora.text_encoder_weight"
                    @input="onWeightInput(lora, 'text_encoder_weight')"
                    @wheel="onWeightWheel($event, lora, 'text_encoder_weight')" class="lora-weight" step="0.1" />
                </div>
                <!-- 权重同步：卡片级开关，开启后修改任一权重，另一个自动同步为相同值 -->
                <div class="switch-item-col">
                  <label>{{ t('loraManager.syncWeights') }}</label>
                  <label class="switch">
                    <input type="checkbox" v-model="lora.sync_weights" />
                    <span class="slider"></span>
                  </label>
                </div>
                <!-- Switch 开关 -->
                <div class="switch-item-col">
                  <label>{{ lora.hidden ? t('lora.hideLora') : t('lora.showLora') }}</label>
                  <label class="switch">
                    <input type="checkbox" :checked="!lora.hidden" @change="toggleHideLora(lora)">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <!-- lora-footer 移除 -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <loraDetail ref="loraDetailLoraStackRef" />
    <LoraCard ref="loraCardItem" v-if="showCard" :fileNmae="hoveFileName" :paddingLeft="paddingLeftValue"
      :paddingTop="paddingTopValue" @cardLeave="handleEnterLeave" @cardenter="handEnterCard"
      @openDetail="handleOpenDetailFromCard" />

  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { isTrustedMessage } from '@/utils/post_message'
import { useI18n } from 'vue-i18n'
import loraDetail from '@/view/lora_manager/lora_detail.vue'
import LoraCard from '@/view/lora_manager/lora_card.vue'

const prefix = "weilin_prompt_ui_"
const { t } = useI18n()
const showCard = ref(false)
const hoveFileName = ref('')
const paddingLeftValue = ref(100)
const paddingTopValue = ref(0)
const loraStackItemRef = ref()
const isEnterCatd = ref(false)
const isHovering = ref(false);
const loraCardItem = ref()
const isDetailOpen = ref(false);

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  selectedLoras: {
    type: Array,
    default: []
  }
})

const emit = defineEmits(['close', 'update:selectedLoras'])


const handleMouseHover = (fileName, event) => {
  isHovering.value = true;
  if (isDetailOpen.value) return;
  if (hoveFileName.value === fileName && showCard.value) return;

  const hoveredCard = event.currentTarget;
  const cardRect = hoveredCard.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const cardWidth = 450;

  // 默认显示在左侧
  let position = {
    left: cardRect.left - cardWidth - 10,
    top: cardRect.top
  };

  // 如果左侧空间不足(小于10px)，则显示在右侧
  if (position.left < 10) {
    position.left = cardRect.right + 10;
  }

  // 确保不会超出视口顶部和底部
  position.top = Math.max(10, Math.min(position.top, window.innerHeight - 310));

  paddingLeftValue.value = position.left;
  paddingTopValue.value = position.top;

  showCard.value = true;
  hoveFileName.value = fileName;
  // console.log(fileName)
  nextTick(() => {
    loraCardItem.value.refresh()
  })
}

const handleMouseLeave = () => {
  isHovering.value = false;
  setTimeout(() => {
    if (!isEnterCatd.value && !isHovering.value) {
      showCard.value = false;
      hoveFileName.value = "";
      isEnterCatd.value = false;
    }
  }, 200)
}

const handEnterCard = () => {
  // console.log("enter")
  isEnterCatd.value = true;
  isHovering.value = true;
}

const handleEnterLeave = () => {
  showCard.value = false;
  hoveFileName.value = "";
  isEnterCatd.value = false;
}


// 打开Lora管理器
const openLoraManager = () => {
  window.postMessage({ type: 'weilin_prompt_ui_openLoraManager_addLora', data: {} }, '*')
}

// 添加切换隐藏状态的方法
const toggleHideLora = (lora) => {
  // console.log('toggleHideLora', lora)
  lora.hidden = !lora.hidden;
  // emit('update:selectedLoras', props.selectedLoras);
  // 手动干预单个卡片后退出三段强制模式（快照作废）
  if (enableMode.value !== 'default') {
    enableMode.value = 'default'
    hiddenSnapshot = null
  }
};

// 三段式启用模式：default=默认（不强制干预），all=全部启用，none=全部禁用。
// 从默认进入强制状态时记录各卡片 hidden 快照，切回"默认"时恢复；
// 强制状态间互切（启用↔禁用）不覆盖快照。直接修改 props 数组元素（与现有方法同一模式）
const enableMode = ref('default')
let hiddenSnapshot = null

const setEnableMode = (mode) => {
  if (mode === enableMode.value) return
  if (mode === 'default') {
    if (hiddenSnapshot) {
      for (const [lora, hidden] of hiddenSnapshot) lora.hidden = hidden
      hiddenSnapshot = null
    }
    enableMode.value = 'default'
    return
  }
  if (enableMode.value === 'default') {
    hiddenSnapshot = new Map(props.selectedLoras.map(l => [l, l.hidden]))
  }
  const target = mode === 'all' ? false : true
  props.selectedLoras.forEach(l => { l.hidden = target })
  enableMode.value = mode
};

// 权重同步：卡片级开关（lora.sync_weights），开启后修改该卡片的模型权重/文本权重时，
// 另一个立即同步为相同值。字段随 selectedLoras 一起持久化，重开窗口后状态保留
const onWeightInput = (lora, field) => {
  if (!lora.sync_weights) return
  const other = field === 'weight' ? 'text_encoder_weight' : 'weight'
  lora[other] = lora[field]
}

// 悬停滚轮调权：无需点击聚焦，鼠标悬停在权重输入框上滚动即可调整（步长 0.1，与 step 属性一致）
const onWeightWheel = (e, lora, field) => {
  e.preventDefault() // 阻止滚轮滚动页面
  const current = parseFloat(lora[field])
  const base = Number.isFinite(current) ? current : 1
  // 滚轮向上增、向下减；保留 1 位小数，避免 0.1 累加的浮点误差
  const next = Math.round((base + (e.deltaY < 0 ? 0.1 : -0.1)) * 10) / 10
  lora[field] = next
  onWeightInput(lora, field) // 复用权重同步联动
}


// 添加Lora
const addLora = (lora) => {
  // 检查是否已存在
  // console.log(props.selectedLoras)
  if (props.selectedLoras && !props.selectedLoras.find(item => item.name === lora.name)) {
    props.selectedLoras.push({
      name: lora.name,
      weight: 1,
      text_encoder_weight: 1,
      ...lora
    })
    emit('update:selectedLoras', props.selectedLoras)
  }
}

// 移除Lora
const removeLora = (lora) => {
  const index = props.selectedLoras.findIndex(item => item.name === lora.name)
  if (index > -1) {
    props.selectedLoras.splice(index, 1)
    // console.log('removeLora', props.selectedLoras)
    emit('update:selectedLoras', props.selectedLoras)
  }
}


const loraDetailLoraStackRef = ref()

const lookOnLora = (loraData) => {
  // 先关闭悬浮信息窗口，避免层级冲突覆盖顶栏
  showCard.value = false
  hoveFileName.value = ""
  isEnterCatd.value = false
  isDetailOpen.value = true;
  nextTick(() => {
    loraDetailLoraStackRef.value.open({ name: loraData.lora || loraData.name, onClose: () => {
      isDetailOpen.value = false;
    } })
  })
}

// 从悬浮信息窗口内部点击"详情"按钮打开详情
const handleOpenDetailFromCard = (data) => {
  showCard.value = false
  hoveFileName.value = ""
  isEnterCatd.value = false
  isDetailOpen.value = true;
  nextTick(() => {
    loraDetailLoraStackRef.value.open({ name: data?.name || data, onClose: () => {
      isDetailOpen.value = false;
    } })
  })
}

// 监听来自Lora管理器的消息
window.addEventListener('message', (event) => {
  if (!isTrustedMessage(event)) return
  if (event.data.type === 'weilin_prompt_ui_selectLora') {
    addLora(event.data.lora)
  }
})

// 拖拽相关
const dragIndex = ref(null)
const handleDragStart = (idx) => {
  dragIndex.value = idx
}
const handleDrop = (idx) => {
  if (dragIndex.value === null || dragIndex.value === idx) return
  const moved = props.selectedLoras.splice(dragIndex.value, 1)[0]
  props.selectedLoras.splice(idx, 0, moved)
  dragIndex.value = null
  emit('update:selectedLoras', props.selectedLoras)
}

defineExpose({
  addLora,
  removeLora
})
</script>

<style scoped>
.weilin_prompt_ui_lora-stack {
  top: 0;
  left: 0;
  height: 100%;
  background: var(--weilin-prompt-ui-primary-bg);
  transition: width 0.3s ease;
  overflow: hidden;
  box-sizing: border-box;
}

.weilin_prompt_ui_lora-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-left: 0;
}

.weilin_prompt_ui_lora-header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--weilin-prompt-ui-secondary-bg);
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
}

.weilin_prompt_ui_lora-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--weilin-prompt-ui-primary-text);
}

.weilin_prompt_ui_close-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weilin_prompt_ui_close-btn:hover {
  background-color: var(--weilin-prompt-ui-hover-bg-color);
}

.weilin_prompt_ui_close-btn svg {
  fill: var(--weilin-prompt-ui-secondary-text);
}

.weilin_prompt_ui_lora-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.weilin_prompt_ui_lora-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 三段式启用切换（全部启用 / 默认 / 全部禁用）：分段按钮组，固定在最左侧 */
.enable-segments {
  display: flex;
  align-items: center;
  margin-right: auto;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.enable-segments .segment {
  border: none;
  background: transparent;
  color: var(--weilin-prompt-ui-secondary-text);
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s, color 0.2s;
}

.enable-segments .segment + .segment {
  border-left: 1px solid var(--weilin-prompt-ui-border-color);
}

.enable-segments .segment:hover {
  background-color: var(--weilin-prompt-ui-hover-bg-color);
}

.enable-segments .segment.active {
  background-color: var(--weilin-prompt-ui-primary-color);
  color: #fff;
}

.weilin_prompt_ui_add-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weilin_prompt_ui_add-btn:hover {
  background-color: var(--weilin-prompt-ui-hover-bg-color);
}

.weilin_prompt_ui_add-btn svg {
  fill: var(--weilin-prompt-ui-secondary-text);
}

.lora-item {
  background: var(--weilin-prompt-ui-secondary-bg);
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.lora-item:hover {
  border-color: var(--weilin-prompt-ui-primary-color);
  box-shadow: 0 2px 8px var(--weilin-prompt-ui-shadow-color);
}

.lora-info {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.hidden-lora {
  background: rgba(255, 200, 200, 0.2) !important;
  /* 淡红色背景 */
  border-color: rgba(255, 150, 150, 0.5) !important;
  /* 可选：淡红色边框 */
}

.lora-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--weilin-prompt-ui-primary-bg);
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
}

.lora-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--weilin-prompt-ui-primary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.lora-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 输入框一行显示，label在上方（卡片较窄，四列放不下时允许换行兜底） */
.lora-weights-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
  align-items: flex-end;
  padding: 12px;
  background: var(--weilin-prompt-ui-secondary-bg);
}

.weight-item-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 60px;
}

.weight-item-col label {
  font-size: 11px;
  color: var(--weilin-prompt-ui-secondary-text);
  margin-bottom: 2px;
}

/* Switch标签上方且字体小 */
.switch-item-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.switch-item-col label {
  font-size: 11px;
  color: var(--weilin-prompt-ui-secondary-text);
  margin-bottom: 2px;
}

.lora-weight {
  flex: 1;
  width: 100%;
  padding: 4px 6px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-input-bg);
  color: var(--weilin-prompt-ui-primary-text);
  font-size: 12px;
  transition: all 0.3s ease;
}

.lora-weight:hover {
  border-color: var(--weilin-prompt-ui-primary-color);
}

.lora-weight:focus {
  border-color: var(--weilin-prompt-ui-primary-color);
  outline: none;
  box-shadow: 0 0 0 2px var(--weilin-prompt-ui-primary-color-fade);
}

.remove-btn,
.look-on-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.remove-btn:hover,
.look-on-btn:hover {
  background-color: var(--weilin-prompt-ui-hover-bg-color);
}

.remove-btn svg,
.look-on-btn svg {
  fill: var(--weilin-prompt-ui-secondary-text);
}

.remove-btn:hover svg {
  fill: var(--weilin-prompt-ui-danger-color);
}

.look-on-btn:hover svg {
  fill: var(--weilin-prompt-ui-primary-color);
}

/* Switch 开关样式 */
.switch-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch input:checked + .slider:before {
  transform: translateX(16px);
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.switch input:checked+.slider {
  background-color: var(--weilin-prompt-ui-primary-color);
}

</style>
