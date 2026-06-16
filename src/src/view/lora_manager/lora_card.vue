<template>
    <div class="lora_catd_content" :style="'left: ' + paddingLeft + 'px;top: '+paddingTop+'px;'" @mouseenter="handleCardEnter"
        @mouseleave="handleCardLeave" style="font-size: 0.55em;">
        <!-- 添加关闭按钮 -->
        <div class="close-button" @click="handleCardLeave" title="关闭">
            <span>×</span>
        </div>

        <!-- 本地文件选择 input（隐藏） -->
        <input
            ref="fileInput"
            type="file"
            accept="image/*,video/*"
            style="display: none"
            @change="handleLocalFileChange"
        />

        

        <!-- 内容区域 -->
        <div class="lora-detail__content" ref="loraContent">

            <div v-if="loading" class="lora-detail__loading">
                <svg viewBox="0 0 24 24" width="24" height="24" class="is-rotating">
                    <path d="M12 4V2C6.48 2 2 6.48 2 12H4C4 7.58 7.58 4 12 4Z" />
                </svg>
            </div>

            <div class="lora-detail__body">
                <!-- 标题 -->
                <div class="lora-detail__title-area">
                            <div class="lora-detail__title">Lora 信息</div>
                            <div class="title-actions">
                                <div class="local-cover-btn" @click="triggerFileSelect" title="选择本地图片/视频作为封面">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H8l4-4 4 4h-2z"/>
                                    </svg>
                                    <span>本地封面</span>
                                </div>
                                <div class="open-detail-btn" @click="openDetail" title="打开详情窗口">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                    </svg>
                                    <span>详情</span>
                                </div>
                            </div>
                        </div>

                <!-- 标签区域 -->
                <ul class="lora-detail__tags">
                    <li v-if="loraInfo.type" class="lora-detail__tag" :class="`-type-${loraInfo.type.toLowerCase()}`"
                        :title="t('lora.type')">
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
                            <td colspan="2">{{ loraInfo.file }}</td>
                        </tr>

                        <!-- Hash值 -->
                        <tr>
                            <td class="label">{{ t('lora.hash') }}</td>
                            <td colspan="2">
                                <span class="text hash-text">{{ loraInfo.sha256 }}</span>
                            </td>
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
                            <td colspan="2">
                                <input v-if="isEditing.name" v-model="editValues.name" type="text"
                                    @keyup.enter="saveEdit('name')" @keyup.esc="cancelEdit('name')" ref="nameInput" />
                                <span v-else class="text">{{ loraInfo.name }}</span>
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
                                    <svg v-if="field.tip" viewBox="0 0 24 24" width="16" height="16" class="help-icon"
                                        :title="field.tip">
                                        <path
                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                    </svg>
                                </td>
                                <td>
                                    <span class="text">{{ loraInfo[field.key] }}</span>
                                </td>
                                <td class="actions">
                                    <button class="copy-btn" @click="copyToClipboard(loraInfo[field.key])"
                                        :title="t('lora.copy')">
                                        <svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                        </svg>
                                        {{ t('lora.copy') }}
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
                                    <span class="text">{{ loraInfo.user_diy_fileds ?
                                        loraInfo.user_diy_fileds[key]?.value : '' }}</span>
                                </td>
                                <td class="actions">
                                    <button class="copy-btn" @click="copyToClipboard(loraInfo.user_diy_fileds[key]?.value)"
                                        :title="t('lora.copy')">
                                        <svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                        </svg>
                                        {{ t('lora.copy') }}
                                    </button>
                                </td>
                            </tr>
                        </template>

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
                <ul class="lora-detail__images" v-if="loraInfo.images?.length" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <li v-for="(img, index) in loraInfo.images" :key="index" class="lora-detail__image-item">
                        <div class="image-wrapper" style="height: 200px; cursor: zoom-in; position: relative;" @click="openPreview(img.url, img)">
                            <!-- 本地封面标志 -->
                            <div v-if="isLocalCover(img.url)" class="local-cover-badge" title="本地封面">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                                <span>本地</span>
                            </div>
                            <video v-if="img.type === 'video' || isVideoUrl(img.url)" :src="img.url" autoplay muted loop playsinline @mouseenter="handleCardEnter" @click.stop="openPreview(img.url, img)" @error="handleVideoError" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;" />
                            <img v-else :src="img.url" @mouseenter="handleCardEnter" @click.stop="openPreview(img.url, img)" draggable="false" style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;" />
                        </div>
                    </li>
                </ul>

                <!-- 放大预览弹窗 -->
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
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import message from '@/utils/message'
import { loraApi } from '@/api/lora'

const { t } = useI18n()
const loading = ref(false)
const loraInfo = ref({})
const loraContent = ref()


const userEditFields = ref({}) // 用户自定义字段

const props = defineProps({
    fileNmae: {
        type: String,
        required: true
    },
    paddingLeft: {
        type: Number,
        required: false,
        default: 100
    },
    paddingTop: {
        type: Number,
        required: false,
        default: 100
    },
})

const fileURL = ref('')
const loraFile = ref('')
const currentRequestFile = ref('')
const emit = defineEmits(['cardLeave', 'cardenter', 'openDetail'])

// 本地文件选择
const fileInput = ref(null)

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
        message({ type: "warn", str: 'message.unknownError' })
        return
    }

    try {
        loading.value = true
        await loraApi.postUplaodImg(file, loraFile.value, fileName)
        message({ type: "success", str: 'message.saveSuccess' })
        // 刷新详情以显示新的封面
        refresh()
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

const openDetail = () => {
    emit('openDetail', { name: loraFile.value || fileURL.value })
    handleCardLeave()
}

const handleCardLeave = () => {
    isMouseInCard.value = false
    // 如果预览放大弹窗打开，不关闭悬浮窗口
    if (previewVisible.value) return
    // 如果选区在卡片内部，不关闭悬浮窗口
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const cardEl = loraContent.value
        if (cardEl && (cardEl.contains(range.startContainer) || cardEl.contains(range.endContainer))) {
            return
        }
    }
    emit('cardLeave')
}
const handleCardEnter = () => {
    isMouseInCard.value = true
    emit('cardenter')
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

// 监听 fileNmae 变化，立即重新加载
watch(() => props.fileNmae, (newFile, oldFile) => {
    if (newFile && newFile !== oldFile) {
        init();
    }
});

// 跟踪鼠标是否在卡片内
const isMouseInCard = ref(false)

onMounted(() => {
    init()
})

// 初始化
const init = () => {
    const targetFile = props.fileNmae;
    fileURL.value = targetFile;
    currentRequestFile.value = targetFile;
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
        .getLoraDetail({ file: targetFile, refresh: false, light: false })
        .then((res) => {
            // 如果当前悬浮窗口已经切换到其他lora，丢弃旧数据
            if (currentRequestFile.value !== targetFile) {
                console.log('丢弃过期响应:', targetFile);
                return;
            }
            loraInfo.value = res.data;
            // 保存当前 lora 文件路径，用于设为封面
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

                userEditFields.value = loraInfo.value.user_diy_fileds;

                loading.value = false;
            });
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
            loading.value = false;
        });
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      message({ type: "success", str: "已复制到剪贴板" });
    })
    .catch(err => {
    //   console.error("复制失败:", err);
      message({ type: "error", str: "复制失败" });
    });
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
                var _j, _k, _u, _v, _w;
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
            // 保存当前 lora 文件路径，用于设为封面
            loraFile.value = loraInfo.value.file || '';
            nextTick(function () {
                var _j, _k, _u, _v, _w;
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
            // 保存当前 lora 文件路径，用于设为封面
            loraFile.value = loraInfo.value.file || '';
            nextTick(function () {
                var _j, _k, _u, _v, _w;
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
            // 计算适应屏幕的初始尺寸
            const maxWidth = window.innerWidth * 0.8
            const maxHeight = window.innerHeight * 0.8
            const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1)
            previewImgWidth.value = img.naturalWidth * scale
            previewImgHeight.value = img.naturalHeight * scale
        }
        img.src = url
    }
}

const closePreview = () => {
    previewVisible.value = false
    previewUrl.value = ''
    previewIsVideo.value = false
    previewScale.value = 1
    previewTranslateX.value = 0
    previewTranslateY.value = 0
}

// 缩放功能
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

const handlePreviewMouseMove = (e) => {
    if (!isDraggingPreview.value) return
    e.preventDefault()
    const dx = e.clientX - dragStartX.value
    const dy = e.clientY - dragStartY.value
    previewTranslateX.value = dragStartTranslateX.value + dx
    previewTranslateY.value = dragStartTranslateY.value + dy
}

const handlePreviewMouseUp = () => {
    isDraggingPreview.value = false
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
    // 双击重置缩放和位置
    isScaling.value = true
    previewScale.value = 1
    previewTranslateX.value = 0
    previewTranslateY.value = 0
    setTimeout(() => { isScaling.value = false }, 100)
}

const refresh = () => {
    // 清空当前请求标记，强制重新加载
    currentRequestFile.value = '';
    init()
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
        // 刷新详情以显示新的封面
        refresh()
    } catch (error) {
        console.error('setAsCover error:', error)
        message({ type: "warn", str: 'message.unknownError' })
    }
}

const extractFileNameFromUrl = (url) => {
    if (!url) return 'cover.jpg'
    // 处理 base64 / blob URL
    if (url.startsWith('data:') || url.startsWith('blob:')) {
        return 'cover.jpg'
    }
    try {
        let path = new URL(url).pathname
        let fileName = path.split("/").pop()
        fileName = fileName.split("?")[0]
        return decodeURIComponent(fileName) || 'cover.jpg'
    } catch (e) {
        return 'cover.jpg'
    }
}

const isVideoUrl = (url) => {
    if (!url) return false
    return url.startsWith('data:video/') || 
           url.toLowerCase().endsWith('.mp4') ||
           url.toLowerCase().includes('.mp4') ||
           url.toLowerCase().includes('fmt=mp4')
}

const handleVideoError = (e) => {
    console.error('视频加载失败:', e.target.src)
}

const isLocalCover = (url) => {
    if (!url) return false
    return url.includes('lorainfo/api/loras/img')
}

defineExpose({
    refresh,
    previewVisible
})

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

.lora-detail__content {
    height: 100%;
    padding: 20px;
    overflow-y: auto;
    color: var(--weilin-prompt-ui-primary-text);
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


.svg-icon {
    fill: var(--weilin-prompt-ui-primary-text);
}

.lora-detail__body {
    height: 100%;
}

/* 表格样式 */
.lora-detail__table {
    width: 100%;
    table-layout: fixed;
    word-wrap: break-word;
    border-collapse: collapse;
    font-size: 0.55em;
}

.lora-detail__table td {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 12px;
    border-bottom: 1px solid var(--weilin-prompt-ui-border);

}

.lora-detail__table td.label {
    color: var(--weilin-prompt-ui-label);
    font-weight: 500;
    width: 120px;
    min-width: 120px;
}

/* 处理长文本 */
.lora-detail__table .hash {
  display: block;
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

.lora-detail__table .text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

.lora-detail__table .hash-text {
  white-space: normal;
  word-break: break-all;
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

.lora-detail__title {
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
}

/* 标题区域：标题和按钮并排 */
.lora-detail__title-area {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: nowrap;
}

.lora-detail__title-area .lora-detail__title {
    flex-shrink: 0;
}



.lora-detail__tag {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.55em;
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
    font-size: 0.55em;
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
/* 训练词模块 */
.trained-words-row {
    /* border-top: 1px solid var(--weilin-prompt-ui-border); */
}

.trained-words-section {
    padding: 12px 0;
}

.trained-words-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
}

.trained-words-label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--weilin-prompt-ui-label);
    font-weight: 500;
    font-size: 0.55em;
}

.trained-words-label .help-icon {
    fill: var(--weilin-prompt-ui-label);
    opacity: 0.7;
}

.word-selection-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.55em;
    color: var(--weilin-prompt-ui-secondary-text);
}

.word-selection-bar .copy-btn {
    padding: 2px 8px;
    font-size: 11px;
}

/* 词云布局 */
.word-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
}

.word-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 16px;
    background: var(--weilin-prompt-ui-tag-bg);
    color: var(--weilin-prompt-ui-tag-text);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.55em;
    border: 1px solid transparent;
    user-select: none;
}

.word-tag:hover {
    background: var(--weilin-prompt-ui-tag-hover);
    border-color: var(--weilin-prompt-ui-border-color);
    transform: translateY(-1px);
}

.word-tag.is-selected {
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
    border-color: var(--weilin-prompt-ui-primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.word-tag.is-hidden {
    display: none;
}

.word-tag .word-text {
    line-height: 1.2;
}

.word-tag .civitai-icon {
    fill: currentColor;
    opacity: 0.8;
}

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

.word-tag .word-count {
    opacity: 0.7;
    font-size: 0.9em;
    margin-left: 2px;
}

/* 展开/收起按钮 */
.toggle-bar {
    display: flex;
    justify-content: center;
    padding: 4px 0;
}

.toggle-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 16px;
    border-radius: 12px;
    background: var(--weilin-prompt-ui-tag-bg);
    color: var(--weilin-prompt-ui-primary-color);
    font-size: 0.55em;
    transition: all 0.2s ease;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    cursor: pointer;
}

.toggle-pill:hover {
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
    border-color: var(--weilin-prompt-ui-primary-color);
}

.toggle-btn {
    cursor: pointer;
    color: var(--primary-color);
    text-align: center;
    padding: 4px;
    margin-top: 8px;
}

.toggle-btn:hover {
    text-decoration: underline;
}

/* 添加关闭按钮样式 */
.close-button {
    position: absolute;
    top: 10px;
    right: 24px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(187, 187, 187, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.close-button:hover {
    background-color: rgba(255, 0, 0, 0.8);
    color: white;
}

.close-button span {
    font-size: 18px;
    line-height: 18px;
    font-weight: bold;
}


.lora_catd_content {
    position: fixed;
    width: 520px;
    height: 400px;
    z-index: 999999999;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background-color: var(--weilin-prompt-ui-primary-bg);
    padding: 6px;
    box-sizing: border-box;
    font-size: 0.55em;
    overflow: hidden;
}

/* 放大预览弹窗样式 */
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
    z-index: 2147483647;
    /* 使用最大可能的 z-index 值 */
    cursor: zoom-out;
    pointer-events: auto;
    /* 确保 Teleport 后的元素也能继承 scoped 样式 */
}

.preview-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    z-index: 2147483648;
    /* 比 overlay 更高 */
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
    z-index: 2147483649;
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
    z-index: 2147483649;
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
    z-index: 2147483647;
    background: rgba(0, 0, 0, 0.5);
    padding: 6px 8px;
    border-radius: 4px;
    white-space: nowrap;
}

.preview-content-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
}

.preview-content-wrapper.is-scaling {
    transition: transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
}

.preview-content img:active {
    cursor: grabbing;
}

.preview-content-wrapper.is-dragging img {
    transition: none;
}

/* 视频拖拽边框 */
.video-drag-frame {
    position: relative;
    display: inline-block;
    padding: 12px;
    margin: -12px;
}

.video-drag-border {
    position: absolute;
    z-index: 10;
    background: transparent;
}

.video-drag-border.top {
    top: 0;
    left: 12px;
    right: 12px;
    height: 12px;
    cursor: move;
}

.video-drag-border.right {
    top: 12px;
    right: 0;
    bottom: 12px;
    width: 12px;
    cursor: move;
}

.video-drag-border.bottom {
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 12px;
    cursor: move;
}

.video-drag-border.left {
    top: 12px;
    left: 0;
    bottom: 12px;
    width: 12px;
    cursor: move;
}

.video-drag-border:hover {
    background: rgba(255, 255, 255, 0.25);
}

.video-drag-frame video {
    display: block;
    pointer-events: auto;
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
    flex-shrink: 0;
}

/* 标题操作按钮容器 */
.title-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

/* 打开详情按钮 */
.open-detail-btn {
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

.open-detail-btn:hover {
    background-color: var(--weilin-prompt-ui-primary-color);
    color: #fff;
}

.open-detail-btn svg {
    fill: currentColor;
    flex-shrink: 0;
}

/* 本地封面标志 */
.local-cover-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 2;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.local-cover-badge svg {
    fill: currentColor;
}
</style>