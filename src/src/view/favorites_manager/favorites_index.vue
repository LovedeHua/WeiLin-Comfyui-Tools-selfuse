<template>
    <div class="container">
        <h1>{{ t('history.favorites') }}</h1>
        <div class="search-container">
            <button class="refresh-btn" @click="refreshFavorites">
                <svg viewBox="0 0 24 24" width="16" height="16" class="refresh-icon">
                    <path
                        d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
            </button>
            <input type="text" v-model="searchQuery" :placeholder="t('history.search_favorites_placeholder')"
                @input="filterFavorites" class="search-input" />

            <input type="checkbox" v-if="isDeleteBatch" v-model="selectAllTags" :value="1" class="tag-checkbox"
                @change="selectAllTagsChange" />

            <button class="add-his-btn" @click="showAddTagDialog" :title="t('history.add_new')">
                <svg viewBox="0 0 24 24" width="16" height="16" class="add-icon">
                    <path d="M19 11h-6V5c0-.55-.45-1-1-1s-1 .45-1 1v6H5c-.55 0-1 .45-1 1s.45 1 1 1h6v6c0 .55.45 1 1 1s1-.45 1-1v-6h6c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                </svg>
            </button>
            <button v-if="!isDeleteBatch" class="bulk-delete-btn" @click="bulkDelete"
                :title="t('history.bulk_delete')">
                <svg viewBox="0 0 1024 1024" width="16" height="16" class="delete-favorite-icon">
                    <path
                        d="M907.618072 232.742353 744.713682 232.742353 744.713682 116.382952c0-12.852708-10.419786-23.272495-23.272495-23.272495L302.556765 93.110457c-12.852708 0-23.272495 10.418762-23.272495 23.272495l0 116.360425L116.380904 232.743377c-12.852708 0-23.272495 10.419786-23.272495 23.272495s10.418762 23.272495 23.272495 23.272495l791.237168 0c12.852708 0 23.272495-10.419786 23.272495-23.272495S920.469756 232.742353 907.618072 232.742353zM325.829259 139.654423l372.340458 0 0 93.08793L325.829259 232.742353 325.829259 139.654423zM791.257647 372.362985c-12.852708 0-23.272495 10.418762-23.272495 23.272495l0 488.712146L256.012799 884.347625 256.012799 395.635479c0-12.852708-10.418762-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 511.983617c0 12.852708 10.418762 23.272495 23.272495 23.272495l558.516318 0c12.852708 0 23.272495-10.419786 23.272495-23.272495L814.529118 395.635479C814.529118 382.782771 804.110355 372.362985 791.257647 372.362985zM442.189684 767.987201l0-372.351721c0-12.852708-10.418762-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 372.351721c0 12.852708 10.418762 23.272495 23.272495 23.272495S442.189684 780.839909 442.189684 767.987201zM628.353257 767.987201l0-372.351721c0-12.852708-10.419786-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 372.351721c0 12.852708 10.419786 23.272495 23.272495 23.272495S628.353257 780.839909 628.353257 767.987201z">
                    </path>
                </svg>
            </button>
            <button v-if="isDeleteBatch" class="bulk-delete-btn" @click="sureDeleteFavorite"
                :title="t('history.sure_delete')" :disabled="selectedTags.length === 0">
                <svg viewBox="0 0 1024 1024" width="16" height="16" class="delete-favorite-icon">
                    <path
                        d="M392.533333 806.4L85.333333 503.466667l59.733334-59.733334 247.466666 247.466667L866.133333 213.333333l59.733334 59.733334L392.533333 806.4z">
                    </path>
                </svg>
            </button>
            <button v-if="isDeleteBatch" class="bulk-delete-btn" @click="cancelDelete"
                :title="t('history.cancel_delete')">
                <svg viewBox="0 0 1024 1024" width="16" height="16" class="delete-favorite-icon">
                    <path
                        d="M794.8 794.8c-14 14-36.9 14-50.9 0L229.2 280.1c-14-14-14-36.9 0-50.9s36.9-14 50.9 0L794.9 744c13.9 13.9 13.9 36.8-0.1 50.8z">
                    </path>
                    <path
                        d="M794.8 229.2c14 14 14 36.9 0 50.9L280.1 794.8c-14 14-36.9 14-50.9 0s-14-36.9 0-50.9L744 229.1c13.9-13.9 36.8-13.9 50.8 0.1z">
                    </path>
                </svg>
            </button>
        </div>
        <ul class="history-list">
            <li v-for="item in filteredFavorites" :key="item.id_index" class="history-item">
                <div class="favor-name-box" :style="{ backgroundColor: item.color || 'transparent' }" >
                    <span class="favor-name" v-if="item.name.length > 0">{{ item.name }}</span>
                </div>
                <span>{{ retPromptInfo(item.tag) }}</span>
                <div class="lora-tags" v-if="itemLoraNames(item).length > 0">
                    <span class="lora-chip" v-for="(lname, i) in itemLoraNames(item)" :key="i"
                        :class="{ 'lora-chip-missing': isLoraMissing(lname) }"
                        :title="lname + (isLoraMissing(lname) ? '（' + t('history.dialog.lora_missing') + '）' : '')">{{ loraDisplayName(lname) }}</span>
                </div>
                <div class="action-buttons">
                    <button @click="editTag(item)" class="delete-favorite-btn" :title="t('history.edit_favorite')">
                        <svg viewBox="0 0 1024 1024" width="24" height="24" class="delete-favorite-icon">
                            <path
                                d="M200.59 626.48v129.5h129.5l381.93-381.93-129.5-129.5-381.93 381.93z m611.56-352.57c13.45-13.41 13.48-35.18 0.07-48.62l-0.07-0.07-80.81-80.81c-13.41-13.45-35.18-13.48-48.62-0.07l-0.07 0.07-63.19 63.19 129.5 129.5 63.19-63.19zM131.52 824.96h759.71c23.02 0 34.53 11.51 34.53 34.53 0 23.02-11.51 34.53-34.53 34.53H131.52c-23.02 0-34.53-11.51-34.53-34.53 0-23.02 11.51-34.53 34.53-34.53z"
                                p-id="2346"></path>
                        </svg>
                    </button>
                    <button @click="deleteFavorite(item)" class="delete-favorite-btn"
                        :title="t('history.delete_favorite')">
                        <svg viewBox="0 0 1024 1024" width="24" height="24" class="delete-favorite-icon">
                            <path
                                d="M907.618072 232.742353 744.713682 232.742353 744.713682 116.382952c0-12.852708-10.419786-23.272495-23.272495-23.272495L302.556765 93.110457c-12.852708 0-23.272495 10.418762-23.272495 23.272495l0 116.360425L116.380904 232.743377c-12.852708 0-23.272495 10.419786-23.272495 23.272495s10.418762 23.272495 23.272495 23.272495l791.237168 0c12.852708 0 23.272495-10.419786 23.272495-23.272495S920.469756 232.742353 907.618072 232.742353zM325.829259 139.654423l372.340458 0 0 93.08793L325.829259 232.742353 325.829259 139.654423zM791.257647 372.362985c-12.852708 0-23.272495 10.418762-23.272495 23.272495l0 488.712146L256.012799 884.347625 256.012799 395.635479c0-12.852708-10.418762-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 511.983617c0 12.852708 10.418762 23.272495 23.272495 23.272495l558.516318 0c12.852708 0 23.272495-10.419786 23.272495-23.272495L814.529118 395.635479C814.529118 382.782771 804.110355 372.362985 791.257647 372.362985zM442.189684 767.987201l0-372.351721c0-12.852708-10.418762-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 372.351721c0 12.852708 10.418762 23.272495 23.272495 23.272495S442.189684 780.839909 442.189684 767.987201zM628.353257 767.987201l0-372.351721c0-12.852708-10.419786-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 372.351721c0 12.852708 10.419786 23.272495 23.272495 23.272495S628.353257 780.839909 628.353257 767.987201z">
                            </path>
                        </svg>
                    </button>
                    <button @click="useItem(item)" class="use-btn" :title="t('history.use_favorite')">
                        <svg viewBox="0 0 1024 1024" width="24" height="24" class="use-icon">
                            <path
                                d="M915.515273 142.819385 98.213046 458.199122c-46.058539 17.772838-44.90475 43.601756 2.348455 57.622994l197.477685 58.594874 80.292024 238.91085c10.51184 31.277988 37.972822 37.873693 61.462483 14.603752l103.584447-102.611545 204.475018 149.840224c26.565749 19.467242 53.878547 9.222132 61.049613-23.090076l149.210699-672.34491C965.264096 147.505054 946.218922 130.971848 915.515273 142.819385zM791.141174 294.834331l-348.61988 310.610267c-6.268679 5.58499-11.941557 16.652774-12.812263 24.846818l-15.390659 144.697741c-1.728128 16.24808-7.330491 16.918483-12.497501 1.344894l-67.457277-203.338603c-2.638691-7.954906 0.975968-17.705389 8.022355-21.931178l442.114555-265.181253C812.67481 268.984974 815.674251 272.975713 791.141174 294.834331z"
                                p-id="18085"></path>
                        </svg>
                    </button>
                    <input type="checkbox" v-if="isDeleteBatch" v-model="selectedTags" :value="item.id_index"
                        class="tag-checkbox" />
                    <span class="favor-time">{{ formatRelativeTime(item.create_time) }}</span>
                </div>
            </li>
        </ul>

        <!-- 标签对话框 -->
        <div v-if="showTagDialog" class="weilin-tools-dialog-overlay" @contextmenu="favHandleTagDialogContextMenu">
            <div class="weilin-tools-dialog-content" @mousedown.stop>
                <div class="weilin-tools-dialog-header">
                    <h2>{{ isEditingTag ? t('history.dialog.edit_tag') : t('history.dialog.add_tag') }}</h2>
                    <button class="close-btn" @click="closeTagDialog">×</button>
                </div>
                <div class="weilin-tools-dialog-body">
                    <div class="form-group">
                        <label>{{ t('history.dialog.name') }}</label>
                        <input type="text" v-model="currentTag.name" ref="nameInputRef"
                            :placeholder="t('history.dialog.name_placeholder')"
                            @keydown.enter.prevent="focusTagTextarea">
                    </div>
                    <div class="form-group tag-input-group">
                        <label class="label-row">
                            <span>{{ t('history.dialog.tag') }}</span>
                            <span class="char-count">{{ t('history.dialog.token_count', { n: tokenCount }) }}</span>
                        </label>
                        <textarea v-model="currentTag.tag" ref="tagTextareaRef" spellcheck="false"
                            :placeholder="t('history.dialog.tag_placeholder')" rows="12"
                            @input="favHandleInput" @keydown="favTextareaKeydown"
                            @keydown.ctrl.enter.prevent="saveTag" @click="favCloseAutocomplete"></textarea>
                        <!-- 标签自动补全下拉（移植主编辑器：标签库 + embeddings，定位跟随光标 left+top） -->
                        <div class="fav-autocomplete" ref="favAutocompleteRef" v-show="favShowAutocomplete"
                            :style="{ top: favAutocompleteTop + 'px', left: favAutocompleteLeft + 'px' }">
                            <div v-for="(item, index) in favAutocompleteResults" :key="index"
                                class="fav-autocomplete-item" :class="{ selected: index === favSelectedIndex }"
                                @mouseenter="favSelectedIndex = index" @mousedown.prevent
                                @click.stop="favSelectAutocomplete(index, $event)">
                                <span class="tag">{{ item.text }}</span>
                                <span class="desc" v-if="item.desc">{{ item.desc }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>{{ t('history.dialog.follow_lora') }}</label>
                        <div class="lora-tags" v-if="editingLoras.length > 0">
                            <span class="lora-chip lora-chip-editable" v-for="(lora, i) in editingLoras"
                                :key="i" :class="{ 'lora-chip-missing': isLoraMissing(lora.name) }"
                                :title="lora.name + (isLoraMissing(lora.name) ? '（' + t('history.dialog.lora_missing') + '）' : '')">
                                <span class="lora-chip-name">{{ loraDisplayName(lora.name) }}</span>
                                <button class="lora-chip-remove" :title="t('common.delete')"
                                    @click="removeLoraFromTag(lora.name)">×</button>
                            </span>
                        </div>
                        <div class="lora-empty" v-else>{{ t('history.dialog.no_lora') }}</div>
                        <div class="lora-add-row">
                            <input type="text" class="lora-add-input" v-model="loraSearchQuery"
                                :placeholder="t('history.dialog.lora_search_placeholder')"
                                @input="searchLoraCandidates"
                                @keydown.esc.prevent="loraCandidates = []">
                            <ul class="lora-candidates" v-if="loraCandidates.length > 0">
                                <li class="lora-candidate" v-for="path in loraCandidates" :key="path"
                                    :title="path" @mousedown.prevent
                                    @click="addLoraToTag(path)">{{ loraDisplayName(path) }}</li>
                            </ul>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>{{ t('history.dialog.background_color') }}</label>
                        <div class="color-picker">
                            <div class="color-preview" :style="{ backgroundColor: previewColor }">
                            </div>
                            <div class="color-controls">
                                <input type="color" v-model="colorPickerState.hex" @input="updateColor"
                                    class="color-input">
                                <div class="alpha-control">
                                    <input type="range" v-model.number="colorPickerState.alpha" min="0" max="100"
                                        @input="updateColor" class="alpha-slider">
                                    <span class="alpha-value">{{ colorPickerState.alpha }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="weilin-tools-dialog-footer">
                    <span class="footer-hint">{{ t('history.dialog.save_hint') }}</span>
                    <button class="cancel-btn" @click="closeTagDialog">{{ t('common.cancel') }}</button>
                    <button class="confirm-btn" @click="saveTag">{{ t('common.confirm') }}</button>
                </div>
            </div>
        </div>

        <!-- 确认删除对话框 -->
        <div v-if="showDeleteDialog" class="weilin-tools-dialog-overlay">
            <div class="weilin-tools-dialog-content confirm-weilin-tools-dialog" @mousedown.stop>
                <div class="weilin-tools-dialog-header">
                    <h2>{{ t('common.confirmDelete') }}</h2>
                    <button class="close-btn" @click="closeDeleteDialog">×</button>
                </div>
                <div class="weilin-tools-dialog-body">
                    <p class="confirm-message">{{ deleteConfirmMessage }}</p>
                </div>
                <div class="weilin-tools-dialog-footer">
                    <button class="cancel-btn" @click="closeDeleteDialog">{{ t('common.cancel') }}</button>
                    <button class="delete-btn" @click="confirmDelete">{{ t('common.delete') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { historyApi } from "@/api/history";
import { loraApi } from "@/api/lora";
import { autocompleteApi } from "@/api/autocomplete";
import message from "@/utils/message";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const searchQuery = ref('');
const favorites = ref([]); // 存储收藏夹记录
const filteredFavorites = ref([]); // 存储过滤后的收藏夹记录
const selectedTags = ref([]);
const showTagDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditingTag = ref(false)
const colorPickerState = ref({
    hex: 'rgba(255, 123, 2, .4)',
    alpha: 100
})
const currentTag = ref({
    name: '',
    tag: '',
    color: 'rgba(255, 123, 2, .4)'
})

// 对话框打开后自动聚焦：编辑模式聚焦标签内容区，新增模式聚焦名称框
const nameInputRef = ref(null)
const tagTextareaRef = ref(null)
const focusTagTextarea = () => {
    tagTextareaRef.value?.focus()
}
watch(showTagDialog, (visible) => {
    if (!visible) return
    nextTick(() => {
        if (isEditingTag.value) {
            tagTextareaRef.value?.focus()
        } else {
            nameInputRef.value?.focus()
        }
    })
})

const isDeleteBatch = ref(false)
const selectAllTags = ref(0)

// token 计数：与主编辑器 calculateTokens 同口径（按空白分词），保证两处数字一致
const calculateTokens = (text) => {
    if (!text) return 0
    const trimmed = text.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
}
const tokenCount = computed(() => calculateTokens(currentTag.value.tag))

// 列表渲染缓存：同一 tag 的 JSON 解析只做一次（避免每次渲染重复 parse 卡顿）
const promptInfoCache = new Map()
// 提取收藏 tag 的展示信息：JSON 收藏取 prompt 纯文本（剥离 {"prompt":"..."} 包装、
// token 颜色/ID 等编辑器状态字段），非 JSON 内容原样保留
const extractPromptInfo = (strJson) => {
    if (promptInfoCache.has(strJson)) return promptInfoCache.get(strJson)
    let info
    try {
        const parsed = JSON.parse(strJson)
        if (parsed !== null && typeof parsed === 'object') {
            info = {
                isJson: true,
                prompt: typeof parsed.prompt === 'string' ? parsed.prompt : strJson,
                lora: parsed.lora ? parsed.lora : "",
                parsed
            }
        } else {
            info = { isJson: false, prompt: strJson, lora: "", parsed: null }
        }
    } catch (e) {
        info = { isJson: false, prompt: strJson, lora: "", parsed: null } // 旧数据/非 JSON 原样，避免解析失败白屏
    }
    promptInfoCache.set(strJson, info)
    return info
}
const retPromptInfo = (strJson) => extractPromptInfo(strJson).prompt

// 提取跟随的 Lora 名字列表（lora 元素结构 {name, weight, ...}，见 lora_stack.vue addLora）
const getLoraNames = (loraArr) => {
    if (!Array.isArray(loraArr)) return []
    return loraArr.map(item => (item && item.name) ? item.name : '').filter(Boolean)
}
// Lora 显示名：剥掉已知模型扩展名（仅展示用；数据层 name 保留完整路径，
// useItem 灌回/保存/存在检测/删除过滤都依赖完整名）。白名单避免误伤含点文件名（如 xxx16.0_rank32）
const loraDisplayName = (name) => {
    if (typeof name !== 'string' || !name) return name
    return name.replace(/\.(safetensors|pt|bin|ckpt)$/i, '')
}

const itemLoraNames = (item) => getLoraNames(extractPromptInfo(item.tag).lora)

// ===== Lora 存在性检测：批量比对 loras 目录列表，失效文件（被移动/删除/改名）标红 =====
const loraExistMap = ref({}) // name → true/false，未检测过的不在表里
const isLoraMissing = (name) => loraExistMap.value[name] === false
// 只对未见过的名字发一次批量请求，结果合并进缓存表
const refreshLoraExistence = (names) => {
    const pending = [...new Set(names.filter(n => n && !(n in loraExistMap.value)))]
    if (pending.length === 0) return
    loraApi.checkLoraExists(pending)
        .then((res) => {
            const data = res?.data
            if (data && typeof data === 'object') {
                loraExistMap.value = { ...loraExistMap.value, ...data }
            }
        })
        .catch(() => { }) // 检测失败静默：不标红（宁可不提示也不误报）
}

// 编辑对话框中的跟随 Lora：独立编辑态，保存时写回 lora 字段（取代旧的 _parsed 只读依赖）
const editingLoras = ref([])
const loraSearchQuery = ref('')
const loraCandidates = ref([])
const loraSearching = ref(false)
let loraSearchTimer = null

const resetLoraEditState = () => {
    editingLoras.value = []
    loraSearchQuery.value = ''
    loraCandidates.value = []
    loraSearching.value = false
    if (loraSearchTimer) {
        clearTimeout(loraSearchTimer)
        loraSearchTimer = null
    }
}

// 删除跟随的 Lora（按 name 匹配）
const removeLoraFromTag = (name) => {
    editingLoras.value = editingLoras.value.filter(l => l.name !== name)
}

// 添加候选路径为跟随 Lora（查重后 push，元素结构与编辑器 addLora 同源：
// {name: 完整路径, weight: 1, text_encoder_weight: 1}，见 lora_stack.vue）
const addLoraToTag = (path) => {
    if (!path) return
    if (!editingLoras.value.some(l => l.name === path)) {
        editingLoras.value.push({ name: path, weight: 1, text_encoder_weight: 1 })
    }
    loraExistMap.value = { ...loraExistMap.value, [path]: true } // 候选来自实时目录列表，必存在
    loraSearchQuery.value = ''
    loraCandidates.value = []
}

// 防抖搜索 Lora 候选（POST /get_lora_list_by_search 返回路径字符串数组，过滤已添加取前 8 条）
const searchLoraCandidates = () => {
    if (loraSearchTimer) clearTimeout(loraSearchTimer)
    const query = loraSearchQuery.value.trim()
    if (!query) {
        loraCandidates.value = []
        loraSearching.value = false
        return
    }
    loraSearchTimer = setTimeout(() => {
        loraSearching.value = true
        loraApi.searchLoraGetFolderList(query)
            .then((res) => {
                const list = Array.isArray(res?.data) ? res.data : []
                loraCandidates.value = list
                    .filter(p => !editingLoras.value.some(l => l.name === p))
                    .slice(0, 8)
            })
            .catch(() => {
                loraCandidates.value = []
            })
            .finally(() => {
                loraSearching.value = false
            })
    }, 300)
}

// ===== 标签编辑框自动补全（移植自 prompt_index.vue：防抖 150ms + 请求序号 + Map 缓存 + embeddings 前缀）=====
const AUTOCOMPLETE_DEBOUNCE_MS = 150
const AUTOCOMPLETE_CACHE_MAX = 100
const AUTOCOMPLETE_EMBEDDING_MAX = 50
const AUTOCOMPLETE_EMBEDDING_MIX_MAX = 10
const AUTOCOMPLETE_MAX_WIDTH = 380 // 下拉最大宽度（px），与 CSS max-width 保持一致
const favAutocompleteRef = ref(null)
const favShowAutocomplete = ref(false)
const favAutocompleteResults = ref([])
const favSelectedIndex = ref(0)
const favAutocompleteTop = ref(0)
const favAutocompleteLeft = ref(0)
let favAutocompleteTimer = null
let favAutocompleteSeq = 0 // 请求序号，过期响应丢弃
const favAutocompleteCache = new Map()
let favEmbeddingsCache = null
let favEmbeddingsFetchFailedAt = 0 // 失败冷却：30s 内不重试，避免失败被永久缓存为空列表后每次输入都静默失败
let favSelectedItemEl = null

// embeddings 数据源：主用插件自身端点（与标签库接口同链路，可达性与 tag 补全一致），
// 失败时回退 ComfyUI 原生 /api/embeddings（裸 /embeddings 被第三方扩展页面占用，勿用）
const fetchFavEmbeddings = async () => {
    if (favEmbeddingsCache !== null) return favEmbeddingsCache
    if (Date.now() - favEmbeddingsFetchFailedAt < 30000) return []
    try {
        let list = null
        try {
            const res = await autocompleteApi.getEmbeddingsList()
            list = Array.isArray(res.data) ? res.data : null
        } catch (e) {
            console.warn('[WeiLin] 插件端点获取 embeddings 失败，回退原生 /api/embeddings:', e)
        }
        if (list === null) {
            const res = await fetch('/api/embeddings')
            if (!res.ok) throw new Error('HTTP ' + res.status)
            const raw = await res.json()
            list = Array.isArray(raw) ? raw : []
        }
        favEmbeddingsCache = list.filter(n => typeof n === 'string')
        if (favEmbeddingsCache.length === 0) {
            console.warn('[WeiLin] embeddings 列表为空——请确认 ComfyUI 的 models/embeddings 目录非空')
        }
    } catch (e) {
        console.warn('[WeiLin] 获取 embeddings 列表失败:', e)
        favEmbeddingsFetchFailedAt = Date.now()
        return []
    }
    return favEmbeddingsCache
}

// ===== 诊断：ComfyUI 页面控制台执行 window.weilinEmbeddingDiag() =====
// 报告插件端点与原生 /api/embeddings 两个数据源的可达性、条数与 lazy 命中样本，用于定位 embedding 补全失效
const weilinEmbeddingDiag = async () => {
    const report = { cacheCount: favEmbeddingsCache === null ? '未加载' : favEmbeddingsCache.length, cooldown30s: Date.now() - favEmbeddingsFetchFailedAt < 30000 }
    try {
        const res = await autocompleteApi.getEmbeddingsList()
        report.pluginEndpoint = { ok: true, count: Array.isArray(res.data) ? res.data.length : -1 }
    } catch (e) {
        report.pluginEndpoint = { ok: false, error: String(e) }
    }
    try {
        const res = await fetch('/api/embeddings')
        const raw = await res.json()
        report.nativeEndpoint = { status: res.status, count: Array.isArray(raw) ? raw.length : -1, sample: Array.isArray(raw) ? raw.slice(0, 5) : [] }
    } catch (e) {
        report.nativeEndpoint = { ok: false, error: String(e) }
    }
    console.log('[WeiLin] embedding 数据链路诊断:', report)
    return report
}
if (typeof window !== 'undefined') window.weilinEmbeddingDiag = weilinEmbeddingDiag

// 普通输入混入 embeddings 候选（同主编辑器 buildEmbeddingTail：正斜杠归一化比对，插入保留原名）
const buildFavEmbeddingTail = async (lowerQuery) => {
    const list = await fetchFavEmbeddings()
    return list
        .filter(name => name.replace(/\\/g, '/').toLowerCase().includes(lowerQuery))
        .slice(0, AUTOCOMPLETE_EMBEDDING_MIX_MAX)
        .map(name => ({ text: 'embedding:' + name, desc: 'embedding', isEmbedding: true }))
}

// 权重语法剥离（同主编辑器 extractText：lora名:0.8 → lora名）
const favExtractText = (input) => {
    const match = input.match(/([^:]+):[\d.]+/)
    return match ? match[1] : input
}

const favCloseAutocomplete = () => {
    favShowAutocomplete.value = false
}

// 关闭对话框时清空补全状态（缓存保留）
const resetFavAutocomplete = () => {
    if (favAutocompleteTimer) {
        clearTimeout(favAutocompleteTimer)
        favAutocompleteTimer = null
    }
    favAutocompleteSeq++
    favShowAutocomplete.value = false
    favAutocompleteResults.value = []
}

// 编辑对话框右键：有选中文字时完全放行原生菜单（复制场景，不关闭任何窗口）；
// 无选区时 preventDefault 后：有补全浮窗优先只关浮窗，否则关闭整个对话框。
// 选区检测分两路：输入框用自身 selectionStart/End（window.getSelection 对其内部选区返回空）
const favHandleTagDialogContextMenu = (event) => {
    const t = event.target
    let hasSelection = false
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) {
        hasSelection = typeof t.selectionStart === 'number' && typeof t.selectionEnd === 'number' && t.selectionStart !== t.selectionEnd
    } else {
        const sel = typeof window.getSelection === 'function' ? window.getSelection() : null
        hasSelection = !!(sel && !sel.isCollapsed && String(sel))
    }
    if (hasSelection) return
    event.preventDefault()
    if (favShowAutocomplete.value) {
        favCloseAutocomplete()
    } else {
        closeTagDialog()
    }
}

// 光标前的当前单词（以逗号/空白为界）
const favGetCurrentWord = () => {
    const textarea = tagTextareaRef.value
    if (!textarea) return { word: '', start: 0, end: 0 }
    const pos = textarea.selectionStart
    const text = textarea.value || ''
    let start = pos
    while (start > 0 && !/[,\s]/.test(text[start - 1])) start--
    return { word: text.substring(start, pos), start, end: pos }
}

// 镜像 div 测量光标位置（left+top：下拉跟随光标列，不再全宽锚定行首）
const favCalculatePosition = async () => {
    const textarea = tagTextareaRef.value
    if (!textarea || !textarea.parentNode) return
    const cursorPos = textarea.selectionStart
    await nextTick()
    const mirror = document.createElement('div')
    const style = mirror.style
    style.position = 'absolute'
    style.top = '0'
    style.left = '0'
    style.visibility = 'hidden'
    style.whiteSpace = 'pre-wrap'
    style.wordWrap = 'break-word'
    const cs = window.getComputedStyle(textarea)
    style.width = cs.width
    style.font = cs.font
    style.padding = cs.padding
    style.lineHeight = cs.lineHeight
    mirror.appendChild(document.createTextNode(textarea.value.substring(0, cursorPos)))
    const cursorNode = document.createElement('span')
    cursorNode.textContent = '|'
    mirror.appendChild(cursorNode)
    textarea.parentNode.appendChild(mirror)
    const cursorRect = cursorNode.getBoundingClientRect()
    const parentRect = textarea.parentNode.getBoundingClientRect()
    // 水平跟随光标列；超出容器右缘时向左收（AUTOCOMPLETE_MAX_WIDTH 与 CSS max-width 一致）
    let left = cursorRect.left - parentRect.left
    const maxLeft = parentRect.width - AUTOCOMPLETE_MAX_WIDTH
    if (maxLeft > 0 && left > maxLeft) left = maxLeft
    if (left < 0) left = 0
    const top = cursorRect.bottom - parentRect.top + 2
    textarea.parentNode.removeChild(mirror)
    favAutocompleteLeft.value = left
    favAutocompleteTop.value = top
}

// 去重（74.23）：按候选文本小写归一化，保留首个出现（同主编辑器 dedupeAutocompleteResults）
const favDedupeResults = (results) => {
    const seen = new Set()
    return (results || []).filter(item => {
        if (!item || !item.text) return false
        const key = String(item.text).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

const favApplyResults = async (results) => {
    favAutocompleteResults.value = favDedupeResults(results)
    if (favAutocompleteResults.value.length > 0) {
        await favCalculatePosition()
    }
    favShowAutocomplete.value = favAutocompleteResults.value.length > 0
    favSelectedIndex.value = 0
}

const favScrollToSelected = () => {
    nextTick(() => {
        const container = favAutocompleteRef.value
        if (!container) return
        const el = container.querySelector('.fav-autocomplete-item.selected')
        if (el) el.scrollIntoView({ block: 'nearest' })
    })
}

const favTriggerAutocomplete = (rawWord) => {
    let cleaned = rawWord.replace(/[\[\]{}]/g, '').trim()

    // embedding 前缀检测必须在 extractText 之前（权重正则会截断数字开头的 embedding 名）；
    // 兼容全角冒号（embedding：），中文输入法下冒号易被打成全角导致前缀检测失败；
    // 裸词 "embedding"（还没打冒号）也直接列出 embedding 候选，不必等冒号敲下
    // 裸词修复（74.22）：旧正则要求整段恰等于 "embedding"，裸词弹出全量列表后
    // 继续输入名字即失配掉回 tag 路径（实际仍需冒号才能筛选）。
    // 放宽为 embedding 前缀 + 可选冒号 + 任意后缀，裸词后续输入持续过滤
    const embeddingPrefixMatch = cleaned.match(/^embedding[:：]?(.*)$/i)
    if (embeddingPrefixMatch) {
        if (favAutocompleteTimer) {
            clearTimeout(favAutocompleteTimer)
            favAutocompleteTimer = null
        }
        favAutocompleteSeq++
        const filter = (embeddingPrefixMatch[1] || '').trim().toLowerCase()
        fetchFavEmbeddings().then((list) => {
            const matched = list
                .filter(name => name.replace(/\\/g, '/').toLowerCase().includes(filter))
                .slice(0, AUTOCOMPLETE_EMBEDDING_MAX)
                .map(name => ({ text: 'embedding:' + name, desc: 'embedding', isEmbedding: true }))
            favApplyResults(matched)
        }).catch((e) => {
            console.warn('[WeiLin] embedding 前缀补全失败:', e)
        })
        return
    }

    const text = favExtractText(cleaned).trim()
    // 空或过长：关闭并作废在途请求
    if (!text || text.length > 20) {
        if (favAutocompleteTimer) {
            clearTimeout(favAutocompleteTimer)
            favAutocompleteTimer = null
        }
        favAutocompleteSeq++
        favShowAutocomplete.value = false
        return
    }

    const lowerInput = text.toLowerCase()
    // 命中缓存直接显示
    if (favAutocompleteCache.has(lowerInput)) {
        favAutocompleteSeq++
        favApplyResults(favAutocompleteCache.get(lowerInput))
        return
    }

    if (favAutocompleteTimer) clearTimeout(favAutocompleteTimer)
    favAutocompleteTimer = setTimeout(async () => {
        favAutocompleteTimer = null
        const seq = ++favAutocompleteSeq
        try {
            const res = await autocompleteApi.getAutocomplete(String(lowerInput))
            if (seq !== favAutocompleteSeq) return
            const results = res.data || []
            // 混入 embedding 候选（普通输入也能看到 embedding；缓存同存合并结果，命中缓存时行为一致）
            const embeddingTail = await buildFavEmbeddingTail(lowerInput)
            if (seq !== favAutocompleteSeq) return
            const mergedResults = results.concat(embeddingTail)
            if (favAutocompleteCache.size >= AUTOCOMPLETE_CACHE_MAX) {
                const firstKey = favAutocompleteCache.keys().next().value
                favAutocompleteCache.delete(firstKey)
            }
            favAutocompleteCache.set(lowerInput, mergedResults)
            await favApplyResults(mergedResults)
        } catch (error) {
            if (seq === favAutocompleteSeq) {
                favShowAutocomplete.value = false
            }
        }
    }, AUTOCOMPLETE_DEBOUNCE_MS)
}

const favHandleInput = () => {
    const { word } = favGetCurrentWord()
    if (word.trim()) {
        favTriggerAutocomplete(word)
    } else {
        favCloseAutocomplete()
    }
}

const favTextareaKeydown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return // Ctrl+Enter 保存等组合键放行
    if (!favShowAutocomplete.value) return
    if (event.key === 'ArrowDown') {
        event.preventDefault()
        favSelectedIndex.value = Math.min(favSelectedIndex.value + 1, favAutocompleteResults.value.length - 1)
        favScrollToSelected()
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        favSelectedIndex.value = Math.max(favSelectedIndex.value - 1, 0)
        favScrollToSelected()
    } else if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault()
        favSelectAutocomplete(favSelectedIndex.value, null)
    } else if (event.key === 'Escape') {
        event.preventDefault()
        favCloseAutocomplete()
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
        favCloseAutocomplete()
    }
}

// 选中补全项：替换光标前单词并追加 ", "（同主编辑器，格式转换读同一批 localStorage 开关；
// embedding 文件名跳过全部转换，否则下划线转空格/括号转义会毁文件名）
const favSelectAutocomplete = (index, event) => {
    if (event) {
        event.preventDefault()
        event.stopPropagation()
    }
    const item = favAutocompleteResults.value[index]
    if (!item) return
    favShowAutocomplete.value = false
    const textarea = tagTextareaRef.value
    if (!textarea) return

    const currentText = currentTag.value.tag || ''
    const cursorPosition = textarea.selectionStart
    const cursorEnd = textarea.selectionEnd

    let tagText = item.text
    if (!item.isEmbedding) {
        if (localStorage.getItem('weilin_prompt_ui_comma_conversion') !== 'false') {
            tagText = tagText.replace(/，/g, ',')
        }
        if (localStorage.getItem('weilin_prompt_ui_period_conversion') !== 'false') {
            tagText = tagText.replace(/。/g, '.')
        }
        if (localStorage.getItem('weilin_prompt_ui_bracket_conversion') !== 'false') {
            tagText = tagText.replace(/【/g, '[').replace(/】/g, ']').replace(/（/g, '(').replace(/）/g, ')')
        }
        if (localStorage.getItem('weilin_prompt_ui_angle_bracket_conversion') !== 'false') {
            tagText = tagText.replace(/《/g, '<').replace(/》/g, '>')
        }
        if (localStorage.getItem('weilin_prompt_ui_underscore_to_bracket') === 'true') {
            tagText = tagText.replace(/_/g, ' ')
        }
        if (localStorage.getItem('weilin_prompt_ui_bracket_escape') === 'true') {
            tagText = tagText.replace(/\(([^)]+)\)/g, '\\($1\\)')
        }
    }

    // 向前找单词边界替换，插入后光标停在 ", " 之后
    let replaceStart = cursorPosition
    while (replaceStart > 0 && !/[,\s]/.test(currentText[replaceStart - 1])) {
        replaceStart--
    }
    const newText = currentText.substring(0, replaceStart) + tagText + ', ' + currentText.substring(cursorEnd)
    const newCursorPosition = replaceStart + tagText.length + 2

    currentTag.value.tag = newText
    nextTick(() => {
        if (tagTextareaRef.value) {
            tagTextareaRef.value.selectionStart = newCursorPosition
            tagTextareaRef.value.selectionEnd = newCursorPosition
            tagTextareaRef.value.focus()
        }
    })
}

// 点击补全容器/输入框以外区域时关闭（候选项用 click.stop 不冒泡，不会误关）
const favHandleDocClick = (event) => {
    if (!favShowAutocomplete.value) return
    const container = favAutocompleteRef.value
    if (container && container.contains(event.target)) return
    if (tagTextareaRef.value && tagTextareaRef.value === event.target) return
    favCloseAutocomplete()
}

// 改进的 RGBA 解析函数
const parseRgba = (rgba) => {
    if (!rgba || rgba === 'transparent') {
        return { hex: '#FFFFFF', alpha: 0 }
    }

    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/)
    if (match) {
        const [, r, g, b, a] = match
        const hex = '#' + [r, g, b].map(x => {
            const hex = parseInt(x).toString(16)
            return hex.length === 1 ? '0' + hex : hex
        }).join('')

        return {
            hex: hex,
            alpha: Math.round((a || 1) * 100)
        }
    }
    return { hex: '#FFFFFF', alpha: 0 }
}

// 初始化颜色选择器
const initColorPicker = (color) => {
    const { hex, alpha } = parseRgba(color)
    colorPickerState.value = { hex, alpha }
}

// 显示添加标签对话框
const showAddTagDialog = () => {
    isEditingTag.value = false
    currentTag.value = {
        id: '',
        name: '',
        tag: '',
        backgroundColor: 'transparent' // 设置默认颜色
    }
    resetLoraEditState()
    // 初始化颜色选择器
    initColorPicker('transparent')
    showTagDialog.value = true
}

const rgbaToColorPickerState = (rgba) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (match) {
        const [, r, g, b, a] = match;
        const hex = `#${((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1)}`;
        const alpha = a ? Math.round(parseFloat(a) * 100) : 100; // 将 alpha 转换为百分比
        return { hex, alpha };
    }
    return { hex: '#FF7B02', alpha: 50 }; // 默认值
};

// 编辑标签
const editTag = (tag) => {
    isEditingTag.value = true
    currentTag.value = { ...tag }
    // 显示层精简：编辑框只显示纯提示词文本；lora 字段进入独立编辑态，保存时统一重建 {prompt, lora}
    resetLoraEditState()
    const info = extractPromptInfo(tag.tag)
    currentTag.value.tag = info.prompt
    editingLoras.value = Array.isArray(info.lora) ? info.lora : []
    refreshLoraExistence(getLoraNames(editingLoras.value))
    colorPickerState.value = rgbaToColorPickerState(tag.color)
    showTagDialog.value = true
}


// 更新颜色
const updateColor = () => {
  const color = hexToRgba(colorPickerState.value.hex, colorPickerState.value.alpha)
  currentTag.value.color = color
}


// 关闭标签对话框
const closeTagDialog = () => {
    showTagDialog.value = false
    currentTag.value = {
        name: '',
        tag: '',
        color: 'rgba(255, 123, 2, .4)'
    }
    resetLoraEditState()
    resetFavAutocomplete()
    isEditingTag.value = false
}

const deleteType = ref('')
const itemToDelete = ref(null)
// 74.33：确认消息里的条目名用 prompt 摘要（同历史窗口修复：原实现嵌完整 tag JSON 会撑爆弹窗）
const summarizeTag = (strJson, max = 80) => {
    let s = retPromptInfo(strJson)
    if (typeof s !== 'string' || !s) s = String(strJson ?? '')
    s = s.trim()
    return s.length > max ? s.slice(0, max) + '…' : s
}
// 74.34：删除确认优先显示收藏名称（用户自己起的名字），未命名时回退 prompt 摘要
const favoriteDisplayName = (item, max = 80) => {
    const n = (item && typeof item.name === 'string') ? item.name.trim() : ''
    if (n) return n.length > max ? n.slice(0, max) + '…' : n
    return summarizeTag(item && item.tag)
}
const deleteConfirmMessage = computed(() => {
    if (!itemToDelete.value) return ''

    switch (deleteType.value) {
        case 'favorite':
            return t('history.deleteFavoriteConfirm', { name: favoriteDisplayName(itemToDelete.value) })
        case 'deleteSelectedFavorite':
            return t('history.confirmDeleteSelected')
        default:
            return ''
    }
})

const deleteFavorite = (favorite) => {
    deleteType.value = 'favorite'
    itemToDelete.value = favorite
    showDeleteDialog.value = true
}

const sureDeleteFavorite = () => {
    isDeleteBatch.value = false
    selectAllTags.value = 0
    deleteType.value = 'deleteSelectedFavorite'
    itemToDelete.value = selectedTags.value
    showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
    try {
        switch (deleteType.value) {
            case 'favorite':
                historyApi
                    .deleteFavorite(itemToDelete.value.id_index)
                    .then((res) => {
                        fetchFavorites()
                        window.postMessage({
                            type: 'weilin_prompt_ui_refresh_all_data',
                        }, '*')
                        message({ type: "success", str: 'message.deleteSuccess' });
                    })
                    .catch((err) => {
                        message({ type: "warn", str: 'message.networkError' });
                    });
                break
            case 'deleteSelectedFavorite':
                historyApi
                    .batchDeleteFavorite(itemToDelete.value)
                    .then((res) => {
                        fetchFavorites()
                        window.postMessage({
                            type: 'weilin_prompt_ui_refresh_all_data',
                        }, '*')
                        message({ type: "success", str: 'message.deleteSuccess' });
                    })
                    .catch((err) => {
                        message({ type: "warn", str: 'message.networkError' });
                    });
                break
        }

        closeDeleteDialog()
    } catch (error) {
        message({ type: "warn", str: 'message.networkError' });
    }
}

const selectAllTagsChange = (event) => {
    if (event.target.checked) {
        selectedTags.value = favorites.value.map(item => item.id_index)
    } else {
        selectedTags.value = []
    }
}

// 改进的 RGBA 转换函数
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
}

// 关闭删除对话框
const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    deleteType.value = ''
    itemToDelete.value = null
}

// 相对时间显示：与历史记录页一致（刚刚 / N分钟前 / N小时前 / 昨天 / N天前 / 超过一个月显示日期）
const formatRelativeTime = (unixSeconds) => {
    if (!unixSeconds) return ''
    const diff = Math.floor((Date.now() - unixSeconds * 1000) / 1000)
    if (diff < 60) return t('history.time.justNow')
    if (diff < 3600) return t('history.time.minutesAgo', { n: Math.floor(diff / 60) })
    if (diff < 86400) return t('history.time.hoursAgo', { n: Math.floor(diff / 3600) })
    const days = Math.floor(diff / 86400)
    if (days === 1) return t('history.time.yesterday')
    if (days < 30) return t('history.time.daysAgo', { n: days })
    const d = new Date(unixSeconds * 1000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 保存标签
const saveTag = () => {
    if (!currentTag.value.tag) {
        message({ type: "warn", str: 'history.dialog.tag_placeholder' });
        return
    }

    // 方案 A（存储精简）：统一存 {prompt, lora}，剥离 temp_prompt/temp_lora（token 颜色/ID 等编辑器状态）；
    // 旧收藏存储不动，每编辑保存一次自动迁移为新格式；lora 为编辑对话框中增删后的结果
    const tagToSave = JSON.stringify({
        prompt: currentTag.value.tag,
        lora: editingLoras.value.length > 0 ? editingLoras.value : ""
    })

    if (isEditingTag.value) {
        historyApi
            .editFavorite({
                id_index: currentTag.value.id_index,
                name: currentTag.value.name,
                tag: tagToSave,
                color: currentTag.value.color,
            })
            .then((res) => {
                fetchFavorites()
                window.postMessage({
                    type: 'weilin_prompt_ui_refresh_all_data',
                }, '*')
                message({ type: "success", str: 'message.editSuccess' });
            })
            .catch((err) => {
                message({ type: "warn", str: 'message.networkError' });
            });
    } else {
        historyApi
            .addFavorite({
                name: currentTag.value.name,
                tag: tagToSave,
                color: currentTag.value.color,
            })
            .then((res) => {
                // 后端去重：tag 完全一致的收藏已存在时不重复插入，返回 existed 标记
                if (res && res.data && res.data.existed) {
                    message({ type: "warn", str: 'message.addFavoriteIsExist' });
                } else {
                    message({ type: "success", str: 'message.addSuccess' });
                }
                fetchFavorites()
                window.postMessage({
                    type: 'weilin_prompt_ui_refresh_all_data',
                }, '*')
            })
            .catch((err) => {
                message({ type: "warn", str: 'message.networkError' });
            });
    }

    closeTagDialog()
}


const fetchFavorites = () => {
    historyApi
        .getFavorite()
        .then((res) => {
            favorites.value = res.data;
            filteredFavorites.value = favorites.value;
            // 收集全部收藏的跟随 Lora 名字，批量检测存在性（未检测过的才发请求）
            const allNames = []
            favorites.value.forEach(item => allNames.push(...itemLoraNames(item)))
            refreshLoraExistence(allNames)
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
        });
};

const filterFavorites = () => {
    // 根据搜索查询过滤收藏夹记录
    filteredFavorites.value = favorites.value.filter(item =>
        item.tag.includes(searchQuery.value)
    );
};

const refreshFavorites = () => {
    // 刷新收藏夹记录（手动刷新时清空存在性缓存，强制重新检测——文件可能中途增删）
    loraExistMap.value = {}
    fetchFavorites();
};

const useItem = (item) => {
    // 发送精简后的文本：接收端 setPromptText 会 JSON.parse，
    // 统一构造 {prompt, lora} 最小 JSON——剥离 token 颜色/ID 等编辑器状态字段；
    // 纯文本收藏也包装成 JSON（否则 parse 失败会弹"读取数据错误"且不灌入编辑器）
    const info = extractPromptInfo(item.tag)
    const payload = info.isJson
        ? { prompt: info.prompt, lora: info.lora || "" }
        : { prompt: item.tag, lora: "" }
    window.postMessage({
        type: 'weilin_prompt_ui_user_history_tag',
        tagText: JSON.stringify(payload)
    }, '*')
};

const bulkDelete = () => {
    selectedTags.value = []
    isDeleteBatch.value = true
};

const cancelDelete = () => {
    selectedTags.value = []
    isDeleteBatch.value = false
    selectAllTags.value = 0
}

// 收藏数据被其他窗口变动（历史记录里点收藏等）时自动刷新本列表
// 历史记录窗口与收藏夹窗口同在主窗口，history_index 的 window.postMessage 可直接到达
const handleWindowMessage = (event) => {
    if (event.data && event.data.type === 'weilin_prompt_ui_refresh_all_data') {
        fetchFavorites()
    }
}

onMounted(() => {
    fetchFavorites();
    window.addEventListener('message', handleWindowMessage)
    document.addEventListener('click', favHandleDocClick)
});

onUnmounted(() => {
    window.removeEventListener('message', handleWindowMessage)
    document.removeEventListener('click', favHandleDocClick)
})
</script>

<style scoped>
/* 添加样式 */
.container {
    margin: 0 auto;
    padding: 20px;
}

h1 {
    font-size: 28px;
    text-align: center;
    color: var(--weilin-prompt-ui-primary-text);
}

.search-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-input-bg);
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 14px;
}

.search-input:focus {
    outline: none;
    border-color: var(--weilin-prompt-ui-primary-color);
    box-shadow: 0 0 0 2px var(--weilin-prompt-ui-primary-color-fade);
}

.history-list {
    list-style-type: none;
    padding: 0;
}

.history-item {
    padding: 10px;
    margin: 5px 0;
    background-color: var(--weilin-prompt-ui-token-bg);
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    transition: box-shadow 0.3s;
}

.history-item:hover {
    box-shadow: 0 2px 5px var(--weilin-prompt-ui-hover-bg-color);
}

.refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-secondary-bg);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: 10px;
}

.refresh-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    border-color: var(--weilin-prompt-ui-primary-color);
}

.refresh-icon {
    fill: var(--weilin-prompt-ui-primary-text);
}

.action-buttons {
    padding-top: 10px;
    display: flex;
    gap: 8px;
    /* 按钮之间的间距 */
}

/* 收藏时间戳：与历史记录页 item-time 同风格，在底部按钮行内靠右 */
.favor-time {
    margin-left: auto;
    align-self: center;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--weilin-prompt-ui-secondary-text, #999);
    white-space: nowrap;
}

.delete-favorite-btn,
.use-btn {
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-secondary-bg);
    cursor: pointer;
    transition: all .2s ease;
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
}

.delete-favorite-btn:hover,
.use-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    border-color: var(--weilin-prompt-ui-primary-color);
}

.delete-favorite-icon,
.use-icon {
    fill: var(--weilin-prompt-ui-primary-text);
    width: 18px;
    height: 18px;
}

.delete-favorite-btn:hover .delete-favorite-icon,
.use-btn:hover .use-icon {
    fill: var(--weilin-prompt-ui-primary-color);
}

.tag-checkbox {
    margin-left: 3px;
    /* 复选框与标签文本之间的间距 */
}

.add-his-btn,
.bulk-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-secondary-bg);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 10px;
}

.add-his-btn:hover,
.bulk-delete-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    border-color: var(--weilin-prompt-ui-primary-color);
}

.add-icon {
    fill: var(--weilin-prompt-ui-primary-text);
}

/* 对话框样式 */
.weilin-tools-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    z-index: 9999;
}

.weilin-tools-dialog-content {
    background: var(--weilin-prompt-ui-primary-bg);
    border-radius: 8px;
    width: min(760px, 92vw);
    min-width: 400px;
    max-width: 92vw;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    box-sizing: border-box;
    z-index: 1099;
}

.weilin-tools-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
    flex-shrink: 0;
}

.weilin-tools-dialog-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--weilin-prompt-ui-primary-text);
}

.weilin-tools-dialog-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
}

.weilin-tools-dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--weilin-prompt-ui-border-color);
    flex-shrink: 0;
}

.footer-hint {
    margin-right: auto;
    font-size: 12px;
    color: var(--weilin-prompt-ui-secondary-text);
}

.form-group {
    margin-bottom: 16px;
    box-sizing: border-box;
    width: 100%;
}

.form-group:last-child {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--weilin-prompt-ui-primary-text);
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.char-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--weilin-prompt-ui-secondary-text);
}

/* 跟随 Lora 徽章（列表条目与编辑对话框共用） */
.lora-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.lora-chip {
    font-size: 12px;
    line-height: 1.4;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--weilin-prompt-ui-secondary-bg);
    border: 1px solid var(--weilin-prompt-ui-border-color);
    color: var(--weilin-prompt-ui-secondary-text);
    white-space: normal;
    word-break: break-all;
}

/* 可编辑徽章（编辑对话框）：名字 + × 删除钮 */
.lora-chip-editable {
    display: inline-flex;
    align-items: flex-start;
    gap: 4px;
}

.lora-chip-name {
    word-break: break-all;
}

.lora-chip-remove {
    border: none;
    background: transparent;
    color: var(--weilin-prompt-ui-secondary-text);
    font-size: 14px;
    line-height: 1.2;
    padding: 0 2px;
    cursor: pointer;
    border-radius: 2px;
    flex-shrink: 0;
}

.lora-chip-remove:hover {
    color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
}

.lora-empty {
    font-size: 12px;
    color: var(--weilin-prompt-ui-secondary-text);
    margin-top: 8px;
}

.lora-add-row {
    position: relative;
    margin-top: 8px;
}

.lora-add-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-input-bg);
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 12px;
    box-sizing: border-box;
    transition: all 0.3s ease;
}

.lora-add-input:focus {
    outline: none;
    border-color: var(--weilin-prompt-ui-primary-color, #ff7b02);
}

.lora-candidates {
    position: absolute;
    z-index: 10;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 180px;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    list-style: none;
    background: var(--weilin-prompt-ui-primary-bg);
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.lora-candidate {
    padding: 6px 8px;
    font-size: 12px;
    color: var(--weilin-prompt-ui-primary-text);
    cursor: pointer;
    border-radius: 3px;
    word-break: break-all;
}

.lora-candidate:hover {
    background: var(--weilin-prompt-ui-secondary-bg);
}

/* 标签编辑框自动补全下拉（跟随光标 left+top 定位；宽度随内容自适应，超出 max-width 换行） */
.tag-input-group {
    position: relative;
}

.fav-autocomplete {
    position: absolute;
    z-index: 30;
    width: max-content;
    min-width: 220px;
    max-width: 380px;
    max-height: 180px;
    overflow-y: auto;
    background: var(--weilin-prompt-ui-primary-bg);
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fav-autocomplete-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    color: var(--weilin-prompt-ui-primary-text);
}

.fav-autocomplete-item .tag {
    word-break: break-all;
}

.fav-autocomplete-item .desc {
    color: var(--weilin-prompt-ui-secondary-text);
    flex-shrink: 0;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fav-autocomplete-item:hover,
.fav-autocomplete-item.selected {
    background: var(--weilin-prompt-ui-secondary-bg);
}

/* 跟随 Lora 文件缺失标记（列表徽章与编辑 chip 共用，定义在 .lora-chip 之后以覆盖其颜色） */
.lora-chip-missing {
    border-color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
    color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-input-bg);
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 14px;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.form-group textarea {
    resize: vertical;
    min-height: 240px;
    font-family: "Microsoft YaHei", "微软雅黑", "PingFang SC", sans-serif;
    font-size: 13px;
    line-height: 1.6;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--weilin-prompt-ui-primary-color);
    box-shadow: 0 0 0 2px rgba(var(--weilin-prompt-ui-primary-color-rgb), 0.1);
}

.cancel-btn,
.confirm-btn {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.cancel-btn {
    background: none;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    color: var(--weilin-prompt-ui-secondary-text);
}

.confirm-btn {
    background: var(--weilin-prompt-ui-primary-color);
    border: none;
    color: white;
}

.cancel-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
}

.confirm-btn:hover {
    opacity: 0.9;
}

.close-btn {
    border: none;
    background: none;
    font-size: 22px;
    color: var(--weilin-prompt-ui-secondary-text);
    cursor: pointer;
    padding: 4px 6px;
    line-height: 1;
}

.close-btn:hover {
    color: var(--weilin-prompt-ui-primary-text);
}

/* 确认对话框特定样式 */
.confirm-weilin-tools-dialog {
    min-width: 300px !important;
    max-width: 400px !important;
    width: 90%;
    box-sizing: border-box;
}

.confirm-message {
    margin: 0;
    color: var(--weilin-prompt-ui-primary-text);
    text-align: center;
    word-break: break-all;
}

.delete-btn {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    background: var(--weilin-prompt-ui-danger-color, #ff4d4f);
    border: none;
    color: white;
    transition: all 0.3s ease;
}

.delete-btn:hover {
    opacity: 0.9;
}

/* 对话框动画 */
.weilin-tools-dialog-overlay {
    animation: fadeIn 0.2s ease;
}

.weilin-tools-dialog-content {
    animation: slideIn 0.2s ease;
    z-index: 1099;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.color-picker {
    display: flex;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-secondary-bg);
}

.color-preview {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.color-controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.color-input {
    width: 100%;
    height: 32px;
    padding: 0;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    cursor: pointer;
}

.alpha-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.alpha-slider {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(to right, transparent, currentColor);
    border-radius: 4px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
}

.alpha-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--weilin-prompt-ui-primary-color);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.alpha-value {
    min-width: 48px;
    text-align: right;
    color: var(--weilin-prompt-ui-secondary-text);
}

.favor-name-box {
    padding: 4px 8px;
    border-radius: 4px;
    margin-right: 8px;
    display: inline-flex;
    align-items: center;
    min-width: 40px;
    height: 24px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    width: 100%;
    margin-bottom: 10px;
}

.favor-name {
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}
</style>
