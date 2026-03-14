import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function PanelActionButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-8 rounded-sm border-border bg-background px-2.5 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground",
        "hover:bg-accent/40 hover:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { PanelActionButton }
