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
}

export interface BestPrice {
  id: string;
  name: string;
  lowestPrice: number;
  unit: string;
  comments: string | null;
}

export interface Essential {
  id: string;
  name: string;
  brand: string;
  categories: string[];
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  rating: number;
  comment: string | null;
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
  }));
}

async function fetchBestPrices(): Promise<BestPrice[]> {
  const { data, error } = await supabase
    .from("best_prices")
    .select("id, name, lowest_price, unit, comments")
    .order("name");

  if (error) {
    throw error;
  }

  return data.map((price) => ({
    id: price.id,
    name: price.name,
    lowestPrice: Number(price.lowest_price),
    unit: price.unit,
    comments: price.comments,
  }));
}

async function fetchEssentials(): Promise<Essential[]> {
  const { data, error } = await supabase
    .from("essentials")
    .select("id, name, brand, categories")
    .order("name");

  if (error) {
    throw error;
  }

  return data.map((essential) => ({
    id: essential.id,
    name: essential.name,
    brand: essential.brand,
    categories: essential.categories,
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

export const bestPricesQueryOptions = queryOptions({
  queryKey: ["best-prices"],
  queryFn: fetchBestPrices,
});

export const essentialsQueryOptions = queryOptions({
  queryKey: ["essentials"],
  queryFn: fetchEssentials,
});
