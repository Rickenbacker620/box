import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProductsOptions,
  putProductsByIdMutation,
  deleteProductsByIdMutation,
  getProductsQueryKey,
} from '@/client/@tanstack/react-query.gen'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Loader2 } from 'lucide-react'
import { config } from '@/config'

export function ProductList() {
  const queryClient = useQueryClient()
  const { data: productsData, isLoading: productsLoading } = useQuery(getProductsOptions())

  const updateProductMutation = useMutation({
    ...putProductsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
    },
  })

  const deleteProductMutation = useMutation({
    ...deleteProductsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
    },
  })

  const handleUpdateProduct = (id: string) => {
    updateProductMutation.mutate({
      path: { id },
      body: {
        rating: 5,
        comment: 'Updated to 5 stars',
      },
    })
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate({
        path: { id },
      })
    }
  }

  const products = productsData?.products || []
  const isLoading = productsLoading || updateProductMutation.isPending || deleteProductMutation.isPending

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
        <p className="text-muted-foreground">No products yet. Create one to get started.</p>
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
                  <div className="rating rating-sm">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <input
                        key={star}
                        type="radio"
                        className="mask mask-star-2 bg-warning"
                        checked={star === product.rating}
                        readOnly
                      />
                    ))}
                  </div>
                  <span className="text-sm">({product.rating}/5)</span>
                </div>
                {product.comment && (
                  <p className="mt-2 text-sm text-muted-foreground italic">{product.comment}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={() => handleUpdateProduct(product.id)}
                  variant="outline"
                  size="sm"
                >
                  Update
                </Button>
                <Button
                  onClick={() => handleDeleteProduct(product.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
