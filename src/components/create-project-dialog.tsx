"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function CreateProjectDialog() {
  const navigate = useNavigate()

  const handleCreateClick = () => {
    navigate('/create-project')
  }

  return (
    <Button onClick={handleCreateClick}>
      <Plus className="w-4 h-4 mr-2" />
      New Project
    </Button>
  )
}
