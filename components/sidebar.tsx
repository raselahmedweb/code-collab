"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, LogOutIcon } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      name: "Projects",
      href: "/dashboard",
      icon: FileTextIcon,
    },
  ]

  // Add admin-only navigation items
  if (user?.role === "admin") {
    navItems.push({
      name: "Users",
      href: "/admin/users",
      icon: UsersIcon,
    })
  }

  navItems.push({
    name: "Settings",
    href: "/settings",
    icon: SettingsIcon,
  })

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          CodeCollab
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className="justify-start"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-4 pb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10">
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-primary">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={logout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )
}
