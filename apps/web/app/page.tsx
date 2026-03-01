import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoStrip } from "@/components/landing/logo-strip";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <LogoStrip />
        <FeaturesSection />
        <HowItWorks />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
