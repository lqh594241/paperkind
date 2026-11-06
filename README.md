# Paperkind

第 6 个英文工具站，源码独立，无运行依赖或付费 API。双击 `index.html` 可用。本站：Printable Graph, Dot, Isometric & Knitting Paper Generator。

## 本地与构建

无需 npm install。安装 Node.js 后：

```
npm run dev
npm test
npm run build
```

本地地址：http://127.0.0.1:4178。构建输出 `dist`。

## 部署

建议单独 GitHub 仓库，上传本目录内容。Cloudflare Pages：框架 None，构建命令 `npm run build`，输出目录 `dist`。同仓库部署时根目录设为 `paperkind`。Workers 静态资源目录同样为 `dist`，使用控制台提供的静态资源部署配置。

生产环境设置 `SITE_URL=https://实际域名`（不要路径），构建生成该域名的 canonical、og:url、sitemap 和 robots sitemap 地址。未设置不编造域名。

## 广告与统计

`ads.js` 已接入本次提供的 Paperkind 专属 HilltopAds 横幅与弹窗链接。顶部横幅全宽、正常占位，可通过 × 关闭，不悬浮；空广告位折叠，手机上按可用宽度缩放。

首次真实点击 PDF（`#download-pdf`）或 SVG（`#download-svg`）导出按钮时打开广告页，每次页面加载只尝试一次，不阻止原本的下载。调整纸张、间距、预览、导航和关闭横幅不会触发弹窗。浏览器可能拦截弹窗，广告填充由平台决定。

所有 HTML 页面保留 Ahrefs Web Analytics，每页仅加载一次，data-key 为 `H9b2GINvE+UAtMw7v33ULA`。已有验证 meta 与 TXT 文件保留，隐私说明已更新。构建会自动包含 `ads.js`，上传本站源码时请一并上传。不要复制其他站的广告位或重复添加同一脚本。

## 范围

Vector graph, dot, triangular isometric and knitting chart paper with A4/Letter PDF and SVG downloads. Physical print size depends on actual-size printer settings and calibration. Knitting cell ratios are user-selected, not automatic yarn gauge.

没有验证关键词的真实搜索量、竞争度或收益，不承诺收录、排名或 AI 引用。英文静态页面提供公式、使用说明、限制、FAQ、隐私与条款。
