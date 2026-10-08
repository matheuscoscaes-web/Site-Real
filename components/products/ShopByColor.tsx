import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { COLOR_FAMILIES, colorFamiliesOf } from "@/lib/colorFamilies";
import { parseProductImages } from "@/lib/utils";

interface ColorTile {
  slug: string;
  label: string;
  swatch: string;
  count: number;
  image: string | null;
}

/**
 * Para cada familia de cor: quantos produtos ativos tem e uma foto de peca
 * daquela cor (de preferencia destaque e com estoque) pra ilustrar o circulo.
 */
const getColorTiles = unstable_cache(
  async (): Promise<ColorTile[]> => {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: { name: true, categories: true, images: true, variants: { select: { color: true, stock: true } } },
    });

    return COLOR_FAMILIES.map((family) => {
      let count = 0;
      let image: string | null = null;
      let bestScore = -1;
      for (const p of products) {
        const matching = p.variants.filter((v) => colorFamiliesOf(v.color).includes(family.slug));
        if (matching.length === 0) continue;
        count++;
        // Foto do circulo: bolsa > outras pecas, com estoque, e no tom "puro" da
        // familia (ex: "Cinza" antes de "Taupe"). Empate fica com o destaque/mais novo.
        const isBag = p.categories.includes("Bolsas") || /^bolsa/i.test(p.name);
        for (const v of matching) {
          const pure = colorFamiliesOf(v.color).length === 1 && (v.color ?? "").toLowerCase().includes(family.keywords[0]);
          const score = (isBag ? 4 : 0) + (v.stock > 0 ? 2 : 0) + (pure ? 1 : 0);
          if (score <= bestScore) continue;
          const photo = parseProductImages(p.images).find((i) => i.color === v.color);
          if (!photo?.url) continue;
          image = photo.url;
          bestScore = score;
        }
      }
      return { slug: family.slug, label: family.label, swatch: family.swatch, count, image };
    }).filter((t) => t.count > 0);
  },
  ["home-shop-by-color-v2"],
  { revalidate: 300, tags: ["products"] }
);

/** Secao "Compre por cor" do inicio: circulos clicaveis que abrem a vitrine ja filtrada. */
export async function ShopByColor() {
  const tiles = await getColorTiles();
  if (tiles.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container-main">
        <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Compre por cor</p>
            <h2 className="section-title">Qual é a sua cor?</h2>
          </div>
          <Link href="/produtos" className="hidden sm:inline text-sm font-medium text-brand-700 hover:underline whitespace-nowrap">
            Ver tudo
          </Link>
        </div>

        <div className="snap-row gap-4 md:gap-6 -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-9 lg:gap-4">
          {tiles.map((t) => (
            <Link key={t.slug} href={`/produtos?cor=${t.slug}`} className="group w-[84px] md:w-[104px] lg:w-auto flex flex-col items-center text-center">
              <span className="relative block w-[76px] h-[76px] md:w-24 md:h-24">
                <span
                  className="absolute inset-0 rounded-full overflow-hidden ring-1 ring-black/5 bg-cream-50 transition-transform duration-300 group-hover:scale-105"
                  style={t.image ? undefined : { backgroundColor: t.swatch }}
                >
                  {t.image && (
                    <Image src={t.image} alt="" fill sizes="96px" className="object-cover" />
                  )}
                </span>
                {/* Bolinha da cor */}
                <span
                  className="absolute bottom-0.5 right-0.5 w-5 h-5 md:w-6 md:h-6 rounded-full ring-[3px] ring-white shadow-sm"
                  style={{ backgroundColor: t.swatch }}
                  aria-hidden
                />
              </span>
              <span className="mt-2.5 text-[12.5px] md:text-sm font-medium text-gray-800 leading-tight group-hover:text-brand-700 transition-colors">
                {t.label}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5">
                {t.count} {t.count === 1 ? "peça" : "peças"}
              </span>
            </Link>
          ))}
          <span className="w-1 lg:hidden" aria-hidden />
        </div>
      </div>
    </section>
  );
}
