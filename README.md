<div align="center">

# 🔖 TMarks

**AI 驱动的智能书签管理系统**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3%20%7C%2019-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0%20%7C%207-646cff.svg)](https://vitejs.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-f38020.svg)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

简体中文

[在线演示](https://tmarks.669696.xyz) | [问题反馈](https://github.com/ai-tmarks/tmakrs/issues)

</div>

---

## 📸 项目预览

> 注：可以在这里添加项目截图

### Web 应用

- 书签管理界面
- 标签页组管理
- 公开分享页面
- 设置页面

### 浏览器扩展

- 弹窗界面
- 设置页面
- AI 标签推荐

---

## ✨ 项目简介

TMarks 是一个现代化的书签管理解决方案，结合 AI 技术为你的书签自动生成智能标签，让书签管理变得简单高效。项目包含 Web 应用和浏览器扩展两部分，支持多设备同步、公开分享、标签页组管理等丰富功能。

### 🌟 项目亮点

- **完全免费部署** - 基于 Cloudflare Pages + D1 + KV，零成本运行
- **AI 智能标签** - 支持 8+ AI 提供商，自动生成高质量标签
- **离线优先** - 浏览器扩展使用 IndexedDB 本地缓存，离线也能使用
- **现代化技术栈** - React 18/19 + TypeScript + Vite + TailwindCSS 4
- **完整的 API** - RESTful API + API Key 认证，支持第三方集成
- **开箱即用** - 提供完整的数据库迁移和部署脚本

### 🎯 核心特性

#### 📚 书签管理
- **AI 智能标签** - 支持 OpenAI、Anthropic、DeepSeek、智谱、ModelScope、SiliconFlow、iFlow 等 8+ AI 提供商
- **多维度筛选** - 按标签、关键词、可见性、置顶、归档等多种方式快速查找书签
- **批量操作** - 支持批量编辑、删除、导出、归档书签
- **拖拽排序** - 直观的拖拽操作，自由调整书签顺序
- **多种视图** - 卡片、列表、极简、瀑布流等多种展示模式
- **点击统计** - 自动记录书签点击次数和最后访问时间
- **封面图片** - 自动抓取或手动设置书签封面图片

#### 🗂️ 标签页组管理
- **一键收纳** - 类似 OneTab，一键保存当前浏览器所有标签页
- **智能分组** - 支持文件夹层级结构，灵活组织标签页组
- **快速恢复** - 一键恢复之前保存的标签页组，继续工作
- **回收站** - 误删除的标签页组可以从回收站恢复，支持永久删除
- **统计分析** - 查看标签页组的创建趋势和使用统计
- **拖拽排序** - 支持标签页组和文件夹的拖拽排序

#### 🌐 公开分享
- **自定义分享页** - 创建个性化的公开书签展示页面
- **访问控制** - 灵活控制书签的公开/私密状态
- **独立域名** - 每个用户拥有独立的分享链接（slug）
- **KV 缓存** - 使用 Cloudflare KV 缓存公开页面，访问速度极快
- **SEO 友好** - 支持自定义页面标题和描述

#### 🔌 浏览器扩展
- **快速保存** - 在任意网页一键保存书签
- **AI 推荐** - 实时生成标签建议，支持多个 AI 提供商
- **离线支持** - 使用 Dexie (IndexedDB) 本地缓存，离线也能访问
- **标签页收纳** - 直接从扩展收纳当前窗口的所有标签页
- **双模式切换** - 支持书签保存和标签页收纳两种模式
- **自动同步** - 与 Web 应用实时同步数据
- **Manifest V3** - 使用最新的浏览器扩展标准

#### 🎨 用户体验
- **响应式设计** - 完美适配桌面端和移动端
- **多主题支持** - 亮色、暗色主题自由切换
- **实时同步** - 浏览器扩展与 Web 应用实时同步
- **性能优化** - 搜索防抖、虚拟滚动、代码分割等多项优化
- **Toast 通知** - 优雅的操作反馈提示
- **加载状态** - 完善的加载和错误状态处理

#### 🔐 安全与权限
- **JWT 认证** - 使用 Access Token + Refresh Token 双令牌机制
- **API Key 管理** - 支持创建多个 API Key，精细化权限控制
- **权限模板** - 提供只读、基础、完全访问三种权限模板
- **速率限制** - 基于 Cloudflare KV 的速率限制保护
- **密码加密** - 使用 bcrypt 加密存储密码
- **数据加密** - 敏感数据使用 AES-256-GCM 加密

---

## 💡 技术亮点

### 架构设计

- **Serverless 架构** - 基于 Cloudflare Workers，无需管理服务器，自动扩展
- **边缘计算** - 利用 Cloudflare 全球边缘网络，访问速度快
- **前后端分离** - 清晰的架构设计，易于维护和扩展
- **类型安全** - 全栈 TypeScript，编译时类型检查

### 性能优化

- **虚拟滚动** - 使用 TanStack Virtual，支持大量数据流畅滚动
- **代码分割** - 按路由和组件懒加载，减少初始加载时间
- **图片优化** - 懒加载和占位符，优化加载体验
- **缓存策略** - 多层缓存（浏览器缓存、KV 缓存、IndexedDB 缓存）
- **防抖节流** - 搜索和 API 请求使用防抖，提升性能

### 安全性

- **双令牌认证** - Access Token + Refresh Token，安全可靠
- **API Key 管理** - 支持多个 API Key，精细化权限控制
- **数据加密** - 敏感数据使用 AES-256-GCM 加密
- **密码加密** - 使用 bcrypt 加密存储
- **XSS 防护** - 使用 DOMPurify 防止 XSS 攻击
- **CSRF 防护** - Token 验证防止 CSRF 攻击
- **速率限制** - 防止 API 滥用

### 用户体验

- **响应式设计** - 完美适配桌面端和移动端
- **离线支持** - 浏览器扩展支持离线使用
- **实时同步** - 扩展与 Web 应用实时同步
- **优雅降级** - 即使 AI 服务不可用，核心功能仍可使用
- **错误处理** - 完善的错误提示和恢复机制
- **加载状态** - 清晰的加载和骨架屏提示

### 开发体验

- **热重载** - Vite HMR，开发体验极佳
- **类型提示** - 完整的 TypeScript 类型定义
- **代码规范** - ESLint + Prettier 自动格式化
- **Git Hooks** - Husky + lint-staged 提交前检查
- **模块化** - 清晰的目录结构，易于维护

---

## 🏗️ 技术架构

### 前端技术栈

```
React 18 + TypeScript
├── 构建工具: Vite 6
├── 样式: TailwindCSS 4 (alpha)
├── 状态管理: Zustand
├── 数据获取: @tanstack/react-query
├── 路由: React Router v7
├── 拖拽: @dnd-kit
└── 图标: lucide-react
```

### 后端技术栈

```
Cloudflare Workers (Pages Functions)
├── 运行时: Cloudflare Workers
├── 数据库: Cloudflare D1 (SQLite)
├── 缓存: Cloudflare KV
├── 认证: JWT (Access + Refresh tokens)
└── API: RESTful API
```

### 浏览器扩展

```
Manifest V3
├── 框架: React 19 + TypeScript
├── 构建: Vite 7 + @crxjs/vite-plugin
├── 本地存储: Dexie (IndexedDB)
├── AI 集成: OpenAI, Anthropic, DeepSeek, 智谱, ModelScope, SiliconFlow, iFlow, Custom
├── 状态管理: Zustand
└── 样式: TailwindCSS 3
```

### 支持的 AI 提供商

| 提供商 | 模型示例 | 特点 |
|--------|---------|------|
| OpenAI | gpt-4o, gpt-4o-mini | 业界领先，质量最高 |
| Anthropic | claude-3-5-sonnet | 长文本理解能力强 |
| DeepSeek | deepseek-chat | 国产优秀模型，性价比高 |
| 智谱 AI | glm-4-flash | 中文理解能力强 |
| ModelScope | qwen-plus | 阿里云平台，稳定可靠 |
| SiliconFlow | deepseek-ai/DeepSeek-V3 | 多模型聚合平台 |
| iFlow | - | 自定义 API 端点 |
| Custom | - | 支持任意兼容 OpenAI 格式的 API |

---

## 📁 项目结构

```
aitmarks.v.0.0.1.0-tab/
├── tmarks/                    # Web 应用主项目
│   ├── src/                  # 前端源代码
│   │   ├── components/      # React 组件
│   │   │   ├── bookmarks/  # 书签相关组件
│   │   │   ├── tags/       # 标签相关组件
│   │   │   ├── tab-groups/ # 标签页组组件
│   │   │   ├── api-keys/   # API Key 管理组件
│   │   │   ├── import-export/ # 导入导出组件
│   │   │   ├── auth/       # 认证组件
│   │   │   ├── layout/     # 布局组件
│   │   │   └── common/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── bookmarks/  # 书签页面
│   │   │   ├── tab-groups/ # 标签页组页面
│   │   │   ├── settings/   # 设置页面
│   │   │   ├── share/      # 分享页面
│   │   │   ├── auth/       # 认证页面
│   │   │   └── extension/  # 扩展页面
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务
│   │   ├── stores/         # Zustand 状态管理
│   │   ├── routes/         # 路由配置
│   │   └── lib/            # 工具函数和类型
│   ├── functions/          # Cloudflare Pages Functions (后端)
│   │   ├── api/           # API 路由
│   │   │   ├── v1/        # API v1 版本
│   │   │   ├── bookmarks/ # 书签 API
│   │   │   ├── tags/      # 标签 API
│   │   │   ├── tab-groups/ # 标签页组 API
│   │   │   ├── share/     # 分享 API
│   │   │   ├── public/    # 公开 API
│   │   │   └── statistics/ # 统计 API
│   │   ├── lib/           # 后端工具
│   │   │   ├── api-key/   # API Key 管理
│   │   │   ├── import-export/ # 导入导出
│   │   │   ├── jwt.ts     # JWT 认证
│   │   │   ├── crypto.ts  # 加密工具
│   │   │   ├── rate-limit.ts # 速率限制
│   │   │   └── validation.ts # 数据验证
│   │   └── middleware/    # 中间件
│   │       ├── auth.ts    # JWT 认证中间件
│   │       ├── api-key-auth.ts # API Key 认证中间件
│   │       ├── dual-auth.ts # 双重认证中间件
│   │       └── security.ts # 安全中间件
│   ├── migrations/        # 数据库迁移文件
│   │   └── full_schema.sql # 完整数据库架构
│   ├── shared/           # 前后端共享代码
│   │   └── permissions.ts # 权限定义
│   ├── wrangler.toml     # Cloudflare 配置
│   ├── vite.config.ts    # Vite 配置
│   └── package.json      # 依赖配置
│
├── tab/                      # 浏览器扩展
│   ├── src/
│   │   ├── popup/         # 弹窗界面
│   │   │   ├── Popup.tsx  # 主弹窗
│   │   │   ├── ModeSelector.tsx # 模式选择
│   │   │   └── TabCollectionView.tsx # 标签页收纳视图
│   │   ├── options/       # 配置页面
│   │   │   ├── Options.tsx # 设置主页
│   │   │   └── components/ # 设置组件
│   │   ├── background/    # 后台服务
│   │   │   └── index.ts   # Service Worker
│   │   ├── content/       # 内容脚本
│   │   │   └── index.ts   # 页面注入脚本
│   │   ├── lib/           # 工具库
│   │   │   ├── api/       # API 客户端
│   │   │   │   └── tmarks/ # TMarks API 封装
│   │   │   ├── db/        # IndexedDB (Dexie)
│   │   │   ├── providers/ # AI 提供商
│   │   │   │   ├── openai.ts
│   │   │   │   ├── claude.ts
│   │   │   │   ├── deepseek.ts
│   │   │   │   ├── zhipu.ts
│   │   │   │   ├── modelscope.ts
│   │   │   │   ├── siliconflow.ts
│   │   │   │   ├── iflow.ts
│   │   │   │   └── custom.ts
│   │   │   ├── services/  # 业务逻辑
│   │   │   ├── store/     # Zustand 状态
│   │   │   └── utils/     # 工具函数
│   │   ├── components/    # 共享组件
│   │   └── types/         # TypeScript 类型
│   ├── manifest.json      # 扩展配置 (Manifest V3)
│   ├── vite.config.ts     # Vite 配置
│   └── package.json       # 依赖配置
│
├── LICENSE                   # MIT 许可证
└── README.md                 # 项目文档
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** 18+ (推荐使用 20 LTS 版本)
- **pnpm** 8+ (项目使用 pnpm 作为包管理器)
- **Cloudflare 账号** (用于部署，免费套餐即可)
- **AI API Key** (可选，用于 AI 标签生成功能)

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/ai-tmarks/tmakrs.git
cd tmakrs
```

#### 2. 安装依赖

```bash
# Web 应用
cd tmarks
pnpm install

# 浏览器扩展
cd ../tab
pnpm install
```

#### 3. 数据库设置

```bash
# 创建本地 D1 数据库
cd tmarks
wrangler d1 create tmarks-prod-db --local

# 运行数据库迁移
pnpm db:migrate:local
```

#### 4. 配置 Wrangler

编辑 `tmarks/wrangler.toml`，确保数据库配置正确：

```toml
[[d1_databases]]
binding = "DB"
database_name = "tmarks-prod-db"
database_id = "your-database-id"  # 从上一步获取
```

#### 5. 启动开发服务器

```bash
# Web 应用 (在 tmarks 目录)
cd tmarks
pnpm dev
# 访问 http://localhost:5173

# 浏览器扩展 (在 tab 目录，新开一个终端)
cd tab
pnpm dev
# 扩展会自动构建到 dist 目录
```

Web 应用会在 `http://localhost:5173` 启动，浏览器扩展会自动构建到 `tab/dist` 目录。

### 浏览器扩展安装

#### 开发模式

1. 构建扩展：
```bash
cd tab
pnpm dev  # 开发模式，支持热重载
# 或
pnpm build  # 生产构建
```

2. 在浏览器中加载：
   - **Chrome/Edge**:
     - 打开 `chrome://extensions/` 或 `edge://extensions/`
     - 启用「开发者模式」
     - 点击「加载已解压的扩展程序」
     - 选择 `tab/dist` 目录

   - **Firefox**:
     - 打开 `about:debugging#/runtime/this-firefox`
     - 点击「临时载入附加组件」
     - 选择 `tab/dist/manifest.json`

3. 配置扩展：
   - 点击扩展图标，进入设置页面
   - **AI 服务配置**：
     - 选择 AI 提供商（OpenAI、Anthropic、DeepSeek 等）
     - 输入对应的 API Key
     - 配置 Base URL（可选，用于自定义端点）
   - **书签站点配置**：
     - API 地址：`https://your-domain.com/api` 或 `http://localhost:5173/api`（本地开发）
     - API Key：在 Web 应用的「API Keys」页面创建

---

## 📖 使用指南

### Web 应用

#### 书签管理
1. **添加书签** - 点击「新建书签」按钮，填写标题、URL、描述等信息
2. **AI 标签** - 系统会自动为书签生成智能标签建议
3. **搜索筛选** - 使用搜索框或标签筛选快速查找书签
4. **批量操作** - 选中多个书签进行批量编辑或删除

#### 标签页组
1. **创建标签页组** - 点击「新建标签页组」，手动添加标签页
2. **使用扩展收纳** - 通过浏览器扩展一键收纳当前窗口的所有标签页
3. **恢复标签页** - 点击标签页组的「恢复」按钮，在新窗口打开所有标签页
4. **文件夹管理** - 创建文件夹，组织标签页组

#### 公开分享
1. **启用分享** - 在设置中启用公开分享功能
2. **自定义页面** - 设置分享页面的标题和描述
3. **控制可见性** - 为每个书签设置公开/私密状态
4. **分享链接** - 复制分享链接，分享给他人

### 浏览器扩展

#### 保存书签
1. 在任意网页点击扩展图标
2. 选择「保存书签」模式
3. AI 会自动分析页面并生成标签建议
4. 选择或添加标签，点击「保存书签」

#### 收纳标签页
1. 点击扩展图标
2. 选择「收纳标签页」模式
3. 选择要收纳的标签页（或全选）
4. 点击「收纳」按钮

---

## 🔧 配置说明

### Web 应用配置

#### Cloudflare 配置 (wrangler.toml)

```toml
name = "tmarks"
compatibility_date = "2024-03-18"
pages_build_output_dir = "dist"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "tmarks-prod-db"
database_id = "your_database_id"  # 从 wrangler d1 create 命令获取

# KV 命名空间 - 速率限制
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your_rate_limit_kv_id"  # 从 wrangler kv:namespace create 命令获取

# KV 命名空间 - 公开分享缓存
[[kv_namespaces]]
binding = "PUBLIC_SHARE_KV"
id = "your_public_share_kv_id"  # 从 wrangler kv:namespace create 命令获取

# 环境变量
[vars]
ALLOW_REGISTRATION = "true"  # 是否允许注册
JWT_SECRET = "your-super-secret-jwt-key-at-least-32-characters"  # JWT 密钥
ENCRYPTION_KEY = "your-encryption-key-32-chars"  # 加密密钥
ENVIRONMENT = "production"  # 环境：production 或 development
JWT_ACCESS_TOKEN_EXPIRES_IN = "365d"  # Access Token 过期时间
JWT_REFRESH_TOKEN_EXPIRES_IN = "365d"  # Refresh Token 过期时间
```

**重要提示**：
- `JWT_SECRET` 和 `ENCRYPTION_KEY` 必须是强随机字符串，至少 32 个字符
- 生产环境建议使用 `wrangler secret put` 命令设置敏感信息，而不是直接写在 `wrangler.toml` 中
- 数据库 ID 和 KV ID 需要通过 Wrangler CLI 创建后获取

### 浏览器扩展配置

在扩展的设置页面配置：

#### 1. AI 服务配置

| 提供商 | 配置项 | 说明 |
|--------|--------|------|
| OpenAI | API Key | 从 [OpenAI Platform](https://platform.openai.com/) 获取 |
| | Base URL | 可选，默认 `https://api.openai.com/v1` |
| | Model | 默认 `gpt-4o-mini` |
| Anthropic | API Key | 从 [Anthropic Console](https://console.anthropic.com/) 获取 |
| | Model | 默认 `claude-3-5-sonnet-20241022` |
| DeepSeek | API Key | 从 [DeepSeek Platform](https://platform.deepseek.com/) 获取 |
| | Model | 默认 `deepseek-chat` |
| 智谱 AI | API Key | 从 [智谱开放平台](https://open.bigmodel.cn/) 获取 |
| | Model | 默认 `glm-4-flash` |
| ModelScope | API Key | 从 [ModelScope](https://modelscope.cn/) 获取 |
| | Model | 默认 `qwen-plus` |
| SiliconFlow | API Key | 从 [SiliconFlow](https://siliconflow.cn/) 获取 |
| | Model | 默认 `deepseek-ai/DeepSeek-V3` |
| iFlow | API Key | 自定义 API 端点 |
| | Base URL | 必填 |
| Custom | API Key | 任意兼容 OpenAI 格式的 API |
| | Base URL | 必填 |
| | Model | 必填 |

#### 2. 书签站点配置

- **API 地址**：
  - 生产环境：`https://your-domain.com/api`
  - 本地开发：`http://localhost:5173/api`

- **API Key**：
  1. 登录 Web 应用
  2. 进入「设置」→「API Keys」页面
  3. 点击「创建 API Key」
  4. 选择权限模板（推荐「完全访问」）
  5. 复制生成的 API Key 到扩展设置中

#### 3. 其他配置

- **自动同步**：开启后，扩展会自动与服务器同步数据
- **离线模式**：即使未配置 API，也可以使用本地缓存功能

---

## 🚀 部署

TMarks 使用 Cloudflare Pages + D1 + KV 部署，完全免费且性能出色。

### 快速部署步骤

#### 1. 安装 Wrangler CLI

```bash
# 全局安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare 账号
wrangler login
```

#### 2. 创建 Cloudflare 资源

```bash
cd tmarks

# 创建 D1 数据库
wrangler d1 create tmarks-prod-db
# 记录输出的 database_id

# 创建 KV 命名空间 - 速率限制
wrangler kv:namespace create "RATE_LIMIT_KV"
# 记录输出的 id

# 创建 KV 命名空间 - 公开分享
wrangler kv:namespace create "PUBLIC_SHARE_KV"
# 记录输出的 id
```

#### 3. 配置项目

编辑 `tmarks/wrangler.toml`，填入上一步获得的资源 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "tmarks-prod-db"
database_id = "你的数据库ID"  # 替换为实际的 database_id

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "你的速率限制KV_ID"  # 替换为实际的 id

[[kv_namespaces]]
binding = "PUBLIC_SHARE_KV"
id = "你的公开分享KV_ID"  # 替换为实际的 id
```

配置敏感信息（推荐使用 Secrets，而不是直接写在 wrangler.toml）：

```bash
# 生成强随机密钥（可以使用 openssl 或在线工具）
# 设置 JWT 密钥
wrangler secret put JWT_SECRET
# 输入至少 32 个字符的随机字符串

# 设置加密密钥
wrangler secret put ENCRYPTION_KEY
# 输入至少 32 个字符的随机字符串
```

#### 4. 初始化数据库

```bash
cd tmarks

# 运行数据库迁移
pnpm db:migrate

# 验证数据库
wrangler d1 execute tmarks-prod-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

#### 5. 部署到 Cloudflare Pages

**方式一：通过 Cloudflare Dashboard（推荐）**

1. 将代码推送到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入「Workers & Pages」→「Create application」→「Pages」→「Connect to Git」
4. 选择你的 GitHub 仓库
5. 配置构建设置：
   - **项目名称**: `tmarks`（或自定义）
   - **生产分支**: `main`
   - **框架预设**: `None`
   - **构建命令**: `cd tmarks && pnpm install && pnpm build`
   - **构建输出目录**: `tmarks/dist`
   - **根目录**: `/`（留空或选择根目录）
6. 点击「Environment variables」，添加环境变量：
   - `ALLOW_REGISTRATION`: `true`
   - `ENVIRONMENT`: `production`
   - `JWT_ACCESS_TOKEN_EXPIRES_IN`: `365d`
   - `JWT_REFRESH_TOKEN_EXPIRES_IN`: `365d`
7. 点击「Save and Deploy」
8. 部署完成后，进入项目设置：
   - 「Settings」→「Functions」→「D1 database bindings」
   - 添加绑定：变量名 `DB`，选择之前创建的数据库
   - 「Settings」→「Functions」→「KV namespace bindings」
   - 添加绑定：变量名 `RATE_LIMIT_KV`，选择对应的 KV
   - 添加绑定：变量名 `PUBLIC_SHARE_KV`，选择对应的 KV
9. 重新部署以应用绑定

**方式二：通过 Wrangler CLI**

```bash
cd tmarks

# 构建项目
pnpm install
pnpm build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=tmarks

# 首次部署后，需要在 Dashboard 中绑定 D1 和 KV
```

#### 6. 配置自定义域名（可选）

1. 在 Cloudflare Dashboard 中进入你的 Pages 项目
2. 「Custom domains」→「Set up a custom domain」
3. 输入你的域名（需要在 Cloudflare 托管 DNS）
4. 按照提示完成 DNS 配置

#### 7. 验证部署

访问你的部署地址（例如 `https://tmarks.pages.dev`），应该能看到登录页面。

1. 注册一个账号
2. 登录后创建一个书签
3. 测试 AI 标签生成功能（需要在扩展中配置 AI API Key）

### 部署浏览器扩展

#### 发布到 Chrome Web Store

1. 构建生产版本：
```bash
cd tab
pnpm build
```

2. 打包扩展：
```bash
# 将 dist 目录打包为 zip 文件
cd dist
zip -r ../tmarks-extension.zip .
```

3. 上传到 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

#### 发布到 Firefox Add-ons

1. 构建生产版本（同上）
2. 上传到 [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)

### 持续部署

Cloudflare Pages 支持自动部署：

- 推送到 `main` 分支会自动触发生产部署
- 推送到其他分支会创建预览部署
- 每次部署都会自动运行构建命令

### 常见问题

**Q: 部署后无法访问 API？**
- 检查 D1 和 KV 绑定是否正确
- 检查环境变量是否设置
- 查看 Cloudflare Pages 的部署日志

**Q: 数据库迁移失败？**
- 确保 `wrangler.toml` 中的 `database_id` 正确
- 使用 `wrangler d1 migrations list tmarks-prod-db` 查看迁移状态

**Q: JWT 认证失败？**
- 确保 `JWT_SECRET` 已设置且足够长（至少 32 个字符）
- 检查 Secrets 是否正确设置

**Q: 如何更新数据库架构？**
```bash
# 创建新的迁移文件
cd tmarks/migrations
# 编辑 SQL 文件

# 应用迁移
wrangler d1 migrations apply tmarks-prod-db
```

---

## 📊 API 文档

TMarks 提供完整的 RESTful API，支持 JWT 认证和 API Key 认证两种方式。

### 认证方式

#### 1. JWT 认证（用户登录）

```bash
# 注册
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "user",
  "password": "password",
  "email": "user@example.com"
}

# 登录
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}

# 响应
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user_id",
    "username": "user",
    "email": "user@example.com"
  }
}

# 使用 Access Token
GET /api/v1/bookmarks
Authorization: Bearer <access_token>

# 刷新 Token
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}
```

#### 2. API Key 认证（第三方集成）

```bash
# 创建 API Key
POST /api/v1/settings/api-keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My API Key",
  "description": "For browser extension",
  "template": "FULL",  // READ_ONLY, BASIC, FULL
  "expires_at": null   // 可选，过期时间
}

# 使用 API Key
GET /api/bookmarks
X-API-Key: tmarks_xxxxxxxxxxxxxxxx
```

### 书签 API

```bash
# 获取书签列表
GET /api/bookmarks?keyword=search&tags=tag1,tag2&sort=popular&is_public=true
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 响应
{
  "bookmarks": [
    {
      "id": "bookmark_id",
      "title": "Example",
      "url": "https://example.com",
      "description": "Description",
      "cover_image": "https://...",
      "tags": ["tag1", "tag2"],
      "is_pinned": false,
      "is_archived": false,
      "is_public": true,
      "click_count": 10,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100
}

# 创建书签
POST /api/bookmarks
Authorization: Bearer <token> 或 X-API-Key: <api_key>
Content-Type: application/json

{
  "title": "Example",
  "url": "https://example.com",
  "description": "Description",
  "cover_image": "https://...",
  "tags": ["tag1", "tag2"],
  "is_public": false
}

# 更新书签
PATCH /api/bookmarks/:id
Authorization: Bearer <token> 或 X-API-Key: <api_key>
Content-Type: application/json

{
  "title": "Updated Title",
  "is_pinned": true
}

# 删除书签
DELETE /api/bookmarks/:id
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 批量删除书签
POST /api/bookmarks/batch-delete
Authorization: Bearer <token> 或 X-API-Key: <api_key>
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"]
}
```

### 标签 API

```bash
# 获取标签列表
GET /api/tags
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 创建标签
POST /api/tags
Authorization: Bearer <token> 或 X-API-Key: <api_key>
Content-Type: application/json

{
  "name": "tag1",
  "color": "#3b82f6"
}

# 更新标签
PATCH /api/tags/:id
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 删除标签
DELETE /api/tags/:id
Authorization: Bearer <token> 或 X-API-Key: <api_key>
```

### 标签页组 API

```bash
# 获取标签页组列表
GET /api/tab-groups?folder_id=xxx&include_deleted=false
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 创建标签页组
POST /api/tab-groups
Authorization: Bearer <token> 或 X-API-Key: <api_key>
Content-Type: application/json

{
  "title": "My Tabs",
  "folder_id": null,  // 可选，文件夹 ID
  "items": [
    {
      "title": "Example",
      "url": "https://example.com",
      "favicon": "https://..."
    }
  ]
}

# 恢复标签页组
POST /api/tab-groups/:id/restore
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 删除标签页组（移到回收站）
DELETE /api/tab-groups/:id
Authorization: Bearer <token> 或 X-API-Key: <api_key>

# 永久删除标签页组
DELETE /api/tab-groups/:id?permanent=true
Authorization: Bearer <token> 或 X-API-Key: <api_key>
```

### 公开分享 API

```bash
# 获取公开分享页面
GET /api/share/:slug

# 响应
{
  "user": {
    "username": "user",
    "public_page_title": "My Bookmarks",
    "public_page_description": "My public bookmarks"
  },
  "bookmarks": [...]
}

# 更新分享设置
PATCH /api/v1/settings/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "public_share_enabled": true,
  "public_slug": "myslug",
  "public_page_title": "My Bookmarks",
  "public_page_description": "Description"
}
```

### 统计 API

```bash
# 获取统计数据
GET /api/statistics?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>

# 响应
{
  "statistics": [
    {
      "stat_date": "2024-01-01",
      "bookmarks_created": 5,
      "bookmarks_deleted": 1,
      "tab_groups_created": 2,
      "tab_groups_deleted": 0
    }
  ]
}
```

### 速率限制

API 使用 Cloudflare KV 实现速率限制：

- **未认证请求**: 100 次/小时
- **已认证请求**: 1000 次/小时
- **API Key 请求**: 根据权限配置

响应头包含速率限制信息：
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### 错误响应

所有错误响应遵循统一格式：

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}  // 可选，额外信息
}
```

常见错误码：
- `400` - 请求参数错误
- `401` - 未认证或认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器内部错误

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告 Bug、提出新功能建议、改进文档还是提交代码。

### 如何贡献

1. **Fork 项目**
   - 点击右上角的 Fork 按钮
   - 克隆你的 Fork：`git clone https://github.com/your-username/tmakrs.git`

2. **创建特性分支**
   ```bash
   git checkout -b feature/AmazingFeature
   # 或
   git checkout -b fix/BugFix
   ```

3. **进行开发**
   - 遵循项目的代码规范
   - 编写清晰的代码和注释
   - 确保代码通过所有检查

4. **提交更改**
   ```bash
   git add .
   git commit -m 'feat: Add some AmazingFeature'
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` 修复 Bug
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 代码重构
   - `perf:` 性能优化
   - `test:` 测试相关
   - `chore:` 构建/工具相关

5. **推送到分支**
   ```bash
   git push origin feature/AmazingFeature
   ```

6. **开启 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写 PR 模板，描述你的更改
   - 等待代码审查

### 代码规范

#### TypeScript
- 使用 TypeScript strict mode
- 为所有函数和变量添加类型注解
- 避免使用 `any` 类型
- 使用接口（interface）定义对象类型

#### 代码风格
- 遵循 ESLint 和 Prettier 配置
- 使用 2 空格缩进
- 使用单引号（字符串）
- 函数和变量使用驼峰命名
- 组件使用 PascalCase 命名
- 文件名使用 kebab-case 或 PascalCase

#### 组件规范
- 每个组件文件不超过 400 行
- 组件功能单一，职责明确
- 使用函数组件和 Hooks
- 提取可复用的逻辑到自定义 Hooks
- 使用 Lucide Icons 图标库

#### 注释规范
- 为复杂逻辑添加注释
- 使用 JSDoc 注释函数
- 注释使用中文或英文（保持一致）

### 开发流程

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 构建
pnpm build
```

### 提交前检查清单

- [ ] 代码通过 `pnpm lint` 检查
- [ ] 代码通过 `pnpm type-check` 检查
- [ ] 代码已使用 `pnpm format` 格式化
- [ ] 测试了所有修改的功能
- [ ] 更新了相关文档（如果需要）
- [ ] 提交信息清晰明确

### 报告 Bug

如果你发现了 Bug，请：

1. 在 [Issues](https://github.com/ai-tmarks/tmakrs/issues) 中搜索是否已有相关问题
2. 如果没有，创建新的 Issue
3. 使用 Bug 报告模板
4. 提供详细的复现步骤
5. 附上截图或错误日志（如果有）

### 提出新功能

如果你有新功能建议，请：

1. 在 [Issues](https://github.com/ai-tmarks/tmakrs/issues) 中创建 Feature Request
2. 描述功能的使用场景和价值
3. 提供可能的实现方案（可选）
4. 等待社区讨论和反馈

### 改进文档

文档改进同样重要：

- 修正错别字和语法错误
- 补充缺失的文档
- 改进示例代码
- 翻译文档到其他语言

### 行为准则

- 尊重所有贡献者
- 保持友好和专业
- 接受建设性的批评

---

## 📝 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

感谢以下开源项目和服务：

### 核心技术

- [React](https://reactjs.org/) - 强大的 UI 框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Cloudflare](https://www.cloudflare.com/) - 全球边缘网络平台
  - [Cloudflare Pages](https://pages.cloudflare.com/) - 静态站点托管
  - [Cloudflare D1](https://developers.cloudflare.com/d1/) - 边缘 SQLite 数据库
  - [Cloudflare KV](https://developers.cloudflare.com/kv/) - 键值存储
  - [Cloudflare Workers](https://workers.cloudflare.com/) - 无服务器计算

### UI 和样式

- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide](https://lucide.dev/) - 精美的开源图标库
- [React Router](https://reactrouter.com/) - React 路由库

### 状态管理和数据

- [Zustand](https://zustand-demo.pmnd.rs/) - 轻量级状态管理
- [TanStack Query](https://tanstack.com/query) - 强大的数据获取和缓存
- [TanStack Virtual](https://tanstack.com/virtual) - 虚拟滚动
- [Dexie.js](https://dexie.org/) - IndexedDB 封装库

### 交互和工具

- [dnd-kit](https://dndkit.com/) - 现代化的拖拽库
- [date-fns](https://date-fns.org/) - 日期处理库
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS 防护

### AI 服务

- [OpenAI](https://openai.com/) - GPT 系列模型
- [Anthropic](https://www.anthropic.com/) - Claude 系列模型
- [DeepSeek](https://www.deepseek.com/) - DeepSeek 模型
- [智谱 AI](https://open.bigmodel.cn/) - GLM 系列模型
- [ModelScope](https://modelscope.cn/) - 阿里云模型平台
- [SiliconFlow](https://siliconflow.cn/) - 多模型聚合平台

### 开发工具

- [ESLint](https://eslint.org/) - 代码检查
- [Prettier](https://prettier.io/) - 代码格式化
- [Husky](https://typicode.github.io/husky/) - Git Hooks
- [lint-staged](https://github.com/okonet/lint-staged) - 暂存文件检查
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) - Chrome 扩展开发工具

### 特别感谢

- 所有为开源社区做出贡献的开发者
- 所有使用和反馈 TMarks 的用户
- 所有提交 Issue 和 PR 的贡献者

---

## 📧 联系方式

- **项目主页**: [GitHub Repository](https://github.com/ai-tmarks/tmakrs)
- **在线演示**: [https://tmarks.669696.xyz](https://tmarks.669696.xyz)
- **问题反馈**: [GitHub Issues](https://github.com/ai-tmarks/tmakrs/issues)
## ❓ 常见问题 (FAQ)

### 通用问题

**Q: TMarks 是免费的吗？**
A: 是的，TMarks 是完全开源免费的项目，采用 MIT 许可证。你可以自由使用、修改和分发。

**Q: 需要付费的 AI API 吗？**
A: AI 标签生成功能需要 AI API Key，但你可以选择免费或低成本的 AI 提供商（如 DeepSeek、智谱 AI 等）。也可以不使用 AI 功能，手动管理标签。

**Q: 数据存储在哪里？**
A: 数据存储在 Cloudflare D1 数据库中（你自己的 Cloudflare 账号），完全由你控制。浏览器扩展也会在本地 IndexedDB 中缓存数据。

**Q: 支持哪些浏览器？**
A: 浏览器扩展支持所有基于 Chromium 的浏览器（Chrome、Edge、Brave 等）和 Firefox。Web 应用支持所有现代浏览器。

### 部署问题

**Q: Cloudflare 免费套餐够用吗？**
A: 对于个人使用完全够用。Cloudflare 免费套餐提供：
- D1: 每天 100,000 次读取，50,000 次写入
- KV: 每天 100,000 次读取，1,000 次写入
- Pages: 无限请求

**Q: 可以部署到其他平台吗？**
A: 项目专为 Cloudflare 设计，但理论上可以适配到其他支持 Node.js 的平台（需要修改后端代码）。

**Q: 如何备份数据？**
A: 可以使用 `wrangler d1 export` 命令导出数据库，或在 Web 应用中使用导入/导出功能。

### 使用问题

**Q: 如何导入现有书签？**
A: 在 Web 应用的「设置」→「导入/导出」页面，可以导入浏览器书签（HTML 格式）或其他书签管理工具的数据。

**Q: 浏览器扩展和 Web 应用如何同步？**
A: 配置扩展的 API 地址和 API Key 后，扩展会自动与 Web 应用同步数据。

**Q: AI 标签生成不准确怎么办？**
A: 可以尝试：
1. 更换 AI 模型（如使用 GPT-4 而不是 GPT-3.5）
2. 手动编辑生成的标签
3. 为书签添加更详细的描述

**Q: 如何分享我的书签？**
A: 在「设置」→「分享设置」中启用公开分享，设置自定义 slug，然后将书签设置为公开即可。

### 开发问题

**Q: 如何参与开发？**
A: 请查看「贡献指南」部分，欢迎提交 Issue 和 Pull Request。

**Q: 如何添加新的 AI 提供商？**
A: 在 `tab/src/lib/providers/` 目录下创建新的提供商类，继承 `AIProvider` 基类，然后在 `index.ts` 中注册。

**Q: 如何自定义主题？**
A: 修改 `tmarks/src/styles/themes/` 目录下的 CSS 变量即可。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

```
MIT License

Copyright (c) 2024 TMarks Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by TMarks Team

[⬆ 回到顶部](#-tmarks)

</div>

