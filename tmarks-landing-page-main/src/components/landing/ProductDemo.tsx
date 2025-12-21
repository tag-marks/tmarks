import { Play, Bookmark, Tag, Folder, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductDemo = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Browser mockup */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.6s" }}>
            {/* Browser frame */}
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warm-yellow/60" />
                  <div className="w-3 h-3 rounded-full bg-soft-green/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-lg px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-xs">🔒</span>
                    <span>tmarks.app/bookmarks</span>
                  </div>
                </div>
              </div>
              
              {/* Demo content area - placeholder for video/screenshot */}
              <div className="relative aspect-video bg-gradient-to-br from-muted/30 to-secondary/50 flex items-center justify-center group cursor-pointer">
                {/* Animated demo mockup */}
                <div className="absolute inset-0 p-6 flex">
                  {/* Sidebar */}
                  <div className="w-48 bg-card/80 rounded-xl p-4 mr-4 space-y-3 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Bookmark className="w-4 h-4" />
                      <span className="text-sm">我的书签</span>
                    </div>
                    <div className="space-y-2 pl-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs py-1 px-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                        <Folder className="w-3 h-3" />
                        <span>开发工具</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs py-1 px-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                        <Folder className="w-3 h-3" />
                        <span>设计资源</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs py-1 px-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                        <Folder className="w-3 h-3" />
                        <span>学习笔记</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Tag className="w-3 h-3" />
                        <span>标签</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">React</span>
                        <span className="px-2 py-0.5 bg-soft-blue/20 text-soft-blue text-xs rounded-full">AI</span>
                        <span className="px-2 py-0.5 bg-soft-green/20 text-soft-green text-xs rounded-full">设计</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main content */}
                  <div className="flex-1 space-y-3 animate-fade-in" style={{ animationDelay: "1s" }}>
                    {/* Bookmark cards */}
                    {[
                      { title: "GitHub - 代码托管平台", tag: "开发", color: "primary" },
                      { title: "Figma - 协作设计工具", tag: "设计", color: "soft-purple" },
                      { title: "MDN Web Docs", tag: "学习", color: "soft-blue" },
                    ].map((item, i) => (
                      <div 
                        key={item.title}
                        className="bg-card/80 rounded-xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow animate-fade-in"
                        style={{ animationDelay: `${1.2 + i * 0.1}s` }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Camera className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">{item.title}</div>
                          <div className="text-xs text-muted-foreground">收藏于 2 天前</div>
                        </div>
                        <span className={`px-2 py-0.5 bg-${item.color}/10 text-${item.color} text-xs rounded-full`}>
                          {item.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/5 transition-colors">
                  <Button
                    size="lg"
                    className="gradient-warm text-primary-foreground rounded-full w-16 h-16 shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </Button>
                </div>
                
                {/* Hover hint */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-lg text-xs text-muted-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  点击播放演示
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-warm-yellow/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDemo;
