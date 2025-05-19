"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebug() {
  const [localStorageUser, setLocalStorageUser] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageUser(localStorage.getItem("user"))
    }
  }, [])

  const clearStorage = () => {
    localStorage.removeItem("user")
    setLocalStorageUser(null)
    window.location.reload()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>Check your authentication state</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <h3 className="font-medium">LocalStorage User:</h3>
            <pre className="mt-2 rounded bg-muted p-2 text-xs">
              {localStorageUser ? JSON.stringify(JSON.parse(localStorageUser), null, 2) : "No user in localStorage"}
            </pre>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" onClick={clearStorage}>
          Clear Auth Storage
        </Button>
        <Button className="ml-2" onClick={() => (window.location.href = "/dashboard")}>
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  )
}
