import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { EnhancedButton } from "./enhanced-button"
import { EnhancedInput } from "./enhanced-input"
import { EnhancedBadge } from "./enhanced-badge"
import { EnhancedLoading } from "./enhanced-loading"

const enhancedTableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      variant: {
        default: "bg-card",
        striped: "bg-card",
        bordered: "bg-card border border-border",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface Column<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  width?: string | number
  align?: "left" | "center" | "right"
  className?: string
}

export interface EnhancedDataTableProps<T>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedTableVariants> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
  filterable?: boolean
  sortable?: boolean
  selectable?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  actions?: {
    label: string
    icon?: React.ReactNode
    onClick: (selectedRows: T[]) => void
    variant?: "default" | "destructive" | "outline"
  }[]
  rowActions?: {
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: "default" | "destructive" | "outline"
  }[]
  onRowClick?: (row: T) => void
  onRefresh?: () => void
  onExport?: () => void
}

const EnhancedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  emptyMessage = "No data available",
  searchable = true,
  searchPlaceholder = "Search...",
  filterable = true,
  sortable = true,
  selectable = false,
  pagination,
  actions = [],
  rowActions = [],
  onRowClick,
  onRefresh,
  onExport,
  className,
  variant,
  size,
  ...props
}: EnhancedDataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<{
    key: string | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [filters, setFilters] = React.useState<Record<string, string>>({})

  // Filter and search data
  const filteredData = React.useMemo(() => {
    let filtered = data

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        )
      }
    })

    return filtered
  }, [data, searchTerm, filters])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData

    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return sortedData.slice(start, end)
  }, [sortedData, pagination])

  const handleSort = (key: string) => {
    if (!sortable) return

    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedData.map((_, index) => index.toString())))
    }
  }

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows)
    const key = index.toString()
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedRows(newSelected)
  }

  const getSelectedRowsData = () => {
    return paginatedData.filter((_, index) => selectedRows.has(index.toString()))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <EnhancedLoading size="lg" text="Loading data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-destructive mb-2">Error loading data</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          {onRefresh && (
            <EnhancedButton onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </EnhancedButton>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" {...props}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {searchable && (
            <div className="w-full sm:w-80">
              <EnhancedInput
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          )}
          
          {filterable && (
            <EnhancedButton variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </EnhancedButton>
          )}
        </div>

        <div className="flex gap-2">
          {onRefresh && (
            <EnhancedButton variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </EnhancedButton>
          )}
          
          {onExport && (
            <EnhancedButton variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </EnhancedButton>
          )}
        </div>
      </div>

      {/* Actions */}
      {actions.length > 0 && selectedRows.size > 0 && (
        <div className="flex gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedRows.size} selected
          </span>
          {actions.map((action, index) => (
            <EnhancedButton
              key={index}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => action.onClick(getSelectedRowsData())}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </EnhancedButton>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <table className={cn(enhancedTableVariants({ variant, size }), className)}>
          <thead>
            <tr className="border-b bg-muted/50">
              {selectable && (
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {sortable && column.sortable && (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className="hover:text-foreground transition-colors"
                      >
                        {sortConfig.key === String(column.key) ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <div className="h-4 w-4 opacity-50">
                            <ChevronUp className="h-2 w-2" />
                            <ChevronDown className="h-2 w-2 -mt-1" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {rowActions.length > 0 && (
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                    selectedRows.has(index.toString()) && "bg-muted"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index.toString())}
                        onChange={() => handleSelectRow(index)}
                        className="rounded border-border"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-4 py-2",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : String(row[column.key] || "")}
                    </td>
                  ))}
                  {rowActions.length > 0 && (
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {rowActions.map((action, actionIndex) => (
                          <EnhancedButton
                            key={actionIndex}
                            variant={action.variant || "ghost"}
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              action.onClick(row)
                            }}
                            title={action.label}
                          >
                            {action.icon || <MoreHorizontal className="h-4 w-4" />}
                          </EnhancedButton>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          
          <div className="flex items-center gap-2">
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </EnhancedButton>
            
            <span className="text-sm">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Next
            </EnhancedButton>
          </div>
        </div>
      )}
    </div>
  )
}

export { EnhancedDataTable, enhancedTableVariants }


