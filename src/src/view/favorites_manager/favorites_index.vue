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
                        <DateFilterInput v-model="dateFrom" @update:model-value="filterFavorites" />
                    </div>
                    <div class="date-filter-row">
                        <span class="date-filter-label">{{ t('history.date_to') }}</span>
                        <DateFilterInput v-model="dateTo" @update:model-value="filterFavorites" />
                    </div>
                    <button class="date-filter-clear" :disabled="!dateFilterActive" @click="clearDateFilter">
                        {{ t('history.date_clear') }}
                    </button>
                </div>
            </div>

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
                    <span class="favor-time" :title="formatFullTime(item.create_time)">{{ formatRelativeTime(item.create_time) }}</span>
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { historyApi } from "@/api/history";
import { loraApi } from "@/api/lora";
import message from "@/utils/message";
import { useI18n } from 'vue-i18n'
import DateFilterInput from '@/components/DateFilterInput.vue'

const { t } = useI18n()
const searchQuery = ref('');
const favorites = ref([]); // 存储收藏夹记录
const filteredFavorites = ref([]); // 存储过滤后的收藏夹记录
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
    filterFavorites();
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




// 打开收藏编辑/新增独立窗口（原模态对话框窗口化，表单在 favorite_edit_window.vue）。
// 数据传递用组件事件（emit 引用直传）而非 postMessage：postMessage 的结构化克隆既不接受
// reactive Proxy（会抛 DataCloneError），实测普通对象负载也会丢失 item（open 收到 null 走新增模式）
const emit = defineEmits(['edit-favorite'])
const openFavoriteEditWindow = (item) => {
    console.log('[WeiLin] 编辑窗口请求, item =', item ? { id_index: item.id_index, name: item.name, tagLen: (item.tag || '').length } : null)
    emit('edit-favorite', item || null)
}

const showAddTagDialog = () => {
    openFavoriteEditWindow(null)
}


// 编辑收藏：打开独立编辑窗口并传入整条收藏
const editTag = (item) => {
    openFavoriteEditWindow(item)
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


// 关闭删除对话框
const closeDeleteDialog = () => {
    showDeleteDialog.value = false
    deleteType.value = ''
    itemToDelete.value = null
}

// 相对时间显示：与历史记录页一致——24 小时内用相对时间（刚刚 / N分钟前 / N小时前），
// 超过 24 小时显示日期（当年 MM-DD，往年带年份 YYYY-MM-DD）；
// 精确到分的时间通过时间戳 span 的 :title（formatFullTime）查看
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



const fetchFavorites = () => {
    historyApi
        .getFavorite()
        .then((res) => {
            favorites.value = res.data;
            filterFavorites(); // 初始化/刷新后按当前关键词+日期条件重新过滤（保留筛选状态）
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
    // 组合过滤：关键词（tag 包含）+ 日期范围（create_time 落在 [开始日 00:00, 结束日次日 00:00)）
    const fromTs = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`).getTime() / 1000 : null
    const toTs = dateTo.value ? new Date(`${dateTo.value}T00:00:00`).getTime() / 1000 + 86400 : null
    filteredFavorites.value = favorites.value.filter(item =>
        item.tag.includes(searchQuery.value)
        && (fromTs === null || (item.create_time && item.create_time >= fromTs))
        && (toTs === null || (item.create_time && item.create_time < toTs))
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
    document.addEventListener('click', closeDateFilterOnClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('message', handleWindowMessage)
    document.removeEventListener('click', closeDateFilterOnClickOutside);
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
