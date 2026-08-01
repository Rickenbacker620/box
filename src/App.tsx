import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "./lib/queries";
import { ProductList } from "./components/products/ProductList";
import { ProductFilters } from "./components/products/ProductFilters";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: productsData } = useQuery(productsQueryOptions);

  const products = productsData ?? [];

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="catalog-header">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-6 px-5 py-6 sm:px-8 sm:py-9">
          <a href="/" className="catalog-mark" aria-label="Product catalog home">BX</a>
          <ModeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-12 sm:px-8 sm:pb-20">
        <section className="catalog-intro">
          <p className="catalog-kicker">Personal product index · 2026</p>
          <div className="mt-5 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="catalog-title">The things<br /><em>worth keeping.</em></h1>
              <p className="catalog-description">A considered record of products tried, rated and remembered.</p>
            </div>
            <p className="catalog-count"><strong>{String(products.length).padStart(2, "0")}</strong><span>{products.length === 1 ? "item logged" : "items logged"}</span></p>
          </div>
        </section>

        <section className="mt-10 sm:mt-14" aria-labelledby="catalog-heading">
          <div className="catalog-toolbar">
            <h2 id="catalog-heading">Collection</h2>
            <ProductFilters
              selectedBrand={selectedBrand}
              selectedCategory={selectedCategory}
              onBrandChange={setSelectedBrand}
              onCategoryChange={setSelectedCategory}
            />
          </div>
          <ProductList selectedBrand={selectedBrand} selectedCategory={selectedCategory} />
        </section>
      </main>
    </div>
  );
}

export default App;
