import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import aboutBg from "@/assets/about-bg.png";
import type { Salon } from "@/hooks/useSalon";

interface AboutProps {
  salon: Salon | undefined;
}

export default function About({ salon }: AboutProps) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" className="py-24 bg-background">
      <div className="container px-4">
        <div
          ref={ref}
          className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-border">
              <img
                src={aboutBg}
                alt="Sobre nós"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-primary/30 rounded-2xl" />
          </div>

          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Sobre <span className="text-gradient-gold">Nós</span>
            </h2>
            <div className="font-body text-muted-foreground space-y-4 leading-relaxed">
              {salon?.about_text ? (
                <p>{salon.about_text}</p>
              ) : (
                <>
                  <p>
                    Somos mais do que um salão — somos um espaço de transformação e bem-estar.
                    Com profissionais altamente qualificados e apaixonados pelo que fazem.
                  </p>
                  <p>
                    Nossa missão é proporcionar uma experiência única, combinando técnica,
                    tendência e cuidado personalizado para cada cliente.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
