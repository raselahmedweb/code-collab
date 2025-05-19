"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TerminalIcon, X, Minimize, Maximize, Copy } from "lucide-react"
import { createProject, getProjects } from "@/lib/projects"
import { createFile } from "@/lib/files"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"

interface TerminalProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandOutput {
  id: string
  command: string
  output: string[] | string
  isError?: boolean
  isLoading?: boolean
}

// Simulated file system
interface FileSystemItem {
  name: string
  type: "file" | "directory"
  content?: string
  children?: FileSystemItem[]
}

export function Terminal({ isOpen, onClose }: TerminalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<CommandOutput[]>([
    {
      id: "welcome",
      command: "",
      output: [
        "Welcome to CodeCollab Terminal v1.0.0",
        "This is a simulated terminal environment.",
        "Type 'help' to see available commands.",
        "Type 'project --help' to see project management commands.",
        "",
      ],
    },
  ])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentDirectory, setCurrentDirectory] = useState("/")
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([
    {
      name: "projects",
      type: "directory",
      children: [],
    },
    {
      name: "templates",
      type: "directory",
      children: [
        {
          name: "react-app",
          type: "directory",
          children: [
            {
              name: "index.js",
              type: "file",
              content:
                "import React from 'react';\nimport ReactDOM from 'react-dom';\n\nReactDOM.render(<h1>Hello World</h1>, document.getElementById('root'));",
            },
            {
              name: "package.json",
              type: "file",
              content:
                '{\n  "name": "react-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}',
            },
          ],
        },
        {
          name: "next-app",
          type: "directory",
          children: [
            {
              name: "pages",
              type: "directory",
              children: [
                {
                  name: "index.js",
                  type: "file",
                  content: "export default function Home() {\n  return <h1>Hello World</h1>;\n}",
                },
                {
                  name: "_app.js",
                  type: "file",
                  content:
                    "export default function App({ Component, pageProps }) {\n  return <Component {...pageProps} />;\n}",
                },
              ],
            },
            {
              name: "package.json",
              type: "file",
              content:
                '{\n  "name": "next-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "next": "^13.0.0",\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}',
            },
          ],
        },
      ],
    },
  ])

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Scroll to bottom when history changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [history])

  // Load existing projects from localStorage
  useEffect(() => {
    if (user) {
      const loadProjects = async () => {
        try {
          const projects = await getProjects(user.id)

          // Update file system with projects
          setFileSystem((prev) => {
            const newFileSystem = [...prev]
            const projectsDir = newFileSystem.find((item) => item.name === "projects")

            if (projectsDir && projectsDir.children) {
              projectsDir.children = projects.map((project) => ({
                name: project.name,
                type: "directory",
                children: [],
              }))
            }

            return newFileSystem
          })
        } catch (error) {
          console.error("Failed to load projects:", error)
        }
      }

      loadProjects()
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    // Add command to history
    const newCommandHistory = [...commandHistory, command]
    setCommandHistory(newCommandHistory)
    setHistoryIndex(-1)

    // Process command
    processCommand(command)
    setCommand("")
  }

  const processCommand = (cmd: string) => {
    const commandId = Date.now().toString()
    const commandParts = cmd.trim().split(/\s+/)
    const mainCommand = commandParts[0].toLowerCase()
    const args = commandParts.slice(1)

    // Add command to output history
    setHistory((prev) => [
      ...prev,
      {
        id: commandId,
        command: cmd,
        output: [],
        isLoading: true,
      },
    ])

    // Simulate delay for command execution
    setTimeout(() => {
      let output: string[] = []
      let isError = false

      switch (mainCommand) {
        case "help":
          output = [
            "Available commands:",
            "  help                 - Show this help message",
            "  clear                - Clear the terminal",
            "  project              - Project management (use 'project --help' for more info)",
            "  npm install [pkg]    - Simulate installing npm packages",
            "  yarn add [pkg]       - Simulate adding yarn packages",
            "  pnpm add [pkg]       - Simulate adding pnpm packages",
            "  ls                   - List files in current directory",
            "  cd [dir]             - Change directory",
            "  mkdir [dir]          - Create directory",
            "  touch [file]         - Create file",
            "  cat [file]           - Display file contents",
            "  echo [text]          - Print text",
            "  pwd                  - Print working directory",
            "  exit                 - Close the terminal",
          ]
          break

        case "clear":
          setHistory([])
          return

        case "exit":
          onClose()
          return

        case "project":
          output = handleProjectCommand(args)
          if (output[0]?.startsWith("Error:")) {
            isError = true
          }
          break

        case "npm":
          if (args[0] === "install" || args[0] === "i") {
            const packages = args.slice(1)
            if (packages.length === 0) {
              output = ["Please specify package(s) to install"]
              isError = true
            } else {
              output = [
                `Installing packages: ${packages.join(", ")}`,
                "npm notice created a lockfile as package-lock.json. You should commit this file.",
                "added 127 packages in 3.5s",
                "",
                `${packages.length} package(s) installed successfully.`,
              ]
            }
          } else {
            output = [`Unknown npm command: ${args[0]}`]
            isError = true
          }
          break

        case "yarn":
          if (args[0] === "add") {
            const packages = args.slice(1)
            if (packages.length === 0) {
              output = ["Please specify package(s) to add"]
              isError = true
            } else {
              output = [
                `Adding packages: ${packages.join(", ")}`,
                "yarn add v1.22.19",
                `success Saved lockfile.`,
                `success Saved 127 new dependencies.`,
                `info Direct dependencies: ${packages.join(", ")}`,
                `info All dependencies: ${packages.join(", ")}, react, react-dom, ...`,
                `✨  Done in 2.54s.`,
              ]
            }
          } else {
            output = [`Unknown yarn command: ${args[0]}`]
            isError = true
          }
          break

        case "pnpm":
          if (args[0] === "add") {
            const packages = args.slice(1)
            if (packages.length === 0) {
              output = ["Please specify package(s) to add"]
              isError = true
            } else {
              output = [
                `Adding packages: ${packages.join(", ")}`,
                "Packages: +127",
                "Progress: resolved 127, reused 120, downloaded 7, added 127, done",
                "",
                `${packages.length} package(s) installed successfully.`,
                `node_modules/.pnpm/lock.yaml: +127 packages`,
              ]
            }
          } else {
            output = [`Unknown pnpm command: ${args[0]}`]
            isError = true
          }
          break

        case "ls":
          output = handleLsCommand(args)
          break

        case "cd":
          output = handleCdCommand(args)
          break

        case "mkdir":
          if (args.length === 0) {
            output = ["Please specify directory name"]
            isError = true
          } else {
            output = handleMkdirCommand(args)
            if (output[0]?.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "touch":
          if (args.length === 0) {
            output = ["Please specify file name"]
            isError = true
          } else {
            output = handleTouchCommand(args)
            if (output[0]?.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "cat":
          if (args.length === 0) {
            output = ["Please specify file name"]
            isError = true
          } else {
            output = handleCatCommand(args)
            if (output[0]?.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "pwd":
          output = [currentDirectory]
          break

        case "echo":
          output = [args.join(" ")]
          break

        default:
          output = [`Command not found: ${mainCommand}`]
          isError = true
      }

      // Update command output in history
      setHistory((prev) =>
        prev.map((item) =>
          item.id === commandId
            ? {
                ...item,
                output,
                isError,
                isLoading: false,
              }
            : item,
        ),
      )
    }, 500) // Simulate delay
  }

  // Handle project management commands
  const handleProjectCommand = (args: string[]): string[] => {
    if (!user) {
      return ["Error: You must be logged in to manage projects"]
    }

    if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
      return [
        "Project management commands:",
        "  project create <name> [--template <template>] [--remote]  - Create a new project",
        "  project list                                             - List all projects",
        "  project open <name>                                      - Open a project in the editor",
        "  project delete <name>                                    - Delete a project",
        "",
        "Options:",
        "  --template <template>  - Use a template (react-app, next-app)",
        "  --remote               - Save project to remote storage (default: local)",
        "",
        "Examples:",
        "  project create my-app --template react-app",
        "  project create my-app --remote",
      ]
    }

    const subCommand = args[0]

    switch (subCommand) {
      case "create":
        if (args.length < 2) {
          return ["Error: Project name is required"]
        }

        const projectName = args[1]
        let template = ""
        let isRemote = false

        // Parse options
        for (let i = 2; i < args.length; i++) {
          if (args[i] === "--template" && i + 1 < args.length) {
            template = args[i + 1]
            i++
          } else if (args[i] === "--remote") {
            isRemote = true
          }
        }

        return handleCreateProject(projectName, template, isRemote)

      case "list":
        return handleListProjects()

      case "open":
        if (args.length < 2) {
          return ["Error: Project name is required"]
        }

        return handleOpenProject(args[1])

      case "delete":
        if (args.length < 2) {
          return ["Error: Project name is required"]
        }

        return handleDeleteProject(args[1])

      default:
        return [`Error: Unknown project subcommand: ${subCommand}`]
    }
  }

  // Create a new project
  const handleCreateProject = async (name: string, template: string, isRemote: boolean): string[] => {
    try {
      // Check if project already exists
      const projectsDir = fileSystem.find((item) => item.name === "projects")
      if (projectsDir && projectsDir.children) {
        const existingProject = projectsDir.children.find((item) => item.name === name)
        if (existingProject) {
          return [`Error: Project '${name}' already exists`]
        }
      }

      // Create project in the application
      const newProject = await createProject({
        name,
        ownerId: user!.id,
      })

      // Add files from template if specified
      if (template) {
        const templatesDir = fileSystem.find((item) => item.name === "templates")
        if (templatesDir && templatesDir.children) {
          const templateDir = templatesDir.children.find((item) => item.name === template)

          if (!templateDir) {
            return [`Project '${name}' created successfully, but template '${template}' not found`]
          }

          // Copy template files to the new project
          if (templateDir.children) {
            for (const file of templateDir.children) {
              if (file.type === "file" && file.content) {
                await createFile({
                  name: file.name,
                  projectId: newProject.id,
                  content: file.content,
                })
              }
            }
          }
        }
      }

      // Update file system
      setFileSystem((prev) => {
        const newFileSystem = [...prev]
        const projectsDir = newFileSystem.find((item) => item.name === "projects")

        if (projectsDir && projectsDir.children) {
          projectsDir.children.push({
            name,
            type: "directory",
            children: [],
          })
        }

        return newFileSystem
      })

      const storageType = isRemote ? "remote" : "local"
      return [
        `Project '${name}' created successfully`,
        `Storage: ${storageType}`,
        template ? `Template: ${template}` : "No template used",
        "",
        "To open this project, run:",
        `  project open ${name}`,
      ]
    } catch (error) {
      console.error("Failed to create project:", error)
      return ["Error: Failed to create project"]
    }
  }

  // List all projects
  const handleListProjects = async (): string[] => {
    try {
      const projects = await getProjects(user!.id)

      if (projects.length === 0) {
        return ["No projects found"]
      }

      return [
        "Your projects:",
        "",
        ...projects.map(
          (project) => `  ${project.name} (Created: ${new Date(project.createdAt).toLocaleDateString()})`,
        ),
        "",
        "To open a project, run:",
        "  project open <name>",
      ]
    } catch (error) {
      console.error("Failed to list projects:", error)
      return ["Error: Failed to list projects"]
    }
  }

  // Open a project
  const handleOpenProject = (name: string): string[] => {
    try {
      // Find project
      const projectsDir = fileSystem.find((item) => item.name === "projects")
      if (projectsDir && projectsDir.children) {
        const project = projectsDir.children.find((item) => item.name === name)
        if (!project) {
          return [`Error: Project '${name}' not found`]
        }
      }

      // Navigate to project in the application
      setTimeout(() => {
        router.push(`/dashboard?project=${name}`)
      }, 1000)

      return [`Opening project '${name}'...`, "Redirecting to project dashboard..."]
    } catch (error) {
      console.error("Failed to open project:", error)
      return ["Error: Failed to open project"]
    }
  }

  // Delete a project
  const handleDeleteProject = (name: string): string[] => {
    // This would be implemented with actual deletion logic
    return [`Project '${name}' deleted successfully`]
  }

  // Handle ls command
  const handleLsCommand = (args: string[]): string[] => {
    // Get current directory contents
    const path = args.length > 0 ? args[0] : currentDirectory
    const normalizedPath = normalizePath(path)

    const dirContents = getDirectoryContents(normalizedPath)

    if (!dirContents) {
      return [`Error: Directory not found: ${normalizedPath}`]
    }

    if (dirContents.length === 0) {
      return ["Directory is empty"]
    }

    return dirContents.map((item) => `${item.name}${item.type === "directory" ? "/" : ""}`)
  }

  // Handle cd command
  const handleCdCommand = (args: string[]): string[] => {
    if (args.length === 0) {
      setCurrentDirectory("/")
      return ["Changed directory to /"]
    }

    const path = args[0]
    const normalizedPath = normalizePath(path)

    // Check if directory exists
    if (!directoryExists(normalizedPath)) {
      return [`Error: Directory not found: ${normalizedPath}`]
    }

    setCurrentDirectory(normalizedPath)
    return [`Changed directory to ${normalizedPath}`]
  }

  // Handle mkdir command
  const handleMkdirCommand = (args: string[]): string[] => {
    const dirName = args[0]
    const path = currentDirectory === "/" ? `/${dirName}` : `${currentDirectory}/${dirName}`

    // Check if directory already exists
    if (directoryExists(path)) {
      return [`Error: Directory already exists: ${path}`]
    }

    // Create directory in file system
    createDirectoryInFileSystem(path)

    return [`Created directory: ${path}`]
  }

  // Handle touch command
  const handleTouchCommand = (args: string[]): string[] => {
    const fileName = args[0]
    const path = currentDirectory === "/" ? `/${fileName}` : `${currentDirectory}/${fileName}`

    // Check if file already exists
    if (fileExists(path)) {
      return [`Error: File already exists: ${path}`]
    }

    // Create file in file system
    createFileInFileSystem(path)

    return [`Created file: ${path}`]
  }

  // Handle cat command
  const handleCatCommand = (args: string[]): string[] => {
    const fileName = args[0]
    const path = fileName.startsWith("/") ? fileName : `${currentDirectory === "/" ? "" : currentDirectory}/${fileName}`

    // Get file content
    const fileContent = getFileContent(path)

    if (fileContent === null) {
      return [`Error: File not found: ${path}`]
    }

    return fileContent.split("\n")
  }

  // Helper functions for file system operations
  const normalizePath = (path: string): string => {
    // Handle relative paths
    if (!path.startsWith("/")) {
      path = currentDirectory === "/" ? `/${path}` : `${currentDirectory}/${path}`
    }

    // Handle .. in path
    const parts = path.split("/").filter(Boolean)
    const result = []

    for (const part of parts) {
      if (part === "..") {
        result.pop()
      } else if (part !== ".") {
        result.push(part)
      }
    }

    return `/${result.join("/")}`
  }

  const getDirectoryContents = (path: string): FileSystemItem[] | null => {
    if (path === "/") {
      return fileSystem
    }

    const parts = path.split("/").filter(Boolean)
    let current: FileSystemItem[] = fileSystem

    for (const part of parts) {
      const dir = current.find((item) => item.name === part && item.type === "directory")
      if (!dir || !dir.children) {
        return null
      }
      current = dir.children
    }

    return current
  }

  const directoryExists = (path: string): boolean => {
    if (path === "/") {
      return true
    }

    const parts = path.split("/").filter(Boolean)
    let current: FileSystemItem[] = fileSystem

    for (const part of parts) {
      const dir = current.find((item) => item.name === part && item.type === "directory")
      if (!dir || !dir.children) {
        return false
      }
      current = dir.children
    }

    return true
  }

  const fileExists = (path: string): boolean => {
    const parts = path.split("/").filter(Boolean)
    const fileName = parts.pop()

    if (!fileName) {
      return false
    }

    let current: FileSystemItem[] = fileSystem

    for (const part of parts) {
      const dir = current.find((item) => item.name === part && item.type === "directory")
      if (!dir || !dir.children) {
        return false
      }
      current = dir.children
    }

    return current.some((item) => item.name === fileName && item.type === "file")
  }

  const getFileContent = (path: string): string | null => {
    const parts = path.split("/").filter(Boolean)
    const fileName = parts.pop()

    if (!fileName) {
      return null
    }

    let current: FileSystemItem[] = fileSystem

    for (const part of parts) {
      const dir = current.find((item) => item.name === part && item.type === "directory")
      if (!dir || !dir.children) {
        return null
      }
      current = dir.children
    }

    const file = current.find((item) => item.name === fileName && item.type === "file")
    return file?.content || null
  }

  const createDirectoryInFileSystem = (path: string): void => {
    const parts = path.split("/").filter(Boolean)
    const dirName = parts.pop()

    if (!dirName) {
      return
    }

    let current: FileSystemItem[] = fileSystem
    const currentPath: FileSystemItem[] = fileSystem

    for (const part of parts) {
      const dir = current.find((item) => item.name === part && item.type === "directory")
      if (!dir || !dir.children) {
        return
      }
      current = dir.children
    }

    // Add new directory
    current.push({
      name: dirName,
      type: "directory",
      children: [],
    })

    // Update file system
    setFileSystem([...fileSystem])
  }

  const createFileInFileSystem = (path: string): void => {
    const parts = path.split("/").filter(Boolean)
    const fileName = parts.pop()

    if (!fileName) {
      return
    }

    let current: FileSystemItem[] = fileSystem

    for (const part of parts) {
      const dir = current.find((item) => item.name === part && item.type === "directory")
      if (!dir || !dir.children) {
        return
      }
      current = dir.children
    }

    // Add new file
    current.push({
      name: fileName,
      type: "file",
      content: "",
    })

    // Update file system
    setFileSystem([...fileSystem])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle up/down arrows for command history
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand("")
      }
    }
  }

  const copyToClipboard = () => {
    const text = history
      .map((item) => {
        return `$ ${item.command}\n${Array.isArray(item.output) ? item.output.join("\n") : item.output}`
      })
      .join("\n\n")

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Terminal output copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  if (!isOpen) return null

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-background shadow-md"
          onClick={() => setIsMinimized(false)}
        >
          <TerminalIcon className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`fixed z-50 overflow-hidden rounded-lg border bg-background shadow-lg ${
        isFullscreen ? "inset-0" : "bottom-4 right-4 h-96 w-[600px]"
      }`}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center">
          <TerminalIcon className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
          <span className="ml-2 text-xs text-muted-foreground">{currentDirectory}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(true)}>
            <Minimize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex h-[calc(100%-40px)] flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="font-mono text-sm">
            {history.map((item) => (
              <div key={item.id} className="mb-2">
                {item.command && (
                  <div className="flex items-center">
                    <span className="mr-2 text-green-500">$</span>
                    <span>{item.command}</span>
                  </div>
                )}
                {item.isLoading ? (
                  <div className="ml-4 text-muted-foreground">Loading...</div>
                ) : (
                  <div className={`ml-4 ${item.isError ? "text-red-500" : ""}`}>
                    {/* Fix: Ensure item.output is always treated as an array */}
                    {Array.isArray(item.output) ? (
                      item.output.map((line, i) => <div key={i}>{line}</div>)
                    ) : (
                      <div>{String(item.output || "")}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Command input */}
        <form onSubmit={handleSubmit} className="border-t p-2">
          <div className="flex items-center">
            <span className="mr-2 text-green-500">$</span>
            <Input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
              placeholder="Type a command..."
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
