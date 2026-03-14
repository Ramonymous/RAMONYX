import { Link } from "@tanstack/react-router"

import { APP_NAME } from "@/utils"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const brandIcon = (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 via-indigo-500 to-cyan-400 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20",
      )}
      aria-hidden="true"
    >
      R
    </span>
  )

  const brandText = (
    <span className="leading-none">
      <span className="block text-sm font-semibold tracking-wide text-foreground">
        {APP_NAME}
      </span>
      <span className="block text-[0.68rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Manufacturing Execution
      </span>
    </span>
  )

  const content =
    variant === "responsive" ? (
      <div className={cn("flex items-center gap-3", className)}>
        {brandIcon}
        <span className="group-data-[collapsible=icon]:hidden">{brandText}</span>
      </div>
    ) : variant === "icon" ? (
      <span className={className}>{brandIcon}</span>
    ) : (
      <div className={cn("flex items-center gap-3", className)}>
        {brandIcon}
        {brandText}
      </div>
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
