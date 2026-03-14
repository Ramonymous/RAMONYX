import { Briefcase, Home, Users } from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

const baseItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Briefcase, title: "Items", path: "/items" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  const items = currentUser?.is_superuser
    ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
    : baseItems

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="px-2 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo
          variant="responsive"
          className="w-full group-data-[collapsible=icon]:justify-center"
        />
      </SidebarHeader>
      <SidebarContent className="px-1 py-1">
        <Main items={items} />
      </SidebarContent>
      <SidebarFooter className="gap-1 border-t border-border/40 px-1 py-1">
        <SidebarAppearance />
        <SidebarSeparator className="mx-0 bg-border/40" />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
