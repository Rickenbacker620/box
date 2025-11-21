import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProductsOptions,
  postProductsMutation,
  putProductsByIdMutation,
  deleteProductsByIdMutation,
  getProductsQueryKey,
  getBrandsOptions,
  postBrandsMutation,
  deleteBrandsByIdMutation,
  getBrandsQueryKey,
} from './client/@tanstack/react-query.gen'
import { client } from './client/client.gen'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Textarea } from './components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog'
import { Loader2 } from 'lucide-react'

// Set up authentication
client.setConfig({
  baseUrl: 'https://box-worker.fu78sion-box.workers.dev',
  headers: {
    Authorization: 'Bearer supersecret'
  }
})

// Category options from the API
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

function App() {
  const queryClient = useQueryClient()
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'food' as Category,
    rating: 5,
    comment: '',
  })
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [brandFormData, setBrandFormData] = useState({
    name: '',
  })

  // Query for products list
  const { data: productsData, isLoading: productsLoading } = useQuery(getProductsOptions())
  
  // Query for brands list
  const { data: brandsData } = useQuery(getBrandsOptions())

  // Mutation for creating product
  const createProductMutation = useMutation({
    ...postProductsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
      setIsProductModalOpen(false)
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

  // Mutation for creating brand
  const createBrandMutation = useMutation({
    ...postBrandsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandsQueryKey() })
      setIsBrandModalOpen(false)
      setBrandFormData({ name: '' })
    },
  })

  // Mutation for deleting brand
  const deleteBrandMutation = useMutation({
    ...deleteBrandsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandsQueryKey() })
    },
  })

  // Mutation for updating product
  const updateProductMutation = useMutation({
    ...putProductsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
    },
  })

  // Mutation for deleting product
  const deleteProductMutation = useMutation({
    ...deleteProductsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() })
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Convert to base64
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

    // Find image in clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          // Convert to base64
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

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createBrandMutation.mutate({
      body: {
        name: brandFormData.name,
      },
    })
  }

  const handleDeleteBrand = (id: string) => {
    if (confirm('Are you sure you want to delete this brand? This will fail if the brand has associated products.')) {
      deleteBrandMutation.mutate({
        path: { id },
      })
    }
  }

  const products = productsData?.products || []
  const brands = brandsData?.brands || []
  const isLoading = productsLoading || createProductMutation.isPending || updateProductMutation.isPending || deleteProductMutation.isPending || createBrandMutation.isPending || deleteBrandMutation.isPending

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">Product Manager</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
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
                Create Brand
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
          <CardContent>
            {isLoading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products yet. Create one to get started.</p>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {product.imageUrl && (
                          <div className="shrink-0">
                            <img
                              src={`https://box-worker.fu78sion-box.workers.dev/images/${product.imageUrl}`}
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
            )}
          </CardContent>
        </Card>

        {/* Brands Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Brands</CardTitle>
              <Badge variant="secondary">
                {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {brands.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No brands yet. Create one to get started.</p>
              </div>
            )}

            {brands.length > 0 && (
              <div className="space-y-3">
                {brands.map((brand) => (
                  <Card key={brand.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{brand.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">ID: {brand.id}</p>
                        </div>
                        <Button
                          onClick={() => handleDeleteBrand(brand.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
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
                  {/* Invisible input to capture paste events */}
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
                onClick={() => setIsProductModalOpen(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Brand Modal */}
      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Brand</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBrandSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                type="text"
                required
                value={brandFormData.name}
                onChange={(e) => setBrandFormData({ name: e.target.value })}
                placeholder="Enter brand name (e.g., Frito-Lay, Nongshim)"
              />
              <p className="text-sm text-muted-foreground">The brand ID will be automatically generated from the name</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createBrandMutation.isPending}
                className="flex-1"
              >
                {createBrandMutation.isPending ? 'Creating...' : 'Create Brand'}
              </Button>
              <Button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App