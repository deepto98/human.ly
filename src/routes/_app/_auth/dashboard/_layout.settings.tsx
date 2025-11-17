import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  // Just render the outlet, no tabs or navigation
  return <Outlet />;
}
