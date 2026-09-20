import { app } from '../../scripts/app.js'
// 提示词 Node

// localStorage.setItem("weilin_prompt_ui_onfirst", 0);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let localLanguage = "打开提示词编辑器"
let localOpenLoraLanguage = "打开Lora堆"

function getBrowserLanguage() {
  // 获取浏览器语言
  const language = navigator.language || navigator.userLanguage;
  // 判断语言类型
  if (language.startsWith('zh')) {
    localLanguage = "打开提示词编辑器"
    localOpenLoraLanguage = "打开Lora堆"
  } else if (language.startsWith('en')) {
    localLanguage = "Open Prompt UI"
    localOpenLoraLanguage = "Open Lora Stack"
  } else {
    localLanguage = "Open Prompt UI"
    localOpenLoraLanguage = "Open Lora Stack"
  }
}

let globalNodeList = []

let global_randomID = generateUUID(); // 随机种子ID

function updateNodeTitleBySeed(seed, newTitle) {
  // 使用 find 方法查找目标节点
  const targetNode = globalNodeList.find(node => node.seed === seed);
  if (targetNode) {
    // 如果找到目标节点，修改其 title
    targetNode.title = newTitle;
  }
}

function updateNodeIdBySeed(seed, newId) {
  const targetNode = globalNodeList.find(node => node.seed === seed);
  if (targetNode) {
    targetNode.id = newId;
  }
}

function updateNodeTextBySeed(seed, newText) {
  const targetNode = globalNodeList.find(node => node.seed === seed);
  if (targetNode) {
    targetNode.text = newText;
  }
}

// 根据seed删除元素
function removeNodeBySeed(seed) {
  const index = globalNodeList.findIndex(node => node.seed === seed);
  if (index !== -1) {
    globalNodeList.splice(index, 1);
  }
}

function getCacheVersion() {
  return encodeURIComponent(global_randomID);
}

function setWidgetValue(widget, value) {
  if (!widget) return;

  widget.value = value;
  if (widget.element) {
    widget.element.value = value;
    widget.element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    widget.element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  app.graph?.setDirtyCanvas?.(true, true);
}

function getWidgetValue(widget, fallbackElement) {
  if (widget?.value !== undefined && widget.value !== null) {
    return widget.value;
  }

  return fallbackElement?.value ?? "";
}

function openNodeLoraManager(seed) {
  if (!seed) return;

  window.postMessage({
    type: 'weilin_prompt_ui_openLoraManager_addLora_stack_node',
    seed,
  }, '*');
}

function hideWidgetElement(widget) {
  if (!widget?.element) return;

  const elements = [widget.element];
  const parentElement = widget.element.parentElement;
  if (
    parentElement &&
    parentElement !== document.body &&
    parentElement !== document.documentElement &&
    parentElement.children.length <= 1
  ) {
    elements.push(parentElement);
  }

  elements.forEach(element => {
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';
    element.style.width = '0px';
    element.style.height = '0px';
    element.style.minWidth = '0px';
    element.style.minHeight = '0px';
    element.style.maxWidth = '0px';
    element.style.maxHeight = '0px';
    element.style.overflow = 'hidden';
  });
}

function stopLiteGraphEvent(event) {
  event.stopPropagation();
}

function protectDomWidgetEvents(element) {
  if (!element) return;

  [
    'pointerdown',
    'pointerup',
    'mousedown',
    'mouseup',
    'click',
    'dblclick',
    'contextmenu',
    'wheel',
    'touchstart',
    'touchend',
  ].forEach(eventName => {
    element.addEventListener(eventName, stopLiteGraphEvent, { capture: true });
  });
}

function initWindow() {
  const cacheVersion = getCacheVersion();
  var script = document.createElement('script');
  // 设置 script 元素的属性
  script.src = './weilin/prompt_ui/webjs?v=' + cacheVersion; // 注意确保这里的路径是正确的，并且服务器正在运行。
  script.type = 'text/javascript';
  script.async = true;
  document.head.appendChild(script);

  // 创建一个新的 link 元素
  var link = document.createElement('link');
  // 设置 link 元素的属性
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = './weilin/prompt_ui/file/style.css?v=' + cacheVersion; // 确保这里的路径是正确的，并且服务器正在运行。
  document.head.appendChild(link);

  // loraStack 脚本载入
  var script = document.createElement('script');
  // 设置 script 元素的属性
  script.src = './weilin/prompt_ui/file/lora_stack.js?v=' + cacheVersion; // 注意确保这里的路径是正确的，并且服务器正在运行。
  script.type = 'text/javascript';
  script.async = true;
  document.head.appendChild(script);
  // 创建一个新的 link 元素
  var link = document.createElement('link');
  // 设置 link 元素的属性
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = './weilin/prompt_ui/file/lora_stack.css?v=' + cacheVersion; // 确保这里的路径是正确的，并且服务器正在运行。
  document.head.appendChild(link);
}
initWindow()

// ===== 提交队列时的历史保存（工作流多节点各自入史，74.97 统一入史时机） =====
// 入史统一挂在 app.queuePrompt 提交前（见 setup()），不再依赖编辑器窗口是否打开过：
// 所有提示词节点按当前 widget 内容各自入史，且存的正是本次提交（格式转换后）的文本；
// 也不再挂在 execution_success 上（执行报错/中断会漏存）。
// 注意：不做前端去重标记——若保存请求偶发失败/用户清空过历史，"乐观标记"会造成永久遗漏；
// 重复保存由服务端内容级去重兜底（相同内容刷新置顶，不产生垃圾条目）。
function collectHistoryTargetNodes(nodes, out, depth) {
  if (!Array.isArray(nodes) || depth > 3) return
  nodes.forEach((n) => {
    if (!n || typeof n !== 'object') return
    if (n.type === 'WeiLinPromptUI' || n.type === 'WeiLinPromptUIWithoutLora') {
      // mute(2)/bypass(4) 的节点不参与本次执行，跳过（正常节点 mode=0）
      if (n.mode === undefined || n.mode === 0) out.push(n)
    }
    // 子图：递归收集内部节点（属性不存在时静默跳过），防子图内节点遗漏
    if (n.subgraph && Array.isArray(n.subgraph._nodes)) {
      collectHistoryTargetNodes(n.subgraph._nodes, out, depth + 1)
    }
  })
}

function saveHistoryForQueuedNodes() {
  try {
    const graph = window.app && window.app.graph
    if (!graph || !Array.isArray(graph._nodes)) return
    const targets = []
    collectHistoryTargetNodes(graph._nodes, targets, 0)
    targets.forEach((n) => {
      const positiveWidget = n.widgets && n.widgets.find(w => w.name === 'positive')
      const text = positiveWidget ? getWidgetValue(positiveWidget, positiveWidget.element) : ''
      if (!text || text.replace(/\s/g, '').length === 0) return
      let loraVal = ''
      if (n.type === 'WeiLinPromptUI') {
        const loraWidget = n.widgets.find(w => w.name === 'lora_str')
        const rawLora = loraWidget ? getWidgetValue(loraWidget, loraWidget.element) : ''
        if (rawLora && rawLora.length > 0) {
          try {
            const parsedLora = JSON.parse(rawLora)
            if (Array.isArray(parsedLora) && parsedLora.length > 0) loraVal = parsedLora
          } catch (e) { /* lora_str 非法 JSON 时按无 lora 处理 */ }
        }
      }
      // js_node 在主窗口运行，window.parent === 主窗口自身，App.vue 监听 message 可直接收到
      window.parent.postMessage({
        type: 'weilin_prompt_ui_node_queued_save_history',
        prompt: text,
        lora: loraVal
      }, '*')
    })
  } catch (e) { /* 历史保存失败不影响提交 */ }
}

// 诊断入口：报告历史保存视角下每个提示词节点的状态（是否被处理/跳过原因）
window.weilinHistoryDiag = function () {
  const graph = window.app && window.app.graph
  const rows = []
  const walk = (nodes, depth) => {
    if (!Array.isArray(nodes) || depth > 3) return
    nodes.forEach((n) => {
      if (!n || typeof n !== 'object') return
      if (n.type === 'WeiLinPromptUI' || n.type === 'WeiLinPromptUIWithoutLora') {
        const pw = n.widgets && n.widgets.find(w => w.name === 'positive')
        const text = pw ? getWidgetValue(pw, pw.element) : ''
        let reason = 'OK(会保存)'
        if (n.mode !== undefined && n.mode !== 0) reason = 'SKIP(mode=' + n.mode + ' mute/bypass)'
        else if (!text || text.replace(/\s/g, '').length === 0) reason = 'SKIP(空白内容)'
        rows.push({
          id: n.id, type: n.type, title: n.title || '',
          mode: n.mode, promptLen: (text || '').length,
          inSubgraph: depth > 0, status: reason
        })
      }
      if (n.subgraph && Array.isArray(n.subgraph._nodes)) walk(n.subgraph._nodes, depth + 1)
    })
  }
  if (graph && Array.isArray(graph._nodes)) walk(graph._nodes, 0)
  console.table(rows)
  console.log(' WeiLin history diag: ' + rows.length + ' prompt node(s) found. ' +
    'status=OK 的节点在下次提交队列时都会各自保存历史。')
  return rows
}

// ===== 提交工作流前的提示词格式转换（1-5 设置的兜底） =====
// 节点 textarea 直接编辑的内容不经编辑器、没有任何格式转换（盲区），
// 这里在 app.queuePrompt 提交前把所有提示词节点文本按 1-5 设置转换一遍，
// 保证本次执行用的就是转换后的文本（转换发生在 graphToPrompt 之前）。
// ①-④ 全角→半角对文件名无害，全文替换即可；
// ⑤ 下划线会破坏 embedding:名字 / lora:名字 / <lora:...> <wlr:...> 语法里的名字，
//   需先遮蔽特殊段，转换完再还原。
function convertNodePromptText(text) {
  try {
    let s = text
    if (localStorage.getItem('weilin_prompt_ui_comma_conversion') !== 'false') {
      s = s.replace(/，/g, ',')
    }
    if (localStorage.getItem('weilin_prompt_ui_period_conversion') !== 'false') {
      s = s.replace(/。/g, '.')
    }
    if (localStorage.getItem('weilin_prompt_ui_bracket_conversion') !== 'false') {
      s = s.replace(/【/g, '[').replace(/】/g, ']').replace(/（/g, '(').replace(/）/g, ')')
    }
    if (localStorage.getItem('weilin_prompt_ui_angle_bracket_conversion') !== 'false') {
      s = s.replace(/《/g, '<').replace(/》/g, '>')
    }
    if (localStorage.getItem('weilin_prompt_ui_underscore_to_bracket') === 'true') {
      // 遮蔽特殊语法段：embedding:名字 / lora:名字 / <...> / Dynamic Prompts {a|b} 变体
      // （DP 段可能含 wildcard 名字或变体下划线，转换会破坏引用）
      const specials = []
      let masked = s.replace(/(embedding:[^,\s]+|lora:[^,\s]+|<[^>]*>|\{[^{}]*\})/g, (m) => {
        specials.push(m)
        return '\u0000' + (specials.length - 1) + '\u0000'
      })
      masked = masked.replace(/_/g, ' ')
      s = masked.replace(/\u0000(\d+)\u0000/g, (_, i) => specials[Number(i)])
    }
    return s
  } catch (e) {
    return text // 转换失败按原文本提交
  }
}

function convertAllNodePrompts() {
  try {
    const graph = window.app && window.app.graph
    if (!graph || !Array.isArray(graph._nodes)) return
    // 复用历史保存的节点收集器（同类型、同 mode 过滤、含子图递归）
    const targets = []
    collectHistoryTargetNodes(graph._nodes, targets, 0)
    targets.forEach((n) => {
      const positiveWidget = n.widgets && n.widgets.find(w => w.name === 'positive')
      if (!positiveWidget) return
      const raw = getWidgetValue(positiveWidget, positiveWidget.element)
      if (!raw) return
      const converted = convertNodePromptText(raw)
      if (converted !== raw) {
        // setWidgetValue 同步 widget/DOM 并派发事件，节点列表面板会跟着刷新
        setWidgetValue(positiveWidget, converted)
      }
    })
  } catch (e) { /* 转换失败不阻塞提交 */ }
}

app.registerExtension({
  name: "weilin.prompt_ui_node",
  async init() {},
  async setup(app) {
    // 提交队列前做格式转换 + 历史入史（点生成/快捷键队列都走 app.queuePrompt）。
    // 入史统一在提交时：所有提示词节点（含从未打开过编辑器窗口的）各自入史，
    // 且保存的就是本次提交（转换后）的文本；执行报错/中断也会留下记录。
    try {
      if (typeof app.queuePrompt === 'function') {
        const origQueuePrompt = app.queuePrompt.bind(app)
        app.queuePrompt = function (...args) {
          convertAllNodePrompts()
          saveHistoryForQueuedNodes()
          return origQueuePrompt(...args)
        }
      }
    } catch (e) { /* 静默 */ }
  },
  async beforeRegisterNodeDef(nodeType, nodeData, app) {
    // console.log(app)
    if (
      nodeData.name === "WeiLinPromptUI" ||
      nodeData.name === "WeiLinPromptUIWithoutLora" ||
      nodeData.name === "WeiLinPromptUIOnlyLoraStack"
    ) {
      // console.log(nodeData)
      // Create node
      const onNodeCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = async function () {
        const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

        const thisNodeName = nodeData.name // 存储当前的节点名称
        let nodeTextAreaList = [] // 按顺序载入element，name="positive" || "lora_str" || "temp_str"
        const thisNodeSeed = generateUUID(); // 随机唯一种子ID

        if (nodeData.name === "WeiLinPromptUI" || nodeData.name === "WeiLinPromptUIWithoutLora") {
          hideWidgetForGood(this, this.widgets.find(w => w.name === "temp_str"))
          hideWidgetForGood(this, this.widgets.find(w => w.name === "random_template"))
        }

        // 屏蔽 auto_random：开启设置后隐藏该控件并强制为 false（清掉旧工作流里的残留 true）
        applyAutoRandomBlock(this)

        if (nodeData.name === "WeiLinPromptUI" || nodeData.name === "WeiLinPromptUIOnlyLoraStack") {
          hideWidgetForGood(this, this.widgets.find(w => w.name === "lora_str"))
          hideWidgetForGood(this, this.widgets.find(w => w.name === "temp_lora_str"))
        }

        for (let index = 0; index < this.widgets.length; index++) {
          const widgetItem = this.widgets[index];
          if (widgetItem.name == "positive") {
            let thisInputElement = widgetItem.element
            thisInputElement.readOnly = false
            nodeTextAreaList[0] = thisInputElement
          } else if (widgetItem.name == "lora_str") {
            let thisInputElement = widgetItem.element
            thisInputElement.readOnly = true
            nodeTextAreaList[1] = thisInputElement
          } else if (widgetItem.name == "temp_str") {
            let thisInputElement = widgetItem.element
            thisInputElement.readOnly = true
            nodeTextAreaList[2] = thisInputElement
          } else if (widgetItem.name == "temp_lora_str") {
            let thisInputElement = widgetItem.element
            thisInputElement.readOnly = true
            nodeTextAreaList[3] = thisInputElement
          } else if (widgetItem.name == "random_template") {
            let thisInputElement = widgetItem.element
            thisInputElement.readOnly = true
            nodeTextAreaList[4] = thisInputElement
          }
        }

        const positiveWidget = this.widgets.find(w => w.name === "positive");
        const loraWidget = this.widgets.find(w => w.name === "lora_str");
        const tempWidget = this.widgets.find(w => w.name === "temp_str");
        const tempLoraWidget = this.widgets.find(w => w.name === "temp_lora_str");
        const randomTemplateWidget = this.widgets.find(w => w.name === "random_template");

        // Lora Stack 创建可视化节点
        if (nodeData.name === "WeiLinPromptUIOnlyLoraStack") {
          await createLoraStackWidget(this, thisNodeSeed,nodeTextAreaList[3]);
        }

        // console.log(this)

        if (nodeData.name === "WeiLinPromptUI" ||
          nodeData.name === "WeiLinPromptUIWithoutLora") {
          globalNodeList.push({ seed: thisNodeSeed, text: getWidgetValue(positiveWidget, nodeTextAreaList[0]), id: this.id })

          const textarea = nodeTextAreaList[0];

          textarea.addEventListener('input', (event) => {
            const newValue = event.target.value;
            if (positiveWidget) {
              positiveWidget.value = newValue;
            }
            updateNodeTextBySeed(thisNodeSeed, newValue);
            window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')
          });
        }

        // 监听节点ID
        // 74.98 修复：新版 ComfyUI 前端把 id/title 实现为原型访问器（写入必须同步内部
        // 注册状态 _state，见前端 attachNodeToStores/registerNodeState）。旧代码直接
        // Object.defineProperty 定义自有 get/set 会**遮蔽**原型访问器，配置工作流时
        // node.id 赋值不再进入前端状态 → 注册节点按状态里的旧 id 判冲突 → 无限重铸
        // 死循环（[nodeShell] 刷屏、内存疯涨、界面卡死）。改为链式访问器：先调用
        // 原型原 get/set 保持前端状态同步，再触发插件回调；原型无访问器（旧版前端
        // 为普通数据属性）时回退旧行为。
        const chainPropListener = (prop, onChange) => {
          if (this['__weilin_chained_' + prop]) return // 防重复链式包装
          let desc = null
          let proto = Object.getPrototypeOf(this)
          while (proto) {
            const d = Object.getOwnPropertyDescriptor(proto, prop)
            if (d) { desc = d; break }
            proto = Object.getPrototypeOf(proto)
          }
          if (desc && desc.get && desc.set) {
            Object.defineProperty(this, prop, {
              configurable: true,
              enumerable: true,
              get() { return desc.get.call(this) },
              set(v) { desc.set.call(this, v); onChange(v) },
            })
          } else {
            const cur = this[prop]
            Object.defineProperty(this, prop, {
              configurable: true,
              enumerable: true,
              get() { return cur },
              set(v) { cur = v; onChange(v) },
            })
          }
          this['__weilin_chained_' + prop] = true
        }
        chainPropListener('id', onTisIdChange)

        function onTisIdChange(newId) {
          // console.log(newId)
          if (nodeData.name === "WeiLinPromptUI" ||
            nodeData.name === "WeiLinPromptUIWithoutLora") {
            updateNodeIdBySeed(thisNodeSeed, newId);
            window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')
          }
        }

        // 监听 this.title 的变化（同 id：链式原型访问器，保持前端状态同步）
        chainPropListener('title', onTitleChange);

        // 监听 this.title 变化的回调函数
        function onTitleChange(newTitle) {
          // console.log("New this.title:", newTitle);
          // 在这里可以处理新的 this.title 数据
          // 例如，将新的 this.title 传递给其他逻辑
          if (nodeData.name === "WeiLinPromptUI" ||
            nodeData.name === "WeiLinPromptUIWithoutLora") {
            updateNodeTitleBySeed(thisNodeSeed, newTitle);
            window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')
          }
        }

        // 保存原有的onRemoved函数
        const originalOnRemoved = this.onRemoved;
        // 节点被删除事件
        this.onRemoved = () => {
          // 调用原有的onRemoved函数
          if (originalOnRemoved) {
            originalOnRemoved.apply(this);
          }
          
          // 元素被销毁 事件发送更新元素
          if (nodeData.name === "WeiLinPromptUI" ||
            nodeData.name === "WeiLinPromptUIWithoutLora") {
            removeNodeBySeed(thisNodeSeed);
            window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')
          }
        }

        // console.log(thisNodeSeed)

        //console.log(globalNodeList)

        let randomID = ""

        randomID = generateUUID();

        if (nodeData.name === "WeiLinPromptUI" || nodeData.name === "WeiLinPromptUIWithoutLora") {
          // 节点按钮点击事件
          this.addWidget("button", localLanguage, '', ($e) => {
            // console.log(thisNodeName)
            // 发送消息给父窗口
            // console.log(global_randomID)
            randomID = generateUUID();
            // console.log("register====>",randomID)
            let jsonData = {
              prompt: getWidgetValue(positiveWidget, nodeTextAreaList[0]),
              lora: [],
              temp_prompt: {},
              temp_lora: {},
            }
            const loraStr = getWidgetValue(loraWidget, nodeTextAreaList[1]);
            const tempPromptStr = getWidgetValue(tempWidget, nodeTextAreaList[2]);
            const tempLoraStr = getWidgetValue(tempLoraWidget, nodeTextAreaList[3]);

            if (nodeData.name === "WeiLinPromptUI" && loraStr.length > 0) {
              jsonData.lora = JSON.parse(loraStr);
            }

            if (tempPromptStr.length > 0) {
              jsonData.temp_prompt = JSON.parse(tempPromptStr)
            }

            if (nodeData.name === "WeiLinPromptUI" && tempLoraStr.length > 0) {
              jsonData.temp_lora = JSON.parse(tempLoraStr)
            }

            const data = JSON.stringify(jsonData)
            window.parent.postMessage({ type: 'weilin_prompt_ui_openPromptBox', id: randomID, prompt: data, node: nodeData.name }, '*')
          });
        }

        if (nodeData.name === "WeiLinPromptUI" || nodeData.name === "WeiLinPromptUIOnlyLoraStack") {
          // 节点按钮点击事件
          this.addWidget("button", localOpenLoraLanguage, '', ($e) => {
            // console.log(thisNodeName)
            // 发送消息给父窗口
            // console.log(global_randomID)
            randomID = generateUUID();
            // console.log("register====>",randomID)
            let jsonData = {
              lora: [],
              temp_lora: {},
            }
            const loraStr = getWidgetValue(loraWidget, nodeTextAreaList[1]);
            const tempLoraStr = getWidgetValue(tempLoraWidget, nodeTextAreaList[3]);

            if (loraStr.length > 0) {
              jsonData.lora = JSON.parse(loraStr);
            }

            if (tempLoraStr.length > 0) {
              jsonData.temp_lora = JSON.parse(tempLoraStr)
            }

            const data = JSON.stringify(jsonData)
            window.parent.postMessage({ type: 'weilin_prompt_ui_open_node_lora_stack_window', seed: randomID, prompt: data, node: nodeData.name }, '*')
          });
        }


        window.addEventListener('message', event => {
          // console.log(e)
          if (event.data.type === 'weilin_prompt_ui_prompt_update_prompt_' + randomID) {
            // 接收到更新提示词内容消息

            const jsonReponse = JSON.parse(event.data.data)
            // console.log(jsonReponse)
            setWidgetValue(positiveWidget, jsonReponse.prompt);

            if (nodeData.name === "WeiLinPromptUI") {
              // console.log(jsonReponse.lora.length)
              if (jsonReponse.lora && jsonReponse.lora.length > 0 && jsonReponse.lora != "") {
                setWidgetValue(loraWidget, JSON.stringify(jsonReponse.lora));
              } else {
                setWidgetValue(loraWidget, "");
              }
            }

            if (jsonReponse.temp_prompt && jsonReponse.temp_prompt != "") {
              setWidgetValue(tempWidget, JSON.stringify(jsonReponse.temp_prompt));
            }else {
              setWidgetValue(tempWidget, "");
            }

            if (nodeData.name === "WeiLinPromptUI") {
              if (jsonReponse.temp_lora && jsonReponse.temp_lora != "") {
                setWidgetValue(tempLoraWidget, JSON.stringify(jsonReponse.temp_lora));
              }else {
                setWidgetValue(tempLoraWidget, "");
              }
            }


            // console.log(nodeTextAreaList)
            updateNodeTextBySeed(thisNodeSeed, jsonReponse.prompt);
            window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')

          } else if (event.data.type === 'weilin_prompt_ui_prompt_get_node_list_info') {
            // 获取节点导航信息
            if (nodeData.name === "WeiLinPromptUI" || nodeData.name === "WeiLinPromptUIWithoutLora") {
              updateNodeTextBySeed(thisNodeSeed, getWidgetValue(positiveWidget, nodeTextAreaList[0]));
              window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')
            }

          } else if (event.data.type === "weilin_prompt_ui_prompt_open_node_wit_seed" && event.data.seed === thisNodeSeed) {
            // 节点导航打开节点UI按钮

            randomID = generateUUID();
            // console.log("register====>",randomID)
            let jsonData = {
              prompt: getWidgetValue(positiveWidget, nodeTextAreaList[0]),
              lora: [],
              temp_prompt: {},
              temp_lora: {},
            }
            const loraStr = getWidgetValue(loraWidget, nodeTextAreaList[1]);
            const tempPromptStr = getWidgetValue(tempWidget, nodeTextAreaList[2]);
            const tempLoraStr = getWidgetValue(tempLoraWidget, nodeTextAreaList[3]);

            if (nodeData.name === "WeiLinPromptUI" && loraStr.length > 0) {
              jsonData.lora = JSON.parse(loraStr);
            }
            if (tempPromptStr.length > 0) {
              jsonData.temp_prompt = JSON.parse(tempPromptStr)
            }
            if (nodeData.name === "WeiLinPromptUI" && tempLoraStr.length > 0) {
              jsonData.temp_lora = JSON.parse(tempLoraStr)
            }

            const data = JSON.stringify(jsonData)
            window.parent.postMessage({ type: 'weilin_prompt_ui_openPromptBox', id: randomID, prompt: data, node: nodeData.name }, '*')
          
          } else if (event.data.type === 'weilin_prompt_ui_prompt_finish_lora_stack_' + randomID) {
            // 接收到更新LoraStack内容消息
            const jsonReponse = JSON.parse(event.data.data)
            // console.log(jsonReponse)
            if (nodeData.name === "WeiLinPromptUI" || nodeData.name === "WeiLinPromptUIOnlyLoraStack") {
              // console.log(jsonReponse.lora.length)
              if (jsonReponse.lora && jsonReponse.lora.length > 0 && jsonReponse.lora != "") {
                setWidgetValue(loraWidget, JSON.stringify(jsonReponse.lora));
              } else {
                setWidgetValue(loraWidget, "");
              }

              if (jsonReponse.temp_lora && jsonReponse.temp_lora != "") {
                setWidgetValue(tempLoraWidget, JSON.stringify(jsonReponse.temp_lora));
              }else{
                setWidgetValue(tempLoraWidget, "");
              }

              const tempLoraStr = getWidgetValue(tempLoraWidget, nodeTextAreaList[3]);
              if (tempLoraStr.length > 0) {
                window.weilinGlobalSelectedLoras[thisNodeSeed] = JSON.parse(tempLoraStr)
              }else {
                window.weilinGlobalSelectedLoras[thisNodeSeed]= []
              }
              renderAllLoras(thisNodeSeed)
            }
          
          }else if (event.data.type === "weilin_prompt_ui_prompt_node_finish_lora_stack_" + thisNodeSeed) {
            // 接收到更新LoraStack内容消息
            const jsonReponse = JSON.parse(event.data.data)
            if (nodeData.name === "WeiLinPromptUIOnlyLoraStack") {
              if (jsonReponse.lora && jsonReponse.lora.length > 0 && jsonReponse.lora != "") {
                setWidgetValue(loraWidget, JSON.stringify(jsonReponse.lora));
              } else {
                setWidgetValue(loraWidget, "");
              }
              if (jsonReponse.temp_lora && jsonReponse.temp_lora != "") {
                setWidgetValue(tempLoraWidget, JSON.stringify(jsonReponse.temp_lora));
              }else{
                setWidgetValue(tempLoraWidget, "");
              }
            }
          }else if (event.data.type === "weilin_prompt_ui_selectLora_stack_node_"+thisNodeSeed) {
            addLora(thisNodeSeed,event.data.lora)
          }else if (event.data.type === "weilin_prompt_ui_update_template_"+randomID) {
            setWidgetValue(randomTemplateWidget, event.data.data)
          }else if (event.data.type === "weilin_prompt_ui_get_template_"+randomID) {
            window.parent.postMessage({ type: 'weilin_prompt_ui_get_template_response', id: randomID, data: getWidgetValue(randomTemplateWidget, nodeTextAreaList[4]) }, '*')
          }else if (event.data.type === "weilin_prompt_ui_get_template_go_random_"+randomID) {
            window.parent.postMessage({ type: 'weilin_prompt_ui_get_template_go_random_response', id: randomID, data: getWidgetValue(randomTemplateWidget, nodeTextAreaList[4]) }, '*')
          }

        }, false);

        return r;
      };

      // When the node is executed we will be sent the input text, display this in the widget
			const onExecuted = nodeType.prototype.onExecuted;
			nodeType.prototype.onExecuted = function (message) {
				onExecuted?.apply(this, arguments);
        const positiveWidget = this.widgets.find(w => w.name === "positive");
        if (positiveWidget && message.positive) {
          setWidgetValue(positiveWidget, message.positive);
        }
        // 注意：历史保存不放这里——onExecuted 只在节点返回 {"ui":...} 时被触发
        // （本插件仅 auto_random=true 时才返回 ui），普通节点收不到 executed 消息。
        // 历史保存统一在提交队列时进行，见 setup() 中的 queuePrompt 钩子。
        // console.log(message.positive)
			};

      // 从已保存的工作流加载节点时（widget 值由 workflow 写入），再次执行屏蔽
      const onConfigure = nodeType.prototype.onConfigure;
      nodeType.prototype.onConfigure = function () {
        const r2 = onConfigure ? onConfigure.apply(this, arguments) : undefined;
        applyAutoRandomBlock(this);
        return r2;
      };
    }
  },
});


// ===== auto_random 屏蔽开关 =====
// localStorage 键：weilin_function_toggles_disableAutoRandom（'true' 表示屏蔽）
// 屏蔽时：隐藏 auto_random 控件 + 强制其值为 false，并禁止后续被改回 true
const AUTO_RANDOM_DISABLE_KEY = 'weilin_function_toggles_disableAutoRandom';

function isAutoRandomDisabled() {
  try {
    return localStorage.getItem(AUTO_RANDOM_DISABLE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

function applyAutoRandomBlock(node) {
  const widget = node.widgets && node.widgets.find(w => w.name === 'auto_random');
  if (!widget) return;
  if (isAutoRandomDisabled()) {
    // 强制关闭，清掉旧工作流里残留的 true
    widget.value = false;
    if (widget.element && widget.element.type === 'checkbox') {
      widget.element.checked = false;
    }
    if (widget.origType === 'hidden' || widget.type === 'hidden') return; // 已隐藏，避免重复处理
    hideWidgetForGood(node, widget);
  }
}

// 供页面（prompt_ui iframe 内的设置项）通过 postMessage 通知刷新
window.addEventListener('message', (event) => {
  const data = event && event.data;
  if (!data || data.type !== 'weilin_prompt_ui_auto_random_toggle') return;
  try {
    const graph = window.app && window.app.graph;
    const nodes = (graph && graph._nodes) || [];
    nodes.forEach((n) => {
      if (n.type === 'WeiLinPromptUI' || n.type === 'WeiLinPromptUIWithoutLora' ||
        n.type === 'WeiLinPromptUIOnlyLoraStack') {
        applyAutoRandomBlock(n);
        if (n.setDirtyCanvas) n.setDirtyCanvas(true, true);
      }
    });
  } catch (e) { /* 忽略 */ }
});

//from melmass
// https://github.com/kijai/ComfyUI-KJNodes/blob/main/web/js/spline_editor.js
function hideWidgetForGood(node, widget, suffix = '') {
  if (!widget) return;

  widget.origType = widget.type
  widget.origComputeSize = widget.computeSize
  widget.origComputeLayoutSize = widget.computeLayoutSize
  widget.origSerializeValue = widget.serializeValue
  widget.computeSize = () => [0, -4] // -4 is due to the gap litegraph adds between widgets automatically
  widget.computeLayoutSize = () => ({
    minWidth: 0,
    minHeight: 0,
    maxWidth: 0,
    maxHeight: 0,
  })
  widget.type = "hidden"
  widget.hidden = true

  hideWidgetElement(widget);
  widget.serializeValue = () => getWidgetValue(widget, widget.element);

  // Hide any linked widgets, e.g. seed+seedControl
  if (widget.linkedWidgets) {
    for (const w of widget.linkedWidgets) {
      hideWidgetForGood(node, w, ':' + widget.name)
    }
  }
}

function createLoraStackWidget(node, seed, ptEl) {
  var element = document.createElement("div");
  element.style.pointerEvents = "auto";
  protectDomWidgetEvents(element);

  const previewNode = node;
  const prSeed = seed;
  const prTempLoraEl = ptEl;
  const loraWidget = node.widgets.find(w => w.name === "lora_str");
  const tempLoraWidget = node.widgets.find(w => w.name === "temp_lora_str");

  window.weilinLoraStackWidgetRefs = window.weilinLoraStackWidgetRefs || {};
  window.weilinLoraStackWidgetRefs[prSeed] = {
    setValues(loraValue, tempLoraValue) {
      setWidgetValue(loraWidget, loraValue);
      setWidgetValue(tempLoraWidget, tempLoraValue);
    },
  };


  var previewWidget = node.addDOMWidget("weilin_lora_stack", "lora_stack", element, {
    serialize: false,
    hideOnZoom: false,
    getValue() {
      return element.value;
    },
    setValue(v) {
      element.value = v;
    },
  });

  previewNode.onResize = function () {
    let [w, h] = previewNode.size;
    if (h < 300) h = 300;
    previewNode.size = [w, h];
  };


  previewWidget.value = { hidden: false, paused: false, params: {} }
  previewWidget.parentEl = document.createElement("div");
  previewWidget.parentEl.className = "weilin-comfyui-lora-stack";
  element.appendChild(previewWidget.parentEl);

  const lang = navigator.language || navigator.userLanguage;
  const localLang = lang.startsWith('zh') ? 'zh' : 'en';
  previewWidget.contentEl = document.createElement("div");
  previewWidget.contentEl.innerHTML = `
    <div class="weilin-comfyui-lora-header">
        <div class="weilin-comfyui-header-actions">
            <button class="weilin-comfyui-add-btn" id="addLoraBtn_`+prSeed+`" data-seed="`+prSeed+`" title="${localLang === 'zh' ? '添加Lora' : 'Add Lora' }">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
            </button>
        </div>
    </div>
    <div class="weilin-comfyui-lora-body">
        <div class="weilin-comfyui-lora-list" id="loraListContainer_`+prSeed+`">
            <!-- Lora items will be added here dynamically -->
        </div>
    </div>
  `
  previewWidget.contentEl.className = "weilin-comfyui-lora-content"
  protectDomWidgetEvents(previewWidget.contentEl);
  previewWidget.parentEl.appendChild(previewWidget.contentEl)

  const addLoraButton = previewWidget.contentEl.querySelector(`#addLoraBtn_${prSeed}`);
  if (addLoraButton) {
    addLoraButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof openLoraManager === 'function') {
        openLoraManager(addLoraButton);
      } else {
        openNodeLoraManager(prSeed);
      }
    });
  }

  setTimeout(() => {
    const tempLoraValue = getWidgetValue(tempLoraWidget, prTempLoraEl);
    if (tempLoraValue.length > 0) {
      window.weilinGlobalSelectedLoras[seed] = JSON.parse(tempLoraValue)
    }else {
      window.weilinGlobalSelectedLoras[seed]= []
    }
    renderAllLoras(seed)
    // console.log(window.weilinGlobalSelectedLoras)
  },300)

  // console.log(node)
}
