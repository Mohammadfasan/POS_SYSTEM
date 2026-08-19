import { useEffect, useState } from "react";
import {
  Menu,
  Bell,
  Search,
  User,
  ChevronDown,
  LogOut,
  Settings,
  X,
} from "lucide-react";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import ManagerSidebar from "./ManagerSidebar";

// ======================================================
// PAGE TITLES
// ======================================================

const PAGE_TITLES = {
  "/manager": {
    title: "Dashboard",
    subtitle: "Overview of store performance",
  },

  "/manager/sales": {
    title: "Sales",
    subtitle: "View and manage sales transactions",
  },

  "/manager/products": {
    title: "Products",
    subtitle: "Manage products and pricing",
  },

  "/manager/inventory": {
    title: "Inventory",
    subtitle: "Monitor and manage stock levels",
  },

  "/manager/stock-movements": {
    title: "Stock Movements",
    subtitle: "Track inventory movements",
  },

  "/manager/promotions": {
    title: "Promotions",
    subtitle: "Manage promotional offers",
  },

  "/manager/discounts": {
    title: "Discount Requests",
    subtitle: "Review cashier discount requests",
  },

  "/manager/returns": {
    title: "Returns",
    subtitle: "Review customer return requests",
  },

  "/manager/void-requests": {
    title: "Void Requests",
    subtitle: "Review sale void requests",
  },

  "/manager/shifts": {
    title: "Shifts",
    subtitle: "Monitor cashier shifts",
  },

  "/manager/cash-drawers": {
    title: "Cash Drawers",
    subtitle: "Monitor POS cash drawers",
  },

  "/manager/reports": {
    title: "Reports & Analytics",
    subtitle: "Analyze business performance",
  },

  "/manager/audit-logs": {
    title: "Audit Logs",
    subtitle: "Monitor system activities",
  },

  "/manager/notifications": {
    title: "Notifications",
    subtitle: "View your system notifications",
  },
};

// ======================================================
// MANAGER LAYOUT
// ======================================================

const ManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ====================================================
  // SIDEBAR
  // ====================================================

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  // ====================================================
  // PROFILE DROPDOWN
  // ====================================================

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  // ====================================================
  // USER
  // ====================================================

  const [
    user,
    setUser,
  ] = useState(null);

  // ====================================================
  // LOAD USER FROM STORAGE
  // ====================================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (storedUser) {
        setUser(
          JSON.parse(
            storedUser
          )
        );
      }
    } catch (error) {
      console.error(
        "User parse error:",
        error
      );
    }
  }, []);

  // ====================================================
  // CLOSE MOBILE SIDEBAR WHEN ROUTE CHANGES
  // ====================================================

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // ====================================================
  // CURRENT PAGE
  // ====================================================

  const pageInfo =
    PAGE_TITLES[
      location.pathname
    ] ?? {
      title: "Manager",
      subtitle:
        "SmartPOS Manager Portal",
    };

  // ====================================================
  // USER NAME
  // ====================================================

  const getUserName = () => {
    if (!user) {
      return "Manager";
    }

    const fullName = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      user.name ||
      user.employeeId ||
      "Manager"
    );
  };

  // ====================================================
  // USER EMAIL
  // ====================================================

  const getUserEmail = () => {
    return (
      user?.email ||
      user?.employeeId ||
      "Manager Account"
    );
  };

  // ====================================================
  // INITIAL
  // ====================================================

  const getInitial = () => {
    const name =
      getUserName();

    return (
      name
        ?.charAt(0)
        ?.toUpperCase() ||
      "M"
    );
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    try {
      // -----------------------------------------------
      // Remove common authentication values.
      // -----------------------------------------------

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "refreshToken"
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      sessionStorage.removeItem(
        "accessToken"
      );

      sessionStorage.removeItem(
        "refreshToken"
      );

      sessionStorage.removeItem(
        "token"
      );

      sessionStorage.removeItem(
        "user"
      );

      setProfileOpen(false);

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <ManagerSidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div className="min-h-screen lg:pl-72">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">

          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

            {/* ===========================================
                LEFT
            ============================================ */}

            <div className="flex min-w-0 items-center gap-4">

              {/* MOBILE MENU */}

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                <Menu
                  size={21}
                />
              </button>

              {/* PAGE TITLE */}

              <div className="min-w-0">

                <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {pageInfo.title}
                </h1>

                <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block">
                  {
                    pageInfo.subtitle
                  }
                </p>
              </div>
            </div>

            {/* ===========================================
                RIGHT
            ============================================ */}

            <div className="flex items-center gap-2 sm:gap-3">

              {/* =========================================
                  SEARCH
              ========================================== */}

              <div className="relative hidden xl:block">

                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* =========================================
                  NOTIFICATION
              ========================================== */}

              <button
                type="button"
                title="Notifications"
                onClick={() =>
                  navigate(
                    "/manager/notifications"
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >

                <Bell
                  size={19}
                />

                {/* Notification dot */}

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              {/* =========================================
                  PROFILE
              ========================================== */}

              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen(
                      (current) =>
                        !current
                    )
                  }
                  className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 pr-2 transition hover:border-slate-200 hover:bg-slate-50"
                >

                  {/* AVATAR */}

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-sm">

                    {getInitial()}

                  </div>

                  {/* USER */}

                  <div className="hidden max-w-36 text-left md:block">

                    <p className="truncate text-sm font-semibold text-slate-800">

                      {getUserName()}

                    </p>

                    <p className="truncate text-[11px] font-medium uppercase tracking-wide text-blue-600">
                      Manager
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-400 transition-transform md:block ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {/* =======================================
                    PROFILE DROPDOWN
                ======================================== */}

                {profileOpen && (
                  <>
                    {/* MOBILE/DESKTOP CLICK BACKDROP */}

                    <button
                      type="button"
                      aria-label="Close profile menu"
                      onClick={() =>
                        setProfileOpen(
                          false
                        )
                      }
                      className="fixed inset-0 z-40 cursor-default"
                    />

                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                      {/* PROFILE INFO */}

                      <div className="border-b border-slate-100 p-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">

                            {getInitial()}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-slate-900">

                              {getUserName()}

                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-500">

                              {getUserEmail()}

                            </p>

                            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                              Manager
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* =================================
                          MENU
                      ================================== */}

                      <div className="p-2">

                        {/* PROFILE */}

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(
                              false
                            );

                            // Add manager profile page later if needed.
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <User
                            size={17}
                          />

                          My Profile
                        </button>

                        {/* NOTIFICATIONS */}

                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(
                              false
                            );

                            navigate(
                              "/manager/notifications"
                            );
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Bell
                            size={17}
                          />

                          Notifications
                        </button>
                      </div>

                      {/* =================================
                          LOGOUT
                      ================================== */}

                      <div className="border-t border-slate-100 p-2">

                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut
                            size={17}
                          />

                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            MOBILE SEARCH
        ================================================= */}

        <div className="border-b border-slate-200 bg-white px-4 pb-4 xl:hidden">

          <div className="relative">

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="min-h-[calc(100vh-80px)]">

          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">

            <Outlet />

          </div>
        </main>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-slate-200 bg-white px-6 py-4">

          <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">

            <p>
              SmartPOS Manager Portal
            </p>

            <p>
              Management System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ManagerLayout;