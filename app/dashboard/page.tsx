"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createProject, getProjects, type Project } from "@/lib/projects"
import { PlusIcon, FileTextIcon, CodeIcon } from "lucide-react"

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check if we need to open a specific project from terminal
  useEffect(() => {
    const projectParam = searchParams.get("project")
    if (projectParam && user) {
      const openProject = async () => {
        try {
          const userProjects = await getProjects(user.id)
          const project = userProjects.find((p) => p.name === projectParam)

          if (project) {
            router.push(`/project/${project.id}`)
          } else {
            toast({
              title: "Project not found",
              description: `Could not find project: ${projectParam}`,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Failed to open project:", error)
        }
      }

      openProject()
    }
  }, [searchParams, user, router, toast])

  useEffect(() => {
    const fetchProjects = async () => {
      if (user) {
        try {
          const userProjects = await getProjects(user.id)
          setProjects(userProjects)
        } catch (error) {
          console.error("Failed to fetch projects:", error)
        }
      }
    }

    fetchProjects()
  }, [user])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsLoading(true)
    try {
      const newProject = await createProject({
        name: newProjectName,
        ownerId: user!.id,
      })
      setProjects([...projects, newProject])
      setNewProjectName("")
      toast({
        title: "Project created",
        description: `${newProjectName} has been created successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <form onSubmit={handleCreateProject} className="flex items-center gap-2">
          <Input
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-64"
          />
          <Button type="submit" disabled={isLoading}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </form>
      </div>

      {projects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <FileTextIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-medium">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first project to start collaborating</p>
          <div className="text-sm text-muted-foreground">
            <p>You can also create a project using the terminal:</p>
            <pre className="mt-2 rounded bg-muted p-2 text-xs">project create my-project</pre>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>Created on {new Date(project.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CodeIcon className="mr-1 h-4 w-4" />
                  {project.files?.length || 0} files
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-3">
                <Button variant="default" className="w-full" onClick={() => router.push(`/project/${project.id}`)}>
                  Open Project
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
