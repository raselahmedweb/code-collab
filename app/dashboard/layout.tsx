"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import Sidebar from "@/components/sidebar"
import { Terminal } from "@/components/terminal"
import { Button } from "@/components/ui/button"
import { TerminalIcon } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run this check on the client side and after loading is complete
    if (isClient && !loading) {
      // Check localStorage directly as a fallback
      const storedUser = localStorage.getItem("user")

      if (!user && !storedUser) {
        console.log("No authenticated user found, redirecting to login...")
        router.push("/login")
      } else {
        console.log("User authenticated, staying on dashboard")
      }
    }
  }, [user, loading, router, isClient])

  // Show loading state while checking authentication
  if (loading || !isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // If we have a user in localStorage but not in context, try to use localStorage data
  const storedUser = isClient ? localStorage.getItem("user") : null
  const hasAuth = user || storedUser

  if (!hasAuth) {
    // This should not normally render as the useEffect should redirect
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>Not authenticated. Redirecting to login...</p>
        <button onClick={() => router.push("/login")} className="px-4 py-2 bg-primary text-white rounded">
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto relative">
        {children}

        {/* Terminal toggle button */}
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-background shadow-md"
            onClick={() => setIsTerminalOpen(true)}
          >
            <TerminalIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Terminal component */}
        <Terminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />
      </div>
    </div>
  )
}
