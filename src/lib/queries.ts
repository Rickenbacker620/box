import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface Brand {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  brands:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
}

async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("id, name").order("name");

  if (error) {
    throw error;
  }

  return data;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      category,
      rating,
      comment,
      image_url,
      brands (name)
    `)
    .order("name");

  if (error) {
    throw error;
  }

  return (data as unknown as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    brand: Array.isArray(product.brands)
      ? (product.brands[0]?.name ?? "Unknown brand")
      : (product.brands?.name ?? "Unknown brand"),
    category: product.category,
    rating: product.rating,
    comment: product.comment,
    imageUrl: product.image_url,
  }));
}

export const brandsQueryOptions = queryOptions({
  queryKey: ["brands"],
  queryFn: fetchBrands,
});

export const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: fetchProducts,
});

export function getProductImageUrl(path: string) {
  return supabase.storage.from("box-assets").getPublicUrl(path).data.publicUrl;
}
