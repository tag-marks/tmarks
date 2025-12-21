import HeroSection from "@/components/landing/HeroSection";
import ProductDemo from "@/components/landing/ProductDemo";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ExtensionDemo from "@/components/landing/ExtensionDemo";
import TutorialSection from "@/components/landing/TutorialSection";
import TechStack from "@/components/landing/TechStack";
import Footer from "@/components/landing/Footer";
import ThemeToggle from "@/components/landing/ThemeToggle";

const Index = () => {
  return (
    <main className="min-h-screen">
      <ThemeToggle />
      <HeroSection />
      <ProductDemo />
      <FeaturesSection />
      <ExtensionDemo />
      <TutorialSection />
      <TechStack />
      <Footer />
    </main>
  );
};

export default Index;
