import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"
import { projectApi, userApi } from "@/services/api"

interface AdminDashboardPageProps {
  user: User | null
  onLogout: () => void
}

export default function AdminDashboardPage({ user, onLogout }: AdminDashboardPageProps) {
  const [projectCount, setProjectCount] = useState<number>(0)
  const [userCount, setUserCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          projectApi.getProjects(), // Should return array of projects
          userApi.searchUsers(),    // Should return array of users
        ])
        setProjectCount(projectsRes.totalElements)
        setUserCount(usersRes.length)
      } catch (err) {
        console.error("Error fetching counts:", err)
        setProjectCount(0)
        setUserCount(0)
      } finally {
        setLoading(false)
      }
    }
    fetchCounts()
  }, [])

  if (!user || user.role !== "admin") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Welcome, {user.fullName || user.email}</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="border-slate-300 hover:bg-slate-50">
            Logout
          </Button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            System Overview
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See the total number of projects and users in the system.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-700">Projects</CardTitle>
              <CardDescription>Total number of projects</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
              {loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <span className="text-5xl font-bold text-blue-700">{projectCount}</span>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-indigo-700">Users</CardTitle>
              <CardDescription>Total number of users</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-32">
              {loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <span className="text-5xl font-bold text-indigo-700">{userCount}</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
