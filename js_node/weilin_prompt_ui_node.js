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

app.registerExtension({
  name: "weilin.prompt_ui_node",
  async init() {},
  async setup() {},
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
        let currentThisId = this.id
        Object.defineProperty(this, 'id', {
          get() {
            return currentThisId;
          },
          set(newValue) {
            currentThisId = newValue;
            onTisIdChange(newValue);
          },
          enumerable: true,
          configurable: true
        });

        function onTisIdChange(newId) {
          // console.log(newId)
          if (nodeData.name === "WeiLinPromptUI" ||
            nodeData.name === "WeiLinPromptUIWithoutLora") {
            updateNodeIdBySeed(thisNodeSeed, newId);
            window.parent.postMessage({ type: 'weilin_prompt_ui_update_node_list_info', nodeList: globalNodeList }, '*')
          }
        }

        // 监听 this.title 的变化
        let currentTitle = this.title; // 缓存当前值
        Object.defineProperty(this, 'title', {
          get() {
            return currentTitle;
          },
          set(newValue) {
            // console.log(`this.title changed from ${currentTitle} to ${newValue}`);
            currentTitle = newValue;
            // 触发回调，返回新的 this.title 数据
            onTitleChange(newValue);
          },
          enumerable: true,
          configurable: true
        });

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
        // console.log(message.positive)
			};
    }
  },
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
