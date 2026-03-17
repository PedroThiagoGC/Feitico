import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { GalleryImage } from "@/hooks/useGallery";

interface GalleryProps {
  images: GalleryImage[] | undefined;
}

export default function Gallery({ images }: GalleryProps) {
  const { ref, isVisible } = useScrollAnimation();

  if (!images || images.length === 0) return null;

  return (
    <section id="gallery" className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Nossa <span className="text-gradient-gold">Galeria</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            Confira nosso trabalho e inspire-se
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative group aspect-square overflow-hidden rounded-lg"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img
                src={img.image_url}
                alt={img.caption || "Galeria"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                {img.caption && (
                  <p className="text-foreground text-sm font-body">{img.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
