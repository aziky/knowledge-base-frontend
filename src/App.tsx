// App.tsx
import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/login/LoginPage"
import { authApi } from "@/services/api"
import HomePage from "@/pages/home/HomePage"
import ProjectDetailsPage from "@/pages/project/ProjectDetailsPage"
import type { User } from "@/types"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    const storedUserData = localStorage.getItem("userData")

    if (token && storedUserData) {
      try {
        const userData = JSON.parse(storedUserData) as User
        setUser(userData)
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem("authToken")
        localStorage.removeItem("userData")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = (token: string, userData: User) => {
    setIsAuthenticated(true)
    setUser(userData)
    localStorage.setItem("authToken", token)
    localStorage.setItem("userData", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    authApi.logout().catch(console.error)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Main route / dashboard */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <HomePage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Project details route */}
        <Route
          path="/project/:projectId"
          element={
            isAuthenticated ? (
              <ProjectDetailsPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Optional: catch-all route to redirect unknown URLs */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
