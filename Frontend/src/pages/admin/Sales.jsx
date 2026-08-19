import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  ShoppingCart,
  ReceiptText,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  RotateCcw,
  Ban,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Package,
  CreditCard,
  Banknote,
  QrCode,
  CalendarDays,
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
  const amount =
    Number(value) || 0;

  return new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }
  ).format(amount);
};

const formatDateTime = (
  value
) => {
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

const displayStatus = (
  status
) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const getStatusStyle = (
  status
) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-700";

    case "PARTIALLY_PAID":
      return "bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600";

    case "VOIDED":
      return "bg-red-50 text-red-600";

    case "PARTIALLY_REFUNDED":
      return "bg-purple-50 text-purple-700";

    case "REFUNDED":
      return "bg-fuchsia-50 text-fuchsia-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

// ======================================================
// PAGE
// ======================================================

const Sales = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [sales, setSales] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const [total, setTotal] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    selectedSale,
    setSelectedSale,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    cancelModalOpen,
    setCancelModalOpen,
  ] = useState(false);

  const [
    cancellingSale,
    setCancellingSale,
  ] = useState(null);

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  // ====================================================
  // EXTRACT SALES
  // ====================================================

  const extractSales = (
    response
  ) => {
    const result =
      response?.data?.data;

    if (
      Array.isArray(result)
    ) {
      return result;
    }

    return (
      result?.sales ??
      result?.items ??
      result?.rows ??
      result?.data ??
      []
    );
  };

  // ====================================================
  // LOAD BRANCHES
  // ====================================================

  const loadBranches =
    async () => {
      try {
        const response =
          await api.get(
            "/branches"
          );

        const data =
          response.data?.data;

        const branchData =
          data?.branches ??
          response.data
            ?.branches ??
          (Array.isArray(data)
            ? data
            : []);

        setBranches(
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );
      } catch (err) {
        console.error(
          "Branch load error:",
          err.response?.data ||
            err.message
        );

        setBranches([]);
      }
    };

  // ====================================================
  // LOAD SALES
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

        if (
          statusFilter
        ) {
          params.status =
            statusFilter;
        }

        if (
          branchFilter
        ) {
          params.branchId =
            branchFilter;
        }

        const response =
          await api.get(
            "/sales",
            {
              params,
            }
          );

        console.log(
          "Sales Response:",
          response.data
        );

        const saleData =
          extractSales(
            response
          );

        const safeSales =
          Array.isArray(
            saleData
          )
            ? saleData
            : [];

        setSales(
          safeSales
        );

        // -----------------------------------------------
        // PAGINATION
        // -----------------------------------------------

        const result =
          response.data?.data ??
          {};

        const pagination =
          result.pagination ??
          {};

        const responseTotal =
          Number(
            pagination.total ??
              result.total ??
              result.count ??
              response.data
                ?.count ??
              safeSales.length
          );

        const calculatedPages =
          Math.ceil(
            responseTotal /
              limit
          );

        const rawPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        const responsePages =
          Math.max(
            1,
            Number(
              rawPages
            ) || 1
          );

        setTotal(
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeSales.length
        );

        setTotalPages(
          responsePages
        );
      } catch (err) {
        console.error(
          "Sales load error:",
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
  // INITIAL
  // ====================================================

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [
    page,
    limit,
    search,
    statusFilter,
    branchFilter,
  ]);

  // ====================================================
  // SALE HELPERS
  // ====================================================

  const getBranch = (
    sale
  ) => {
    if (sale?.branch) {
      return sale.branch;
    }

    return branches.find(
      (branch) =>
        branch.id ===
        sale?.branchId
    );
  };

  const getCashierName = (
    sale
  ) => {
    const cashier =
      sale?.cashier ??
      sale?.user ??
      sale?.createdBy;

    if (!cashier) {
      return (
        sale?.cashierName ??
        "—"
      );
    }

    if (
      typeof cashier ===
      "string"
    ) {
      return cashier;
    }

    const name = [
      cashier.firstName,
      cashier.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      name ||
      cashier.name ||
      cashier.employeeId ||
      cashier.email ||
      "—"
    );
  };

  const getItemCount = (
    sale
  ) => {
    if (
      Array.isArray(
        sale?.items
      )
    ) {
      return sale.items.length;
    }

    return Number(
      sale?.itemCount ??
        sale?._count?.items ??
        sale?.totalItems ??
        0
    );
  };

  const getSaleTotal = (
    sale
  ) => {
    return Number(
      sale?.grandTotal ??
        sale?.totalAmount ??
        sale?.netAmount ??
        sale?.total ??
        0
    );
  };

  const getSubtotal = (
    sale
  ) => {
    return Number(
      sale?.subtotal ??
        sale?.subTotal ??
        sale?.totalBeforeDiscount ??
        getSaleTotal(sale)
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

  const getPayments = (
    sale
  ) => {
    if (
      Array.isArray(
        sale?.payments
      )
    ) {
      return sale.payments;
    }

    if (
      sale?.payment
    ) {
      return [
        sale.payment,
      ];
    }

    return [];
  };

  const getPaymentMethod = (
    sale
  ) => {
    const payments =
      getPayments(sale);

    if (
      payments.length > 0
    ) {
      return (
        payments[0]?.method ||
        "—"
      );
    }

    return (
      sale?.paymentMethod ||
      sale?.method ||
      "—"
    );
  };

  // ====================================================
  // CURRENT PAGE STATS
  // ====================================================

  const currentPageTotal =
    useMemo(() => {
      return sales.reduce(
        (sum, sale) =>
          sum +
          getSaleTotal(sale),
        0
      );
    }, [sales]);

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
          "PENDING_PAYMENT" ||
        sale.status ===
          "PARTIALLY_PAID"
    ).length;

  // ====================================================
  // SEARCH
  // ====================================================

  const handleSearch =
    (event) => {
      event.preventDefault();

      setSearch(
        searchInput.trim()
      );

      setPage(1);
    };

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("");
    setBranchFilter("");
    setPage(1);
  };

  // ====================================================
  // VIEW DETAILS
  // ====================================================

  const openDetails =
    async (sale) => {
      try {
        setDetailsOpen(
          true
        );

        setDetailsLoading(
          true
        );

        setSelectedSale(
          sale
        );

        setError("");

        const response =
          await api.get(
            `/sales/${sale.id}`
          );

        console.log(
          "Sale Detail Response:",
          response.data
        );

        const detailedSale =
          response.data?.data
            ?.sale ??
          response.data?.data ??
          sale;

        setSelectedSale(
          detailedSale
        );
      } catch (err) {
        console.error(
          "Sale details error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load sale details."
        );
      } finally {
        setDetailsLoading(
          false
        );
      }
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancelModal = (
    sale
  ) => {
    setCancellingSale(
      sale
    );

    setCancelReason("");

    setCancelModalOpen(
      true
    );
  };

  // ====================================================
  // CANCEL SALE
  // ====================================================

  const handleCancelSale =
    async (event) => {
      event.preventDefault();

      if (
        !cancellingSale
      ) {
        return;
      }

      try {
        setCancelling(true);

        setError("");
        setSuccess("");

        if (
          cancelReason
            .trim()
            .length < 2
        ) {
          throw new Error(
            "Cancellation reason must contain at least 2 characters."
          );
        }

        await api.post(
          `/sales/${cancellingSale.id}/cancel`,
          {
            reason:
              cancelReason.trim(),
          }
        );

        setSuccess(
          `Sale ${
            cancellingSale.saleNumber ||
            cancellingSale.invoiceNumber ||
            ""
          } cancelled successfully.`
        );

        setCancelModalOpen(
          false
        );

        setCancellingSale(
          null
        );

        setCancelReason("");

        if (
          selectedSale?.id ===
          cancellingSale.id
        ) {
          setDetailsOpen(
            false
          );

          setSelectedSale(
            null
          );
        }

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
        setCancelling(false);
      }
    };

  // ====================================================
  // PAYMENT ICON
  // ====================================================

  const PaymentIcon = ({
    method,
  }) => {
    if (
      method === "CASH"
    ) {
      return (
        <Banknote
          size={16}
          className="text-emerald-600"
        />
      );
    }

    if (
      method === "CARD"
    ) {
      return (
        <CreditCard
          size={16}
          className="text-blue-600"
        />
      );
    }

    if (
      method === "QR"
    ) {
      return (
        <QrCode
          size={16}
          className="text-purple-600"
        />
      );
    }

    return (
      <CreditCard
        size={16}
        className="text-slate-400"
      />
    );
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

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sales
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage POS
            transactions, invoices and
            sale details.
          </p>
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
                  Total Sales
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  All records
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingCart
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* CURRENT VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Sales Value
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-600">
                  {formatMoney(
                    currentPageTotal
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ReceiptText
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
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

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {pendingCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3
                  size={23}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN TABLE CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTER
          ================================================= */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_auto]">

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
                  placeholder="Search sale number or invoice number..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

              {/* BRANCH */}

              <select
                value={
                  branchFilter
                }
                onChange={(e) => {
                  setBranchFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Branches
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={
                        branch.id
                      }
                      value={
                        branch.id
                      }
                    >
                      {branch.name}
                    </option>
                  )
                )}
              </select>

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
                      {displayStatus(
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

            /* ===============================================
               EMPTY
            ================================================ */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <ShoppingCart
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No sales found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  POS transactions will
                  appear here.
                </p>
              </div>
            </div>
          ) : (

            /* ===============================================
               TABLE
            ================================================ */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Sale / Invoice
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
                        getBranch(
                          sale
                        );

                      const method =
                        getPaymentMethod(
                          sale
                        );

                      return (
                        <tr
                          key={
                            sale.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* =================================
                              SALE
                          ================================= */}

                          <td className="px-5 py-4">

                            <p className="whitespace-nowrap text-sm font-semibold text-blue-600">
                              {sale.invoiceNumber ||
                                sale.saleNumber ||
                                "—"}
                            </p>

                            {sale.invoiceNumber &&
                              sale.saleNumber && (
                                <p className="mt-1 max-w-52 truncate text-xs text-slate-400">
                                  {
                                    sale.saleNumber
                                  }
                                </p>
                              )}
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-4">

                            <div className="flex items-start gap-2">

                              <CalendarDays
                                size={15}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />

                              <span className="text-sm text-slate-600">
                                {formatDateTime(
                                  sale.completedAt ??
                                    sale.createdAt
                                )}
                              </span>
                            </div>
                          </td>

                          {/* BRANCH */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Building2
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="whitespace-nowrap text-sm text-slate-700">
                                {branch?.name ||
                                  sale.branchName ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          {/* CASHIER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                                <User
                                  size={15}
                                />
                              </div>

                              <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                                {getCashierName(
                                  sale
                                )}
                              </span>
                            </div>
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

                            <div className="flex items-center gap-2">

                              <PaymentIcon
                                method={
                                  method
                                }
                              />

                              <span className="text-sm font-semibold text-slate-600">
                                {method}
                              </span>
                            </div>
                          </td>

                          {/* DISCOUNT */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-red-500">

                            {getDiscount(
                              sale
                            ) > 0
                              ? `- ${formatMoney(
                                  getDiscount(
                                    sale
                                  )
                                )}`
                              : formatMoney(
                                  0
                                )}
                          </td>

                          {/* TOTAL */}

                          <td className="whitespace-nowrap px-5 py-4">

                            <p className="font-bold text-slate-900">
                              {formatMoney(
                                getSaleTotal(
                                  sale
                                )
                              )}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                                sale.status
                              )}`}
                            >
                              {displayStatus(
                                sale.status
                              )}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                title="View sale details"
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

                              {/* CANCEL */}

                              {sale.status ===
                                "PENDING_PAYMENT" && (
                                <button
                                  type="button"
                                  title="Cancel pending sale"
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

                <div className="text-sm text-slate-500">

                  Page{" "}

                  <span className="font-semibold text-slate-800">
                    {page}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {
                      totalPages
                    }
                  </span>

                  <span className="ml-2">
                    ({total} sales)
                  </span>
                </div>

                <div className="flex items-center gap-3">

                  <select
                    value={
                      limit
                    }
                    onChange={(e) => {
                      setLimit(
                        Number(
                          e.target
                            .value
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                            current +
                              1
                          )
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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

            <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Sale Details
                  </h2>

                  <p className="mt-1 text-sm text-blue-600">
                    {selectedSale.invoiceNumber ||
                      selectedSale.saleNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedSale(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex min-h-80 items-center justify-center">

                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="p-6">

                  {/* INFO */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Sale Number
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                        {selectedSale.saleNumber ||
                          "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Invoice Number
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-blue-600">
                        {selectedSale.invoiceNumber ||
                          "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Cashier
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {getCashierName(
                          selectedSale
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Status
                      </p>

                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            selectedSale.status
                          )}`}
                        >
                          {displayStatus(
                            selectedSale.status
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Created At
                      </p>

                      <p className="mt-2 text-sm text-slate-700">
                        {formatDateTime(
                          selectedSale.createdAt
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Completed At
                      </p>

                      <p className="mt-2 text-sm text-slate-700">
                        {formatDateTime(
                          selectedSale.completedAt
                        )}
                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      ITEMS
                  ======================================== */}

                  <div className="mt-7">

                    <div className="mb-4 flex items-center justify-between">

                      <div>
                        <h3 className="font-bold text-slate-900">
                          Sale Items
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Products included
                          in this transaction.
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                        {getItemCount(
                          selectedSale
                        )}{" "}
                        Items
                      </span>
                    </div>

                    {Array.isArray(
                      selectedSale.items
                    ) &&
                    selectedSale.items
                      .length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">

                        <table className="w-full min-w-[650px]">

                          <thead className="bg-slate-50">

                            <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                              <th className="px-4 py-3">
                                Product
                              </th>

                              <th className="px-4 py-3">
                                Unit
                              </th>

                              <th className="px-4 py-3 text-right">
                                Price
                              </th>

                              <th className="px-4 py-3 text-right">
                                Qty
                              </th>

                              <th className="px-4 py-3 text-right">
                                Total
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {selectedSale.items.map(
                              (
                                item,
                                index
                              ) => {
                                const product =
                                  item.product ??
                                  {};

                                const unit =
                                  item.unit ??
                                  {};

                                const qty =
                                  Number(
                                    item.quantity ??
                                      item.qty ??
                                      0
                                  );

                                const unitPrice =
                                  Number(
                                    item.unitPrice ??
                                      item.price ??
                                      item.sellingPrice ??
                                      0
                                  );

                                const lineTotal =
                                  Number(
                                    item.total ??
                                      item.lineTotal ??
                                      item.totalAmount ??
                                      qty *
                                        unitPrice
                                  );

                                return (
                                  <tr
                                    key={
                                      item.id ??
                                      index
                                    }
                                  >

                                    <td className="px-4 py-3">

                                      <div className="flex items-center gap-3">

                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                                          <Package
                                            size={17}
                                          />
                                        </div>

                                        <div>
                                          <p className="text-sm font-semibold text-slate-800">

                                            {product.name ||
                                              item.productName ||
                                              "Product"}

                                          </p>

                                          <p className="mt-1 text-xs text-slate-400">

                                            SKU:{" "}

                                            {product.sku ||
                                              item.sku ||
                                              "—"}

                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">

                                      {unit.symbol ||
                                        unit.name ||
                                        item.unitSymbol ||
                                        "—"}

                                    </td>

                                    <td className="px-4 py-3 text-right text-sm text-slate-600">

                                      {formatMoney(
                                        unitPrice
                                      )}

                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold text-slate-700">

                                      {qty.toLocaleString()}

                                    </td>

                                    <td className="px-4 py-3 text-right font-bold text-slate-900">

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
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
                        No sale item information returned.
                      </div>
                    )}
                  </div>

                  {/* =======================================
                      TOTAL
                  ======================================== */}

                  <div className="mt-6 flex justify-end">

                    <div className="w-full max-w-sm rounded-2xl bg-slate-50 p-5">

                      <div className="flex justify-between text-sm text-slate-600">
                        <span>
                          Subtotal
                        </span>

                        <span>
                          {formatMoney(
                            getSubtotal(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between text-sm text-slate-600">
                        <span>
                          Discount
                        </span>

                        <span className="text-red-500">
                          -{" "}
                          {formatMoney(
                            getDiscount(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between text-sm text-slate-600">
                        <span>
                          Tax
                        </span>

                        <span>
                          {formatMoney(
                            getTax(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>

                      <div className="my-4 border-t border-dashed border-slate-300" />

                      <div className="flex items-center justify-between">

                        <span className="font-bold text-slate-900">
                          Grand Total
                        </span>

                        <span className="text-xl font-bold text-emerald-600">
                          {formatMoney(
                            getSaleTotal(
                              selectedSale
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      PAYMENTS
                  ======================================== */}

                  {getPayments(
                    selectedSale
                  ).length > 0 && (
                    <div className="mt-7">

                      <h3 className="font-bold text-slate-900">
                        Payments
                      </h3>

                      <div className="mt-4 space-y-3">

                        {getPayments(
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
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">

                                  <PaymentIcon
                                    method={
                                      payment.method
                                    }
                                  />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {payment.method ||
                                      "Payment"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {payment.paymentNumber ||
                                      payment.transactionReference ||
                                      "—"}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">

                                <p className="font-bold text-slate-900">
                                  {formatMoney(
                                    payment.amount
                                  )}
                                </p>

                                {payment.method ===
                                  "CASH" &&
                                  payment.changeAmount !=
                                    null && (
                                    <p className="mt-1 text-xs text-emerald-600">
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
                    </div>
                  )}

                  {/* CANCEL */}

                  {selectedSale.status ===
                    "PENDING_PAYMENT" && (
                    <div className="mt-7 flex justify-end border-t border-slate-200 pt-5">

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
                        className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Ban
                          size={17}
                        />

                        Cancel Sale
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* =================================================
          CANCEL SALE MODAL
      ================================================= */}

      {cancelModalOpen &&
        cancellingSale && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Cancel Sale
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {cancellingSale.saleNumber ||
                      cancellingSale.invoiceNumber}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    cancelling
                  }
                  onClick={() =>
                    setCancelModalOpen(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  handleCancelSale
                }
                className="p-6"
              >

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-sm text-amber-700">
                      Only a pending sale
                      without completed
                      payment can be
                      cancelled.
                    </p>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cancellation Reason *
                  </label>

                  <textarea
                    value={
                      cancelReason
                    }
                    onChange={(e) =>
                      setCancelReason(
                        e.target.value
                      )
                    }
                    required
                    minLength={2}
                    maxLength={500}
                    rows={4}
                    placeholder="Enter reason for cancelling this sale..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    disabled={
                      cancelling
                    }
                    onClick={() =>
                      setCancelModalOpen(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={
                      cancelling
                    }
                    className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-400"
                  >

                    {cancelling && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    Cancel Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default Sales;