import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bestPricesQueryOptions, productsQueryOptions } from "./lib/queries";
import { ProductList } from "./components/products/ProductList";
import { ProductFilters } from "./components/products/ProductFilters";
import { BestPriceList } from "./components/prices/BestPriceList";
import { ModeToggle } from "./components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

function App() {
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: productsData } = useQuery(productsQueryOptions);
  const { data: bestPricesData } = useQuery(bestPricesQueryOptions);

  const products = productsData ?? [];
  const bestPrices = bestPricesData ?? [];

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
            <div className="catalog-stats">
              <p className="catalog-count"><strong>{String(products.length).padStart(2, "0")}</strong><span>{products.length === 1 ? "item logged" : "items logged"}</span></p>
              <p className="catalog-count"><strong>{String(bestPrices.length).padStart(2, "0")}</strong><span>{bestPrices.length === 1 ? "price note" : "price notes"}</span></p>
            </div>
          </div>
        </section>

        <Tabs defaultValue="products" className="mt-10 sm:mt-14">
          <TabsList variant="line" aria-label="Catalog sections">
            <TabsTrigger value="products">Collection</TabsTrigger>
            <TabsTrigger value="prices">Price notes</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-8">
            <section aria-labelledby="catalog-heading">
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
          </TabsContent>

          <TabsContent value="prices" className="mt-8">
            <section aria-labelledby="price-heading">
              <div className="catalog-toolbar">
                <div>
                  <h2 id="price-heading">Price notes</h2>
                  <p className="price-caption">The lowest prices you have personally recorded.</p>
                </div>
                <span className="price-label">Best known</span>
              </div>
              <BestPriceList />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
