import { NavLink } from "react-router-dom";

const menuSections = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/manager",
        end: true,
      },
      {
        name: "Sales",
        path: "/manager/sales",
      },
    ],
  },
  {
    title: "Products & Stock",
    items: [
      {
        name: "Products",
        path: "/manager/products",
      },
      {
        name: "Inventory",
        path: "/manager/inventory",
      },
      {
        name: "Stock Movements",
        path: "/manager/stock-movements",
      },
    ],
  },
  {
    title: "Sales Management",
    items: [
      {
        name: "Promotions",
        path: "/manager/promotions",
      },
      {
        name: "Discount Requests",
        path: "/manager/discounts",
      },
      {
        name: "Returns",
        path: "/manager/returns",
      },
      {
        name: "Void Requests",
        path: "/manager/void-requests",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Shifts",
        path: "/manager/shifts",
      },
      {
        name: "Cash Drawers",
        path: "/manager/cash-drawers",
      },
    ],
  },
  {
    title: "Reports & Monitoring",
    items: [
      {
        name: "Reports & Analytics",
        path: "/manager/reports",
      },
      {
        name: "Audit Logs",
        path: "/manager/audit-logs",
      },
      {
        name: "Notifications",
        path: "/manager/notifications",
      },
      ,
    ],
  },
];

const ManagerSidebar = ({
  isOpen = false,
  onClose = () => {},
  unreadCount = 0,
  user = null,
}) => {
  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const managerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.employeeId ||
    "Manager";

  const managerDetails =
    user?.branch?.name ||
    user?.branchName ||
    user?.email ||
    "SmartPOS Management";

  const managerInitial = managerName.charAt(0).toUpperCase();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-72 flex-col
          border-r border-slate-800
          bg-slate-950 text-white
          shadow-2xl shadow-slate-950/30
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              SmartPOS
            </h1>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

              <p className="text-xs font-medium tracking-wide text-slate-400">
                Manager Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-lg border border-slate-700
              text-xl font-light text-slate-400
              transition
              hover:border-slate-600
              hover:bg-slate-800
              hover:text-white
              lg:hidden
            "
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav className="space-y-6">
            {menuSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {section.title}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={handleNavigation}
                      className={({ isActive }) =>
                        `
                          group relative flex min-h-11
                          items-center justify-between
                          rounded-xl px-3.5 py-2.5
                          text-sm font-medium
                          transition-all duration-200
                          ${
                            isActive
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-400 hover:bg-slate-900 hover:text-white"
                          }
                        `
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`
                                h-1.5 w-1.5 shrink-0 rounded-full
                                transition-colors duration-200
                                ${
                                  isActive
                                    ? "bg-blue-600"
                                    : "bg-slate-700 group-hover:bg-blue-500"
                                }
                              `}
                            />

                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.name === "Notifications" &&
                            unreadCount > 0 && (
                              <span
                                className="
                                  ml-3 flex min-h-5 min-w-5
                                  shrink-0 items-center justify-center
                                  rounded-full bg-red-500 px-1.5
                                  text-[10px] font-bold text-white
                                "
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="shrink-0 border-t border-slate-800 p-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-full bg-blue-600
                  text-sm font-bold text-white
                "
              >
                {managerInitial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {managerName}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {managerDetails}
                </p>
              </div>

              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] tracking-wide text-slate-700">
            SmartPOS Management System
          </p>
        </div>
      </aside>
    </>
  );
};

export default ManagerSidebar;