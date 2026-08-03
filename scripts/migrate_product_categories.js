const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "product_categories" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "parentId" TEXT REFERENCES "product_categories"("id") ON DELETE CASCADE,
      "position" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Tabela product_categories OK.');

  const existing = await prisma.productCategory.count();
  if (existing > 0) {
    console.log(`Já tem ${existing} categoria(s), pulando seed.`);
    await prisma.$disconnect();
    return;
  }

  const topLevel = ['Bolsas', 'Mochilas', 'Bolsa Tira-Colo', 'Acessórios'];
  const created = {};
  for (let i = 0; i < topLevel.length; i++) {
    created[topLevel[i]] = await prisma.productCategory.create({
      data: { name: topLevel[i], position: i },
    });
  }

  const children = ['Carteira Feminina', 'Carteira Masculina'];
  for (let i = 0; i < children.length; i++) {
    await prisma.productCategory.create({
      data: { name: children[i], position: i, parentId: created['Acessórios'].id },
    });
  }

  console.log('Seed concluído: 4 categorias + 2 subcategorias.');
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
