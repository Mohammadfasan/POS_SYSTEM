import {
  LayoutDashboard,
  Package,
  Tags,
  Scale,
  Warehouse,
  ArrowLeftRight,
  Building2,
  Users,
  ShoppingCart,
  BadgePercent,
  Percent,
  RotateCcw,
  Ban,
  Clock3,
  Wallet,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  Bell,
  Monitor
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const menuGroups = [
  {
    title: "MAIN",
    items: [
      {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "MANAGEMENT",
    items: [
      {
        name: "Products",
        path: "/admin/products",
        icon: Package,
      },
      {
        name: "Categories",
        path: "/admin/categories",
        icon: Tags,
      },
      {
        name: "Units",
        path: "/admin/units",
        icon: Scale,
      },

      {
        name: "Inventory",
        path: "/admin/inventory",
        icon: Warehouse,
      },
      {
        name: "Stock Movements",
        path: "/admin/stock-movements",
        icon: ArrowLeftRight,
      },
      {
        name: "Branches",
        path: "/admin/branches",
        icon: Building2,
      },
      {
  name: "Terminals",
  path: "/admin/terminals",
  icon: Monitor,
},
      {
        name: "Users",
        path: "/admin/users",
        icon: Users,
      },
    ],
  },

  {
    title: "SALES",
    items: [
      {
        name: "Sales",
        path: "/admin/sales",
        icon: ShoppingCart,
      },
      {
        name: "Promotions",
        path: "/admin/promotions",
        icon: BadgePercent,
      },
      {
        name: "Discount Requests",
        path: "/admin/discounts",
        icon: Percent,
      },
      {
        name: "Returns",
        path: "/admin/returns",
        icon: RotateCcw,
      },
      {
        name: "Void Requests",
        path: "/admin/void-requests",
        icon: Ban,
      },
    ],
  },

  {
    title: "OPERATIONS",
    items: [
      {
        name: "Shifts",
        path: "/admin/shifts",
        icon: Clock3,
      },
      {
        name: "Cash Drawers",
        path: "/admin/cash-drawers",
        icon: Wallet,
      },
    ],
  },

  {
    title: "ANALYTICS",
    items: [
      {
        name: "Reports",
        path: "/admin/reports",
        icon: BarChart3,
      },
      {
        name: "Audit Logs",
        path: "/admin/audit-logs",
        icon: ClipboardList,
      },
    ],
  },

  {
    title: "SYSTEM",
    items: [
      {
        name: "Notifications",
        path: "/admin/notifications",
        icon: Bell,
      },
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

const AdminSidebar = () => {
  const { logout } = useAuth();

  const navigate =
    useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-40
        flex
        h-screen
        w-72
        flex-col
        border-r
        border-slate-800
        bg-slate-950
        text-white
      "
    >
      {/* LOGO */}

      <div
        className="
          flex
          h-20
          items-center
          border-b
          border-slate-800
          px-6
        "
      >
        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-blue-600
              text-sm
              font-bold
              shadow-lg
            "
          >
            POS
          </div>

          <div>
            <h1 className="text-lg font-bold">
              Smart POS
            </h1>

            <p className="text-xs text-slate-400">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-3
          py-5
        "
      >
        <div className="space-y-6">

          {menuGroups.map(
            (group) => (
              <div key={group.title}>

                <p
                  className="
                    mb-2
                    px-3
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-slate-500
                  "
                >
                  {group.title}
                </p>

                <div className="space-y-1">

                  {group.items.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <NavLink
                          key={
                            item.path
                          }
                          to={
                            item.path
                          }
                          end={
                            item.path ===
                            "/admin"
                          }
                          className={({
                            isActive,
                          }) =>
                            `
                              flex
                              items-center
                              gap-3
                              rounded-xl
                              px-3
                              py-2.5
                              text-sm
                              font-medium
                              transition

                              ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              }
                            `
                          }
                        >
                          <Icon
                            size={18}
                          />

                          <span>
                            {
                              item.name
                            }
                          </span>
                        </NavLink>
                      );
                    }
                  )}

                </div>
              </div>
            )
          )}

        </div>
      </nav>

      {/* LOGOUT */}

      <div
        className="
          border-t
          border-slate-800
          p-4
        "
      >
        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-3
            text-sm
            font-medium
            text-slate-300
            transition
            hover:bg-red-500/10
            hover:text-red-400
          "
        >
          <LogOut size={18} />

          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;