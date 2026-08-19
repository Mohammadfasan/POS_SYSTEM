import {
  ShoppingCart,
  PauseCircle,
  History,
  RotateCcw,
  Ban,
  Users,
  Clock3,
  Wallet,
  Search,
  Package,
  LogOut,
  LayoutDashboard,

} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  {
    name: "Dashboard",
    path: "/cashier",
    icon: LayoutDashboard,
  },
  {
    name: "New Sale",
    path: "/cashier/new-sale",
    icon: ShoppingCart,
  },
 
  {
    name: "Hold Billing",
    path: "/cashier/hold",
    icon: PauseCircle,
  },
  {
    name: "Sales History",
    path: "/cashier/history",
    icon: History,
  },
  {
    name: "Return",
    path: "/cashier/return",
    icon: RotateCcw,
  },
  {
    name: "Void Request",
    path: "/cashier/void",
    icon: Ban,
  },
 
  {
    name: "Shift Management",
    path: "/cashier/shift",
    icon: Clock3,
  },
  {
    name: "Cash Drawer",
    path: "/cashier/drawer",
    icon: Wallet,
  },
  {
    name: "Price Check",
    path: "/cashier/price-check",
    icon: Search,
  },
  {
    name: "Products",
    path: "/cashier/products",
    icon: Package,
  },
];

const CashierSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-950 text-white">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold">
            POS
          </div>

          <div>
            <h1 className="text-lg font-bold">
              Smart POS
            </h1>

            <p className="text-xs text-slate-400">
              Cashier Portal
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Cashier Menu
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/cashier"}
                className={({ isActive }) =>
                  `
                    flex items-center gap-3 rounded-xl px-3 py-3
                    text-sm font-medium transition

                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `
                }
              >
                <Icon size={19} />

                {item.name}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={19} />

          Logout
        </button>
      </div>
    </aside>
  );
};

export default CashierSidebar;