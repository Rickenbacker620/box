"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { brandsQueryOptions, productsQueryOptions } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ProductFiltersProps {
  selectedBrand?: string
  selectedCategory?: string
  onBrandChange: (brand?: string) => void
  onCategoryChange: (category?: string) => void
}

export function ProductFilters({
  selectedBrand,
  selectedCategory,
  onBrandChange,
  onCategoryChange,
}: ProductFiltersProps) {
  const [brandOpen, setBrandOpen] = React.useState(false)
  const [categoryOpen, setCategoryOpen] = React.useState(false)

  const { data: brandsData } = useQuery(brandsQueryOptions)
  const { data: productsData } = useQuery(productsQueryOptions)

  // Extract unique categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>()
    const products = productsData ?? []
    products.forEach(product => {
      if (product.category) {
        uniqueCategories.add(product.category)
      }
    })
    return Array.from(uniqueCategories).sort()
  }, [productsData])

  const selectedBrandLabel = selectedBrand
    ? selectedBrand
    : "All brands"

  const selectedCategoryLabel = selectedCategory
    ? selectedCategory
    : "All categories"

  return (
    <div className="flex flex-wrap gap-4">
      {/* Brand Filter */}
      <div className="space-y-2">
        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={brandOpen}
              className="w-[200px] justify-between"
            >
              {selectedBrandLabel}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search brands..." />
              <CommandList>
                <CommandEmpty>No brand found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onBrandChange(undefined)
                      setBrandOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBrand === undefined ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All brands
                  </CommandItem>
                  {(brandsData ?? []).map((brand) => (
                    <CommandItem
                      key={brand.id}
                      value={brand.name}
                      onSelect={() => {
                        onBrandChange(brand.name)
                        setBrandOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBrand === brand.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {brand.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className="w-[200px] justify-between"
            >
              {selectedCategoryLabel}
              <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onCategoryChange(undefined)
                      setCategoryOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCategory === undefined ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All categories
                  </CommandItem>
                  {categories.map((category) => (
                    <CommandItem
                      key={category}
                      value={category}
                      onSelect={() => {
                        onCategoryChange(category)
                        setCategoryOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategory === category ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {category}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear Filters Button */}
      {(selectedBrand || selectedCategory) && (
        <div className="flex items-end">
          <Button
            variant="ghost"
            onClick={() => {
              onBrandChange(undefined)
              onCategoryChange(undefined)
            }}
            className="h-10"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
