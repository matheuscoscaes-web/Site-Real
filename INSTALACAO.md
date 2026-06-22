# Bella Forma Store — Guia de Instalação

## Requisitos
- Node.js 18+ (baixar em nodejs.org)
- npm (vem junto com o Node.js)

---

## Instalação em 4 passos

### Passo 1 — Instale as dependências
```bash
npm install
```

### Passo 2 — Configure o banco de dados
```bash
npm run db:push
```

### Passo 3 — Popule com dados fictícios
```bash
npm run db:seed
```

### Passo 4 — Rode o projeto
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Contas de acesso

| Tipo       | E-mail                        | Senha       |
|------------|-------------------------------|-------------|
| Admin      | admin@bellaforma.com.br       | Admin@2024  |
| Cliente 1  | ana.paula@email.com           | Cliente@123 |
| Cliente 2  | juliana.martins@email.com     | Cliente@123 |
| Cliente 3  | camila.r@email.com            | Cliente@123 |

---

## Páginas do site

| URL                          | Descrição                    |
|------------------------------|------------------------------|
| /                            | Página inicial               |
| /produtos                    | Catálogo de produtos         |
| /produtos/[slug]             | Página do produto            |
| /carrinho                    | Carrinho de compras          |
| /checkout                    | Finalizar compra             |
| /checkout/sucesso?pedido=ID  | Confirmação do pedido        |
| /login                       | Login                        |
| /cadastro                    | Criar conta                  |
| /recuperar-senha             | Recuperar senha              |
| /conta                       | Painel do cliente            |
| /conta/pedidos               | Histórico de pedidos         |
| /conta/dados                 | Dados pessoais               |
| /admin                       | Dashboard admin              |
| /admin/produtos              | Gestão de produtos           |
| /admin/produtos/novo         | Cadastrar produto            |
| /admin/pedidos               | Gestão de pedidos            |
| /admin/clientes              | CRM de clientes              |
| /admin/financeiro            | Dashboard financeiro         |

---

## Personalizações principais

### Trocar nome da loja
Edite nos arquivos:
- `app/layout.tsx` — metadata (título e descrição)
- `components/layout/Header.tsx` — logo
- `components/layout/Footer.tsx` — rodapé
- `app/(auth)/login/page.tsx` — página de login

### Trocar cores (paleta de marca)
Edite em `tailwind.config.ts`:
```ts
colors: {
  brand: {
    // Troque os valores hex pela sua cor principal
    700: "#be1248",  // cor principal
  }
}
```

### Alterar produtos fictícios
Edite `prisma/seed.ts` e depois execute:
```bash
npm run db:reset
```

### Ativar pagamento real (MercadoPago)
1. Crie conta em mercadopago.com.br
2. Adicione `MERCADOPAGO_ACCESS_TOKEN=...` no `.env.local`
3. Substitua a simulação em `app/api/pedidos/route.ts`

### Ativar e-mail real (Resend)
1. Crie conta em resend.com
2. Adicione `RESEND_API_KEY=...` no `.env.local`
3. Adicione envio de e-mail na rota `app/api/pedidos/route.ts`

### Frete real (Correios / Melhor Envio)
- Arquivo preparado: `lib/frete.ts`
- Substitua a função `calcularFrete` pela API de sua escolha

---

## Deploy (Vercel — recomendado)

1. Crie conta em vercel.com
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente no painel da Vercel
4. Troque SQLite por PostgreSQL: `DATABASE_URL=postgresql://...`
5. Atualize o provider no `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
6. Execute `npm run db:push` e `npm run db:seed` na Vercel

---

## Estrutura de pastas

```
site-hearts/
├── app/
│   ├── (public)/         # Loja pública (home, produtos, carrinho)
│   ├── (auth)/           # Login, cadastro, recuperar senha
│   ├── conta/            # Área do cliente
│   ├── admin/            # Painel administrativo
│   └── api/              # API Routes (backend)
├── components/
│   ├── layout/           # Header, Footer, AdminSidebar
│   ├── products/         # ProductCard, ProductDetail
│   └── admin/            # ProductForm, Charts
├── lib/                  # Utilitários (prisma, auth, frete, utils)
├── store/                # Zustand (carrinho)
├── types/                # TypeScript types
├── prisma/
│   ├── schema.prisma     # Schema do banco de dados
│   └── seed.ts           # Dados fictícios
└── .env.local            # Variáveis de ambiente
```
