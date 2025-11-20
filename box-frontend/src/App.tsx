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

// Set up authentication
client.setConfig({
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
      <header className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-text">Product Manager</h1>
          <p className="text-text-secondary mt-1">Manage your product catalog</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Actions Section */}
        <section className="bg-white border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-text mb-4">Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-secondary transition-colors"
            >
              Create Product
            </button>
            <button
              onClick={() => setIsBrandModalOpen(true)}
              className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-secondary transition-colors"
            >
              Create Brand
            </button>
          </div>
        </section>

        {/* Products Section */}
        <section className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">Products</h2>
            <span className="text-sm text-text-secondary bg-surface px-3 py-1 rounded-full">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <p className="text-text-secondary">Loading...</p>
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary">No products yet. Create one to get started.</p>
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-border rounded-lg p-4 hover:bg-surface transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {product.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={`http://localhost:8787/images/${product.imageUrl}`}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded border border-border"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text">{product.name}</h3>
                      <div className="flex gap-2 mt-1 text-sm text-text-secondary">
                        <span>{product.brand}</span>
                        <span>•</span>
                        <span className="capitalize">{product.category}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium">Rating:</span>
                        <span className="text-sm">{product.rating}/5</span>
                      </div>
                      {product.comment && (
                        <p className="mt-2 text-sm text-text-secondary italic">{product.comment}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleUpdateProduct(product.id)}
                        className="px-3 py-1.5 text-sm border border-border bg-white text-text rounded hover:bg-surface transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1.5 text-sm border border-border bg-white text-text rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Brands Section */}
        <section className="bg-white border border-border rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">Brands</h2>
            <span className="text-sm text-text-secondary bg-surface px-3 py-1 rounded-full">
              {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
            </span>
          </div>

          {brands.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary">No brands yet. Create one to get started.</p>
            </div>
          )}

          {brands.length > 0 && (
            <div className="space-y-3">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="border border-border rounded-lg p-4 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text">{brand.name}</h3>
                      <p className="text-sm text-text-secondary mt-1">ID: {brand.id}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="px-3 py-1.5 text-sm border border-border bg-white text-text rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Create Product</h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-text-secondary hover:text-text text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-md px-4 py-2.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Brand *
                </label>
                {brands.length > 0 ? (
                  <select
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-md px-4 py-2.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
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
                    className="w-md px-4 py-2.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter brand name"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-md px-4 py-2.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Rating * ({formData.rating}/5)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  required
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #000 0%, #000 ${(formData.rating - 1) * 25}%, #f5f5f5 ${(formData.rating - 1) * 25}%, #f5f5f5 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-text-secondary mt-2">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-md px-4 py-2.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add a comment about this product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Product Image (optional)
                </label>
                <div className="space-y-3">
                  {imageBase64 ? (
                    <div className="relative inline-block">
                      <img
                        src={imageBase64}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border border-border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onPaste={handlePaste}
                      className="relative"
                    >
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded cursor-pointer hover:bg-surface transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <p className="text-sm text-text-secondary">Click to upload or paste image</p>
                          <p className="text-xs text-text-secondary mt-1">PNG, JPG, WebP, GIF (max 5MB)</p>
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
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 border border-border bg-white text-text font-medium rounded hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Create Brand</h2>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="text-text-secondary hover:text-text text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData({ name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter brand name (e.g., Frito-Lay, Nongshim)"
                />
                <p className="text-xs text-text-secondary mt-1">
                  The brand ID will be automatically generated from the name
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createBrandMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBrandMutation.isPending ? 'Creating...' : 'Create Brand'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2.5 border border-border bg-white text-text font-medium rounded hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App