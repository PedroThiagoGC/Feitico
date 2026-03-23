import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "@/hooks/useTestimonials";

interface TestimonialsProps {
  testimonials: Testimonial[] | undefined;
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const { ref, isVisible } = useScrollAnimation();

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            O que dizem <span className="text-gradient-gold">nossos clientes</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < t.rating ? "text-primary fill-primary" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="font-body text-foreground/80 italic mb-4">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  {t.author_image && (
                    <img
                      src={t.author_image}
                      alt={t.author_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <span className="font-body font-semibold text-foreground text-sm">
                    {t.author_name}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
