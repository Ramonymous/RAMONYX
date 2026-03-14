import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Suspense } from "react"

import { type ItemPublic, ItemsService } from "@/client"
import { PanelActionButton } from "@/components/Common/PanelActionButton"
import { DataTable } from "@/components/Common/DataTable"
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/Common/panel"
import PendingItems from "@/components/Pending/PendingItems"
import useAuth from "@/hooks/useAuth"
import { getPageTitle } from "@/utils"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: getPageTitle("Dashboard"),
      },
    ],
  }),
})

const dashboardColumns: ColumnDef<ItemPublic>[] = [
  {
    accessorKey: "id",
    header: "Record ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const hasDescription = Boolean(row.original.description?.trim())
      return (
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span
            className={`size-2 rounded-full ${
              hasDescription ? "bg-primary" : "bg-muted-foreground"
            }`}
          />
          {hasDescription ? "Ready" : "Pending"}
        </span>
      )
    },
  },
]

function getItemsQueryOptions() {
  return {
    queryFn: () => ItemsService.readItems({ skip: 0, limit: 100 }),
    queryKey: ["items"],
  }
}

function DashboardContent() {
  const { user: currentUser } = useAuth()
  const { data: items } = useSuspenseQuery(getItemsQueryOptions())
  const displayName = currentUser?.full_name || currentUser?.email || "there"

  const itemsWithDescription = items.data.filter((item) =>
    Boolean(item.description?.trim()),
  ).length

  const kpis = [
    {
      label: "Total Items",
      value: items.count,
    },
    {
      label: "Ready Records",
      value: itemsWithDescription,
    },
    {
      label: "Pending Records",
      value: items.count - itemsWithDescription,
    },
    {
      label: "Admin Mode",
      value: currentUser?.is_superuser ? 1 : 0,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <PanelHeader className="gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="space-y-1">
            <p className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">
              Dashboard Summary
            </p>
            <PanelTitle className="text-base normal-case tracking-normal">
              {displayName}
            </PanelTitle>
            <p className="text-xs text-muted-foreground">
              KPI snapshot and recent records
            </p>
          </div>
          <PanelActionButton>
            Dashboard Overview
          </PanelActionButton>
        </PanelHeader>
        <PanelBody className="grid grid-cols-2 gap-2 pt-0 md:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="border border-border bg-background px-3 py-2">
              <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </p>
              <p className="mt-1 font-mono text-xl font-semibold">{kpi.value}</p>
            </div>
          ))}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <PanelTitle className="text-sm">Recent Records</PanelTitle>
        </PanelHeader>
        <PanelBody className="p-2 md:p-3">
          <DataTable columns={dashboardColumns} data={items.data.slice(0, 12)} />
        </PanelBody>
      </Panel>
    </div>
  )
}

function Dashboard() {
  return (
    <Suspense fallback={<PendingItems />}>
      <DashboardContent />
    </Suspense>
  )
}
