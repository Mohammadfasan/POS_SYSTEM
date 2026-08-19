import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";

import ProtectedRoute from "./components/ProtectedRoute";

// ==========================================
// ADMIN
// ==========================================

import AdminLayout from "./layouts/AdminLayout";



import AdminPlaceholder from "./pages/admin/AdminPlaceholder";

import Categories from "./pages/admin/Categories";
import Units from "./pages/admin/Units";
import Products from "./pages/admin/Products";
import Terminals from "./pages/admin/Terminals";
import Inventory from "./pages/admin/Inventory";
import StockMovements from "./pages/admin/StockMovements";
import Users from "./pages/admin/Users";
import Dashboard from "./pages/admin/Dashboard";
import Branches from "./pages/admin/Branches";
import Sales from "./pages/admin/Sales";
import Promotions from "./pages/admin/Promotions";
import Discounts from "./pages/admin/Discounts";
import Returns from "./pages/admin/Returns";
import VoidRequests from "./pages/admin/VoidRequests";
import Shifts from "./pages/admin/Shifts";
import CashDrawers from "./pages/admin/CashDrawers";
import Reports from "./pages/admin/Reports";
import AuditLogs from "./pages/admin/AuditLogs";
import Notifications from "./pages/admin/Notifications";
import Settings from "./pages/admin/Settings";





// ==========================================
// CASHIER
// ==========================================

import CashierLayout from "./layouts/CashierLayout";


// ==========================================
// MANAGER
// ==========================================

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerProducts from "./pages/manager/Products";
import ManagerInventory from "./pages/manager/Inventory"
import ManagerStockMovements from "./pages/manager/StockMovements";
import ManagerPromotions from "./pages/manager/Promotions";
import ManagerDiscounts from "./pages/manager/Discounts";
import ManagerReturns from "./pages/manager/Returns";
import ManagerVoidRequests from "./pages/manager/VoidRequests";
import ManagerShifts from "./pages/manager/Shifts";
import ManagerCashDrawers from "./pages/manager/CashDrawers";
import ManagerReports from "./pages/manager/Reports";
import ManagerAuditLogs from "./pages/manager/AuditLogs";
import ManagerNotifications from "./pages/manager/Notifications";
import ManagerSales from  "./pages/manager/Sales"


import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierNewSale from "./pages/cashier/NewSale";
import Payment from "./pages/cashier/Payment";
import CashierHoldBilling from "./pages/cashier/HeldBilling";
import CashierSalesHistory from "./pages/cashier/SalesHistory";
import CashierReturn from "./pages/cashier/Return";
import CashierVoidRequest from "./pages/cashier/VoidRequest";
import CashierProducts from "./pages/cashier/Products";
import CashDrawer from "./pages/cashier/CashDrawer";
import CashierShiftManagement from "./pages/cashier/ShiftManagement";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================
            LOGIN
        ====================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =====================================
            DEFAULT
        ====================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =====================================
            ADMIN ROUTES
        ====================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          {/* ADMIN DASHBOARD */}

          <Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <Dashboard />
    </ProtectedRoute>
  }
/>

          {/* PRODUCTS */}

          <Route
            path="products"
            element={<Products />}
             />

          {/* CATEGORIES */}

          <Route
            path="categories"
            element={
              <Categories />
            }
          />

          {/* UNITS */}

          <Route
           path="units"
           element={<Units />}
          />

          {/* INVENTORY */}

          <Route
            path="inventory"
            element={
              <Inventory />
            }
          />

          {/* STOCK MOVEMENTS */}

          <Route
            path="stock-movements"
            element={
              <StockMovements />
            }
          />

          {/* BRANCHES */}

          <Route
  path="/admin/branches"
  element={<Branches />}
/>
          {/* TERMINALS */}
          <Route
          path="terminals"
          element={<Terminals />}
          />

          {/* USERS */}

          <Route
  path="users"
  element={<Users />}
/>

          {/* SALES */}

          <Route
  path="/admin/sales"
  element={<Sales />}
/>

          {/* PROMOTIONS */}

          <Route
  path="/admin/promotions"
  element={<Promotions />}
/>

          {/* DISCOUNTS */}

          <Route
  path="/admin/discounts"
  element={<Discounts />}
/>

          {/* RETURNS */}

         <Route
  path="/admin/returns"
  element={<Returns />}
/>

          {/* VOID REQUESTS */}

         <Route
  path="/admin/void-requests"
  element={<VoidRequests />}
/>

          {/* SHIFTS */}
<Route
  path="/admin/shifts"
  element={<Shifts />}
/>

          {/* CASH DRAWERS */}

        <Route
  path="/admin/cash-drawers"
  element={<CashDrawers />}
/>

          {/* REPORTS */}
<Route
  path="/admin/reports"
  element={<Reports />}
/>

          {/* AUDIT LOGS */}

          <Route
  path="/admin/audit-logs"
  element={<AuditLogs />}
/>

          {/* NOTIFICATIONS */}

          <Route
  path="/admin/notifications"
  element={<Notifications />}
/>

          {/* SETTINGS */}

          <Route
  path="/admin/settings"
  element={<Settings />}
/>

        </Route>

        {/* =====================================
            MANAGER
        ====================================== */}

        <Route
          path="/manager"
          element={
            <ProtectedRoute
              allowedRoles={["MANAGER"]}
            >
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />


        <Route
  path="/manager"
  element={<ManagerLayout />}
>
  <Route
    index
    element={<ManagerDashboard />}
  />
  <Route
    path="sales"
    element={<ManagerSales />}
  />

  <Route
    path="products"
    element={<ManagerProducts />}
  />
  <Route
    path="inventory" 
    element={<ManagerInventory/>}/>

  
  <Route
    path="stock-movements"
    element={<ManagerStockMovements />}
  />
  <Route
    path="promotions"
    element={
      <ManagerPromotions />
    }
  />
  <Route
  path="discounts"
  element={<ManagerDiscounts />}
/>
<Route
  path="returns"
  element={<ManagerReturns />}
/>

<Route
  path="void-requests"
  element={<ManagerVoidRequests />}
/>
<Route
  path="shifts"
  element={<ManagerShifts />}
/>
  {/* other manager routes */}
  <Route
  path="cash-drawers"
  element={<ManagerCashDrawers />}
/>

<Route
  path="reports"
  element={<ManagerReports />}
/>
<Route
  path="audit-logs"
  element={<ManagerAuditLogs />}
/>
<Route
  path="notifications"
  element={<ManagerNotifications />}
/>
</Route>





        {/* =====================================
            CASHIER ROUTES
        ====================================== */}

        <Route
          path="/cashier"
          element={
            <ProtectedRoute
              allowedRoles={["CASHIER"]}
            >
              <CashierLayout />
            </ProtectedRoute>
          }
        >

          {/* NEW SALE */}

          <Route
            index
            element={
              <CashierDashboard />
            }
          />
          <Route
  path="new-sale"
  element={<CashierNewSale />}
/>

<Route path="payment" element={<Payment />} />
<Route
  path="/cashier/payment/:saleNumber"
  element={<Payment />}
/>

          {/* HOLD BILLING */}

          <Route
            path="hold"
            element={
              <CashierHoldBilling />
            }
          />

          {/* SALES HISTORY */}

          <Route
            path="history"
            element={
              <CashierSalesHistory />
            }
          />

          {/* RETURN */}

          <Route
            path="return"
            element={
              <CashierReturn />
            }
          />

          {/* VOID */}

          <Route
            path="void"
            element={
            <CashierVoidRequest />
            }
          />

          {/* CUSTOMERS */}

          <Route
            path="customers"
            element={
              <div>
                Customers
              </div>
            }
          />

          {/* SHIFT */}

          <Route
            path="shift"
            element={
              <CashierShiftManagement />
            }
          />

          {/* CASH DRAWER */}

          <Route
            path="drawer"
            element={
              <CashDrawer />
            }
          />

          {/* PRICE CHECK */}

          <Route
            path="price-check"
            element={
              <div>
                Price Check
              </div>
            }
          />

          {/* PRODUCTS */}

          <Route
            path="products"
            element={
              <CashierProducts />
            }
          />

        </Route>

        {/* =====================================
            UNAUTHORIZED
        ====================================== */}

        <Route
          path="/unauthorized"
          element={
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-red-500">
                  403
                </h1>

                <p className="mt-3 text-lg font-semibold text-slate-800">
                  Unauthorized Access
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  You do not have permission
                  to access this page.
                </p>
              </div>
            </div>
          }
        />

        {/* =====================================
            404
        ====================================== */}

        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-slate-800">
                  404
                </h1>

                <p className="mt-3 text-lg font-semibold text-slate-700">
                  Page Not Found
                </p>
              </div>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;