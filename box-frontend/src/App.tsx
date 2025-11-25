import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProductsOptions } from './client/@tanstack/react-query.gen'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { CreateProductModal } from './components/products/CreateProductModal'
import { ProductList } from './components/products/ProductList'
import { ProductFilters } from './components/products/ProductFilters'
import { ManageBrandsModal } from './components/brands/ManageBrandsModal'
import { ModeToggle } from './components/mode-toggle'
import { ApiTokenInput } from './components/ApiTokenInput'
import { useApiToken } from './hooks/useApiToken'

function App() {
  const { token, saveToken, hasToken } = useApiToken()
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  const { data: productsData } = useQuery({
    ...getProductsOptions(),
    enabled: !!token // Only fetch data if we have a token
  })

  const products = productsData?.products || []

  // Show API token input if no token is available
  if (!hasToken) {
    return <ApiTokenInput onTokenSubmit={saveToken} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Product Manager</h1>
              <p className="text-muted-foreground mt-1">Manage your product catalog</p>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Actions Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setIsProductModalOpen(true)}
              >
                Create Product
              </Button>
              <Button
                onClick={() => setIsBrandModalOpen(true)}
                variant="secondary"
              >
                Manage Brands
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Badge variant="secondary">
                {products.length} {products.length === 1 ? 'item' : 'items'}
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
            <ProductList
              selectedBrand={selectedBrand}
              selectedCategory={selectedCategory}
            />
          </CardContent>
        </Card>

      </main>

      <CreateProductModal open={isProductModalOpen} onOpenChange={setIsProductModalOpen} />
      <ManageBrandsModal open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen} />
    </div>
  )
}

export default App