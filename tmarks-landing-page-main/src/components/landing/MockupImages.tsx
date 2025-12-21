/**
 * TMarks 功能模拟图组件
 * 
 * 这些组件用于在落地页展示 TMarks 的功能预览
 * 后续可以替换为真实的截图图片
 * 
 * 使用方式：
 * - 直接使用组件: <NewTabMockup />
 * - 或替换为图片: <img src="/images/newtab.png" alt="NewTab" />
 */

import { Search, Tag, Folder, Camera, Sparkles, Cloud, Server, Bookmark, Chrome } from "lucide-react";

// Favicon 辅助组件
const Favicon = ({ url, alt, className = "" }: { url: string; alt: string; className?: string }) => (
  <img 
    src={`https://www.google.com/s2/favicons?domain=${url}&sz=64`} 
    alt={alt}
    className={`w-full h-full object-contain ${className}`}
    loading="lazy"
  />
);

// ============================================
// NewTab 新标签页模拟 - 基于真实 TMarks NewTab 界面
// ============================================
export const NewTabMockup = () => (
  <div className="w-full h-full bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600 p-3 rounded-xl overflow-hidden relative shadow-inner">
    {/* 背景装饰 */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.1),transparent_50%)]" />
    
    {/* 顶部搜索栏 */}
    <div className="relative bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 mb-3 flex items-center gap-2 border border-white/10 shadow-lg">
      <Search className="w-3.5 h-3.5 text-white/70" />
      <span className="text-[10px] text-white/60">搜索书签或网页...</span>
      <div className="ml-auto flex gap-1">
        <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px]">⌘</div>
        <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px]">K</div>
      </div>
    </div>
    
    {/* 快捷方式网格 - 真实网站 favicon */}
    <div className="relative grid grid-cols-4 gap-2.5">
      {[
        { name: 'ChatGPT', url: 'chat.openai.com', color: 'from-emerald-400 to-teal-600' },
        { name: 'GitHub', url: 'github.com', color: 'from-gray-700 to-gray-900' },
        { name: 'DeepSeek', url: 'chat.deepseek.com', color: 'from-blue-500 to-indigo-600' },
        { name: 'Claude', url: 'claude.ai', color: 'from-orange-400 to-amber-500' },
        { name: 'Figma', url: 'figma.com', color: 'from-purple-500 to-pink-500' },
        { name: 'Notion', url: 'notion.so', color: 'from-gray-800 to-black' },
        { name: 'V2EX', url: 'v2ex.com', color: 'from-slate-600 to-slate-800' },
        { name: 'Vercel', url: 'vercel.com', color: 'from-gray-900 to-black' },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
          <div className={`w-9 h-9 rounded-xl bg-white shadow-lg flex items-center justify-center p-1.5 border border-white/20 group-hover:scale-110 group-hover:shadow-xl transition-all duration-200`}>
            <Favicon url={item.url} alt={item.name} />
          </div>
          <span className="text-[7px] text-white/90 truncate w-full text-center font-medium">{item.name}</span>
        </div>
      ))}
    </div>
    
    {/* 底部 Dock 栏 */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-xl rounded-2xl px-3 py-2 flex gap-2.5 border border-white/20 shadow-xl">
      {[
        { name: 'Gmail', url: 'gmail.com' },
        { name: 'Calendar', url: 'calendar.google.com' },
        { name: 'Spotify', url: 'spotify.com' },
        { name: 'YouTube', url: 'youtube.com' },
        { name: 'Twitter', url: 'twitter.com' },
      ].map((item, i) => (
        <div key={i} className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center p-1 hover:scale-110 transition-all cursor-pointer shadow-sm" title={item.name}>
          <Favicon url={item.url} alt={item.name} />
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// 标签页收纳模拟 - Tab Collection 功能
// ============================================
export const TabsMockup = () => (
  <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-800 p-3 rounded-xl relative overflow-hidden">
    {/* 浏览器窗口顶部 */}
    <div className="flex items-center gap-1.5 mb-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500/80" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
        <div className="w-2 h-2 rounded-full bg-green-500/80" />
      </div>
      <div className="flex-1 bg-slate-600/50 rounded h-3 ml-2" />
    </div>
    
    {/* 浏览器标签栏 - 真实网站 favicon */}
    <div className="flex gap-0.5 mb-3 overflow-hidden">
      {[
        { name: 'React', url: 'react.dev', active: true },
        { name: 'GitHub', url: 'github.com' },
        { name: 'Stack...', url: 'stackoverflow.com' },
        { name: 'MDN', url: 'developer.mozilla.org' },
        { name: '+3', isMore: true },
      ].map((tab, i) => (
        <div key={i} className={`flex items-center gap-1 ${tab.active ? 'bg-slate-600' : 'bg-slate-700/50'} rounded-t px-1.5 py-1 min-w-0 ${tab.isMore ? 'text-white/50' : ''}`}>
          {tab.url ? (
            <div className="w-3 h-3 flex-shrink-0">
              <Favicon url={tab.url} alt={tab.name} />
            </div>
          ) : (
            <div className="w-3 h-3 rounded-sm bg-slate-500 flex-shrink-0 flex items-center justify-center text-[6px] text-white/70">+3</div>
          )}
          <span className="text-[6px] text-white/70 truncate">{tab.isMore ? '' : tab.name}</span>
        </div>
      ))}
    </div>
    
    {/* 收纳弹窗 - 悬浮卡片效果 */}
    <div className="bg-slate-800/95 backdrop-blur-xl rounded-xl p-3 border border-slate-600/50 shadow-2xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
            <Folder className="w-3 h-3 text-white" />
          </div>
          <span className="text-[9px] text-white font-semibold">收纳 8 个标签页</span>
        </div>
        <div className="flex items-center gap-1 text-[7px] text-emerald-400">
          <Sparkles className="w-2.5 h-2.5" />
          AI 分组
        </div>
      </div>
      
      <div className="space-y-1.5">
        {[
          { name: 'React 开发', count: 3, color: 'from-cyan-500 to-blue-500', favicons: ['react.dev', 'developer.mozilla.org', 'tailwindcss.com'] },
          { name: '代码协作', count: 3, color: 'from-orange-500 to-amber-500', favicons: ['github.com', 'stackoverflow.com', 'gitlab.com'] },
          { name: '文档资料', count: 2, color: 'from-purple-500 to-pink-500', favicons: ['notion.so', 'confluence.atlassian.com'] },
        ].map((group, i) => (
          <div key={i} className="bg-slate-700/50 rounded-lg px-2.5 py-2 hover:bg-slate-700/70 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded bg-gradient-to-br ${group.color}`} />
              <span className="text-[8px] text-white/90 flex-1 font-medium">{group.name}</span>
              <span className="text-[7px] text-white/50 bg-slate-600/50 px-1.5 py-0.5 rounded">{group.count}</span>
            </div>
            <div className="flex gap-1 mt-1.5 pl-4">
              {group.favicons.map((url, j) => (
                <div key={j} className="w-3 h-3 rounded bg-white/10 p-0.5">
                  <Favicon url={url} alt={url} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[8px] py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
        一键收纳到 TMarks
      </button>
    </div>
  </div>
);

// ============================================
// Tag 书签管理模拟 - 基于真实 TMarks 界面截图
// ============================================
export const TagsMockup = () => (
  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
    <div className="flex h-full">
      {/* 左侧标签栏 - 基于截图真实数据 */}
      <div className="w-[38%] bg-gray-50/80 dark:bg-slate-800/80 p-2.5 border-r border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
            <Tag className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[8px] font-bold text-gray-700 dark:text-gray-300">标签</span>
          <span className="text-[6px] text-gray-400 ml-auto">64</span>
        </div>
        <div className="space-y-0.5">
          {[
            { name: 'AI', count: 23, active: true, color: 'bg-emerald-500' },
            { name: 'GitHub', count: 20, color: 'bg-gray-600' },
            { name: 'Cloudflare', count: 5, color: 'bg-orange-500' },
            { name: 'API', count: 6, color: 'bg-blue-500' },
            { name: '前端', count: 7, color: 'bg-purple-500' },
          ].map((tag, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[7px] cursor-pointer transition-all ${
                tag.active 
                  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${tag.color}`} />
                <span className="font-medium">{tag.name}</span>
              </span>
              <span className="text-gray-400 bg-gray-200/50 dark:bg-slate-600/50 px-1 rounded text-[6px]">{tag.count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 右侧书签列表 - 真实网站卡片 */}
      <div className="flex-1 p-2 space-y-1.5 overflow-hidden bg-gradient-to-b from-white to-gray-50/50 dark:from-slate-900 dark:to-slate-800/50">
        {[
          { name: 'ChatGPT', url: 'chat.openai.com', desc: 'ChatGPT 是一款 AI 智能聊天机器人...', tags: ['AI', 'Chatgpt'] },
          { name: 'DeepSeek', url: 'chat.deepseek.com', desc: 'Chat with DeepSeek AI...', tags: ['AI'] },
          { name: 'LINUX DO', url: 'linux.do', desc: '新的国货社区', tags: ['linux'] },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-2 flex gap-2 hover:shadow-lg transition-all cursor-pointer border border-gray-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform p-1.5 border border-gray-100 dark:border-slate-600">
              <Favicon url={item.url} alt={item.name} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</div>
              <div className="text-[6px] text-gray-400 truncate mb-1">{item.desc}</div>
              <div className="flex gap-0.5 flex-wrap">
                {item.tags.map((tag, j) => (
                  <span key={j} className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[5px] px-1.5 py-0.5 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </div>
            <Bookmark className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-orange-400 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// 网页快照模拟 - Snapshot 功能
// ============================================
export const SnapshotMockup = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-2 rounded-xl shadow-lg overflow-hidden">
    <div className="relative h-full rounded-xl overflow-hidden border border-white/50 dark:border-slate-700/50 shadow-inner">
      {/* 模拟真实网页预览 - React 文档 */}
      <div className="absolute inset-0 bg-white dark:bg-slate-900">
        {/* 浏览器地址栏 */}
        <div className="bg-gray-100 dark:bg-slate-800 px-2 py-1.5 flex items-center gap-1.5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white dark:bg-slate-700 rounded px-2 py-0.5 text-[5px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>🔒</span>
            <span>react.dev/learn/hooks</span>
          </div>
        </div>
        
        {/* 网页内容 */}
        <div className="p-2">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm p-0.5">
              <Favicon url="react.dev" alt="React" />
            </div>
            <span className="text-[8px] font-bold text-gray-800 dark:text-gray-200">React 文档</span>
          </div>
          <div className="text-[7px] font-semibold text-gray-700 dark:text-gray-300 mb-1">使用 Hooks</div>
          <div className="bg-slate-900 rounded-lg p-1.5 text-[5px] font-mono text-green-400 shadow-inner mb-2">
            <span className="text-purple-400">const</span> [count, setCount] = <span className="text-yellow-400">useState</span>(0);
          </div>
          <div className="space-y-1">
            <div className="bg-gray-100 dark:bg-slate-800 rounded h-2 w-full" />
            <div className="bg-gray-100 dark:bg-slate-800 rounded h-2 w-4/5" />
          </div>
        </div>
      </div>
      
      {/* 快照覆盖层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />
      
      {/* 快照状态徽章 */}
      <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[6px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg font-medium">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        已保存
      </div>
      
      {/* 快照按钮 */}
      <div className="absolute bottom-2 right-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-2 shadow-xl hover:scale-110 transition-transform cursor-pointer group">
        <Camera className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
      </div>
      
      {/* 时间戳 */}
      <div className="absolute bottom-2 left-2 text-[6px] text-gray-600 dark:text-gray-400 bg-white/90 dark:bg-slate-800/90 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
        📅 2024-01-15 14:32
      </div>
    </div>
  </div>
);

// ============================================
// AI 智能标签模拟 - AI Auto-tagging 功能
// ============================================
export const AIMockup = () => (
  <div className="w-full h-full bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-rose-950/30 dark:via-orange-950/30 dark:to-amber-950/30 p-3 rounded-xl relative overflow-hidden">
    {/* 背景装饰 */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.15),transparent_50%)]" />
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-400/20 to-rose-500/20 rounded-full blur-2xl" />
    
    {/* AI 分析头部 */}
    <div className="relative flex items-center gap-2 mb-2.5">
      <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
      </div>
      <div>
        <span className="text-[9px] font-bold text-gray-800 dark:text-gray-200 block">AI 智能分析</span>
        <span className="text-[6px] text-gray-400">正在识别内容...</span>
      </div>
    </div>
    
    {/* 正在分析的网页 */}
    <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-2.5 mb-2.5 border border-white/50 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md p-1">
          <Favicon url="chat.openai.com" alt="ChatGPT" />
        </div>
        <div className="flex-1">
          <span className="text-[8px] font-bold text-gray-800 dark:text-gray-200 block">ChatGPT</span>
          <span className="text-[6px] text-gray-400">chat.openai.com</span>
        </div>
        <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
      </div>
    </div>
    
    {/* 分析结果 */}
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-2.5 mb-2 border border-orange-200/50 dark:border-orange-800/30 shadow-sm">
      <div className="text-[7px] text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5 text-orange-500" />
        AI 推荐标签
      </div>
      <div className="flex flex-wrap gap-1">
        {[
          { tag: 'AI', color: 'from-emerald-400 to-teal-500' },
          { tag: 'ChatGPT', color: 'from-green-400 to-emerald-500' },
          { tag: 'OpenAI', color: 'from-gray-500 to-gray-700' },
          { tag: '对话', color: 'from-blue-400 to-indigo-500' },
          { tag: '工具', color: 'from-purple-400 to-pink-500' },
        ].map((item, i) => (
          <span 
            key={i} 
            className={`bg-gradient-to-r ${item.color} text-white text-[6px] px-2 py-0.5 rounded-full font-medium shadow-sm`}
          >
            {item.tag}
          </span>
        ))}
      </div>
    </div>
    
    {/* 置信度 */}
    <div className="relative flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5">
      <span className="text-[7px] text-gray-600 dark:text-gray-400 font-medium">置信度</span>
      <div className="flex-1 bg-orange-200/50 dark:bg-orange-800/30 rounded-full h-2 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-400 to-rose-500 h-full rounded-full w-[95%] shadow-sm" />
      </div>
      <span className="text-[8px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">95%</span>
    </div>
  </div>
);

// ============================================
// Cloudflare 部署模拟 - Self-hosting 功能
// ============================================
export const DeployMockup = () => (
  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-xl font-mono relative overflow-hidden">
    {/* 背景装饰 */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl" />
    
    {/* 头部 */}
    <div className="relative flex items-center gap-2 mb-2.5">
      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-lg p-0.5">
        <Favicon url="cloudflare.com" alt="Cloudflare" />
      </div>
      <div>
        <span className="text-[9px] text-orange-400 font-bold block">Cloudflare Pages</span>
        <span className="text-[6px] text-gray-500">Production Deploy</span>
      </div>
      <div className="flex-1" />
      <div className="flex gap-1 bg-slate-700/50 px-2 py-1 rounded-full">
        {[1,2,3].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
        ))}
      </div>
    </div>
    
    {/* 部署日志 - 终端风格 */}
    <div className="relative space-y-0.5 text-[6px] mb-2.5 bg-black/40 rounded-lg p-2 border border-slate-700/50">
      <div className="text-gray-500 flex items-center gap-1">
        <span className="text-green-400">$</span>
        <span className="text-white">pnpm run build</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-400">
        <span className="text-green-400 font-bold">✓</span>
        <span>vite v5.0.12 building for production...</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-400">
        <span className="text-green-400 font-bold">✓</span>
        <span>dist/assets/index-<span className="text-cyan-400">a1b2c3</span>.js <span className="text-yellow-400">142kb</span></span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-400">
        <span className="text-green-400 font-bold">✓</span>
        <span>✨ built in <span className="text-green-400 font-bold">2.3s</span></span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-700/50">
        <span className="text-cyan-400">➜</span>
        <span className="text-cyan-400">Deploying to <span className="text-white">production</span>...</span>
      </div>
    </div>
    
    {/* 部署成功 */}
    <div className="relative bg-green-500/10 border border-green-500/30 rounded-xl p-2.5 mb-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">✓</span>
        </div>
        <div>
          <div className="text-[8px] text-green-400 font-bold">部署成功!</div>
          <div className="text-[6px] text-blue-400 hover:underline cursor-pointer">https://tmarks.pages.dev ↗</div>
        </div>
      </div>
    </div>
    
    {/* 底部状态 */}
    <div className="relative flex items-center gap-2 pt-2 border-t border-slate-700/50">
      <Server className="w-3 h-3 text-gray-500" />
      <span className="text-[6px] text-gray-500">全球 CDN · 300+ 边缘节点</span>
      <div className="flex-1" />
      <span className="text-[6px] text-green-400 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        在线
      </span>
    </div>
  </div>
);

// ============================================
// 浏览器扩展弹窗模拟 - Extension Popup
// ============================================
export const ExtensionPopupMockup = () => (
  <div className="w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border border-gray-100 dark:border-slate-700">
    {/* 头部 */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg">
          <Bookmark className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="font-bold text-gray-800 dark:text-gray-200 block text-sm">TMarks</span>
          <span className="text-[9px] text-gray-400">书签管理</span>
        </div>
      </div>
      <div className="text-[10px] text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        已连接
      </div>
    </div>
    
    {/* 当前页面信息 */}
    <div className="space-y-3 mb-4">
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600">
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">当前页面</div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm p-0.5 flex-shrink-0">
            <Favicon url="react.dev" alt="React" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">React Hooks 完全指南</div>
            <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              <span>🔒</span>
              react.dev/learn/hooks
            </div>
          </div>
        </div>
      </div>
      
      {/* AI 生成的标签 */}
      <div>
        <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5 font-medium">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          AI 智能推荐标签
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { tag: 'React', color: 'from-cyan-400 to-blue-500' },
            { tag: 'Hooks', color: 'from-purple-400 to-pink-500' },
            { tag: '前端', color: 'from-green-400 to-emerald-500' },
            { tag: '教程', color: 'from-orange-400 to-amber-500' },
            { tag: '官方', color: 'from-gray-500 to-gray-700' },
          ].map((item, i) => (
            <span key={i} className={`bg-gradient-to-r ${item.color} text-white text-[10px] px-2.5 py-1 rounded-full cursor-pointer hover:scale-105 transition-transform shadow-sm font-medium`}>
              {item.tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 保存位置 */}
      <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 dark:bg-slate-700/30 px-3 py-2 rounded-lg">
        <Folder className="w-3.5 h-3.5 text-yellow-500" />
        <span>保存至: 前端开发</span>
      </div>
    </div>
    
    {/* 保存按钮 */}
    <button className="w-full bg-gradient-to-r from-orange-400 to-rose-500 text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
      <Bookmark className="w-4 h-4" />
      保存书签
    </button>
  </div>
);

// ============================================
// 导出映射表 - 方便按类型获取
// ============================================
export const mockupComponents = {
  newtab: NewTabMockup,
  tabs: TabsMockup,
  tags: TagsMockup,
  snapshot: SnapshotMockup,
  ai: AIMockup,
  deploy: DeployMockup,
  extension: ExtensionPopupMockup,
} as const;

export type MockupType = keyof typeof mockupComponents;
