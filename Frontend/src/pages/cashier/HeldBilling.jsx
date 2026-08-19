import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  PauseCircle,
  Play,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const STATUS_OPTIONS = [
  "",
  "HELD",
  "RESUMING",
  "RESUMED",
  "CANCELLED",
  "EXPIRED",
];

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusStyle = (status) => {
  switch (status) {
    case "HELD":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "RESUMING":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "RESUMED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "CANCELLED":
      return "bg-red-50 text-red-600 border-red-200";

    case "EXPIRED":
      return "bg-slate-100 text-slate-500 border-slate-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const getCashierName = (bill) => {
  const firstName =
    bill?.cashier?.firstName || "";

  const lastName =
    bill?.cashier?.lastName || "";

  return (
    `${firstName} ${lastName}`.trim() ||
    bill?.cashier?.employeeId ||
    "-"
  );
};

// ======================================================
// HELD BILLS
// ======================================================

const HeldBills = () => {
  const navigate = useNavigate();

  // ====================================================
  // DATA
  // ====================================================

  const [heldBills, setHeldBills] =
    useState([]);

  const [
    selectedHeldBill,
    setSelectedHeldBill,
  ] = useState(null);

  // ====================================================
  // FILTERS
  // ====================================================

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [status, setStatus] =
    useState("HELD");

  // ====================================================
  // PAGINATION
  // ====================================================

  const [page, setPage] =
    useState(1);

  const [limit] = useState(10);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });

  // ====================================================
  // UI
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    resumeLoadingId,
    setResumeLoadingId,
  ] = useState(null);

  const [
    cancelLoading,
    setCancelLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // MODALS
  // ====================================================

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [cancelOpen, setCancelOpen] =
    useState(false);

  const [
    cancelTarget,
    setCancelTarget,
  ] = useState(null);

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  // ====================================================
  // SEARCH DEBOUNCE
  // ====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(
        search.trim()
      );

      setPage(1);
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [search]);

  // ====================================================
  // LOAD HELD BILLS
  // ====================================================

  const loadHeldBills =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (status) {
          params.status = status;
        }

        if (debouncedSearch) {
          params.search =
            debouncedSearch;
        }

        const response =
          await api.get(
            "/held-bills",
            {
              params,
            }
          );

        const result =
          response.data?.data || {};

        const bills =
          result.heldBills || [];

        setHeldBills(
          Array.isArray(bills)
            ? bills
            : []
        );

        const paging =
          result.pagination || {};

        setPagination({
          page:
            Number(
              paging.page
            ) || page,

          limit:
            Number(
              paging.limit
            ) || limit,

          total:
            Number(
              paging.total
            ) || 0,

          totalPages: Math.max(
            1,
            Number(
              paging.totalPages
            ) || 1
          ),
        });
      } catch (error) {
        console.error(
          "Held bills load error:",
          error.response?.data ||
            error.message
        );

        setHeldBills([]);

        setError(
          getErrorMessage(
            error,
            "Unable to load held bills."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      limit,
      status,
      debouncedSearch,
    ]);

  useEffect(() => {
    loadHeldBills();
  }, [loadHeldBills]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);
        setError("");
        setSuccess("");

        await loadHeldBills();
      } finally {
        setRefreshing(false);
      }
    };

  // ====================================================
  // FILTER STATUS
  // ====================================================

  const handleStatusChange = (
    value
  ) => {
    setStatus(value);
    setPage(1);
  };

  // ====================================================
  // LOAD DETAILS
  // ====================================================

  const openDetails =
    async (bill) => {
      try {
        setDetailOpen(true);

        setSelectedHeldBill(
          bill
        );

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/held-bills/${bill.id}`
          );

        const detailedBill =
          response.data?.data
            ?.heldBill;

        if (detailedBill) {
          setSelectedHeldBill(
            detailedBill
          );
        }
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load held bill details."
          )
        );
      } finally {
        setDetailLoading(false);
      }
    };

  // ====================================================
  // CLOSE DETAILS
  // ====================================================

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedHeldBill(null);
  };

  // ====================================================
  // RESUME
  // ====================================================

  const handleResume =
    async (bill) => {
      if (
        !bill ||
        bill.status !== "HELD"
      ) {
        return;
      }

      try {
        setResumeLoadingId(
          bill.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/held-bills/${bill.id}/resume`
          );

        const result =
          response.data?.data;

        const sale =
          result?.sale;

        if (!sale) {
          throw new Error(
            "Held bill resumed but sale data was not returned."
          );
        }

        setSuccess(
          response.data?.message ||
            "Held bill resumed successfully."
        );

        /*
         * Backend returns saleNumber.
         * Payment page uses saleNumber URL.
         */

        if (sale.saleNumber) {
          navigate(
            `/cashier/payment/${encodeURIComponent(
              sale.saleNumber
            )}`,
            {
              state: {
                sale,
              },
            }
          );

          return;
        }

        await loadHeldBills();
      } catch (error) {
        console.error(
          "Resume held bill error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to resume held bill."
          )
        );
      } finally {
        setResumeLoadingId(
          null
        );
      }
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancel = (bill) => {
    setCancelTarget(bill);

    setCancelReason("");

    setCancelOpen(true);

    setError("");
  };

  // ====================================================
  // CLOSE CANCEL
  // ====================================================

  const closeCancel = () => {
    if (cancelLoading) {
      return;
    }

    setCancelOpen(false);

    setCancelTarget(null);

    setCancelReason("");
  };

  // ====================================================
  // CANCEL
  // ====================================================

  const handleCancel =
    async (event) => {
      event.preventDefault();

      if (!cancelTarget) {
        return;
      }

      const reason =
        cancelReason.trim();

      if (reason.length < 2) {
        setError(
          "Cancellation reason must contain at least 2 characters."
        );

        return;
      }

      try {
        setCancelLoading(true);

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/held-bills/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Held bill cancelled successfully."
        );

        closeCancel();

        await loadHeldBills();
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to cancel held bill."
          )
        );
      } finally {
        setCancelLoading(false);
      }
    };

  // ====================================================
  // STATS
  // ====================================================

  const stats = useMemo(() => {
    return {
      visible:
        heldBills.length,

      active:
        heldBills.filter(
          (item) =>
            item.status ===
            "HELD"
        ).length,

      resumed:
        heldBills.filter(
          (item) =>
            item.status ===
            "RESUMED"
        ).length,

      expired:
        heldBills.filter(
          (item) =>
            item.status ===
            "EXPIRED"
        ).length,
    };
  }, [heldBills]);

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ===============================================
            HEADER
        ================================================ */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <PauseCircle
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Held Bills
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Resume or manage temporarily
              held customer bills.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cashier/new-sale"
                )
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <ShoppingCart
                size={16}
              />

              New Sale
            </button>
          </div>
        </div>

        {/* ===============================================
            ERROR
        ================================================ */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <p className="flex-1 text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X
                size={17}
                className="text-red-500"
              />
            </button>
          </div>
        )}

        {/* ===============================================
            SUCCESS
        ================================================ */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="flex-1 text-sm font-medium text-emerald-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X
                size={17}
                className="text-emerald-600"
              />
            </button>
          </div>
        )}

        {/* ===============================================
            STATS
        ================================================ */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-400">
              Results
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-600">
              Active on page
            </p>

            <p className="mt-2 text-2xl font-black text-amber-700">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-600">
              Resumed on page
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {stats.resumed}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">
              Expired on page
            </p>

            <p className="mt-2 text-2xl font-black text-slate-700">
              {stats.expired}
            </p>
          </div>
        </div>

        {/* ===============================================
            FILTER
        ================================================ */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_230px]">

            {/* SEARCH */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search hold number or note..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* STATUS */}

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none focus:border-blue-400"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option ||
                      "ALL"
                    }
                    value={option}
                  >
                    {option
                      ? option
                      : "ALL STATUS"}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* ===============================================
            TABLE
        ================================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading held bills...
                </p>
              </div>
            </div>
          ) : heldBills.length ===
            0 ? (
            <div className="flex min-h-[400px] items-center justify-center p-6 text-center">
              <div>
                <PauseCircle
                  size={42}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-bold text-slate-700">
                  No held bills found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Held bills from New Sale
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">
                        Hold Number
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Items
                      </th>

                      <th className="px-5 py-4">
                        Terminal
                      </th>

                      <th className="px-5 py-4">
                        Held At
                      </th>

                      <th className="px-5 py-4">
                        Expires
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {heldBills.map(
                      (bill) => (
                        <tr
                          key={bill.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {
                                bill.holdNumber
                              }
                            </p>

                            {bill.note && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                                {bill.note}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyle(
                                bill.status
                              )}`}
                            >
                              {bill.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                            {bill?._count
                              ?.items ??
                              "-"}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {bill
                                ?.terminal
                                ?.name ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {bill
                                ?.terminal
                                ?.code ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDateTime(
                              bill.heldAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock3
                                size={
                                  14
                                }
                              />

                              {formatDateTime(
                                bill.expiresAt
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  openDetails(
                                    bill
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                                title="View details"
                              >
                                <Eye
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {/* RESUME */}

                              {bill.status ===
                                "HELD" && (
                                <button
                                  type="button"
                                  disabled={
                                    resumeLoadingId ===
                                    bill.id
                                  }
                                  onClick={() =>
                                    handleResume(
                                      bill
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {resumeLoadingId ===
                                  bill.id ? (
                                    <Loader2
                                      size={
                                        14
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Play
                                      size={
                                        14
                                      }
                                    />
                                  )}

                                  Resume
                                </button>
                              )}

                              {/* CANCEL */}

                              {bill.status ===
                                "HELD" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCancel(
                                      bill
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                                  title="Cancel held bill"
                                >
                                  <Trash2
                                    size={
                                      15
                                    }
                                  />
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* =========================================
                  PAGINATION
              ========================================== */}

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  Showing page{" "}
                  <strong>
                    {
                      pagination.page
                    }
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      pagination.totalPages
                    }
                  </strong>
                  {" · "}
                  {pagination.total} total
                </p>

                <div className="flex gap-2">
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
                            current -
                              1
                          )
                      )
                    }
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />

                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current +
                          1
                      )
                    }
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next

                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===============================================
          DETAILS MODAL
      ================================================ */}

      {detailOpen &&
        selectedHeldBill && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Held Bill
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      selectedHeldBill.holdNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex min-h-[350px] items-center justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* INFO */}

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5">
                    <div>
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyle(
                          selectedHeldBill.status
                        )}`}
                      >
                        {
                          selectedHeldBill.status
                        }
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Cashier
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {getCashierName(
                          selectedHeldBill
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Branch
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {selectedHeldBill
                          ?.branch
                          ?.name ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Terminal
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {selectedHeldBill
                          ?.terminal
                          ?.name ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Held At
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedHeldBill.heldAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Expires
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedHeldBill.expiresAt
                        )}
                      </p>
                    </div>
                  </div>

                  {/* NOTE */}

                  {selectedHeldBill.note && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Note
                      </p>

                      <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {
                          selectedHeldBill.note
                        }
                      </p>
                    </div>
                  )}

                  {/* ITEMS */}

                  <div>
                    <h3 className="font-black text-slate-900">
                      Held Items
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      {selectedHeldBill
                        ?.items
                        ?.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {selectedHeldBill.items.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  item.id ||
                                  index
                                }
                                className="flex items-center justify-between gap-4 p-4"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-800">
                                    {item.productName ||
                                      item.product?.name ||
                                      item.sku ||
                                      `Item ${
                                        index +
                                        1
                                      }`}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    Quantity:{" "}
                                    {
                                      item.quantity
                                    }{" "}
                                    {item.unitSymbol ||
                                      item.selectedUnitSymbol ||
                                      ""}
                                  </p>
                                </div>

                                {item.lineTotal !==
                                  undefined && (
                                  <p className="font-bold text-slate-800">
                                    {formatMoney(
                                      item.lineTotal
                                    )}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="p-5 text-center text-sm text-slate-400">
                          No item details
                          available.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RESUMED SALE */}

                  {selectedHeldBill
                    ?.resumedSale && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        Resumed Sale
                      </p>

                      <p className="mt-2 font-black text-emerald-900">
                        {
                          selectedHeldBill
                            .resumedSale
                            .saleNumber
                        }
                      </p>

                      <p className="mt-1 text-sm text-emerald-700">
                        {formatMoney(
                          selectedHeldBill
                            .resumedSale
                            .grandTotal
                        )}
                      </p>
                    </div>
                  )}

                  {/* ACTION */}

                  {selectedHeldBill.status ===
                    "HELD" && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const bill =
                            selectedHeldBill;

                          closeDetails();

                          handleResume(
                            bill
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        <Play
                          size={16}
                        />

                        Resume Bill
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const bill =
                            selectedHeldBill;

                          closeDetails();

                          openCancel(
                            bill
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2
                          size={16}
                        />

                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* ===============================================
          CANCEL MODAL
      ================================================ */}

      {cancelOpen &&
        cancelTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <form
              onSubmit={
                handleCancel
              }
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Cancel Held Bill
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      cancelTarget.holdNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCancel
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cancellation Reason
                </label>

                <textarea
                  rows={4}
                  maxLength={500}
                  value={
                    cancelReason
                  }
                  onChange={(event) =>
                    setCancelReason(
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter reason..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                />

                <p className="mt-1 text-right text-[10px] text-slate-400">
                  {
                    cancelReason.length
                  }
                  /500
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={
                    closeCancel
                  }
                  disabled={
                    cancelLoading
                  }
                  className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
                >
                  Keep Bill
                </button>

                <button
                  type="submit"
                  disabled={
                    cancelLoading
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2
                      size={16}
                    />
                  )}

                  Cancel Bill
                </button>
              </div>
            </form>
          </div>
        )}
    </>
  );
};

export default HeldBills;