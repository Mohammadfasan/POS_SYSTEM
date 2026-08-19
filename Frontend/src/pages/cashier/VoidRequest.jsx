import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const VOID_STATUSES = [
  "",
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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

const statusClass = (status) => {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "APPROVED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-600";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-500";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const paymentMethodClass = (method) => {
  switch (method) {
    case "CASH":
      return "bg-emerald-50 text-emerald-700";

    case "CARD":
      return "bg-blue-50 text-blue-700";

    case "QR":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getPersonName = (person) => {
  if (!person) {
    return "-";
  }

  const name = `${person.firstName || ""} ${
    person.lastName || ""
  }`.trim();

  return (
    name ||
    person.employeeId ||
    "-"
  );
};

const generateIdempotencyKey = () => {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return `void-${crypto.randomUUID()}`;
  }

  return `void-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

// ======================================================
// VOID REQUESTS
// ======================================================

const VoidRequests = () => {
  const navigate = useNavigate();

  // ====================================================
  // LIST
  // ====================================================

  const [requests, setRequests] =
    useState([]);

  const [
    selectedVoid,
    setSelectedVoid,
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
    useState("");

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

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // DETAIL
  // ====================================================

  const [detailOpen, setDetailOpen] =
    useState(false);

  // ====================================================
  // CREATE VOID
  // ====================================================

  const [createOpen, setCreateOpen] =
    useState(false);

  const [saleLookup, setSaleLookup] =
    useState("");

  const [saleResults, setSaleResults] =
    useState([]);

  const [
    saleSearchLoading,
    setSaleSearchLoading,
  ] = useState(false);

  const [
    selectedSale,
    setSelectedSale,
  ] = useState(null);

  const [
    selectedSaleLoading,
    setSelectedSaleLoading,
  ] = useState(false);

  const [voidReason, setVoidReason] =
    useState("");

  const [
    createLoading,
    setCreateLoading,
  ] = useState(false);

  // ====================================================
  // CANCEL
  // ====================================================

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

  const [
    cancelLoading,
    setCancelLoading,
  ] = useState(false);

  // ====================================================
  // EXECUTE VOID
  // ====================================================

  const [executeOpen, setExecuteOpen] =
    useState(false);

  const [
    executeTarget,
    setExecuteTarget,
  ] = useState(null);

  const [
    refundReferences,
    setRefundReferences,
  ] = useState({});

  const [
    executeLoading,
    setExecuteLoading,
  ] = useState(false);

  const executeIdempotencyKey =
    useRef(null);

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
  // LOAD VOID REQUESTS
  // ====================================================

  const loadVoidRequests =
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
          await api.get("/voids", {
            params,
          });

        const result =
          response.data?.data || {};

        const list =
          result.requests || [];

        setRequests(
          Array.isArray(list)
            ? list
            : []
        );

        const paging =
          result.pagination || {};

        setPagination({
          page:
            Number(paging.page) ||
            page,

          limit:
            Number(paging.limit) ||
            limit,

          total:
            Number(paging.total) ||
            0,

          totalPages: Math.max(
            1,
            Number(
              paging.totalPages
            ) || 1
          ),
        });
      } catch (error) {
        console.error(
          "Void requests error:",
          error.response?.data ||
            error.message
        );

        setRequests([]);

        setError(
          getErrorMessage(
            error,
            "Unable to load void requests."
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
    loadVoidRequests();
  }, [loadVoidRequests]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        setError("");
        setSuccess("");

        await loadVoidRequests();
      } finally {
        setRefreshing(false);
      }
    };

  // ====================================================
  // GET VOID DETAILS
  // ====================================================

  const getVoidDetails =
    async (voidId) => {
      const response =
        await api.get(
          `/voids/${voidId}`
        );

      return (
        response.data?.data
          ?.voidRequest || null
      );
    };

  // ====================================================
  // OPEN DETAILS
  // ====================================================

  const openDetails =
    async (request) => {
      try {
        setSelectedVoid(request);

        setDetailOpen(true);

        setDetailLoading(true);

        setError("");

        const detail =
          await getVoidDetails(
            request.id
          );

        if (detail) {
          setSelectedVoid(detail);
        }
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load void details."
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

    setSelectedVoid(null);
  };

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const openCreate = () => {
    setCreateOpen(true);

    setSaleLookup("");

    setSaleResults([]);

    setSelectedSale(null);

    setVoidReason("");

    setError("");
    setSuccess("");
  };

  // ====================================================
  // CLOSE CREATE
  // ====================================================

  const closeCreate = () => {
    if (createLoading) {
      return;
    }

    setCreateOpen(false);

    setSaleLookup("");

    setSaleResults([]);

    setSelectedSale(null);

    setVoidReason("");
  };

  // ====================================================
  // SEARCH COMPLETED SALES
  // ====================================================

  const searchCompletedSales =
    async (event) => {
      event?.preventDefault();

      const value =
        saleLookup.trim();

      if (!value) {
        setError(
          "Enter sale number or invoice number."
        );

        return;
      }

      try {
        setSaleSearchLoading(true);

        setError("");

        const response =
          await api.get("/sales", {
            params: {
              search: value,
              status:
                "COMPLETED",
              page: 1,
              limit: 20,
            },
          });

        const list =
          response.data?.data
            ?.sales || [];

        setSaleResults(
          Array.isArray(list)
            ? list
            : []
        );

        if (list.length === 0) {
          setError(
            "No completed sale found."
          );
        }
      } catch (error) {
        setSaleResults([]);

        setError(
          getErrorMessage(
            error,
            "Unable to search completed sales."
          )
        );
      } finally {
        setSaleSearchLoading(
          false
        );
      }
    };

  // ====================================================
  // SELECT SALE
  // ====================================================

  const selectSale =
    async (sale) => {
      try {
        setSelectedSaleLoading(
          true
        );

        setError("");

        const response =
          await api.get(
            `/sales/${sale.id}`
          );

        const detail =
          response.data?.data
            ?.sale;

        if (!detail) {
          throw new Error(
            "Sale details were not returned."
          );
        }

        if (
          detail.status !==
          "COMPLETED"
        ) {
          throw new Error(
            "Only completed sales can be voided."
          );
        }

        setSelectedSale(detail);

        setSaleResults([]);
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load sale."
          )
        );
      } finally {
        setSelectedSaleLoading(
          false
        );
      }
    };

  // ====================================================
  // CREATE VOID REQUEST
  // ====================================================

  const handleCreateVoid =
    async (event) => {
      event.preventDefault();

      if (!selectedSale) {
        setError(
          "Select a completed sale first."
        );

        return;
      }

      const reason =
        voidReason.trim();

      if (reason.length < 3) {
        setError(
          "Void reason must contain at least 3 characters."
        );

        return;
      }

      try {
        setCreateLoading(true);

        setError("");
        setSuccess("");

        const response =
          await api.post(
            "/voids",
            {
              saleId:
                selectedSale.id,

              reason,
            }
          );

        const voidRequest =
          response.data?.data
            ?.voidRequest;

        setSuccess(
          voidRequest?.voidNumber
            ? `Void request ${voidRequest.voidNumber} created successfully. Waiting for approval.`
            : response.data
                ?.message ||
                "Void request created successfully."
        );

        setCreateOpen(false);

        setSelectedSale(null);

        setSaleLookup("");

        setSaleResults([]);

        setVoidReason("");

        setStatus("PENDING");

        setPage(1);

        await loadVoidRequests();
      } catch (error) {
        console.error(
          "Create void error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to create void request."
          )
        );
      } finally {
        setCreateLoading(false);
      }
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancel = (
    request
  ) => {
    setCancelTarget(request);

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
  // CANCEL VOID
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
            `/voids/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Void request cancelled successfully."
        );

        setCancelOpen(false);

        setCancelTarget(null);

        setCancelReason("");

        closeDetails();

        await loadVoidRequests();
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to cancel void request."
          )
        );
      } finally {
        setCancelLoading(false);
      }
    };

  // ====================================================
  // PREPARE EXECUTION
  // ====================================================

  const openExecute =
    async (request) => {
      try {
        setExecuteLoading(true);

        setError("");

        let detail = request;

        if (
          !detail?.sale?.payments
        ) {
          detail =
            await getVoidDetails(
              request.id
            );
        }

        if (!detail) {
          throw new Error(
            "Void request details not found."
          );
        }

        if (
          detail.status !==
          "APPROVED"
        ) {
          throw new Error(
            "Void request must be approved before execution."
          );
        }

        if (
          detail?.sale?.status !==
          "COMPLETED"
        ) {
          throw new Error(
            "Sale is no longer eligible for void."
          );
        }

        const refs = {};

        (
          detail.sale
            ?.payments || []
        ).forEach(
          (payment) => {
            if (
              ["CARD", "QR"].includes(
                payment.method
              )
            ) {
              refs[payment.id] =
                "";
            }
          }
        );

        setRefundReferences(
          refs
        );

        setExecuteTarget(detail);

        executeIdempotencyKey.current =
          null;

        setExecuteOpen(true);

        setDetailOpen(false);

        setSelectedVoid(null);
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to prepare void execution."
          )
        );
      } finally {
        setExecuteLoading(false);
      }
    };

  // ====================================================
  // CLOSE EXECUTE
  // ====================================================

  const closeExecute = () => {
    if (executeLoading) {
      return;
    }

    setExecuteOpen(false);

    setExecuteTarget(null);

    setRefundReferences({});

    executeIdempotencyKey.current =
      null;
  };

  // ====================================================
  // UPDATE REFUND REFERENCE
  // ====================================================

  const updateRefundReference = (
    paymentId,
    value
  ) => {
    /*
     * Request data changed,
     * so generate new key when
     * actually executing.
     */

    executeIdempotencyKey.current =
      null;

    setRefundReferences(
      (current) => ({
        ...current,

        [paymentId]: value,
      })
    );
  };

  // ====================================================
  // EXECUTE VOID
  // ====================================================

  const handleExecuteVoid =
    async (event) => {
      event.preventDefault();

      if (!executeTarget) {
        return;
      }

      const payments =
        executeTarget?.sale
          ?.payments || [];

      const references = [];

      for (const payment of payments) {
        if (
          !["CARD", "QR"].includes(
            payment.method
          )
        ) {
          continue;
        }

        const reference =
          String(
            refundReferences[
              payment.id
            ] || ""
          ).trim();

        if (!reference) {
          setError(
            `Refund transaction reference is required for ${payment.method} payment ${payment.paymentNumber}.`
          );

          return;
        }

        references.push({
          paymentId:
            payment.id,

          transactionReference:
            reference,
        });
      }

      try {
        setExecuteLoading(true);

        setError("");
        setSuccess("");

        if (
          !executeIdempotencyKey.current
        ) {
          executeIdempotencyKey.current =
            generateIdempotencyKey();
        }

        const response =
          await api.post(
            `/voids/${executeTarget.id}/execute`,
            {
              refundReferences:
                references,
            },
            {
              headers: {
                "Idempotency-Key":
                  executeIdempotencyKey.current,
              },
            }
          );

        executeIdempotencyKey.current =
          null;

        setSuccess(
          response.data?.message ||
            "Sale voided successfully."
        );

        setExecuteOpen(false);

        setExecuteTarget(null);

        setRefundReferences({});

        setStatus("COMPLETED");

        setPage(1);

        await loadVoidRequests();
      } catch (error) {
        /*
         * Do NOT clear idempotency key.
         * Same action can be safely retried.
         */

        console.error(
          "Execute void error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to execute void."
          )
        );
      } finally {
        setExecuteLoading(false);
      }
    };

  // ====================================================
  // STATS
  // ====================================================

  const stats = useMemo(() => {
    const pending =
      requests.filter(
        (item) =>
          item.status ===
          "PENDING"
      );

    const approved =
      requests.filter(
        (item) =>
          item.status ===
          "APPROVED"
      );

    const completed =
      requests.filter(
        (item) =>
          item.status ===
          "COMPLETED"
      );

    const completedAmount =
      completed.reduce(
        (total, item) =>
          total +
          Number(
            item.totalAmount ||
              item.sale?.grandTotal ||
              0
          ),
        0
      );

    return {
      pending:
        pending.length,

      approved:
        approved.length,

      completed:
        completed.length,

      completedAmount,
    };
  }, [requests]);

  // ====================================================
  // EXECUTE PAYMENT INFO
  // ====================================================

  const executionPayments =
    executeTarget?.sale
      ?.payments || [];

  const hasCashPayment =
    executionPayments.some(
      (payment) =>
        payment.method ===
        "CASH"
    );

  const cardQrPayments =
    executionPayments.filter(
      (payment) =>
        ["CARD", "QR"].includes(
          payment.method
        )
    );

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ===========================================
            HEADER
        ============================================ */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Ban
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Void Requests
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Request void approval and
              execute approved sale voids.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
              onClick={
                openCreate
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Ban size={16} />

              New Void Request
            </button>
          </div>
        </div>

        {/* ===========================================
            ERROR
        ============================================ */}

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

        {/* ===========================================
            SUCCESS
        ============================================ */}

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

        {/* ===========================================
            STATS
        ============================================ */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-600">
              Pending on Page
            </p>

            <p className="mt-2 text-2xl font-black text-amber-700">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-semibold text-blue-600">
              Ready to Execute
            </p>

            <p className="mt-2 text-2xl font-black text-blue-700">
              {stats.approved}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold text-emerald-600">
              Completed on Page
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {stats.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-400">
              Voided Amount
            </p>

            <p className="mt-2 text-xl font-black text-slate-900">
              {formatMoney(
                stats.completedAmount
              )}
            </p>
          </div>
        </div>

        {/* ===========================================
            FILTER
        ============================================ */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
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
                placeholder="Void number, sale number or invoice..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value
                );

                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none"
            >
              {VOID_STATUSES.map(
                (option) => (
                  <option
                    key={
                      option ||
                      "ALL"
                    }
                    value={option}
                  >
                    {option ||
                      "ALL STATUS"}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* ===========================================
            TABLE
        ============================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[430px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading void requests...
                </p>
              </div>
            </div>
          ) : requests.length ===
            0 ? (
            <div className="flex min-h-[430px] items-center justify-center p-6 text-center">
              <div>
                <Ban
                  size={44}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-bold text-slate-700">
                  No void requests
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your void requests will
                  appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">
                        Void
                      </th>

                      <th className="px-5 py-4">
                        Sale
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Amount
                      </th>

                      <th className="px-5 py-4">
                        Requested
                      </th>

                      <th className="px-5 py-4">
                        Refunds
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {requests.map(
                      (request) => (
                        <tr
                          key={
                            request.id
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {
                                request.voidNumber
                              }
                            </p>

                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                              {request.reason}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-700">
                              {request.sale
                                ?.saleNumber ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {request.sale
                                ?.invoiceNumber ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                request.status
                              )}`}
                            >
                              {
                                request.status
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-black text-slate-800">
                              {formatMoney(
                                request.totalAmount ??
                                  request.sale
                                    ?.grandTotal
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDateTime(
                              request.requestedAt
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-600">
                            {request?._count
                              ?.refunds ??
                              0}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  openDetails(
                                    request
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {/* EXECUTE */}

                              {request.status ===
                                "APPROVED" && (
                                <button
                                  type="button"
                                  disabled={
                                    executeLoading
                                  }
                                  onClick={() =>
                                    openExecute(
                                      request
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <RotateCcw
                                    size={
                                      14
                                    }
                                  />

                                  Execute
                                </button>
                              )}

                              {/* CANCEL */}

                              {request.status ===
                                "PENDING" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCancel(
                                      request
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
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

              {/* PAGINATION */}

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  Page{" "}
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
                  {pagination.total} requests
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
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
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
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
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

      {/* ==============================================
          CREATE VOID MODAL
      =============================================== */}

      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={
              handleCreateVoid
            }
            className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Sale Void
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  New Void Request
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  createLoading
                }
                onClick={
                  closeCreate
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">

              {/* SALE SEARCH */}

              {!selectedSale && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Completed Sale
                  </label>

                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={
                          saleLookup
                        }
                        onChange={(
                          event
                        ) =>
                          setSaleLookup(
                            event.target
                              .value
                          )
                        }
                        placeholder="Sale number or invoice number..."
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={
                        searchCompletedSales
                      }
                      disabled={
                        saleSearchLoading
                      }
                      className="flex min-w-[110px] items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {saleSearchLoading ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>

                  {saleResults.length >
                    0 && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      {saleResults.map(
                        (sale) => (
                          <button
                            key={
                              sale.id
                            }
                            type="button"
                            onClick={() =>
                              selectSale(
                                sale
                              )
                            }
                            className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 hover:bg-slate-50"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {
                                  sale.saleNumber
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {sale.invoiceNumber ||
                                  "-"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-slate-800">
                                {formatMoney(
                                  sale.grandTotal
                                )}
                              </p>

                              <p className="mt-1 text-[10px] font-bold text-emerald-600">
                                {
                                  sale.status
                                }
                              </p>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LOADING */}

              {selectedSaleLoading && (
                <div className="flex min-h-52 items-center justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-blue-600"
                  />
                </div>
              )}

              {/* SELECTED SALE */}

              {selectedSale &&
                !selectedSaleLoading && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Selected Sale
                        </p>

                        <p className="mt-1 font-black text-slate-900">
                          {
                            selectedSale.saleNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {selectedSale.invoiceNumber ||
                            "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">
                          {formatMoney(
                            selectedSale.grandTotal
                          )}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSale(
                              null
                            );

                            setVoidReason(
                              ""
                            );
                          }}
                          className="mt-2 text-xs font-bold text-blue-600"
                        >
                          Change Sale
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs text-slate-500">
                        {
                          selectedSale
                            ?.items
                            ?.length || 0
                        }{" "}
                        sale items
                      </p>
                    </div>
                  </div>

                  {/* WARNING */}

                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex gap-3">
                      <ShieldAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-red-600"
                      />

                      <div>
                        <p className="text-sm font-bold text-red-700">
                          Full sale reversal
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-600">
                          Once approved and
                          executed, the full
                          payment will be
                          refunded and tracked
                          inventory will be
                          restored.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* REASON */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Void Reason
                    </label>

                    <textarea
                      rows={4}
                      maxLength={500}
                      value={voidReason}
                      onChange={(event) =>
                        setVoidReason(
                          event.target
                            .value
                        )
                      }
                      placeholder="Why should this completed sale be voided?"
                      className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                    />

                    <p className="mt-1 text-right text-[10px] text-slate-400">
                      {voidReason.length}/500
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      createLoading ||
                      voidReason.trim()
                        .length < 3
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-40"
                  >
                    {createLoading ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Ban
                        size={17}
                      />
                    )}

                    Submit Void Request
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ==============================================
          DETAILS MODAL
      =============================================== */}

      {detailOpen &&
        selectedVoid && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Void Details
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      selectedVoid.voidNumber
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
                  <X size={18} />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex min-h-[430px] items-center justify-center">
                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* SUMMARY */}

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                          selectedVoid.status
                        )}`}
                      >
                        {
                          selectedVoid.status
                        }
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Amount
                      </p>

                      <p className="mt-1 font-black text-slate-800">
                        {formatMoney(
                          selectedVoid.totalAmount
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Requested By
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {getPersonName(
                          selectedVoid.requestedBy
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Requested At
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedVoid.requestedAt
                        )}
                      </p>
                    </div>
                  </div>

                  {/* REASON */}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Void Reason
                    </p>

                    <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {
                        selectedVoid.reason
                      }
                    </p>
                  </div>

                  {/* SALE */}

                  {selectedVoid.sale && (
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Original Sale
                      </p>

                      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row">
                        <div>
                          <p className="font-black text-slate-900">
                            {
                              selectedVoid
                                .sale
                                .saleNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {selectedVoid
                              .sale
                              .invoiceNumber ||
                              "-"}
                          </p>
                        </div>

                        <p className="text-xl font-black text-slate-900">
                          {formatMoney(
                            selectedVoid
                              .sale
                              .grandTotal
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ITEMS */}

                  {selectedVoid.sale
                    ?.items?.length >
                    0 && (
                    <div>
                      <h3 className="font-black text-slate-900">
                        Sale Items
                      </h3>

                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                        {selectedVoid.sale.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex justify-between gap-4 border-b border-slate-100 p-4 last:border-b-0"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {
                                    item.productName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {item.sku ||
                                    ""}
                                </p>

                                <p className="mt-2 text-xs font-medium text-slate-500">
                                  Qty:{" "}
                                  {
                                    item.quantity
                                  }{" "}
                                  {item.selectedUnitSymbol ||
                                    ""}
                                </p>
                              </div>

                              <p className="font-black text-slate-800">
                                {formatMoney(
                                  item.lineTotal
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* PAYMENTS */}

                  {selectedVoid.sale
                    ?.payments?.length >
                    0 && (
                    <div>
                      <h3 className="font-black text-slate-900">
                        Original Payments
                      </h3>

                      <div className="mt-3 space-y-2">
                        {selectedVoid.sale.payments.map(
                          (payment) => (
                            <div
                              key={
                                payment.id
                              }
                              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-800">
                                    {
                                      payment.paymentNumber
                                    }
                                  </p>

                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-bold ${paymentMethodClass(
                                      payment.method
                                    )}`}
                                  >
                                    {
                                      payment.method
                                    }
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatDateTime(
                                    payment.createdAt
                                  )}
                                </p>
                              </div>

                              <p className="font-black text-slate-800">
                                {formatMoney(
                                  payment.amount
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* APPROVED */}

                  {selectedVoid.approvedBy && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Approved
                      </p>

                      <p className="mt-1 text-sm font-bold text-blue-800">
                        {getPersonName(
                          selectedVoid.approvedBy
                        )}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {formatDateTime(
                          selectedVoid.approvedAt
                        )}
                      </p>
                    </div>
                  )}

                  {/* REJECTED */}

                  {selectedVoid.status ===
                    "REJECTED" && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                        Rejected
                      </p>

                      <p className="mt-2 text-sm text-red-700">
                        {selectedVoid.rejectReason ||
                          "No rejection reason available."}
                      </p>
                    </div>
                  )}

                  {/* CANCELLED */}

                  {selectedVoid.status ===
                    "CANCELLED" && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Cancelled
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {selectedVoid.cancelReason ||
                          "No cancellation reason available."}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDateTime(
                          selectedVoid.cancelledAt
                        )}
                      </p>
                    </div>
                  )}

                  {/* VOID REFUNDS */}

                  {selectedVoid.refunds
                    ?.length > 0 && (
                    <div>
                      <h3 className="font-black text-slate-900">
                        Void Refunds
                      </h3>

                      <div className="mt-3 space-y-2">
                        {selectedVoid.refunds.map(
                          (refund) => (
                            <div
                              key={
                                refund.id
                              }
                              className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                            >
                              <div>
                                <p className="text-sm font-bold text-emerald-800">
                                  {
                                    refund.refundNumber
                                  }
                                </p>

                                <p className="mt-1 text-xs text-emerald-600">
                                  {
                                    refund.method
                                  }
                                  {refund.transactionReference
                                    ? ` · ${refund.transactionReference}`
                                    : ""}
                                </p>
                              </div>

                              <p className="font-black text-emerald-800">
                                {formatMoney(
                                  refund.amount
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="flex gap-3 border-t border-slate-100 pt-5">
                    {selectedVoid.status ===
                      "APPROVED" && (
                      <button
                        type="button"
                        onClick={() =>
                          openExecute(
                            selectedVoid
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        <RotateCcw
                          size={16}
                        />

                        Execute Void
                      </button>
                    )}

                    {selectedVoid.status ===
                      "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          const request =
                            selectedVoid;

                          closeDetails();

                          openCancel(
                            request
                          );
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2
                          size={16}
                        />

                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ==============================================
          CANCEL MODAL
      =============================================== */}

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
                    Cancel Void
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      cancelTarget.voidNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  disabled={
                    cancelLoading
                  }
                  onClick={
                    closeCancel
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X size={18} />
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
                      event.target.value
                    )
                  }
                  placeholder="Enter cancellation reason..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-red-400"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={
                    cancelLoading
                  }
                  onClick={
                    closeCancel
                  }
                  className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
                >
                  Keep Request
                </button>

                <button
                  type="submit"
                  disabled={
                    cancelLoading
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
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

                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      {/* ==============================================
          EXECUTE VOID MODAL
      =============================================== */}

      {executeOpen &&
        executeTarget && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <form
              onSubmit={
                handleExecuteVoid
              }
              className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Approved Void
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    Execute Void
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      executeTarget.voidNumber
                    }
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    executeLoading
                  }
                  onClick={
                    closeExecute
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 p-6">

                {/* AMOUNT */}

                <div className="rounded-2xl bg-red-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Full Void Amount
                  </p>

                  <p className="mt-2 text-3xl font-black text-red-800">
                    {formatMoney(
                      executeTarget.totalAmount ??
                        executeTarget.sale
                          ?.grandTotal
                    )}
                  </p>

                  <p className="mt-2 text-xs text-red-600">
                    Sale:{" "}
                    {
                      executeTarget.sale
                        ?.saleNumber
                    }
                  </p>
                </div>

                {/* WARNING */}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        This action is final
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        The complete sale
                        amount will be
                        refunded, tracked
                        stock will be
                        restored, and the
                        sale status will
                        become VOIDED.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PAYMENTS */}

                <div>
                  <h3 className="font-black text-slate-900">
                    Original Payments
                  </h3>

                  <div className="mt-3 space-y-3">
                    {executionPayments.map(
                      (payment) => (
                        <div
                          key={
                            payment.id
                          }
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800">
                                  {
                                    payment.paymentNumber
                                  }
                                </p>

                                <span
                                  className={`rounded-full px-2 py-1 text-[9px] font-bold ${paymentMethodClass(
                                    payment.method
                                  )}`}
                                >
                                  {
                                    payment.method
                                  }
                                </span>
                              </div>
                            </div>

                            <p className="font-black text-slate-900">
                              {formatMoney(
                                payment.amount
                              )}
                            </p>
                          </div>

                          {[
                            "CARD",
                            "QR",
                          ].includes(
                            payment.method
                          ) && (
                            <div className="mt-4">
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Refund Transaction Reference
                              </label>

                              <input
                                type="text"
                                maxLength={150}
                                value={
                                  refundReferences[
                                    payment.id
                                  ] || ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateRefundReference(
                                    payment.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder={`${payment.method} refund reference`}
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                              />
                            </div>
                          )}

                          {payment.method ===
                            "CASH" && (
                            <p className="mt-3 text-xs text-slate-400">
                              Cash refund does
                              not require an
                              external reference.
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* CASH DRAWER WARNING */}

                {hasCashPayment && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs leading-5 text-blue-700">
                      Cash refund requires an
                      open cashier shift,
                      active terminal, active
                      cash drawer, and enough
                      expected cash in the
                      drawer.
                    </p>
                  </div>
                )}

                {/* CARD/QR INFO */}

                {cardQrPayments.length >
                  0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-600">
                      {
                        cardQrPayments.length
                      }{" "}
                      CARD / QR payment
                      {cardQrPayments.length >
                      1
                        ? "s require"
                        : " requires"}{" "}
                      refund reference.
                    </p>
                  </div>
                )}

                {/* EXECUTE */}

                <button
                  type="submit"
                  disabled={
                    executeLoading
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {executeLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <ShieldAlert
                      size={17}
                    />
                  )}

                  Execute Full Void
                </button>
              </div>
            </form>
          </div>
        )}
    </>
  );
};

export default VoidRequests;
