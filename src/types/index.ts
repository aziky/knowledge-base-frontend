// Shared type definitions for the application

export interface User {
  id: string
  email: string
  fullName?: string
  role?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// You can add more shared types here as your project grows
export interface Project {
  projectId: string
  projectName: string
  projectRole: string
  joinedAt: string
  removedAt: string | null
  status: string
  lockedAt: string | null
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

export interface Document {
  id: string
  fileName: string
  fileType: string
  uploadedAt: string
  uploadedBy?: string
  status: string
}

export interface Video {
  id: string
  fileName: string
  fileType: string
  uploadedAt: string
  uploadedBy?: string
  status: string
}

export interface Folder {
  id: string
  folderName: string
  createdAt: string
}

export interface Member {
  id: string,
  email: string
  fullName: string
  role: string
  joinedAt: string
  removedAt: string | null
}

export interface ProjectDetails {
  projectId: string
  projectName: string
  description: string
  createdAt: string
  status: string
  userRole: string
  lockedAt: string | null
  members: Member[]
  folders: Folder[]
  documents: Document[]
  videos: Video[]
}

// Interface for user invitation data
export interface InvitationUser {
  userId: string
  fullName?: string
  email: string,
  role: string
}


// Interface for project invitation response
export interface ProjectInvitationResponse {
  projectId: string
  invitedUsers: InvitationUser[]
}




