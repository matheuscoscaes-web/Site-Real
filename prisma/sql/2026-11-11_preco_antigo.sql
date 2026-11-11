-- Black November: preco "de" (riscado) do produto. Coluna opcional, nao mexe em nada existente.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "precoAntigo" DOUBLE PRECISION;
