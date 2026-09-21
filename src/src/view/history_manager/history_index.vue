<template>
    <div class="container">
        <h1>{{ t('history.title') }}</h1>
        <div class="search-container">
            <button class="refresh-btn" @click="refreshHistory">
                <svg viewBox="0 0 24 24" width="16" height="16" class="refresh-icon">
                    <path
                        d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
            </button>
            <input type="text" v-model="searchQuery" :placeholder="t('history.search_placeholder')"
                @input="filterHistory" class="search-input" />
            <!-- 日期筛选：按 create_time 落在 [开始日 00:00, 结束日 24:00) 过滤；任一端留空表示不限制 -->
            <div class="date-filter" ref="dateFilterRef">
                <button class="date-filter-btn" :class="{ 'date-filter-active': dateFilterActive }"
                    @click.stop="showDateFilter = !showDateFilter" :title="dateFilterTitle">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                            d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
                    </svg>
                </button>
                <div v-if="showDateFilter" class="date-filter-pop" @click.stop>
                    <!-- 用 div 而非 label：label 会把内部非交互元素的点击转发给第一个表单控件（dfi-input），
                         导致点年/月数字时 input 重新聚焦、openPop 把 viewMode 重置回 day，年/月面板永远弹不出来 -->
                    <div class="date-filter-row">
                        <span class="date-filter-label">{{ t('history.date_from') }}</span>
                        <DateFilterInput v-model="dateFrom" @update:model-value="filterHistory" />
                    </div>
                    <div class="date-filter-row">
                        <span class="date-filter-label">{{ t('history.date_to') }}</span>
                        <DateFilterInput v-model="dateTo" @update:model-value="filterHistory" />
                    </div>
                    <button class="date-filter-clear" :disabled="!dateFilterActive" @click="clearDateFilter">
                        {{ t('history.date_clear') }}
                    </button>
                </div>
            </div>
            <input type="checkbox" v-if="isDeleteBatch" v-model="selectAllTags" :value="1" class="tag-checkbox"
                @change="selectAllTagsChange" />
            <!-- 74.24：原"清空全部历史记录"按钮更换为切换到收藏夹窗口（toggle：再点一次收起） -->
            <button v-if="!isDeleteBatch" class="clear-all-btn" @click="openFavoritesWindow"
                :title="t('history.switch_to_favorites')">
                <svg viewBox="0 0 24 24" width="16" height="16" class="clear-all-icon">
                    <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
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
            <button v-if="isDeleteBatch" class="bulk-delete-btn" @click="sureDelete"
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
            <li v-for="item in filteredHistory" :key="item.id_index" class="history-item">
                <div class="item-main">
                    <span class="item-prompt">{{ retPromptInfo(item.tag) }}</span>
                </div>
                <!-- 74.26：跟随 Lora 徽章（对齐收藏夹列表：chip 展示 + 缺失标红） -->
                <div class="lora-tags" v-if="itemLoraNames(item.tag).length > 0">
                    <span class="lora-chip" v-for="(lname, i) in itemLoraNames(item.tag)" :key="i"
                        :class="{ 'lora-chip-missing': isLoraMissing(lname) }"
                        :title="lname + (isLoraMissing(lname) ? '（' + t('history.dialog.lora_missing') + '）' : '')">{{
                            loraDisplayName(lname) }}</span>
                </div>
                <div class="action-buttons">
                    <button @click="addToFavorites(item)" class="favorite-btn"
                        :title="t('history.add_to_favorites')">
                        <svg viewBox="0 0 24 24" width="24" height="24" class="favorite-icon">
                            <path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </button>
                    <button @click="deleteHistory(item)" class="delete-favorite-btn"
                        :title="t('history.delete_history')">
                        <svg viewBox="0 0 1024 1024" width="24" height="24" class="delete-favorite-icon">
                            <path
                                d="M907.618072 232.742353 744.713682 232.742353 744.713682 116.382952c0-12.852708-10.419786-23.272495-23.272495-23.272495L302.556765 93.110457c-12.852708 0-23.272495 10.418762-23.272495 23.272495l0 116.360425L116.380904 232.743377c-12.852708 0-23.272495 10.419786-23.272495 23.272495s10.418762 23.272495 23.272495 23.272495l791.237168 0c12.852708 0 23.272495-10.419786 23.272495-23.272495S920.469756 232.742353 907.618072 232.742353zM325.829259 139.654423l372.340458 0 0 93.08793L325.829259 232.742353 325.829259 139.654423zM791.257647 372.362985c-12.852708 0-23.272495 10.418762-23.272495 23.272495l0 488.712146L256.012799 884.347625 256.012799 395.635479c0-12.852708-10.418762-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 511.983617c0 12.852708 10.418762 23.272495 23.272495 23.272495l558.516318 0c12.852708 0 23.272495-10.419786 23.272495-23.272495L814.529118 395.635479C814.529118 382.782771 804.110355 372.362985 791.257647 372.362985zM442.189684 767.987201l0-372.351721c0-12.852708-10.418762-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 372.351721c0 12.852708 10.418762 23.272495 23.272495 23.272495S442.189684 780.839909 442.189684 767.987201zM628.353257 767.987201l0-372.351721c0-12.852708-10.419786-23.272495-23.272495-23.272495s-23.272495 10.418762-23.272495 23.272495l0 372.351721c0 12.852708 10.419786 23.272495 23.272495 23.272495S628.353257 780.839909 628.353257 767.987201z">
                            </path>
                        </svg>
                    </button>
                    <button @click="useItem(item)" class="use-btn" :title="t('history.use_item')">
                        <svg viewBox="0 0 1024 1024" width="24" height="24" class="use-icon">
                            <path
                                d="M915.515273 142.819385 98.213046 458.199122c-46.058539 17.772838-44.90475 43.601756 2.348455 57.622994l197.477685 58.594874 80.292024 238.91085c10.51184 31.277988 37.972822 37.873693 61.462483 14.603752l103.584447-102.611545 204.475018 149.840224c26.565749 19.467242 53.878547 9.222132 61.049613-23.090076l149.210699-672.34491C965.264096 147.505054 946.218922 130.971848 915.515273 142.819385zM791.141174 294.834331l-348.61988 310.610267c-6.268679 5.58499-11.941557 16.652774-12.812263 24.846818l-15.390659 144.697741c-1.728128 16.24808-7.330491 16.918483-12.497501 1.344894l-67.457277-203.338603c-2.638691-7.954906 0.975968-17.705389 8.022355-21.931178l442.114555-265.181253C812.67481 268.984974 815.674251 272.975713 791.141174 294.834331z"
                                p-id="18085"></path>
                        </svg>
                    </button>
                    <input type="checkbox" v-if="isDeleteBatch" v-model="selectedTags" :value="item.id_index"
                        class="tag-checkbox" />
                    <span class="item-time" :title="formatFullTime(item.create_time)">{{ formatRelativeTime(item.create_time) }}</span>
                </div>
            </li>
        </ul>

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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { historyApi } from "@/api/history";
import { loraApi } from "@/api/lora";
import message from "@/utils/message";
import { useI18n } from 'vue-i18n'
import DateFilterInput from '@/components/DateFilterInput.vue'

const { t } = useI18n()
const searchQuery = ref('');
const history = ref([]); // 存储历史记录
const filteredHistory = ref([]); // 存储过滤后的历史记录
// 日期筛选（YYYY-MM-DD 字符串）：开始/结束任一端留空表示该侧不限制；按本地时区解释
const dateFrom = ref('');
const dateTo = ref('');
// 日期筛选按钮 + 弹出面板：收敛工具栏空间，摘要放按钮悬浮提示；
// 面板内日期输入用自绘迷你日历组件 DateFilterInput（原生 date 控件的日历会吞页面点击）
const showDateFilter = ref(false);
const dateFilterRef = ref(null);
const dateFilterActive = computed(() => !!(dateFrom.value || dateTo.value));
// 悬浮提示：无筛选显示功能名，有筛选显示完整范围（按钮本体为纯图标，摘要挪到这里）
const dateFilterTitle = computed(() => {
    if (!dateFilterActive.value) return t('history.date_filter');
    return `${t('history.date_filter')}: ${dateFrom.value || '...'} ~ ${dateTo.value || '...'}`;
});
const clearDateFilter = () => {
    dateFrom.value = '';
    dateTo.value = '';
    filterHistory();
};
const closeDateFilterOnClickOutside = (e) => {
    if (showDateFilter.value && dateFilterRef.value && !dateFilterRef.value.contains(e.target)) {
        showDateFilter.value = false;
    }
};
const selectedTags = ref([]);
const showDeleteDialog = ref(false)

const isDeleteBatch = ref(false)
const selectAllTags = ref(0)

// 列表渲染缓存：同一 tag 的 JSON 解析只做一次（几千条历史时避免每次渲染重复 parse 卡顿）
const promptInfoCache = new Map()
const retPromptInfo = (strJson) => {
    if (promptInfoCache.has(strJson)) return promptInfoCache.get(strJson)
    let result
    try {
        result = JSON.parse(strJson).prompt
    } catch (e) {
        result = strJson // 旧数据/非 JSON 内容原样显示，避免解析失败白屏
    }
    promptInfoCache.set(strJson, result)
    return result
}

// 74.26：跟随 Lora 徽章（对齐收藏夹列表展示：名字剥后缀 + 缺失标红）。
// 历史 JSON 的 lora 字段与收藏夹同构：数组 [{name, weight, ...}] 或空串（旧数据/无 lora）
const loraInfoCache = new Map() // 与 promptInfoCache 同理：同一 tag 的 lora 解析只做一次
const itemLoraNames = (strJson) => {
    if (loraInfoCache.has(strJson)) return loraInfoCache.get(strJson)
    let result = []
    try {
        const parsed = JSON.parse(strJson)
        if (parsed && Array.isArray(parsed.lora)) {
            result = parsed.lora.map(l => (l && l.name) ? l.name : '').filter(Boolean)
        }
    } catch (e) { /* 旧数据/非 JSON 内容无 lora 可言 */ }
    loraInfoCache.set(strJson, result)
    return result
}
// 显示名剥已知模型扩展名（仅展示用；存在检测/恢复灌回依赖完整名）。
// 白名单避免误伤含点文件名（如 xxx16.0_rank32）
const loraDisplayName = (name) => {
    if (typeof name !== 'string' || !name) return name
    return name.replace(/\.(safetensors|pt|bin|ckpt)$/i, '')
}
// Lora 存在性检测：批量比对 loras 目录列表，失效文件（被移动/删除/改名）标红
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

// 相对时间显示：24 小时内用相对时间（刚刚 / N分钟前 / N小时前），超过 24 小时显示日期
// （当年显示 MM-DD，往年带年份 YYYY-MM-DD）；精确到分的时间通过时间戳 span 的 :title 查看
const formatRelativeTime = (unixSeconds) => {
    if (!unixSeconds) return ''
    const diff = Math.floor((Date.now() - unixSeconds * 1000) / 1000)
    if (diff < 60) return t('history.time.justNow')
    if (diff < 3600) return t('history.time.minutesAgo', { n: Math.floor(diff / 60) })
    if (diff < 86400) return t('history.time.hoursAgo', { n: Math.floor(diff / 3600) })
    return formatDateShort(unixSeconds)
}

// 短日期（YYYY-MM-DD，带年份）：超过 24 小时的时间戳主显示
const formatDateShort = (unixSeconds) => {
    const d = new Date(unixSeconds * 1000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 完整时间（YYYY-MM-DD HH:MM）：用于时间戳 span 的悬浮 title，弥补相对时间丢失的精度
const formatFullTime = (unixSeconds) => {
    if (!unixSeconds) return ''
    const d = new Date(unixSeconds * 1000)
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${hhmm}`
}

const deleteType = ref('')
const itemToDelete = ref(null)
// 74.33：确认消息里的条目名用 prompt 摘要（原实现直接嵌完整 tag JSON——几千字符的超长
// 无空格文本会把弹窗撑出视口，footer 的确定/取消按钮被推到屏幕外看不见）
const summarizeTag = (strJson, max = 80) => {
    let s = retPromptInfo(strJson)
    if (typeof s !== 'string' || !s) s = String(strJson ?? '')
    s = s.trim()
    return s.length > max ? s.slice(0, max) + '…' : s
}
const deleteConfirmMessage = computed(() => {
    if (!itemToDelete.value) return ''

    switch (deleteType.value) {
        case 'history':
            return t('history.deleteHistoryConfirm', { name: summarizeTag(itemToDelete.value.tag) })
        case 'clearHistory':
            return t('history.confirmClearHistory')
        case 'deleteSelected':
            return t('history.confirmDeleteSelected')
        default:
            return ''
    }
})

const deleteHistory = (history) => {
    deleteType.value = 'history'
    itemToDelete.value = history
    showDeleteDialog.value = true
}

// 74.24：切换到收藏夹窗口（原"清空全部"按钮槽位）；沿用 prompt_box 的 toggle 打开模式，
// 目标窗口已显示时再点一次即收起
const openFavoritesWindow = () => {
    window.parent.postMessage({ type: 'weilin_prompt_ui_openFavoritesManager', data: { toggle: true } }, '*')
}

const sureDelete = () => {
    isDeleteBatch.value = false
    selectAllTags.value = 0
    deleteType.value = 'deleteSelected'
    itemToDelete.value = selectedTags.value
    showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
    try {
        switch (deleteType.value) {
            case 'history':
                historyApi
                    .deleteHistory(itemToDelete.value.id_index)
                    .then((res) => {
                        fetchHistory()
                        message({ type: "success", str: 'message.deleteSuccess' });
                    })
                    .catch((err) => {
                        message({ type: "warn", str: 'message.networkError' });
                    });
                break
            case 'deleteSelected':
                historyApi.
                    batchDeleteHistory(selectedTags.value)
                    .then((res) => {
                        fetchHistory()
                        message({ type: "success", str: 'message.deleteSuccess' });
                    })
                    .catch((err) => {
                        message({ type: "warn", str: 'message.networkError' });
                    });
                break
            case 'clearHistory':
                historyApi
                    .clearHistory()
                    .then((res) => {
                        fetchHistory()
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
        selectedTags.value = history.value.map(item => item.id_index)
    } else {
        selectedTags.value = []
    }
}

// 关闭删除对话框
const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    deleteType.value = ''
    itemToDelete.value = null
}

const fetchHistory = () => {
    historyApi
        .getHistory({})
        .then((res) => {
            history.value = res.data;
            filterHistory(); // 初始化/刷新后按当前关键词+日期条件重新过滤（保留筛选状态）
            // 74.26：对列表内全部跟随 Lora 做一次批量存在性检测（未见过的名字才发请求）
            const allNames = []
            history.value.forEach(item => allNames.push(...itemLoraNames(item.tag)))
            refreshLoraExistence(allNames)
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
        });
};

const filterHistory = () => {
    // 组合过滤：关键词（tag 包含）+ 日期范围（create_time 落在 [开始日 00:00, 结束日次日 00:00)）
    const fromTs = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`).getTime() / 1000 : null
    const toTs = dateTo.value ? new Date(`${dateTo.value}T00:00:00`).getTime() / 1000 + 86400 : null
    filteredHistory.value = history.value.filter(item =>
        item.tag.includes(searchQuery.value)
        && (fromTs === null || (item.create_time && item.create_time >= fromTs))
        && (toTs === null || (item.create_time && item.create_time < toTs))
    );
};

const refreshHistory = () => {
    // 刷新历史记录
    fetchHistory();
};

const addToFavorites = (item) => {
    // 添加到收藏夹的逻辑
    historyApi
        .addFavorite({ tag: item.tag })
        .then((res) => {
            if (res.code === 200) {
                window.postMessage({
                    type: 'weilin_prompt_ui_refresh_all_data',
                }, '*')
                message({ type: "success", str: 'message.addFavoriteSuccess' });
            } else {
                message({ type: "success", str: 'message.addFavoriteIsExist' });
            }
        })
        .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
        });
};

const useItem = (item) => {
    // 发送消息通知
    window.postMessage({
        type: 'weilin_prompt_ui_user_history_tag',
        tagText: item.tag
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

onMounted(() => {
    fetchHistory();
    document.addEventListener('click', closeDateFilterOnClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', closeDateFilterOnClickOutside);
});
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

/* 日期筛选：单按钮 + 弹出面板（取代裸露的两个 date 输入框） */
.date-filter {
    position: relative;
    flex: 0 0 auto;
    /* 与右侧图标按钮组的 margin-left:10px 保持同一间隙节奏 */
    margin-left: 10px;
}

/* 与同行图标按钮（收藏/批量删除）同规格：32x32 方钮、纯图标居中 */
.date-filter-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-secondary-bg, var(--weilin-prompt-ui-input-bg));
    color: var(--weilin-prompt-ui-primary-text);
    cursor: pointer;
    transition: all 0.2s ease;
}

.date-filter-btn svg {
    fill: currentColor;
}

.date-filter-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    border-color: var(--weilin-prompt-ui-primary-color);
}

/* 有筛选条件时高亮按钮（图标+边框变主色），一眼可辨当前处于筛选状态 */
.date-filter-btn.date-filter-active {
    color: var(--weilin-prompt-ui-primary-color);
    border-color: var(--weilin-prompt-ui-primary-color);
    background: var(--weilin-prompt-ui-primary-color-fade, rgba(24, 144, 255, 0.12));
}

.date-filter-pop {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 230px;
    padding: 10px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 6px;
    background: var(--weilin-prompt-ui-secondary-background, var(--weilin-prompt-ui-input-bg));
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.date-filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--weilin-prompt-ui-primary-text);
}

.date-filter-label {
    flex: 0 0 auto;
    white-space: nowrap;
}

/* 日期输入与迷你日历的样式全部内聚在 DateFilterInput 组件（scoped），此处无需重复定义 */

.date-filter-clear {
    align-self: flex-end;
    padding: 4px 12px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: transparent;
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
}

.date-filter-clear:hover:not(:disabled) {
    border-color: var(--weilin-prompt-ui-primary-color);
    color: var(--weilin-prompt-ui-primary-color);
}

.date-filter-clear:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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

/* 74.26：跟随 Lora 徽章（对齐收藏夹列表样式） */
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

/* 跟随 Lora 文件缺失标记（定义在 .lora-chip 之后以覆盖其颜色） */
.lora-chip-missing {
    border-color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
    color: var(--weilin-prompt-ui-danger-color, #ff4d4f);
}

.action-buttons {
    padding-top: 10px;
    display: flex;
    gap: 8px;
    /* 按钮之间的间距 */
}

.favorite-btn,
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

.favorite-btn:hover,
.delete-favorite-btn:hover,
.use-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    border-color: var(--weilin-prompt-ui-primary-color);
}

.favorite-icon,
.delete-favorite-icon,
.use-icon {
    fill: var(--weilin-prompt-ui-primary-text);
    width: 18px;
    height: 18px;
}

.favorite-btn:hover .favorite-icon,
.delete-favorite-btn:hover .delete-favorite-icon,
.use-btn:hover .use-icon {
    fill: var(--weilin-prompt-ui-primary-color);
}

.tag-checkbox {
    margin-left: 3px;
    /* 复选框与标签文本之间的间距 */
}

.bulk-delete-btn,
.clear-all-btn {
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

.bulk-delete-btn:hover,
.clear-all-btn:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    border-color: var(--weilin-prompt-ui-primary-color);
}

.bulk-delete-icon,
.clear-all-icon {
    fill: var(--weilin-prompt-ui-primary-text);
}

/* 历史条目主行：提示词内容（时间戳已移至底部按钮行右侧） */
.item-main {
    word-break: break-all;
}

.item-prompt {
    min-width: 0;
}

.item-time {
    margin-left: auto; /* 在底部按钮行内靠右对齐 */
    align-self: center;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--weilin-prompt-ui-secondary-text, #999);
    white-space: nowrap;
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
    z-index: 9999;
}

.weilin-tools-dialog-content {
    background: var(--weilin-prompt-ui-primary-bg);
    border-radius: 8px;
    min-width: 400px;
    max-width: 90%;
    max-height: 90vh;
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
}

.weilin-tools-dialog-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--primary-text);
}

.weilin-tools-dialog-body {
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    min-height: 0;
}

.weilin-tools-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
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
    font-size: 20px;
    color: var(--weilin-prompt-ui-secondary-text);
    cursor: pointer;
    padding: 4px;
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
</style>
