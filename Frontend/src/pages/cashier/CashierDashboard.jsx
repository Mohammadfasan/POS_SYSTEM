import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const ENDPOINTS = {
  dashboard: "/reports/dashboard",
  currentShift: "/shifts/current",
  currentDrawer: "/cash-drawers/current",
  unreadNotifications: "/notifications/unread-count",
};

/* =========================================================
   TOKEN
========================================================= */

const getToken = () => {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken")
  );
};

/* =========================================================
   API REQUEST
========================================================= */

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error?.message ||
        "Request failed"
    );

    error.status = response.status;

    throw error;
  }

  return data;
};

/* =========================================================
   MONEY FORMAT
========================================================= */

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(amount);
};

/* =========================================================
   DATE / TIME
========================================================= */

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/* =========================================================
   SIMPLE ICONS
========================================================= */

const Icon = ({ type }) => {
  const common =
    "h-5 w-5 stroke-current";

  if (type === "sales") {
    return (
      <svg
        className={common}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l2.4 11.2a2 2 0 002 1.6h7.8a2 2 0 002-1.6L21 7H6"
        />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    );
  }

  if (type === "money") {
    return (
      <svg
        className={common}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m3-9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2.2 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"
        />
      </svg>
    );
  }

  if (type === "pending") {
    return (
      <svg
        className={common}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />

        <path
          strokeLinecap="round"
          d="M12 7v5l3 2"
        />
      </svg>
    );
  }

  if (type === "average") {
    return (
      <svg
        className={common}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 18V9m5 9V5m6 13v-7m5 7V3"
        />
      </svg>
    );
  }

  return null;
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  title,
  value,
  description,
  icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon type={icon} />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SMALL VALUE CARD
========================================================= */

const MiniCard = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
};

/* =========================================================
   STATUS
========================================================= */

const StatusBadge = ({
  active,
  activeText = "Active",
  inactiveText = "Inactive",
}) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-amber-500"
        }`}
      />

      {active
        ? activeText
        : inactiveText}
    </span>
  );
};

/* =========================================================
   QUICK ACTION
========================================================= */

const QuickAction = ({
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div>
        <p className="font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700">
        →
      </span>
    </button>
  );
};

/* =========================================================
   DASHBOARD
========================================================= */

const CashierDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] =
    useState(null);

  const [shift, setShift] =
    useState(null);

  /*
    current drawer response:

    {
      drawer,
      shift,
      terminal,
      branch
    }
  */

  const [drawerInfo, setDrawerInfo] =
    useState(null);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
          Dashboard is the main request.

          Other requests are loaded independently because
          current cash drawer intentionally returns error
          when cashier has no active shift.
        */

        const dashboardResponse =
          await apiRequest(
            ENDPOINTS.dashboard
          );

        setDashboard(
          dashboardResponse?.data
            ?.dashboard || null
        );

        const [
          shiftResult,
          drawerResult,
          notificationResult,
        ] = await Promise.allSettled([
          apiRequest(
            ENDPOINTS.currentShift
          ),

          apiRequest(
            ENDPOINTS.currentDrawer
          ),

          apiRequest(
            ENDPOINTS
              .unreadNotifications
          ),
        ]);

        /* CURRENT SHIFT */

        if (
          shiftResult.status ===
          "fulfilled"
        ) {
          setShift(
            shiftResult.value?.data
              ?.shift || null
          );
        } else {
          setShift(null);
        }

        /* CURRENT DRAWER */

        if (
          drawerResult.status ===
          "fulfilled"
        ) {
          setDrawerInfo(
            drawerResult.value?.data ||
              null
          );
        } else {
          setDrawerInfo(null);
        }

        /* NOTIFICATION COUNT */

        if (
          notificationResult.status ===
          "fulfilled"
        ) {
          setUnreadCount(
            Number(
              notificationResult.value
                ?.data?.count || 0
            )
          );
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load cashier dashboard"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     EXACT REPORT DATA
  ======================================================= */

  const sales =
    dashboard?.sales || {};

  const returns =
    dashboard?.returns || {};

  const voids =
    dashboard?.voids || {};

  const payments =
    dashboard?.payments || [];

  const period =
    dashboard?.period || {};

  /* =======================================================
     PAYMENT TOTAL
  ======================================================= */

  const paymentTotal = useMemo(() => {
    return payments.reduce(
      (total, payment) =>
        total +
        Number(payment?.amount || 0),
      0
    );
  }, [payments]);

  /* =======================================================
     USER
  ======================================================= */

  const userName = useMemo(() => {
    try {
      const storedUser =
        JSON.parse(
          localStorage.getItem("user")
        );

      if (storedUser) {
        const fullName = [
          storedUser.firstName,
          storedUser.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        if (fullName) {
          return fullName;
        }

        return (
          storedUser.name ||
          storedUser.employeeId ||
          "Cashier"
        );
      }
    } catch {
      // ignore invalid localStorage
    }

    return (
      localStorage.getItem(
        "userName"
      ) || "Cashier"
    );
  }, []);

  /* =======================================================
     SHIFT / DRAWER
  ======================================================= */

  const shiftActive =
    shift?.status === "OPEN";

  const drawer =
    drawerInfo?.drawer || null;

  const drawerShift =
    drawerInfo?.shift || null;

  const terminal =
    drawerInfo?.terminal ||
    shift?.terminal ||
    null;

  const branch =
    drawerInfo?.branch ||
    shift?.branch ||
    null;

  const drawerActive =
    drawer?.status === "ACTIVE";

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading cashier dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              CASHIER WORKSPACE
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {userName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {branch?.name && (
                <span>
                  {branch.name}
                </span>
              )}

              {terminal?.name && (
                <span>
                  Terminal:{" "}
                  {terminal.name}
                </span>
              )}

              {shift?.shiftNumber && (
                <span>
                  Shift:{" "}
                  {shift.shiftNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cashier/notifications"
                )
              }
              className="relative flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Notifications

              {unreadCount > 0 && (
                <span className="ml-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </button>

            {/* REFRESH */}

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                loadDashboard(true)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            {/* NEW SALE */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cashier/new-sale"
                )
              }
              disabled={!shiftActive}
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              New Sale
            </button>
          </div>
        </div>

        {/* ================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex justify-between gap-5">
              <div>
                <p className="font-semibold text-red-700">
                  Unable to load dashboard
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadDashboard(true)
                }
                className="text-sm font-semibold text-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ================================================
            MAIN STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Net Sales"
            value={formatMoney(
              sales.netSales
            )}
            description="Sales after completed refunds"
            icon="money"
          />

          <StatCard
            title="Total Sales"
            value={
              sales.totalSales || 0
            }
            description="Completed sales for this period"
            icon="sales"
          />

          <StatCard
            title="Average Sale"
            value={formatMoney(
              sales.averageSale
            )}
            description="Average value per completed sale"
            icon="average"
          />

          <StatCard
            title="Pending Sales"
            value={
              sales.pendingSales || 0
            }
            description="Pending or partially paid sales"
            icon="pending"
          />
        </div>

        {/* ================================================
            SALES DETAILS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current reporting period
              </p>
            </div>

            {period?.start &&
              period?.end && (
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                  {formatDate(
                    period.start
                  )}{" "}
                  -{" "}
                  {formatDate(
                    period.end
                  )}
                </div>
              )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

            <MiniCard
              label="Gross Sales"
              value={formatMoney(
                sales.grossSales
              )}
            />

            <MiniCard
              label="Refunds"
              value={formatMoney(
                sales.refunds
              )}
            />

            <MiniCard
              label="Discounts"
              value={formatMoney(
                sales.discounts
              )}
            />

            <MiniCard
              label="Tax"
              value={formatMoney(
                sales.tax
              )}
            />

            <MiniCard
              label="Returns"
              value={
                returns.completed || 0
              }
            />

            <MiniCard
              label="Voids"
              value={
                voids.completed || 0
              }
            />

          </div>
        </div>

        {/* ================================================
            SHIFT + CASH DRAWER
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* SHIFT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current Shift
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Shift Status
                </h2>
              </div>

              <StatusBadge
                active={shiftActive}
                activeText="Open"
                inactiveText="No Active Shift"
              />
            </div>

            {shift ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">

                  <MiniCard
                    label="Shift Number"
                    value={
                      shift.shiftNumber ||
                      "-"
                    }
                  />

                  <MiniCard
                    label="Opening Cash"
                    value={formatMoney(
                      shift.openingCash
                    )}
                  />

                  <MiniCard
                    label="Opened At"
                    value={formatTime(
                      shift.openedAt
                    )}
                  />

                  <MiniCard
                    label="Terminal"
                    value={
                      shift.terminal
                        ?.name || "-"
                    }
                  />

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/cashier/shift"
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Manage Shift
                </button>
              </>
            ) : (
              <div className="mt-6">
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-800">
                    Shift not opened
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    You need an active
                    cashier shift before
                    processing sales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/cashier/shift"
                    )
                  }
                  className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Open Shift
                </button>
              </div>
            )}
          </div>

          {/* CASH DRAWER */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Cash Drawer
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Cash Position
                </h2>
              </div>

              <StatusBadge
                active={drawerActive}
                activeText="Active"
                inactiveText="Unavailable"
              />
            </div>

            {drawerInfo ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">

                  <MiniCard
                    label="Expected Cash"
                    value={formatMoney(
                      drawerShift
                        ?.expectedCash
                    )}
                  />

                  <MiniCard
                    label="Opening Cash"
                    value={formatMoney(
                      drawerShift
                        ?.openingCash
                    )}
                  />

                  <MiniCard
                    label="Cash Sales"
                    value={formatMoney(
                      drawerShift
                        ?.cashSales
                    )}
                  />

                  <MiniCard
                    label="Cash Refunds"
                    value={formatMoney(
                      drawerShift
                        ?.cashRefunds
                    )}
                  />

                  <MiniCard
                    label="Cash In"
                    value={formatMoney(
                      drawerShift
                        ?.cashIn
                    )}
                  />

                  <MiniCard
                    label="Cash Out"
                    value={formatMoney(
                      drawerShift
                        ?.cashOut
                    )}
                  />

                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      Drawer
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {drawer?.name ||
                        drawer?.code ||
                        "-"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/cashier/cash-drawer"
                    )
                  }
                  className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Manage Cash Drawer
                </button>
              </>
            ) : (
              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-700">
                  Cash drawer unavailable
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  An active shift and an
                  active cash drawer are
                  required.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================================================
            PAYMENT METHODS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Payment Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Completed payment methods
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Payment Total
              </p>

              <p className="mt-1 text-right text-xl font-bold text-slate-900">
                {formatMoney(
                  paymentTotal
                )}
              </p>
            </div>
          </div>

          {payments.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

              {payments.map(
                (payment) => (
                  <div
                    key={
                      payment.method
                    }
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {
                            payment.method
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            payment.count
                          }{" "}
                          transaction
                          {payment.count ===
                          1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(
                          payment.amount
                        )}
                      </p>

                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No completed payments
                for this period.
              </p>
            </div>
          )}
        </div>

        {/* ================================================
            QUICK ACTIONS
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common cashier operations
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            <QuickAction
              title="New Sale"
              description="Start customer billing"
              onClick={() =>
                navigate(
                  "/cashier/new-sale"
                )
              }
            />

            <QuickAction
              title="Held Bills"
              description="Resume held transactions"
              onClick={() =>
                navigate(
                  "/cashier/held-bills"
                )
              }
            />

            <QuickAction
              title="Sales History"
              description="View your previous sales"
              onClick={() =>
                navigate(
                  "/cashier/sales"
                )
              }
            />

            <QuickAction
              title="Returns"
              description="Create a return request"
              onClick={() =>
                navigate(
                  "/cashier/returns"
                )
              }
            />

            <QuickAction
              title="Void Request"
              description="Request sale cancellation"
              onClick={() =>
                navigate(
                  "/cashier/voids"
                )
              }
            />

            <QuickAction
              title="Discount Request"
              description="Request manual discount"
              onClick={() =>
                navigate(
                  "/cashier/discounts"
                )
              }
            />

            <QuickAction
              title="Receipts"
              description="View and print receipts"
              onClick={() =>
                navigate(
                  "/cashier/receipts"
                )
              }
            />

            <QuickAction
              title="Cash Drawer"
              description="Cash in and cash out"
              onClick={() =>
                navigate(
                  "/cashier/cash-drawer"
                )
              }
            />

          </div>
        </div>

      </div>
    </div>
  );
};

export default CashierDashboard;