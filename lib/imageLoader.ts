// Loader de imagem do next/image. As fotos ficam no Supabase Storage e o
// proprio Supabase redimensiona (endpoint /render/image), entao o celular
// baixa so o tamanho que vai mostrar e o nosso servidor nao processa nada
// (o sharp sob demanda estourava a memoria da instancia, ver next.config.ts).
const SUPABASE_PUBLIC = "/storage/v1/object/public/";
const SUPABASE_RENDER = "/storage/v1/render/image/public/";

// Uploads saem com no maximo 1200px (app/api/upload/route.ts); pedir maior so desperdica
const MAX_WIDTH = 1200;

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const w = Math.min(width, MAX_WIDTH);

  if (src.includes(".supabase.co" + SUPABASE_PUBLIC)) {
    return `${src.replace(SUPABASE_PUBLIC, SUPABASE_RENDER)}?width=${w}&quality=${quality ?? 72}&resize=contain`;
  }

  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(w));
    url.searchParams.set("q", String(quality ?? 72));
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  // Outros hosts e arquivos locais (/imagens/...): entrega como esta
  return src;
}
