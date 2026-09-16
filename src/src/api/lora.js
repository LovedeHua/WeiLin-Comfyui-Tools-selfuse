import request from './request'

// Lora相关接口
export const loraApi = {
  // 获取Lora列表
  getLoraList: async (params) => {
    return await request({
      url: '/get_lora_list',
      method: 'get',
      params
    })
  },

  // 获取Lora全部列表
  getAllLoraList: async (params) => {
    return await request({
      url: '/get_lora_load_all',
      method: 'get',
      params
    })
  },

  // 获取执行进度
  getAllLoraStatus: async (params) => {
    return await request({
      url: '/get_lora_load_status',
      method: 'get',
      params
    })
  },

  // 获取Lora详情
  getLoraDetail: async (params) => {
    return await request({
      url: '/lorainfo/api/loras/info',
      method: 'get',
      params
    })
  },

  // 获取Lora信息C站获取
  getLoraRefresh: async (params) => {
    return await request({
      url: '/lorainfo/api/loras/info/refresh',
      method: 'get',
      params
    })
  },

  // 上传Lora图片
  postUplaodImg: async (image,path,fileName) => {
    const body = new FormData();
    body.append("image", image);
    body.append("path", path);
    body.append("fileName", fileName);
    return await request({
        url: "/lorainfo/api/loras/set/img",
        method: 'post',
        data: body,
        headers: {'Content-Type': 'multipart/form-data'}
      })
  },

  // 通过 URL 设置 Lora 封面（后端代下，绕过浏览器 CORS）
  postSetCoverByUrl: async (file, url) => {
    return await request({
        url: "/lorainfo/api/loras/set/img/url",
        method: 'post',
        data: { file, url }
      })
  },

  // 保存Lora信息
  postLoraSave: async (file,json) => {
    const body = new FormData();
    body.append("json", JSON.stringify(json));
    return await request({
        url: "/lorainfo/api/loras/info?file="+file,
        method: 'post',
        data: body,
        headers: {'Content-Type': 'multipart/form-data'}
      })
  },

  // 删除Lora信息字段
  postLoraDelet: async (file,json) => {
    return await request({
        url: "/lorainfo/api/delete/loras/info/filed?file="+file,
        method: 'post',
        data: {
          json: json,
        },
      })
  },

  // 获取Lora文件夹列表
  getLoraFolderList: async () => {
    return await request({
      url: '/get_lora_folder_list',
      method: 'post',
    })
  },
  // 根据数组获取Lora具体信息
  getLoraRangeList: async (range) => {
    return await request({
      url: '/get_lora_list_by_range',
      method: 'post',
      data:{ range }
    })
  },
  // 查询Lora返回相关信息
  searchLoraGetFolderList: async (search) => {
    return await request({
      url: '/get_lora_list_by_search',
      method: 'post',
      data:{ search }
    })
  },
  // 批量检查 Lora 路径是否存在于 loras 目录（names: 路径数组 → {路径: bool}）
  checkLoraExists: async (names) => {
    return await request({
      url: '/check_lora_exists',
      method: 'post',
      data:{ names }
    })
  },
  // 批量获取 Lora 本地封面缩略图（names → {name: base64 dataURL | null}，无封面为 null）
  checkLoraPreviews: async (names) => {
    return await request({
      url: '/check_lora_previews',
      method: 'post',
      data:{ names }
    })
  },
}