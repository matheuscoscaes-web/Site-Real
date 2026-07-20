import { prisma } from "@/lib/prisma";
import { HeroImagesForm } from "./HeroImagesForm";

const DEFAULT_HERO_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
  2: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
  3: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  4: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
};

export default async function AdminImagensPage() {
  const images = await prisma.heroImage.findMany({ orderBy: { position: "asc" } });
  const byPosition = new Map(images.map((i) => [i.position, i.url]));
  const slots = [1, 2, 3, 4].map((pos) => ({
    position: pos,
    url: byPosition.get(pos) || DEFAULT_HERO_IMAGES[pos],
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Imagens da Home</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fotos exibidas no topo do site (desktop). Não aparecem no celular.
        </p>
      </div>

      <HeroImagesForm slots={slots} />
    </div>
  );
}
