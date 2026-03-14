import { Link as RouterLink } from "@tanstack/react-router"
import { ChevronsUpDown, LogOut, Settings } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

interface UserInfoProps {
  fullName?: string
  email?: string
}

function UserInfo({ fullName, email }: UserInfoProps) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Avatar className="size-6 border border-sidebar-border/70">
        <AvatarFallback className="bg-sidebar-accent text-[0.62rem] font-medium text-sidebar-foreground">
          {getInitials(fullName || "User")}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col items-start group-data-[collapsible=icon]:hidden">
        <p className="w-full truncate text-[0.68rem] font-medium tracking-[0.12em] text-sidebar-foreground/82 uppercase">
          {fullName}
        </p>
        <p className="w-full truncate font-mono text-[0.62rem] text-sidebar-foreground/52">
          {email}
        </p>
      </div>
    </div>
  )
}

export function User({ user }: { user: any }) {
  const { logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!user) return null

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  const handleLogout = async () => {
    logout()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-8 rounded-none border-l-2 border-l-transparent px-2 text-sidebar-foreground/78 hover:bg-sidebar-accent/35 hover:text-sidebar-foreground data-[state=open]:border-l-sidebar-primary data-[state=open]:bg-sidebar-primary/12 data-[state=open]:text-sidebar-foreground group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              data-testid="user-menu"
            >
              <UserInfo fullName={user?.full_name} email={user?.email} />
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none border-sidebar-border bg-popover"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <UserInfo fullName={user?.full_name} email={user?.email} />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <RouterLink to="/settings" onClick={handleMenuClick}>
              <DropdownMenuItem className="h-8 rounded-none text-[0.68rem] tracking-[0.12em] uppercase">
                <Settings className="size-4" strokeWidth={1.5} />
                User Settings
              </DropdownMenuItem>
            </RouterLink>
            <DropdownMenuItem
              onClick={handleLogout}
              className="h-8 rounded-none text-[0.68rem] tracking-[0.12em] uppercase"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
