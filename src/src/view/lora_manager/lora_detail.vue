<template>
    <DraggableWindow v-if="isOpen" :title="t('lora.title')" :position="windows.loraDetail.position"
        :size="windows.loraDetail.size" :z-index="windowManager.getZIndex('loraDetail')"
        @update:position="updatePosition('loraDetail', $event)" @update:size="updateSize('loraDetail', $event)"
        @active="windowManager.setActiveWindow('loraDetail')" @close="closeWindow('loraDetail')">
        <template #default>
            <div class="lora-detail__content" ref="loraContent">

                <div v-if="loading" class="lora-detail__loading">
                    <svg viewBox="0 0 24 24" width="24" height="24" class="is-rotating">
                        <path d="M12 4V2C6.48 2 2 6.48 2 12H4C4 7.58 7.58 4 12 4Z" />
                    </svg>
                </div>

                <input
            ref="fileInput"
            type="file"
            accept="image/*,video/*"
            style="display: none"
            @change="handleLocalFileChange"
        />
        <div class="lora-detail__body">
                    <!-- 标题 -->
                    <div class="lora-detail__title-area">
                            <div class="lora-detail__title">Lora 信息</div>
                            <div class="local-cover-btn" @click="triggerFileSelect" title="选择本地图片/视频作为封面">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H8l4-4 4 4h-2z"/>
                                </svg>
                                <span>本地封面</span>
                            </div>
                            <button class="fetch-btn lora-raw-btn" @click="openLoraRaw(loraInfo.raw.metadata)" title="查看LoraRaw">
                                {{ t('lora.seeLoraRaw') }}
                            </button>
                        </div>

                    <!-- 标签区域 -->
                    <ul class="lora-detail__tags">
                        <li v-if="loraInfo.type" class="lora-detail__tag"
                            :class="`-type-${loraInfo.type.toLowerCase()}`" :title="t('lora.type')">
                            {{ loraInfo.type }}
                        </li>
                        <li v-if="loraInfo.baseModel" class="lora-detail__tag"
                            :class="`-basemodel-${loraInfo.baseModel.toLowerCase()}`" :title="t('lora.baseModel')">
                            {{ loraInfo.baseModel }}
                        </li>
                    </ul>

                    <!-- 信息表格 -->
                    <table class="lora-detail__table">
                        <tbody>
                            <!-- 文件信息 -->
                            <tr>
                                <td class="label">{{ t('lora.file') }}</td>
                                <td colspan="5">{{ loraInfo.file }}</td>
                            </tr>

                            <!-- Hash值 -->
                            <tr>
                                <td class="label">{{ t('lora.hash') }}</td>
                                <td colspan="2" class="hash">{{ loraInfo.sha256 }}</td>
                            </tr>

                            <!-- Civitai链接 -->
                            <tr>
                                <td class="label">{{ t('lora.civitai') }}</td>
                                <td colspan="2">
                                    <template v-if="civitaiLink">
                                        <a :href="civitaiLink" target="_blank" class="civitai-link">
                                            <svg viewBox="0 0 24 24" width="16" height="16" class="civitai-icon">
                                                <path
                                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v4h3l-4 7z" />
                                            </svg>
                                            <span>{{ t('lora.viewOnCivitai') }}</span>
                                        </a>
                                        <button style="margin-left: 10px;" class="refresh-btn" @click="refreshLoraInfo">
                                            {{ t('lora.getCivitData') }}
                                        </button>
                                    </template>
                                    <template v-else-if="isCivitaiNotFound">
                                        <div class="not-found">
                                            <i>{{ t('lora.modelNotFound') }}</i>
                                            <svg viewBox="0 0 24 24" width="16" height="16" class="help-icon"
                                                :title="t('lora.modelNotFoundTip')">
                                                <path
                                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                            </svg>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <button class="fetch-btn" @click="refreshLoraInfo">
                                            {{ t('lora.fetchFromCivitai') }}
                                        </button>
                                    </template>
                                </td>
                            </tr>

                            <!-- 名称(可编辑) -->
                            <tr :class="{ 'is-editing': isEditing.name }">
                                <td class="label">
                                    {{ t('lora.name') }}
                                    <svg viewBox="0 0 24 24" width="16" height="16" class="help-icon"
                                        :title="t('lora.nameTip')">
                                        <path
                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                    </svg>
                                </td>
                                <td>
                                    <input v-if="isEditing.name" v-model="editValues.name" type="text"
                                        @keyup.enter="saveEdit('name')" @keyup.esc="cancelEdit('name')"
                                        ref="nameInput" />
                                    <span v-else class="text">{{ loraInfo.name }}</span>
                                </td>
                                <td class="actions">
                                    <button class="edit-btn" @click="toggleEdit('name')">
                                        <svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16">
                                            <path v-if="isEditing.name"
                                                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                            <path v-else
                                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>

                            <!-- 基础模型 -->
                            <tr>
                                <td class="label">{{ t('lora.baseModel') }}</td>
                                <td colspan="2">{{
                                    !loraInfo.baseModelFile && !loraInfo.baseModelFile
                                        ? ""
                                        : (loraInfo.baseModel || "") +
                                        (loraInfo.baseModelFile
                                            ? `
                                    (${loraInfo.baseModelFile})`
                                            : "")
                                }}</td>
                            </tr>

                            <!-- 跳过层 -->
                            <tr>
                                <td class="label">{{ t('lora.skipClip') }}</td>
                                <td colspan="2">{{
                                    (_t =
                                        (_s = loraInfo.raw) === null || _s === void 0
                                            ? void 0
                                            : _s.metadata) === null || _t === void 0
                                        ? void 0
                                        : _t.ss_clip_skip
                                }}</td>
                            </tr>


                            <!-- 其他可编辑字段 -->
                            <template v-for="field in editableFields" :key="field.key">
                                <tr :class="{ 'is-editing': isEditing[field.key] }">
                                    <td class="label">
                                        {{ field.label }}
                                        <svg v-if="field.tip" viewBox="0 0 24 24" width="16" height="16"
                                            class="help-icon" :title="field.tip">
                                            <path
                                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                        </svg>
                                    </td>
                                    <td>
                                        <input v-if="isEditing[field.key]" v-model="editValues[field.key]"
                                            :type="field.type || 'text'" @keyup.enter="saveEdit(field.key)"
                                            @keyup.esc="cancelEdit(field.key)" />
                                        <span v-else class="text">{{ loraInfo[field.key] }}</span>
                                    </td>
                                    <td class="actions">
                                        <button class="edit-btn" @click="toggleEdit(field.key)"
                                            :title="t('promptBox.settings.edit')">
                                            <svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16">
                                                <path v-if="isEditing[field.key]"
                                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                <path v-else
                                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            </template>

                            <!-- 用户自定义的字段 -->
                            <template v-for="(field, key) in userEditFields" :key="key">
                                <tr :class="{ 'is-editing': isEditing[key] }">
                                    <td class="label">
                                        <input v-if="isEditing[key]" v-model="field.label" type="text" />
                                        <span v-else>{{ field.label }}</span>
                                    </td>
                                    <td>
                                        <input v-if="isEditing[key]" v-model="editValues[key]"
                                            :type="field.type || 'text'" @keyup.enter="saveEdit(key)"
                                            @keyup.esc="cancelEdit(key)" />
                                        <span v-else class="text">{{ loraInfo.user_diy_fileds ?
                                            loraInfo.user_diy_fileds[key]?.value : '' }}</span>
                                    </td>
                                    <td class="actions">
                                        <button class="edit-btn" @click="toggleEdit(key)"
                                            :title="t('promptBox.settings.edit')">
                                            <svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16">
                                                <path v-if="isEditing[key]"
                                                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                <path v-else
                                                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                            </svg>
                                        </button>
                                        <button style="margin-left: 5px;color: #f87171;" @click="removeField(key)"
                                            class="edit-btn" :title="t('promptBox.settings.delete')">{{
                                            t('promptBox.settings.delete') }}</button>
                                    </td>
                                </tr>
                            </template>

                            <!-- 添加字段按钮 -->
                            <div class="field-management">
                                <button @click="addField" class="add-btn" :title="t('lora.addDiyFiled')">{{
                                    t('lora.addDiyFiled') }}</button>
                            </div>


                            <!-- 训练词 -->
                            <tr v-if="trainedWords.length" class="trained-words-row">
                                <td colspan="3">
                                    <div class="trained-words-section">
                                        <div class="trained-words-header">
                                            <div class="trained-words-label">
                                                <span>{{ t('lora.trainedWords') }}</span>
                                                <svg viewBox="0 0 24 24" width="14" height="14" class="help-icon"
                                                    :title="t('lora.trainedWordsTip')">
                                                    <path
                                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                                </svg>
                                            </div>
                                            <div v-if="selectedWords.length" class="word-selection-bar">
                                                <span>{{ t('lora.selectedWords', { count: selectedWords.length }) }}</span>
                                                <button class="copy-btn" @click="copySelectedWords">
                                                    {{ t('common.copy') }}
                                                </button>
                                            </div>
                                        </div>
                                        <div class="word-cloud">
                                            <span v-for="(word, index) in isCollapsed ? trainedWords.slice(0, 10) : trainedWords"
                                                :key="'words-' + index" class="word-tag"
                                                :class="{ 'is-selected': isWordSelected(word.word), 'is-hidden': isCollapsed && index >= 10 }"
                                                @click="toggleWordSelection(word.word)">
                                                <span class="word-text">{{ word.word }}</span>
                                                <svg v-if="word.civitai" viewBox="0 0 24 24" width="12" height="12" class="civitai-icon">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v4h3l-4 7z" />
                                                </svg>
                                                <small v-if="word.count != null" class="word-count">{{ word.count }}</small>
                                            </span>
                                        </div>
                                        <div v-if="trainedWords.length > 10" class="toggle-bar">
                                            <span class="toggle-pill" @click="toggleCollapse">
                                                {{ isCollapsed ? t('common.showMore') : t('common.showLess') }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                        </tbody>
                    </table>

                    <!-- 图片 -->
                    <ul class="lora-detail__images" v-if="loraInfo.images?.length">
                        <li v-for="(img, index) in loraInfo.images" :key="img.url || index" class="lora-detail__image-item">
                            <figure>
                                <div class="image-wrapper" @click="openPreview(img.url, img)" style="cursor: zoom-in;">
                                    <div class="image-action" @click.stop="saveLoraImg(img.url)">
                                        设置为Lora封面
                                    </div>
                                    <!-- 视频元素 -->
                                    <video
                                        :src="img.url"
                                        v-show="img.type === 'video' || isVideoUrl(img.url)"
                                        autoplay muted loop playsinline
                                        @click.stop="openPreview(img.url, img)"
                                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;"
                                    />
                                    <!-- 图片元素 -->
                                    <img
                                        :src="img.url"
                                        v-show="!(img.type === 'video' || isVideoUrl(img.url))"
                                        draggable="false"
                                        @click.stop="openPreview(img.url, img)"
                                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;"
                                    />
                                </div>

                                <figcaption class="image-info">
                                    <span v-if="img.civitaiUrl" class="info-item">
                                        <a :href="img.civitaiUrl" target="_blank" class="civitai-link">
                                            C站 civitai
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path
                                                    d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                                            </svg>
                                        </a>
                                    </span>

                                    <span v-if="img.seed" class="info-item">
                                        <label>种子 seed</label>
                                        {{ img.seed }}
                                    </span>

                                    <span v-if="img.steps" class="info-item">
                                        <label>步数 steps</label>
                                        {{ img.steps }}
                                    </span>

                                    <span v-if="img.cfg" class="info-item">
                                        <label>引导系数 cfg</label>
                                        {{ img.cfg }}
                                    </span>

                                    <span v-if="img.sampler" class="info-item">
                                        <label>采样器 sampler</label>
                                        {{ img.sampler }}
                                    </span>

                                    <span v-if="img.model" class="info-item">
                                        <label>基础模型 model</label>
                                        {{ img.model }}
                                    </span>

                                    <span v-if="img.positive" class="info-item">
                                        <label>正向提示词 positive</label>
                                        {{ img.positive }}
                                    </span>

                                    <span v-if="img.negative" class="info-item">
                                        <label>反向提示词 negative</label>
                                        {{ img.negative }}
                                    </span>
                                </figcaption>
                            </figure>
                        </li>
                    </ul>
                </div>
            </div>
        </template>
    </DraggableWindow>

    <loraRaw ref="loraRawRef" />

    <!-- 放大预览弹窗 - Teleport 到 body，脱离父级层叠上下文 -->
    <Teleport to="body">
        <div v-if="previewVisible" class="preview-overlay" @wheel="handleWheel" @mousemove="handleUnifiedMouseMove" @mouseup="handleUnifiedMouseUp" @mousedown="handlePreviewMouseDown">
            <div class="preview-container" @click.stop>
                <button class="preview-close-btn" @click.stop="closePreview" title="关闭">×</button>
                <button class="preview-set-cover-btn" @click.stop="setAsCover" title="设为Lora封面">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    <span>设为封面</span>
                </button>
                <div class="preview-click-area" @click="closePreview"></div>
                <div class="preview-hint">
                    <div>滚轮缩放 | 拖拽移动</div>
                    <div>双击重置 | 中键关闭</div>
                    <div>视频拖拽边框移动</div>
                </div>
                <div class="preview-content-wrapper" :class="{ 'is-dragging': isDraggingPreview }" :style="wrapperStyle">
                    <div class="preview-content" @mousedown="handlePreviewMouseDown" @dblclick="handlePreviewDoubleClick">
                        <div v-if="previewIsVideo" class="video-drag-frame" :style="videoFrameStyle">
                            <div class="video-drag-border top" @mousedown="handleVideoDragStart"></div>
                            <div class="video-drag-border right" @mousedown="handleVideoDragStart"></div>
                            <div class="video-drag-border bottom" @mousedown="handleVideoDragStart"></div>
                            <div class="video-drag-border left" @mousedown="handleVideoDragStart"></div>
                            <video :src="previewUrl" autoplay muted loop playsinline controls :style="videoPreviewStyle" />
                        </div>
                        <img v-else :src="previewUrl" draggable="false" :style="imgStyle" />
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DraggableWindow from '@/components/DraggableWindow.vue'
import { windowManager } from '@/utils/windowManager'
import message from '@/utils/message'
import { loraApi } from '@/api/lora'
import loraRaw from './lora_raw.vue'

const { t } = useI18n()
const loading = ref(false)
const loraInfo = ref({})
const isOpen = ref(false)
const loraContent = ref()
const fileInput = ref(null)
const loraFile = ref('')
const onDetailClose = ref(null);


const userEditFields = ref({}) // 用户自定义字段

const STORAGE_PREFIX = 'weilin_tools_'

// 默认窗口配置
const DEFAULT_WINDOWS = {
    loraDetail: {
        visible: false,
        position: { x: 150, y: 150 },
        size: { width: 800, height: 600 }
    }
}

// 从 localStorage 获取窗口状态
const getInitialWindowState = () => {
    try {
        const savedState = localStorage.getItem(`${STORAGE_PREFIX}loraDetailState`)
        if (savedState) {
            const parsedState = JSON.parse(savedState)

            // 检查并补充缺失的窗口配置
            const mergedState = { ...DEFAULT_WINDOWS }

            // 将保存的状态合并到默认配置中
            if (parsedState.loraDetail) {
                mergedState.loraDetail = {
                    ...DEFAULT_WINDOWS.loraDetail,  // 默认值
                    ...parsedState.loraDetail       // 保存的值
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
        localStorage.setItem(`${STORAGE_PREFIX}loraDetailState`, JSON.stringify(newState))
    } catch (error) {
        console.error('Error saving window states:', error)
    }
}, { deep: true })

// 组件挂载时注册窗口
onMounted(() => {
    windowManager.registerWindow('loraDetail')
})

// 组件卸载时注销窗口
onUnmounted(() => {
    windowManager.unregisterWindow('loraDetail')
})

// 关闭窗口
const closeWindow = (windowName) => {
    isOpen.value = false
    if (onDetailClose.value) {
        onDetailClose.value();
        onDetailClose.value = null;
    }
}

// 更新窗口位置
const updatePosition = (windowName, newPosition) => {
    if (windows.value[windowName]) {
        windows.value[windowName].position = { ...newPosition }
    }
}

// 更新窗口大小
const updateSize = (windowName, newSize) => {
    if (windows.value[windowName]) {
        windows.value[windowName].size = { ...newSize }
    }
}

// 打开窗口
const open = (loraData) => {
    isOpen.value = true
    windowManager.setActiveWindow('loraDetail')
    loading.value = true
    loraInfo.value = loraData
    onDetailClose.value = loraData.onClose || null;
    nextTick(() => {
        init()
    })
}

defineExpose({
    open
})

const fileURL = ref('')
const emit = defineEmits(['close', 'update'])


const loraRawRef = ref()

const openLoraRaw = (loraRawData) => {
    loraRawRef.value.open(loraRawData)
}

// 编辑状态管理
const isEditing = ref({})
const editValues = ref({})
const selectedWords = ref([])

// 可编辑字段配置
const editableFields = [
    {
        key: 'strengthMin',
        label: t('lora.strengthMin'),
        tip: t('lora.strengthMinTip'),
        type: 'number'
    },
    {
        key: 'strengthMax',
        label: t('lora.strengthMax'),
        tip: t('lora.strengthMaxTip'),
        type: 'number'
    },
    {
        key: 'strWeight',
        label: t('lora.strWeight'),
        tip: t('lora.strWeightTip'),
        type: 'number'
    },
    {
        key: 'loraWorks',
        label: t('lora.promptWords'),
        tip: t('lora.promptWordsTip')
    }
]



// 添加字段方法修改为：
const addField = () => {
    const newKey = `custom_${Date.now()}`
    if (!loraInfo.value.user_diy_fileds) {
        loraInfo.value.user_diy_fileds = {}
    }

    // 以对象形式存储字段
    userEditFields.value[newKey] = {
        label: '新字段',
        type: 'text'
    }

    // 使用结构化存储方式
    loraInfo.value.user_diy_fileds[newKey] = {
        label: '新字段',
        value: ''
    }
    editValues.value[newKey] = ''
    saveEdit(newKey)
}

// 删除字段方法修改为：
const removeField = async (key) => {
    delete userEditFields.value[key]
    delete editValues.value[key]
    if (loraInfo.value?.user_diy_fileds?.[key]) {
        delete loraInfo.value.user_diy_fileds[key]
        // console.log('Deleted field:', key, 'from user_diy_fileds:', loraInfo.value.user_diy_fileds)
    }
    await nextTick(async () => {
        await deleteInfo(key)
    })
}

// 初始化
const init = () => {
    fileURL.value = loraInfo.value.name;
    loraInfo.value = {};
    selectedWords.value = [];
    editValues.value = {
        name: false,
        nameValue: "",
        min: false,
        minValue: "",
        max: false,
        maxValue: "",
        notes: false,
        notesValue: "",
        loraWorks: false,
        loraWorksValue: "",
    };
    loraApi
        .getLoraDetail({ file: fileURL.value, refresh: false, light: false })
        .then((res) => {
            // console.log(res.data.data)
            loraInfo.value = res.data;
            loraFile.value = loraInfo.value.file || '';
            nextTick(function () {
                var _j, _k, _u, _v, _w, _x;
                loraInfo.value.name =
                    loraInfo.value.name ||
                    ((_k =
                        (_j = loraInfo.value.raw) === null || _j === void 0
                            ? void 0
                            : _j.metadata) === null || _k === void 0
                        ? void 0
                        : _k.ss_output_name === void 0
                            ? _k["modelspec.title"]
                            : _k.ss_output_name) ||
                    "";
                editValues.value.nameValue = loraInfo.value.name;
                loraInfo.value.strengthMin =
                    (_u = loraInfo.value.strengthMin) !== null && _u !== void 0
                        ? _u
                        : "";
                editValues.value.minValue = loraInfo.value.strengthMin;
                loraInfo.value.strengthMax =
                    (_v = loraInfo.value.strengthMax) !== null && _v !== void 0
                        ? _v
                        : "";
                editValues.value.maxValue = loraInfo.value.strengthMax;
                loraInfo.value.userNote =
                    (_w = loraInfo.value.userNote) !== null && _w !== void 0
                        ? _w
                        : "";
                editValues.value.notesValue = loraInfo.value.userNote;
                loraInfo.value.loraWorks =
                    (_x = loraInfo.value.loraWorks) !== null && _x !== void 0
                        ? _x
                        : "";
                editValues.value.loraWorksValue = loraInfo.value.loraWorks;

                if (loraInfo.value.user_diy_fileds){
                    userEditFields.value = loraInfo.value.user_diy_fileds;
                }

                loading.value = false;
            });
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
            loading.value = false;
        });
}

// 提取文件名
const extractFileNameFromUrl = (url) => {
    // 使用URLSearchParams或正则表达式来解析URL并获取路径部分
    let path = new URL(url).pathname;
    // 分割路径并取最后一部分作为文件名
    let fileName = path.split("/").pop();
    // 如果URL中包含查询参数，需要去除它们
    fileName = fileName.split("?")[0];
    return decodeURIComponent(fileName);
}

// 上传Lora图片
const saveLoraImg = async (url) => {
    try {
        const data = await fetch(url);
        const fileName = extractFileNameFromUrl(url);
        const blob = await data.blob();
        loraApi
            .postUplaodImg(blob, loraInfo.value.file, fileName)
            .then((res) => {
                // console.log(res.data.data)
                message({ type: "success", str: 'message.saveSuccess' });
            })
            .catch((err) => {
                message({ type: "warn", str: 'message.unknownError' });
            });
    } catch (error) {
        message({ type: "warn", str: 'message.unknownError' });
    }


// 本地文件选择
const triggerFileSelect = () => {
    if (fileInput.value) {
        fileInput.value.click()
    }
}

const handleLocalFileChange = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const fileName = file.name

    if (!loraFile.value) {
        loraFile.value = loraInfo.value.file || ''
    }
    if (!loraFile.value) {
        message({ type: "warn", str: 'message.unknownError' })
        return
    }

    try {
        loading.value = true
        await loraApi.postUplaodImg(file, loraFile.value, fileName)
        message({ type: "success", str: 'message.saveSuccess' })
        // 刷新详情以显示新的封面
        refreshLoraInfo()
    } catch (error) {
        console.error('上传本地封面失败:', error)
        message({ type: "warn", str: 'message.unknownError' })
    } finally {
        loading.value = false
        // 清空 input 以便可以再次选择同一文件
        if (fileInput.value) {
            fileInput.value.value = ''
        }
    }
}
}


// 计算属性
const civitaiLink = computed(() => {
    return loraInfo.value.links?.find(link => link.includes('civitai.red/models'))
})

const isCivitaiNotFound = computed(() => {
    return loraInfo.value.raw?.civitai?.error === 'Model not found'
})

const trainedWords = computed(() => {
    return loraInfo.value.trainedWords || []
})

// 方法
const refreshLoraInfo = async () => {
    const scrollPosition = loraContent.value?.scrollTop || 0
    loading.value = true;
    loraApi
        .getLoraRefresh({ file: fileURL.value })
        .then((res) => {
            // console.log(res.data.data)
            loraInfo.value = res.data;

            nextTick(function () {
                var _j, _k, _u, _v, _w, _x;
                loraInfo.value.name =
                    loraInfo.value.name ||
                    ((_k =
                        (_j = loraInfo.value.raw) === null || _j === void 0
                            ? void 0
                            : _j.metadata) === null || _k === void 0
                        ? void 0
                        : _k.ss_output_name === void 0
                            ? _k["modelspec.title"]
                            : _k.ss_output_name) ||
                    "";
                editValues.value.nameValue = loraInfo.value.name;
                loraInfo.value.strengthMin =
                    (_u = loraInfo.value.strengthMin) !== null && _u !== void 0
                        ? _u
                        : "";
                editValues.value.minValue = loraInfo.value.strengthMin;
                loraInfo.value.strengthMax =
                    (_v = loraInfo.value.strengthMax) !== null && _v !== void 0
                        ? _v
                        : "";
                editValues.value.maxValue = loraInfo.value.strengthMax;
                loraInfo.value.userNote =
                    (_w = loraInfo.value.userNote) !== null && _w !== void 0
                        ? _w
                        : "";
                editValues.value.notesValue = loraInfo.value.userNote;

                loraInfo.value.loraWorks =
                    (_x = loraInfo.value.loraWorks) !== null && _x !== void 0
                        ? _x
                        : "";
                editValues.value.loraWorksValue = loraInfo.value.loraWorks;

                if (loraInfo.value.user_diy_fileds){
                    userEditFields.value = loraInfo.value.user_diy_fileds;
                }

                loading.value = false;
            });

            nextTick(function () {
                loading.value = false;
            });

            // 恢复滚动位置
            if (loraContent.value) {
                loraContent.value.scrollTop = scrollPosition
            }

            message({ type: "success", str: 'message.dataLoaded' });
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
            loading.value = false;
        });
}

const toggleEdit = (field) => {
    // console.log('toggleEdit', isEditing.value)
    if (isEditing.value[field]) {
        saveEdit(field)
    } else {
        startEdit(field)
    }
}

const startEdit = (field) => {
    isEditing.value[field] = true
    // 区分普通字段和自定义字段
    if (field in userEditFields.value) {
        editValues.value[field] = loraInfo.value.user_diy_fileds?.[field]?.value || ''
    } else {
        editValues.value[field] = loraInfo.value[field]
    }
    // 自动聚焦输入框
    nextTick(() => {
        if (field === 'name' && nameInput.value) {
            nameInput.value.focus()
        }
    })
}

const saveEdit = (fieldKey) => {
    // console.log('saveEdit', fieldKey)

    // console.log(userEditFields.value)
    const isCustomField = fieldKey in userEditFields.value

    if (isCustomField) {
        if (!loraInfo.value.user_diy_fileds) {
            loraInfo.value.user_diy_fileds = {}
        }
        // 更新自定义字段的值
        loraInfo.value.user_diy_fileds[fieldKey] = {
            label: userEditFields.value[fieldKey].label,
            value: editValues.value[fieldKey]
        }
    } else {
        loraInfo.value[fieldKey] = editValues.value[fieldKey]
    }

    saveInfo(loraInfo.value)
    isEditing.value[fieldKey] = false
}

const cancelEdit = (field) => {
    isEditing.value[field] = false
    editValues.value[field] = loraInfo.value[field]
}

const saveInfo = (param) => {
    const scrollPosition = loraContent.value?.scrollTop || 0
    // console.log(scrollPosition)
    loading.value = true;
    loraApi
        .postLoraSave(fileURL.value, param)
        .then((res) => {
            // console.log(res.data.data)
            loraInfo.value = res.data;
            nextTick(function () {
                var _j, _k, _u, _v, _w, _x;
                loraInfo.value.name =
                    loraInfo.value.name ||
                    ((_k =
                        (_j = loraInfo.value.raw) === null || _j === void 0
                            ? void 0
                            : _j.metadata) === null || _k === void 0
                        ? void 0
                        : _k.ss_output_name === void 0
                            ? _k["modelspec.title"]
                            : _k.ss_output_name) ||
                    "";
                editValues.value.nameValue = loraInfo.value.name;
                loraInfo.value.strengthMin =
                    (_u = loraInfo.value.strengthMin) !== null && _u !== void 0
                        ? _u
                        : "";
                editValues.value.minValue = loraInfo.value.strengthMin;
                loraInfo.value.strengthMax =
                    (_v = loraInfo.value.strengthMax) !== null && _v !== void 0
                        ? _v
                        : "";
                editValues.value.maxValue = loraInfo.value.strengthMax;
                loraInfo.value.userNote =
                    (_w = loraInfo.value.userNote) !== null && _w !== void 0
                        ? _w
                        : "";
                editValues.value.notesValue = loraInfo.value.userNote;

                loraInfo.value.loraWorks =
                    (_x = loraInfo.value.loraWorks) !== null && _x !== void 0
                        ? _x
                        : "";
                editValues.value.loraWorksValue = loraInfo.value.loraWorks;

                if (loraInfo.value.user_diy_fileds){
                    userEditFields.value = loraInfo.value.user_diy_fileds;
                }

                loading.value = false;

                nextTick(function () {
                    // 恢复滚动位置
                    if (loraContent.value) {
                        loraContent.value.scrollTop = scrollPosition
                    }
                });
            });

            message({ type: "success", str: 'message.saveSuccess' });
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
            // console.log(err)
            loading.value = false;
        });
}


const deleteInfo = async (param) => {
    const scrollPosition = loraContent.value?.scrollTop || 0
    // console.log(scrollPosition)
    loading.value = true;
    await loraApi
        .postLoraDelet(fileURL.value, param)
        .then((res) => {
            // console.log(res.data.data)
            loraInfo.value = res.data;
            nextTick(function () {
                var _j, _k, _u, _v, _w, _x;
                loraInfo.value.name =
                    loraInfo.value.name ||
                    ((_k =
                        (_j = loraInfo.value.raw) === null || _j === void 0
                            ? void 0
                            : _j.metadata) === null || _k === void 0
                        ? void 0
                        : _k.ss_output_name === void 0
                            ? _k["modelspec.title"]
                            : _k.ss_output_name) ||
                    "";
                editValues.value.nameValue = loraInfo.value.name;
                loraInfo.value.strengthMin =
                    (_u = loraInfo.value.strengthMin) !== null && _u !== void 0
                        ? _u
                        : "";
                editValues.value.minValue = loraInfo.value.strengthMin;
                loraInfo.value.strengthMax =
                    (_v = loraInfo.value.strengthMax) !== null && _v !== void 0
                        ? _v
                        : "";
                editValues.value.maxValue = loraInfo.value.strengthMax;
                loraInfo.value.userNote =
                    (_w = loraInfo.value.userNote) !== null && _w !== void 0
                        ? _w
                        : "";
                editValues.value.notesValue = loraInfo.value.userNote;

                loraInfo.value.loraWorks =
                    (_x = loraInfo.value.loraWorks) !== null && _x !== void 0
                        ? _x
                        : "";
                editValues.value.loraWorksValue = loraInfo.value.loraWorks;

                if (loraInfo.value.user_diy_fileds){
                    userEditFields.value = loraInfo.value.user_diy_fileds;
                }

                loading.value = false;

                nextTick(function () {
                    // 恢复滚动位置
                    if (loraContent.value) {
                        loraContent.value.scrollTop = scrollPosition
                    }
                });
            });

            message({ type: "success", str: 'message.deleteSuccess' });
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
            // console.log(err)
            loading.value = false;
        });
}

const toggleWordSelection = (word) => {
    const index = selectedWords.value.indexOf(word)
    if (index === -1) {
        selectedWords.value.push(word)
    } else {
        selectedWords.value.splice(index, 1)
    }
}

const isWordSelected = (word) => {
    return selectedWords.value.includes(word)
}

const copySelectedWords = async () => {
    if (!selectedWords.value.length) return

    navigator.clipboard.writeText(selectedWords.value).then(
        (res) => {
            message({ type: "success", str: 'message.copySuccess' });
        },
        (err) => {
            message({ type: "warn", str: 'message.copyFailed' });
        }
    )
}

// 窗口状态管理
const isMaximized = ref(false)
const isMinimized = ref(false)

// 窗口控制方法
const maximize = () => {
    isMaximized.value = !isMaximized.value
    isMinimized.value = false
}

const minimize = () => {
    isMinimized.value = !isMinimized.value
    isMaximized.value = false
}

// 状态文本
const statusText = computed(() => {
    if (loading.value) return t('common.loading')
    return t('common.ready')
})


const isCollapsed = ref(true); // 添加展开/收起状态

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
}

// ========== 图片/视频放大预览 ==========
const previewVisible = ref(false)
const previewUrl = ref('')
const previewIsVideo = ref(false)

// 缩放和拖拽状态
const previewScale = ref(1)
const previewTranslateX = ref(0)
const previewTranslateY = ref(0)
const previewImgWidth = ref(0)
const previewImgHeight = ref(0)
const isDraggingPreview = ref(false)
const isScaling = ref(false)
let scaleTimeout = null
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartTranslateX = ref(0)
const dragStartTranslateY = ref(0)

// 计算属性：图片样式（transform 缩放）
const imgStyle = computed(() => ({
    transform: `scale(${previewScale.value})`,
    transformOrigin: 'center center',
    transition: isScaling.value && !isDraggingPreview.value ? 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
}))

// 视频预览样式
const videoPreviewStyle = computed(() => ({
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain',
    transition: isScaling.value ? 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
}))

// 视频边框容器样式：只包含缩放
const videoFrameStyle = computed(() => ({
    transform: `scale(${previewScale.value})`,
    transformOrigin: 'center center',
    transition: isScaling.value && !isDraggingPreview.value ? 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
}))

// 计算属性：wrapper 样式（transform 平移）
const wrapperStyle = computed(() => ({
    transform: `translate(${previewTranslateX.value}px, ${previewTranslateY.value}px)`,
    transition: isDraggingPreview.value ? 'none' : 'transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
}))

// 打开预览
const openPreview = (url, imgData) => {
    previewUrl.value = url
    previewIsVideo.value = (imgData && imgData.type === 'video') || isVideoUrl(url)
    previewVisible.value = true
    // 重置缩放和位置
    previewScale.value = 1
    previewTranslateX.value = 0
    previewTranslateY.value = 0
    // 初始化图片尺寸
    previewImgWidth.value = window.innerWidth * 0.8
    previewImgHeight.value = window.innerHeight * 0.8
    // 如果是图片，加载后获取实际尺寸
    if (!previewIsVideo.value) {
        const img = new Image()
        img.onload = () => {
            const maxWidth = window.innerWidth * 0.8
            const maxHeight = window.innerHeight * 0.8
            const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1)
            previewImgWidth.value = img.naturalWidth * scale
            previewImgHeight.value = img.naturalHeight * scale
        }
        img.src = url
    }
}

// 关闭预览
const closePreview = () => {
    previewVisible.value = false
    previewUrl.value = ''
    previewIsVideo.value = false
    previewScale.value = 1
    previewTranslateX.value = 0
    previewTranslateY.value = 0
}

// ESC 键关闭预览
const handleKeyDown = (e) => {
    if (e.key === 'Escape' && previewVisible.value) {
        e.preventDefault()
        e.stopPropagation()
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation()
        }
        closePreview()
    }
}

watch(previewVisible, (val) => {
    if (val) {
        window.addEventListener('keydown', handleKeyDown, true)
    } else {
        window.removeEventListener('keydown', handleKeyDown, true)
    }
})

// 滚轮缩放
const handleWheel = (e) => {
    e.preventDefault()
    // 启用缩放过渡动画
    isScaling.value = true
    if (scaleTimeout) clearTimeout(scaleTimeout)
    scaleTimeout = setTimeout(() => {
        isScaling.value = false
    }, 100)

    const oldScale = previewScale.value
    const delta = e.deltaY > 0 ? -0.12 : 0.12

    // 视频模式限制缩放范围 0.5 ~ 3，图片模式 0.15 ~ 6
    const minScale = previewIsVideo.value ? 0.5 : 0.15
    const maxScale = previewIsVideo.value ? 3 : 6
    const newScale = Math.max(minScale, Math.min(maxScale, oldScale + delta))

    if (oldScale !== newScale) {
        if (!previewIsVideo.value) {
            // 图片模式：以鼠标位置为中心缩放
            const rect = e.currentTarget.getBoundingClientRect()
            const mouseX = e.clientX - rect.left - rect.width / 2
            const mouseY = e.clientY - rect.top - rect.height / 2
            const scaleRatio = newScale / oldScale
            previewTranslateX.value = mouseX - (mouseX - previewTranslateX.value) * scaleRatio
            previewTranslateY.value = mouseY - (mouseY - previewTranslateY.value) * scaleRatio
        }
        // 视频模式：只改变缩放值，不修改平移位置（视频始终居中）
        previewScale.value = newScale
    }
}

// 拖拽功能 - 阻止浏览器默认拖拽行为
const handlePreviewMouseDown = (e) => {
    // 鼠标中键(滚轮键)点击关闭预览
    if (e.button === 1) {
        e.preventDefault()
        closePreview()
        return
    }
    // 视频模式下：只有边框能拖拽，视频本体不响应
    if (previewIsVideo.value) return
    // 图片模式：正常拖拽
    e.preventDefault()
    isDraggingPreview.value = true
    isScaling.value = false // 拖拽时禁用缩放过渡
    if (scaleTimeout) clearTimeout(scaleTimeout)
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    dragStartTranslateX.value = previewTranslateX.value
    dragStartTranslateY.value = previewTranslateY.value
}

// 统一的鼠标移动处理（用于 overlay）
const handleUnifiedMouseMove = (e) => {
    if (!isDraggingPreview.value) return
    e.preventDefault()
    const dx = e.clientX - dragStartX.value
    const dy = e.clientY - dragStartY.value
    previewTranslateX.value = dragStartTranslateX.value + dx
    previewTranslateY.value = dragStartTranslateY.value + dy
}

// 统一的鼠标松开处理
const handleUnifiedMouseUp = () => {
    isDraggingPreview.value = false
}

// 视频边框拖拽启动
const handleVideoDragStart = (e) => {
    if (!previewIsVideo.value) return
    // 确保点击的是边框元素
    if (!e.target.classList.contains('video-drag-border')) return
    e.preventDefault()
    e.stopPropagation()
    isDraggingPreview.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    dragStartTranslateX.value = previewTranslateX.value
    dragStartTranslateY.value = previewTranslateY.value
}

// 双击重置
const handlePreviewDoubleClick = () => {
    isScaling.value = true
    previewScale.value = 1
    previewTranslateX.value = 0
    previewTranslateY.value = 0
    setTimeout(() => { isScaling.value = false }, 100)
}

// 将当前预览的图片/视频设为 Lora 封面
const setAsCover = async () => {
    if (!previewUrl.value) {
        message({ type: "warn", str: 'message.unknownError' });
        return;
    }
    if (!loraFile.value) {
        message({ type: "warn", str: 'message.unknownError' });
        return;
    }
    try {
        let blob, fileName
        const url = previewUrl.value

        // 处理 base64 图片
        if (url.startsWith('data:')) {
            const arr = url.split(',')
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }
            blob = new Blob([u8arr], { type: mime })
            fileName = extractFileNameFromUrl(url)
        } else {
            const data = await fetch(url)
            if (!data.ok) {
                throw new Error('fetch failed: ' + data.status)
            }
            blob = await data.blob()
            fileName = extractFileNameFromUrl(url)
        }

        await loraApi.postUplaodImg(blob, loraFile.value, fileName)
        message({ type: "success", str: 'message.saveSuccess' })
        // 刷新详情
        refreshLoraInfo()
    } catch (error) {
        console.error('setAsCover error:', error)
        message({ type: "warn", str: 'message.unknownError' })
    }
}

// 辅助函数：供图片 hover 使用
const handleCardEnter = () => {
    // 保留占位，避免在 detail 窗口中需要特殊 hover 行为
}

const isVideoUrl = (url) => {
    if (!url) return false
    const urlLower = url.toLowerCase()
    return url.startsWith('data:video/') || 
           urlLower.endsWith('.mp4') ||
           urlLower.includes('.mp4') ||
           urlLower.includes('fmt=mp4') ||
           urlLower.endsWith('.webm') ||
           urlLower.endsWith('.mov')
}

</script>

<style scoped>
.lora-detail {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--weilin-prompt-ui-primary-text);
}

/* 标题区域：标题和按钮并排 */
.lora-detail__title-area {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin-bottom: 20px;
}

/* 选择本地封面按钮 */
.local-cover-btn {
    position: relative;
    width: auto;
    height: 28px;
    padding: 0 10px;
    border-radius: 14px;
    background-color: rgba(187, 187, 187, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
}

.local-cover-btn:hover {
    background-color: var(--weilin-prompt-ui-primary-color);
    color: #fff;
}

.local-cover-btn svg {
    fill: currentColor;
}

.lora-detail__content {
    height: 100%;
    padding: 20px;
    overflow-y: auto;
    color: var(--weilin-prompt-ui-primary-text);
}

.svg-icon {
    fill: var(--weilin-prompt-ui-primary-text);
}

.lora-detail__loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.lora-detail__body {
    height: 100%;
}

/* 表格样式 */
.lora-detail__table {
    width: 100%;
    border-collapse: collapse;
}

.lora-detail__table td {
    padding: 12px;
    border-bottom: 1px solid var(--weilin-prompt-ui-border);
}

.lora-detail__table td.label {
    width: 180px;
    color: var(--weilin-prompt-ui-label);
    font-weight: 500;
}

.lora-detail__table td.actions {
    width: 130px;
    text-align: right;
    display: flex;
    flex-direction: row;
    align-items: center;
}

/* 标签样式 */
.lora-detail__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.lora-detail__tag {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
}

/* 按钮样式 */
.edit-btn,
.refresh-btn,
.fetch-btn,
.copy-btn {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    background: var(--weilin-prompt-ui-button-bg);
    color: var(--weilin-prompt-ui-button-text);
    cursor: pointer;
    transition: all 0.3s;
}

.lora-raw-btn {
    padding: 0 10px;
    height: 28px;
    border-radius: 14px;
    background-color: rgba(187, 187, 187, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
    border: none;
}

.lora-raw-btn:hover {
    background-color: rgba(255, 255, 255, 0.7);
    transform: scale(1.02);
}

.edit-btn:hover,
.refresh-btn:hover,
.fetch-btn:hover,
.copy-btn:hover {
    background: var(--weilin-prompt-ui-button-hover);
}

/* 输入框样式 */
input {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    background-color: var(--weilin-prompt-ui-input-bg);
    color: var(--weilin-prompt-ui-input-text);
}

input:focus {
    border-color: var(--weilin-prompt-ui-primary);
    outline: none;
}

/* 词列表样式 */
.word-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.word-item {
    padding: 4px 12px;
    border-radius: 16px;
    background: var(--weilin-prompt-ui-tag-bg);
    color: var(--weilin-prompt-ui-tag-text);
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 4px;
}

.word-item:hover {
    background: var(--weilin-prompt-ui-tag-hover);
}

.word-item.is-selected {
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
}

/* ========== 训练词卡片式布局 ========== */
.trained-words-row td {
    padding: 12px 12px 8px 12px !important;
    border-bottom: none !important;
}

.trained-words-section {
    padding: 16px 24px;
    background: var(--weilin-prompt-ui-tag-bg);
    border-radius: 12px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    display: block;
    box-sizing: border-box;
}

.trained-words-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 12px;
}

.trained-words-label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--weilin-prompt-ui-label);
    font-weight: 500;
    font-size: 14px;
    flex-shrink: 0;
}

.trained-words-label .help-icon {
    fill: var(--weilin-prompt-ui-label);
    opacity: 0.7;
    width: 14px;
    height: 14px;
}

.word-selection-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--weilin-prompt-ui-label);
    margin-left: auto;
}

.word-selection-bar .copy-btn {
    padding: 3px 10px;
    font-size: 11px;
    border-radius: 10px;
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.word-selection-bar .copy-btn:hover {
    opacity: 0.85;
}

/* 词云布局 - 居中对齐 */
.word-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 10px;
    justify-content: center;
    align-items: center;
}

.word-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 14px;
    height: 30px;
    border-radius: 15px;
    background: #fff;
    color: #222;
    border: 1px solid rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    max-width: 100%;
    user-select: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.word-tag:hover {
    background: #f5f5f5;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.word-tag.is-selected {
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
    border-color: var(--weilin-prompt-ui-primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.word-tag.is-selected .civitai-icon {
    fill: #fff;
    opacity: 0.95;
}

.word-tag.is-hidden {
    display: none;
}

.word-tag .word-text {
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
    display: inline-flex;
    align-items: center;
}

.word-tag .civitai-icon {
    fill: var(--weilin-prompt-ui-primary-color);
    opacity: 0.9;
    flex-shrink: 0;
    width: 12px;
    height: 12px;
}

.word-tag .word-count {
    color: #666;
    font-size: 11px;
    flex-shrink: 0;
    padding: 1px 6px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.06);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    font-weight: 500;
}

.word-tag.is-selected .word-count {
    background: rgba(255, 255, 255, 0.22);
    color: rgba(255, 255, 255, 0.95);
}

/* 展开收起横条 */
.toggle-bar {
    display: flex;
    justify-content: center;
    margin-top: 14px;
}

.toggle-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    height: 30px;
    border-radius: 15px;
    background: #fff;
    color: var(--weilin-prompt-ui-primary-color);
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    user-select: none;
}

.toggle-pill:hover {
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
    border-color: var(--weilin-prompt-ui-primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.is-rotating {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* 图片列表容器 */
.lora-detail__images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
    list-style: none;
    margin: 0;
}

/* 单个图片项 */
.lora-detail__image-item {
    position: relative;
    background: var(--weilin-prompt-ui-secondary-bg);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px var(--weilin-prompt-ui-shadow-color);
    transition: transform 0.3s ease;
}

.lora-detail__image-item:hover {
    transform: translateY(-2px);
}

/* 图片包装器 */
.image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 100%;
    /* 1:1 宽高比 */
    overflow: hidden;
}

.image-wrapper img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.image-wrapper:hover img {
    transform: scale(1.05);
}

/* 图片操作按钮 */
.image-action {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    opacity: 0;
    transition: all 0.3s ease;
    cursor: pointer;
    font-size: 13px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1;
}

.image-wrapper:hover .image-action {
    opacity: 1;
}

.image-action:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-1px);
}

/* 图片信息区域 */
.image-info {
    padding: 16px;
    background: var(--weilin-prompt-ui-secondary-bg);
}

/* 信息项 */
.info-item {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--weilin-prompt-ui-secondary-text);
    word-break: break-all;
}

.info-item:last-child {
    margin-bottom: 0;
}

/* 信息标签 */
.info-item label {
    display: inline-block;
    color: var(--weilin-prompt-ui-label);
    margin-right: 8px;
    font-weight: 500;
}

/* Civitai链接样式 */
.civitai-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--weilin-prompt-ui-primary-color);
    text-decoration: none;
    transition: opacity 0.3s ease;
}

.civitai-link:hover {
    opacity: 0.8;
}

.civitai-icon {
    fill: currentColor;
}

/* 提示词区域样式 */
.info-item:has(label:contains("正向提示词")),
.info-item:has(label:contains("反向提示词")) {
    background: var(--weilin-prompt-ui-tag-bg);
    padding: 8px;
    border-radius: 4px;
    margin-top: 12px;
}

/* 图片参数信息网格布局 */
.image-params {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
}

.param-item {
    background: var(--weilin-prompt-ui-tag-bg);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .lora-detail__images {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        padding: 16px;
    }

    .image-info {
        padding: 12px;
    }
}

/* ========== 预览弹窗样式 ========== */
.preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: zoom-out;
    pointer-events: auto;
}

.preview-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    z-index: 1001;
}

.preview-click-area {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    cursor: zoom-out;
}

.preview-close-btn {
    position: fixed;
    top: 60px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #fff;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1002;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.preview-close-btn:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
}

.preview-set-cover-btn {
    position: fixed;
    top: 60px;
    right: 72px;
    height: 44px;
    padding: 0 16px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #fff;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    z-index: 1003;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.preview-set-cover-btn:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
}

.preview-set-cover-btn svg {
    fill: currentColor;
    flex-shrink: 0;
}

.preview-hint {
    position: fixed;
    top: 120px;
    right: 4px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    line-height: 1.7;
    text-align: right;
    pointer-events: none;
    z-index: 1002;
    background: rgba(0, 0, 0, 0.5);
    padding: 6px 8px;
    border-radius: 4px;
    white-space: nowrap;
}

.preview-content-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    will-change: transform;
}

.preview-content-wrapper.is-dragging {
    cursor: grabbing;
}

.preview-content {
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-content img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    cursor: grab;
    user-select: none;
    -webkit-user-drag: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    will-change: transform;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    box-shadow: 0 8px 64px rgba(0, 0, 0, 0.5);
}

/* 视频预览 - 带可拖拽的边框 */
.video-drag-frame {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.video-drag-border {
    position: absolute;
    background: transparent;
    z-index: 2;
}

.video-drag-border.top {
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
    cursor: ns-resize;
}

.video-drag-border.bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    cursor: ns-resize;
}

.video-drag-border.left {
    top: 0;
    bottom: 0;
    left: 0;
    width: 20px;
    cursor: ew-resize;
}

.video-drag-border.right {
    top: 0;
    bottom: 0;
    right: 0;
    width: 20px;
    cursor: ew-resize;
}

.video-drag-border:hover {
    background: rgba(255, 255, 255, 0.05);
}

.video-drag-frame video {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    box-shadow: 0 8px 64px rgba(0, 0, 0, 0.5);
    user-select: none;
    -webkit-user-drag: none;
}

/* 响应式：小屏设备 */
@media (max-width: 768px) {
    .preview-close-btn {
        width: 36px;
        height: 36px;
        font-size: 22px;
        top: 12px;
        right: 12px;
    }

    .preview-set-cover-btn {
        padding: 8px 14px;
        font-size: 12px;
        top: 12px;
        right: 60px;
    }

    .preview-hint {
        font-size: 10px;
        bottom: 12px;
    }
}
</style>