import { MapPin, Phone, Clock, Instagram, Facebook, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import type { Salon } from "@/hooks/useSalon";

interface FooterProps {
  salon: Salon | undefined;
}

const dayNames: Record<string, string> = {
  mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta",
  fri: "Sexta", sat: "Sábado", sun: "Domingo",
};

export default function Footer({ salon }: FooterProps) {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold text-gradient-gold mb-4">
              {salon?.name || "Salão"}
            </h3>
            <p className="font-body text-muted-foreground text-sm">
              Transformando beleza em arte, um cliente por vez.
            </p>
            <div className="flex gap-4 mt-6">
              {salon?.instagram && (
                <a
                  href={`https://instagram.com/${salon.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {salon?.facebook && (
                <a
                  href={`https://facebook.com/${salon.facebook.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">Contato</h4>
            <div className="space-y-3 font-body text-sm text-muted-foreground">
              {salon?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                  <span>{salon.address}</span>
                </div>
              )}
              {salon?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{salon.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">Horários</h4>
            <div className="space-y-2 font-body text-sm text-muted-foreground">
              {salon?.opening_hours &&
                Object.entries(salon.opening_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span>{dayNames[day] || day}</span>
                    <span className={hours === "closed" ? "text-destructive" : "text-foreground"}>
                      {hours === "closed" ? "Fechado" : hours}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} {salon?.name || "Salão"}. Todos os direitos reservados.
          </p>
          <a
            href="https://wa.me/5585994334597"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Desenvolvido por GM Tech Solution
          </a>
          <Link
            to="/admin"
            className="font-body text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            Painel Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
