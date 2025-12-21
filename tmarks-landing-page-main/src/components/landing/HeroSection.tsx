import { Button } from "@/components/ui/button";
import { Bookmark, Github, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-warm-subtle" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-warm-yellow/20 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">开源 · 智能 · 高效</span>
          </div>
          
          {/* Logo & Title */}
          <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="p-3 rounded-2xl gradient-warm shadow-lg">
              <Bookmark className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-gradient-warm">TMarks</span>
            </h1>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            AI 驱动的智能书签管理系统
          </p>
          
          {/* Value proposition */}
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            告别杂乱无章的书签，让 AI 自动整理、智能分类，一键收藏精彩内容
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" className="gradient-warm text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
              开始使用
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-6 text-lg rounded-xl border-2 hover:bg-secondary transition-all"
              asChild
            >
              <a href="https://github.com/ai-tmarks/tmarks" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5 mr-2" />
                GitHub 源码
              </a>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">开源免费</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">AI</div>
              <div className="text-sm text-muted-foreground">智能标签</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">∞</div>
              <div className="text-sm text-muted-foreground">无限书签</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
