import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import '@/styles/theme.css'
import VueClipboard from 'vue-clipboard3'
import { createPinia } from 'pinia'; // 导入 Pinia
import i18n, { initI18n } from './i18n'
import { version } from "./utils/version.js"
const {toClipboard} = VueClipboard()
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import '@/styles/vue3-json-viewer.css';

const div = document.createElement('div')
div.id  = 'weilin_comfyui_tools_prompt_ui_div'
const body=document.querySelector('body')
body.appendChild(div)

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App)
app.use(pinia)
app.use(i18n)
// 在 pinia 初始化后调用
initI18n()
app.config.globalProperties.$copyText  = toClipboard
app.mount(div)

