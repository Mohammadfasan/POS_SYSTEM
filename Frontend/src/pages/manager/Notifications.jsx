import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Eye,
  FileJson,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Tag,
  TriangleAlert,
  X,
  CalendarDays,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL",
];

// ======================================================
// HELPERS
// ======================================================

const displayText = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const prettyJSON = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// ======================================================
// PRIORITY STYLE
// ======================================================

const getPriorityStyle = (priority) => {
  switch (priority) {
    case "LOW":
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-600",
        icon: "bg-slate-100 text-slate-500",
      };

    case "NORMAL":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        icon: "bg-blue-50 text-blue-600",
      };

    case "HIGH":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        icon: "bg-amber-50 text-amber-600",
      };

    case "CRITICAL":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        icon: "bg-red-50 text-red-600",
      };

    default:
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-600",
        icon: "bg-slate-100 text-slate-500",
      };
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "CRITICAL":
      return ShieldAlert;

    case "HIGH":
      return TriangleAlert;

    case "NORMAL":
      return Info;

    default:
      return Bell;
  }
};

// ======================================================
// PAGE
// ======================================================

const Notifications = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  // ====================================================
  // MESSAGES
  // ====================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ====================================================
  // FILTERS
  // ====================================================

  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // ====================================================
  // PAGINATION
  // ====================================================

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ====================================================
  // DETAIL
  // ====================================================

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  // ====================================================
  // NOTIFICATION HELPERS
  // ====================================================

  const getTitle = (notification) => {
    return (
      notification?.title ??
      notification?.subject ??
      notification?.name ??
      displayText(notification?.type) ??
      "Notification"
    );
  };

  const getMessage = (notification) => {
    return (
      notification?.message ??
      notification?.body ??
      notification?.description ??
      notification?.content ??
      "No message provided."
    );
  };

  const getType = (notification) => {
    return notification?.type ?? "GENERAL";
  };

  const getPriority = (notification) => {
    return notification?.priority ?? "NORMAL";
  };

  const getCreatedAt = (notification) => {
    return (
      notification?.createdAt ??
      notification?.sentAt ??
      notification?.timestamp ??
      notification?.date ??
      null
    );
  };

  const getReadAt = (notification) => {
    return (
      notification?.readAt ??
      notification?.seenAt ??
      null
    );
  };

  const getMetadata = (notification) => {
    return (
      notification?.metadata ??
      notification?.meta ??
      notification?.data ??
      null
    );
  };

  const isNotificationRead = (notification) => {
    if (typeof notification?.isRead === "boolean") {
      return notification.isRead;
    }

    if (typeof notification?.read === "boolean") {
      return notification.read;
    }

    if (notification?.readAt) {
      return true;
    }

    if (notification?.status === "READ") {
      return true;
    }

    return false;
  };

  // ====================================================
  // FETCH UNREAD COUNT
  //
  // GET /notifications/unread-count
  // ====================================================

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(
        "/notifications/unread-count"
      );

      const result = response.data?.data;

      let count = 0;

      if (typeof result === "number") {
        count = result;
      } else {
        count = Number(
          result?.unreadCount ??
            result?.count ??
            result?.total ??
            0
        );
      }

      setUnreadCount(
        Number.isFinite(count) ? count : 0
      );
    } catch (err) {
      console.error(
        "Unread notification count error:",
        err.response?.data || err.message
      );

      setUnreadCount(0);
    }
  };

  // ====================================================
  // FETCH NOTIFICATIONS
  //
  // GET /notifications
  //
  // QUERY:
  // unreadOnly
  // type
  // priority
  // page
  // limit
  // ====================================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
        unreadOnly: String(unreadOnly),
      };

      if (typeFilter) {
        params.type = typeFilter;
      }

      if (priorityFilter) {
        params.priority = priorityFilter;
      }

      const response = await api.get(
        "/notifications",
        {
          params,
        }
      );

      console.log(
        "Manager Notifications:",
        response.data
      );

      const result = response.data?.data ?? {};

      const rows =
        result.notifications ??
        result.items ??
        result.rows ??
        (Array.isArray(result) ? result : []);

      const safeRows = Array.isArray(rows)
        ? rows
        : [];

      setNotifications(safeRows);

      // ===============================================
      // PAGINATION
      // ===============================================

      const pagination = result.pagination ?? {};

      const rawTotal = Number(
        pagination.total ??
          result.total ??
          result.count ??
          response.data?.count ??
          safeRows.length
      );

      const safeTotal = Number.isFinite(rawTotal)
        ? rawTotal
        : safeRows.length;

      const calculatedPages = Math.ceil(
        safeTotal / limit
      );

      const rawTotalPages =
        pagination.totalPages ??
        result.totalPages ??
        calculatedPages;

      setTotal(safeTotal);

      setTotalPages(
        Math.max(
          1,
          Number(rawTotalPages) || 1
        )
      );
    } catch (err) {
      console.error(
        "Notification load error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load notifications."
      );

      setNotifications([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [
    page,
    limit,
    unreadOnly,
    typeFilter,
    priorityFilter,
  ]);

  // ====================================================
  // TYPE OPTIONS
  // ====================================================

  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(
        notifications
          .map((notification) => notification?.type)
          .filter(Boolean)
      )
    ).sort();
  }, [notifications]);

  // ====================================================
  // LOCAL SEARCH
  //
  // Backend notification controller has no search param.
  // Search current API page only.
  // ====================================================

  const filteredNotifications = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return notifications;
    }

    return notifications.filter((notification) => {
      const values = [
        getTitle(notification),
        getMessage(notification),
        getType(notification),
        getPriority(notification),
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [notifications, search]);

  // ====================================================
  // CURRENT PAGE STATS
  // ====================================================

  const pageUnreadCount = notifications.filter(
    (notification) =>
      !isNotificationRead(notification)
  ).length;

  const pageHighCount = notifications.filter(
    (notification) =>
      getPriority(notification) === "HIGH"
  ).length;

  const pageCriticalCount = notifications.filter(
    (notification) =>
      getPriority(notification) === "CRITICAL"
  ).length;

  // ====================================================
  // OPEN DETAIL
  //
  // GET /notifications/:id
  // ====================================================

  const openDetails = async (notification) => {
    try {
      setSelectedNotification(notification);
      setDetailsOpen(true);
      setDetailLoading(true);
      setError("");

      const response = await api.get(
        `/notifications/${notification.id}`
      );

      const detailed =
        response.data?.data?.notification ??
        response.data?.data ??
        notification;

      setSelectedNotification(detailed);
    } catch (err) {
      console.error(
        "Notification detail error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load notification details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ====================================================
  // CLOSE DETAIL
  // ====================================================

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedNotification(null);
  };

  // ====================================================
  // MARK ONE READ
  //
  // PATCH /notifications/:id/read
  // ====================================================

  const markAsRead = async (notification) => {
    if (
      !notification?.id ||
      isNotificationRead(notification)
    ) {
      return;
    }

    try {
      setActionLoadingId(notification.id);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/notifications/${notification.id}/read`
      );

      const updated =
        response.data?.data?.notification;

      const fallbackUpdated = {
        ...notification,
        isRead: true,
        readAt: new Date().toISOString(),
      };

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? updated ?? fallbackUpdated
            : item
        )
      );

      if (
        selectedNotification?.id ===
        notification.id
      ) {
        setSelectedNotification(
          updated ?? fallbackUpdated
        );
      }

      setSuccess(
        response.data?.message ||
          "Notification marked as read."
      );

      await fetchUnreadCount();

      if (unreadOnly) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ====================================================
  // MARK ALL READ
  //
  // PATCH /notifications/read-all
  // ====================================================

  const markAllAsRead = async () => {
    if (
      unreadCount <= 0 &&
      pageUnreadCount <= 0
    ) {
      return;
    }

    try {
      setMarkAllLoading(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        "/notifications/read-all"
      );

      const now = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt:
            notification.readAt ??
            now,
        }))
      );

      setUnreadCount(0);

      setSuccess(
        response.data?.message ||
          "All notifications marked as read."
      );

      if (unreadOnly) {
        setPage(1);
        await fetchNotifications();
      }
    } catch (err) {
      console.error(
        "Mark all notifications read error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkAllLoading(false);
    }
  };

  // ====================================================
  // TYPE FILTER
  // ====================================================

  const applyTypeFilter = (event) => {
    event.preventDefault();

    setTypeFilter(
      typeInput.trim()
    );

    setPage(1);
  };

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters = () => {
    setSearch("");
    setUnreadOnly(false);
    setTypeInput("");
    setTypeFilter("");
    setPriorityFilter("");
    setPage(1);
  };

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
    ]);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">
        {/* =============================================
            SUCCESS
        ============================================== */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CircleCheck
              size={19}
              className="shrink-0"
            />

            <span className="flex-1">
              {success}
            </span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* =============================================
            ERROR
        ============================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <CircleAlert
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* =============================================
            HEADER
        ============================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BellRing size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View system alerts and manage your
                notification read status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* REFRESH */}

            <button
              type="button"
              disabled={loading}
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* MARK ALL */}

            <button
              type="button"
              disabled={
                markAllLoading ||
                unreadCount === 0
              }
              onClick={markAllAsRead}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {markAllLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCheck size={18} />
              )}

              Mark All Read
            </button>
          </div>
        </div>

        {/* =============================================
            KPI
        ============================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Bell size={23} />
              </div>
            </div>
          </div>

          {/* UNREAD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Unread
                </p>

                <p className="mt-2 text-2xl font-bold text-purple-600">
                  {unreadCount}
                </p>
              </div>

              <BellRing
                size={23}
                className="text-purple-500"
              />
            </div>
          </div>

          {/* HIGH */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  High Priority
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {pageHighCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <TriangleAlert
                size={23}
                className="text-amber-500"
              />
            </div>
          </div>

          {/* CRITICAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Critical
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {pageCriticalCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <ShieldAlert
                size={23}
                className="text-red-500"
              />
            </div>
          </div>
        </div>

        {/* =============================================
            MAIN CARD
        ============================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* =============================================
              FILTERS
          ============================================== */}

          <div className="space-y-3 border-b border-slate-200 p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_auto]">
              {/* LOCAL SEARCH */}

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search current notification page..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* PRIORITY */}

              <select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Priorities
                </option>

                {PRIORITIES.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {displayText(priority)}
                    </option>
                  )
                )}
              </select>

              {/* UNREAD */}

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(event) => {
                    setUnreadOnly(
                      event.target.checked
                    );

                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />

                Unread Only
              </label>

              {/* RESET */}

              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <RotateCcw size={16} />

                Reset
              </button>
            </div>

            {/* TYPE */}

            <form
              onSubmit={applyTypeFilter}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="flex-1">
                <input
                  type="text"
                  list="manager-notification-types"
                  maxLength={100}
                  value={typeInput}
                  onChange={(event) =>
                    setTypeInput(
                      event.target.value
                    )
                  }
                  placeholder="Filter by notification type, e.g. LOW_STOCK..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />

                <datalist id="manager-notification-types">
                  {typeOptions.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      />
                    )
                  )}
                </datalist>
              </div>

              <button
                type="submit"
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Apply Type
              </button>
            </form>

            {typeFilter && (
              <p className="text-xs text-slate-400">
                Type filter:{" "}
                <span className="font-semibold text-blue-600">
                  {typeFilter}
                </span>
              </p>
            )}
          </div>

          {/* =============================================
              LOADING
          ============================================== */}

          {loading ? (
            <div className="flex min-h-96 items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={34}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading notifications...
                </p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* =============================================
                EMPTY
            ============================================== */

            <div className="flex min-h-96 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Bell size={30} />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No notifications found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Your system notifications
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            /* =============================================
                NOTIFICATION LIST
            ============================================== */

            <div className="divide-y divide-slate-100">
              {filteredNotifications.map(
                (notification) => {
                  const priority =
                    getPriority(notification);

                  const style =
                    getPriorityStyle(priority);

                  const PriorityIcon =
                    getPriorityIcon(priority);

                  const read =
                    isNotificationRead(
                      notification
                    );

                  return (
                    <div
                      key={notification.id}
                      className={`relative flex flex-col gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-start ${
                        !read
                          ? "bg-blue-50/30"
                          : "bg-white"
                      }`}
                    >
                      {/* UNREAD BAR */}

                      {!read && (
                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600" />
                      )}

                      {/* ICON */}

                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                      >
                        <PriorityIcon
                          size={22}
                        />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-base ${
                              read
                                ? "font-semibold text-slate-700"
                                : "font-bold text-slate-900"
                            }`}
                          >
                            {getTitle(
                              notification
                            )}
                          </h3>

                          {!read && (
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <p
                          className={`mt-2 max-w-4xl text-sm leading-6 ${
                            read
                              ? "text-slate-500"
                              : "font-medium text-slate-600"
                          }`}
                        >
                          {getMessage(
                            notification
                          )}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {/* TYPE */}

                          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                            <Tag size={12} />

                            {displayText(
                              getType(
                                notification
                              )
                            )}
                          </span>

                          {/* PRIORITY */}

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                          >
                            {displayText(
                              priority
                            )}
                          </span>

                          {/* READ STATUS */}

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              read
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {read
                              ? "Read"
                              : "Unread"}
                          </span>

                          {/* DATE */}

                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <CalendarDays
                              size={13}
                            />

                            {formatDateTime(
                              getCreatedAt(
                                notification
                              )
                            )}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 items-center gap-2">
                        {/* MARK READ */}

                        {!read && (
                          <button
                            type="button"
                            title="Mark as read"
                            disabled={
                              actionLoadingId ===
                              notification.id
                            }
                            onClick={() =>
                              markAsRead(
                                notification
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                          >
                            {actionLoadingId ===
                            notification.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Check
                                size={17}
                              />
                            )}
                          </button>
                        )}

                        {/* VIEW */}

                        <button
                          type="button"
                          title="View notification"
                          onClick={() =>
                            openDetails(
                              notification
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* =============================================
              PAGINATION
          ============================================== */}

          {!loading &&
            notifications.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-800">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {totalPages}
                  </span>

                  <span className="ml-2">
                    ({total} notifications)
                  </span>
                </p>

                <div className="flex items-center gap-3">
                  {/* LIMIT */}

                  <select
                    value={limit}
                    onChange={(event) => {
                      setLimit(
                        Number(
                          event.target.value
                        )
                      );

                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value={10}>
                      10 / page
                    </option>

                    <option value={20}>
                      20 / page
                    </option>

                    <option value={50}>
                      50 / page
                    </option>

                    <option value={100}>
                      100 / page
                    </option>
                  </select>

                  {/* PREVIOUS */}

                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
                    {page}
                  </span>

                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={
                      page >= totalPages
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* =================================================
          DETAIL MODAL
      ================================================= */}

      {detailsOpen &&
        selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              {/* =========================================
                  HEADER
              ========================================== */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Notification Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete notification
                    information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              {/* =========================================
                  LOADING
              ========================================== */}

              {detailLoading ? (
                <div className="flex min-h-80 items-center justify-center">
                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  {/* =====================================
                      TOP
                  ====================================== */}

                  {(() => {
                    const priority =
                      getPriority(
                        selectedNotification
                      );

                    const style =
                      getPriorityStyle(
                        priority
                      );

                    const PriorityIcon =
                      getPriorityIcon(
                        priority
                      );

                    const read =
                      isNotificationRead(
                        selectedNotification
                      );

                    return (
                      <div className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                          >
                            <PriorityIcon
                              size={22}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-900">
                                {getTitle(
                                  selectedNotification
                                )}
                              </h3>

                              {!read && (
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                              )}
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                              {getMessage(
                                selectedNotification
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                            <Tag size={12} />

                            {displayText(
                              getType(
                                selectedNotification
                              )
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${style.badge}`}
                          >
                            {displayText(
                              priority
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              read
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {read
                              ? "Read"
                              : "Unread"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* =====================================
                      DATES
                  ====================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Created At
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <CalendarDays
                          size={16}
                          className="text-blue-600"
                        />

                        <p className="text-sm font-semibold text-slate-700">
                          {formatDateTime(
                            getCreatedAt(
                              selectedNotification
                            )
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Read At
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <CheckCheck
                          size={16}
                          className="text-emerald-600"
                        />

                        <p className="text-sm font-semibold text-slate-700">
                          {formatDateTime(
                            getReadAt(
                              selectedNotification
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =====================================
                      TYPE / PRIORITY
                  ====================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Notification Type
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {displayText(
                          getType(
                            selectedNotification
                          )
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Priority
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {displayText(
                          getPriority(
                            selectedNotification
                          )
                        )}
                      </p>
                    </div>
                  </div>

                  {/* =====================================
                      ENTITY / REFERENCE
                  ====================================== */}

                  {(selectedNotification?.entityType ||
                    selectedNotification?.entityId ||
                    selectedNotification?.referenceType ||
                    selectedNotification?.referenceId) && (
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Related Information
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Entity / Reference Type
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            {displayText(
                              selectedNotification?.entityType ??
                                selectedNotification?.referenceType
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Entity / Reference ID
                          </p>

                          <p className="mt-2 break-all font-mono text-xs text-slate-600">
                            {selectedNotification?.entityId ??
                              selectedNotification?.referenceId ??
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =====================================
                      METADATA
                  ====================================== */}

                  {getMetadata(
                    selectedNotification
                  ) !== null && (
                    <div>
                      <div className="flex items-center gap-2">
                        <FileJson
                          size={19}
                          className="text-purple-600"
                        />

                        <h3 className="font-bold text-slate-900">
                          Metadata
                        </h3>
                      </div>

                      <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200">
                        {prettyJSON(
                          getMetadata(
                            selectedNotification
                          )
                        )}
                      </pre>
                    </div>
                  )}

                  {/* =====================================
                      ID
                  ====================================== */}

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Notification ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">
                      {selectedNotification.id ??
                        "—"}
                    </p>
                  </div>

                  {/* =====================================
                      MARK READ
                  ====================================== */}

                  {!isNotificationRead(
                    selectedNotification
                  ) && (
                    <div className="flex justify-end border-t border-slate-200 pt-5">
                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedNotification.id
                        }
                        onClick={() =>
                          markAsRead(
                            selectedNotification
                          )
                        }
                        className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {actionLoadingId ===
                        selectedNotification.id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Check
                            size={17}
                          />
                        )}

                        Mark as Read
                      </button>
                    </div>
                  )}

                  {/* =====================================
                      READ STATE
                  ====================================== */}

                  {isNotificationRead(
                    selectedNotification
                  ) && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-3">
                        <CircleCheck
                          size={19}
                          className="text-emerald-600"
                        />

                        <div>
                          <p className="font-semibold text-emerald-700">
                            Notification Read
                          </p>

                          <p className="mt-1 text-sm text-emerald-600">
                            This notification has already
                            been marked as read.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default Notifications;