"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import type { User } from "@/lib/types"

// Mock admin functions
async function getUsers(): Promise<User[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    {
      id: "1",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Test User",
      email: "user@example.com",
      role: "user",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Jane Doe",
      email: "jane@example.com",
      role: "user",
      createdAt: new Date().toISOString(),
    },
  ]
}

async function updateUserRole(userId: string, role: "admin" | "user"): Promise<User> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    id: userId,
    name: "Updated User",
    email: "updated@example.com",
    role,
    createdAt: new Date().toISOString(),
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    const fetchUsers = async () => {
      try {
        const allUsers = await getUsers()
        setUsers(allUsers)
      } catch (error) {
        console.error("Failed to fetch users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchUsers()
    }
  }, [user, router, toast])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole as "admin" | "user")
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole as "admin" | "user" } : u)))
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="mb-8 text-3xl font-bold">User Management</h1>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
