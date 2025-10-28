import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    createdAt: string
  }
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const createdDate = new Date(project.createdAt).toLocaleDateString()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-2">{project.name}</CardTitle>
        <CardDescription className="text-xs">Created {createdDate}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground line-clamp-3">{project.description}</p>
        <Button variant="destructive" size="sm" onClick={() => onDelete(project.id)} className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </CardContent>
    </Card>
  )
}
