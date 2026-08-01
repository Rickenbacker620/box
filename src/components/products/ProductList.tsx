import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/queries";
import { Loader2, Star } from "lucide-react";

interface ProductListProps {
  selectedBrand?: string;
  selectedCategory?: string;
}

export function ProductList({ selectedBrand, selectedCategory }: ProductListProps) {
  const {
    data: productsData,
    isLoading: productsLoading,
    isError,
  } = useQuery(productsQueryOptions);

  // Filter products based on selected brand and category
  const filteredProducts = useMemo(() => {
    return (productsData ?? []).filter((product) => {
      const matchesBrand = selectedBrand === undefined || product.brand === selectedBrand;
      const matchesCategory =
        selectedCategory === undefined || product.category === selectedCategory;
      return matchesBrand && matchesCategory;
    });
  }, [productsData, selectedBrand, selectedCategory]);

  const products = filteredProducts;
  const isLoading = productsLoading;

  if (isLoading) {
    return (
      <div className="catalog-status">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="catalog-status">
        <p className="text-destructive">Unable to load products.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="catalog-empty">
        <span>0</span>
        <p>No products match this view.</p>
      </div>
    );
  }

  return (
    <div className="catalog-list">
      {products.map((product, index) => (
        <article key={product.id} className="product-entry">
          <span className="product-number">{String(index + 1).padStart(2, "0")}</span>
          <div className="product-swatch" aria-hidden="true">{product.name.slice(0, 1)}</div>
          <div className="min-w-0">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-meta"><span>{product.brand}</span><i /> <span className="capitalize">{product.category}</span></p>
            {product.comment && <p className="product-comment">{product.comment}</p>}
          </div>
          <div className="product-rating" aria-label={`${product.rating || 0} out of 5 stars`}>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={star <= (product.rating || 0) ? "fill-current" : "opacity-20"} />)}
            </div>
            <span>{(product.rating || 0).toFixed(1)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
