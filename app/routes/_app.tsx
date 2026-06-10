import { Outlet } from "react-router";
import { AppShell } from "~/features/wareflow/components/app-shell";
import { ToastProvider } from "~/features/wareflow/components/toast";

/**
 * Pathless layout for the whole authenticated warehouse app: persistent left
 * nav + toast feedback. All capability screens render inside here.
 */
export default function AppLayout() {
  return (
    <ToastProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </ToastProvider>
  );
}
