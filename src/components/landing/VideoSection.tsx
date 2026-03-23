import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { Salon } from "@/hooks/useSalon";

interface VideoSectionProps {
  salon: Salon | undefined;
}

export default function VideoSection({ salon }: VideoSectionProps) {
  const { ref, isVisible } = useScrollAnimation();

  if (!salon?.video_url) return null;

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match?.[1];
  };

  const videoId = getYouTubeId(salon.video_url);

  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div
          ref={ref}
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Conheça nosso <span className="text-gradient-gold">espaço</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden border border-border shadow-gold">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vídeo do salão"
              loading="lazy"
            />
          ) : (
            <video src={salon.video_url} controls className="w-full h-full object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}
