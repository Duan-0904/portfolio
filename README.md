# 段韬 · 产品实习生作品集

基于 Next.js 构建的个人作品集网站，展示两个核心项目：中小融媒轻量级内容运营体系和简程 AI。

## 技术栈

- Next.js 16 (App Router)
- Tailwind CSS 4
- TypeScript
- 静态导出（`output: "export"`）

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## 构建和部署

```bash
npm run build    # 生成静态文件到 out/ 目录
```

推送 `main` 分支到 GitHub，然后在 [Vercel](https://vercel.com) 导入仓库即可自动部署。

## 项目结构

```
src/
├── app/
│   ├── layout.tsx       # 根布局（metadata + 系统字体栈）
│   ├── page.tsx         # 主页面
│   └── globals.css      # Tailwind + 全局样式
├── components/
│   ├── Navbar.tsx       # 置顶导航栏
│   ├── Hero.tsx         # 首屏
│   ├── ProjectCard.tsx  # 项目卡片（两个项目复用）
│   └── Footer.tsx       # 页脚
├── lib/
│   └── data.ts          # 所有文案内容集中管理
public/
└── images/              # 项目相关图片
```

## 设计原则

- 瑞士现代风格（Swiss Modern）
- 系统字体栈，零外部字体请求
- 零动效库、零图标库、零组件库依赖
- 原生 `<details>` 折叠，不写自定义动画
