// This is a mock implementation for demonstration purposes
// In a real application, you would use a proper authentication system

import type { User } from "./types"

// Mock user database
const users: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Test User",
    email: "user@example.com",
    password: "user123",
    role: "user",
    createdAt: new Date().toISOString(),
  },
]

export async function login(email: string, password: string): Promise<User> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = users.find((u) => u.email === email && u.password === password)

  if (!user) {
    throw new Error("Invalid email or password")
  }

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user

  // Store user in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(userWithoutPassword))
    console.log("User stored in localStorage:", userWithoutPassword)
  }

  return userWithoutPassword as User
}

export async function register(name: string, email: string, password: string): Promise<User> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Check if user already exists
  if (users.some((u) => u.email === email)) {
    throw new Error("User already exists")
  }

  // Create new user
  const newUser: User = {
    id: String(users.length + 1),
    name,
    email,
    password,
    role: "user",
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)

  // Don't return the password
  const { password: _, ...userWithoutPassword } = newUser
  return userWithoutPassword as User
}

export async function getCurrentUser(): Promise<User | null> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Get user from localStorage
  if (typeof window !== "undefined") {
    const userJson = localStorage.getItem("user")
    if (userJson) {
      return JSON.parse(userJson)
    }
  }

  return null
}

export async function logout(): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Remove user from localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}
