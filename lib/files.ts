export interface File {
  id: string
  name: string
  projectId: string
  content: string
  createdAt: string
  updatedAt: string
}

// Mock files database
const files: File[] = [
  {
    id: "1",
    name: "index.js",
    projectId: "1",
    content: 'console.log("Hello, world!");',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "styles.css",
    projectId: "1",
    content: "body { font-family: sans-serif; }",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function getFiles(projectId: string): Promise<File[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Get files from localStorage if available
  if (typeof window !== "undefined") {
    try {
      const storedFiles = localStorage.getItem(`project_files_${projectId}`)
      if (storedFiles) {
        return JSON.parse(storedFiles)
      }
    } catch (error) {
      console.error("Error reading files from localStorage:", error)
    }
  }

  // Fallback to mock data
  return files.filter((file) => file.projectId === projectId)
}

export async function getFile(id: string): Promise<File> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Try to find file in localStorage first
  if (typeof window !== "undefined") {
    try {
      const allProjects = Object.keys(localStorage)
        .filter((key) => key.startsWith("project_files_"))
        .flatMap((key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || "[]")
          } catch (e) {
            return []
          }
        })

      const storedFile = allProjects.find((f: File) => f.id === id)
      if (storedFile) {
        return storedFile
      }
    } catch (error) {
      console.error("Error finding file in localStorage:", error)
    }
  }

  // Fallback to mock data
  const file = files.find((f) => f.id === id)

  if (!file) {
    throw new Error("File not found")
  }

  return file
}

export async function createFile(data: {
  name: string
  projectId: string
  content: string
}): Promise<File> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("Creating file with data:", data)

  // Generate a unique ID
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const newFile: File = {
    id: fileId,
    name: data.name,
    projectId: data.projectId,
    content: data.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Store in localStorage for persistence
  if (typeof window !== "undefined") {
    try {
      // Get existing files for this project
      const existingFilesJson = localStorage.getItem(`project_files_${data.projectId}`)
      const existingFiles = existingFilesJson ? JSON.parse(existingFilesJson) : []

      // Add new file
      const updatedFiles = [...existingFiles, newFile]

      // Save back to localStorage
      localStorage.setItem(`project_files_${data.projectId}`, JSON.stringify(updatedFiles))
      console.log("File saved to localStorage:", newFile)
    } catch (error) {
      console.error("Error saving file to localStorage:", error)
    }
  }

  // Also add to our in-memory array
  files.push(newFile)

  return newFile
}

export async function updateFileContent(id: string, content: string): Promise<File> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  let updatedFile: File | null = null

  // Try to update in localStorage first
  if (typeof window !== "undefined") {
    try {
      const projectKeys = Object.keys(localStorage).filter((key) => key.startsWith("project_files_"))

      for (const key of projectKeys) {
        const filesJson = localStorage.getItem(key)
        if (!filesJson) continue

        const projectFiles = JSON.parse(filesJson)
        const fileIndex = projectFiles.findIndex((f: File) => f.id === id)

        if (fileIndex !== -1) {
          // Update the file
          updatedFile = {
            ...projectFiles[fileIndex],
            content,
            updatedAt: new Date().toISOString(),
          }

          projectFiles[fileIndex] = updatedFile

          // Save back to localStorage
          localStorage.setItem(key, JSON.stringify(projectFiles))
          break
        }
      }
    } catch (error) {
      console.error("Error updating file in localStorage:", error)
    }
  }

  // If not found in localStorage, update in-memory array
  if (!updatedFile) {
    const fileIndex = files.findIndex((f) => f.id === id)

    if (fileIndex === -1) {
      throw new Error("File not found")
    }

    updatedFile = {
      ...files[fileIndex],
      content,
      updatedAt: new Date().toISOString(),
    }

    files[fileIndex] = updatedFile
  }

  return updatedFile
}

export async function deleteFile(id: string): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Try to delete from localStorage first
  if (typeof window !== "undefined") {
    try {
      const projectKeys = Object.keys(localStorage).filter((key) => key.startsWith("project_files_"))

      for (const key of projectKeys) {
        const filesJson = localStorage.getItem(key)
        if (!filesJson) continue

        const projectFiles = JSON.parse(filesJson)
        const fileIndex = projectFiles.findIndex((f: File) => f.id === id)

        if (fileIndex !== -1) {
          // Remove the file
          projectFiles.splice(fileIndex, 1)

          // Save back to localStorage
          localStorage.setItem(key, JSON.stringify(projectFiles))
          break
        }
      }
    } catch (error) {
      console.error("Error deleting file from localStorage:", error)
    }
  }

  // Also remove from in-memory array
  const fileIndex = files.findIndex((f) => f.id === id)
  if (fileIndex !== -1) {
    files.splice(fileIndex, 1)
  }
}
