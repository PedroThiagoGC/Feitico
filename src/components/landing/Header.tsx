import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Salon } from "@/hooks/useSalon";

interface HeaderProps {
  salon: Salon | undefined;
}

const navItems = [
  { label: "Início", href: "#hero" },
  { label: "Serviços", href: "#services" },
  { label: "Galeria", href: "#gallery" },
  { label: "Sobre", href: "#about" },
  { label: "Depoimentos", href: "#testimonials" },
  { label: "Agendar", href: "#booking" },
];

export default function Header({ salon }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-dark border-b border-border py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container flex items-center justify-between">
        {salon?.logo_url ? (
          <img src={salon.logo_url} alt={salon.name} className="h-10 object-contain" />
        ) : (
          <span className="text-gradient-gold font-display text-2xl font-bold">
            {salon?.name || "Salão"}
          </span>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="text-sm font-body font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-dark border-t border-border mt-2">
          <nav className="container flex flex-col py-4 gap-3">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="text-left text-sm font-body font-medium text-foreground/70 hover:text-primary transition-colors py-2"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
