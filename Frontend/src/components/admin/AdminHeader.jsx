import {
  Bell,
  CalendarDays,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

import {
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const pageTitles = {
  "/admin": "Dashboard",

  "/admin/products":
    "Product Management",

  "/admin/categories":
    "Category Management",

  "/admin/units":
    "Unit Management",

  "/admin/inventory":
    "Inventory Management",

  "/admin/stock-movements":
    "Stock Movements",

  "/admin/branches":
    "Branch Management",

  "/admin/users":
    "User Management",

    "/admin/terminals":
  "Terminal Management",

  "/admin/sales":
    "Sales Management",

  "/admin/promotions":
    "Promotions",

  "/admin/discounts":
    "Discount Requests",

  "/admin/returns":
    "Returns",

  "/admin/void-requests":
    "Void Requests",

  "/admin/shifts":
    "Shift Management",

  "/admin/cash-drawers":
    "Cash Drawers",

  "/admin/reports":
    "Reports & Analytics",

  "/admin/audit-logs":
    "Audit Logs",

  "/admin/notifications":
    "Notifications",

  "/admin/settings":
    "Settings",
};

const AdminHeader = () => {
  const { user } =
    useAuth();

  const location =
    useLocation();

  const pageTitle =
    pageTitles[
      location.pathname
    ] || "Admin Portal";

  const currentDate =
    new Date().toLocaleDateString(
      "en-LK",
      {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-20
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white
        px-7
      "
    >
      {/* LEFT */}

      <div>
        <h2
          className="
            text-xl
            font-bold
            text-slate-900
          "
        >
          {pageTitle}
        </h2>

        <div
          className="
            mt-1
            flex
            items-center
            gap-2
            text-sm
            text-slate-500
          "
        >
          <CalendarDays
            size={15}
          />

          {currentDate}
        </div>
      </div>

      {/* RIGHT */}

      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        {/* NOTIFICATION */}

        <button
          type="button"
          className="
            relative
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            text-slate-600
            transition
            hover:bg-slate-100
          "
        >
          <Bell size={19} />

          <span
            className="
              absolute
              right-2
              top-2
              h-2
              w-2
              rounded-full
              bg-red-500
            "
          />
        </button>

        {/* PROFILE */}

        <div
          className="
            flex
            items-center
            gap-3
            border-l
            border-slate-200
            pl-4
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              text-blue-600
            "
          >
            <ShieldCheck
              size={20}
            />
          </div>

          <div className="hidden sm:block">

            <p
              className="
                text-sm
                font-semibold
                text-slate-800
              "
            >
              {user?.firstName ||
                "Admin"}{" "}
              {user?.lastName ||
                ""}
            </p>

            <p
              className="
                text-xs
                text-slate-500
              "
            >
              {user?.employeeId ||
                "ADMIN"}
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-slate-400"
          />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;