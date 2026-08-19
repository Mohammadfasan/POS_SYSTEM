import { Outlet } from "react-router-dom";

import CashierSidebar from "../components/cashier/CashierSidebar";
import CashierHeader from "../components/cashier/CashierHeader";

const CashierLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <CashierSidebar />

      <div className="ml-64 min-h-screen">
        <CashierHeader />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CashierLayout;