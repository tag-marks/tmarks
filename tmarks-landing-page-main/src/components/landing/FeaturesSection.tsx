import { Brain, FolderKanban, Globe, Puzzle, Camera, Cloud, LayoutGrid, Tag } from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: LayoutGrid,
    title: "NewTab 新标签页",
    description: "自定义新标签页，快速访问常用书签，美观高效的启动界面",
    mockupType: "newtab" as const,
    colorClass: "bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",
  },
  {
    icon: FolderKanban,
    title: "收纳标签栏",
    description: "一键收纳浏览器标签页，智能分组归档，释放浏览器内存",
    mockupType: "tabs" as const,
    colorClass: "bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20",
  },
  {
    icon: Tag,
    title: "Tag 书签管理",
    description: "基于标签的书签管理，AI 智能分类，多维度组织你的收藏",
    mockupType: "tags" as const,
    colorClass: "bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20",
  },
  {
    icon: Camera,
    title: "网页快照",
    description: "自动保存网页快照，即使原网页失效也能查看历史内容",
    mockupType: "snapshot" as const,
    colorClass: "bg-gradient-to-br from-purple-100 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20",
  },
  {
    icon: Brain,
    title: "AI 智能标签",
    description: "自动分析网页内容，智能生成分类标签，让书签井井有条",
    mockupType: "ai" as const,
    colorClass: "bg-gradient-to-br from-rose-100 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",
  },
  {
    icon: Cloud,
    title: "Cloudflare 部署",
    description: "一键部署到 Cloudflare，全球 CDN 加速，快速稳定可靠",
    mockupType: "deploy" as const,
    colorClass: "bg-gradient-to-br from-sky-100 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/20",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            核心功能
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            强大而简洁的功能设计，让书签管理变得轻松愉快
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              mockupType={feature.mockupType}
              colorClass={feature.colorClass}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
