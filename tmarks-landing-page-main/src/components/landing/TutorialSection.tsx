import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, BookOpen, MessageCircle, ArrowRight } from "lucide-react";

const tutorials = [
  {
    icon: PlayCircle,
    title: "视频教程",
    description: "5 分钟快速上手，从安装到使用全流程演示",
    link: "#",
    colorClass: "bg-gradient-to-br from-red-500 to-orange-500",
  },
  {
    icon: BookOpen,
    title: "部署文档",
    description: "详细的自部署指南，支持 Docker、Cloudflare 等多种方式",
    link: "https://github.com/ai-tmarks/tmarks#readme",
    colorClass: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "问题反馈",
    description: "遇到问题？在 GitHub Issues 提交，我们会尽快响应",
    link: "https://github.com/ai-tmarks/tmarks/issues",
    colorClass: "bg-gradient-to-br from-green-500 to-emerald-500",
  },
];

const TutorialSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            快速上手
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            丰富的教程资源，助你轻松掌握 TMarks
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tutorials.map((tutorial, index) => (
            <Card 
              key={tutorial.title}
              className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in bg-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-xl ${tutorial.colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tutorial.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-card-foreground group-hover:text-primary transition-colors">
                  {tutorial.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {tutorial.description}
                </p>
                
                <div className="flex items-center text-primary text-sm font-medium">
                  查看详情
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TutorialSection;
