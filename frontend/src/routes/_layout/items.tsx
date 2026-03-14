import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { ItemsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import {
  Panel,
  PanelBody,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/Common/panel"
import AddItem from "@/components/Items/AddItem"
import { columns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"
import { getPageTitle } from "@/utils"

function getItemsQueryOptions() {
  return {
    queryFn: () => ItemsService.readItems({ skip: 0, limit: 100 }),
    queryKey: ["items"],
  }
}

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  head: () => ({
    meta: [
      {
        title: getPageTitle("Items"),
      },
    ],
  }),
})

function ItemsContent() {
  const { data: items } = useSuspenseQuery(getItemsQueryOptions())
  const itemsWithDescription = items.data.filter((item) =>
    Boolean(item.description?.trim()),
  ).length
  const kpis = [
    { label: "Total Items", value: items.count },
    { label: "Ready Records", value: itemsWithDescription },
    { label: "Pending Records", value: items.count - itemsWithDescription },
  ]

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <PanelHeader className="gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="space-y-1">
            <p className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">
              Resource Library
            </p>
            <PanelTitle className="text-base normal-case tracking-normal">
              Items
            </PanelTitle>
            <PanelDescription>
              Create, review, and maintain your operational records.
            </PanelDescription>
          </div>
          <div className="md:self-start">
            <AddItem />
          </div>
        </PanelHeader>
        <PanelBody className="grid grid-cols-1 gap-2 pt-0 md:grid-cols-3">
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

      {items.data.length === 0 ? (
        <Panel className="border-dashed">
          <PanelBody className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-sm border border-border bg-muted/20 p-3">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              No Items Available
            </h3>
            <p className="text-xs text-muted-foreground">
              Create your first item to start building your workspace.
            </p>
          </PanelBody>
        </Panel>
      ) : (
        <Panel>
          <PanelHeader>
            <PanelTitle className="text-sm">All Records</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-2 md:p-3">
            <DataTable columns={columns} data={items.data} />
          </PanelBody>
        </Panel>
      )}
    </div>
  )
}

function Items() {
  return (
    <Suspense fallback={<PendingItems />}>
      <ItemsContent />
    </Suspense>
  )
}
