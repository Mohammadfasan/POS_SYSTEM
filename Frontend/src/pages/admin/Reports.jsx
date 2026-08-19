import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Banknote,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Loader2,
  Package,
  Percent,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  TrendingUp,
  Undo2,
  User,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const REPORT_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
  },
  {
    id: "products",
    label: "Top Products",
    icon: Package,
  },
  {
    id: "payments",
    label: "Payments",
    icon: WalletCards,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    id: "cashiers",
    label: "Cashiers",
    icon: Users,
  },
  {
    id: "returns",
    label: "Returns",
    icon: Undo2,
  },
  {
    id: "voids",
    label: "Voids",
    icon: XCircle,
  },
  {
    id: "discounts",
    label: "Discounts",
    icon: Percent,
  },
];

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
  return new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }
  ).format(Number(value) || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat(
    "en-LK"
  ).format(Number(value) || 0);
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

  return date.toLocaleString(
    "en-LK"
  );
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

// ======================================================
// GET NESTED VALUE
// ======================================================

const getPath = (
  object,
  path
) => {
  if (!object || !path) {
    return undefined;
  }

  return path
    .split(".")
    .reduce(
      (value, key) =>
        value?.[key],
      object
    );
};

// ======================================================
// FIND FIRST VALUE
// ======================================================

const firstValue = (
  object,
  paths,
  fallback = undefined
) => {
  for (const path of paths) {
    const value =
      getPath(
        object,
        path
      );

    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return fallback;
};

// ======================================================
// FIRST NUMBER
// ======================================================

const firstNumber = (
  object,
  paths
) => {
  const value =
    firstValue(
      object,
      paths,
      0
    );

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

// ======================================================
// FIND ARRAY
// ======================================================

const firstArray = (
  object,
  keys = []
) => {
  if (Array.isArray(object)) {
    return object;
  }

  if (
    !object ||
    typeof object !==
      "object"
  ) {
    return [];
  }

  for (const key of keys) {
    const value =
      getPath(
        object,
        key
      );

    if (
      Array.isArray(value)
    ) {
      return value;
    }
  }

  // Find first nested array
  for (
    const value of
    Object.values(object)
  ) {
    if (
      Array.isArray(value)
    ) {
      return value;
    }
  }

  return [];
};

// ======================================================
// STATUS STYLE
// ======================================================

const getStatusStyle = (
  status
) => {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
    case "PENDING_PAYMENT":
    case "PROCESSING":
      return "bg-amber-50 text-amber-700";

    case "REJECTED":
    case "CANCELLED":
    case "VOIDED":
      return "bg-red-50 text-red-600";

    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

// ======================================================
// PAGE
// ======================================================

const Reports = () => {
  // ====================================================
  // MAIN
  // ====================================================

  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");

  const [
    branches,
    setBranches,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // FILTERS
  // ====================================================

  const [
    branchId,
    setBranchId,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState({
    branchId: "",
    startDate: "",
    endDate: "",
  });

  // ====================================================
  // REPORT DATA
  // ====================================================

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    salesReport,
    setSalesReport,
  ] = useState(null);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    payments,
    setPayments,
  ] = useState(null);

  const [
    inventoryReport,
    setInventoryReport,
  ] = useState(null);

  const [
    cashierReport,
    setCashierReport,
  ] = useState(null);

  const [
    returnsReport,
    setReturnsReport,
  ] = useState(null);

  const [
    voidReport,
    setVoidReport,
  ] = useState(null);

  const [
    discountReport,
    setDiscountReport,
  ] = useState(null);

  // ====================================================
  // SALES FILTERS
  // ====================================================

  const [
    saleStatus,
    setSaleStatus,
  ] = useState("");

  const [
    salesPage,
    setSalesPage,
  ] = useState(1);

  const [
    salesLimit,
    setSalesLimit,
  ] = useState(20);

  // ====================================================
  // INVENTORY FILTER
  // ====================================================

  const [
    lowStockOnly,
    setLowStockOnly,
  ] = useState(false);

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

        const result =
          response.data?.data;

        const branchData =
          result?.branches ??
          response.data
            ?.branches ??
          (Array.isArray(result)
            ? result
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
  // COMMON PARAMS
  // ====================================================

  const getCommonParams =
    () => {
      const params = {};

      if (
        appliedFilters.branchId
      ) {
        params.branchId =
          appliedFilters.branchId;
      }

      if (
        appliedFilters.startDate
      ) {
        params.startDate =
          appliedFilters.startDate;
      }

      if (
        appliedFilters.endDate
      ) {
        params.endDate =
          appliedFilters.endDate;
      }

      return params;
    };

  // ====================================================
  // LOAD OVERVIEW
  // ====================================================

  const loadOverview =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          getCommonParams();

        const [
          dashboardResponse,
          productsResponse,
          paymentsResponse,
          returnsResponse,
          voidsResponse,
          discountsResponse,
        ] =
          await Promise.all([
            api.get(
              "/reports/dashboard",
              {
                params,
              }
            ),

            api.get(
              "/reports/top-products",
              {
                params: {
                  ...params,
                  limit: 5,
                },
              }
            ),

            api.get(
              "/reports/payments",
              {
                params,
              }
            ),

            api.get(
              "/reports/returns",
              {
                params,
              }
            ),

            api.get(
              "/reports/voids",
              {
                params,
              }
            ),

            api.get(
              "/reports/discounts",
              {
                params,
              }
            ),
          ]);

        setDashboard(
          dashboardResponse
            .data?.data
            ?.dashboard ??
            {}
        );

        setProducts(
          productsResponse
            .data?.data
            ?.products ??
            []
        );

        setPayments(
          paymentsResponse
            .data?.data
            ?.payments ??
            {}
        );

        setReturnsReport(
          returnsResponse
            .data?.data
            ?.report ??
            {}
        );

        setVoidReport(
          voidsResponse
            .data?.data
            ?.report ??
            {}
        );

        setDiscountReport(
          discountsResponse
            .data?.data
            ?.report ??
            {}
        );
      } catch (err) {
        console.error(
          "Overview report error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load reports."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // SALES REPORT
  // ====================================================

  const loadSalesReport =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          ...getCommonParams(),
          page: salesPage,
          limit: salesLimit,
        };

        if (saleStatus) {
          params.status =
            saleStatus;
        }

        const response =
          await api.get(
            "/reports/sales",
            {
              params,
            }
          );

        setSalesReport(
          response.data?.data
            ?.report ??
            {}
        );
      } catch (err) {
        console.error(
          "Sales report error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load sales report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // TOP PRODUCTS
  // ====================================================

  const loadProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/reports/top-products",
            {
              params: {
                ...getCommonParams(),
                limit: 20,
              },
            }
          );

        setProducts(
          response.data?.data
            ?.products ??
            []
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load product report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // PAYMENT REPORT
  // ====================================================

  const loadPayments =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/reports/payments",
            {
              params:
                getCommonParams(),
            }
          );

        setPayments(
          response.data?.data
            ?.payments ??
            {}
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load payment report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // INVENTORY REPORT
  //
  // Important:
  // Inventory controller does NOT accept dates.
  // ====================================================

  const loadInventory =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          lowStockOnly:
            String(
              lowStockOnly
            ),
        };

        if (
          appliedFilters.branchId
        ) {
          params.branchId =
            appliedFilters.branchId;
        }

        const response =
          await api.get(
            "/reports/inventory",
            {
              params,
            }
          );

        setInventoryReport(
          response.data?.data
            ?.report ??
            {}
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load inventory report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // CASHIER REPORT
  // ====================================================

  const loadCashiers =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/reports/cashiers",
            {
              params:
                getCommonParams(),
            }
          );

        setCashierReport(
          response.data?.data
            ?.cashiers ??
            []
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load cashier report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // RETURNS
  // ====================================================

  const loadReturns =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/reports/returns",
            {
              params:
                getCommonParams(),
            }
          );

        setReturnsReport(
          response.data?.data
            ?.report ??
            {}
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load returns report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // VOIDS
  // ====================================================

  const loadVoids =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/reports/voids",
            {
              params:
                getCommonParams(),
            }
          );

        setVoidReport(
          response.data?.data
            ?.report ??
            {}
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load void report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // DISCOUNTS
  // ====================================================

  const loadDiscounts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/reports/discounts",
            {
              params:
                getCommonParams(),
            }
          );

        setDiscountReport(
          response.data?.data
            ?.report ??
            {}
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Unable to load discount report."
        );
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // LOAD ACTIVE TAB
  // ====================================================

  const loadActiveTab =
    () => {
      switch (activeTab) {
        case "overview":
          return loadOverview();

        case "sales":
          return loadSalesReport();

        case "products":
          return loadProducts();

        case "payments":
          return loadPayments();

        case "inventory":
          return loadInventory();

        case "cashiers":
          return loadCashiers();

        case "returns":
          return loadReturns();

        case "voids":
          return loadVoids();

        case "discounts":
          return loadDiscounts();

        default:
          return loadOverview();
      }
    };

  // ====================================================
  // INITIAL
  // ====================================================

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadActiveTab();
  }, [
    activeTab,
    appliedFilters,
    salesPage,
    salesLimit,
    saleStatus,
    lowStockOnly,
  ]);

  // ====================================================
  // APPLY FILTERS
  // ====================================================

  const applyFilters = () => {
    if (
      startDate &&
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      setError(
        "End date cannot be earlier than start date."
      );

      return;
    }

    setError("");

    setSalesPage(1);

    setAppliedFilters({
      branchId,
      startDate,
      endDate,
    });
  };

  // ====================================================
  // RESET FILTERS
  // ====================================================

  const resetFilters = () => {
    setBranchId("");
    setStartDate("");
    setEndDate("");
    setSaleStatus("");
    setSalesPage(1);
    setLowStockOnly(false);

    setAppliedFilters({
      branchId: "",
      startDate: "",
      endDate: "",
    });
  };

  // ====================================================
  // OVERVIEW METRICS
  // ====================================================

  const totalSales =
    firstNumber(
      dashboard,
      [
        "totalSales",
        "sales.totalSales",
        "sales.total",
        "summary.totalSales",
        "salesAmount",
        "netSales",
      ]
    );

  const totalTransactions =
    firstNumber(
      dashboard,
      [
        "totalTransactions",
        "transactionCount",
        "transactions",
        "sales.count",
        "summary.totalTransactions",
        "salesCount",
      ]
    );

  const totalDiscounts =
    firstNumber(
      dashboard,
      [
        "totalDiscount",
        "totalDiscounts",
        "discountAmount",
        "summary.totalDiscounts",
        "discounts.totalAmount",
      ]
    ) ||
    firstNumber(
      discountReport,
      [
        "totalAmount",
        "discountAmount",
        "totalDiscount",
        "totalDiscounts",
      ]
    );

  const totalReturns =
    firstNumber(
      dashboard,
      [
        "totalReturns",
        "returnAmount",
        "refundAmount",
        "summary.totalReturns",
      ]
    ) ||
    firstNumber(
      returnsReport,
      [
        "totalAmount",
        "refundAmount",
        "totalRefundAmount",
        "returnAmount",
      ]
    );

  const totalVoids =
    firstNumber(
      dashboard,
      [
        "totalVoids",
        "voidAmount",
        "summary.totalVoids",
      ]
    ) ||
    firstNumber(
      voidReport,
      [
        "totalAmount",
        "voidAmount",
        "totalVoidAmount",
      ]
    );

  // ====================================================
  // TOP PRODUCTS ARRAY
  // ====================================================

  const productRows =
    useMemo(
      () =>
        firstArray(
          products,
          [
            "products",
            "items",
            "rows",
          ]
        ),
      [products]
    );

  // ====================================================
  // PAYMENT ARRAY
  // ====================================================

  const paymentRows =
    useMemo(
      () =>
        firstArray(
          payments,
          [
            "payments",
            "methods",
            "paymentMethods",
            "summary",
            "items",
            "rows",
          ]
        ),
      [payments]
    );

  // ====================================================
  // SALES ARRAY
  // ====================================================

  const salesRows =
    useMemo(
      () =>
        firstArray(
          salesReport,
          [
            "sales",
            "items",
            "rows",
            "data",
          ]
        ),
      [salesReport]
    );

  // ====================================================
  // INVENTORY ARRAY
  // ====================================================

  const inventoryRows =
    useMemo(
      () =>
        firstArray(
          inventoryReport,
          [
            "inventories",
            "inventory",
            "items",
            "rows",
            "products",
          ]
        ),
      [inventoryReport]
    );

  // ====================================================
  // CASHIER ARRAY
  // ====================================================

  const cashierRows =
    useMemo(
      () =>
        firstArray(
          cashierReport,
          [
            "cashiers",
            "items",
            "rows",
          ]
        ),
      [cashierReport]
    );

  // ====================================================
  // RETURN ARRAY
  // ====================================================

  const returnRows =
    useMemo(
      () =>
        firstArray(
          returnsReport,
          [
            "returns",
            "items",
            "rows",
          ]
        ),
      [returnsReport]
    );

  // ====================================================
  // VOID ARRAY
  // ====================================================

  const voidRows =
    useMemo(
      () =>
        firstArray(
          voidReport,
          [
            "voids",
            "voidRequests",
            "items",
            "rows",
          ]
        ),
      [voidReport]
    );

  // ====================================================
  // DISCOUNT ARRAY
  // ====================================================

  const discountRows =
    useMemo(
      () =>
        firstArray(
          discountReport,
          [
            "discounts",
            "items",
            "rows",
          ]
        ),
      [discountReport]
    );

  // ====================================================
  // SALES PAGINATION
  // ====================================================

  const salesTotal =
    firstNumber(
      salesReport,
      [
        "pagination.total",
        "total",
        "count",
      ]
    ) ||
    salesRows.length;

  const salesTotalPages =
    Math.max(
      1,
      firstNumber(
        salesReport,
        [
          "pagination.totalPages",
          "totalPages",
        ]
      ) ||
        Math.ceil(
          salesTotal /
            salesLimit
        ) ||
        1
    );

  // ====================================================
  // CSV EXPORT
  // ====================================================

  const exportCSV = (
    rows,
    fileName
  ) => {
    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      setError(
        "No data available to export."
      );

      return;
    }

    const flattenedRows =
      rows.map((row) => {
        const output = {};

        Object.entries(
          row
        ).forEach(
          ([key, value]) => {
            if (
              value === null ||
              value ===
                undefined
            ) {
              output[key] = "";
            } else if (
              typeof value ===
              "object"
            ) {
              output[key] =
                JSON.stringify(
                  value
                );
            } else {
              output[key] =
                value;
            }
          }
        );

        return output;
      });

    const headers =
      Array.from(
        new Set(
          flattenedRows.flatMap(
            (row) =>
              Object.keys(row)
          )
        )
      );

    const escapeCSV = (
      value
    ) =>
      `"${String(
        value ?? ""
      ).replaceAll(
        '"',
        '""'
      )}"`;

    const csv = [
      headers
        .map(escapeCSV)
        .join(","),

      ...flattenedRows.map(
        (row) =>
          headers
            .map((header) =>
              escapeCSV(
                row[header]
              )
            )
            .join(",")
      ),
    ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      `${fileName}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );
  };

  // ====================================================
  // CURRENT EXPORT DATA
  // ====================================================

  const handleExport =
    () => {
      switch (activeTab) {
        case "sales":
          return exportCSV(
            salesRows,
            "sales-report"
          );

        case "products":
          return exportCSV(
            productRows,
            "top-products-report"
          );

        case "payments":
          return exportCSV(
            paymentRows,
            "payments-report"
          );

        case "inventory":
          return exportCSV(
            inventoryRows,
            "inventory-report"
          );

        case "cashiers":
          return exportCSV(
            cashierRows,
            "cashier-report"
          );

        case "returns":
          return exportCSV(
            returnRows,
            "returns-report"
          );

        case "voids":
          return exportCSV(
            voidRows,
            "void-report"
          );

        case "discounts":
          return exportCSV(
            discountRows,
            "discount-report"
          );

        default:
          return exportCSV(
            productRows,
            "overview-top-products"
          );
      }
    };

  // ====================================================
  // LOADER
  // ====================================================

  const Loader = () => (
    <div className="flex min-h-80 items-center justify-center">

      <div className="text-center">

        <Loader2
          size={34}
          className="mx-auto animate-spin text-blue-600"
        />

        <p className="mt-3 text-sm text-slate-500">
          Loading report...
        </p>
      </div>
    </div>
  );

  // ====================================================
  // EMPTY
  // ====================================================

  const Empty = ({
    text,
  }) => (
    <div className="flex min-h-64 items-center justify-center">

      <div className="text-center">

        <BarChart3
          size={36}
          className="mx-auto text-slate-300"
        />

        <p className="mt-3 font-semibold text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );

  // ====================================================
  // OVERVIEW
  // ====================================================

  const renderOverview =
    () => {
      if (loading) {
        return <Loader />;
      }

      return (
        <div className="space-y-6">

          {/* ===========================================
              KPI
          ============================================ */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

            {/* SALES */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Total Sales
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatMoney(
                      totalSales
                    )}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CircleDollarSign
                    size={23}
                  />
                </div>
              </div>
            </div>

            {/* TRANSACTIONS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Transactions
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {formatNumber(
                      totalTransactions
                    )}
                  </p>
                </div>

                <ShoppingCart
                  size={23}
                  className="text-emerald-500"
                />
              </div>
            </div>

            {/* DISCOUNTS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Discounts
                  </p>

                  <p className="mt-2 text-xl font-bold text-purple-600">
                    {formatMoney(
                      totalDiscounts
                    )}
                  </p>
                </div>

                <Percent
                  size={23}
                  className="text-purple-500"
                />
              </div>
            </div>

            {/* RETURNS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Returns
                  </p>

                  <p className="mt-2 text-xl font-bold text-amber-600">
                    {formatMoney(
                      totalReturns
                    )}
                  </p>
                </div>

                <Undo2
                  size={23}
                  className="text-amber-500"
                />
              </div>
            </div>

            {/* VOIDS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Voids
                  </p>

                  <p className="mt-2 text-xl font-bold text-red-600">
                    {formatMoney(
                      totalVoids
                    )}
                  </p>
                </div>

                <XCircle
                  size={23}
                  className="text-red-500"
                />
              </div>
            </div>
          </div>

          {/* ===========================================
              TWO COLUMNS
          ============================================ */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* TOP PRODUCTS */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>

                  <h3 className="font-bold text-slate-900">
                    Top Selling Products
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Best performing
                    products
                  </p>
                </div>

                <TrendingUp
                  size={20}
                  className="text-blue-600"
                />
              </div>

              {productRows.length ===
              0 ? (
                <Empty text="No product report data" />
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[550px]">

                    <thead className="bg-slate-50">

                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                        <th className="px-5 py-3">
                          Product
                        </th>

                        <th className="px-5 py-3">
                          Qty Sold
                        </th>

                        <th className="px-5 py-3 text-right">
                          Revenue
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {productRows
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            product,
                            index
                          ) => (
                            <tr
                              key={
                                product.id ??
                                product.productId ??
                                index
                              }
                            >

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                    <Package
                                      size={17}
                                    />
                                  </div>

                                  <div>

                                    <p className="font-semibold text-slate-800">

                                      {firstValue(
                                        product,
                                        [
                                          "name",
                                          "productName",
                                          "product.name",
                                        ],
                                        "Product"
                                      )}

                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">

                                      {firstValue(
                                        product,
                                        [
                                          "sku",
                                          "product.sku",
                                        ],
                                        "—"
                                      )}

                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 font-semibold text-slate-700">

                                {formatNumber(
                                  firstNumber(
                                    product,
                                    [
                                      "quantity",
                                      "qty",
                                      "quantitySold",
                                      "totalQuantity",
                                      "soldQuantity",
                                    ]
                                  )
                                )}

                              </td>

                              <td className="px-5 py-4 text-right font-bold text-emerald-600">

                                {formatMoney(
                                  firstNumber(
                                    product,
                                    [
                                      "revenue",
                                      "totalRevenue",
                                      "salesAmount",
                                      "amount",
                                    ]
                                  )
                                )}

                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PAYMENTS */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>

                  <h3 className="font-bold text-slate-900">
                    Payment Summary
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Payment method
                    performance
                  </p>
                </div>

                <Banknote
                  size={20}
                  className="text-emerald-600"
                />
              </div>

              {paymentRows.length ===
              0 ? (
                <Empty text="No payment data" />
              ) : (
                <div className="divide-y divide-slate-100">

                  {paymentRows
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (
                        payment,
                        index
                      ) => (
                        <div
                          key={
                            payment.method ??
                            payment.id ??
                            index
                          }
                          className="flex items-center justify-between px-5 py-4"
                        >

                          <div>

                            <p className="font-semibold text-slate-800">

                              {displayText(
                                firstValue(
                                  payment,
                                  [
                                    "method",
                                    "paymentMethod",
                                    "type",
                                  ],
                                  "Payment"
                                )
                              )}

                            </p>

                            <p className="mt-1 text-xs text-slate-400">

                              {formatNumber(
                                firstNumber(
                                  payment,
                                  [
                                    "count",
                                    "transactionCount",
                                    "transactions",
                                  ]
                                )
                              )}{" "}
                              transactions

                            </p>
                          </div>

                          <p className="font-bold text-emerald-600">

                            {formatMoney(
                              firstNumber(
                                payment,
                                [
                                  "amount",
                                  "totalAmount",
                                  "total",
                                  "salesAmount",
                                ]
                              )
                            )}

                          </p>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

  // ====================================================
  // SALES
  // ====================================================

  const renderSales =
    () => {
      if (loading) {
        return <Loader />;
      }

      if (
        salesRows.length ===
        0
      ) {
        return (
          <Empty text="No sales report data" />
        );
      }

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SALES FILTER */}

          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-bold text-slate-900">
                Sales Report
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Detailed sales
                performance
              </p>
            </div>

            <select
              value={
                saleStatus
              }
              onChange={(e) => {
                setSaleStatus(
                  e.target.value
                );

                setSalesPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
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
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                  <th className="px-5 py-4">
                    Sale / Invoice
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Cashier
                  </th>

                  <th className="px-5 py-4">
                    Items
                  </th>

                  <th className="px-5 py-4">
                    Subtotal
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
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {salesRows.map(
                  (
                    sale,
                    index
                  ) => (
                    <tr
                      key={
                        sale.id ??
                        index
                      }
                    >

                      <td className="px-5 py-4">

                        <p className="font-semibold text-blue-600">

                          {firstValue(
                            sale,
                            [
                              "invoiceNumber",
                              "saleNumber",
                              "number",
                            ],
                            "—"
                          )}

                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                        {formatDateTime(
                          firstValue(
                            sale,
                            [
                              "completedAt",
                              "createdAt",
                              "date",
                            ]
                          )
                        )}

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <User
                            size={15}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-700">

                            {firstValue(
                              sale,
                              [
                                "cashier.name",
                                "cashier.employeeId",
                                "cashierName",
                                "user.name",
                              ],
                              "—"
                            )}

                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold">

                        {formatNumber(
                          firstNumber(
                            sale,
                            [
                              "_count.items",
                              "_count.saleItems",
                              "itemCount",
                              "itemsCount",
                            ]
                          ) ||
                            firstArray(
                              sale,
                              [
                                "items",
                                "saleItems",
                              ]
                            ).length
                        )}

                      </td>

                      <td className="whitespace-nowrap px-5 py-4">

                        {formatMoney(
                          firstNumber(
                            sale,
                            [
                              "subtotal",
                              "subTotal",
                            ]
                          )
                        )}

                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-red-500">

                        {formatMoney(
                          firstNumber(
                            sale,
                            [
                              "discountAmount",
                              "totalDiscount",
                            ]
                          )
                        )}

                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-600">

                        {formatMoney(
                          firstNumber(
                            sale,
                            [
                              "grandTotal",
                              "totalAmount",
                              "total",
                            ]
                          )
                        )}

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                            sale.status
                          )}`}
                        >
                          {displayText(
                            sale.status
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-slate-500">

              Page{" "}

              <strong>
                {salesPage}
              </strong>

              {" "}of{" "}

              <strong>
                {salesTotalPages}
              </strong>

              {" "}({salesTotal} sales)

            </p>

            <div className="flex items-center gap-2">

              <select
                value={
                  salesLimit
                }
                onChange={(e) => {
                  setSalesLimit(
                    Number(
                      e.target.value
                    )
                  );

                  setSalesPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                  salesPage <= 1
                }
                onClick={() =>
                  setSalesPage(
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
                {salesPage}
              </span>

              <button
                type="button"
                disabled={
                  salesPage >=
                  salesTotalPages
                }
                onClick={() =>
                  setSalesPage(
                    (current) =>
                      Math.min(
                        salesTotalPages,
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
        </div>
      );
    };

  // ====================================================
  // PRODUCTS
  // ====================================================

  const renderProducts =
    () => {
      if (loading) {
        return <Loader />;
      }

      if (
        productRows.length ===
        0
      ) {
        return (
          <Empty text="No product report data" />
        );
      }

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <h3 className="font-bold text-slate-900">
              Top Selling Products
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Product sales ranking
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px]">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                  <th className="px-5 py-4">
                    #
                  </th>

                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    SKU
                  </th>

                  <th className="px-5 py-4">
                    Quantity Sold
                  </th>

                  <th className="px-5 py-4 text-right">
                    Revenue
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {productRows.map(
                  (
                    product,
                    index
                  ) => (
                    <tr
                      key={
                        product.id ??
                        product.productId ??
                        index
                      }
                    >

                      <td className="px-5 py-4 font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                            <Package
                              size={18}
                            />
                          </div>

                          <span className="font-semibold text-slate-800">

                            {firstValue(
                              product,
                              [
                                "name",
                                "productName",
                                "product.name",
                              ],
                              "Product"
                            )}

                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">

                        {firstValue(
                          product,
                          [
                            "sku",
                            "product.sku",
                          ],
                          "—"
                        )}

                      </td>

                      <td className="px-5 py-4 font-bold text-slate-800">

                        {formatNumber(
                          firstNumber(
                            product,
                            [
                              "quantity",
                              "quantitySold",
                              "totalQuantity",
                              "soldQuantity",
                              "qty",
                            ]
                          )
                        )}

                      </td>

                      <td className="px-5 py-4 text-right font-bold text-emerald-600">

                        {formatMoney(
                          firstNumber(
                            product,
                            [
                              "revenue",
                              "totalRevenue",
                              "salesAmount",
                              "amount",
                            ]
                          )
                        )}

                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

  // ====================================================
  // PAYMENTS
  // ====================================================

  const renderPayments =
    () => {
      if (loading) {
        return <Loader />;
      }

      if (
        paymentRows.length ===
        0
      ) {
        return (
          <Empty text="No payment report data" />
        );
      }

      const totalPayment =
        paymentRows.reduce(
          (sum, item) =>
            sum +
            firstNumber(
              item,
              [
                "amount",
                "totalAmount",
                "total",
              ]
            ),
          0
        );

      return (
        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Payments
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatMoney(
                totalPayment
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {paymentRows.map(
              (
                payment,
                index
              ) => (
                <div
                  key={
                    payment.method ??
                    index
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-bold text-slate-800">

                        {displayText(
                          firstValue(
                            payment,
                            [
                              "method",
                              "paymentMethod",
                              "type",
                            ],
                            "Payment"
                          )
                        )}

                      </p>

                      <p className="mt-1 text-sm text-slate-500">

                        {formatNumber(
                          firstNumber(
                            payment,
                            [
                              "count",
                              "transactionCount",
                            ]
                          )
                        )}{" "}
                        transactions

                      </p>
                    </div>

                    <Banknote
                      size={24}
                      className="text-emerald-500"
                    />
                  </div>

                  <p className="mt-5 text-2xl font-bold text-emerald-600">

                    {formatMoney(
                      firstNumber(
                        payment,
                        [
                          "amount",
                          "totalAmount",
                          "total",
                        ]
                      )
                    )}

                  </p>
                </div>
              )
            )}
          </div>
        </div>
      );
    };

  // ====================================================
  // INVENTORY
  // ====================================================

  const renderInventory =
    () => {
      if (loading) {
        return <Loader />;
      }

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-bold text-slate-900">
                Inventory Report
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Current stock status
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">

              <input
                type="checkbox"
                checked={
                  lowStockOnly
                }
                onChange={(e) =>
                  setLowStockOnly(
                    e.target.checked
                  )
                }
                className="h-4 w-4"
              />

              Low Stock Only
            </label>
          </div>

          {inventoryRows.length ===
          0 ? (
            <Empty text="No inventory report data" />
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="px-5 py-4">
                      SKU
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Stock
                    </th>

                    <th className="px-5 py-4">
                      Reorder Level
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {inventoryRows.map(
                    (
                      item,
                      index
                    ) => {
                      const stock =
                        firstNumber(
                          item,
                          [
                            "quantity",
                            "stockQuantity",
                            "currentStock",
                            "availableQuantity",
                          ]
                        );

                      const reorder =
                        firstNumber(
                          item,
                          [
                            "reorderLevel",
                            "minimumStock",
                            "minStockLevel",
                            "product.reorderLevel",
                          ]
                        );

                      return (
                        <tr
                          key={
                            item.id ??
                            index
                          }
                        >

                          <td className="px-5 py-4 font-semibold text-slate-800">

                            {firstValue(
                              item,
                              [
                                "product.name",
                                "productName",
                                "name",
                              ],
                              "Product"
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">

                            {firstValue(
                              item,
                              [
                                "product.sku",
                                "sku",
                              ],
                              "—"
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Building2
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="text-sm">

                                {firstValue(
                                  item,
                                  [
                                    "branch.name",
                                    "branchName",
                                  ],
                                  "—"
                                )}

                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-bold">
                            {formatNumber(
                              stock
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatNumber(
                              reorder
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                                stock <= 0
                                  ? "bg-red-50 text-red-600"
                                  : reorder >
                                      0 &&
                                    stock <=
                                      reorder
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {stock <= 0
                                ? "Out of Stock"
                                : reorder >
                                    0 &&
                                  stock <=
                                    reorder
                                ? "Low Stock"
                                : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    };

  // ====================================================
  // CASHIERS
  // ====================================================

  const renderCashiers =
    () => {
      if (loading) {
        return <Loader />;
      }

      if (
        cashierRows.length ===
        0
      ) {
        return (
          <Empty text="No cashier report data" />
        );
      }

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <h3 className="font-bold text-slate-900">
              Cashier Performance
            </h3>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px]">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                  <th className="px-5 py-4">
                    Cashier
                  </th>

                  <th className="px-5 py-4">
                    Employee ID
                  </th>

                  <th className="px-5 py-4">
                    Transactions
                  </th>

                  <th className="px-5 py-4">
                    Sales
                  </th>

                  <th className="px-5 py-4">
                    Average Sale
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {cashierRows.map(
                  (
                    cashier,
                    index
                  ) => {
                    const sales =
                      firstNumber(
                        cashier,
                        [
                          "totalSales",
                          "salesAmount",
                          "revenue",
                          "amount",
                        ]
                      );

                    const count =
                      firstNumber(
                        cashier,
                        [
                          "transactions",
                          "transactionCount",
                          "salesCount",
                          "count",
                        ]
                      );

                    return (
                      <tr
                        key={
                          cashier.id ??
                          cashier.cashierId ??
                          index
                        }
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                              <User
                                size={16}
                              />
                            </div>

                            <span className="font-semibold text-slate-800">

                              {firstValue(
                                cashier,
                                [
                                  "name",
                                  "cashierName",
                                  "user.name",
                                  "cashier.name",
                                ],
                                "Cashier"
                              )}

                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">

                          {firstValue(
                            cashier,
                            [
                              "employeeId",
                              "user.employeeId",
                              "cashier.employeeId",
                            ],
                            "—"
                          )}

                        </td>

                        <td className="px-5 py-4 font-semibold">

                          {formatNumber(
                            count
                          )}

                        </td>

                        <td className="px-5 py-4 font-bold text-emerald-600">

                          {formatMoney(
                            sales
                          )}

                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-700">

                          {formatMoney(
                            count > 0
                              ? sales /
                                  count
                              : 0
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
      );
    };

  // ====================================================
  // GENERIC REQUEST REPORT
  // ====================================================

  const renderRequestReport =
    ({
      title,
      rows,
      report,
      type,
    }) => {
      if (loading) {
        return <Loader />;
      }

      const totalCount =
        firstNumber(
          report,
          [
            "total",
            "count",
            "totalCount",
            `${type}Count`,
          ]
        ) || rows.length;

      const totalAmount =
        firstNumber(
          report,
          [
            "totalAmount",
            "amount",
            `${type}Amount`,
            `total${displayText(
              type
            ).replaceAll(
              " ",
              ""
            )}Amount`,
          ]
        );

      return (
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Total {title}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatNumber(
                  totalCount
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                {formatMoney(
                  totalAmount
                )}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-5 py-4">

              <h3 className="font-bold text-slate-900">
                {title} Report
              </h3>
            </div>

            {rows.length === 0 ? (
              <Empty
                text={`No ${title.toLowerCase()} report data`}
              />
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead className="bg-slate-50">

                    <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                      <th className="px-5 py-4">
                        Reference
                      </th>

                      <th className="px-5 py-4">
                        Sale
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Amount
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {rows.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item.id ??
                            index
                          }
                        >

                          <td className="px-5 py-4 font-semibold text-blue-600">

                            {firstValue(
                              item,
                              [
                                "returnNumber",
                                "voidNumber",
                                "discountNumber",
                                "number",
                                "id",
                              ],
                              "—"
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">

                            {firstValue(
                              item,
                              [
                                "sale.invoiceNumber",
                                "sale.saleNumber",
                                "invoiceNumber",
                                "saleNumber",
                                "saleId",
                              ],
                              "—"
                            )}

                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {formatDateTime(
                              firstValue(
                                item,
                                [
                                  "createdAt",
                                  "requestedAt",
                                  "date",
                                ]
                              )
                            )}

                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800">

                            {formatMoney(
                              firstNumber(
                                item,
                                [
                                  "amount",
                                  "totalAmount",
                                  "refundAmount",
                                  "discountAmount",
                                  "sale.grandTotal",
                                ]
                              )
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                                item.status
                              )}`}
                            >
                              {displayText(
                                item.status
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    };

  // ====================================================
  // CONTENT
  // ====================================================

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();

      case "sales":
        return renderSales();

      case "products":
        return renderProducts();

      case "payments":
        return renderPayments();

      case "inventory":
        return renderInventory();

      case "cashiers":
        return renderCashiers();

      case "returns":
        return renderRequestReport({
          title: "Returns",
          rows: returnRows,
          report:
            returnsReport,
          type: "return",
        });

      case "voids":
        return renderRequestReport({
          title: "Voids",
          rows: voidRows,
          report:
            voidReport,
          type: "void",
        });

      case "discounts":
        return renderRequestReport({
          title: "Discounts",
          rows:
            discountRows,
          report:
            discountReport,
          type: "discount",
        });

      default:
        return renderOverview();
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          <XCircle
            size={19}
          />

          <span className="flex-1">
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
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

          <h1 className="text-2xl font-bold text-slate-900">
            Reports & Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Analyze sales, products,
            payments, inventory and
            operational performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            disabled={loading}
            onClick={
              loadActiveTab
            }
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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

          <button
            type="button"
            onClick={
              handleExport
            }
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >

            <Download
              size={17}
            />

            Export CSV
          </button>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_auto_auto]">

          {/* BRANCH */}

          <div>

            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Branch
            </label>

            <div className="relative">

              <Building2
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={
                  branchId
                }
                onChange={(e) =>
                  setBranchId(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
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
            </div>
          </div>

          {/* START */}

          <div>

            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Start Date
            </label>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* END */}

          <div>

            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              End Date
            </label>

            <input
              type="date"
              value={
                endDate
              }
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* APPLY */}

          <div className="flex items-end">

            <button
              type="button"
              onClick={
                applyFilters
              }
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>

          {/* RESET */}

          <div className="flex items-end">

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >

              <RotateCcw
                size={16}
              />

              Reset
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

        <div className="flex min-w-max gap-2">

          {REPORT_TABS.map(
            ({
              id,
              label,
              icon: Icon,
            }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(
                    id
                  );

                  setError("");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab ===
                  id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >

                <Icon
                  size={17}
                />

                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* =================================================
          REPORT CONTENT
      ================================================= */}

      {renderContent()}
    </div>
  );
};

export default Reports;