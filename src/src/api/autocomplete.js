import request from './request'
// 自动补全相关接口
export const autocompleteApi = {
    // 自动补全获取
    getAutocomplete: async (text) => {
        return await request({
            url: '/prompt/fast/autocomplete',
            method: 'post',
            data: { query: text }
        })
    },

    getAutocompleteLimit: async () => {
        return await request({
            url: '/get/setting/get_auto_limit_setting',
            method: 'post'
        })
    },

    // embeddings 候选列表：走插件自身端点，与标签库接口同链路（原生 /api/embeddings
    // 在反向代理只转发部分路径前缀或老版本 ComfyUI 下可能不可达，导致补全静默失效）
    getEmbeddingsList: async () => {
        return await request({
            url: '/get_embeddings_list',
            method: 'get'
        })
    },

    updateAutocompleteLimit: async (limit) => {
        return await request({
            url: '/update/setting/update_auto_limit_setting',
            method: 'post',
            data: {
                limit: limit
            }
        })
    },
}