import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// URLs Unsplash verificadas e funcionais
const IMG = {
  // Bolsas
  bolsaCouro1: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
  bolsaCouro2: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
  bolsaCouro3: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
  bolsaTote1:  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
  bolsaTote2:  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
  clutch1:     "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
  clutch2:     "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
  mochila1:    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
  mochila2:    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
  // Vestuário
  vestido1:    "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&q=80",
  vestido2:    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
  blusa1:      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80",
  blusa2:      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
  calca1:      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
  calca2:      "https://images.unsplash.com/photo-1472746729193-26ffcf371b14?w=800&q=80",
  conjunto1:   "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
  conjunto2:   "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
  blazer1:     "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80",
  blazer2:     "https://images.unsplash.com/photo-1472746729193-26ffcf371b14?w=800&q=80",
  // Acessórios
  cinto1:      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
  oculos1:     "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80",
  oculos2:     "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
  colar1:      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  colar2:      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  pulseira1:   "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80",
  pulseira2:   "https://images.unsplash.com/photo-1573408301185-9519eb279f4e?w=800&q=80",
  lenco1:      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  lenco2:      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80",
};

async function main() {
  console.log("🌱 Iniciando seed...");

  // Admin
  const adminPassword = await bcrypt.hash("Admin@2024", 12);
  await prisma.user.upsert({
    where: { email: "admin@bellaforma.com.br" },
    update: {},
    create: {
      name: "Administradora",
      email: "admin@bellaforma.com.br",
      password: adminPassword,
      phone: "(11) 99999-0000",
      role: "ADMIN",
    },
  });

  // Clientes fictícios
  const clientPassword = await bcrypt.hash("Cliente@123", 12);
  const clientes = [
    { name: "Ana Paula Ferreira", email: "ana.paula@email.com", phone: "(11) 98765-4321" },
    { name: "Juliana Martins", email: "juliana.martins@email.com", phone: "(21) 97654-3210" },
    { name: "Camila Rodrigues", email: "camila.r@email.com", phone: "(31) 96543-2109" },
    { name: "Fernanda Costa", email: "fernanda.costa@email.com", phone: "(41) 95432-1098" },
    { name: "Beatriz Oliveira", email: "beatriz.oli@email.com", phone: "(11) 94321-0987" },
    { name: "Gabriela Santos", email: "gabi.santos@email.com", phone: "(51) 93210-9876" },
    { name: "Larissa Lima", email: "larissa.lima@email.com", phone: "(61) 92109-8765" },
  ];

  const createdClientes = [];
  for (const cliente of clientes) {
    const user = await prisma.user.upsert({
      where: { email: cliente.email },
      update: {},
      create: { ...cliente, password: clientPassword, role: "CUSTOMER" },
    });
    createdClientes.push(user);
  }

  // Endereços
  const addresses = [];
  const enderecosDados = [
    { name: "Casa", street: "Rua das Flores", number: "123", district: "Jardim América", city: "São Paulo", state: "SP", zipCode: "01310-100" },
    { name: "Casa", street: "Av. Atlântica", number: "456", district: "Copacabana", city: "Rio de Janeiro", state: "RJ", zipCode: "22070-011" },
    { name: "Casa", street: "Rua da Bahia", number: "789", district: "Centro", city: "Belo Horizonte", state: "MG", zipCode: "30160-010" },
    { name: "Casa", street: "Rua XV de Novembro", number: "321", district: "Centro", city: "Curitiba", state: "PR", zipCode: "80020-310" },
    { name: "Casa", street: "Av. Paulista", number: "654", district: "Bela Vista", city: "São Paulo", state: "SP", zipCode: "01310-100" },
    { name: "Casa", street: "Rua dos Andradas", number: "987", district: "Centro Histórico", city: "Porto Alegre", state: "RS", zipCode: "90020-003" },
    { name: "Casa", street: "SQN 204", number: "10", district: "Asa Norte", city: "Brasília", state: "DF", zipCode: "70833-010" },
  ];

  for (let i = 0; i < createdClientes.length; i++) {
    const addr = await prisma.address.create({
      data: { ...enderecosDados[i], userId: createdClientes[i].id, isDefault: true },
    });
    addresses.push(addr);
  }

  // Produtos
  const produtosData = [
    {
      name: "Bolsa de Couro Premium Caramel",
      slug: "bolsa-couro-premium-caramel",
      description: "Bolsa confeccionada em couro legítimo com acabamento premium. Interior forrado com divisórias internas, fechamento com zíper dourado e alças ajustáveis. Perfeita para o dia a dia, combina com looks casuais e executivos.",
      price: 289.90, category: "Bolsas", stock: 15, featured: true,
      images: JSON.stringify([IMG.bolsaCouro1, IMG.bolsaCouro2, IMG.bolsaCouro3]),
      variants: [{ color: "Caramel", size: null, stock: 8 }, { color: "Preto", size: null, stock: 7 }],
    },
    {
      name: "Bolsa Tiracolo Dourada Luxe",
      slug: "bolsa-tiracolo-dourada-luxe",
      description: "Bolsa tiracolo em couro com acabamento dourado. Corrente ajustável, interior com bolso interno e zíper. Ideal para festas, jantares e ocasiões especiais.",
      price: 189.90, category: "Bolsas", stock: 20, featured: true,
      images: JSON.stringify([IMG.bolsaCouro3, IMG.bolsaCouro2]),
      variants: [{ color: "Dourado", size: null, stock: 10 }, { color: "Prata", size: null, stock: 10 }],
    },
    {
      name: "Bolsa Tote Canvas Bege",
      slug: "bolsa-tote-canvas-bege",
      description: "Bolsa tote espaçosa em canvas resistente com detalhes em couro. Grande capacidade para comportar notebook, acessórios e tudo que você precisa no dia a dia.",
      price: 149.90, category: "Bolsas", stock: 25, featured: false,
      images: JSON.stringify([IMG.bolsaTote1, IMG.bolsaTote2]),
      variants: [{ color: "Bege", size: null, stock: 15 }, { color: "Marinho", size: null, stock: 10 }],
    },
    {
      name: "Clutch de Festa Prata Glam",
      slug: "clutch-festa-prata-glam",
      description: "Clutch sofisticada com brilho metálico prata. Fecho com corrente dourada removível, interior forrado com espelho e bolso interno. A escolha perfeita para noites especiais.",
      price: 129.90, category: "Bolsas", stock: 18, featured: true,
      images: JSON.stringify([IMG.clutch1, IMG.clutch2]),
      variants: [{ color: "Prata", size: null, stock: 10 }, { color: "Ouro Rosé", size: null, stock: 8 }],
    },
    {
      name: "Mochila Feminina Rosé",
      slug: "mochila-feminina-rose",
      description: "Mochila feminina com design moderno e funcional. Bolso principal espaçoso, compartimento para notebook de até 15', bolso frontal com organizer e alças acolchoadas.",
      price: 199.90, category: "Bolsas", stock: 12, featured: false,
      images: JSON.stringify([IMG.mochila1, IMG.mochila2]),
      variants: [{ color: "Rosé", size: null, stock: 6 }, { color: "Preto", size: null, stock: 6 }],
    },
    {
      name: "Vestido Floral Midi Verão",
      slug: "vestido-floral-midi-verao",
      description: "Vestido midi com estampa floral delicada em tecido fluido de viscose. Modelagem levemente evasê, alças reguláveis e decote V. Perfeito para dias quentes e eventos ao ar livre.",
      price: 159.90, category: "Vestuário", stock: 30, featured: true,
      images: JSON.stringify([IMG.vestido1, IMG.vestido2]),
      variants: [
        { color: "Rosa Floral", size: "P", stock: 8 },
        { color: "Rosa Floral", size: "M", stock: 12 },
        { color: "Rosa Floral", size: "G", stock: 7 },
        { color: "Azul Floral", size: "P", stock: 3 },
      ],
    },
    {
      name: "Blusa de Seda Rosé Premium",
      slug: "blusa-seda-rose-premium",
      description: "Blusa feminina em seda pura com caimento impecável. Modelagem fluida com acabamento refinado, perfeita para composições elegantes no trabalho ou em encontros especiais.",
      price: 89.90, category: "Vestuário", stock: 40, featured: false,
      images: JSON.stringify([IMG.blusa1, IMG.blusa2]),
      variants: [
        { color: "Rosé", size: "P", stock: 10 },
        { color: "Rosé", size: "M", stock: 15 },
        { color: "Rosé", size: "G", stock: 8 },
        { color: "Off-White", size: "P", stock: 7 },
      ],
    },
    {
      name: "Calça Alfaiataria Bege Social",
      slug: "calca-alfaiataria-bege-social",
      description: "Calça alfaiataria de corte reto em tecido crepe de alta qualidade. Modelagem slim fit, cós alto com botões dourados e bolsos laterais. Combina com blazers, blusas e saltos.",
      price: 179.90, category: "Vestuário", stock: 22, featured: true,
      images: JSON.stringify([IMG.calca1, IMG.calca2]),
      variants: [
        { color: "Bege", size: "36", stock: 6 },
        { color: "Bege", size: "38", stock: 8 },
        { color: "Bege", size: "40", stock: 5 },
        { color: "Preto", size: "38", stock: 3 },
      ],
    },
    {
      name: "Conjunto Cropped e Saia Midi",
      slug: "conjunto-cropped-saia-midi",
      description: "Conjunto moderno com cropped manga longa e saia midi plissada em tecido de malha premium. Visual sofisticado e atual, ideal para compor looks de dia e noite.",
      price: 219.90, category: "Vestuário", stock: 16, featured: true,
      images: JSON.stringify([IMG.conjunto1, IMG.conjunto2]),
      variants: [
        { color: "Rose", size: "P", stock: 4 },
        { color: "Rose", size: "M", stock: 6 },
        { color: "Rose", size: "G", stock: 4 },
        { color: "Nude", size: "M", stock: 2 },
      ],
    },
    {
      name: "Blazer Feminino Off-White Luxo",
      slug: "blazer-feminino-off-white-luxo",
      description: "Blazer feminino de alfaiataria em tecido premium off-white. Botões dourados, bolsos decorativos e forro interno suave. Transforma qualquer look em um outfit elegante.",
      price: 259.90, category: "Vestuário", stock: 14, featured: false,
      images: JSON.stringify([IMG.blazer1, IMG.blazer2]),
      variants: [
        { color: "Off-White", size: "P", stock: 4 },
        { color: "Off-White", size: "M", stock: 5 },
        { color: "Off-White", size: "G", stock: 3 },
        { color: "Camel", size: "M", stock: 2 },
      ],
    },
    {
      name: "Cinto de Couro Marrom Trançado",
      slug: "cinto-couro-marrom-trancado",
      description: "Cinto feminino em couro legítimo com trança artesanal e fivela dourada. Peça que valoriza a silhueta e adiciona sofisticação a qualquer look.",
      price: 79.90, category: "Acessórios", stock: 35, featured: false,
      images: JSON.stringify([IMG.cinto1, IMG.bolsaCouro2]),
      variants: [
        { color: "Marrom", size: "P", stock: 12 },
        { color: "Marrom", size: "M", stock: 15 },
        { color: "Marrom", size: "G", stock: 8 },
      ],
    },
    {
      name: "Óculos de Sol Retrô Gatinho",
      slug: "oculos-sol-retro-gatinho",
      description: "Óculos de sol com armação cat-eye em acetato premium com lentes polarizadas. Proteção UV400, design retrô que valoriza o rosto feminino.",
      price: 149.90, category: "Acessórios", stock: 28, featured: true,
      images: JSON.stringify([IMG.oculos1, IMG.oculos2]),
      variants: [
        { color: "Tartaruga", size: null, stock: 10 },
        { color: "Preto", size: null, stock: 10 },
        { color: "Transparente", size: null, stock: 8 },
      ],
    },
    {
      name: "Colar Dourado Delicado Charm",
      slug: "colar-dourado-delicado-charm",
      description: "Colar delicado em banho de ouro 18k com pingente charm. Comprimento de 45cm com extensor de 5cm. Hipoalergênico, não fica preto. Perfeito para presentear.",
      price: 59.90, category: "Acessórios", stock: 50, featured: false,
      images: JSON.stringify([IMG.colar1, IMG.colar2]),
      variants: [{ color: "Dourado", size: null, stock: 30 }, { color: "Prata", size: null, stock: 20 }],
    },
    {
      name: "Kit Pulseiras Boho Chic",
      slug: "kit-pulseiras-boho-chic",
      description: "Kit com 5 pulseiras de estilo boho chic em miçangas, cristais e fios de couro. Peças que se combinam perfeitamente, criando looks únicos e artesanais.",
      price: 49.90, category: "Acessórios", stock: 40, featured: false,
      images: JSON.stringify([IMG.pulseira1, IMG.pulseira2]),
      variants: [{ color: "Rose Gold", size: null, stock: 20 }, { color: "Turquesa", size: null, stock: 20 }],
    },
    {
      name: "Lenço de Seda Estampado Parisiense",
      slug: "lenco-seda-estampado-parisiense",
      description: "Lenço 100% seda com estampa geométrica em cores vibrantes. Pode ser usado na cabeça, no pescoço, na bolsa ou no pulso. Peça-chave que transforma qualquer look.",
      price: 89.90, category: "Acessórios", stock: 32, featured: false,
      images: JSON.stringify([IMG.lenco1, IMG.lenco2]),
      variants: [
        { color: "Azul Safira", size: null, stock: 12 },
        { color: "Rosa Coral", size: null, stock: 10 },
        { color: "Verde Esmeralda", size: null, stock: 10 },
      ],
    },
  ];

  const createdProducts = [];
  for (const prodData of produtosData) {
    const { variants, ...productData } = prodData;
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: { images: productData.images },
      create: {
        ...productData,
        variants: { create: variants },
      },
    });
    createdProducts.push(product);
  }

  // Pedidos fictícios
  const statusList = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "DELIVERED", "DELIVERED"];
  const paymentMethods = ["PIX", "CARTAO_CREDITO", "BOLETO", "PIX", "CARTAO_CREDITO", "PIX", "CARTAO_CREDITO"];

  for (let i = 0; i < createdClientes.length; i++) {
    const cliente = createdClientes[i];
    const address = addresses[i];
    const numOrders = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numOrders; j++) {
      const existingOrders = await prisma.order.findMany({ where: { userId: cliente.id } });
      if (existingOrders.length >= 3) continue;

      const prodIdx1 = Math.floor(Math.random() * createdProducts.length);
      const prodIdx2 = Math.floor(Math.random() * createdProducts.length);
      const prod1 = createdProducts[prodIdx1];
      const prod2 = createdProducts[prodIdx2];
      const qty1 = Math.floor(Math.random() * 2) + 1;
      const qty2 = Math.floor(Math.random() * 2) + 1;
      const subtotal = prod1.price * qty1 + (prodIdx1 !== prodIdx2 ? prod2.price * qty2 : 0);
      const shipping = Math.random() > 0.5 ? 0 : 18.90;
      const total = subtotal + shipping;
      const statusIdx = (i + j) % statusList.length;

      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await prisma.order.create({
        data: {
          userId: cliente.id,
          addressId: address.id,
          status: statusList[statusIdx],
          paymentMethod: paymentMethods[statusIdx],
          subtotal,
          shipping,
          total,
          createdAt,
          items: {
            create: [
              { productId: prod1.id, quantity: qty1, price: prod1.price },
              ...(prodIdx1 !== prodIdx2 ? [{ productId: prod2.id, quantity: qty2, price: prod2.price }] : []),
            ],
          },
        },
      });
    }
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log(`   Admin: admin@bellaforma.com.br / Admin@2024`);
  console.log(`   Clientes: ana.paula@email.com / Cliente@123`);
  console.log(`   Produtos criados/atualizados: ${createdProducts.length}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
