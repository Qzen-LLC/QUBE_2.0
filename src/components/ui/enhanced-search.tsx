import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Search, X, Filter, SortAsc, SortDesc } from "lucide-react"
import { EnhancedInput } from "./enhanced-input"
import { EnhancedButton } from "./enhanced-button"
import { EnhancedBadge } from "./enhanced-badge"

const enhancedSearchVariants = cva(
  "relative",
  {
    variants: {
      variant: {
        default: "",
        minimal: "",
        expanded: "",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SearchFilter {
  id: string
  label: string
  type: "text" | "select" | "date" | "number" | "boolean"
  options?: Array<{ value: string; label: string }>
  value?: any
}

export interface SearchSort {
  id: string
  label: string
  direction: "asc" | "desc"
}

export interface EnhancedSearchProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedSearchVariants> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  filters?: SearchFilter[]
  onFilterChange?: (filters: SearchFilter[]) => void
  sorts?: SearchSort[]
  onSortChange?: (sorts: SearchSort[]) => void
  showFilters?: boolean
  showSorts?: boolean
  loading?: boolean
  resultsCount?: number
  onSearch?: () => void
  onAdvancedSearch?: () => void
}

const EnhancedSearch = React.forwardRef<HTMLDivElement, EnhancedSearchProps>(
  ({ 
    className, 
    variant, 
    size, 
    value, 
    onChange, 
    onClear,
    placeholder = "Search...",
    suggestions = [],
    onSuggestionClick,
    filters = [],
    onFilterChange,
    sorts = [],
    onSortChange,
    showFilters = false,
    showSorts = false,
    loading = false,
    resultsCount,
    onSearch,
    onAdvancedSearch,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [activeFilters, setActiveFilters] = React.useState<SearchFilter[]>(filters)
    const [activeSorts, setActiveSorts] = React.useState<SearchSort[]>(sorts)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      setShowSuggestions(newValue.length > 0 && suggestions.length > 0)
    }

    // Handle clear
    const handleClear = () => {
      onChange("")
      setShowSuggestions(false)
      onClear?.()
      inputRef.current?.focus()
    }

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
      onChange(suggestion)
      setShowSuggestions(false)
      onSuggestionClick?.(suggestion)
    }

    // Handle filter change
    const handleFilterChange = (filterId: string, newValue: any) => {
      const updatedFilters = activeFilters.map(filter =>
        filter.id === filterId ? { ...filter, value: newValue } : filter
      )
      setActiveFilters(updatedFilters)
      onFilterChange?.(updatedFilters)
    }

    // Handle sort change
    const handleSortChange = (sortId: string) => {
      const updatedSorts = activeSorts.map(sort =>
        sort.id === sortId
          ? { ...sort, direction: sort.direction === "asc" ? "desc" : "asc" }
          : sort
      )
      setActiveSorts(updatedSorts)
      onSortChange?.(updatedSorts)
    }

    // Handle key down
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        onSearch?.()
        setShowSuggestions(false)
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
      }
    }

    // Count active filters
    const activeFilterCount = activeFilters.filter(filter => filter.value).length

    return (
      <div
        ref={ref}
        className={cn(enhancedSearchVariants({ variant, size }), className)}
        {...props}
      >
        {/* Main Search Input */}
        <div className="relative">
          <EnhancedInput
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              value ? (
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
            isLoading={loading}
            className="pr-20"
          />

          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {showFilters && (
              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "transition-colors",
                  activeFilterCount > 0 && "text-primary"
                )}
                title="Filters"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </EnhancedButton>
            )}

            {showSorts && (
              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Sort"
              >
                <SortAsc className="h-4 w-4" />
              </EnhancedButton>
            )}

            {onAdvancedSearch && (
              <EnhancedButton
                variant="ghost"
                size="icon-sm"
                onClick={onAdvancedSearch}
                title="Advanced Search"
              >
                <Search className="h-4 w-4" />
              </EnhancedButton>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Expanded Filters and Sorts */}
        {isExpanded && (showFilters || showSorts) && (
          <div className="mt-2 p-4 bg-muted rounded-lg space-y-4">
            {/* Filters */}
            {showFilters && (
              <div>
                <h4 className="text-sm font-medium mb-2">Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeFilters.map((filter) => (
                    <div key={filter.id} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {filter.label}
                      </label>
                      {filter.type === "text" && (
                        <input
                          type="text"
                          value={filter.value || ""}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded"
                          placeholder={`Filter by ${filter.label.toLowerCase()}`}
                        />
                      )}
                      {filter.type === "select" && (
                        <select
                          value={filter.value || ""}
                          onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded"
                        >
                          <option value="">All</option>
                          {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sorts */}
            {showSorts && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sort</h4>
                <div className="flex flex-wrap gap-2">
                  {activeSorts.map((sort) => (
                    <EnhancedButton
                      key={sort.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSortChange(sort.id)}
                      className="flex items-center gap-1"
                    >
                      {sort.label}
                      {sort.direction === "asc" ? (
                        <SortAsc className="h-3 w-3" />
                      ) : (
                        <SortDesc className="h-3 w-3" />
                      )}
                    </EnhancedButton>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Active Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {activeFilters
                    .filter(filter => filter.value)
                    .map((filter) => (
                      <EnhancedBadge
                        key={filter.id}
                        variant="secondary"
                        dismissible
                        onDismiss={() => handleFilterChange(filter.id, undefined)}
                      >
                        {filter.label}: {String(filter.value)}
                      </EnhancedBadge>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {resultsCount !== undefined && (
          <div className="mt-2 text-xs text-muted-foreground">
            {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
          </div>
        )}
      </div>
    )
  }
)
EnhancedSearch.displayName = "EnhancedSearch"

export { EnhancedSearch, enhancedSearchVariants }


