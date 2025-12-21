# TMarks Landing Page

TMarks 官方落地页 - AI 智能书签管理工具

## 项目信息

**GitHub**: https://github.com/ai-tmarks/tmarks

**演示**: https://tmarks.pages.dev

## 技术栈

- **Vite** - 构建工具
- **TypeScript** - 类型安全
- **React** - UI 框架
- **shadcn/ui** - 组件库
- **Tailwind CSS** - 样式框架

## 本地开发

```sh
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build
```

## 部署

### Cloudflare Pages

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 构建命令: `pnpm run build`
3. 输出目录: `dist`

### 手动部署

```sh
pnpm run build
# 上传 dist 目录到任意静态托管服务
```

## 功能模块

- **HeroSection** - 首屏介绍
- **FeaturesSection** - 功能特性展示
- **ProductDemo** - 产品演示
- **ExtensionDemo** - 浏览器扩展演示
- **TutorialSection** - 使用教程
- **TechStack** - 技术栈展示
- **Footer** - 页脚导航
