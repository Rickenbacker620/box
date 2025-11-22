import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBrandsOptions,
  postBrandsMutation,
  deleteBrandsByIdMutation,
  getBrandsQueryKey,
} from '../../client/@tanstack/react-query.gen'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Loader2, X } from 'lucide-react'

interface ManageBrandsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageBrandsModal({ open, onOpenChange }: ManageBrandsModalProps) {
  const queryClient = useQueryClient()
  const [brandFormData, setBrandFormData] = useState({ name: '' })
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null)

  const { data: brandsData } = useQuery(getBrandsOptions())
  const brands = brandsData?.brands || []

  const createBrandMutation = useMutation({
    ...postBrandsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandsQueryKey() })
      setBrandFormData({ name: '' })
    },
  })

  const deleteBrandMutation = useMutation({
    ...deleteBrandsByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandsQueryKey() })
      setBrandToDelete(null)
    },
  })

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createBrandMutation.mutate({
      body: {
        name: brandFormData.name,
      },
    })
  }

  const handleDeleteBrand = (id: string) => {
    deleteBrandMutation.mutate({
      path: { id },
    })
  }

  const handleDeleteBrandClick = (id: string) => {
    setBrandToDelete(id)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Brands</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Existing Brands */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Existing Brands</Label>
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No brands yet. Add one below to get started.</p>
              ) : (
                <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-md min-h-[60px]">
                  {brands.map((brand) => (
                    <Badge
                      key={brand.id}
                      variant="secondary"
                      className="text-sm py-1.5 px-3 cursor-default flex items-center gap-2 hover:bg-secondary/80"
                    >
                      <span>{brand.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrandClick(brand.id)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${brand.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Brand */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Add New Brand</Label>
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
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createBrandMutation.isPending}
                    className="flex-1"
                  >
                    {createBrandMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Brand'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      onOpenChange(false)
                      setBrandFormData({ name: '' })
                    }}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Confirmation Dialog */}
      <Dialog open={brandToDelete !== null} onOpenChange={(open) => !open && setBrandToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Brand?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <strong>{brands.find(b => b.id === brandToDelete)?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This will fail if the brand has associated products.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => brandToDelete && handleDeleteBrand(brandToDelete)}
                disabled={deleteBrandMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                {deleteBrandMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setBrandToDelete(null)}
                variant="outline"
                disabled={deleteBrandMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
