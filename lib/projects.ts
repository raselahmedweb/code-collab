export interface Project {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
  files?: { id: string; name: string }[]
}

// Mock projects database
const projects: Project[] = [
  {
    id: "1",
    name: "Sample Project",
    ownerId: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [
      { id: "1", name: "index.js" },
      { id: "2", name: "styles.css" },
    ],
  },
]

export async function getProjects(userId: string): Promise<Project[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Try to get projects from localStorage first
  if (typeof window !== "undefined") {
    try {
      const storedProjects = localStorage.getItem(`user_projects_${userId}`)
      if (storedProjects) {
        return JSON.parse(storedProjects)
      }
    } catch (error) {
      console.error("Error reading projects from localStorage:", error)
    }
  }

  // Return projects owned by the user from mock data
  return projects.filter((project) => project.ownerId === userId)
}

export async function getProject(id: string): Promise<Project> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Try to get project from localStorage first
  if (typeof window !== "undefined") {
    try {
      const allUserProjects = Object.keys(localStorage)
        .filter((key) => key.startsWith("user_projects_"))
        .flatMap((key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || "[]")
          } catch (e) {
            return []
          }
        })

      const storedProject = allUserProjects.find((p: Project) => p.id === id)
      if (storedProject) {
        return storedProject
      }
    } catch (error) {
      console.error("Error finding project in localStorage:", error)
    }
  }

  // Fallback to mock data
  const project = projects.find((p) => p.id === id)

  if (!project) {
    throw new Error("Project not found")
  }

  return project
}

export async function createProject(data: {
  name: string
  ownerId: string
}): Promise<Project> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Generate a unique ID
  const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const newProject: Project = {
    id: projectId,
    name: data.name,
    ownerId: data.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
  }

  // Store in localStorage for persistence
  if (typeof window !== "undefined") {
    try {
      // Get existing projects for this user
      const existingProjectsJson = localStorage.getItem(`user_projects_${data.ownerId}`)
      const existingProjects = existingProjectsJson ? JSON.parse(existingProjectsJson) : []

      // Add new project
      const updatedProjects = [...existingProjects, newProject]

      // Save back to localStorage
      localStorage.setItem(`user_projects_${data.ownerId}`, JSON.stringify(updatedProjects))
      console.log("Project saved to localStorage:", newProject)

      // Initialize empty files array for this project
      localStorage.setItem(`project_files_${projectId}`, JSON.stringify([]))
    } catch (error) {
      console.error("Error saving project to localStorage:", error)
    }
  }

  // Also add to our in-memory array
  projects.push(newProject)

  return newProject
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  let updatedProject: Project | null = null

  // Try to update in localStorage first
  if (typeof window !== "undefined") {
    try {
      const userKeys = Object.keys(localStorage).filter((key) => key.startsWith("user_projects_"))

      for (const key of userKeys) {
        const projectsJson = localStorage.getItem(key)
        if (!projectsJson) continue

        const userProjects = JSON.parse(projectsJson)
        const projectIndex = userProjects.findIndex((p: Project) => p.id === id)

        if (projectIndex !== -1) {
          // Update the project
          updatedProject = {
            ...userProjects[projectIndex],
            ...data,
            updatedAt: new Date().toISOString(),
          }

          userProjects[projectIndex] = updatedProject

          // Save back to localStorage
          localStorage.setItem(key, JSON.stringify(userProjects))
          break
        }
      }
    } catch (error) {
      console.error("Error updating project in localStorage:", error)
    }
  }

  // If not found in localStorage, update in-memory array
  if (!updatedProject) {
    const projectIndex = projects.findIndex((p) => p.id === id)

    if (projectIndex === -1) {
      throw new Error("Project not found")
    }

    updatedProject = {
      ...projects[projectIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    projects[projectIndex] = updatedProject
  }

  return updatedProject
}

export async function deleteProject(id: string): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Try to delete from localStorage first
  if (typeof window !== "undefined") {
    try {
      // Delete project files
      localStorage.removeItem(`project_files_${id}`)

      // Delete project from user projects
      const userKeys = Object.keys(localStorage).filter((key) => key.startsWith("user_projects_"))

      for (const key of userKeys) {
        const projectsJson = localStorage.getItem(key)
        if (!projectsJson) continue

        const userProjects = JSON.parse(projectsJson)
        const projectIndex = userProjects.findIndex((p: Project) => p.id === id)

        if (projectIndex !== -1) {
          // Remove the project
          userProjects.splice(projectIndex, 1)

          // Save back to localStorage
          localStorage.setItem(key, JSON.stringify(userProjects))
          break
        }
      }
    } catch (error) {
      console.error("Error deleting project from localStorage:", error)
    }
  }

  // Also remove from in-memory array
  const projectIndex = projects.findIndex((p) => p.id === id)
  if (projectIndex !== -1) {
    projects.splice(projectIndex, 1)
  }
}
