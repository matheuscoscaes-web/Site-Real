/**
 * Familias de cor do filtro da vitrine. As cores das variantes sao texto livre
 * ("Caramelo Floater", "Off white", "Preto + Caramelo"...), entao cada nome e
 * quebrado em palavras e casado com as palavras-chave de cada familia. Uma cor
 * com mais de um tom ("Preto + Caramelo") entra em todas as familias que casar.
 *
 * Casamento por palavra inteira (nao substring): "Vermelho" contem "mel" e
 * "Caramelo" contem "mel", mas so a palavra "Mel" sozinha conta como marrom.
 */
export interface ColorFamily {
  slug: string;
  label: string;
  /** Cor da bolinha no filtro */
  swatch: string;
  keywords: string[];
}

export const COLOR_FAMILIES: ColorFamily[] = [
  { slug: "preto", label: "Preto", swatch: "#1a1a1a", keywords: ["preto", "preta", "obsidiana", "carvao"] },
  {
    slug: "marrom",
    label: "Marrom / Caramelo",
    swatch: "#9a5b2c",
    keywords: [
      "caramelo", "caramel", "cafe", "whiskey", "whisky", "conhaque", "mel", "camel", "chocolate",
      "carvalho", "marrom", "argila", "tabaco",
    ],
  },
  {
    slug: "bege",
    label: "Bege / Off-White",
    swatch: "#efe6d6",
    keywords: [
      "off", "offwhite", "bege", "marfim", "creme", "nude", "baunilha", "perola", "gelo", "caqui",
      "palha", "fendi", "manteiga", "branco", "branca",
    ],
  },
  {
    slug: "cinza",
    label: "Cinza",
    swatch: "#8c8c8c",
    keywords: ["cinza", "grafite", "chumbo", "elefante", "taupe", "taupr", "rato", "prata", "acinzentado"],
  },
  { slug: "azul", label: "Azul", swatch: "#1f3a68", keywords: ["azul", "marinho", "celeste", "jeans"] },
  {
    slug: "verde",
    label: "Verde",
    swatch: "#3f6b3a",
    keywords: ["verde", "musgo", "petroleo", "oliva", "menta", "esmeralda"],
  },
  {
    slug: "vermelho",
    label: "Vermelho / Vinho",
    swatch: "#8b1e2d",
    keywords: [
      "vermelho", "vermelha", "marsala", "rubi", "bordo", "vinho", "grena", "telha", "terracota",
      "acai", "ferrugem", "laranja",
    ],
  },
  {
    slug: "amarelo",
    label: "Amarelo / Mostarda",
    swatch: "#d4a017",
    keywords: ["mostarda", "amarelo", "amarela", "acafrao", "dourado", "dourada"],
  },
  {
    slug: "rosa",
    label: "Rosa",
    swatch: "#e8a0b4",
    keywords: ["rosa", "rose", "pink", "goiaba", "coral", "salmao", "magenta", "lavanda"],
  },
];

function words(color: string): string[] {
  return color
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** Familias (slugs) a que um nome de cor pertence. */
export function colorFamiliesOf(color: string | null | undefined): string[] {
  if (!color) return [];
  const w = new Set(words(color));
  return COLOR_FAMILIES.filter((f) => f.keywords.some((k) => w.has(k))).map((f) => f.slug);
}

/** Familias de cor de um produto, somando todas as variantes. */
export function productColorFamilies(variants: { color: string | null }[]): Set<string> {
  const out = new Set<string>();
  for (const v of variants) for (const slug of colorFamiliesOf(v.color)) out.add(slug);
  return out;
}
