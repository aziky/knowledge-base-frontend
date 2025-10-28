import { ProjectTable } from "@/components/ProjectTable"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

interface HomePageProps {
  user: User | null;
  onLogout: () => void;
}

export default function HomePage({ user, onLogout }: HomePageProps) {
  // If no user is passed, this component shouldn't render (handled by router)
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.name || user.email}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
          <CreateProjectDialog />
        </div>
        <ProjectTable />
      </div>
    </main>
  )
}
