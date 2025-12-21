import { Bookmark, Github, FileText, MessageSquare, Lightbulb } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const links = [
    { icon: Github, label: "GitHub 源码", href: "https://github.com/ai-tmarks/tmarks" },
    { icon: FileText, label: "部署文档", href: "https://github.com/ai-tmarks/tmarks#readme" },
    { icon: MessageSquare, label: "问题反馈", href: "https://github.com/ai-tmarks/tmarks/issues" },
    { icon: Lightbulb, label: "功能建议", href: "https://github.com/ai-tmarks/tmarks/issues" },
  ];
  
  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo and description */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl gradient-warm">
                <Bookmark className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">TMarks</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              AI 驱动的智能书签管理系统，让你的网络收藏井井有条
            </p>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <link.icon className="w-4 h-4" />
                <span className="text-sm">{link.label}</span>
              </a>
            ))}
          </div>
          
          {/* Divider */}
          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © {currentYear} TMarks. 开源项目，基于 MIT 许可证发布。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
