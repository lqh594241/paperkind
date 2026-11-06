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

所有 HTML 页面已接入 Ahrefs Web Analytics，使用你提供的 data-key：`H9b2GINvE+UAtMw7v33ULA`，每页仅加载一次。首页代码在 `AHREFS_ANALYTICS_START/END` 内，隐私说明已同步更新。`AD_HEAD_START/END`、`AD_BANNER_START/END`、`AD_BODY_START/END` 广告位仍预留为空。顶部横幅是正常文档流的全宽区域，可关闭；粘贴本站专属广告位代码后移除 `#ad-banner` 的 hidden。不要复制其他站的广告位或重复添加同一脚本。启用广告后更新隐私说明。本站已启用统计，未加载真实广告。

## 范围

Vector graph, dot, triangular isometric and knitting chart paper with A4/Letter PDF and SVG downloads. Physical print size depends on actual-size printer settings and calibration. Knitting cell ratios are user-selected, not automatic yarn gauge.

没有验证关键词的真实搜索量、竞争度或收益，不承诺收录、排名或 AI 引用。英文静态页面提供公式、使用说明、限制、FAQ、隐私与条款。
