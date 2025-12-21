import { Button } from "@/components/ui/button";
import { Chrome, Download, Zap, Clock, Wifi } from "lucide-react";
import { ExtensionPopupMockup } from "./MockupImages";

const ExtensionDemo = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
                <Chrome className="w-4 h-4" />
                浏览器扩展
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                一键收藏，随时随地
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                安装浏览器扩展后，只需轻轻一点，即可将当前页面保存到 TMarks。
                支持离线缓存，即使断网也能查看你的书签。
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-accent">
                    <Zap className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">一键保存</h4>
                    <p className="text-muted-foreground text-sm">快捷键或点击图标，瞬间收藏</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-accent">
                    <Clock className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">稍后阅读</h4>
                    <p className="text-muted-foreground text-sm">标记稍后阅读，不错过精彩内容</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-accent">
                    <Wifi className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">离线支持</h4>
                    <p className="text-muted-foreground text-sm">本地缓存，断网也能访问</p>
                  </div>
                </div>
              </div>
              
              <Button size="lg" className="gradient-warm text-primary-foreground rounded-xl">
                <Download className="w-5 h-5 mr-2" />
                下载扩展
              </Button>
            </div>
            
            {/* Right - Extension mockup */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl overflow-hidden p-4">
                  {/* Browser chrome mockup */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 bg-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <span className="text-xs text-slate-400">🔒</span>
                      <span className="text-sm text-slate-300">example.com/article</span>
                    </div>
                    {/* Extension icon */}
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <Chrome className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                    </div>
                  </div>
                  
                  {/* Extension popup mockup - 从 MockupImages 导入 */}
                  <div className="absolute top-16 right-4 animate-fade-in">
                    <ExtensionPopupMockup />
                  </div>
                  
                  {/* Page content mockup */}
                  <div className="bg-white/10 rounded-lg p-4 mt-8">
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-full mb-1" />
                    <div className="h-3 bg-white/10 rounded w-5/6 mb-1" />
                    <div className="h-3 bg-white/10 rounded w-4/5" />
                  </div>
                </div>
                
                {/* Floating decorations */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-warm-yellow/30 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExtensionDemo;
