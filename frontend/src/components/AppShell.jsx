import { Outlet } from "react-router-dom";

function AppShell() {
  return (
    <div className="app-shell dashboard-shell">
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
