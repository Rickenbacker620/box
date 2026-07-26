import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "./lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { ProductList } from "./components/products/ProductList";
import { ProductFilters } from "./components/products/ProductFilters";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: productsData } = useQuery(productsQueryOptions);

  const products = productsData ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Product Dashboard</h1>
              <p className="text-muted-foreground mt-1">Browse your product catalog</p>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Badge variant="secondary">
                {products.length} {products.length === 1 ? "item" : "items"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <ProductFilters
              selectedBrand={selectedBrand}
              selectedCategory={selectedCategory}
              onBrandChange={setSelectedBrand}
              onCategoryChange={setSelectedCategory}
            />

            {/* Product List */}
            <ProductList selectedBrand={selectedBrand} selectedCategory={selectedCategory} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;
