import { useState, useCallback } from "react";
import { useSalon } from "@/hooks/useSalon";
import { useServices, type Service } from "@/hooks/useServices";
import { useGallery } from "@/hooks/useGallery";
import { useTestimonials } from "@/hooks/useTestimonials";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Gallery from "@/components/landing/Gallery";
import About from "@/components/landing/About";
import Testimonials from "@/components/landing/Testimonials";
import VideoSection from "@/components/landing/VideoSection";
import Booking from "@/components/landing/Booking";
import Footer from "@/components/landing/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  const { data: salon, isLoading: salonLoading } = useSalon();
  const { data: services, isLoading: servicesLoading } = useServices(salon?.id);
  const { data: gallery } = useGallery(salon?.id);
  const { data: testimonials } = useTestimonials(salon?.id);
  const [preselected, setPreselected] = useState<Service[]>([]);
  const [preselectionToken, setPreselectionToken] = useState(0);

  const handleBookService = useCallback((service: Service) => {
    setPreselected([service]);
    setPreselectionToken(Date.now());
    setTimeout(() => {
      document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header salon={salon} />
      <Hero salon={salon} />
      <ErrorBoundary fallbackTitle="Erro ao carregar serviços">
        <Services services={services} isLoading={servicesLoading} onBook={handleBookService} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Erro ao carregar galeria">
        <Gallery images={gallery} />
      </ErrorBoundary>
      <About salon={salon} />
      <ErrorBoundary fallbackTitle="Erro ao carregar vídeo">
        <VideoSection salon={salon} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Erro ao carregar depoimentos">
        <Testimonials testimonials={testimonials} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Erro ao carregar agendamento">
        <Booking
          salon={salon}
          services={services}
          preselectedServices={preselected}
          preselectionToken={preselectionToken}
        />
      </ErrorBoundary>
      <Footer salon={salon} />
    </div>
  );
};

export default Index;
