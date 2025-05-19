"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  getProjectUsers,
  addUserToProject,
  updateUserRole,
  removeUserFromProject,
  type ProjectUser,
} from "@/lib/project-users"

interface UserManagementProps {
  projectId: string
}

export default function UserManagement({ projectId }: UserManagementProps) {
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("editor")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const projectUsers = await getProjectUsers(projectId)
        setUsers(projectUsers)
      } catch (error) {
        console.error("Failed to fetch project users:", error)
        toast({
          title: "Error",
          description: "Failed to load project users",
          variant: "destructive",
        })
      }
    }

    fetchUsers()
  }, [projectId, toast])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const newUser = await addUserToProject(projectId, email, role as "editor" | "viewer")
      setUsers([...users, newUser])
      setEmail("")
      toast({
        title: "User added",
        description: `${email} has been added to the project`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user to project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(projectId, userId, newRole as "editor" | "viewer")
      setUsers(users.map((user) => (user.userId === userId ? { ...user, role: newRole as "editor" | "viewer" } : user)))
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

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUserFromProject(projectId, userId)
      setUsers(users.filter((user) => user.userId !== userId))
      toast({
        title: "User removed",
        description: "User has been removed from the project",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user from project",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Project Users</h2>

      <div className="mb-8 rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-medium">Add User</h3>
        <form onSubmit={handleAddUser} className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-40 space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add User"}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No users added to this project yet
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.userId, value)}
                      disabled={user.isOwner}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {!user.isOwner && (
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveUser(user.userId)}>
                        Remove
                      </Button>
                    )}
                    {user.isOwner && <span className="text-sm text-muted-foreground">Owner</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
