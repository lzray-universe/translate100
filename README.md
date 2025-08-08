# 翻译一百次（免注册免 API · 爬虫版 · GitHub Pages）

这是一个**纯前端**的网页工具：把你输入的文本随机穿越多种语言 N 次，最后再翻回中文（或繁体）。
它通过**公开的 CORS 代理**抓取 Google Translate 网页端的非官方 JSON 接口，无需任何 API Key。

> ⚠️ 提示：该方案依赖第三方公开代理，**稳定性不保证**；如被限流或出现解析失败，请更换代理、减少次数或增大每次延迟。

## 一键部署到 GitHub Pages

1. 新建一个仓库，名字随意（如 `roundtrip-translate-site`）。
2. 把本项目里的所有文件推送到你的仓库根目录（保持目录结构不变）。
3. 进入仓库的 **Settings → Pages**，将 Source 设为 **GitHub Actions**。
4. 本项目已经附带 `.github/workflows/pages.yml`，推送后会自动构建并发布到 Pages。
5. 稍等片刻，访问 Pages 提供的网址即可使用。

## 使用说明

- 直接在页面粘贴原文，设置“跳转次数 / 种子 / 延迟 / 中间语言 / 代理模板”，点击“开始翻译”。
- 翻译过程会在“过程日志”里滚动打印。
- 完成后可复制或下载 `.txt`。

## 代理模板（CORS Proxy）

页面内置了几个选项：

- `https://api.allorigins.win/raw?url={url}`（默认）
- `https://cors.isomorphic-git.org/`
- 或者留空（**不走代理**，多数情况下会被浏览器 CORS 拒绝）

> 说明：带 `{url}` 的代理模板会把真实目标 URL 进行 `encodeURIComponent` 后填入。  
> 若你有自己的代理服务，只要它能把下游返回的内容原样透传，并设置 `Access-Control-Allow-Origin: *` 即可。

### 自建（可选）Cloudflare Worker 代理
如果你想更稳定，可以免费用 Cloudflare Worker 自建一个 CORS 代理：

把 `worker/cloudflare/worker.js` 中的代码粘贴到 Cloudflare Worker，新建并部署，
再把页面“代理模板”换成你自己的 Worker 地址，例如：

```
https://你的子域.workers.dev/{url}
```

## 法律与合规

- 本项目仅用于学习与演示；实际使用请遵守目标站点的服务条款。
- 你对所生成的内容与使用行为负责。
