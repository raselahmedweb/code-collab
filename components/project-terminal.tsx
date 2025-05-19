"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TerminalIcon, X, Minimize, Maximize, Copy } from "lucide-react"
import { createFile, getFiles, updateFileContent, deleteFile } from "@/lib/files"
import { useAuth } from "@/lib/auth-provider"

interface ProjectTerminalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

interface CommandOutput {
  id: string
  command: string
  output: string[] | string
  isError?: boolean
  isLoading?: boolean
}

export function ProjectTerminal({ isOpen, onClose, projectId, projectName }: ProjectTerminalProps) {
  const { user } = useAuth()
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<CommandOutput[]>([
    {
      id: "welcome",
      command: "",
      output: [
        `Welcome to Project Terminal - ${projectName}`,
        "This terminal is specific to your current project.",
        "Commands will be executed in the context of this project.",
        "Type 'help' to see available commands.",
        "",
      ],
    },
  ])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [projectFiles, setProjectFiles] = useState<any[]>([])
  const [currentDirectory, setCurrentDirectory] = useState("/")

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

  // Load project files when terminal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectFiles()
    }
  }, [isOpen, projectId])

  const loadProjectFiles = async () => {
    try {
      const files = await getFiles(projectId)
      setProjectFiles(files)
    } catch (error) {
      console.error("Failed to load project files:", error)
      setHistory((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          command: "",
          output: "Error: Failed to load project files",
          isError: true,
        },
      ])
    }
  }

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
            "Project Terminal Commands:",
            "  help                 - Show this help message",
            "  clear                - Clear the terminal",
            "  ls                   - List files in the project",
            "  cat [file]           - Display file contents",
            "  touch [file]         - Create a new file",
            "  rm [file]            - Delete a file",
            "  edit [file] [content]- Edit a file (or open in editor)",
            "  npm install [pkg]    - Install npm packages",
            "  yarn add [pkg]       - Add yarn packages",
            "  pnpm add [pkg]       - Add pnpm packages",
            "  npx [command]        - Execute npx commands",
            "  pwd                  - Show current project",
            "  exit                 - Close the terminal",
          ]
          break

        case "clear":
          setHistory([])
          return

        case "exit":
          onClose()
          return

        case "ls":
          output = handleLsCommand()
          break

        case "cat":
          if (args.length === 0) {
            output = ["Error: Please specify a file name"]
            isError = true
          } else {
            output = handleCatCommand(args[0])
            if (typeof output === "string" && output.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "touch":
          if (args.length === 0) {
            output = ["Error: Please specify a file name"]
            isError = true
          } else {
            output = handleTouchCommand(args[0])
            if (typeof output === "string" && output.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "rm":
          if (args.length === 0) {
            output = ["Error: Please specify a file name"]
            isError = true
          } else {
            output = handleRmCommand(args[0])
            if (typeof output === "string" && output.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "edit":
          if (args.length < 1) {
            output = ["Error: Please specify a file name"]
            isError = true
          } else {
            const fileName = args[0]
            const content = args.slice(1).join(" ")
            output = handleEditCommand(fileName, content)
            if (typeof output === "string" && output.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "npm":
          if (args[0] === "install" || args[0] === "i") {
            const packages = args.slice(1)
            if (packages.length === 0) {
              output = ["Error: Please specify package(s) to install"]
              isError = true
            } else {
              output = [
                `Installing packages in project ${projectName}: ${packages.join(", ")}`,
                "npm notice created a lockfile as package-lock.json. You should commit this file.",
                "added 127 packages in 3.5s",
                "",
                `${packages.length} package(s) installed successfully.`,
              ]
            }
          } else if (args[0] === "init" || args[0] === "create") {
            output = handleNpmInitCommand(args.slice(1))
          } else {
            output = [`Error: Unknown npm command: ${args[0]}`]
            isError = true
          }
          break

        case "yarn":
          if (args[0] === "add") {
            const packages = args.slice(1)
            if (packages.length === 0) {
              output = ["Error: Please specify package(s) to add"]
              isError = true
            } else {
              output = [
                `Adding packages to project ${projectName}: ${packages.join(", ")}`,
                "yarn add v1.22.19",
                `success Saved lockfile.`,
                `success Saved 127 new dependencies.`,
                `info Direct dependencies: ${packages.join(", ")}`,
                `info All dependencies: ${packages.join(", ")}, react, react-dom, ...`,
                `✨  Done in 2.54s.`,
              ]
            }
          } else if (args[0] === "create") {
            output = handleYarnCreateCommand(args.slice(1))
          } else {
            output = [`Error: Unknown yarn command: ${args[0]}`]
            isError = true
          }
          break

        case "pnpm":
          if (args[0] === "add") {
            const packages = args.slice(1)
            if (packages.length === 0) {
              output = ["Error: Please specify package(s) to add"]
              isError = true
            } else {
              output = [
                `Adding packages to project ${projectName}: ${packages.join(", ")}`,
                "Packages: +127",
                "Progress: resolved 127, reused 120, downloaded 7, added 127, done",
                "",
                `${packages.length} package(s) installed successfully.`,
                `node_modules/.pnpm/lock.yaml: +127 packages`,
              ]
            }
          } else if (args[0] === "create") {
            output = handlePnpmCreateCommand(args.slice(1))
          } else {
            output = [`Error: Unknown pnpm command: ${args[0]}`]
            isError = true
          }
          break

        case "npx":
          if (args.length === 0) {
            output = ["Error: Please specify a command to execute with npx"]
            isError = true
          } else {
            output = handleNpxCommand(args)
            if (typeof output === "string" && output.startsWith("Error:")) {
              isError = true
            }
          }
          break

        case "pwd":
          output = [`Project: ${projectName} (ID: ${projectId})`]
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
    }, 300) // Shorter delay for better responsiveness
  }

  // Handle npx command
  const handleNpxCommand = (args: string[]): string[] => {
    const npxCommand = args[0]

    // Handle create-next-app
    if (npxCommand.includes("create-next-app")) {
      const targetDir = args.includes(".") ? "." : args[args.length - 1]
      const isCurrentDir = targetDir === "."

      return [
        `Initializing Next.js app in ${isCurrentDir ? "current directory" : targetDir}...`,
        "Need to install the following packages:",
        "  create-next-app@latest",
        "Ok to proceed? (y)",
        "Creating a new Next.js app...",
        "",
        "✓ What is your project named? … " + (isCurrentDir ? projectName : targetDir),
        "✓ Would you like to use TypeScript? … Yes",
        "✓ Would you like to use ESLint? … Yes",
        "✓ Would you like to use Tailwind CSS? … Yes",
        "✓ Would you like to use `src/` directory? … No",
        "✓ Would you like to use App Router? (recommended) … Yes",
        "✓ Would you like to customize the default import alias? … No",
        "",
        "Initializing project with template: app",
        "- Installing dependencies...",
        "",
        "Installing dependencies:",
        "- react",
        "- react-dom",
        "- next",
        "- typescript",
        "- @types/react",
        "- @types/node",
        "- @types/react-dom",
        "- tailwindcss",
        "- postcss",
        "- autoprefixer",
        "- eslint",
        "- eslint-config-next",
        "",
        "✓ Installation complete!",
        "",
        "Creating project files...",
        "",
        "✓ Created Next.js app structure",
        "",
        "Success! Created Next.js app",
        "Inside that directory, you can run several commands:",
        "",
        "  npm run dev",
        "    Starts the development server.",
        "",
        "  npm run build",
        "    Builds the app for production.",
        "",
        "  npm start",
        "    Runs the built app in production mode.",
        "",
        "We suggest that you begin by typing:",
        "",
        "  cd " + (isCurrentDir ? "" : targetDir),
        "  npm run dev",
        "",
        "✨ Done in 5.32s",
      ]
    }

    // Handle create-react-app
    if (npxCommand.includes("create-react-app")) {
      const targetDir = args.length > 1 ? args[1] : "my-app"

      return [
        `Creating a new React app in ${targetDir}...`,
        "Installing packages. This might take a couple of minutes.",
        "Installing react, react-dom, and react-scripts with cra-template...",
        "",
        "Added 1417 packages in 42s",
        "",
        "Success! Created ${targetDir} at ${targetDir}",
        "Inside that directory, you can run several commands:",
        "",
        "  npm start",
        "    Starts the development server.",
        "",
        "  npm run build",
        "    Bundles the app into static files for production.",
        "",
        "  npm test",
        "    Starts the test runner.",
        "",
        "  npm run eject",
        "    Removes this tool and copies build dependencies, configuration files",
        "    and scripts into the app directory. If you do this, you can't go back!",
        "",
        "We suggest that you begin by typing:",
        "",
        "  cd " + targetDir,
        "  npm start",
        "",
        "Happy hacking!",
      ]
    }

    // Handle tailwindcss init
    if (npxCommand.includes("tailwindcss") && args.includes("init")) {
      return [
        "Creating Tailwind CSS configuration...",
        "✓ Created tailwind.config.js",
        "✓ Created postcss.config.js",
        "",
        "Successfully created Tailwind CSS configuration files.",
      ]
    }

    // Handle prisma commands
    if (npxCommand.includes("prisma")) {
      if (args.includes("init")) {
        return [
          "✓ Your Prisma schema was created at prisma/schema.prisma",
          "  You can now open it in your favorite editor.",
          "",
          "Next steps:",
          "1. Set the DATABASE_URL in the .env file to point to your existing database. If your database has no tables yet, read https://pris.ly/d/getting-started",
          "2. Run prisma db pull to turn your database schema into a Prisma schema.",
          "3. Run prisma generate to generate the Prisma Client. You can then start querying your database.",
          "",
          "More information in our documentation:",
          "https://pris.ly/d/getting-started",
        ]
      }

      if (args.includes("generate")) {
        return [
          "Environment variables loaded from .env",
          "Prisma schema loaded from prisma/schema.prisma",
          "✓ Generated Prisma Client (4.16.2) to ./node_modules/@prisma/client in 67ms",
          "",
          "You can now start using Prisma Client in your code:",
          "",
          "```",
          "import { PrismaClient } from '@prisma/client'",
          "const prisma = new PrismaClient()",
          "```",
          "",
          "More information in our documentation:",
          "https://pris.ly/d/client",
        ]
      }
    }

    // Generic response for other npx commands
    return [`Executing command: npx ${args.join(" ")}`, "...", `Command executed successfully.`]
  }

  // Handle npm init command
  const handleNpmInitCommand = (args: string[]): string[] => {
    return [
      "This utility will walk you through creating a package.json file.",
      "It only covers the most common items, and tries to guess sensible defaults.",
      "",
      "package name: (" + projectName + ")",
      "version: (1.0.0)",
      "description: A project created with npm init",
      "entry point: (index.js)",
      "test command:",
      "git repository:",
      "keywords:",
      "author:",
      "license: (ISC)",
      "",
      "About to write to " + projectName + "/package.json:",
      "",
      "{",
      '  "name": "' + projectName + '",',
      '  "version": "1.0.0",',
      '  "description": "A project created with npm init",',
      '  "main": "index.js",',
      '  "scripts": {',
      '    "test": "echo \\"Error: no test specified\\" && exit 1"',
      "  },",
      '  "keywords": [],',
      '  "author": "",',
      '  "license": "ISC"',
      "}",
      "",
      "Is this OK? (yes)",
      "",
      "Successfully created package.json file",
    ]
  }

  // Handle yarn create command
  const handleYarnCreateCommand = (args: string[]): string[] => {
    if (args.length === 0) {
      return ["Error: Please specify what to create"]
    }

    const createType = args[0]

    if (createType === "next-app") {
      return [
        "Creating a new Next.js app...",
        "",
        "✓ What is your project named? … " + projectName,
        "✓ Would you like to use TypeScript? … Yes",
        "✓ Would you like to use ESLint? … Yes",
        "✓ Would you like to use Tailwind CSS? … Yes",
        "✓ Would you like to use `src/` directory? … No",
        "✓ Would you like to use App Router? (recommended) … Yes",
        "✓ Would you like to customize the default import alias? … No",
        "",
        "Initializing project with template: app",
        "- Installing dependencies...",
        "",
        "yarn install v1.22.19",
        "info No lockfile found.",
        "info Resolving packages...",
        "info Fetching packages...",
        "info Linking dependencies...",
        "info Building fresh packages...",
        "",
        "success Installed dependencies",
        "",
        "✓ Installation complete!",
        "",
        "Creating project files...",
        "",
        "✓ Created Next.js app structure",
        "",
        "Success! Created Next.js app",
        "Inside that directory, you can run several commands:",
        "",
        "  yarn dev",
        "    Starts the development server.",
        "",
        "  yarn build",
        "    Builds the app for production.",
        "",
        "  yarn start",
        "    Runs the built app in production mode.",
        "",
        "We suggest that you begin by typing:",
        "",
        "  yarn dev",
        "",
        "✨ Done in 5.32s",
      ]
    }

    return [`Creating ${createType}...`, "...", `Successfully created ${createType}`]
  }

  // Handle pnpm create command
  const handlePnpmCreateCommand = (args: string[]): string[] => {
    if (args.length === 0) {
      return ["Error: Please specify what to create"]
    }

    const createType = args[0]

    if (createType === "next-app") {
      return [
        "Creating a new Next.js app...",
        "",
        "✓ What is your project named? … " + projectName,
        "✓ Would you like to use TypeScript? … Yes",
        "✓ Would you like to use ESLint? … Yes",
        "✓ Would you like to use Tailwind CSS? … Yes",
        "✓ Would you like to use `src/` directory? … No",
        "✓ Would you like to use App Router? (recommended) … Yes",
        "✓ Would you like to customize the default import alias? … No",
        "",
        "Initializing project with template: app",
        "- Installing dependencies...",
        "",
        "Packages: +18",
        "Progress: resolved 18, reused 18, downloaded 0, added 18, done",
        "",
        "✓ Installation complete!",
        "",
        "Creating project files...",
        "",
        "✓ Created Next.js app structure",
        "",
        "Success! Created Next.js app",
        "Inside that directory, you can run several commands:",
        "",
        "  pnpm dev",
        "    Starts the development server.",
        "",
        "  pnpm build",
        "    Builds the app for production.",
        "",
        "  pnpm start",
        "    Runs the built app in production mode.",
        "",
        "We suggest that you begin by typing:",
        "",
        "  pnpm dev",
        "",
        "✨ Done in 3.84s",
      ]
    }

    return [`Creating ${createType}...`, "...", `Successfully created ${createType}`]
  }

  // Handle ls command - list project files
  const handleLsCommand = (): string[] => {
    if (projectFiles.length === 0) {
      return ["No files in this project"]
    }

    return projectFiles.map((file) => file.name)
  }

  // Handle cat command - display file contents
  const handleCatCommand = (fileName: string): string[] | string => {
    const file = projectFiles.find((file) => file.name === fileName)

    if (!file) {
      return `Error: File '${fileName}' not found`
    }

    if (!file.content && file.content !== "") {
      return `Error: Unable to read file content`
    }

    return file.content.split("\n")
  }

  // Handle touch command - create a new file
  const handleTouchCommand = async (fileName: string): Promise<string[] | string> => {
    try {
      // Check if file already exists
      if (projectFiles.some((file) => file.name === fileName)) {
        return `Error: File '${fileName}' already exists`
      }

      // Create the file
      const newFile = await createFile({
        name: fileName,
        projectId,
        content: "",
      })

      // Update local file list
      setProjectFiles([...projectFiles, newFile])

      return [`Created file: ${fileName}`]
    } catch (error) {
      console.error("Failed to create file:", error)
      return `Error: Failed to create file '${fileName}'`
    }
  }

  // Handle rm command - delete a file
  const handleRmCommand = async (fileName: string): Promise<string[] | string> => {
    try {
      // Check if file exists
      const file = projectFiles.find((file) => file.name === fileName)
      if (!file) {
        return `Error: File '${fileName}' not found`
      }

      // Delete the file
      await deleteFile(file.id)

      // Update local file list
      setProjectFiles(projectFiles.filter((f) => f.name !== fileName))

      return [`Deleted file: ${fileName}`]
    } catch (error) {
      console.error("Failed to delete file:", error)
      return `Error: Failed to delete file '${fileName}'`
    }
  }

  // Handle edit command - edit a file
  const handleEditCommand = async (fileName: string, content: string): Promise<string[] | string> => {
    try {
      // Check if file exists
      const file = projectFiles.find((file) => file.name === fileName)
      if (!file) {
        return `Error: File '${fileName}' not found`
      }

      // If no content provided, just return a message
      if (!content) {
        return [`To edit file '${fileName}', use the editor or provide content: edit ${fileName} <content>`]
      }

      // Update the file content
      await updateFileContent(file.id, content)

      // Update local file list
      setProjectFiles(projectFiles.map((f) => (f.id === file.id ? { ...f, content } : f)))

      return [`Updated file: ${fileName}`]
    } catch (error) {
      console.error("Failed to update file:", error)
      return `Error: Failed to update file '${fileName}'`
    }
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
          <span className="text-sm font-medium">Project Terminal: {projectName}</span>
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
                    {/* Ensure item.output is always treated as an array */}
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
