import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/ui/app-layout";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
