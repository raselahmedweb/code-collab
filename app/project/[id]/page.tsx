"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getProject, type Project } from "@/lib/projects"
import { createFile, getFiles, type File as ProjectFile } from "@/lib/files"
import { PlusIcon, UsersIcon, TerminalIcon } from "lucide-react"
import Editor from "@/components/editor"
import UserManagement from "@/components/user-management"
import { ProjectTerminal } from "@/components/project-terminal"

export default function ProjectPage() {
  const { id } = useParams() as { id: string }
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProjectAndFiles = async () => {
      if (id && user) {
        try {
          const projectData = await getProject(id)
          setProject(projectData)

          const projectFiles = await getFiles(id)
          setFiles(projectFiles)

          if (projectFiles.length > 0) {
            setActiveFile(projectFiles[0])
          }
        } catch (error) {
          console.error("Failed to fetch project data:", error)
          toast({
            title: "Error",
            description: "Failed to load project",
            variant: "destructive",
          })
        }
      }
    }

    fetchProjectAndFiles()
  }, [id, user, toast])

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileName.trim() || !project) {
      toast({
        title: "Error",
        description: "Please enter a valid file name",
        variant: "destructive",
      })
      return
    }

    // Add file extension if not provided
    let fileName = newFileName
    if (!fileName.includes(".")) {
      fileName = `${fileName}.txt`
    }

    setIsLoading(true)
    try {
      console.log("Creating file:", fileName, "in project:", project.id)
      const newFile = await createFile({
        name: fileName,
        projectId: project.id,
        content: "",
      })
      console.log("File created successfully:", newFile)
      setFiles([...files, newFile])
      setActiveFile(newFile)
      setNewFileName("")
      toast({
        title: "File created",
        description: `${fileName} has been created successfully`,
      })
    } catch (error) {
      console.error("Failed to create file:", error)
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isOwner = project && user && project.ownerId === user.id

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="container flex h-14 items-center justify-between py-2">
          <h1 className="text-xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsTerminalOpen(true)}>
              <TerminalIcon className="mr-2 h-4 w-4" />
              Terminal
            </Button>
            {isOwner && (
              <Button variant="outline" size="sm">
                <UsersIcon className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="editor" className="flex-1">
        <div className="container border-b">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            {isOwner && <TabsTrigger value="users">Users</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="editor" className="flex-1 p-0">
          <div className="flex h-full">
            <div className="w-64 border-r bg-muted/40">
              <div className="p-4">
                <form onSubmit={handleCreateFile} className="flex items-center gap-2">
                  <Input
                    placeholder="New file name"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button type="submit" size="sm" disabled={isLoading}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              <div className="px-2">
                {files.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No files yet. Create your first file.
                  </div>
                ) : (
                  files.map((file) => (
                    <button
                      key={file.id}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                        activeFile?.id === file.id
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50"
                      }`}
                      onClick={() => setActiveFile(file)}
                    >
                      {file.name}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1">
              {activeFile ? (
                <Editor file={activeFile} projectId={project.id} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Create a new file or select an existing one to start editing</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {isOwner && (
          <TabsContent value="users" className="h-full p-0">
            <div className="container py-6">
              <UserManagement projectId={project.id} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Project-specific Terminal */}
      <ProjectTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  )
}
