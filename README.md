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

当前正式域名为 `https://paperkind.luqihang594241.workers.dev/`，记录在 `package.json` 的 `homepage` 中。构建默认使用此域名生成 canonical、og:url、sitemap.xml 和带 Sitemap 声明的 robots.txt；遗漏 `SITE_URL` 也会生成文件。改域名时设置构建环境变量 `SITE_URL=https://新的正式域名`（不含子路径）后重新构建发布，变量优先于 `homepage`。源码根目录也已提供当前域名的 `sitemap.xml` 和 `robots.txt`，支持直接发布；直接发布源码且更换域名时需同步更新两文件和 `homepage`。

## 广告与统计

`ads.js` 已接入本次提供的 Paperkind 专属 HilltopAds 横幅与弹窗链接。顶部横幅全宽、正常占位，可通过 × 关闭，不悬浮；空广告位折叠，手机上按可用宽度缩放。

首次真实点击 PDF（`#download-pdf`）或 SVG（`#download-svg`）导出按钮时打开广告页，每次页面加载只尝试一次，不阻止原本的下载。调整纸张、间距、预览、导航和关闭横幅不会触发弹窗。浏览器可能拦截弹窗，广告填充由平台决定。

所有 HTML 页面保留 Ahrefs Web Analytics，每页仅加载一次，data-key 为 `H9b2GINvE+UAtMw7v33ULA`。已有验证 meta 与 TXT 文件保留，隐私说明已更新。构建会自动包含 `ads.js`，上传本站源码时请一并上传。不要复制其他站的广告位或重复添加同一脚本。

## 范围

Vector graph, dot, triangular isometric and knitting chart paper with A4/Letter PDF and SVG downloads. Physical print size depends on actual-size printer settings and calibration. Knitting cell ratios are user-selected, not automatic yarn gauge.

没有验证关键词的真实搜索量、竞争度或收益，不承诺收录、排名或 AI 引用。英文静态页面提供公式、使用说明、限制、FAQ、隐私与条款。

## 搜索引擎站点地图检查

更新 GitHub 并等待 Cloudflare 部署成功后，打开 https://paperkind.luqihang594241.workers.dev/sitemap.xml ，应显示 XML 网址列表，不能是首页或 404。然后在对应 Google Search Console 网站属性的 Sitemaps 中提交 `sitemap.xml`，检查状态是否为 Success；也可向 Bing Webmaster Tools 提交同一地址。提交成功提示仅代表接受请求，成功读取也不保证收录、排名或流量。
