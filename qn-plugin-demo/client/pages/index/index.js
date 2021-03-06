/**
 * 容器API注入
 */
import { OpenAPI } from 'mii-open-api'
import create from '../../../../libs/create'
import store from '/store/index'


const plugin = requirePlugin('myPlugin')
// 不可更改的 api 对象
let openAPIs = new OpenAPI('myPlugin', {
  sendCard: async (params) => {
    console.info('sendCard:', params)
    return { success: true }
  },
  openChat: async (params) => {
    console.info('openChat:', params)
    return { success: true }
  },
})
// 注入
plugin.setBridge(openAPIs.get())

const set = require('lodash.set')

plugin.server.onPost(
  {
    path: '/storeChange/storeChange',
  },
  (body) => {
    const keys = Object.keys(body)
    keys.forEach((key) => {
      set(store.data, key, body[key])
    })
  }
)

plugin.server.onGet(
  {
    path: '/test/get',
  },
  async (data) => {
    console.log('get:', { data })
    return Date.now()
  }
)

create.Page(store, {
  onLoad(query) {
    // 页面加载
  },
  onReady() {
    // 页面加载完成
  },
  onShow() {
    // 页面显示
  },
  onHide() {
    // 页面隐藏
  },
  onUnload() {
    // 页面被关闭
  },
  onTitleClick() {
    // 标题被点击
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    // 页面被拉到底部
  },
  onShareAppMessage() {
    // 返回自定义分享信息
    return {
      title: 'My App',
      desc: 'My App description',
      path: 'pages/index/index',
    }
  },
  navigateToPlugin() {},
})
