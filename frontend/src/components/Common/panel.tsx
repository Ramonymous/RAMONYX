import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn("rounded-sm border-border bg-card shadow-none", className)}
      {...props}
    />
  )
}

function PanelHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <CardHeader
      className={cn("flex flex-col gap-1 px-4 py-3", className)}
      {...props}
    />
  )
}

function PanelTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <CardTitle
      className={cn("text-sm font-semibold uppercase tracking-wide", className)}
      {...props}
    />
  )
}

function PanelDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <CardDescription className={cn("text-xs", className)} {...props} />
  )
}

function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <CardContent className={cn("px-4 py-3", className)} {...props} />
}

export { Panel, PanelBody, PanelDescription, PanelHeader, PanelTitle }
