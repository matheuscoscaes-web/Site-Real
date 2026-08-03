import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface ProductCategoryNode {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

export const getProductCategoryTree = unstable_cache(
  async (): Promise<ProductCategoryNode[]> => {
    const all = await prisma.productCategory.findMany({ orderBy: { position: "asc" } });
    const parents = all.filter((c) => !c.parentId);
    return parents.map((p) => ({
      id: p.id,
      name: p.name,
      children: all
        .filter((c) => c.parentId === p.id)
        .map((c) => ({ id: c.id, name: c.name })),
    }));
  },
  ["product-categories"],
  { revalidate: 300, tags: ["product-categories"] }
);
