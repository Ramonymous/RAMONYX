import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type Item = {
  icon: LucideIcon
  title: string
  path: string
}

interface MainProps {
  items: Item[]
}

export function Main({ items }: MainProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroupContent>
      <div className="px-2 pb-1 text-[0.62rem] font-semibold tracking-[0.18em] text-sidebar-foreground/45 uppercase group-data-[collapsible=icon]:hidden">
        Navigation
      </div>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive =
            item.path === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.path)

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                asChild
                className={cn(
                  "relative h-8 rounded-none border-l-2 border-l-transparent px-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/62 transition-colors duration-150",
                  "hover:bg-sidebar-accent/35 hover:text-sidebar-foreground",
                  "data-[active=true]:border-l-sidebar-primary data-[active=true]:bg-sidebar-primary/12 data-[active=true]:text-sidebar-foreground",
                  "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                  "group-data-[collapsible=icon]:[&>span]:hidden",
                )}
              >
                <RouterLink to={item.path} onClick={handleMenuClick}>
                  <item.icon
                    strokeWidth={1.5}
                    className={cn(
                      "size-4",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/60",
                    )}
                  />
                  <span>{item.title}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  )
}
