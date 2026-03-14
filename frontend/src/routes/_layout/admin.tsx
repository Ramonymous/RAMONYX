import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Suspense } from "react"

import { type UserPublic, UsersService } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { columns, type UserTableData } from "@/components/Admin/columns"
import { DataTable } from "@/components/Common/DataTable"
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/Common/panel"
import PendingUsers from "@/components/Pending/PendingUsers"
import useAuth from "@/hooks/useAuth"
import { getPageTitle } from "@/utils"

function getUsersQueryOptions() {
  return {
    queryFn: () => UsersService.readUsers({ skip: 0, limit: 100 }),
    queryKey: ["users"],
  }
}

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  beforeLoad: async () => {
    const user = await UsersService.readUserMe()
    if (!user.is_superuser) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: getPageTitle("Admin"),
      },
    ],
  }),
})

function UsersTableContent() {
  const { user: currentUser } = useAuth()
  const { data: users } = useSuspenseQuery(getUsersQueryOptions())

  const tableData: UserTableData[] = users.data.map((user: UserPublic) => ({
    ...user,
    isCurrentUser: currentUser?.id === user.id,
  }))

  return <DataTable columns={columns} data={tableData} />
}

function UsersTable() {
  return (
    <Suspense fallback={<PendingUsers />}>
      <UsersTableContent />
    </Suspense>
  )
}

function Admin() {
  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <PanelHeader className="gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="space-y-1">
            <PanelTitle className="text-base normal-case tracking-normal">
              Users
            </PanelTitle>
            <p className="text-xs text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="md:self-start">
            <AddUser />
          </div>
        </PanelHeader>
      </Panel>

      <Panel>
        <PanelBody className="p-2 md:p-3">
          <UsersTable />
        </PanelBody>
      </Panel>
    </div>
  )
}
