import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.png";
import type { Salon } from "@/hooks/useSalon";

interface HeroProps {
  salon: Salon | undefined;
}

export default function Hero({ salon }: HeroProps) {
  const { ref, isVisible } = useScrollAnimation();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={salon?.hero_image_url || heroBg}
          alt="Background"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div
        ref={ref}
        className={`relative z-10 container text-center px-4 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-foreground">Sua beleza merece</span>
          <br />
          <span className="text-gradient-gold">excelência</span>
        </h1>
        <p className="font-body text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Transforme seu visual com os melhores profissionais. Agende agora e viva uma experiência premium.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => scrollTo("#booking")}
            className="bg-primary text-primary-foreground hover:bg-primary/80 font-body text-base px-8 py-6 shadow-gold"
          >
            Agendar Horário
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollTo("#services")}
            className="border-primary/30 text-foreground hover:bg-primary/10 font-body text-base px-8 py-6"
          >
            Ver Serviços
          </Button>
        </div>
      </div>
    </section>
  );
}
