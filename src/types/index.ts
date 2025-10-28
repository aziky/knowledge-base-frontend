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
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}