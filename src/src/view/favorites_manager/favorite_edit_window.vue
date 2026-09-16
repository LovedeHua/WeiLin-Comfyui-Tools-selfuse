<template>
    <DraggableWindow v-if="isOpen" name="favoriteEditWindow" :title="dialogTitle"
        :position="windows.favoriteEdit.position" :size="windows.favoriteEdit.size"
        :z-index="windowManager.getZIndex('favoriteEditWindow')"
        @update:position="updatePosition('favoriteEdit', $event)" @update:size="updateSize('favoriteEdit', $event)"
        @close="close">
        <div class="fav-edit-body" @contextmenu="handleEditContextMenu">
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
                    @input="handleInput" @keydown="textareaKeydown"
                    @keydown.ctrl.enter.prevent="saveTag" @click="closeAutocomplete"></textarea>
                <!-- 标签自动补全下拉（跟随光标 left+top 定位） -->
                <div class="fav-autocomplete" ref="autocompleteRef" v-show="showAutocomplete"
                    :style="{ top: autocompleteTop + 'px', left: autocompleteLeft + 'px' }">
                    <div v-for="(item, index) in autocompleteResults" :key="index"
                        class="fav-autocomplete-item" :class="{ selected: index === selectedIndex }"
                        @mouseenter="selectedIndex = index" @mousedown.prevent
                        @click.stop="selectAutocomplete(index, $event)">
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
                        @keydown.esc.stop.prevent="loraCandidates = []">
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
            <div class="fav-edit-footer">
                <span class="footer-hint">{{ t('history.dialog.save_hint') }}</span>
                <button class="cancel-btn" @click="close">{{ t('common.cancel') }}</button>
                <button class="confirm-btn" @click="saveTag">{{ t('common.confirm') }}</button>
            </div>
        </div>
    </DraggableWindow>
</template>

<script setup>
// 收藏编辑/新增独立窗口（原 favorites_index 内的模态对话框窗口化）：
// 可拖动/缩放、与收藏夹等其他窗口并排、层级由 windowManager 统一管理。
// 打开方式：收藏夹窗口 editTag/新增 → postMessage weilin_prompt_ui_openFavoriteEdit
// → App.vue 消息分支 → 本组件 open(item)（item=null 为新增）。
// 保存成功后广播 weilin_prompt_ui_refresh_all_data，收藏夹窗口监听自动刷新。
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import DraggableWindow from '@/components/DraggableWindow.vue'
import { windowManager } from '@/utils/windowManager'
import { historyApi } from "@/api/history"
import { loraApi } from "@/api/lora"
import { autocompleteApi } from "@/api/autocomplete"
import message from "@/utils/message"

const { t } = useI18n()

const isOpen = ref(false)
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

const dialogTitle = computed(() => isEditingTag.value ? t('history.dialog.edit_tag') : t('history.dialog.add_tag'))

// ===== 窗口状态（自管，同 loraDetail 模式）=====
const STORAGE_PREFIX = 'weilin_tools_'
const DEFAULT_WINDOWS = {
    favoriteEdit: {
        visible: false,
        position: { x: 420, y: 160 },
        size: { width: 640, height: 680 }
    }
}

const getInitialWindowState = () => {
    try {
        const savedState = localStorage.getItem(`${STORAGE_PREFIX}favoriteEditState`)
        if (savedState) {
            const parsedState = JSON.parse(savedState)
            const mergedState = { ...DEFAULT_WINDOWS }
            if (parsedState.favoriteEdit) {
                mergedState.favoriteEdit = { ...DEFAULT_WINDOWS.favoriteEdit, ...parsedState.favoriteEdit }
            }
            return mergedState
        }
    } catch (error) {
        console.error('Error loading window states:', error)
    }
    return { ...DEFAULT_WINDOWS }
}

const windows = ref(getInitialWindowState())

watch(windows, (newState) => {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}favoriteEditState`, JSON.stringify(newState))
    } catch (error) {
        console.error('Error saving window states:', error)
    }
}, { deep: true })

const closeWindow = () => {
    isOpen.value = false
}

const updatePosition = (windowName, newPosition) => {
    if (windows.value[windowName]) {
        windows.value[windowName].position = { ...newPosition }
    }
}

const updateSize = (windowName, newSize) => {
    if (windows.value[windowName]) {
        windows.value[windowName].size = { ...newSize }
    }
}

// ===== 打开 / 关闭 =====
const nameInputRef = ref(null)
const tagTextareaRef = ref(null)
const focusTagTextarea = () => {
    tagTextareaRef.value?.focus()
}

// 打开窗口：item=null 为新增，item={id_index,name,tag,color,...} 为编辑
const open = (item) => {
    console.log('[WeiLin] 编辑窗口 open 调用, isEditing =', !!item, ', item =', item)
    isEditingTag.value = !!item
    if (item) {
        currentTag.value = { ...item }
        // 显示层精简：编辑框只显示纯提示词文本；lora 字段进入独立编辑态，保存时统一重建 {prompt, lora}
        resetLoraEditState()
        const info = extractPromptInfo(item.tag)
        currentTag.value.tag = info.prompt
        editingLoras.value = Array.isArray(info.lora) ? info.lora : []
        refreshLoraExistence(getLoraNames(editingLoras.value))
        colorPickerState.value = rgbaToColorPickerState(item.color)
    } else {
        currentTag.value = {
            id: '',
            name: '',
            tag: '',
            backgroundColor: 'transparent'
        }
        resetLoraEditState()
        // 新增默认：全透明（parseRgba('transparent') 等价态）
        colorPickerState.value = { hex: '#FFFFFF', alpha: 0 }
    }
    isOpen.value = true
    // 已打开时置顶激活；新打开时 DraggableWindow mounted 自注册即置顶，此调用冗余无害
    windowManager.setActiveWindow('favoriteEditWindow')
    // 对话框打开后自动聚焦：编辑模式聚焦标签内容区，新增模式聚焦名称框
    nextTick(() => {
        if (isEditingTag.value) {
            tagTextareaRef.value?.focus()
        } else {
            nameInputRef.value?.focus()
        }
    })
}

const close = () => {
    isOpen.value = false
    currentTag.value = {
        name: '',
        tag: '',
        color: 'rgba(255, 123, 2, .4)'
    }
    resetLoraEditState()
    resetAutocomplete()
    isEditingTag.value = false
}

defineExpose({ open })

// ===== 提取收藏 tag 的展示/编辑信息（非 JSON 原样保留，避免旧数据解析失败）=====
const extractPromptInfo = (strJson) => {
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
        info = { isJson: false, prompt: strJson, lora: "", parsed: null }
    }
    return info
}

const getLoraNames = (loraArr) => {
    if (!Array.isArray(loraArr)) return []
    return loraArr.map(item => (item && item.name) ? item.name : '').filter(Boolean)
}

// Lora 显示名：剥掉已知模型扩展名（仅展示用；数据层 name 保留完整路径）。
// 白名单避免误伤含点文件名（如 xxx16.0_rank32）
const loraDisplayName = (name) => {
    if (typeof name !== 'string' || !name) return name
    return name.replace(/\.(safetensors|pt|bin|ckpt)$/i, '')
}

// ===== Lora 存在性检测：批量比对 loras 目录列表，失效文件（被移动/删除/改名）标红 =====
const loraExistMap = ref({})
const isLoraMissing = (name) => loraExistMap.value[name] === false
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

// ===== 跟随 Lora 编辑态 =====
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

const removeLoraFromTag = (name) => {
    editingLoras.value = editingLoras.value.filter(l => l.name !== name)
}

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

// ===== token 计数：与主编辑器 calculateTokens 同口径（按空白分词）=====
const calculateTokens = (text) => {
    if (!text) return 0
    const trimmed = text.trim()
    return trimmed ? trimmed.split(/\s+/).length : 0
}
const tokenCount = computed(() => calculateTokens(currentTag.value.tag))

// ===== 标签编辑框自动补全（防抖 150ms + 请求序号 + Map 缓存 + embeddings 前缀/混入）=====
const AUTOCOMPLETE_DEBOUNCE_MS = 150
const AUTOCOMPLETE_CACHE_MAX = 100
const AUTOCOMPLETE_EMBEDDING_MAX = 50
const AUTOCOMPLETE_EMBEDDING_MIX_MAX = 10
const AUTOCOMPLETE_MAX_WIDTH = 380
const autocompleteRef = ref(null)
const showAutocomplete = ref(false)
const autocompleteResults = ref([])
const selectedIndex = ref(0)
const autocompleteTop = ref(0)
const autocompleteLeft = ref(0)
let autocompleteTimer = null
let autocompleteSeq = 0
const autocompleteCache = new Map()
let embeddingsCache = null
let embeddingsFetchFailedAt = 0 // 失败冷却：30s 内不重试，避免失败被永久缓存为空列表
let selectedItemEl = null

// embeddings 数据源：主用插件自身端点，失败时回退 ComfyUI 原生 /api/embeddings
//（裸 /embeddings 被第三方扩展页面占用，勿用）
const fetchEmbeddings = async () => {
    if (embeddingsCache !== null) return embeddingsCache
    if (Date.now() - embeddingsFetchFailedAt < 30000) return []
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
        embeddingsCache = list.filter(n => typeof n === 'string')
        if (embeddingsCache.length === 0) {
            console.warn('[WeiLin] embeddings 列表为空——请确认 ComfyUI 的 models/embeddings 目录非空')
        }
    } catch (e) {
        console.warn('[WeiLin] 获取 embeddings 列表失败:', e)
        embeddingsFetchFailedAt = Date.now()
        return []
    }
    return embeddingsCache
}

// ===== 诊断：ComfyUI 页面控制台执行 window.weilinEmbeddingDiag() =====
const weilinEmbeddingDiag = async () => {
    const report = { cacheCount: embeddingsCache === null ? '未加载' : embeddingsCache.length, cooldown30s: Date.now() - embeddingsFetchFailedAt < 30000 }
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

// 普通输入混入 embeddings 候选（正斜杠归一化比对，插入保留原名）
const buildEmbeddingTail = async (lowerQuery) => {
    const list = await fetchEmbeddings()
    return list
        .filter(name => name.replace(/\\/g, '/').toLowerCase().includes(lowerQuery))
        .slice(0, AUTOCOMPLETE_EMBEDDING_MIX_MAX)
        .map(name => ({ text: 'embedding:' + name, desc: 'embedding', isEmbedding: true }))
}

// 权重语法剥离（同主编辑器 extractText：lora名:0.8 → lora名）
const extractText = (input) => {
    const match = input.match(/([^:]+):[\d.]+/)
    return match ? match[1] : input
}

const closeAutocomplete = () => {
    showAutocomplete.value = false
}

const resetAutocomplete = () => {
    if (autocompleteTimer) {
        clearTimeout(autocompleteTimer)
        autocompleteTimer = null
    }
    autocompleteSeq++
    showAutocomplete.value = false
    autocompleteResults.value = []
}

// 编辑窗口右键：有选中文字时完全放行原生菜单（复制场景）；
// 无选区时 preventDefault 后：有补全浮窗优先只关浮窗，否则关闭窗口。
// 选区检测分两路：输入框用自身 selectionStart/End（window.getSelection 对其内部选区返回空）
const handleEditContextMenu = (event) => {
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
    if (showAutocomplete.value) {
        closeAutocomplete()
    } else {
        close()
    }
}

// 光标前的当前单词（以逗号/空白为界）
const getCurrentWord = () => {
    const textarea = tagTextareaRef.value
    if (!textarea) return { word: '', start: 0, end: 0 }
    const pos = textarea.selectionStart
    const text = textarea.value || ''
    let start = pos
    while (start > 0 && !/[,\s]/.test(text[start - 1])) start--
    return { word: text.substring(start, pos), start, end: pos }
}

// 镜像 div 测量光标位置（left+top：下拉跟随光标列）
const calculatePosition = async () => {
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
    autocompleteLeft.value = left
    autocompleteTop.value = top
}

// 去重：按候选文本小写归一化，保留首个出现（同主编辑器 dedupeAutocompleteResults）
const dedupeResults = (results) => {
    const seen = new Set()
    return (results || []).filter(item => {
        if (!item || !item.text) return false
        const key = String(item.text).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

const applyResults = async (results) => {
    autocompleteResults.value = dedupeResults(results)
    if (autocompleteResults.value.length > 0) {
        await calculatePosition()
    }
    showAutocomplete.value = autocompleteResults.value.length > 0
    selectedIndex.value = 0
}

const scrollToSelected = () => {
    nextTick(() => {
        const container = autocompleteRef.value
        if (!container) return
        const el = container.querySelector('.fav-autocomplete-item.selected')
        if (el) el.scrollIntoView({ block: 'nearest' })
    })
}

const triggerAutocomplete = (rawWord) => {
    let cleaned = rawWord.replace(/[\[\]{}]/g, '').trim()

    // embedding 前缀检测必须在 extractText 之前（权重正则会截断数字开头的 embedding 名）；
    // 兼容全角冒号；裸词 "embedding" 也直接列出 embedding 候选，
    // 正则放宽为 embedding 前缀 + 可选冒号 + 任意后缀，裸词后续输入持续过滤
    const embeddingPrefixMatch = cleaned.match(/^embedding[:：]?(.*)$/i)
    if (embeddingPrefixMatch) {
        if (autocompleteTimer) {
            clearTimeout(autocompleteTimer)
            autocompleteTimer = null
        }
        autocompleteSeq++
        const filter = (embeddingPrefixMatch[1] || '').trim().toLowerCase()
        fetchEmbeddings().then((list) => {
            const matched = list
                .filter(name => name.replace(/\\/g, '/').toLowerCase().includes(filter))
                .slice(0, AUTOCOMPLETE_EMBEDDING_MAX)
                .map(name => ({ text: 'embedding:' + name, desc: 'embedding', isEmbedding: true }))
            applyResults(matched)
        }).catch((e) => {
            console.warn('[WeiLin] embedding 前缀补全失败:', e)
        })
        return
    }

    const text = extractText(cleaned).trim()
    // 空或过长：关闭并作废在途请求
    if (!text || text.length > 20) {
        if (autocompleteTimer) {
            clearTimeout(autocompleteTimer)
            autocompleteTimer = null
        }
        autocompleteSeq++
        showAutocomplete.value = false
        return
    }

    const lowerInput = text.toLowerCase()
    if (autocompleteCache.has(lowerInput)) {
        autocompleteSeq++
        applyResults(autocompleteCache.get(lowerInput))
        return
    }

    if (autocompleteTimer) clearTimeout(autocompleteTimer)
    autocompleteTimer = setTimeout(async () => {
        autocompleteTimer = null
        const seq = ++autocompleteSeq
        try {
            const res = await autocompleteApi.getAutocomplete(String(lowerInput))
            if (seq !== autocompleteSeq) return
            const results = res.data || []
            const embeddingTail = await buildEmbeddingTail(lowerInput)
            if (seq !== autocompleteSeq) return
            const mergedResults = results.concat(embeddingTail)
            if (autocompleteCache.size >= AUTOCOMPLETE_CACHE_MAX) {
                const firstKey = autocompleteCache.keys().next().value
                autocompleteCache.delete(firstKey)
            }
            autocompleteCache.set(lowerInput, mergedResults)
            await applyResults(mergedResults)
        } catch (error) {
            if (seq === autocompleteSeq) {
                showAutocomplete.value = false
            }
        }
    }, AUTOCOMPLETE_DEBOUNCE_MS)
}

const handleInput = () => {
    const { word } = getCurrentWord()
    if (word.trim()) {
        triggerAutocomplete(word)
    } else {
        closeAutocomplete()
    }
}

const textareaKeydown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return // Ctrl+Enter 保存等组合键放行
    if (!showAutocomplete.value) return
    if (event.key === 'ArrowDown') {
        event.preventDefault()
        selectedIndex.value = Math.min(selectedIndex.value + 1, autocompleteResults.value.length - 1)
        scrollToSelected()
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
        scrollToSelected()
    } else if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault()
        selectAutocomplete(selectedIndex.value, null)
    } else if (event.key === 'Escape') {
        // 只关补全浮窗，不冒泡到 DraggableWindow（否则整窗被 ESC 关闭）
        event.preventDefault()
        event.stopPropagation()
        closeAutocomplete()
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
        closeAutocomplete()
    }
}

// 选中补全项：替换光标前单词并追加 ", "（格式转换读同一批 localStorage 开关；
// embedding 文件名跳过全部转换，否则下划线转空格/括号转义会毁文件名）
const selectAutocomplete = (index, event) => {
    if (event) {
        event.preventDefault()
        event.stopPropagation()
    }
    const item = autocompleteResults.value[index]
    if (!item) return
    showAutocomplete.value = false
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
const handleDocClick = (event) => {
    if (!showAutocomplete.value) return
    const container = autocompleteRef.value
    if (container && container.contains(event.target)) return
    if (tagTextareaRef.value && tagTextareaRef.value === event.target) return
    closeAutocomplete()
}

// ===== 颜色选择器 =====
const previewColor = computed(() => currentTag.value.color)

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
        return { hex, alpha: Math.round((a || 1) * 100) }
    }
    return { hex: '#FFFFFF', alpha: 0 }
}

const rgbaToColorPickerState = (rgba) => {
    const match = rgba && rgba.match ? rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/) : null
    if (match) {
        const [, r, g, b, a] = match
        const hex = `#${((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1)}`
        const alpha = a ? Math.round(parseFloat(a) * 100) : 100
        return { hex, alpha }
    }
    return { hex: '#FF7B02', alpha: 50 }
}

const updateColor = () => {
    currentTag.value.color = hexToRgba(colorPickerState.value.hex, colorPickerState.value.alpha)
}

const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
}

// ===== 保存 =====
const broadcastRefresh = () => {
    window.postMessage({ type: 'weilin_prompt_ui_refresh_all_data' }, '*')
}

const saveTag = () => {
    if (!currentTag.value.tag) {
        message({ type: "warn", str: 'history.dialog.tag_placeholder' });
        return
    }

    // 方案 A（存储精简）：统一存 {prompt, lora}，剥离 temp_prompt/temp_lora；
    // 旧收藏存储不动，每编辑保存一次自动迁移为新格式；lora 为编辑窗口中增删后的结果
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
            .then(() => {
                broadcastRefresh()
                message({ type: "success", str: 'message.editSuccess' });
            })
            .catch(() => {
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
                broadcastRefresh()
            })
            .catch(() => {
                message({ type: "warn", str: 'message.networkError' });
            });
    }

    close()
}

onMounted(() => {
    document.addEventListener('click', handleDocClick)
})

onUnmounted(() => {
    document.removeEventListener('click', handleDocClick)
    if (autocompleteTimer) clearTimeout(autocompleteTimer)
    if (loraSearchTimer) clearTimeout(loraSearchTimer)
})
</script>

<style scoped>
/* ===== 表单（原编辑对话框样式迁移）===== */
.fav-edit-body {
    display: flex;
    flex-direction: column;
}

.fav-edit-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    padding-top: 16px;
    margin-top: 4px;
    border-top: 1px solid var(--weilin-prompt-ui-border-color);
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

.form-group:last-of-type {
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

/* ===== 跟随 Lora 编辑徽章 ===== */
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

.lora-chip-missing {
    border-color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
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

/* ===== 自动补全下拉 ===== */
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

/* ===== 颜色选择器 ===== */
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
}

/* ===== 按钮 ===== */
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
</style>
