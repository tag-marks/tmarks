import { Github, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const GITHUB_REPO = "ai-tmarks/tmarks";

const techStack = [
  { name: "React", color: "bg-blue-100 text-blue-600" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-700" },
  { name: "Cloudflare", color: "bg-orange-100 text-orange-600" },
  { name: "Hono", color: "bg-red-100 text-red-600" },
  { name: "D1 Database", color: "bg-yellow-100 text-yellow-700" },
  { name: "R2 Storage", color: "bg-purple-100 text-purple-600" },
];

const TechStack = () => {
  const [stars, setStars] = useState<number | null>(null);
  const [contributors, setContributors] = useState<number | null>(null);

  useEffect(() => {
    // Fetch repo stats
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then(res => res.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});

    // Fetch contributors count
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/contributors?per_page=1`)
      .then(res => {
        const link = res.headers.get('Link');
        if (link) {
          const match = link.match(/page=(\d+)>; rel="last"/);
          if (match) {
            setContributors(parseInt(match[1], 10));
            return;
          }
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setContributors(data.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            开源技术栈
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            基于现代化技术构建，完全开源，欢迎贡献
          </p>
          
          {/* Tech stack badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {techStack.map((tech) => (
              <span
                key={tech.name}
                className={`px-4 py-2 rounded-full text-sm font-medium ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
          </div>
          
          {/* GitHub stats */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Github className="w-10 h-10 text-foreground" />
              <span className="text-2xl font-bold text-foreground">TMarks</span>
            </div>
            
            <div className="flex justify-center gap-8 mb-8">
              <a 
                href={`https://github.com/${GITHUB_REPO}/stargazers`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-semibold text-foreground">
                  {stars !== null ? stars : '--'}
                </span>
                <span className="text-muted-foreground">Stars</span>
              </a>
              <a 
                href={`https://github.com/${GITHUB_REPO}/graphs/contributors`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-semibold text-foreground">
                  {contributors !== null ? contributors : '--'}
                </span>
                <span className="text-muted-foreground">Contributors</span>
              </a>
            </div>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-xl border-2"
              asChild
            >
              <a href="https://github.com/ai-tmarks/tmarks" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5 mr-2" />
                在 GitHub 上查看
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
