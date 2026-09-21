<template>
    <div class="dfi-root" ref="rootRef" @keydown.esc.stop="closePop">
        <input type="text" class="dfi-input" v-model="text" placeholder="YYYY-MM-DD" spellcheck="false"
            @focus="openPop" @input="onInput" @blur="onBlur" />
        <svg class="dfi-chev" viewBox="0 0 24 24" width="10" height="10">
            <path d="M7 10l5 5 5-5z" />
        </svg>
        <div v-if="openState" class="dfi-pop">
            <div class="dfi-head">
                <button type="button" class="dfi-nav" @click="shiftMonth(-12)" title="上一年">«</button>
                <button type="button" class="dfi-nav" @click="shiftMonth(-1)" title="上个月">‹</button>
                <span class="dfi-title">
                    <span class="dfi-ty" @click="viewMode = 'year'" title="选择年份">{{ viewYear }}</span>
                    <span class="dfi-sep">-</span>
                    <span class="dfi-tm" @click="viewMode = 'month'" title="选择月份">{{ String(viewMonth + 1).padStart(2, '0') }}</span>
                </span>
                <button type="button" class="dfi-nav" @click="shiftMonth(1)" title="下个月">›</button>
                <button type="button" class="dfi-nav" @click="shiftMonth(12)" title="下一年">»</button>
                <button type="button" class="dfi-close" @click="closePop" title="关闭">✕</button>
            </div>
            <!-- 日视图 -->
            <template v-if="viewMode === 'day'">
                <div class="dfi-week">
                    <span v-for="(w, i) in weekdays" :key="i" class="dfi-wd">{{ w }}</span>
                </div>
                <div class="dfi-grid">
                    <button type="button" v-for="(d, i) in cells" :key="i" class="dfi-day"
                        :class="{ 'dfi-out': !d.inMonth, 'dfi-today': d.isToday, 'dfi-sel': d.key === props.modelValue }"
                        @click="pick(d)">{{ d.day }}</button>
                </div>
            </template>
            <!-- 月选择：3x4 网格 -->
            <div v-else-if="viewMode === 'month'" class="dfi-grid dfi-grid-3">
                <button type="button" v-for="m in 12" :key="m" class="dfi-day dfi-my"
                    :class="{ 'dfi-sel': m - 1 === viewMonth }" @click="pickMonth(m - 1)">{{ String(m).padStart(2, '0') }}</button>
            </div>
            <!-- 年选择：以当前视图年为中心的 12 年窗口 -->
            <div v-else class="dfi-grid dfi-grid-3">
                <button type="button" v-for="y in yearWindow" :key="y" class="dfi-day dfi-my"
                    :class="{ 'dfi-today': y === now.getFullYear(), 'dfi-sel': y === viewYear }" @click="pickYear(y)">{{ y }}</button>
            </div>
        </div>
    </div>
</template>

<script setup>
// 自绘迷你日历输入（替代原生 <input type="date">）：
// 原生日历打开时 Chromium 会吞掉页面的下一次真实点击（74.102e 实测），导致外层
// 日期筛选按钮一次点击关不上浮窗；自绘控件无此问题，且保留鼠标点选日期体验。
// 支持键盘输入 YYYY-MM-DD（合法才提交），点输入框弹出月历，点日外关闭，Esc 关闭。
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
    modelValue: { type: String, default: '' } // YYYY-MM-DD 或空串
});
const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();

const rootRef = ref(null);
const openState = ref(false);
// 弹层视图：day=日历 / month=月选择 / year=年选择（点标题的年、月数字切换）
const viewMode = ref('day');
const text = ref(props.modelValue);
const now = new Date();
const viewYear = ref(now.getFullYear());
const viewMonth = ref(now.getMonth()); // 0-based

const weekdays = computed(() => t('history.cal_weekdays').split(' '));

const pad2 = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const RE = /^\d{4}-\d{2}-\d{2}$/;

function syncViewToValue(v) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) { viewYear.value = +m[1]; viewMonth.value = +m[2] - 1; }
}

watch(() => props.modelValue, (v) => { text.value = v; if (v) syncViewToValue(v); });

// 6x7 网格：从视图月首日所在周的周日开始（周日 = 一列第一天，与 weekday 表对齐）
const cells = computed(() => {
    const y = viewYear.value, mo = viewMonth.value;
    const offset = new Date(y, mo, 1).getDay();
    const todayKey = fmt(new Date());
    const list = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(y, mo, 1 - offset + i);
        const key = fmt(d);
        list.push({ day: d.getDate(), inMonth: d.getMonth() === mo, key, isToday: key === todayKey });
    }
    return list;
});

function shiftMonth(delta) {
    const d = new Date(viewYear.value, viewMonth.value + delta, 1);
    viewYear.value = d.getFullYear();
    viewMonth.value = d.getMonth();
}

// 月/年选择面板：月面板固定 12 格；年面板取视图年前后各一半的 12 年窗口，
// « »（±1 年）可以整体平移窗口以到达更远的年份
const yearWindow = computed(() => {
    const base = viewYear.value;
    const list = [];
    for (let i = -6; i <= 5; i++) list.push(base + i);
    return list;
});

function pickMonth(m) {
    viewMonth.value = m;
    viewMode.value = 'day';
}

function pickYear(y) {
    viewYear.value = y;
    viewMode.value = 'day';
}

function onInput() {
    const v = text.value.trim();
    if (RE.test(v) && !isNaN(Date.parse(v))) {
        emit('update:modelValue', v);
        syncViewToValue(v);
    }
}

function onBlur() {
    // 失焦时文本非法则回退为受控值（点日历按钮的 mousedown 会先触发 blur，属正常流程）
    if (!RE.test(text.value) || isNaN(Date.parse(text.value))) text.value = props.modelValue;
}

function openPop() {
    if (props.modelValue) syncViewToValue(props.modelValue);
    else { viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth(); }
    viewMode.value = 'day';
    openState.value = true;
}
function closePop() { openState.value = false; }

function pick(d) {
    emit('update:modelValue', d.key);
    text.value = d.key;
    closePop();
}

// 点击组件外关闭：自绘控件的所有点击都会正常派发到页面（无原生抽食问题），
// document pointerdown 足够可靠
const onDocPointerDown = (e) => {
    if (openState.value && rootRef.value && !rootRef.value.contains(e.target)) closePop();
};
onMounted(() => document.addEventListener('pointerdown', onDocPointerDown, true));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointerDown, true));
</script>

<style scoped>
.dfi-root {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
}

.dfi-input {
    width: 100%;
    padding: 4px 20px 4px 6px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 4px;
    background: var(--weilin-prompt-ui-input-bg);
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 12px;
    font-family: inherit;
    box-sizing: border-box;
}

.dfi-input:focus {
    outline: none;
    border-color: var(--weilin-prompt-ui-primary-color);
}

.dfi-chev {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    fill: var(--weilin-prompt-ui-secondary-text, #999);
    pointer-events: none;
}

.dfi-pop {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 20;
    width: 196px;
    padding: 8px;
    border: 1px solid var(--weilin-prompt-ui-border-color);
    border-radius: 6px;
    background: var(--weilin-prompt-ui-secondary-bg, var(--weilin-prompt-ui-input-bg));
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
    user-select: none;
}

.dfi-head {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-bottom: 6px;
}

.dfi-title {
    flex: 1 1 auto;
    text-align: center;
    font-size: 12px;
    color: var(--weilin-prompt-ui-primary-text);
    font-weight: 600;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
}

.dfi-sep {
    color: var(--weilin-prompt-ui-secondary-text, #999);
    font-weight: 400;
}

/* 标题上的年、月数字可点击，弹出对应选择面板 */
.dfi-ty,
.dfi-tm {
    cursor: pointer;
    padding: 1px 3px;
    border-radius: 3px;
}

.dfi-ty:hover,
.dfi-tm:hover {
    color: var(--weilin-prompt-ui-primary-color);
    background: var(--weilin-prompt-ui-hover-bg-color);
}

.dfi-title:hover {
    color: var(--weilin-prompt-ui-primary-color);
}

.dfi-nav {
    width: 20px;
    height: 22px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.dfi-nav:hover,
.dfi-close:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    color: var(--weilin-prompt-ui-primary-color);
}

.dfi-close {
    width: 20px;
    height: 22px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--weilin-prompt-ui-secondary-text, #999);
    font-size: 11px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
}

.dfi-nav:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
    color: var(--weilin-prompt-ui-primary-color);
}

.dfi-week,
.dfi-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

/* 月选择 3 列、年选择 3 列（12 格） */
.dfi-grid-3 {
    grid-template-columns: repeat(3, 1fr);
}

.dfi-my {
    height: 24px;
    font-weight: 500;
}

.dfi-wd {
    text-align: center;
    font-size: 10px;
    color: var(--weilin-prompt-ui-secondary-text, #999);
    padding: 2px 0;
}

.dfi-day {
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--weilin-prompt-ui-primary-text);
    font-size: 11px;
    padding: 0;
    cursor: pointer;
}

.dfi-day:hover {
    background: var(--weilin-prompt-ui-hover-bg-color);
}

.dfi-day.dfi-out {
    color: var(--weilin-prompt-ui-secondary-text, #999);
    opacity: 0.5;
}

.dfi-day.dfi-today {
    box-shadow: inset 0 0 0 1px var(--weilin-prompt-ui-primary-color);
}

.dfi-day.dfi-sel {
    background: var(--weilin-prompt-ui-primary-color);
    color: #fff;
}
</style>
