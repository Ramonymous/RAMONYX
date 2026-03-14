import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Bell, Command, Search } from "lucide-react"

import { Footer } from "@/components/Common/Footer"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"
import { APP_NAME } from "@/utils"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3 md:px-4">
          <div className="flex items-center gap-1.5">
            <SidebarTrigger className="size-8 rounded-sm border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground" />
            <div className="hidden items-center gap-2 border border-border bg-card px-2 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground md:flex">
              <Command className="size-3.5" />
              <span>{APP_NAME} Console</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-sm border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Search className="size-4" />
              <span className="sr-only">Search</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-sm border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Bell className="size-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-0">
          <div className="mx-auto w-full max-w-7xl px-3 py-2 md:px-4 md:py-3">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
