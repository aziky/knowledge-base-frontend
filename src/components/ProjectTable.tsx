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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-slate-700 hover:text-slate-900"
        >
          Project Name
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div>
            <div className="font-semibold text-slate-900">{row.getValue("projectName")}</div>
            <div className="text-sm text-slate-500">Project ID: {row.original.id.slice(0, 8)}...</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "projectRole",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-slate-700 hover:text-slate-900"
        >
          Role
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </Button>
      ),
      cell: ({ row }) => {
        const role = row.getValue("projectRole") as string
        const getRoleColor = (role: string) => {
          switch (role.toLowerCase()) {
            case 'creator':
              return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
            case 'admin':
              return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            case 'member':
              return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            default:
              return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
          }
        }
        return (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRoleColor(role)} shadow-sm`}>
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {formatRole(role)}
          </span>
        )
      },
    },
    {
      accessorKey: "joinedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-slate-700 hover:text-slate-900"
        >
          Joined Date
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-600">{row.getValue("joinedAt")}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right font-semibold text-slate-700">Actions</div>,
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="text-right space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewProject(project)}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
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
    <div className="w-full space-y-6">
      {/* Enhanced Search */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search projects by name..."
            value={(table.getColumn("projectName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("projectName")?.setFilterValue(event.target.value)
            }
            className="pl-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span>{table.getFilteredRowModel().rows.length} projects found</span>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="border-b border-slate-200 py-4">
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
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
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
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-slate-500">No projects match your search</div>
                  </div>
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