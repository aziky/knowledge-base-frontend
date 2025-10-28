import { useState, useEffect } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { projectApi, type ApiError } from "@/services/api"
import type { Project, ProjectListResponse } from "@/types"

export function ProjectTable() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "projectName",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("projectName")}</div>
      ),
    },
    {
      accessorKey: "projectRole",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("projectRole") as string
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
            {formatRole(role)}
          </span>
        )
      },
    },
    {
      accessorKey: "joinedAt",
      header: "Joined Date",
      cell: ({ row }) => <div>{row.getValue("joinedAt")}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="text-right">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewProject(project)}
            >
              View
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  const table = useReactTable({
    data: projects,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response: ProjectListResponse = await projectApi.getProjects()
      setProjects(response.content)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProject = (project: Project) => {
    // TODO: Implement project view functionality
    console.log('View project:', project)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading projects...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchProjects} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">No projects found</p>
        <p className="text-sm text-muted-foreground">Create your first project to get started</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter projects..."
          value={(table.getColumn("projectName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("projectName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => table.previousPage()}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {/* Page numbers */}
            {(() => {
              const totalPages = table.getPageCount()
              const currentPage = table.getState().pagination.pageIndex
              const pages = []
              
              // Always show first page
              if (totalPages > 0) {
                pages.push(
                  <PaginationItem key={0}>
                    <PaginationLink
                      onClick={() => table.setPageIndex(0)}
                      isActive={currentPage === 0}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              
              // Show ellipsis if there are pages between first and current-1
              if (currentPage > 2) {
                pages.push(
                  <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              
              // Show current page and adjacent pages
              for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
                pages.push(
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => table.setPageIndex(i)}
                      isActive={currentPage === i}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              
              // Show ellipsis if there are pages between current+1 and last
              if (currentPage < totalPages - 3) {
                pages.push(
                  <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              
              // Always show last page (if more than 1 page)
              if (totalPages > 1) {
                pages.push(
                  <PaginationItem key={totalPages - 1}>
                    <PaginationLink
                      onClick={() => table.setPageIndex(totalPages - 1)}
                      isActive={currentPage === totalPages - 1}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              
              return pages
            })()}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => table.nextPage()}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      
      {/* Page info */}
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
      </div>
    </div>
  )
}