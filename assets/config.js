// 你可以在这里修改默认配置；站点运行时会读取 window.APP_CONFIG
window.APP_CONFIG = {
  // 代理模板：含 {url} 的将把目标URL进行 encodeURIComponent 后替换
  // 也可用目录型代理（以 / 结尾），会拼接为 PROXY + 真实URL
  proxyTemplate: "https://cors-header-proxy.lzraylzraylzray.workers.dev/corsproxy?apiurl={url}",

  // 可选备用：例如 "https://cors.isomorphic-git.org/"
  backupProxy: "https://cors.isomorphic-git.org/",

  // 默认中间语言（不包含中文）
  langs:[
    "en","ja","ko","fr","de","es","pt","it","ru","uk","pl","nl","cs","sv","fi","da",
    "no","tr","el","he","ar","hi","id","ms","vi","th","ro","bg","hu","sk","sl","hr",
    "et","lt","lv","sr","fa","bn","ur","ta","te","mr","gu","sw","af","ga","zu"
  ],

  // 请求超时（毫秒）
  timeout: 20000,

  // 最大单段长度，避免URL过长
  chunkLimit: 1500
};
