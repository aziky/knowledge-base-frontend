// Shared type definitions for the application

export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// You can add more shared types here as your project grows
export interface Project {
  id: string
  projectName: string
  projectRole: string
  joinedAt: string
  removedAt: string | null
}

export interface ProjectListResponse {
  content: Project[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}