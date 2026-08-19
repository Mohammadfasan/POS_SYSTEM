import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ShoppingCart,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ReceiptText,
  User,
  Building2,
  Package,
  Banknote,
  CreditCard,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
  Ban,
  Hash,
  Percent,
  CircleDollarSign,
  WalletCards,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// SALE STATUS
// ======================================================

const SALE_STATUSES = [
  "PENDING_PAYMENT",
  "PARTIALLY_PAID",
  "COMPLETED",
  "CANCELLED",
  "VOIDED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

// ======================================================
// HELPERS
// ======================================================

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

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

const displayText = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const getStatusStyle = (status) => {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING_PAYMENT":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "PARTIALLY_PAID":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "VOIDED":
      return "border-red-200 bg-red-50 text-red-700";

    case "PARTIALLY_REFUNDED":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "REFUNDED":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

// ======================================================
// PAGE
// ======================================================

const Sales = () => {
  // ====================================================
  // MAIN DATA
  // ====================================================

  const [
    sales,
    setSales,
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
    actionLoading,
    setActionLoading,
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
  // FILTER
  // ====================================================

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
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
    selectedSale,
    setSelectedSale,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    salePayments,
    setSalePayments,
  ] = useState([]);

  // ====================================================
  // CANCEL
  // ====================================================

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    cancelTarget,
    setCancelTarget,
  ] = useState(null);

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  // ====================================================
  // RECEIPT
  // ====================================================

  const [
    receiptOpen,
    setReceiptOpen,
  ] = useState(false);

  const [
    receiptLoading,
    setReceiptLoading,
  ] = useState(false);

  const [
    receiptText,
    setReceiptText,
  ] = useState("");

  const [
    receiptSale,
    setReceiptSale,
  ] = useState(null);

  // ====================================================
  // FETCH SALES
  //
  // GET /api/sales
  // ====================================================

  const fetchSales =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (search) {
          params.search =
            search;
        }

        if (statusFilter) {
          params.status =
            statusFilter;
        }

        const response =
          await api.get(
            "/sales",
            {
              params,
            }
          );

        console.log(
          "Manager Sales Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const saleData =
          result.sales ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeSales =
          Array.isArray(saleData)
            ? saleData
            : [];

        setSales(
          safeSales
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
              safeSales.length
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
            : safeSales.length
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
          "Manager sales load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load sales."
        );

        setSales([]);
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
    fetchSales();
  }, [
    page,
    limit,
    search,
    statusFilter,
  ]);

  // ====================================================
  // SALE NUMBER
  // ====================================================

  const getSaleNumber = (
    sale
  ) => {
    return (
      sale?.invoiceNumber ??
      sale?.saleNumber ??
      sale?.number ??
      sale?.id ??
      "—"
    );
  };

  // ====================================================
  // INVOICE
  // ====================================================

  const getInvoiceNumber = (
    sale
  ) => {
    return (
      sale?.invoiceNumber ??
      sale?.saleNumber ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  //
  // Manager /branches endpoint may not be available,
  // so use relation returned inside sale.
  // ====================================================

  const getBranch = (
    sale
  ) => {
    return (
      sale?.branch ??
      sale?.shift?.branch ??
      sale?.terminal?.branch ??
      null
    );
  };

  // ====================================================
  // CASHIER
  // ====================================================

  const getCashierObject = (
    sale
  ) => {
    return (
      sale?.cashier ??
      sale?.shift?.cashier ??
      sale?.shift?.user ??
      sale?.user ??
      null
    );
  };

  const getCashier = (
    sale
  ) => {
    const user =
      getCashierObject(sale);

    if (!user) {
      return (
        sale?.cashierName ??
        sale?.cashierId ??
        "—"
      );
    }

    if (
      typeof user ===
      "string"
    ) {
      return user;
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
      user.email ||
      "—"
    );
  };

  // ====================================================
  // CUSTOMER
  // ====================================================

  const getCustomer = (
    sale
  ) => {
    const customer =
      sale?.customer;

    if (!customer) {
      return (
        sale?.customerName ??
        "Walk-in Customer"
      );
    }

    if (
      typeof customer ===
      "string"
    ) {
      return customer;
    }

    const fullName = [
      customer.firstName,
      customer.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      customer.name ||
      customer.phone ||
      "Walk-in Customer"
    );
  };

  // ====================================================
  // ITEMS
  // ====================================================

  const getItems = (
    sale
  ) => {
    const items =
      sale?.items ??
      sale?.saleItems ??
      [];

    return Array.isArray(items)
      ? items
      : [];
  };

  const getItemCount = (
    sale
  ) => {
    const items =
      getItems(sale);

    if (items.length > 0) {
      return items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity ??
              item.qty ??
              1
          ),
        0
      );
    }

    return Number(
      sale?._count
        ?.saleItems ??
        sale?._count?.items ??
        sale?.itemCount ??
        sale?.itemsCount ??
        0
    );
  };

  // ====================================================
  // PRODUCT
  // ====================================================

  const getProduct = (
    item
  ) => {
    return (
      item?.product ??
      item?.inventory?.product ??
      null
    );
  };

  const getProductName = (
    item
  ) => {
    const product =
      getProduct(item);

    return (
      product?.name ??
      item?.productName ??
      item?.name ??
      "Product"
    );
  };

  const getProductSku = (
    item
  ) => {
    const product =
      getProduct(item);

    return (
      product?.sku ??
      item?.sku ??
      "—"
    );
  };

  // ====================================================
  // TOTALS
  // ====================================================

  const getSubtotal = (
    sale
  ) => {
    return Number(
      sale?.subtotal ??
        sale?.subTotal ??
        0
    );
  };

  const getDiscount = (
    sale
  ) => {
    return Number(
      sale?.discountAmount ??
        sale?.totalDiscount ??
        sale?.discount ??
        0
    );
  };

  const getTax = (
    sale
  ) => {
    return Number(
      sale?.taxAmount ??
        sale?.totalTax ??
        sale?.tax ??
        0
    );
  };

  const getTotal = (
    sale
  ) => {
    return Number(
      sale?.grandTotal ??
        sale?.totalAmount ??
        sale?.total ??
        0
    );
  };

  // ====================================================
  // PAYMENTS
  // ====================================================

  const getEmbeddedPayments = (
    sale
  ) => {
    const payments =
      sale?.payments ??
      [];

    return Array.isArray(
      payments
    )
      ? payments
      : [];
  };

  const getDisplayPayments = (
    sale
  ) => {
    if (
      selectedSale?.id ===
        sale?.id &&
      salePayments.length > 0
    ) {
      return salePayments;
    }

    return getEmbeddedPayments(
      sale
    );
  };

  const getPaymentMethod = (
    sale
  ) => {
    const payments =
      getEmbeddedPayments(
        sale
      );

    if (
      payments.length === 0
    ) {
      return (
        sale?.paymentMethod ??
        "—"
      );
    }

    const methods =
      Array.from(
        new Set(
          payments
            .map(
              (payment) =>
                payment.method
            )
            .filter(Boolean)
        )
      );

    return methods.length > 0
      ? methods.join(", ")
      : "—";
  };

  // ====================================================
  // STATS CURRENT PAGE
  // ====================================================

  const completedCount =
    sales.filter(
      (sale) =>
        sale.status ===
        "COMPLETED"
    ).length;

  const pendingCount =
    sales.filter(
      (sale) =>
        sale.status ===
        "PENDING_PAYMENT"
    ).length;

  const refundedCount =
    sales.filter(
      (sale) =>
        sale.status ===
          "REFUNDED" ||
        sale.status ===
          "PARTIALLY_REFUNDED"
    ).length;

  const pageSalesAmount =
    useMemo(() => {
      return sales.reduce(
        (sum, sale) => {
          if (
            sale.status ===
              "CANCELLED" ||
            sale.status ===
              "VOIDED"
          ) {
            return sum;
          }

          return (
            sum +
            getTotal(sale)
          );
        },
        0
      );
    }, [sales]);

  // ====================================================
  // SEARCH
  // ====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    setSearch(
      searchInput.trim()
    );

    setPage(1);
  };

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStatusFilter("");
      setPage(1);
    };

  // ====================================================
  // PAYMENT PARSER
  // ====================================================

  const parsePayments = (
    response
  ) => {
    const result =
      response?.data?.data;

    const data =
      result?.payments ??
      result?.items ??
      (Array.isArray(result)
        ? result
        : []);

    return Array.isArray(data)
      ? data
      : [];
  };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /sales/:id
  // GET /payments/sale/:saleId
  // ====================================================

  const openDetails =
    async (sale) => {
      try {
        setSelectedSale(
          sale
        );

        setSalePayments(
          getEmbeddedPayments(
            sale
          )
        );

        setDetailsOpen(true);
        setDetailLoading(true);
        setError("");

        const [
          saleResult,
          paymentResult,
        ] =
          await Promise.allSettled([
            api.get(
              `/sales/${sale.id}`
            ),

            api.get(
              `/payments/sale/${sale.id}`
            ),
          ]);

        // ===============================================
        // SALE DETAILS
        // ===============================================

        if (
          saleResult.status ===
          "fulfilled"
        ) {
          const response =
            saleResult.value;

          const detailed =
            response.data?.data
              ?.sale ??
            response.data?.data ??
            sale;

          setSelectedSale(
            detailed
          );
        } else {
          console.error(
            "Sale detail error:",
            saleResult.reason
              ?.response?.data ||
              saleResult.reason
                ?.message
          );
        }

        // ===============================================
        // PAYMENT DETAILS
        // ===============================================

        if (
          paymentResult.status ===
          "fulfilled"
        ) {
          setSalePayments(
            parsePayments(
              paymentResult.value
            )
          );
        } else {
          console.error(
            "Sale payment error:",
            paymentResult.reason
              ?.response?.data ||
              paymentResult.reason
                ?.message
          );
        }
      } catch (err) {
        console.error(
          "Open sale detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load sale details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // CLOSE DETAILS
  // ====================================================

  const closeDetails =
    () => {
      setDetailsOpen(false);
      setSelectedSale(null);
      setSalePayments([]);
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancelModal = (
    sale
  ) => {
    setCancelTarget(
      sale
    );

    setCancelReason("");

    setCancelOpen(true);
  };

  // ====================================================
  // CLOSE CANCEL
  // ====================================================

  const closeCancelModal =
    () => {
      if (actionLoading) {
        return;
      }

      setCancelOpen(false);
      setCancelTarget(null);
      setCancelReason("");
    };

  // ====================================================
  // CANCEL SALE
  //
  // POST /sales/:id/cancel
  // ====================================================

  const handleCancelSale =
    async (event) => {
      event.preventDefault();

      if (!cancelTarget) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");
        setSuccess("");

        const reason =
          cancelReason.trim();

        if (!reason) {
          throw new Error(
            "Please enter cancellation reason."
          );
        }

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

        setCancelOpen(false);
        setCancelTarget(null);
        setCancelReason("");

        closeDetails();

        await fetchSales();
      } catch (err) {
        console.error(
          "Cancel sale error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to cancel sale."
        );
      } finally {
        setActionLoading(false);
      }
    };

  // ====================================================
  // RECEIPT
  //
  // GET /receipts/sale/:saleId/text
  // ====================================================

  const openReceipt =
    async (sale) => {
      try {
        setReceiptSale(
          sale
        );

        setReceiptText("");
        setReceiptOpen(true);
        setReceiptLoading(true);
        setError("");

        const response =
          await api.get(
            `/receipts/sale/${sale.id}/text`
          );

        console.log(
          "Receipt Text Response:",
          response.data
        );

        const result =
          response.data?.data;

        let text = "";

        if (
          typeof result ===
          "string"
        ) {
          text = result;
        } else {
          text =
            result?.text ??
            result?.receipt ??
            result?.receiptText ??
            response.data?.text ??
            "";
        }

        setReceiptText(
          String(text || "")
        );
      } catch (err) {
        console.error(
          "Receipt load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load receipt."
        );

        setReceiptOpen(false);
        setReceiptSale(null);
      } finally {
        setReceiptLoading(
          false
        );
      }
    };

  // ====================================================
  // PRINT RECEIPT
  // ====================================================

  const printReceipt =
    () => {
      if (!receiptText) {
        return;
      }

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=500,height=700"
        );

      if (!printWindow) {
        setError(
          "Browser blocked the print window."
        );

        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>
              Receipt ${escapeHtml(
                getInvoiceNumber(
                  receiptSale
                )
              )}
            </title>

            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family:
                  "Courier New",
                  monospace;
                background: white;
                color: black;
              }

              pre {
                font-family:
                  "Courier New",
                  monospace;
                font-size: 12px;
                white-space: pre-wrap;
                margin: 0;
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
            <CheckCircle2
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
            <AlertCircle
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sales
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View sales transactions,
              payments and receipts.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchSales
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
        </div>

        {/* =================================================
            KPI
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Sales
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingCart
                  size={21}
                />
              </div>
            </div>
          </div>

          {/* PAGE AMOUNT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Sales Value
            </p>

            <p className="mt-2 text-xl font-bold text-blue-600">
              {formatMoney(
                pageSalesAmount
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {completedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Pending Payment
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {pendingCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
          </div>

          {/* REFUNDS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Refunded
            </p>

            <p className="mt-2 text-2xl font-bold text-purple-600">
              {refundedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
          </div>
        </div>

        {/* =================================================
            MAIN TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_auto]">

              {/* SEARCH */}

              <form
                onSubmit={
                  handleSearch
                }
                className="relative"
              >
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={
                    searchInput
                  }
                  onChange={(e) =>
                    setSearchInput(
                      e.target.value
                    )
                  }
                  placeholder="Search sale or invoice number..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

              {/* STATUS */}

              <select
                value={
                  statusFilter
                }
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Status
                </option>

                {SALE_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {displayText(
                        status
                      )}
                    </option>
                  )
                )}
              </select>

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
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">
                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading sales...
                </p>
              </div>
            </div>
          ) : sales.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">
                <ReceiptText
                  size={34}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-700">
                  No sales found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Sales transactions
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1180px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Invoice / Sale
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Cashier
                    </th>

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Items
                    </th>

                    <th className="px-5 py-4">
                      Payment
                    </th>

                    <th className="px-5 py-4">
                      Discount
                    </th>

                    <th className="px-5 py-4">
                      Total
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {sales.map(
                    (sale) => {
                      const branch =
                        getBranch(sale);

                      return (
                        <tr
                          key={sale.id}
                          className="transition hover:bg-slate-50"
                        >

                          {/* INVOICE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <ReceiptText
                                  size={17}
                                />
                              </div>

                              <div>
                                <p className="max-w-52 truncate text-sm font-semibold text-blue-600">
                                  {getInvoiceNumber(
                                    sale
                                  )}
                                </p>

                                {sale.saleNumber &&
                                  sale.invoiceNumber && (
                                    <p className="mt-1 max-w-52 truncate text-xs text-slate-400">
                                      {
                                        sale.saleNumber
                                      }
                                    </p>
                                  )}
                              </div>
                            </div>
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {formatDateTime(
                              sale.completedAt ??
                                sale.createdAt
                            )}

                          </td>

                          {/* BRANCH */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Building2
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="whitespace-nowrap text-sm text-slate-600">
                                {branch?.name ??
                                  "—"}
                              </span>
                            </div>
                          </td>

                          {/* CASHIER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <User
                                size={15}
                                className="text-purple-500"
                              />

                              <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                                {getCashier(
                                  sale
                                )}
                              </span>
                            </div>
                          </td>

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <p className="max-w-44 truncate text-sm text-slate-600">

                              {getCustomer(
                                sale
                              )}

                            </p>
                          </td>

                          {/* ITEMS */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Package
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="font-semibold text-slate-700">
                                {getItemCount(
                                  sale
                                )}
                              </span>
                            </div>
                          </td>

                          {/* PAYMENT */}

                          <td className="px-5 py-4">

                            <span className="whitespace-nowrap text-sm font-medium text-slate-600">

                              {displayText(
                                getPaymentMethod(
                                  sale
                                )
                              )}

                            </span>
                          </td>

                          {/* DISCOUNT */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-red-500">

                            {formatMoney(
                              getDiscount(
                                sale
                              )
                            )}

                          </td>

                          {/* TOTAL */}

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">

                            {formatMoney(
                              getTotal(
                                sale
                              )
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                                sale.status
                              )}`}
                            >
                              {displayText(
                                sale.status
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                title="View sale"
                                onClick={() =>
                                  openDetails(
                                    sale
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              {/* RECEIPT */}

                              {sale.status ===
                                "COMPLETED" && (
                                <button
                                  type="button"
                                  title="View receipt"
                                  onClick={() =>
                                    openReceipt(
                                      sale
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-200 text-purple-600 transition hover:bg-purple-50"
                                >
                                  <Printer
                                    size={16}
                                  />
                                </button>
                              )}

                              {/* CANCEL */}

                              {sale.status ===
                                "PENDING_PAYMENT" && (
                                <button
                                  type="button"
                                  title="Cancel sale"
                                  onClick={() =>
                                    openCancelModal(
                                      sale
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                                >
                                  <Ban
                                    size={16}
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
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            sales.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">

                  Page{" "}

                  <span className="font-semibold text-slate-800">
                    {page}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {totalPages}
                  </span>

                  <span className="ml-2">
                    ({total} sales)
                  </span>
                </p>

                <div className="flex items-center gap-3">

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
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
                    {page}
                  </span>

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40"
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
          SALE DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Sale Details
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {getInvoiceNumber(
                      selectedSale
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={21}
                  />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex min-h-80 items-center justify-center">

                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* =======================================
                      BASIC INFO
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* INVOICE */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Invoice
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <Hash
                          size={15}
                          className="text-blue-600"
                        />

                        <p className="break-all text-sm font-bold text-blue-600">
                          {getInvoiceNumber(
                            selectedSale
                          )}
                        </p>
                      </div>
                    </div>

                    {/* DATE */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Date & Time
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <CalendarDays
                          size={15}
                          className="text-slate-500"
                        />

                        <p className="text-sm font-semibold text-slate-700">
                          {formatDateTime(
                            selectedSale.completedAt ??
                              selectedSale.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    {/* CASHIER */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Cashier
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <User
                          size={15}
                          className="text-purple-600"
                        />

                        <p className="text-sm font-semibold text-slate-700">
                          {getCashier(
                            selectedSale
                          )}
                        </p>
                      </div>
                    </div>

                    {/* BRANCH */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Branch
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <Building2
                          size={15}
                          className="text-emerald-600"
                        />

                        <p className="text-sm font-semibold text-slate-700">
                          {getBranch(
                            selectedSale
                          )?.name ??
                            "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      CUSTOMER + STATUS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Customer
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {getCustomer(
                          selectedSale
                        )}
                      </p>

                      {selectedSale.customer
                        ?.phone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {
                            selectedSale
                              .customer.phone
                          }
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Sale Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          selectedSale.status
                        )}`}
                      >
                        {displayText(
                          selectedSale.status
                        )}
                      </span>
                    </div>
                  </div>

                  {/* =======================================
                      ITEMS
                  ======================================== */}

                  <div>

                    <div className="mb-4 flex items-center justify-between">

                      <div>
                        <h3 className="font-bold text-slate-900">
                          Sale Items
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Products in this
                          transaction.
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                        {getItemCount(
                          selectedSale
                        )}{" "}
                        items
                      </span>
                    </div>

                    {getItems(
                      selectedSale
                    ).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
                        No item details
                        returned by API.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[700px]">

                            <thead className="bg-slate-50">

                              <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                                <th className="px-4 py-3">
                                  Product
                                </th>

                                <th className="px-4 py-3">
                                  SKU
                                </th>

                                <th className="px-4 py-3">
                                  Qty
                                </th>

                                <th className="px-4 py-3">
                                  Price
                                </th>

                                <th className="px-4 py-3 text-right">
                                  Total
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                              {getItems(
                                selectedSale
                              ).map(
                                (
                                  item,
                                  index
                                ) => {
                                  const quantity =
                                    Number(
                                      item.quantity ??
                                        item.qty ??
                                        0
                                    );

                                  const price =
                                    Number(
                                      item.unitPrice ??
                                        item.price ??
                                        0
                                    );

                                  const lineTotal =
                                    Number(
                                      item.totalAmount ??
                                        item.lineTotal ??
                                        item.total ??
                                        quantity *
                                          price
                                    );

                                  return (
                                    <tr
                                      key={
                                        item.id ??
                                        index
                                      }
                                    >

                                      <td className="px-4 py-4">

                                        <div className="flex items-center gap-3">

                                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                            <Package
                                              size={17}
                                            />
                                          </div>

                                          <p className="font-semibold text-slate-800">
                                            {getProductName(
                                              item
                                            )}
                                          </p>
                                        </div>
                                      </td>

                                      <td className="px-4 py-4 text-sm text-slate-500">
                                        {getProductSku(
                                          item
                                        )}
                                      </td>

                                      <td className="px-4 py-4 font-semibold text-slate-700">
                                        {quantity}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                        {formatMoney(
                                          price
                                        )}
                                      </td>

                                      <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-slate-800">
                                        {formatMoney(
                                          lineTotal
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =======================================
                      PAYMENT
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Payment Information
                    </h3>

                    {getDisplayPayments(
                      selectedSale
                    ).length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-400">
                        No completed payment
                        information available.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">

                        {getDisplayPayments(
                          selectedSale
                        ).map(
                          (
                            payment,
                            index
                          ) => (
                            <div
                              key={
                                payment.id ??
                                index
                              }
                              className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >

                              <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                                  {String(
                                    payment.method
                                  ).includes(
                                    "CARD"
                                  ) ? (
                                    <CreditCard
                                      size={20}
                                    />
                                  ) : (
                                    <Banknote
                                      size={20}
                                    />
                                  )}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {displayText(
                                      payment.method
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {payment.paymentNumber ??
                                      payment.transactionReference ??
                                      "—"}
                                  </p>
                                </div>
                              </div>

                              <div className="text-left sm:text-right">

                                <p className="font-bold text-emerald-600">
                                  {formatMoney(
                                    payment.amount
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {displayText(
                                    payment.status
                                  )}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* =======================================
                      TOTAL SUMMARY
                  ======================================== */}

                  <div className="ml-auto w-full max-w-md rounded-2xl bg-slate-50 p-5">

                    <div className="space-y-3">

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>
                          Subtotal
                        </span>

                        <span className="font-semibold">
                          {formatMoney(
                            getSubtotal(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>
                          Discount
                        </span>

                        <span className="font-semibold text-red-500">
                          -{" "}
                          {formatMoney(
                            getDiscount(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>
                          Tax
                        </span>

                        <span className="font-semibold">
                          {formatMoney(
                            getTax(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-3">

                        <div className="flex items-center justify-between">

                          <span className="font-bold text-slate-900">
                            Grand Total
                          </span>

                          <span className="text-xl font-bold text-emerald-600">
                            {formatMoney(
                              getTotal(
                                selectedSale
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      ACTIONS
                  ======================================== */}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                    {selectedSale.status ===
                      "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() =>
                          openReceipt(
                            selectedSale
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                      >
                        <Printer
                          size={17}
                        />

                        Print Receipt
                      </button>
                    )}

                    {selectedSale.status ===
                      "PENDING_PAYMENT" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openCancelModal(
                            selectedSale
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Ban
                          size={17}
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

      {/* =================================================
          CANCEL MODAL
      ================================================= */}

      {cancelOpen &&
        cancelTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Cancel Sale
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {getSaleNumber(
                      cancelTarget
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    actionLoading
                  }
                  onClick={
                    closeCancelModal
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              <form
                onSubmit={
                  handleCancelSale
                }
                className="p-6"
              >

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <p className="text-sm leading-6 text-red-600">
                      Only a sale that is
                      still eligible for
                      cancellation can be
                      cancelled.
                    </p>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cancellation Reason *
                  </label>

                  <textarea
                    rows={4}
                    required
                    maxLength={500}
                    value={
                      cancelReason
                    }
                    onChange={(e) =>
                      setCancelReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter cancellation reason..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {cancelReason.length}
                    /500
                  </p>
                </div>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    disabled={
                      actionLoading
                    }
                    onClick={
                      closeCancelModal
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoading
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-400"
                  >
                    {actionLoading ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Ban
                        size={17}
                      />
                    )}

                    Cancel Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =================================================
          RECEIPT MODAL
      ================================================= */}

      {receiptOpen &&
        receiptSale && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>
                  <h2 className="font-bold text-slate-900">
                    Receipt
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {getInvoiceNumber(
                      receiptSale
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptOpen(
                      false
                    );

                    setReceiptSale(
                      null
                    );

                    setReceiptText(
                      ""
                    );
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              {/* CONTENT */}

              <div className="max-h-[65vh] overflow-y-auto bg-slate-100 p-5">

                {receiptLoading ? (
                  <div className="flex min-h-80 items-center justify-center">

                    <Loader2
                      size={30}
                      className="animate-spin text-blue-600"
                    />
                  </div>
                ) : (
                  <div className="mx-auto max-w-sm rounded-lg bg-white p-5 shadow-sm">

                    <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-800">

                      {receiptText ||
                        "Receipt text is empty."}

                    </pre>
                  </div>
                )}
              </div>

              {/* ACTION */}

              <div className="flex justify-end gap-3 border-t border-slate-200 p-4">

                <button
                  type="button"
                  onClick={() => {
                    setReceiptOpen(
                      false
                    );

                    setReceiptSale(
                      null
                    );

                    setReceiptText(
                      ""
                    );
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={
                    receiptLoading ||
                    !receiptText
                  }
                  onClick={
                    printReceipt
                  }
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  <Printer
                    size={17}
                  />

                  Print
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default Sales;