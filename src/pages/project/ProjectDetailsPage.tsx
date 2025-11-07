import type React from "react"

import { useState, useEffect } from "react"
import { useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ChatPanel } from "@/components/chat-panel"
import { projectApi, type ApiError } from "@/services/api"
import type { ProjectDetails, Member } from "@/types"

export default function ProjectDetailsPage() {
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("success")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertTitle, setAlertTitle] = useState("")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([])
  const [duplicateFileObjects, setDuplicateFileObjects] = useState<UnifiedFile[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  
  // Inline editing states
  const [editingProjectName, setEditingProjectName] = useState("")
  const [editingProjectDescription, setEditingProjectDescription] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  // File upload states
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handler to trigger file input
  const handleAddFilesClick = () => {
    fileInputRef.current?.click()
  }

  // Handler for file input change
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    const allFiles = getAllFiles()
    const existingNames = new Set(allFiles.map((f) => f.fileName.toLowerCase()))
    const duplicates = files.filter((f) => existingNames.has(f.name.toLowerCase()))
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map((f) => f.name)
      const duplicateObjects = allFiles.filter((existingFile) => 
        duplicateNames.some(name => name.toLowerCase() === existingFile.fileName.toLowerCase())
      )
      setDuplicateFiles(duplicateNames)
      setDuplicateFileObjects(duplicateObjects)
      setAlertType("warning")
      setAlertTitle("Duplicate File Warning")
      setAlertMessage("The following files already exist:")
      setAlertOpen(true)
      setPendingFiles(files)
      return
    }
    uploadFiles(files)
  }

  // Upload files helper
  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 30
        })
      }, 300)

      await projectApi.addFilesToProject(projectId!, files)

      clearInterval(progressInterval)
      setUploadProgress(100)

      await fetchProjectDetails(projectId!)
      setAlertType("success")
      setAlertTitle("Upload Successful")
      setAlertMessage("Files uploaded successfully!")
      setAlertOpen(true)
    } catch (err) {
      const apiError = err as ApiError
      setAlertType("error")
      setAlertTitle("Upload Error")
      setAlertMessage(apiError.message || "Failed to upload files")
      setAlertOpen(true)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setPendingFiles([])
      setDuplicateFiles([])
      setDuplicateFileObjects([])
    }
  }

  // Handler for confirming duplicate file replacement
  const handleAlertConfirm = async () => {
    setAlertOpen(false)
    if (alertType === "warning" && pendingFiles.length > 0) {
      // Delete existing duplicate files first
      if (duplicateFileObjects.length > 0) {
        try {
          setUploading(true)
          setUploadProgress(10)
          
          const filesToDelete = duplicateFileObjects.map(file => ({
            id: file.id,
            fileType: file.type
          }))
          
          await projectApi.deleteFilesFromProject(projectId!, filesToDelete)
          setUploadProgress(30)
          
          // Refresh project details to get updated file list
          await fetchProjectDetails(projectId!)
          setUploadProgress(50)
          
        } catch (err) {
          const apiError = err as ApiError
          setAlertType("error")
          setAlertTitle("Delete Error")
          setAlertMessage(apiError.message || "Failed to delete existing files")
          setAlertOpen(true)
          setUploading(false)
          setUploadProgress(0)
          return
        }
      }
      
      // Now upload the new files
      uploadFiles(pendingFiles)
    }
  }

  // Handler for closing alert without replacing
  const handleAlertClose = () => {
    setAlertOpen(false)
    setPendingFiles([])
    setDuplicateFiles([])
    setDuplicateFileObjects([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Handler for downloading files
  const handleDownloadFile = async (file: UnifiedFile) => {
    if (!projectId) return
    
    try {
      setAlertType("success")
      setAlertTitle("Downloading...")
      setAlertMessage(`Downloading ${file.fileName}...`)
      setAlertOpen(true)
      
      await projectApi.downloadFile(file.id, file.type, file.fileName)
      
      setAlertType("success")
      setAlertTitle("Download Successful")
      setAlertMessage(`${file.fileName} has been downloaded successfully!`)
      setAlertOpen(true)
    } catch (err) {
      const apiError = err as ApiError
      setAlertType("error")
      setAlertTitle("Download Error")
      setAlertMessage(apiError.message || "Failed to download file")
      setAlertOpen(true)
    }
  }

  // Handle entering edit mode
  const handleEnterEditMode = () => {
    setEditMode(true)
    setEditingProjectName(projectDetails?.projectName || "")
    setEditingProjectDescription(projectDetails?.description || "")
    setSelectedFiles([])
    setSelectedMembers([])
  }

  // Handle exiting edit mode
  const handleExitEditMode = () => {
    setEditMode(false)
    setSelectedFiles([])
    setSelectedMembers([])
    setDeleteConfirmationText("")
  }

  // Handle saving project info
  const handleSaveProjectInfo = async () => {
    if (!projectDetails || !editingProjectName.trim()) {
      setAlertType("error")
      setAlertTitle("Validation Error")
      setAlertMessage("Project name is required")
      setAlertOpen(true)
      return
    }

    setUploading(true)
    try {
      // 1. Update project info if changed
      const projectInfoChanged = 
        editingProjectName.trim() !== projectDetails.projectName ||
        editingProjectDescription.trim() !== projectDetails.description

      if (projectInfoChanged) {
        await projectApi.updateProject(projectDetails.projectId, {
          name: editingProjectName.trim(),
          description: editingProjectDescription.trim(),
        })
      }

      // 2. Delete selected files if any
      if (selectedFiles.length > 0) {
        const allFiles = getAllFiles()
        const filesToDelete = selectedFiles.map(fileId => {
          const file = allFiles.find(f => f.id === fileId)
          return {
            id: fileId,
            fileType: file?.type || "document"
          }
        })

        await projectApi.deleteFilesFromProject(projectDetails.projectId, filesToDelete)
      }

      // 3. Remove selected members if any
      if (selectedMembers.length > 0) {
        await projectApi.removeMembersFromProject(projectDetails.projectId, selectedMembers)
      }

      // Refresh project details and exit edit mode
      await fetchProjectDetails(projectDetails.projectId)
      setEditMode(false)
      setSelectedFiles([])
      setSelectedMembers([])
      
      setAlertType("success")
      setAlertTitle("Success")
      const changes = []
      if (projectInfoChanged) changes.push("project info")
      if (selectedFiles.length > 0) changes.push(`${selectedFiles.length} file(s) deleted`)
      if (selectedMembers.length > 0) changes.push(`${selectedMembers.length} member(s) removed`)
      
      setAlertMessage(changes.length > 0 ? `Updated: ${changes.join(", ")}` : "No changes to save")
      setAlertOpen(true)
    } catch (err) {
      const apiError = err as ApiError
      setAlertType("error")
      setAlertTitle("Save Error")
      setAlertMessage(apiError.message || "Failed to save changes")
      setAlertOpen(true)
    } finally {
      setUploading(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    )
  }

  // Handle select all files
  const handleSelectAllFiles = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(getAllFiles().map(f => f.id))
    } else {
      setSelectedFiles([])
    }
  }

  // Handle member selection
  const handleMemberSelect = (memberId: string, checked: boolean) => {
    setSelectedMembers(prev => 
      checked 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    )
  }

  // Handle removing members
  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!projectDetails || deleteConfirmationText !== projectDetails.projectName) {
      setAlertType("error")
      setAlertTitle("Validation Error")
      setAlertMessage("Please type the project name exactly to confirm deletion")
      setAlertOpen(true)
      return
    }

    setUploading(true)
    try {
      await projectApi.deleteProject(projectDetails.projectId, deleteReason.trim() || undefined)
      
      setAlertType("success")
      setAlertTitle("Success")
      setAlertMessage("Project deleted successfully!")
      setAlertOpen(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      const apiError = err as ApiError
      setAlertType("error")
      setAlertTitle("Delete Error")
      setAlertMessage(apiError.message || "Failed to delete project")
      setAlertOpen(true)
    } finally {
      setUploading(false)
    }
  }

  // Handle project reactivation
  const handleReactivateProject = async () => {
    if (!projectDetails) return

    setUploading(true)
    try {
      await projectApi.reactivateProject(projectDetails.projectId)
      
      setAlertType("success")
      setAlertTitle("Success")
      setAlertMessage("Project reactivated successfully!")
      setAlertOpen(true)
      
      // Refresh project details to update status
      await fetchProjectDetails(projectDetails.projectId)
    } catch (err) {
      const apiError = err as ApiError
      setAlertType("error")
      setAlertTitle("Reactivation Error")
      setAlertMessage(apiError.message || "Failed to reactivate project")
      setAlertOpen(true)
    } finally {
      setUploading(false)
    }
  }

  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination and search states
  const [filesPage, setFilesPage] = useState(1)
  const [filesSearch, setFilesSearch] = useState("")
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "document" | "video">("all")
  const itemsPerPage = 10

  // Unified file interface
  interface UnifiedFile {
    id: string
    fileName: string
    fileType: string
    uploadedBy?: string
    uploadedAt: string
    status: string
    type: "document" | "video"
  }

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails(projectId)
    }
  }, [projectId])

  useEffect(() => {
    if (alertOpen && alertType !== "warning") {
      const timer = setTimeout(() => {
        setAlertOpen(false)
      }, 3000) // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [alertOpen, alertType])

  const fetchProjectDetails = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const details = await projectApi.getProjectDetails(id)
      setProjectDetails(details)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || "Failed to load project details")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Filter and pagination helpers
  const getAllFiles = (): UnifiedFile[] => {
    if (!projectDetails) return []

    const documents: UnifiedFile[] = projectDetails.documents.map((doc) => ({
      ...doc,
      type: "document" as const,
    }))

    const videos: UnifiedFile[] = projectDetails.videos.map((video) => ({
      ...video,
      type: "video" as const,
    }))

    return [...documents, ...videos].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  const filterFiles = (files: UnifiedFile[]) => {
    let filtered = files.filter(
      (file) =>
        file.fileName.toLowerCase().includes(filesSearch.toLowerCase()) ||
        file.uploadedBy?.toLowerCase().includes(filesSearch.toLowerCase()),
    )

    if (fileTypeFilter !== "all") {
      filtered = filtered.filter((file) => file.type === fileTypeFilter)
    }

    return filtered
  }

  const paginateItems = <T,>(items: T[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes("pdf")) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded bg-red-100">
          <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          </svg>
        </div>
      )
    } else if (type.includes("doc")) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100">
          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          </svg>
        </div>
      )
    } else if (type.includes("mp4") || type.includes("video")) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-100">
          <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )
    } else if (type.includes("png") || type.includes("jpg") || type.includes("image")) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100">
          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
        <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        </svg>
      </div>
    )
  }

  // Simple pagination component
  const SimplePagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems: number
  }) => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-slate-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
        {totalItems} items
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          Previous
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="w-8 h-8"
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase()
    let colorClasses = ""

    switch (statusUpper) {
      case "COMPLETED":
        colorClasses = "bg-green-100 text-green-800 border-green-200"
        break
      case "IN_PROGRESS":
        colorClasses = "bg-yellow-100 text-yellow-800 border-yellow-200"
        break
      case "REVIEW":
        colorClasses = "bg-blue-100 text-blue-800 border-blue-200"
        break
      case "REJECTED":
        colorClasses = "bg-red-100 text-red-800 border-red-200"
        break
      default:
        colorClasses = "bg-gray-100 text-gray-800 border-gray-200"
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClasses}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => navigate(-1)} className="border-slate-300 hover:bg-slate-50">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Projects
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
              <CardTitle className="text-3xl font-bold text-slate-900">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Blurred overlay with loading spinner */}
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
            <span className="text-white font-medium">Loading project details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-destructive">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => projectId && fetchProjectDetails(projectId)} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!projectDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate(-1)} className="border-slate-300 hover:bg-slate-50">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Projects
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setChatOpen(true)}
                disabled={projectDetails.status === "INACTIVE"}
                className={projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {projectDetails.status === "INACTIVE" ? "Project Inactive" : "Chat"}
              </Button>
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleExitEditMode}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProjectInfo} disabled={uploading}>
                    {uploading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleEnterEditMode}
                  disabled={projectDetails.status === "INACTIVE"}
                  className={projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V8l-6-6z"
                    />
                  </svg>
                  {projectDetails.status === "INACTIVE" ? "Project Inactive" : "Edit Project"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Project Name
                  </label>
                  <Input
                    value={editingProjectName}
                    onChange={(e) => setEditingProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="text-2xl font-bold border-2 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Description
                  </label>
                  <textarea
                    value={editingProjectDescription}
                    onChange={(e) => setEditingProjectDescription(e.target.value)}
                    placeholder="Enter project description"
                    className="w-full min-h-[80px] px-3 py-2 border-2 border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-600"
                  />
                </div>
              </div>
            ) : (
              <>
                <CardTitle className="text-3xl font-bold text-slate-900">{projectDetails.projectName}</CardTitle>
                <CardDescription className="text-lg text-slate-600 mt-2">{projectDetails.description}</CardDescription>
              </>
            )}
            <div className="flex items-center space-x-6 mt-4 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Created: {formatDate(projectDetails.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>ID: {projectDetails.projectId}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Inactive Project Banner */}
        {projectDetails.status === "INACTIVE" && (
          <Card className="mb-8 shadow-xl border-0 bg-red-50/80 backdrop-blur-sm border-red-200">
            <CardHeader className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <CardTitle className="text-xl text-red-900">Project Inactive</CardTitle>
                    <CardDescription className="text-red-700 mt-1">
                      This project has been deactivated{projectDetails.lockedAt ? ` on ${formatDate(projectDetails.lockedAt)}` : ""}.
                      {projectDetails.userRole === "CREATOR" ? " As the creator, you can reactivate it." : " Only the project creator can reactivate it."}
                    </CardDescription>
                  </div>
                </div>
                {projectDetails.userRole === "CREATOR" && (
                  <Button
                    onClick={handleReactivateProject}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {uploading ? "Reactivating..." : "Reactivate Project"}
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Files Section */}
        <div className="space-y-8">
          {/* Unified Files */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-xl">
                  <svg className="h-5 w-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Files ({projectDetails.documents.length + projectDetails.videos.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Type Filter Buttons */}
                  <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1">
                    <Button
                      variant={fileTypeFilter === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFileTypeFilter("all")}
                      disabled={projectDetails.status === "INACTIVE"}
                      className={`h-8 ${projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      All
                    </Button>
                    <Button
                      variant={fileTypeFilter === "document" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFileTypeFilter("document")}
                      disabled={projectDetails.status === "INACTIVE"}
                      className={`h-8 ${projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Documents
                    </Button>
                    <Button
                      variant={fileTypeFilter === "video" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFileTypeFilter("video")}
                      disabled={projectDetails.status === "INACTIVE"}
                      className={`h-8 ${projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Videos
                    </Button>
                  </div>
                  <Input
                    placeholder={projectDetails.status === "INACTIVE" ? "Project Inactive" : "Search files..."}
                    value={filesSearch}
                    onChange={(e) => setFilesSearch(e.target.value)}
                    disabled={projectDetails.status === "INACTIVE"}
                    className={`w-64 ${projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleAddFilesClick} 
                    disabled={uploading || projectDetails.status === "INACTIVE"}
                    className={projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {projectDetails.status === "INACTIVE" ? "Project Inactive" : uploading ? "Uploading..." : "Add Files"}
                  </Button>
                  {/* Hidden file input for upload */}
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFilesSelected}
                    accept=".pdf,.doc,.docx,.mp4,.png,.jpg,.jpeg,.txt,.xlsx,.ppt,.pptx,.csv,.zip,.rar,.7z,.tar,.gz,.json,.xml,.html,.js,.ts,.md,.rtf,.bmp,.gif,.svg,.webp,.avi,.mov,.wmv,.flv,.mkv"
                  />
                </div>
              </div>
              {editMode && (
                <div className="flex items-center space-x-4 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    checked={selectedFiles.length === getAllFiles().length && getAllFiles().length > 0}
                    onCheckedChange={handleSelectAllFiles}
                  />
                  <span className="text-sm font-medium text-blue-700">
                    Select All Files ({selectedFiles.length} of {getAllFiles().length} selected)
                  </span>
                  {selectedFiles.length > 0 && (
                    <span className="text-sm text-blue-600">
                      Selected files will be deleted when you click "Save Changes"
                    </span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {projectDetails.documents.length + projectDetails.videos.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {editMode && <TableHead className="w-12"></TableHead>}
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="w-32">Uploaded By</TableHead>
                        <TableHead className="w-40">Upload Date</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginateItems(filterFiles(getAllFiles()), filesPage, itemsPerPage).map((file: UnifiedFile) => (
                        <TableRow key={file.id} className="hover:bg-slate-50/50">
                          {editMode && (
                            <TableCell className="align-middle">
                              <Checkbox
                                checked={selectedFiles.includes(file.id)}
                                onCheckedChange={(checked) => handleFileSelect(file.id, checked as boolean)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="align-middle">{getFileIcon(file.fileType)}</TableCell>
                          <TableCell className="align-middle">
                            <div className="font-medium text-slate-900 truncate max-w-xs" title={file.fileName}>
                              {file.fileName}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${file.type === "document"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : "bg-purple-100 text-purple-800 border-purple-200"
                                }`}
                            >
                              {file.type === "document" ? "Document" : "Video"}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle">
                            {file.uploadedBy ? (
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="h-4 w-4 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                <span className="text-sm text-slate-600 truncate" title={file.uploadedBy}>
                                  {file.uploadedBy}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-4 w-4 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm text-slate-600">{formatDate(file.uploadedAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">{getStatusBadge(file.status)}</TableCell>
                          <TableCell className="align-middle">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDownloadFile(file)}
                              disabled={projectDetails.status === "INACTIVE"}
                              className={projectDetails.status === "INACTIVE" ? "opacity-50 cursor-not-allowed" : ""}
                              title={projectDetails.status === "INACTIVE" ? "Project Inactive" : `Download ${file.fileName}`}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filterFiles(getAllFiles()).length > itemsPerPage && (
                    <div className="p-4 border-t">
                      <SimplePagination
                        currentPage={filesPage}
                        totalPages={Math.ceil(filterFiles(getAllFiles()).length / itemsPerPage)}
                        onPageChange={setFilesPage}
                        totalItems={filterFiles(getAllFiles()).length}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <svg
                    className="h-12 w-12 mx-auto mb-4 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>No files uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members Section */}
        {projectDetails.members.length > 0 && (
          <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center text-xl">
                <svg className="h-5 w-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Team Members ({projectDetails.members.length})
              </CardTitle>
              {editMode && selectedMembers.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm font-medium text-red-700">
                    {selectedMembers.length} member(s) selected for removal - will be removed when you click "Save Changes"
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetails.members.map((member: Member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      member.role === "CREATOR"
                        ? "border-purple-200 bg-purple-50 hover:bg-purple-100"
                        : member.role === "LEADER"
                        ? "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                        : selectedMembers.includes(member.id)
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {editMode && member.role !== "CREATOR" && (
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => handleMemberSelect(member.id, checked as boolean)}
                        />
                      )}
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          member.role === "CREATOR"
                            ? "bg-purple-100 text-purple-700"
                            : member.role === "LEADER"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {member.role === "CREATOR" ? (
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                            />
                          </svg>
                        ) : member.role === "LEADER" ? (
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138z"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{member.fullName}</p>
                        <p className="text-sm text-slate-600 truncate" title={member.email}>
                          {member.email}
                        </p>
                        <p className="text-xs text-slate-500">Joined: {formatDate(member.joinedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          member.role === "CREATOR"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : member.role === "LEADER"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {member.role}
                      </span>
                      {editMode && member.role !== "CREATOR" && (
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => handleMemberSelect(member.id, checked as boolean)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Folders Section */}
        {projectDetails.folders.length > 0 && (
          <Card className="mt-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center text-xl">
                <svg className="h-5 w-5 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Folders ({projectDetails.folders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectDetails.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <div>
                        <span className="font-medium text-slate-900">{folder.folderName}</span>
                        <p className="text-xs text-slate-500">Created: {formatDate(folder.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone - Only show in edit mode */}
        {editMode && (
          <Card className="mt-8 shadow-xl border-0 bg-red-50/80 backdrop-blur-sm border-red-200">
            <CardHeader className="border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100">
              <CardTitle className="flex items-center text-xl text-red-900">
                <svg className="h-5 w-5 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="border border-red-300 rounded-lg p-6 bg-red-50">
                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Project</h3>
                    <p className="text-sm text-red-700 mb-4">
                      This action cannot be undone. This will permanently delete the project, all its files, and remove all team members.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-red-700 mb-2 block">
                          Reason for deletion (optional)
                        </label>
                        <textarea
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="Optionally provide a reason for deleting this project..."
                          className="w-full min-h-[80px] px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white text-slate-700"
                          maxLength={500}
                        />
                        <div className="text-xs text-red-600 mt-1">
                          {deleteReason.length}/500 characters
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-red-700 mb-2 block">
                          Type the project name "<strong>{projectDetails.projectName}</strong>" to confirm:
                        </label>
                        <Input
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder={projectDetails.projectName}
                          className="border-red-300 focus:border-red-500 focus:ring-red-500 bg-white"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteProject}
                        disabled={deleteConfirmationText !== projectDetails.projectName || uploading}
                        className="w-full"
                      >
                        {uploading ? "Deleting..." : "I understand the consequences, delete this project"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent
          className={`${alertType === "error"
              ? "border-red-200"
              : alertType === "warning"
                ? "border-yellow-200"
                : "border-green-200"
            }`}
        >
          <DialogHeader>
            <DialogTitle
              className={`${alertType === "error" ? "text-red-600" : alertType === "warning" ? "text-yellow-600" : "text-green-600"
                }`}
            >
              {alertTitle}
            </DialogTitle>
            {duplicateFiles.length > 0 ? (
              <div className="space-y-2 mt-2">
                <p className="text-sm text-slate-600">{alertMessage}</p>
                <ul className="space-y-1 ml-4">
                  {duplicateFiles.map((fileName, index) => (
                    <li key={index} className="text-sm text-slate-700">
                      • {fileName} → will replace: {fileName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <DialogDescription>{alertMessage}</DialogDescription>
            )}
          </DialogHeader>
          {uploading && (
            <div className="space-y-3 px-6 py-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Uploading files...</span>
                <span className="text-sm font-semibold text-blue-600">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-end">
            {alertType === "warning" ? (
              <>
                <Button variant="outline" onClick={handleAlertClose} disabled={uploading}>
                  Cancel
                </Button>
                <Button onClick={handleAlertConfirm} disabled={uploading}>
                  {uploading ? "Uploading..." : "Replace"}
                </Button>
              </>
            ) : (
              <Button onClick={handleAlertClose} disabled={uploading}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blurred overlay when uploading files */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
            <span className="text-white font-medium">Uploading files...</span>
          </div>
        </div>
      )}

      {/* Chat Panel */}
  {chatOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl mx-auto">
        <ChatPanel
          projectId={projectDetails?.projectId || ""}
          selectedFiles={projectDetails ? getAllFiles().map(f => ({ 
            id: f.id, 
            name: f.fileName, 
            icon: '',
            type: f.type
          })) : []}
        />
        <button
          className="absolute top-4 right-4 bg-white/80 rounded-full p-2 shadow hover:bg-white"
          onClick={() => setChatOpen(false)}
        >
          <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
      )}
    </div>
  )
}