import os
import requests

# api_url = "https://api.gitcode.com"
api_url = "https://api.github.com"

# 共享云数据仓库（tags / danbooru 标签数据库包）
warehouse_repo = "LovedeHua/WeiLin-Comfyui-Tools-Prompt"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json'
}

# api.github.com 未认证限额仅 60 次/小时/IP，共享出口 IP 极易耗尽并触发 403 网络错误；
# 设置环境变量 GITHUB_TOKEN 后认证限额提升为 5000 次/小时
_token = os.environ.get('GITHUB_TOKEN')
if _token:
    headers['Authorization'] = f'token {_token}'

# 获取仓库的根目录
def get_main_warehouse():
    req_url = api_url + "/repos/" + warehouse_repo + "/git/trees/master"
    response = requests.get(req_url, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()

def get_warehouse_tree(path):
    req_url = api_url + "/repos/" + warehouse_repo + "/contents/" + path
    response = requests.get(req_url, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()
