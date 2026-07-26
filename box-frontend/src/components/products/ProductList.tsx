import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProductsOptions } from '@/client/@tanstack/react-query.gen'
import { Card, CardContent } from '../ui/card'
import { Loader2, Star } from 'lucide-react'
import { config } from '@/config'

interface ProductListProps {
  selectedBrand?: string
  selectedCategory?: string
}

export function ProductList({ selectedBrand, selectedCategory }: ProductListProps) {
  const { data: productsData, isLoading: productsLoading } = useQuery(getProductsOptions())

  const allProducts = productsData?.products || []
  
  // Filter products based on selected brand and category
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesBrand = selectedBrand === undefined || product.brand === selectedBrand
      const matchesCategory = selectedCategory === undefined || product.category === selectedCategory
      return matchesBrand && matchesCategory
    })
  }, [allProducts, selectedBrand, selectedCategory])

  const products = filteredProducts
  const isLoading = productsLoading

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {product.imageUrl && (
                <div className="shrink-0">
                  <img
                    src={`${config.apiBaseUrl}/images/${product.imageUrl}`}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <div className="flex gap-2 mt-1 text-sm opacity-70">
                  <span>{product.brand}</span>
                  <span>•</span>
                  <span className="capitalize">{product.category}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (product.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm">({product.rating || 0}/5)</span>
                </div>
                {product.comment && (
                  <p className="mt-2 text-sm text-muted-foreground italic">{product.comment}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
