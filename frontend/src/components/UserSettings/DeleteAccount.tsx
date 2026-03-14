import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/Common/panel"
import DeleteConfirmation from "./DeleteConfirmation"

const DeleteAccount = () => {
  return (
    <Panel className="max-w-xl border-destructive/50">
      <PanelHeader>
        <PanelTitle className="text-destructive">Delete Account</PanelTitle>
      </PanelHeader>
      <PanelBody>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data.
        </p>
        <DeleteConfirmation />
      </PanelBody>
    </Panel>
  )
}

export default DeleteAccount
