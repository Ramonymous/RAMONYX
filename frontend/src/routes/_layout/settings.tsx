import { createFileRoute } from "@tanstack/react-router"
import { ShieldCheck, UserCog } from "lucide-react"

import { PanelActionButton } from "@/components/Common/PanelActionButton"
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/Common/panel"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAuth from "@/hooks/useAuth"
import { getPageTitle } from "@/utils"

const tabsConfig = [
  { value: "my-profile", title: "My profile", component: UserInformation },
  { value: "password", title: "Password", component: ChangePassword },
  { value: "danger-zone", title: "Danger zone", component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
  head: () => ({
    meta: [
      {
        title: getPageTitle("Settings"),
      },
    ],
  }),
})

function UserSettings() {
  const { user: currentUser } = useAuth()
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <PanelHeader className="gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="space-y-1">
            <PanelTitle className="text-base normal-case tracking-normal">
              User Settings
            </PanelTitle>
            <p className="text-xs text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <PanelActionButton>
            <ShieldCheck className="size-4" />
            Secure Profile
          </PanelActionButton>
        </PanelHeader>
      </Panel>

      <Panel>
        <PanelBody>
          <Tabs defaultValue="my-profile">
            <TabsList className="h-auto gap-1 rounded-sm border border-border bg-muted/20 p-1">
              {finalTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-sm border border-transparent px-2.5 py-1 text-[0.68rem] uppercase tracking-wider data-[state=active]:border-border data-[state=active]:bg-background"
                >
                  <UserCog className="size-4" />
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {finalTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-3">
                <tab.component />
              </TabsContent>
            ))}
          </Tabs>
        </PanelBody>
      </Panel>
    </div>
  )
}
