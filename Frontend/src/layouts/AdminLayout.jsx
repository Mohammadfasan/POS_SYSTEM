import {
  Outlet,
} from "react-router-dom";

import AdminSidebar from "../components/admin/AdminSidebar";

import AdminHeader from "../components/admin/AdminHeader";

const AdminLayout = () => {
  return (
    <div
      className="
        min-h-screen
        bg-slate-100
      "
    >
      <AdminSidebar />

      <div
        className="
          ml-72
          min-h-screen
        "
      >
        <AdminHeader />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;