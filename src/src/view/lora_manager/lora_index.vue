<template>
  <!-- 74.86 重构：高度全部交给 CSS flex 分配（is-expand=还有数据未加载时撑满剩余空间；
       is-embedded 默认=全部加载完后收缩到内容高度）。不再有任何 JS 像素测量。 -->
  <div :class="[`${prefix}lora-manager`, {
    'is-embedded': loraManager === 'prompt_inner',
    'is-expand': loraManager === 'prompt_inner' && !hasLoadedAll,
  }]">
    <div class="lora-manager-top-bar">
      <!-- 添加搜索框 -->
      <input v-model="searchQuery" :class="`${prefix}search-input`" :placeholder="t('loraManager.searchPlaceholder')"
        @input="debouncedSearch" />

      <button :class="`${prefix}refresh-btn`" @click="refreshList" :title="t('loraManager.refresh')">
        <svg :class="[`${prefix}refresh-icon`, { 'is-rotating': isRefreshing }]" viewBox="0 0 24 24" width="20"
          height="20">
          <path
            d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
      </button>

      <button style="margin-left: 10px;" :class="`${prefix}refresh-btn`" @click="getAllLoraList"
        :title="t('loraManager.cacheAll')">
        <svg :class="[`${prefix}refresh-icon`, { 'is-rotating': isRefreshing }]" viewBox="0 0 24 24" width="20"
          height="20">
          <path
            d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
        </svg>
      </button>

      <!-- Lora 卡片排序：自绘下拉菜单（不用原生 select —— 原生下拉会吞掉页面下一次点击） -->
      <div :class="`${prefix}sort-bar`" ref="sortBarRef">
        <button :class="[`${prefix}sort-btn`, `${prefix}sort-trigger`]" @click="showSortMenu = !showSortMenu"
          :title="'排序方式：' + SORT_LABELS[sortKey]">
          <span>{{ SORT_LABELS[sortKey] }}</span>
          <svg :class="[`${prefix}sort-caret`, { open: showSortMenu }]" viewBox="0 0 24 24" width="12" height="12">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        <button :class="[`${prefix}sort-btn`, `${prefix}sort-dir`]" @click="toggleSortDir" :disabled="sortKey === 'default'"
          :title="sortKey === 'default' ? '「默认排序」不区分升降序' : (sortDir === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序')">
          {{ sortDir === 'asc' ? '↑' : '↓' }}
        </button>

        <!-- 下拉面板 -->
        <div v-if="showSortMenu" :class="`${prefix}sort-menu`">
          <div v-for="opt in SORT_OPTIONS" :key="opt.key"
            :class="[`${prefix}sort-option`, { active: sortKey === opt.key }]" @click="chooseSort(opt.key)">
            <span>{{ opt.label }}</span>
            <span v-if="sortKey === opt.key" :class="`${prefix}sort-check`">✓</span>
          </div>
        </div>
      </div>

      <!-- 添加复选框区域 -->
      <div class="checkbox-container">
        <label :class="`${prefix}checkbox-label`">
          <input type="checkbox" v-model="showHoverInfo" :class="`${prefix}checkbox`" />
          <span>悬浮信息</span>
        </label>
        <label :class="`${prefix}checkbox-label`" v-if="loraManager == 'prompt_inner'"
          title="勾选：点击卡片直接把该 Lora 的标签写入提示词；不勾选：点击卡片改为打开详情窗口">
          <input type="checkbox" v-model="clickAddTag" :class="`${prefix}checkbox`" />
          <span>添加Lora标签</span>
        </label>
        <!-- 「添加触发词」对所有模式生效（含 addLora 走 selectLora 的路径），故不限制 prompt_inner -->
        <label :class="`${prefix}checkbox-label`"
          title="写入提示词时是否同时附带该 Lora 的触发词（loraWorks）；不勾选则只写入 Lora 标签本身">
          <input type="checkbox" v-model="addTriggerWords" :class="`${prefix}checkbox`" />
          <span>添加触发词</span>
        </label>
      </div>
    </div>

    <!-- 主分类导航 -->
    <div :class="`${prefix}category-nav`" v-if="!isSearch">
      <button v-for="(category) in Object.keys(folderList)" :key="category"
        :class="[`${prefix}category-btn`, { active: currentCategory === category }]" @click="selectCategory(category)">
        {{ category === '/' ? t('loraManager.root') : category == "all" ? t('loraManager.all') : category }}
      </button>
    </div>

    <!-- 子分类导航 -->
    <div v-if="currentCategory != 'all' && !isSearch" :class="`${prefix}subcategory-nav`">
      <button v-for="subCategory in Object.keys(selectFolder)" :key="subCategory"
        :class="[`${prefix}category-btn`, { active: currentSubCategory === subCategory }]"
        @click="selectSecondCategory(subCategory)">
        {{ subCategory === '/' ? t('loraManager.root') : subCategory == "all" ? t('loraManager.all') : subCategory }}
      </button>
    </div>

    <!-- 使用虚拟滚动列表 -->
    <div :class="`${prefix}lora-list-container`" ref="scrollContainer" @scroll="handleScroll" @wheel="handleListWheel"
      title="按住 Ctrl + 滚轮 可调整卡片大小">
      <div v-if="isLoading && !isLoadingMore" class="loading-indicator">
        {{ t('loraManager.loading') }}
      </div>
      <div v-else-if="paginatedLoraList.length === 0" class="empty-list">
        {{ t('loraManager.noResults') }}
      </div>

      <div :class="`${prefix}lora-list`"
        :style="{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`, gap: '14px' }">
        <div v-for="lora in paginatedLoraList" :key="lora.file_path" :class="`${prefix}lora-card`" ref="loraCardRef"
          @click="openLoraDetail(lora)" @mouseover="(e) => handleMouseHover(lora.name, e)"
          @mouseleave="handleMouseLeave"
          :style="{ display: 'flex', flexDirection: 'column', minHeight: cardMinH + 'px', cursor: 'pointer' }">
          <div :class="`${prefix}lora-preview`"
            style="flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;width: 100%;">
            <video v-if="lora.preview && isVideoPreview(lora.preview)" :src="lora.preview" autoplay muted loop playsinline
              :style="{ width: '100%', height: '100%', objectFit: 'contain', minHeight: cardMinH + 'px' }" />
            <img v-else-if="lora.preview" :src="lora.preview" :alt="lora.model_name" :title="lora.model_name" loading="lazy"
              :style="{ width: '100%', height: '100%', objectFit: 'contain', minHeight: cardMinH + 'px' }" />
            <div v-else :class="`${prefix}no-preview`"
              :style="{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: cardMinH + 'px' }">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
          </div>
          <div :class="`${prefix}lora-name`" style="padding: 4px; text-align: center;
            word-break: break-word;
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 36px;
            max-height: 36px;
            line-height: 1.2;
            font-size: 13px;
            text-overflow: ellipsis;"> <!-- 添加文本溢出省略号 -->
            {{ retLoraName(lora) }}
          </div>
        </div>
      </div>

      <div>
        <!-- 加载更多提示 -->
        <div v-if="isLoadingMore" class="loading-more">
          {{ t('loraManager.loadingMore') }}
        </div>
        <div v-if="!isLoadingMore && hasLoadedAll" class="no-more-data">
          {{ t('loraManager.noMoreData') }}
        </div>
      </div>

    </div>

    <loraDetail ref="loraDetailRef" @cover-updated="onCoverUpdated" />
    <LoraCard ref="loraCardItem" v-if="showCard" :fileNmae="hoveFileName" :paddingLeft="paddingLeftValue"
      :paddingTop="paddingTopValue" @cardLeave="handleEnterLeave" @cardenter="handEnterCard" @openDetail="handleOpenDetail" @cover-updated="onCoverUpdated" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { loraApi } from '@/api/lora'
import loraDetail from './lora_detail.vue'
import message from "@/utils/message"
import LoraCard from './lora_card.vue'

const prefix = "weilin_prompt_ui_"
const { t } = useI18n()
const isRefreshing = ref(false)
const isLoading = ref(false)
const isLoadingMore = ref(false) // 加载更多状态
const hasLoadedAll = ref(false) // 是否已加载全部
const currentCategory = ref('all')
const currentSubCategory = ref('')
const intervalId = ref(null)
const searchQuery = ref('')
const scrollContainer = ref(null)
const showCard = ref(false)
const hoveFileName = ref('')
const paddingLeftValue = ref(100)
const paddingTopValue = ref(0)
const loraCardRef = ref()
const isEnterCatd = ref(false)
const isHovering = ref(false);
const loraCardItem = ref()

const showHoverInfo = ref(localStorage.getItem('weilin_prompt_ui_showHoverInfo'));
// 注意：localStorage 只能存字符串，'false' 是非空字符串 → 布尔真值！
// 必须显式 === 'true' 转成布尔，否则未勾选时 clickAddTag 拿到字符串 'false' 仍为真值，
// 点击卡片会一直走「直接添加Tag」分支（现象：勾不勾选都会自动添加预设提示词）。
const clickAddTag = ref(localStorage.getItem('weilin_prompt_ui_clickAddTag') === 'true');

if (showHoverInfo.value === null || showHoverInfo.value === undefined || showHoverInfo.value === '') {
  localStorage.setItem('weilin_prompt_ui_showHoverInfo', true);
  showHoverInfo.value = true;
}

const props = defineProps({
  loraManager: {
    type: String,
    default: 'look'
  }
})


// 监听复选框变化并保存到本地存储
watch(showHoverInfo, (newVal) => {
  localStorage.setItem('weilin_prompt_ui_showHoverInfo', newVal);
});

watch(clickAddTag, (newVal) => {
  localStorage.setItem('weilin_prompt_ui_clickAddTag', newVal);
});

// 「添加触发词」：开启「添加Lora标签」时，是否把该 lora 的触发词（loraWorks）一并追加到提示词。
// 默认开启（沿用历史行为：原先总是插入 tag + ", " + loraWorks）。
// localStorage 只存字符串，必须显式 === 'true' 转布尔；key 不存在(null)时才取默认 true。
const _atwRaw = localStorage.getItem('weilin_prompt_ui_addTriggerWords');
const addTriggerWords = ref(_atwRaw === null ? true : _atwRaw === 'true');

watch(addTriggerWords, (newVal) => {
  localStorage.setItem('weilin_prompt_ui_addTriggerWords', newVal);
});


// 分页相关
const currentPage = ref(1)
const pageSize = ref(50) // 每页显示的数量
const total = ref(0) // 后端返回的当前视图总条数（用于判断是否加载完）
// 当前视图完整扁平路径数组：排序与分页的基准（传给后端排好序再按页返回）
const currentViewPaths = ref([])
// Lora 卡片排序：default=默认(保持原目录顺序) / name=名称 / size=文件大小 / mtime=修改时间；asc 升序 / desc 降序
const LORA_SORT_KEY = 'weilin_prompt_ui_lora_sort'
const SORT_OPTIONS = [
  { key: 'default', label: '默认排序' },
  { key: 'name', label: '按名称' },
  { key: 'size', label: '按大小' },
  { key: 'mtime', label: '按时间' },
]
const SORT_LABELS = SORT_OPTIONS.reduce((m, o) => { m[o.key] = o.label; return m }, {})
const _loadLoraSort = () => {
  try {
    const s = JSON.parse(localStorage.getItem(LORA_SORT_KEY))
    if (s && SORT_LABELS[s.key] && ['asc', 'desc'].includes(s.dir)) {
      return { key: s.key, dir: s.dir }
    }
  } catch (e) { /* ignore */ }
  // 未设置过 → 默认排序（保持插件原有的目录顺序，不做额外排序）
  return { key: 'default', dir: 'asc' }
}
const _loraSort0 = _loadLoraSort()
const sortKey = ref(_loraSort0.key)
const sortDir = ref(_loraSort0.dir)
const saveLoraSort = () => {
  try { localStorage.setItem(LORA_SORT_KEY, JSON.stringify({ key: sortKey.value, dir: sortDir.value })) } catch (e) { /* ignore */ }
}
// 下拉菜单开关 + 根节点（用于点击外部判定）
const showSortMenu = ref(false)
const sortBarRef = ref(null)
// 选中排序方式：只切换字段，不改升降序；watch([sortKey, sortDir]) 会重新拉取第一页
const chooseSort = (key) => {
  showSortMenu.value = false
  if (sortKey.value !== key) sortKey.value = key
}
// 升降序切换（默认排序无升降序概念）
const toggleSortDir = () => {
  if (sortKey.value === 'default') return
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}
// 自绘下拉的关闭逻辑：不用原生 select（原生下拉开合会吞掉页面下一次点击），
// 因此自己监听 mousedown(capture) 判断点击是否落在组件外，另支持 Esc 关闭
const onSortDocMouseDown = (e) => {
  if (!showSortMenu.value) return
  const root = sortBarRef.value
  if (root && !root.contains(e.target)) showSortMenu.value = false
}
const onSortDocKeydown = (e) => {
  if (e.key === 'Escape') showSortMenu.value = false
}
onMounted(() => {
  document.addEventListener('mousedown', onSortDocMouseDown, true)
  document.addEventListener('keydown', onSortDocKeydown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onSortDocMouseDown, true)
  document.removeEventListener('keydown', onSortDocKeydown)
})
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const handEnterCard = () => {
  // console.log("enter")
  isEnterCatd.value = true;
  isHovering.value = true;
}
const handleMouseHover = (fileName, event) => {
  if (!showHoverInfo.value || showHoverInfo.value == "false") return;

  // 如果当前悬浮窗口有选中文本，不切换到其他lora
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0 && showCard.value) {
    return;
  }

  isHovering.value = true;
  if (hoveFileName.value === fileName && showCard.value) return;

  const hoveredCard = event.currentTarget;
  const cardRect = hoveredCard.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = 520;   // LoraCard宽度
  const cardHeight = 400;  // LoraCard高度
  const gap = 14;

  let position = { left: 0, top: 0 };

  const rightSpace = viewportWidth - cardRect.right - gap;
  const leftSpace = cardRect.left - gap;
  const bottomSpace = viewportHeight - cardRect.bottom - gap;
  const topSpace = cardRect.top - gap;

  if (rightSpace >= cardWidth) {
    position.left = cardRect.right + gap;
    position.top = cardRect.top;
  } else if (leftSpace >= cardWidth) {
    position.left = cardRect.left - cardWidth - gap;
    position.top = cardRect.top;
  } else if (bottomSpace >= cardHeight) {
    position.left = Math.max(gap, Math.min(cardRect.left, viewportWidth - cardWidth - gap));
    position.top = cardRect.bottom + gap;
  } else if (topSpace >= cardHeight) {
    position.left = Math.max(gap, Math.min(cardRect.left, viewportWidth - cardWidth - gap));
    position.top = cardRect.top - cardHeight - gap;
  } else {
    position.left = Math.max(gap, viewportWidth - cardWidth - gap);
    position.top = Math.max(gap, Math.min(cardRect.top, viewportHeight - cardHeight - gap));
  }

  position.left = Math.max(gap, Math.min(position.left, viewportWidth - cardWidth - gap));
  position.top = Math.max(gap, Math.min(position.top, viewportHeight - cardHeight - gap));

  paddingLeftValue.value = position.left;
  paddingTopValue.value = position.top;

  showCard.value = true;
  hoveFileName.value = fileName;
  nextTick(() => {
    loraCardItem.value.refresh()
  })
}


const handleMouseLeave = () => {
  // 检查是否正在选中文本，如果是则不关闭
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    return;
  }
  isHovering.value = false;
  setTimeout(() => {
    if (!isEnterCatd.value && !isHovering.value) {
      showCard.value = false;
      hoveFileName.value = "";
      isEnterCatd.value = false;
    }
  }, 80)
}

const handleEnterLeave = () => {
  // 如果卡片内有选中文本，延迟关闭（等选区清除后再关）
  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) {
    return
  }
  showCard.value = false;
  hoveFileName.value = "";
  isEnterCatd.value = false;
}

const handleOpenDetail = (loraData) => {
  loraDetailRef.value.open(loraData)
}

// 换封面成功后，原地更新管理器列表中对应 lora 的封面缩略图（不整页重拉，避免滚动复位）
const applyCoverUpdated = async (file) => {
  if (!file) return
  const norm = (s) => (s || '').replace(/\\/g, '/')
  const item = paginatedLoraList.value.find(it =>
    norm(it.basename) === norm(file) ||
    norm(it.file_path) === norm(file) ||
    norm(it.file_path).endsWith('/' + norm(file))
  )
  if (!item) return
  try {
    const res = await loraApi.getLoraDetail({ file, light: true })
    const imgs = (res.data && res.data.images) || []
    const cover = imgs.find(im => (im.url || '').includes('lorainfo/api/loras/img')) || imgs[0]
    if (cover && cover.url) {
      const sep = cover.url.includes('?') ? '&' : '?'
      // 追加前端 anti-cache 戳：后端未重启时也能强制刷新缩略图
      item.preview = cover.url + sep + '_cb=' + Date.now()
    }
  } catch (e) {
    console.error('更新列表封面缩略图失败:', e)
  }
}

// emit 通道（子组件仍存活时）：只更新列表缩略图。给提示词窗口的广播由子组件自己发
// （子组件在 await 期间被卸载时 emit 会丢，但广播已经先于 emit 发出），这里不再重复
// 广播——否则自己又会收到自己发的消息，导致列表重复刷新一次
const onCoverUpdated = (file) => applyCoverUpdated(file)

// 广播兜底：悬浮卡片/详情窗在"设为封面"的 await 期间可能被卸载（预览关闭后卡片补发
// cardLeave → v-if 卸载），此时 emit 会丢失、列表缩略图永远不更新；这里直接收 window
// 广播补上。**不再转发广播**，否则与 onCoverUpdated 形成无限回环。
const handleCoverUpdatedMessage = (event) => {
  const d = event?.data
  if (!d || d.type !== 'weilin_prompt_ui_lora_cover_updated') return
  applyCoverUpdated(d.file)
}

const folderList = ref([])
const selectFolder = ref([])
const seed = ref('')
const actionAct = ref(0)

const openSetSeed = (action, newSeed) => {
  actionAct.value = action
  seed.value = newSeed
}

const getFolderList = async () => {
  try {
    const res = await loraApi.getLoraFolderList()
    folderList.value = res.data
  } catch (error) {
    console.error('Failed to get folder list:', error)
    message({ type: "error", str: 'message.loadFailed' })
  }
}

// 处理滚动事件
const handleScroll = () => {
  if (!scrollContainer.value || isLoadingMore.value || hasLoadedAll.value) return

  const container = scrollContainer.value
  // 当滚动到距离底部100px时触发加载更多
  if (container.scrollHeight - container.scrollTop - container.clientHeight < 100) {
    loadMoreData()
  }
}

// ===== 自定义卡片大小（Ctrl+滚轮调整，与 Windows 资源管理器调图标大小同款交互）=====
const CARD_SIZE_MIN = 90
const CARD_SIZE_MAX = 300
const CARD_SIZE_KEY = 'weilin_prompt_ui_lora_card_size'
const _csRaw = parseInt(localStorage.getItem(CARD_SIZE_KEY), 10)
const cardSize = ref(Number.isFinite(_csRaw) ? Math.min(CARD_SIZE_MAX, Math.max(CARD_SIZE_MIN, _csRaw)) : 130)
// 卡片总高与列宽等比（130 宽 → 180 高），名称区固定 36px 不随缩放
const cardMinH = computed(() => Math.round(cardSize.value * 180 / 130))
watch(cardSize, (v) => {
  localStorage.setItem(CARD_SIZE_KEY, String(v))
  // 调大后内容可能已不足一屏 → 补加载；调小则可能需要回收滚动位置（无需处理）
  nextTick(ensureFilled)
})

// 列表区 Ctrl+滚轮 调整卡片大小；不带 Ctrl 的滚轮保持默认滚动
const handleListWheel = (e) => {
  if (!e.ctrlKey) return
  e.preventDefault()
  const step = e.deltaY < 0 ? 10 : -10
  cardSize.value = Math.min(CARD_SIZE_MAX, Math.max(CARD_SIZE_MIN, cardSize.value + step))
}

// ===== 内容不足一屏时自动补加载 =====
// 底部大片空白的根因：handleScroll 只在 scroll 事件里触发，而内容不满一屏
// （scrollHeight === clientHeight）时永远不会有 scroll 事件，导致不继续加载。
// 这里改为主动检查：每次加载完 / 窗口 resize / 卡片变大后，若距底部不足 100px 且
// 还有数据，就继续加载，直到填满容器或全部加载完。
let filling = false
const ensureFilled = async () => {
  if (filling) return
  filling = true
  try {
    let guard = 0
    while (!hasLoadedAll.value && !isLoadingMore.value && guard++ < 40) {
      const c = scrollContainer.value
      // 容器不可见（v-show 收起 / 未挂载）时 clientHeight=0：
      // 此时 scrollHeight-scrollTop-clientHeight 恒为 0，会被误判成"没填满"而一路加载全部数据
      if (!c || !c.clientHeight) break
      if (c.scrollHeight - c.scrollTop - c.clientHeight < 100) {
        try {
          await loadMoreData()
        } catch (e) {
          // loadMoreData 搜索分支存在既有的 res 未定义问题，别让补加载抛 unhandled rejection
          console.warn('[WeiLin] 补加载失败:', e)
          break
        }
        await nextTick()
      } else break
    }
  } finally {
    filling = false
  }
}

const isSearch = ref(false)
// 防抖搜索
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.length > 0) {
      isSearch.value = true
      searchLoraList()
    } else {
      isSearch.value = false
      refreshList()
    }
  }, 300)
}

const retLoraName = (lora) => {
  if (lora.local_info?.name && lora.local_info.name !== '' && lora.local_info.name.length > 0) {
    return lora.local_info.name
  } else {
    return lora.name
  }
}

const loraDetailRef = ref()

const openLoraDetail = (loraData) => {
  if (props.loraManager === 'addLora') {
    selectLora(loraData)
  } else if (props.loraManager === 'prompt_inner' && clickAddTag.value) {
    // 如果启用了「添加Lora标签」，则直接把 wlr 标签写入提示词而不打开详情窗口
    addLoraTag(loraData);
  } else {
    loraDetailRef.value.open(loraData)
  }
}

const searchLoraList = async () => {
  try {
    const res = await loraApi.searchLoraGetFolderList(searchQuery.value)
    selectFolder.value = res.data
    if (selectFolder.value.length > 0) {
      // 搜索结果本身就是路径数组，作为当前视图路径参与排序+分页
      currentViewPaths.value = res.data
      hasLoadedAll.value = false
      currentPage.value = 1
      getRangeLoraList()
    }
  } catch (error) {
    console.error('Failed to get folder list:', error)
    message({ type: "error", str: 'message.loadFailed' })
  }
}


// 分页后的列表
const paginatedLoraList = ref([])

// 选择分类时重置子分类和页码
const selectCategory = (category) => {
  paginatedLoraList.value = []
  currentCategory.value = category
  currentSubCategory.value = "/"
  selectFolder.value = folderList.value[category]
  // "all" 用整个分类数组；其它分类用其 "/" 子分类（Object.values 对数组/对象都返回元素路径数组，flat 兜底嵌套）
  const rootFolder = category === "all" ? selectFolder.value : selectFolder.value["/"]
  if (rootFolder) {
    currentViewPaths.value = Object.values(rootFolder).flat()
    hasLoadedAll.value = false
    currentPage.value = 1
    getRangeLoraList()
  }
}

const selectSecondCategory = (subCategory) => {
  if (subCategory != currentSubCategory.value) {
    currentSubCategory.value = subCategory
    paginatedLoraList.value = []
    const rootFolder = selectFolder.value[currentSubCategory.value]
    if (rootFolder) {
      // 子分类内部可能是嵌套 dict，Object.values(...).flat() 安全提取路径数组
      currentViewPaths.value = Object.values(rootFolder).flat()
      hasLoadedAll.value = false
      currentPage.value = 1 // 重置页码
      getRangeLoraList()
    }
  }
}


// 排序/分页：把当前视图的完整路径数组交给后端排序+分页（sort_key/sort_dir/page/page_size）
const getRangeLoraList = async () => {
  const res = await loraApi.getLoraRangeList({
    range: currentViewPaths.value,
    sort_key: sortKey.value,
    sort_dir: sortDir.value,
    page: currentPage.value,
    page_size: pageSize.value,
  })
  if (currentPage.value === 1) {
    paginatedLoraList.value = res.data.loras
  } else {
    paginatedLoraList.value = paginatedLoraList.value.concat(res.data.loras)
  }
  // total 来自后端（已按排序后的全集计算），据此判定是否已加载完全部
  total.value = res.data.total
  hasLoadedAll.value = paginatedLoraList.value.length >= total.value
  // 渲染后检查内容是否填满容器，不足则继续补加载（窗口大时底部空白）
  nextTick(ensureFilled)
}

// 排序方式变化：持久化并重新拉取第一页
watch([sortKey, sortDir], () => {
  saveLoraSort()
  currentPage.value = 1
  hasLoadedAll.value = false
  paginatedLoraList.value = []
  getRangeLoraList()
})

const getAllLoraList = async () => {
  if (intervalId.value != null) {
    message({ type: "warn", str: 'message.isLoading' })
    return
  }

  try {
    message({ type: "success", str: 'message.isLoadingPleaseWait' })
    await loraApi.getAllLoraList()
    // 每秒调用一次 getAllLoraStatus
    intervalId.value = setInterval(async () => {
      await getAllLoraStatus()
    }, 1000)
  } catch (error) {
    console.error('Failed to get all lora list:', error)
    message({ type: "error", str: 'message.loadFailed' })
  }
}

const getAllLoraStatus = async () => {
  try {
    const res = await loraApi.getAllLoraStatus()

    if (res.data.isLoading === false) {
      clearInterval(intervalId.value)
      intervalId.value = null
      message({ type: "success", str: 'message.loaddingSuccess' })
      // 加载完成后刷新列表
      await refreshList()
    } else {
      message({ type: "warn", str: 'message.loaddingPrc', name: res.data.progress })
    }
  } catch (error) {
    console.error('Failed to get lora status:', error)
    clearInterval(intervalId.value)
    intervalId.value = null
    message({ type: "error", str: 'message.loadFailed' })
  }
}

const refreshList = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  currentPage.value = 1 // 刷新时重置页码
  hasLoadedAll.value = false
  isLoadingMore.value = false

  try {
    await getFolderList()
    nextTick(() => {
      selectCategory('all')
    })
  } catch (error) {
    console.error('Failed to refresh lora list:', error)
  } finally {
    isRefreshing.value = false
  }
}


// 加载更多数据（后端已排序分页，前端只负责翻页）
const loadMoreData = async () => {
  // 已加载完全部则不再请求
  if (hasLoadedAll.value) {
    return
  }

  isLoadingMore.value = true

  try {
    // 增加页码后向后端拉取下一页（排序/范围已由 currentViewPaths + sort 决定）
    currentPage.value++
    await getRangeLoraList()
  } catch (error) {
    console.error('Failed to load more lora:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// 重置加载状态
const resetLoadingState = () => {
  currentPage.value = 1
  hasLoadedAll.value = false
  isLoadingMore.value = false
}

// 监听分类和搜索变化，重置页码和加载状态
watch([currentCategory, currentSubCategory, searchQuery], () => {
  resetLoadingState()
})

// 全局点击事件：点击悬浮窗口外部时关闭
const handleDocumentClick = (event) => {
  // 如果悬浮窗口未显示，不处理
  if (!showCard.value) return

  // 如果预览放大弹窗打开，不关闭
  if (loraCardItem.value?.previewVisible) return

  // 如果悬浮窗口内有选中文本，不关闭
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    return;
  }

  // 获取悬浮窗口元素
  const cardEl = loraCardItem.value?.$el
  if (!cardEl) return

  // 检查点击是否在悬浮窗口内部
  if (!cardEl.contains(event.target)) {
    showCard.value = false
    hoveFileName.value = ""
    isEnterCatd.value = false
    isHovering.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  refreshList()
  document.addEventListener('click', handleDocumentClick, true)
  window.addEventListener('message', handleCoverUpdatedMessage)
  window.addEventListener('resize', handleWindowResize)
  // 监听滚动容器自身尺寸变化：外部容器高度被动态改变（如提示词窗口拉大后重算内嵌高度）、
  // 窗口 resize、卡片尺寸调整都会体现为 clientHeight 变化，统一在这里补加载填满。
  // 注意 ResizeObserver 观察的是可见盒子，内容变多不会触发，不会与 ensureFilled 形成回环。
  if (typeof ResizeObserver !== 'undefined' && scrollContainer.value) {
    scrollResizeObserver = new ResizeObserver(() => handleWindowResize())
    scrollResizeObserver.observe(scrollContainer.value)
  }
  // 74.86：内嵌高度已交给 CSS flex 分配，窗口拖拽/内容增减由浏览器布局自动重排，
  // 无需再观察窗口根、main-content 或监听 window-content 滚动。
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  window.removeEventListener('message', handleCoverUpdatedMessage)
  window.removeEventListener('resize', handleWindowResize)
  if (resizeTimer) { clearTimeout(resizeTimer); resizeTimer = null }
  if (scrollResizeObserver) { scrollResizeObserver.disconnect(); scrollResizeObserver = null }
})

// 窗口尺寸变化（含拖大管理器窗口）后：高度由 CSS flex 自动重排，这里只负责防抖补加载
let resizeTimer = null
let scrollResizeObserver = null
const handleWindowResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    resizeTimer = null
    ensureFilled()
  }, 200)
}

// ===== 内嵌（prompt_inner）高度自适应（74.86 重构） =====
// 74.81-74.85 的五版 JS 测高（视觉 top / 布局偏移 / 一屏法 / 标题锚定）全部废弃：
// 测量值与滚动位置、上方内容高度互相依赖，怎么调都不稳定。
// 现在高度完全由 CSS flex 分配（见本文件 is-embedded/is-expand 样式与
// prompt_index.css 的 .weilin-lora-embed-active 链），二态语义不变：
//  - is-expand（还有数据未加载）：撑满剩余空间，ensureFilled 补加载填卡片；
//  - is-embedded 默认（全部加载完）：收缩到内容实际高度，小分类不留白。

// 选择Lora
const selectLora = (lora) => {
  if (actionAct.value === 0) {
    window.postMessage({
      type: 'weilin_prompt_ui_selectLora',
      lora: {
        name: lora.model_name,
        display_name: retLoraName(lora),
        lora: lora.name,
        weight: lora.local_info?.strengthMin ? lora.local_info.strengthMin : 1,
        text_encoder_weight: lora.local_info?.strWeight ? lora.local_info.strWeight : 1,
        loraWorks: addTriggerWords.value ? (lora.local_info?.loraWorks ? lora.local_info.loraWorks : '') : '',
      }
    }, '*')
  } else if (actionAct.value === 1) {
    window.postMessage({
      type: 'weilin_prompt_ui_selectLora_stack_' + seed.value,
      lora: {
        name: lora.model_name,
        display_name: retLoraName(lora),
        lora: lora.name,
        weight: lora.local_info?.strengthMin ? lora.local_info.strengthMin : 1,
        text_encoder_weight: lora.local_info?.strWeight ? lora.local_info.strWeight : 1,
        loraWorks: addTriggerWords.value ? (lora.local_info?.loraWorks ? lora.local_info.loraWorks : '') : '',
      }
    }, '*')
  } else if (actionAct.value === 2) {
    window.postMessage({
      type: 'weilin_prompt_ui_selectLora_stack_node_' + seed.value,
      lora: {
        name: lora.model_name,
        display_name: retLoraName(lora),
        lora: lora.name,
        weight: lora.local_info?.strengthMin ? lora.local_info.strengthMin : 1,
        text_encoder_weight: lora.local_info?.strWeight ? lora.local_info.strWeight : 1,
        loraWorks: addTriggerWords.value ? (lora.local_info?.loraWorks ? lora.local_info.loraWorks : '') : '',
      }
    }, '*')
  }
}



// 添加Lora标签的函数
const addLoraTag = (loraData) => {
  // 发送消息添加标签
  window.postMessage({
    type: 'weilin_prompt_ui_addLoraTag_inner',
    lora: {
      tag: `<wlr:${loraData.model_name}:${loraData.local_info?.strengthMin ? loraData.local_info.strengthMin : 1}:${loraData.local_info?.strWeight ? loraData.local_info.strWeight : 1}>`,
      // 未勾选「添加触发词」时传空串：接收端(prompt_index)会走 else 分支，只插入 wlr 标签、不带触发词
      loraWorks: addTriggerWords.value ? (loraData.local_info?.loraWorks ? loraData.local_info.loraWorks : '') : '',
    }
  }, '*');
  // 显示提示消息
  // message({ type: "success", str: `已添加Lora标签: ${loraName}` });
}

const isVideoPreview = (preview) => {
  if (!preview) return false
  return preview.startsWith('data:video/') || 
         preview.toLowerCase().endsWith('.mp4') ||
         preview.toLowerCase().includes('.mp4') ||
         preview.toLowerCase().includes('fmt=mp4')
}

defineExpose({
  openSetSeed
})

</script>

<style scoped>
.weilin_prompt_ui_lora-manager {
  overflow: hidden;
  /* 窗口底色由 DraggableWindow 根统一画一层（rgba 调色板下多层叠加会变实心） */
  background: transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  /* 确保最小高度能显示2.5行卡片 */
}

.weilin_prompt_ui_lora-manager-container {
  padding: 16px;
}

.weilin_prompt_ui_lora-list-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding-right: 8px;
  padding-bottom: 10px;
  box-sizing: border-box;
  min-height: 520px;
  /* 增大最小高度以容纳2.5行卡片 (180px * 2.5 + gap + padding) */
}

/* 内嵌在提示词窗口（prompt_inner）时：高度由外层 flex 链分配
   （见 prompt_index.css 的 .weilin-lora-embed-active 一组规则）。
   默认（全部加载完）：收缩到内容实际高度，小分类不留白；
   is-expand（还有数据未加载）：作为 flex 项撑满外层容器分配的剩余空间，
   由 ensureFilled 把卡片补满，超出部分列表内部滚动。 */
.weilin_prompt_ui_lora-manager.is-embedded {
  height: auto;
  min-height: 0;
  flex: 0 0 auto;
}

.weilin_prompt_ui_lora-manager.is-embedded.is-expand {
  height: 100%;
  min-height: 240px;
  flex: 1 1 auto;
}

.weilin_prompt_ui_lora-manager.is-embedded .weilin_prompt_ui_lora-list-container {
  min-height: 0;
}

.weilin_prompt_ui_lora-list-container::-webkit-scrollbar {
  width: 6px;
}

.weilin_prompt_ui_lora-list-container::-webkit-scrollbar-track {
  background: var(--weilin-prompt-ui-scrollbar-track);
  border-radius: 3px;
}

.weilin_prompt_ui_lora-list-container::-webkit-scrollbar-thumb {
  background: var(--weilin-prompt-ui-scrollbar-thumb);
  border-radius: 3px;
}

.weilin_prompt_ui_lora-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--weilin-prompt-ui-scrollbar-thumb-hover);
}


.weilin_prompt_ui_lora-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 80px;
  padding-top: 5px;
}

.weilin_prompt_ui_lora-item {
  padding: 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 8px;
  background: var(--weilin-prompt-ui-primary-bg);
  transition: all 0.3s ease;
  cursor: pointer;
}

.weilin_prompt_ui_lora-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--weilin-prompt-ui-shadow-color);
}

.weilin_prompt_ui_lora-item-content {
  display: flex;
  gap: 12px;
}

.weilin_prompt_ui_lora-preview {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--weilin-prompt-ui-secondary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.weilin_prompt_ui_lora-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.weilin_prompt_ui_no-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.weilin_prompt_ui_no-preview svg {
  fill: var(--weilin-prompt-ui-secondary-text);
}

.weilin_prompt_ui_lora-info {
  flex: 1;
  overflow: hidden;
}

.weilin_prompt_ui_lora-name {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--weilin-prompt-ui-primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weilin_prompt_ui_lora-path {
  margin: 0;
  font-size: 12px;
  color: var(--weilin-prompt-ui-secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weilin_prompt_ui_refresh-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weilin_prompt_ui_refresh-btn:hover {
  background-color: var(--weilin-prompt-ui-hover-bg-color);
}

.weilin_prompt_ui_refresh-icon {
  fill: var(--weilin-prompt-ui-secondary-text);
  transition: transform 0.5s ease;
}

.weilin_prompt_ui_refresh-icon.is-rotating {
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

.weilin_prompt_ui_header-right {
  display: flex;
  align-items: center;
}

.weilin_prompt_ui_category-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  /* 移除固定高度限制，让flex-wrap自由换行 */
  align-content: flex-start;
  /* 多行时顶部对齐 */
}

.weilin_prompt_ui_category-nav::-webkit-scrollbar {
  width: 6px;
}

.weilin_prompt_ui_category-nav::-webkit-scrollbar-track {
  background: var(--weilin-prompt-ui-scrollbar-track);
  border-radius: 3px;
}

.weilin_prompt_ui_category-nav::-webkit-scrollbar-thumb {
  background: var(--weilin-prompt-ui-scrollbar-thumb);
  border-radius: 3px;
}

.weilin_prompt_ui_category-nav::-webkit-scrollbar-thumb:hover {
  background: var(--weilin-prompt-ui-scrollbar-thumb-hover);
}

.weilin_prompt_ui_category-btn {
  padding: 6px 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-primary-bg);
  color: var(--weilin-prompt-ui-primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  /* 按钮文字不换行 */
  flex-shrink: 0;
  /* 按钮不被压缩 */
}

.weilin_prompt_ui_category-btn:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.weilin_prompt_ui_category-btn.active {
  background: var(--weilin-prompt-ui-primary-color);
  color: #fff;
  border-color: var(--weilin-prompt-ui-primary-color);
}

.weilin_prompt_ui_subcategory-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  margin-top: -8px;
  flex-wrap: wrap;
  padding-left: 16px;
  /* 移除固定高度限制，让flex-wrap自由换行 */
  align-content: flex-start;
}


.weilin_prompt_ui_subcategory-nav::-webkit-scrollbar {
  width: 6px;
}

.weilin_prompt_ui_subcategory-nav::-webkit-scrollbar-track {
  background: var(--weilin-prompt-ui-scrollbar-track);
  border-radius: 3px;
}

.weilin_prompt_ui_subcategory-nav::-webkit-scrollbar-thumb {
  background: var(--weilin-prompt-ui-scrollbar-thumb);
  border-radius: 3px;
}

.weilin_prompt_ui_subcategory-nav::-webkit-scrollbar-thumb:hover {
  background: var(--weilin-prompt-ui-scrollbar-thumb-hover);
}

/* ========== Lora 卡片排序（内联在顶部搜索栏同一行，分段控件样式） ========== */
.weilin_prompt_ui_sort-bar {
  position: relative;   /* 下拉面板的定位基准 */
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  flex-shrink: 0;
}

/* 排序按钮基础样式：与搜索框同高（30px），字号与顶部栏其它文字一致 */
.weilin_prompt_ui_sort-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  color: var(--weilin-prompt-ui-primary-text);
  background: color-mix(in srgb, var(--weilin-prompt-ui-primary-bg) 94%, #000 6%);
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 6px;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.weilin_prompt_ui_sort-btn:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

/* 「默认排序」时升降序按钮无意义，置灰禁用 */
.weilin_prompt_ui_sort-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.weilin_prompt_ui_sort-btn:disabled:hover {
  background: color-mix(in srgb, var(--weilin-prompt-ui-primary-bg) 94%, #000 6%);
}

/* 触发按钮：左文字右箭头，固定最小宽度避免切换选中项时抖动 */
.weilin_prompt_ui_sort-trigger {
  gap: 4px;
  min-width: 106px;
  justify-content: space-between;
  padding: 0 8px 0 10px;
}

.weilin_prompt_ui_sort-caret {
  fill: currentColor;
  opacity: 0.75;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}

.weilin_prompt_ui_sort-caret.open {
  transform: rotate(180deg);
}

/* 升降序按钮：稍窄，箭头放大加粗 */
.weilin_prompt_ui_sort-dir {
  min-width: 34px;
  padding: 0 6px;
  font-size: 13px;
  font-weight: 600;
}

/* 下拉面板（自绘，避免原生 select 吞掉页面下一次点击） */
.weilin_prompt_ui_sort-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 132px;
  padding: 4px;
  z-index: 30;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 6px;
  background: var(--weilin-prompt-ui-primary-bg);
  box-shadow: 0 6px 18px var(--weilin-prompt-ui-shadow-color);
}

.weilin_prompt_ui_sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 30px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--weilin-prompt-ui-primary-text);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.weilin_prompt_ui_sort-option:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.weilin_prompt_ui_sort-option.active {
  color: var(--weilin-prompt-ui-primary-color);
  font-weight: 600;
}

.weilin_prompt_ui_sort-check {
  font-size: 12px;
  flex-shrink: 0;
}


.lora-manager-top-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 8px;
  margin-bottom: 10px;
}

/* 添加搜索框样式 */
.weilin_prompt_ui_search-input {
  /* 与排序/图标/复选框同行：优先保持可用宽度，空间不足时由 top-bar 的 flex-wrap 换行 */
  flex: 1 1 160px;
  min-width: 140px;
  margin-right: 10px;
  padding: 6px 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-primary-bg);
  color: var(--weilin-prompt-ui-primary-text);
  transition: all 0.3s ease;
}

.weilin_prompt_ui_search-input:focus {
  outline: none;
  border-color: var(--weilin-prompt-ui-primary-color);
  box-shadow: 0 0 0 2px rgba(var(--weilin-prompt-ui-primary-color), 0.2);
}

/* 分页控制样式 */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
  gap: 10px;
}

.weilin_prompt_ui_page-btn {
  padding: 6px 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-primary-bg);
  color: var(--weilin-prompt-ui-primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
}

.weilin_prompt_ui_page-btn:hover:not(:disabled) {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.weilin_prompt_ui_page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--weilin-prompt-ui-secondary-text);
}

.loading-indicator,
.empty-list {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--weilin-prompt-ui-secondary-text);
  font-size: 16px;
}

.loading-more,
.no-more-data {
  text-align: center;
  padding: 15px 0;
  color: var(--weilin-prompt-ui-secondary-text);
  font-size: 14px;
}

.no-more-data {
  color: var(--weilin-prompt-ui-secondary-text);
  opacity: 0.8;
}

.weilin_prompt_ui_lora-card {
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 8px;
  background: var(--weilin-prompt-ui-primary-bg);
  transition: all 0.3s ease;
  overflow: hidden;
  aspect-ratio: 1/1.45;
  /* 调整比例 */
  min-height: 180px;
  /* 增大卡片最小高度 */
}

.weilin_prompt_ui_lora-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--weilin-prompt-ui-shadow-color);
  border: 1px solid var(--weilin-prompt-ui-primary-color-hover);
}

.weilin_prompt_ui_lora-preview {
  aspect-ratio: 1/1;
  /* 保持图片区域为正方形 */
}

.weilin_prompt_ui_lora-name {
  margin: 0;
  font-size: 12px;
  color: var(--weilin-prompt-ui-primary-text);
  word-break: break-word;
  white-space: normal;
  line-height: 1.2;
}


.lora-manager-top-bar {
  display: flex;
  align-items: center;
  padding: 8px;
  gap: 8px;
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
}

.checkbox-container {
  display: flex;
  margin-left: auto;
  gap: 12px;
}

.weilin_prompt_ui_checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--weilin-prompt-ui-primary-text);
  cursor: pointer;
}

.weilin_prompt_ui_checkbox {
  cursor: pointer;
}
</style>