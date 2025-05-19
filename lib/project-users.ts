import type { User } from "./types"

export interface ProjectUser {
  userId: string
  projectId: string
  role: "editor" | "viewer"
  isOwner: boolean
  user: User
}

// Mock project users database
const projectUsers: ProjectUser[] = [
  {
    userId: "1",
    projectId: "1",
    role: "editor",
    isOwner: true,
    user: {
      id: "1",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
  },
]

export async function getProjectUsers(projectId: string): Promise<ProjectUser[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return projectUsers.filter((pu) => pu.projectId === projectId)
}

export async function addUserToProject(
  projectId: string,
  email: string,
  role: "editor" | "viewer",
): Promise<ProjectUser> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Mock finding user by email
  const user: User = {
    id: String(Math.floor(Math.random() * 1000) + 10),
    name: email.split("@")[0],
    email,
    role: "user",
    createdAt: new Date().toISOString(),
  }

  const newProjectUser: ProjectUser = {
    userId: user.id,
    projectId,
    role,
    isOwner: false,
    user,
  }

  projectUsers.push(newProjectUser)
  return newProjectUser
}

export async function updateUserRole(
  projectId: string,
  userId: string,
  role: "editor" | "viewer",
): Promise<ProjectUser> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const projectUserIndex = projectUsers.findIndex((pu) => pu.projectId === projectId && pu.userId === userId)

  if (projectUserIndex === -1) {
    throw new Error("Project user not found")
  }

  const updatedProjectUser = {
    ...projectUsers[projectUserIndex],
    role,
  }

  projectUsers[projectUserIndex] = updatedProjectUser
  return updatedProjectUser
}

export async function removeUserFromProject(projectId: string, userId: string): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const projectUserIndex = projectUsers.findIndex((pu) => pu.projectId === projectId && pu.userId === userId)

  if (projectUserIndex === -1) {
    throw new Error("Project user not found")
  }

  projectUsers.splice(projectUserIndex, 1)
}
