import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_auth/agents/create/_layout")({
  component: CreateAgentLayout,
});

function CreateAgentLayout() {
  return <Outlet />;
}
