import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { mockupComponents, type MockupType } from "./MockupImages";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  mockupType: MockupType;
  colorClass: string;
  delay?: number;
}

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  mockupType,
  colorClass,
  delay = 0 
}: FeatureCardProps) => {
  const MockupComponent = mockupComponents[mockupType];
  
  return (
    <Card 
      className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up bg-card"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image area with mockup */}
      <div className={`relative h-48 ${colorClass} flex items-center justify-center overflow-hidden p-4`}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5" />
        <div className="relative z-10 w-full h-full">
          <MockupComponent />
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 rounded-full" />
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
