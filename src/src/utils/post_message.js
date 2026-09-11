/**
 * postMessage 来源校验工具
 *
 * 本插件多处通过 window.addEventListener('message', ...) 接收指令（打开窗口、刷新数据等），
 * 此前完全未校验 event.origin，任意父页面/恶意页面都可向本 iframe 发送消息驱动内部动作。
 * 这里统一提供白名单校验。
 */

// 受信任的来源：自身 origin + 父页面 origin（iframe 的 document.referrer 即父页面地址）
const buildTrustedOrigins = () => {
  const list = new Set()
  try {
    if (window.location.origin && window.location.origin !== 'null') {
      list.add(window.location.origin)
    }
    if (document.referrer) {
      list.add(new URL(document.referrer).origin)
    }
  } catch (e) {
    // 解析失败时忽略，后续按"未知来源"处理
  }
  return list
}

const trustedOrigins = buildTrustedOrigins()

/**
 * 判断消息来源是否可信
 * @param {MessageEvent} event
 * @returns {boolean}
 */
export const isTrustedMessage = (event) => {
  const origin = event && event.origin
  // file:// 打开、或浏览器未给出 origin 时（'null'）不做限制，避免本地开发环境被误拦
  if (!origin || origin === 'null') return true
  if (trustedOrigins.size === 0) return true
  if (trustedOrigins.has(origin)) return true
  console.warn('[WeiLin] 已忽略来自不可信来源的 message:', origin)
  return false
}

export default isTrustedMessage
