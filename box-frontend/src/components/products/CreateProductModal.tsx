import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  postProductsMutation,
  getProductsQueryKey,
  getBrandsOptions,
} from '@/client/@tanstack/react-query.gen'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

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

interface CreateProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductModal({ open, onOpenChange }: CreateProductModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'food' as Category,
    rating: 5,
    comment: '',
  })
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  const { data: brandsData } = useQuery(getBrandsOptions())
  const brands = brandsData?.brands || []

  const createProductMutation = useMutation({
    ...postProductsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
      onOpenChange(false)
      setFormData({
        name: '',
        brand: '',
        category: 'food',
        rating: 5,
        comment: '',
      })
      setImageBase64(null)
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageBase64(null)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setImageBase64(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
        break
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    createProductMutation.mutate({
      body: {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        rating: formData.rating,
        comment: formData.comment || undefined,
        imageBase64: imageBase64 || undefined,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
            />
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
              <Input
                id="brand"
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Enter brand name"
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
            <Label htmlFor="rating">Rating ({formData.rating}/5)</Label>
            <input
              id="rating"
              type="range"
              min="1"
              max="5"
              step="1"
              required
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
              className="w-full"
            />
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

          <div className="space-y-2">
            <Label>Product Image</Label>
            {imageBase64 ? (
              <div className="relative inline-block">
                <img
                  src={imageBase64}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded"
                />
                <Button
                  type="button"
                  onClick={handleRemoveImage}
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 absolute -top-2 -right-2 rounded-full"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <div
                onPaste={handlePaste}
                className="relative"
              >
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-muted-foreground">Click to upload or paste image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, GIF (max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                  />
                </label>
                <input
                  type="text"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onPaste={handlePaste}
                  placeholder="Paste image here"
                  readOnly
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">Optional</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="flex-1"
            >
              {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
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
