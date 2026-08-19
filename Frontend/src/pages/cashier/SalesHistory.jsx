import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  Printer,
  ReceiptText,
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
  "PENDING_PAYMENT",
  "PARTIALLY_PAID",
  "COMPLETED",
  "CANCELLED",
  "VOIDED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

const RECEIPT_STATUSES = [
  "COMPLETED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "VOIDED",
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
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING_PAYMENT":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "PARTIALLY_PAID":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-600";

    case "VOIDED":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "PARTIALLY_REFUNDED":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "REFUNDED":
      return "border-slate-200 bg-slate-100 text-slate-600";

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

const getCashierName = (sale) => {
  const firstName =
    sale?.cashier?.firstName || "";

  const lastName =
    sale?.cashier?.lastName || "";

  return (
    `${firstName} ${lastName}`.trim() ||
    sale?.cashier?.employeeId ||
    "-"
  );
};

const escapeHtml = (text = "") => {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
};

// ======================================================
// SALES HISTORY
// ======================================================

const SalesHistory = () => {
  const navigate = useNavigate();

  // ====================================================
  // DATA
  // ====================================================

  const [sales, setSales] =
    useState([]);

  const [selectedSale, setSelectedSale] =
    useState(null);

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
  // UI STATE
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
    cancelLoading,
    setCancelLoading,
  ] = useState(false);

  const [
    receiptLoadingId,
    setReceiptLoadingId,
  ] = useState(null);

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

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // ====================================================
  // LOAD SALES
  // ====================================================

  const loadSales =
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
          await api.get("/sales", {
            params,
          });

        const result =
          response.data?.data || {};

        const saleList =
          result.sales || [];

        setSales(
          Array.isArray(saleList)
            ? saleList
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
          "Sales load error:",
          error.response?.data ||
            error.message
        );

        setSales([]);

        setError(
          getErrorMessage(
            error,
            "Unable to load sales history."
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
    loadSales();
  }, [loadSales]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        setError("");
        setSuccess("");

        await loadSales();
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
  // OPEN DETAILS
  // ====================================================

  const openDetails =
    async (sale) => {
      try {
        setSelectedSale(sale);
        setDetailOpen(true);
        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/sales/${sale.id}`
          );

        const detailed =
          response.data?.data
            ?.sale;

        if (detailed) {
          setSelectedSale(
            detailed
          );
        }
      } catch (error) {
        console.error(
          "Sale detail error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to load sale details."
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
    setSelectedSale(null);
  };

  // ====================================================
  // CONTINUE PAYMENT
  // ====================================================

  const continuePayment = (
    sale
  ) => {
    if (
      !sale?.saleNumber
    ) {
      setError(
        "Sale number is missing."
      );

      return;
    }

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
  };

  // ====================================================
  // PRINT RECEIPT
  // ====================================================

  const printReceipt =
    async (sale) => {
      if (!sale?.id) {
        return;
      }

      try {
        setReceiptLoadingId(
          sale.id
        );

        setError("");

        const response =
          await api.get(
            `/receipts/sale/${sale.id}/text`,
            {
              responseType: "text",
            }
          );

        const receiptText =
          typeof response.data ===
          "string"
            ? response.data
            : String(
                response.data || ""
              );

        const printWindow =
          window.open(
            "",
            "_blank",
            "width=500,height=750"
          );

        if (!printWindow) {
          throw new Error(
            "Popup blocked. Allow popups to print receipt."
          );
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>
                Receipt - ${
                  sale.invoiceNumber ||
                  sale.saleNumber
                }
              </title>

              <style>
                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  padding: 24px;
                  background: #ffffff;
                  color: #000000;
                  font-family: "Courier New", monospace;
                }

                pre {
                  margin: 0;
                  white-space: pre-wrap;
                  word-break: break-word;
                  font-size: 13px;
                  line-height: 1.45;
                }

                @media print {
                  body {
                    padding: 0;
                  }
                }
              </style>
            </head>

            <body>
              <pre>${escapeHtml(
                receiptText
              )}</pre>

              <script>
                window.onload = function () {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);

        printWindow.document.close();
      } catch (error) {
        console.error(
          "Receipt error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to print receipt."
          )
        );
      } finally {
        setReceiptLoadingId(
          null
        );
      }
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancel = (sale) => {
    setCancelTarget(sale);

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
  // CANCEL SALE
  // ====================================================

  const handleCancelSale =
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
            `/sales/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Sale cancelled successfully."
        );

        // Close directly because cancelLoading
        // is currently true.
        setCancelOpen(false);
        setCancelTarget(null);
        setCancelReason("");

        closeDetails();

        await loadSales();
      } catch (error) {
        console.error(
          "Cancel sale error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to cancel sale."
          )
        );
      } finally {
        setCancelLoading(false);
      }
    };

  // ====================================================
  // VISIBLE PAGE STATS
  // ====================================================

  const stats = useMemo(() => {
    const completed =
      sales.filter(
        (sale) =>
          sale.status ===
          "COMPLETED"
      );

    const pending =
      sales.filter((sale) =>
        [
          "PENDING_PAYMENT",
          "PARTIALLY_PAID",
        ].includes(sale.status)
      );

    const completedTotal =
      completed.reduce(
        (total, sale) =>
          total +
          Number(
            sale.grandTotal || 0
          ),
        0
      );

    const pendingAmount =
      pending.reduce(
        (total, sale) =>
          total +
          Number(
            sale?.paymentSummary
              ?.remainingAmount || 0
          ),
        0
      );

    return {
      completedCount:
        completed.length,

      pendingCount:
        pending.length,

      completedTotal,

      pendingAmount,
    };
  }, [sales]);

  // ====================================================
  // SELECTED SALE VALUES
  // ====================================================

  const selectedPaidAmount =
    Number(
      selectedSale?.paymentSummary
        ?.paidAmount || 0
    );

  const selectedRemainingAmount =
    Number(
      selectedSale?.paymentSummary
        ?.remainingAmount ||
        selectedSale?.grandTotal ||
        0
    );

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ============================================
            HEADER
        ============================================= */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Sales History
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View your completed,
              pending and previous sales.
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
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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

        {/* ============================================
            ERROR
        ============================================= */}

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

        {/* ============================================
            SUCCESS
        ============================================= */}

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

        {/* ============================================
            STATS
        ============================================= */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-400">
              Total Results
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold text-emerald-600">
              Completed on Page
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {stats.completedCount}
            </p>

            <p className="mt-1 text-xs font-medium text-emerald-600">
              {formatMoney(
                stats.completedTotal
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-600">
              Pending on Page
            </p>

            <p className="mt-2 text-2xl font-black text-amber-700">
              {stats.pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-semibold text-blue-600">
              Pending Amount
            </p>

            <p className="mt-2 text-xl font-black text-blue-700">
              {formatMoney(
                stats.pendingAmount
              )}
            </p>
          </div>
        </div>

        {/* ============================================
            FILTERS
        ============================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px]">

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
                placeholder="Search sale number or invoice number..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
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
                    {option ||
                      "ALL STATUS"}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* ============================================
            SALES TABLE
        ============================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[430px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading sales...
                </p>
              </div>
            </div>
          ) : sales.length ===
            0 ? (
            <div className="flex min-h-[430px] items-center justify-center p-6 text-center">
              <div>
                <ReceiptText
                  size={44}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-bold text-slate-700">
                  No sales found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Your sales will appear
                  here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">

                  {/* TABLE HEAD */}

                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">
                        Sale
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Items
                      </th>

                      <th className="px-5 py-4">
                        Total
                      </th>

                      <th className="px-5 py-4">
                        Paid
                      </th>

                      <th className="px-5 py-4">
                        Remaining
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* BODY */}

                  <tbody className="divide-y divide-slate-100">
                    {sales.map(
                      (sale) => {
                        const paid =
                          Number(
                            sale
                              ?.paymentSummary
                              ?.paidAmount ||
                              0
                          );

                        const remaining =
                          Number(
                            sale
                              ?.paymentSummary
                              ?.remainingAmount ||
                              0
                          );

                        const canPay =
                          [
                            "PENDING_PAYMENT",
                            "PARTIALLY_PAID",
                          ].includes(
                            sale.status
                          );

                        const canCancel =
                          sale.status ===
                            "PENDING_PAYMENT" &&
                          paid <= 0;

                        const canPrint =
                          RECEIPT_STATUSES.includes(
                            sale.status
                          ) &&
                          sale.invoiceNumber;

                        return (
                          <tr
                            key={
                              sale.id
                            }
                            className="transition hover:bg-slate-50"
                          >

                            {/* SALE */}

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800">
                                {
                                  sale.saleNumber
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {sale.invoiceNumber ||
                                  "No invoice yet"}
                              </p>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                  sale.status
                                )}`}
                              >
                                {
                                  sale.status
                                }
                              </span>
                            </td>

                            {/* ITEMS */}

                            <td className="px-5 py-4">
                              <span className="text-sm font-bold text-slate-600">
                                {sale?._count
                                  ?.items ??
                                  "-"}
                              </span>
                            </td>

                            {/* TOTAL */}

                            <td className="px-5 py-4">
                              <p className="text-sm font-black text-slate-800">
                                {formatMoney(
                                  sale.grandTotal
                                )}
                              </p>
                            </td>

                            {/* PAID */}

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-emerald-600">
                                {formatMoney(
                                  paid
                                )}
                              </p>
                            </td>

                            {/* REMAINING */}

                            <td className="px-5 py-4">
                              <p
                                className={`text-sm font-bold ${
                                  remaining >
                                  0
                                    ? "text-amber-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {formatMoney(
                                  remaining
                                )}
                              </p>
                            </td>

                            {/* DATE */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <CalendarDays
                                  size={
                                    14
                                  }
                                />

                                {formatDateTime(
                                  sale.createdAt
                                )}
                              </div>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">

                                {/* VIEW */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openDetails(
                                      sale
                                    )
                                  }
                                  title="View sale"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                                >
                                  <Eye
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                {/* PAYMENT */}

                                {canPay && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      continuePayment(
                                        sale
                                      )
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700"
                                  >
                                    <CreditCard
                                      size={
                                        14
                                      }
                                    />

                                    Pay
                                  </button>
                                )}

                                {/* RECEIPT */}

                                {canPrint && (
                                  <button
                                    type="button"
                                    disabled={
                                      receiptLoadingId ===
                                      sale.id
                                    }
                                    onClick={() =>
                                      printReceipt(
                                        sale
                                      )
                                    }
                                    title="Print receipt"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                                  >
                                    {receiptLoadingId ===
                                    sale.id ? (
                                      <Loader2
                                        size={
                                          15
                                        }
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Printer
                                        size={
                                          15
                                        }
                                      />
                                    )}
                                  </button>
                                )}

                                {/* CANCEL */}

                                {canCancel && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openCancel(
                                        sale
                                      )
                                    }
                                    title="Cancel sale"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
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
                        );
                      }
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
                  {pagination.total} sales
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
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          DETAILS MODAL
      =============================================== */}

      {detailOpen &&
        selectedSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Sale Details
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      selectedSale.saleNumber
                    }
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedSale.invoiceNumber ||
                      "Invoice not generated"}
                  </p>
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
                <div className="flex min-h-[450px] items-center justify-center">
                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* GENERAL INFO */}

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                          selectedSale.status
                        )}`}
                      >
                        {
                          selectedSale.status
                        }
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Cashier
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {getCashierName(
                          selectedSale
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Branch
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {selectedSale
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
                        {selectedSale
                          ?.terminal
                          ?.name ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Shift
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {selectedSale
                          ?.shift
                          ?.shiftNumber ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Created At
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedSale.createdAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Completed At
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedSale.completedAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Invoice
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {selectedSale.invoiceNumber ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  {/* HELD BILL SOURCE */}

                  {selectedSale
                    ?.sourceHeldBill && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Resumed From Held Bill
                      </p>

                      <p className="mt-1 font-bold text-blue-800">
                        {
                          selectedSale
                            .sourceHeldBill
                            .holdNumber
                        }
                      </p>
                    </div>
                  )}

                  {/* ITEMS */}

                  <div>
                    <h3 className="font-black text-slate-900">
                      Sale Items
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      {selectedSale
                        ?.items
                        ?.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {selectedSale.items.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={
                                  item.id ||
                                  index
                                }
                                className="grid grid-cols-[1fr_auto] gap-4 p-4"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-800">
                                    {item.productName ||
                                      item.product
                                        ?.name ||
                                      `Product ${
                                        index +
                                        1
                                      }`}
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
                                      item.unitSymbol ||
                                      ""}
                                  </p>
                                </div>

                                <div className="text-right">
                                  {item.unitPrice !==
                                    undefined && (
                                    <p className="text-xs text-slate-400">
                                      {formatMoney(
                                        item.unitPrice
                                      )}{" "}
                                      each
                                    </p>
                                  )}

                                  <p className="mt-1 font-black text-slate-800">
                                    {formatMoney(
                                      item.lineTotal ??
                                        item.subtotal ??
                                        0
                                    )}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-sm text-slate-400">
                          No sale items found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PROMOTIONS */}

                  {selectedSale
                    ?.promotionsApplied
                    ?.length > 0 && (
                    <div>
                      <h3 className="font-black text-slate-900">
                        Promotions Applied
                      </h3>

                      <div className="mt-3 space-y-2">
                        {selectedSale.promotionsApplied.map(
                          (
                            promotion,
                            index
                          ) => (
                            <div
                              key={
                                promotion.id ||
                                index
                              }
                              className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4"
                            >
                              <div>
                                <p className="text-sm font-bold text-emerald-800">
                                  {promotion.promotionName ||
                                    promotion.promotionCode}
                                </p>

                                <p className="mt-1 text-xs text-emerald-600">
                                  {promotion.promotionCode}
                                  {promotion.scope
                                    ? ` · ${promotion.scope}`
                                    : ""}
                                </p>
                              </div>

                              <p className="font-black text-emerald-700">
                                -{" "}
                                {formatMoney(
                                  promotion.discountAmount
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* TOTALS */}

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                    {/* ORDER TOTAL */}

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-black text-slate-900">
                        Order Summary
                      </h3>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Subtotal
                          </span>

                          <span className="font-bold text-slate-800">
                            {formatMoney(
                              selectedSale.subtotal
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Discount
                          </span>

                          <span className="font-bold text-emerald-600">
                            -{" "}
                            {formatMoney(
                              selectedSale.discountAmount
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Tax
                          </span>

                          <span className="font-bold text-slate-800">
                            {formatMoney(
                              selectedSale.taxAmount
                            )}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-700">
                              Grand Total
                            </span>

                            <span className="text-xl font-black text-slate-900">
                              {formatMoney(
                                selectedSale.grandTotal
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PAYMENT SUMMARY */}

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-black text-slate-900">
                        Payment Summary
                      </h3>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Total
                          </span>

                          <span className="font-bold text-slate-800">
                            {formatMoney(
                              selectedSale.grandTotal
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Paid
                          </span>

                          <span className="font-bold text-emerald-600">
                            {formatMoney(
                              selectedPaidAmount
                            )}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-700">
                              Remaining
                            </span>

                            <span
                              className={`text-xl font-black ${
                                selectedRemainingAmount >
                                0
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {formatMoney(
                                selectedRemainingAmount
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENTS */}

                  <div>
                    <h3 className="font-black text-slate-900">
                      Payments
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      {selectedSale
                        ?.payments
                        ?.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {selectedSale.payments.map(
                            (
                              payment
                            ) => (
                              <div
                                key={
                                  payment.id
                                }
                                className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                    <CreditCard
                                      size={
                                        17
                                      }
                                      className="text-slate-600"
                                    />
                                  </div>

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

                                    {payment.transactionReference && (
                                      <p className="mt-1 text-xs text-slate-500">
                                        Ref:{" "}
                                        {
                                          payment.transactionReference
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="font-black text-slate-800">
                                    {formatMoney(
                                      payment.amount
                                    )}
                                  </p>

                                  {payment.method ===
                                    "CASH" &&
                                    payment.changeAmount !==
                                      null && (
                                      <p className="mt-1 text-xs text-slate-400">
                                        Change:{" "}
                                        {formatMoney(
                                          payment.changeAmount
                                        )}
                                      </p>
                                    )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="p-5 text-center text-sm text-slate-400">
                          No payments recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CANCEL INFO */}

                  {selectedSale.status ===
                    "CANCELLED" && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                        Cancelled Sale
                      </p>

                      <p className="mt-2 text-sm text-red-700">
                        {selectedSale.cancelReason ||
                          "No cancellation reason available."}
                      </p>

                      <p className="mt-2 text-xs text-red-500">
                        {formatDateTime(
                          selectedSale.cancelledAt
                        )}
                      </p>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                    {[
                      "PENDING_PAYMENT",
                      "PARTIALLY_PAID",
                    ].includes(
                      selectedSale.status
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          continuePayment(
                            selectedSale
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        <CreditCard
                          size={16}
                        />

                        Continue Payment
                      </button>
                    )}

                    {RECEIPT_STATUSES.includes(
                      selectedSale.status
                    ) &&
                      selectedSale.invoiceNumber && (
                        <button
                          type="button"
                          disabled={
                            receiptLoadingId ===
                            selectedSale.id
                          }
                          onClick={() =>
                            printReceipt(
                              selectedSale
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {receiptLoadingId ===
                          selectedSale.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Printer
                              size={16}
                            />
                          )}

                          Print Receipt
                        </button>
                      )}

                    {selectedSale.status ===
                      "PENDING_PAYMENT" &&
                      selectedPaidAmount <=
                        0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const sale =
                              selectedSale;

                            closeDetails();

                            openCancel(
                              sale
                            );
                          }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2
                            size={16}
                          />

                          Cancel Sale
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
                handleCancelSale
              }
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Cancel Sale
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      cancelTarget.saleNumber
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatMoney(
                      cancelTarget.grandTotal
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    cancelLoading
                  }
                  onClick={
                    closeCancel
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 disabled:opacity-50"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-xs leading-5 text-amber-700">
                    Cancelling this unpaid
                    sale will release its
                    reserved inventory.
                  </p>
                </div>
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
                  placeholder="Enter cancellation reason..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
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
                  disabled={
                    cancelLoading
                  }
                  onClick={
                    closeCancel
                  }
                  className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 disabled:opacity-50"
                >
                  Keep Sale
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

                  Cancel Sale
                </button>
              </div>
            </form>
          </div>
        )}
    </>
  );
};

export default SalesHistory;