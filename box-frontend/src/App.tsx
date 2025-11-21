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
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 shadow">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">Product Manager</h1>
          <p className="text-base-content/70 mt-1">Manage your product catalog</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Actions Section */}
        <section className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Actions</h2>
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
          </div>
        </section>

        {/* Products Section */}
        <section className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Products</h2>
              <div className="badge badge-neutral">
                {products.length} {products.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-base-content/70">No products yet. Create one to get started.</p>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow"
                  >
                    <div className="card-body p-4">
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
                            <p className="mt-2 text-sm opacity-70 italic">{product.comment}</p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Brands Section */}
        <section className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Brands</h2>
              <div className="badge badge-neutral">
                {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
              </div>
            </div>

            {brands.length === 0 && (
              <div className="text-center py-8">
                <p className="text-base-content/70">No brands yet. Create one to get started.</p>
              </div>
            )}

            {brands.length > 0 && (
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{brand.name}</h3>
                          <p className="text-sm opacity-70 mt-1">ID: {brand.id}</p>
                        </div>
                        <Button
                          onClick={() => handleDeleteBrand(brand.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Create Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card bg-base-100 w-full max-w-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl">Create Product</h2>
                <Button
                  onClick={() => setIsProductModalOpen(false)}
                  variant="ghost"
                  size="icon"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Product Name</legend>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Enter product name"
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Brand</legend>
                  {brands.length > 0 ? (
                    <select
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="select"
                    >
                      <option value="">Select a brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="input"
                      placeholder="Enter brand name"
                    />
                  )}
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Category</legend>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Rating ({formData.rating}/5)</legend>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    required
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="range range-primary"
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Comment</legend>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="input resize-none"
                    rows={3}
                    placeholder="Add a comment about this product"
                  />
                  <p className="label">Optional</p>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Product Image</legend>
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
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded cursor-pointer hover:bg-base-200 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <p className="text-sm opacity-70">Click to upload or paste image</p>
                          <p className="text-xs opacity-70 mt-1">PNG, JPG, WebP, GIF (max 5MB)</p>
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
                  <p className="label">Optional</p>
                </fieldset>

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
            </div>
          </div>
        </div>
      )}

      {/* Create Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card bg-base-100 w-full max-w-md">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl">Create Brand</h2>
                <Button
                  onClick={() => setIsBrandModalOpen(false)}
                  variant="ghost"
                  size="icon"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleBrandSubmit} className="space-y-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Brand Name</legend>
                  <input
                    type="text"
                    required
                    value={brandFormData.name}
                    onChange={(e) => setBrandFormData({ name: e.target.value })}
                    className="input"
                    placeholder="Enter brand name (e.g., Frito-Lay, Nongshim)"
                  />
                  <p className="label">The brand ID will be automatically generated from the name</p>
                </fieldset>

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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App