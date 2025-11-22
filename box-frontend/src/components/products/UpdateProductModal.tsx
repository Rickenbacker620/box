import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  putProductsByIdMutation,
  getProductsQueryKey,
  getBrandsOptions,
} from '@/client/@tanstack/react-query.gen'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Star } from 'lucide-react'

const CATEGORIES = [
  'food',
  'snack',
  'ice-cream',
  'drink',
  'fragrance',
  'personal-care',
  'beauty',
  'household',
  'electronics',
  'other',
] as const

type Category = typeof CATEGORIES[number]

interface Product {
  id: string
  name: string
  brand: string
  category: string
  rating: number
  comment?: string | null
  imageUrl?: string | null
}

interface UpdateProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function UpdateProductModal({ open, onOpenChange, product }: UpdateProductModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    brand: '',
    category: 'food' as Category,
    rating: 5,
    comment: '',
  })

  const { data: brandsData } = useQuery(getBrandsOptions())
  const brands = brandsData?.brands || []

  const updateProductMutation = useMutation({
    ...putProductsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
      onOpenChange(false)
    },
  })

  // Reset form when product changes or modal opens
  useEffect(() => {
    if (product && open) {
      setFormData({
        brand: product.brand || '',
        category: (product.category as Category) || 'food',
        rating: product.rating || 5,
        comment: product.comment || '',
      })
    }
  }, [product, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    
    updateProductMutation.mutate({
      path: { id: product.id },
      body: {
        brand: formData.brand,
        category: formData.category,
        rating: formData.rating,
        comment: formData.comment || undefined,
      },
    })
  }

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating })
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <div className="p-2 border border-border rounded bg-muted/50">
              <p className="text-sm font-medium">{product.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">Product name cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            {brands.length > 0 ? (
              <Select
                required
                value={formData.brand}
                onValueChange={(value) => setFormData({ ...formData, brand: value })}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Enter brand name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              required
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">({formData.rating}/5)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={3}
              placeholder="Add a comment about this product"
            />
            <p className="text-sm text-muted-foreground">Optional</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateProductMutation.isPending}
              className="flex-1"
            >
              {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}