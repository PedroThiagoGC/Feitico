import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Scissors } from "lucide-react";
import type { Service } from "@/hooks/useServices";

interface ServicesProps {
  services: Service[] | undefined;
  isLoading: boolean;
  onBook: (service: Service) => void;
}

export default function Services({ services, isLoading, onBook }: ServicesProps) {
  const { ref, isVisible } = useScrollAnimation();

  const regularServices = services?.filter((s) => !s.is_combo) || [];
  const combos = services?.filter((s) => s.is_combo) || [];

  return (
    <section id="services" className="py-24 bg-background">
      <div className="container px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Nossos <span className="text-gradient-gold">Serviços</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            Conheça nossos serviços e agende o melhor horário para você
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularServices.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} onBook={onBook} />
              ))}
            </div>

            {combos.length > 0 && (
              <div className="mt-16">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
                  <span className="text-gradient-gold">Combos</span> Especiais
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {combos.map((service, i) => (
                    <ServiceCard key={service.id} service={service} index={i} onBook={onBook} isCombo />
                  ))}
                </div>
              </div>
            )}

            {regularServices.length === 0 && combos.length === 0 && (
              <p className="text-center text-muted-foreground font-body">
                Nenhum serviço cadastrado ainda.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
  onBook,
  isCombo,
}: {
  service: Service;
  index: number;
  onBook: (s: Service) => void;
  isCombo?: boolean;
}) {
  return (
    <Card
      className={`group bg-card border-border hover:border-primary/40 transition-all duration-300 overflow-hidden hover:shadow-gold`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {service.image_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="p-6">
        {isCombo && (
          <span className="inline-block text-xs font-body font-semibold bg-primary/20 text-primary px-2 py-1 rounded mb-3">
            COMBO
          </span>
        )}
        <h4 className="font-display text-xl font-semibold text-foreground mb-2">
          {service.name}
        </h4>
        {service.description && (
          <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">
            {service.description}
          </p>
        )}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-display font-bold text-primary">
            R$ {Number(service.price).toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground font-body">
            <Clock className="w-4 h-4" />
            {service.duration} min
          </span>
        </div>
        <Button
          onClick={() => onBook(service)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-body"
        >
          <Scissors className="w-4 h-4 mr-2" />
          Agendar
        </Button>
      </CardContent>
    </Card>
  );
}
