import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  TriangleAlert,
  X,
  Zap,
  CalendarDays,
  Tag,
  FileJson,
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
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-LK",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const prettyJSON = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  if (
    typeof value === "string"
  ) {
    try {
      return JSON.stringify(
        JSON.parse(value),
        null,
        2
      );
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
};

// ======================================================
// PRIORITY STYLE
// ======================================================

const getPriorityStyle = (
  priority
) => {
  switch (priority) {
    case "LOW":
      return {
        badge:
          "border-slate-200 bg-slate-100 text-slate-600",

        icon:
          "bg-slate-100 text-slate-500",
      };

    case "NORMAL":
      return {
        badge:
          "border-blue-200 bg-blue-50 text-blue-700",

        icon:
          "bg-blue-50 text-blue-600",
      };

    case "HIGH":
      return {
        badge:
          "border-amber-200 bg-amber-50 text-amber-700",

        icon:
          "bg-amber-50 text-amber-600",
      };

    case "CRITICAL":
      return {
        badge:
          "border-red-200 bg-red-50 text-red-700",

        icon:
          "bg-red-50 text-red-600",
      };

    default:
      return {
        badge:
          "border-slate-200 bg-slate-100 text-slate-600",

        icon:
          "bg-slate-100 text-slate-500",
      };
  }
};

// ======================================================
// PRIORITY ICON
// ======================================================

const getPriorityIcon = (
  priority
) => {
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

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState(null);

  const [
    markAllLoading,
    setMarkAllLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // ====================================================
  // UNREAD
  // ====================================================

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  // ====================================================
  // FILTERS
  // ====================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    unreadOnly,
    setUnreadOnly,
  ] = useState(false);

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("");

  // ====================================================
  // PAGINATION
  // ====================================================

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    limit,
    setLimit,
  ] = useState(20);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  // ====================================================
  // DETAILS
  // ====================================================

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  // ====================================================
  // NOTIFICATION HELPERS
  // ====================================================

  const getTitle = (
    notification
  ) => {
    return (
      notification?.title ??
      notification?.subject ??
      notification?.name ??
      displayText(
        notification?.type
      ) ??
      "Notification"
    );
  };

  const getMessage = (
    notification
  ) => {
    return (
      notification?.message ??
      notification?.body ??
      notification?.description ??
      notification?.content ??
      "No message provided."
    );
  };

  const getType = (
    notification
  ) => {
    return (
      notification?.type ??
      "GENERAL"
    );
  };

  const getPriority = (
    notification
  ) => {
    return (
      notification?.priority ??
      "NORMAL"
    );
  };

  const getCreatedAt = (
    notification
  ) => {
    return (
      notification?.createdAt ??
      notification?.sentAt ??
      notification?.timestamp ??
      notification?.date ??
      null
    );
  };

  // ====================================================
  // READ STATUS
  // ====================================================

  const isNotificationRead = (
    notification
  ) => {
    if (
      typeof notification?.isRead ===
      "boolean"
    ) {
      return notification.isRead;
    }

    if (
      typeof notification?.read ===
      "boolean"
    ) {
      return notification.read;
    }

    if (
      notification?.readAt
    ) {
      return true;
    }

    if (
      notification?.status ===
      "READ"
    ) {
      return true;
    }

    return false;
  };

  // ====================================================
  // READ DATE
  // ====================================================

  const getReadAt = (
    notification
  ) => {
    return (
      notification?.readAt ??
      notification?.seenAt ??
      null
    );
  };

  // ====================================================
  // METADATA
  // ====================================================

  const getMetadata = (
    notification
  ) => {
    return (
      notification?.metadata ??
      notification?.meta ??
      notification?.data ??
      null
    );
  };

  // ====================================================
  // FETCH UNREAD COUNT
  //
  // GET /notifications/unread-count
  // ====================================================

  const fetchUnreadCount =
    async () => {
      try {
        const response =
          await api.get(
            "/notifications/unread-count"
          );

        console.log(
          "Unread Notification Count:",
          response.data
        );

        const result =
          response.data?.data;

        let count = 0;

        if (
          typeof result ===
          "number"
        ) {
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
          Number.isFinite(count)
            ? count
            : 0
        );
      } catch (err) {
        console.error(
          "Unread count error:",
          err.response?.data ||
            err.message
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

  const fetchNotifications =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
          unreadOnly:
            String(
              unreadOnly
            ),
        };

        if (typeFilter) {
          params.type =
            typeFilter.trim();
        }

        if (priorityFilter) {
          params.priority =
            priorityFilter;
        }

        const response =
          await api.get(
            "/notifications",
            {
              params,
            }
          );

        console.log(
          "Notification Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const notificationData =
          result.notifications ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeNotifications =
          Array.isArray(
            notificationData
          )
            ? notificationData
            : [];

        setNotifications(
          safeNotifications
        );

        // ===============================================
        // PAGINATION
        // ===============================================

        const pagination =
          result.pagination ??
          {};

        const responseTotal =
          Number(
            pagination.total ??
              result.total ??
              result.count ??
              response.data?.count ??
              safeNotifications.length
          );

        const calculatedPages =
          Math.ceil(
            responseTotal /
              limit
          );

        const responsePages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        setTotal(
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeNotifications.length
        );

        setTotalPages(
          Math.max(
            1,
            Number(
              responsePages
            ) || 1
          )
        );
      } catch (err) {
        console.error(
          "Notification load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
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
  // LOAD
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
  //
  // Backend accepts any type string <= 100.
  // Build suggestions from loaded data.
  // ====================================================

  const typeOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          notifications
            .map(
              (notification) =>
                notification?.type
            )
            .filter(Boolean)
        )
      ).sort();
    }, [notifications]);

  // ====================================================
  // LOCAL SEARCH
  //
  // Backend controller doesn't have search param.
  // Search current loaded page only.
  // ====================================================

  const filteredNotifications =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return notifications;
      }

      return notifications.filter(
        (notification) => {
          const title =
            String(
              getTitle(
                notification
              )
            ).toLowerCase();

          const message =
            String(
              getMessage(
                notification
              )
            ).toLowerCase();

          const type =
            String(
              getType(
                notification
              )
            ).toLowerCase();

          const priority =
            String(
              getPriority(
                notification
              )
            ).toLowerCase();

          return (
            title.includes(
              keyword
            ) ||
            message.includes(
              keyword
            ) ||
            type.includes(
              keyword
            ) ||
            priority.includes(
              keyword
            )
          );
        }
      );
    }, [
      notifications,
      search,
    ]);

  // ====================================================
  // PAGE STATS
  // ====================================================

  const pageUnreadCount =
    notifications.filter(
      (notification) =>
        !isNotificationRead(
          notification
        )
    ).length;

  const pageHighCount =
    notifications.filter(
      (notification) =>
        getPriority(
          notification
        ) === "HIGH"
    ).length;

  const pageCriticalCount =
    notifications.filter(
      (notification) =>
        getPriority(
          notification
        ) === "CRITICAL"
    ).length;

  // ====================================================
  // OPEN DETAILS
  //
  // GET /notifications/:id
  // ====================================================

  const openDetails =
    async (notification) => {
      try {
        setSelectedNotification(
          notification
        );

        setDetailsOpen(true);

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/notifications/${notification.id}`
          );

        console.log(
          "Notification Detail:",
          response.data
        );

        const detailed =
          response.data?.data
            ?.notification ??
          response.data?.data ??
          notification;

        setSelectedNotification(
          detailed
        );
      } catch (err) {
        console.error(
          "Notification detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load notification details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // MARK ONE READ
  //
  // PATCH /notifications/:id/read
  // ====================================================

  const markAsRead =
    async (
      notification
    ) => {
      if (
        !notification?.id ||
        isNotificationRead(
          notification
        )
      ) {
        return;
      }

      try {
        setActionLoadingId(
          notification.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/notifications/${notification.id}/read`
          );

        const updated =
          response.data?.data
            ?.notification;

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notification.id
                  ? updated ?? {
                      ...item,
                      isRead:
                        true,

                      readAt:
                        new Date().toISOString(),
                    }
                  : item
            )
        );

        if (
          selectedNotification?.id ===
          notification.id
        ) {
          setSelectedNotification(
            updated ?? {
              ...selectedNotification,
              isRead: true,
              readAt:
                new Date().toISOString(),
            }
          );
        }

        setSuccess(
          response.data?.message ||
            "Notification marked as read."
        );

        await fetchUnreadCount();
      } catch (err) {
        console.error(
          "Mark read error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to mark notification as read."
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
    };

  // ====================================================
  // MARK ALL READ
  //
  // PATCH /notifications/read-all
  // ====================================================

  const markAllAsRead =
    async () => {
      if (
        unreadCount <= 0 &&
        pageUnreadCount <= 0
      ) {
        return;
      }

      try {
        setMarkAllLoading(
          true
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            "/notifications/read-all"
          );

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,

                isRead: true,

                readAt:
                  notification.readAt ??
                  new Date().toISOString(),
              })
            )
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
          "Mark all read error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to mark all notifications as read."
        );
      } finally {
        setMarkAllLoading(
          false
        );
      }
    };

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters = () => {
    setSearch("");
    setUnreadOnly(false);
    setTypeFilter("");
    setPriorityFilter("");
    setPage(1);
  };

  // ====================================================
  // REFRESH ALL
  // ====================================================

  const handleRefresh =
    async () => {
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

        {/* =================================================
            SUCCESS
        ================================================= */}

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
              onClick={() =>
                setSuccess("")
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

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
              onClick={() =>
                setError("")
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <BellRing
                  size={22}
                />
              </div>

              <div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View and manage your
                  system notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* REFRESH */}

            <button
              type="button"
              disabled={loading}
              onClick={
                handleRefresh
              }
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
              onClick={
                markAllAsRead
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >

              {markAllLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCheck
                  size={18}
                />
              )}

              Mark All Read
            </button>
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

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

                <Bell
                  size={23}
                />
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

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_auto_auto]">

              {/* LOCAL SEARCH */}

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search current notification page..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* TYPE */}

              <div>

                <input
                  list="notification-types"
                  type="text"
                  value={
                    typeFilter
                  }
                  onChange={(e) => {
                    setTypeFilter(
                      e.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="All Types"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <datalist id="notification-types">

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

              {/* PRIORITY */}

              <select
                value={
                  priorityFilter
                }
                onChange={(e) => {
                  setPriorityFilter(
                    e.target.value
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
                      key={
                        priority
                      }
                      value={
                        priority
                      }
                    >
                      {displayText(
                        priority
                      )}
                    </option>
                  )
                )}
              </select>

              {/* UNREAD ONLY */}

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600">

                <input
                  type="checkbox"
                  checked={
                    unreadOnly
                  }
                  onChange={(e) => {
                    setUnreadOnly(
                      e.target.checked
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
                onClick={
                  resetFilters
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >

                <RotateCcw
                  size={16}
                />

                Reset
              </button>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

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
          ) : filteredNotifications.length ===
            0 ? (

            /* =================================================
                EMPTY
            ================================================= */

            <div className="flex min-h-96 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <Bell
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No notifications found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Your system
                  notifications will
                  appear here.
                </p>
              </div>
            </div>
          ) : (

            /* =================================================
                NOTIFICATION LIST
            ================================================= */

            <div className="divide-y divide-slate-100">

              {filteredNotifications.map(
                (
                  notification
                ) => {
                  const priority =
                    getPriority(
                      notification
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
                      notification
                    );

                  return (
                    <div
                      key={
                        notification.id
                      }
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

                            <Tag
                              size={12}
                            />

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
                          <Eye
                            size={16}
                          />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            notifications.length >
              0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-sm text-slate-500">

                  Page{" "}

                  <span className="font-semibold text-slate-800">
                    {page}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {totalPages}
                  </span>

                  <span className="ml-2">
                    ({total} notifications)
                  </span>
                </div>

                <div className="flex items-center gap-3">

                  {/* LIMIT */}

                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(
                        Number(
                          e.target.value
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
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
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

                  {/* CURRENT */}

                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
                    {page}
                  </span>

                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
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
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* ===========================================
                  HEADER
              ============================================ */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Notification Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    View complete
                    notification
                    information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedNotification(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X
                    size={21}
                  />
                </button>
              </div>

              {/* ===========================================
                  CONTENT
              ============================================ */}

              {detailLoading ? (
                <div className="flex min-h-80 items-center justify-center">

                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* PRIORITY HEADER */}

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
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}
                          >
                            <PriorityIcon
                              size={26}
                            />
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="text-xl font-bold text-slate-900">

                                {getTitle(
                                  selectedNotification
                                )}

                              </h3>

                              {!read && (
                                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                                  New
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}
                              >
                                {displayText(
                                  priority
                                )}
                              </span>

                              <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">

                                {displayText(
                                  getType(
                                    selectedNotification
                                  )
                                )}

                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                        </div>
                      </div>
                    );
                  })()}

                  {/* MESSAGE */}

                  <div className="rounded-xl border border-slate-200 p-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Message
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">

                      {getMessage(
                        selectedNotification
                      )}

                    </p>
                  </div>

                  {/* INFORMATION */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Notification Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* TYPE */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Type
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Tag
                            size={16}
                            className="text-purple-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {displayText(
                              getType(
                                selectedNotification
                              )
                            )}

                          </p>
                        </div>
                      </div>

                      {/* PRIORITY */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Priority
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Zap
                            size={16}
                            className="text-amber-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {displayText(
                              getPriority(
                                selectedNotification
                              )
                            )}

                          </p>
                        </div>
                      </div>

                      {/* CREATED */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Created At
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CalendarDays
                            size={16}
                            className="text-blue-600"
                          />

                          <p className="text-sm font-semibold text-slate-800">

                            {formatDateTime(
                              getCreatedAt(
                                selectedNotification
                              )
                            )}

                          </p>
                        </div>
                      </div>

                      {/* READ DATE */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Read At
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CheckCheck
                            size={16}
                            className="text-emerald-600"
                          />

                          <p className="text-sm font-semibold text-slate-800">

                            {formatDateTime(
                              getReadAt(
                                selectedNotification
                              )
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ENTITY */}

                  {(selectedNotification.entityType ||
                    selectedNotification.entityId) && (
                    <div>

                      <h3 className="font-bold text-slate-900">
                        Related Entity
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <div className="rounded-xl border border-slate-200 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Entity Type
                          </p>

                          <p className="mt-2 font-semibold text-slate-800">

                            {displayText(
                              selectedNotification.entityType
                            )}

                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Entity ID
                          </p>

                          <p
                            title={
                              selectedNotification.entityId ||
                              ""
                            }
                            className="mt-2 truncate font-mono text-sm text-slate-700"
                          >

                            {selectedNotification.entityId ||
                              "—"}

                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* METADATA */}

                  {getMetadata(
                    selectedNotification
                  ) !== null && (
                    <div>

                      <div className="flex items-center gap-2">

                        <FileJson
                          size={18}
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

                  {/* ID */}

                  <div className="rounded-xl border border-slate-200 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Notification ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">

                      {selectedNotification.id ||
                        "—"}

                    </p>
                  </div>

                  {/* =======================================
                      MARK READ
                  ======================================== */}

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
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
                      >

                        {actionLoadingId ===
                        selectedNotification.id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCheck
                            size={17}
                          />
                        )}

                        Mark as Read
                      </button>
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