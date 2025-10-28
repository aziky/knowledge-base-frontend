import { useEffect, useState } from "react"
import { ProjectCard } from "@/components/project-card"

interface Project {
  id: string
  name: string
  description: string
  createdAt: string
}

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load projects from localStorage
    const stored = localStorage.getItem("projects")
    if (stored) {
      setProjects(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id)
    setProjects(updated)
    localStorage.setItem("projects", JSON.stringify(updated))
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading projects...</div>
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">No projects yet</p>
        <p className="text-sm text-muted-foreground">Create your first project to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
      ))}
    </div>
  )
}
