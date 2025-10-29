import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { projectApi, userApi, type ApiError, type CreateProjectRequest } from "@/services/api"
import type { InvitationUser, User } from "@/types"

export default function CreateProjectPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [projectName, setProjectName] = useState("")
    const [description, setDescription] = useState("")
    const [memberSearch, setMemberSearch] = useState("")
    const [allUsers, setAllUsers] = useState<User[]>([]) // Store all users fetched initially
    const [availableMembers, setAvailableMembers] = useState<User[]>([])
    const [selectedMembers, setSelectedMembers] = useState<User[]>([])

    // Load all users initially
    const loadAllUsers = useCallback(async () => {
        setSearchLoading(true)
        try {
            const users = await userApi.searchUsers("") // Get all users
            setAllUsers(users)
            setAvailableMembers(users) // Initially show all users
        } catch (err) {
            console.error("Error loading users:", err)
            setAllUsers([])
            setAvailableMembers([])
        } finally {
            setSearchLoading(false)
        }
    }, [])

    // Filter users based on search term and selected members
    const filterUsers = useCallback(() => {
        let filteredUsers = allUsers

        // Filter by search term if provided
        if (memberSearch.trim()) {
            filteredUsers = allUsers.filter(user =>
                user.fullName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                user.email.toLowerCase().includes(memberSearch.toLowerCase())
            )
        }

        // Filter out already selected members
        filteredUsers = filteredUsers.filter(user =>
            !selectedMembers.some(selected => selected.id === user.id)
        )

        setAvailableMembers(filteredUsers)
    }, [allUsers, memberSearch, selectedMembers])

    // Load initial users on component mount
    useEffect(() => {
        loadAllUsers()
    }, [loadAllUsers])

    // Filter users when search term or selected members change
    useEffect(() => {
        filterUsers()
    }, [filterUsers])

    const addMember = (user: User) => {
        setSelectedMembers(prev => [...prev, user])
        // No need to manually filter availableMembers - useEffect will handle it
    }

    const removeMember = (userId: string) => {
        setSelectedMembers(prev => prev.filter(u => u.id !== userId))
        // No need to manually add back to availableMembers - useEffect will handle it
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!projectName.trim()) {
            setError("Project name is required")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Step 1: Create the project
            const projectData: CreateProjectRequest = {
                name: projectName.trim(),
                description: description.trim()
            }

            const newProject = await projectApi.createProject(projectData)
            console.log('Project created:', JSON.stringify(newProject))
            // Step 2: Send invitations if there are selected members
            if (selectedMembers.length > 0) {
                try {
                    const invitationUsers: InvitationUser[] = selectedMembers.map(member => ({
                        userId: member.id,
                        fullName: member.fullName,
                        email: member.email,
                        role: "MEMBER"
                    }));
                    console.log('Inviting users:', JSON.stringify(invitationUsers));
                    const invitationsResponse =  await projectApi.inviteUsersToProject(newProject.projectId, invitationUsers)
                    console.log('Invitations sent:', invitationsResponse)
                } catch (inviteError) {
                    console.warn('Project created but failed to send some invitations:', inviteError)
                }
            }

            // Navigate to the new project's details page
            navigate(`/project/${newProject.projectId}`)
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Failed to create project')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate(-1)}
                                className="border-slate-300 hover:bg-slate-50"
                            >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </Button>
                            <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Project Information */}
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                                <svg className="h-5 w-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Project Information
                            </CardTitle>
                            <CardDescription>
                                Enter the basic details for your new project
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="projectName" className="text-sm font-medium text-slate-700">
                                    Project Name *
                                </label>
                                <Input
                                    id="projectName"
                                    placeholder="Enter project name"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    disabled={loading}
                                    className="text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    placeholder="Describe what this project is about..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={loading}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Members */}
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                                <svg className="h-5 w-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Invite Team Members
                            </CardTitle>
                            <CardDescription>
                                Search and invite team members to your project
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Search Input */}
                            <div className="space-y-2">
                                <label htmlFor="memberSearch" className="text-sm font-medium text-slate-700">
                                    Search Members
                                </label>
                                <div className="relative">
                                    <Input
                                        id="memberSearch"
                                        placeholder="Search by name or email..."
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                        disabled={loading}
                                        className="text-base pr-10"
                                    />
                                    {searchLoading && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Available Members */}
                            {availableMembers.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-slate-700">Available Members</h4>
                                    <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                                        {availableMembers.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{user.fullName || user.email}</p>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => addMember(user)}
                                                    className="h-8"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Selected Members */}
                            {selectedMembers.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-slate-700">Selected Members ({selectedMembers.length})</h4>
                                    <div className="space-y-2 border border-slate-200 rounded-lg p-3">
                                        {selectedMembers.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{user.fullName || user.email}</p>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeMember(user.id)}
                                                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                            className="px-8"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !projectName.trim()}
                            className="px-8"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Project
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}