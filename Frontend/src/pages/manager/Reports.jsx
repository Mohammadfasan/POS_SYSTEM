import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  ShoppingCart,
  Package,
  CreditCard,
  Boxes,
  Users,
  RotateCcw,
  Ban,
  BadgePercent,
  RefreshCw,
  Loader2,
  AlertCircle,
  CalendarDays,
  Banknote,
  ReceiptText,
  TrendingUp,
  Download,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  WalletCards,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// REPORT TABS
// ======================================================

const REPORT_TABS = [
  {
    key: "overview",
    label: "Overview",
    icon: BarChart3,
  },
  {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
  },
  {
    key: "products",
    label: "Top Products",
    icon: Package,
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    key: "cashiers",
    label: "Cashiers",
    icon: Users,
  },
  {
    key: "returns",
    label: "Returns",
    icon: RotateCcw,
  },
  {
    key: "voids",
    label: "Voids",
    icon: Ban,
  },
  {
    key: "discounts",
    label: "Discounts",
    icon: BadgePercent,
  },
];

// ======================================================
// HELPERS
// ======================================================

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 3,
  }).format(number);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

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

const displayText = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// ======================================================
// SAFE DATA HELPERS
// ======================================================

const getDataObject = (response) => {
  return response?.data?.data ?? response?.data ?? {};
};

const firstNumber = (object, keys = []) => {
  for (const key of keys) {
    const value = object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
};

const firstArray = (object, keys = []) => {
  if (Array.isArray(object)) {
    return object;
  }

  for (const key of keys) {
    if (Array.isArray(object?.[key])) {
      return object[key];
    }
  }

  return [];
};

// ======================================================
// STORAGE USER
// ======================================================

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ======================================================
// CSV
// ======================================================

const escapeCsv = (value) => {
  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
};

const downloadCsv = (
  filename,
  headers,
  rows
) => {
  const content = [
    headers
      .map((header) =>
        escapeCsv(header)
      )
      .join(","),

    ...rows.map((row) =>
      row
        .map((value) =>
          escapeCsv(value)
        )
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [content],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(url);
};

// ======================================================
// COMPONENT
// ======================================================

const Reports = () => {
  // ====================================================
  // TAB
  // ====================================================

  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");

  // ====================================================
  // COMMON
  // ====================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // FILTER
  // ====================================================

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const firstDay =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0];

  const [
    startDate,
    setStartDate,
  ] = useState(firstDay);

  const [
    endDate,
    setEndDate,
  ] = useState(today);

  const [
    appliedStartDate,
    setAppliedStartDate,
  ] = useState(firstDay);

  const [
    appliedEndDate,
    setAppliedEndDate,
  ] = useState(today);

  // ====================================================
  // USER / BRANCH
  // ====================================================

  const managerUser =
    useMemo(
      () => getStoredUser(),
      []
    );

  const managerBranchId =
    managerUser?.branchId ??
    managerUser?.branch?.id ??
    null;

  const managerBranchName =
    managerUser?.branch?.name ??
    managerUser?.branchName ??
    "Assigned Branch";

  // ====================================================
  // OVERVIEW
  // ====================================================

  const [
    dashboard,
    setDashboard,
  ] = useState({});

  // ====================================================
  // SALES
  // ====================================================

  const [
    sales,
    setSales,
  ] = useState([]);

  const [
    salesSearch,
    setSalesSearch,
  ] = useState("");

  const [
    salesStatus,
    setSalesStatus,
  ] = useState("");

  const [
    salesPage,
    setSalesPage,
  ] = useState(1);

  const [
    salesLimit,
    setSalesLimit,
  ] = useState(20);

  const [
    salesTotal,
    setSalesTotal,
  ] = useState(0);

  const [
    salesTotalPages,
    setSalesTotalPages,
  ] = useState(1);

  // ====================================================
  // TOP PRODUCTS
  // ====================================================

  const [
    topProducts,
    setTopProducts,
  ] = useState([]);

  // ====================================================
  // PAYMENTS
  // ====================================================

  const [
    paymentReport,
    setPaymentReport,
  ] = useState({});

  const [
    paymentRows,
    setPaymentRows,
  ] = useState([]);

  // ====================================================
  // INVENTORY
  // ====================================================

  const [
    inventoryReport,
    setInventoryReport,
  ] = useState({});

  const [
    inventoryRows,
    setInventoryRows,
  ] = useState([]);

  const [
    lowStockOnly,
    setLowStockOnly,
  ] = useState(false);

  // ====================================================
  // CASHIERS
  // ====================================================

  const [
    cashierReport,
    setCashierReport,
  ] = useState({});

  const [
    cashierRows,
    setCashierRows,
  ] = useState([]);

  // ====================================================
  // RETURNS
  // ====================================================

  const [
    returnReport,
    setReturnReport,
  ] = useState({});

  const [
    returnRows,
    setReturnRows,
  ] = useState([]);

  // ====================================================
  // VOIDS
  // ====================================================

  const [
    voidReport,
    setVoidReport,
  ] = useState({});

  const [
    voidRows,
    setVoidRows,
  ] = useState([]);

  // ====================================================
  // DISCOUNTS
  // ====================================================

  const [
    discountReport,
    setDiscountReport,
  ] = useState({});

  const [
    discountRows,
    setDiscountRows,
  ] = useState([]);

  // ====================================================
  // COMMON PARAMS
  // ====================================================

  const buildCommonParams =
    useCallback(() => {
      const params = {};

      if (managerBranchId) {
        params.branchId =
          managerBranchId;
      }

      if (appliedStartDate) {
        params.startDate =
          appliedStartDate;
      }

      if (appliedEndDate) {
        params.endDate =
          appliedEndDate;
      }

      return params;
    }, [
      managerBranchId,
      appliedStartDate,
      appliedEndDate,
    ]);

  // ====================================================
  // DASHBOARD
  //
  // GET /reports/dashboard
  // ====================================================

  const fetchDashboard =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/dashboard",
          {
            params:
              buildCommonParams(),
          }
        );

      const data =
        getDataObject(
          response
        );

      setDashboard(data);
    }, [buildCommonParams]);

  // ====================================================
  // SALES
  //
  // GET /reports/sales
  // ====================================================

  const fetchSales =
    useCallback(async () => {
      const params = {
        ...buildCommonParams(),

        page: salesPage,
        limit: salesLimit,
      };

      if (salesStatus) {
        params.status =
          salesStatus;
      }

      const response =
        await api.get(
          "/reports/sales",
          {
            params,
          }
        );

      const data =
        getDataObject(
          response
        );

      const rows =
        firstArray(data, [
          "sales",
          "rows",
          "items",
          "records",
        ]);

      setSales(rows);

      const pagination =
        data?.pagination ??
        data?.meta ??
        {};

      const total =
        Number(
          pagination.total ??
          data.total ??
          data.count ??
          rows.length
        );

      const safeTotal =
        Number.isFinite(total)
          ? total
          : rows.length;

      const totalPages =
        Number(
          pagination.totalPages ??
          data.totalPages ??
          Math.ceil(
            safeTotal /
              salesLimit
          )
        );

      setSalesTotal(
        safeTotal
      );

      setSalesTotalPages(
        Math.max(
          1,
          Number.isFinite(
            totalPages
          )
            ? totalPages
            : 1
        )
      );
    }, [
      buildCommonParams,
      salesPage,
      salesLimit,
      salesStatus,
    ]);

  // ====================================================
  // TOP PRODUCTS
  //
  // GET /reports/top-products
  // ====================================================

  const fetchTopProducts =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/top-products",
          {
            params: {
              ...buildCommonParams(),
              limit: 20,
            },
          }
        );

      const data =
        getDataObject(
          response
        );

      setTopProducts(
        firstArray(data, [
          "products",
          "topProducts",
          "items",
          "rows",
        ])
      );
    }, [buildCommonParams]);

  // ====================================================
  // PAYMENTS
  //
  // GET /reports/payments
  // ====================================================

  const fetchPayments =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/payments",
          {
            params:
              buildCommonParams(),
          }
        );

      const data =
        getDataObject(
          response
        );

      setPaymentReport(data);

      setPaymentRows(
        firstArray(data, [
          "payments",
          "paymentMethods",
          "methods",
          "rows",
          "items",
          "summary",
        ])
      );
    }, [buildCommonParams]);

  // ====================================================
  // INVENTORY
  //
  // GET /reports/inventory
  // ====================================================

  const fetchInventory =
    useCallback(async () => {
      const params = {
        ...buildCommonParams(),
      };

      if (lowStockOnly) {
        params.lowStockOnly =
          true;
      }

      const response =
        await api.get(
          "/reports/inventory",
          {
            params,
          }
        );

      const data =
        getDataObject(
          response
        );

      setInventoryReport(
        data
      );

      setInventoryRows(
        firstArray(data, [
          "inventory",
          "inventories",
          "products",
          "rows",
          "items",
        ])
      );
    }, [
      buildCommonParams,
      lowStockOnly,
    ]);

  // ====================================================
  // CASHIER REPORT
  //
  // GET /reports/cashiers
  // ====================================================

  const fetchCashiers =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/cashiers",
          {
            params:
              buildCommonParams(),
          }
        );

      const data =
        getDataObject(
          response
        );

      setCashierReport(data);

      setCashierRows(
        firstArray(data, [
          "cashiers",
          "rows",
          "items",
          "performance",
        ])
      );
    }, [buildCommonParams]);

  // ====================================================
  // RETURN REPORT
  //
  // GET /reports/returns
  // ====================================================

  const fetchReturns =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/returns",
          {
            params:
              buildCommonParams(),
          }
        );

      const data =
        getDataObject(
          response
        );

      setReturnReport(data);

      setReturnRows(
        firstArray(data, [
          "returns",
          "rows",
          "items",
          "records",
        ])
      );
    }, [buildCommonParams]);

  // ====================================================
  // VOID REPORT
  //
  // GET /reports/voids
  // ====================================================

  const fetchVoids =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/voids",
          {
            params:
              buildCommonParams(),
          }
        );

      const data =
        getDataObject(
          response
        );

      setVoidReport(data);

      setVoidRows(
        firstArray(data, [
          "voids",
          "voidRequests",
          "rows",
          "items",
        ])
      );
    }, [buildCommonParams]);

  // ====================================================
  // DISCOUNT REPORT
  //
  // GET /reports/discounts
  // ====================================================

  const fetchDiscounts =
    useCallback(async () => {
      const response =
        await api.get(
          "/reports/discounts",
          {
            params:
              buildCommonParams(),
          }
        );

      const data =
        getDataObject(
          response
        );

      setDiscountReport(data);

      setDiscountRows(
        firstArray(data, [
          "discounts",
          "rows",
          "items",
          "requests",
        ])
      );
    }, [buildCommonParams]);

  // ====================================================
  // LOAD ACTIVE REPORT
  // ====================================================

  const loadActiveReport =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        switch (activeTab) {
          case "overview":
            await Promise.all([
              fetchDashboard(),
              fetchTopProducts(),
              fetchPayments(),
            ]);
            break;

          case "sales":
            await fetchSales();
            break;

          case "products":
            await fetchTopProducts();
            break;

          case "payments":
            await fetchPayments();
            break;

          case "inventory":
            await fetchInventory();
            break;

          case "cashiers":
            await fetchCashiers();
            break;

          case "returns":
            await fetchReturns();
            break;

          case "voids":
            await fetchVoids();
            break;

          case "discounts":
            await fetchDiscounts();
            break;

          default:
            break;
        }
      } catch (err) {
        console.error(
          "Report load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load report."
        );
      } finally {
        setLoading(false);
      }
    }, [
      activeTab,
      fetchDashboard,
      fetchSales,
      fetchTopProducts,
      fetchPayments,
      fetchInventory,
      fetchCashiers,
      fetchReturns,
      fetchVoids,
      fetchDiscounts,
    ]);

  // ====================================================
  // EFFECT
  // ====================================================

  useEffect(() => {
    loadActiveReport();
  }, [loadActiveReport]);

  // ====================================================
  // APPLY DATE
  // ====================================================

  const handleApplyDates = () => {
    if (
      startDate &&
      endDate &&
      new Date(startDate) >
        new Date(endDate)
    ) {
      setError(
        "Start date cannot be after end date."
      );

      return;
    }

    setError("");

    setSalesPage(1);

    setAppliedStartDate(
      startDate
    );

    setAppliedEndDate(
      endDate
    );
  };

  // ====================================================
  // RESET DATE
  // ====================================================

  const resetDates = () => {
    setStartDate(firstDay);
    setEndDate(today);

    setAppliedStartDate(
      firstDay
    );

    setAppliedEndDate(
      today
    );

    setSalesPage(1);
  };

  // ====================================================
  // OVERVIEW VALUES
  // ====================================================

  const totalSalesAmount =
    firstNumber(dashboard, [
      "totalSales",
      "totalSalesAmount",
      "salesAmount",
      "netSales",
      "revenue",
    ]);

  const totalTransactions =
    firstNumber(dashboard, [
      "totalTransactions",
      "transactionCount",
      "salesCount",
      "completedSales",
      "totalSalesCount",
    ]);

  const averageSale =
    firstNumber(dashboard, [
      "averageSale",
      "averageSaleValue",
      "averageOrderValue",
      "avgSale",
    ]) ||
    (totalTransactions > 0
      ? totalSalesAmount /
        totalTransactions
      : 0);

  const totalItemsSold =
    firstNumber(dashboard, [
      "totalItemsSold",
      "itemsSold",
      "totalQuantity",
      "quantitySold",
    ]);

  const totalReturns =
    firstNumber(dashboard, [
      "totalReturns",
      "returnCount",
      "returnsCount",
    ]);

  const totalVoids =
    firstNumber(dashboard, [
      "totalVoids",
      "voidCount",
      "voidsCount",
    ]);

  const totalDiscount =
    firstNumber(dashboard, [
      "totalDiscount",
      "totalDiscountAmount",
      "discountAmount",
      "discounts",
    ]);

  // ====================================================
  // SALES FILTER
  // ====================================================

  const filteredSales =
    useMemo(() => {
      const keyword =
        salesSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return sales;
      }

      return sales.filter(
        (sale) => {
          const values = [
            sale.saleNumber,
            sale.invoiceNumber,
            sale.status,
            sale.cashier?.name,
            sale.cashier?.email,
            sale.branch?.name,
          ];

          return values.some(
            (value) =>
              String(
                value ?? ""
              )
                .toLowerCase()
                .includes(
                  keyword
                )
          );
        }
      );
    }, [
      sales,
      salesSearch,
    ]);

  // ====================================================
  // EXPORT
  // ====================================================

  const handleExport = () => {
    switch (activeTab) {
      case "sales":
        downloadCsv(
          "sales-report.csv",
          [
            "Sale Number",
            "Invoice",
            "Date",
            "Status",
            "Cashier",
            "Subtotal",
            "Discount",
            "Tax",
            "Total",
          ],
          filteredSales.map(
            (sale) => [
              sale.saleNumber ??
                "",
              sale.invoiceNumber ??
                "",
              formatDateTime(
                sale.completedAt ??
                  sale.createdAt
              ),
              sale.status ?? "",
              sale.cashier?.name ??
                sale.cashierName ??
                "",
              sale.subtotal ?? 0,
              sale.discountAmount ??
                0,
              sale.taxAmount ?? 0,
              sale.grandTotal ??
                sale.totalAmount ??
                0,
            ]
          )
        );
        break;

      case "products":
        downloadCsv(
          "top-products-report.csv",
          [
            "Product",
            "SKU",
            "Quantity Sold",
            "Revenue",
          ],
          topProducts.map(
            (item) => [
              item.productName ??
                item.name ??
                item.product?.name ??
                "",
              item.sku ??
                item.product?.sku ??
                "",
              item.quantitySold ??
                item.totalQuantity ??
                item.quantity ??
                0,
              item.revenue ??
                item.totalSales ??
                item.salesAmount ??
                0,
            ]
          )
        );
        break;

      case "payments":
        downloadCsv(
          "payment-report.csv",
          [
            "Payment Method",
            "Transactions",
            "Amount",
          ],
          paymentRows.map(
            (item) => [
              item.method ??
                item.paymentMethod ??
                item.name ??
                "",
              item.count ??
                item.transactions ??
                item.transactionCount ??
                0,
              item.amount ??
                item.totalAmount ??
                item.value ??
                0,
            ]
          )
        );
        break;

      case "inventory":
        downloadCsv(
          "inventory-report.csv",
          [
            "Product",
            "SKU",
            "Quantity",
            "Reorder Level",
            "Stock Value",
          ],
          inventoryRows.map(
            (item) => [
              item.product?.name ??
                item.productName ??
                item.name ??
                "",
              item.product?.sku ??
                item.sku ??
                "",
              item.quantity ??
                item.stockQuantity ??
                0,
              item.reorderLevel ??
                item.product
                  ?.reorderLevel ??
                0,
              item.stockValue ??
                0,
            ]
          )
        );
        break;

      case "cashiers":
        downloadCsv(
          "cashier-report.csv",
          [
            "Cashier",
            "Transactions",
            "Sales",
            "Average Sale",
          ],
          cashierRows.map(
            (item) => [
              item.cashier?.name ??
                item.name ??
                item.cashierName ??
                "",
              item.transactions ??
                item.salesCount ??
                item.transactionCount ??
                0,
              item.totalSales ??
                item.salesAmount ??
                item.revenue ??
                0,
              item.averageSale ??
                item.avgSale ??
                0,
            ]
          )
        );
        break;

      case "returns":
        downloadCsv(
          "returns-report.csv",
          [
            "Return Number",
            "Sale",
            "Status",
            "Amount",
            "Date",
          ],
          returnRows.map(
            (item) => [
              item.returnNumber ??
                item.number ??
                "",
              item.sale?.saleNumber ??
                item.saleNumber ??
                "",
              item.status ?? "",
              item.refundAmount ??
                item.totalAmount ??
                item.amount ??
                0,
              formatDateTime(
                item.createdAt
              ),
            ]
          )
        );
        break;

      case "voids":
        downloadCsv(
          "void-report.csv",
          [
            "Void Number",
            "Sale",
            "Status",
            "Amount",
            "Reason",
            "Date",
          ],
          voidRows.map(
            (item) => [
              item.voidNumber ??
                item.number ??
                "",
              item.sale?.saleNumber ??
                item.saleNumber ??
                "",
              item.status ?? "",
              item.voidAmount ??
                item.amount ??
                item.totalAmount ??
                0,
              item.reason ?? "",
              formatDateTime(
                item.createdAt
              ),
            ]
          )
        );
        break;

      case "discounts":
        downloadCsv(
          "discount-report.csv",
          [
            "Sale",
            "Type",
            "Value",
            "Status",
            "Reason",
            "Date",
          ],
          discountRows.map(
            (item) => [
              item.sale?.saleNumber ??
                item.saleNumber ??
                "",
              item.discountType ??
                "",
              item.value ?? 0,
              item.status ?? "",
              item.reason ?? "",
              formatDateTime(
                item.createdAt
              ),
            ]
          )
        );
        break;

      default:
        break;
    }
  };

  // ====================================================
  // EXPORT AVAILABLE
  // ====================================================

  const canExport =
    [
      "sales",
      "products",
      "payments",
      "inventory",
      "cashiers",
      "returns",
      "voids",
      "discounts",
    ].includes(activeTab);

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reports & Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor sales,
            inventory, payments and
            operational performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canExport && (
            <button
              type="button"
              onClick={
                handleExport
              }
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              <Download
                size={17}
              />

              Export CSV
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={
              loadActiveReport
            }
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
      </div>

      {/* =================================================
          BRANCH
      ================================================= */}

      {managerBranchId && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Building2
            size={18}
            className="text-blue-600"
          />

          <div>
            <p className="text-sm font-semibold text-blue-800">
              Reporting Branch
            </p>

            <p className="mt-0.5 text-xs text-blue-600">
              Reports are filtered
              for{" "}
              {managerBranchName}.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          DATE FILTER
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {/* START */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={
                    startDate
                  }
                  max={
                    endDate ||
                    today
                  }
                  onChange={(
                    event
                  ) =>
                    setStartDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* END */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                End Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={endDate}
                  min={
                    startDate ||
                    undefined
                  }
                  max={today}
                  onChange={(
                    event
                  ) =>
                    setEndDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={
                resetDates
              }
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw
                size={16}
              />

              Reset
            </button>

            <button
              type="button"
              onClick={
                handleApplyDates
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply Date Range
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Showing report from{" "}
          <span className="font-semibold text-slate-600">
            {appliedStartDate}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-600">
            {appliedEndDate}
          </span>
        </p>
      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {REPORT_TABS.map(
            (tab) => {
              const Icon =
                tab.icon;

              const active =
                activeTab ===
                tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(
                      tab.key
                    );

                    setError("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    size={16}
                  />

                  {tab.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-center">
            <Loader2
              size={36}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading report...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activeTab ===
            "overview" && (
            <div className="space-y-6">
              {/* KPI */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ReportCard
                  title="Total Sales"
                  value={formatMoney(
                    totalSalesAmount
                  )}
                  icon={
                    CircleDollarSign
                  }
                  type="blue"
                />

                <ReportCard
                  title="Transactions"
                  value={formatNumber(
                    totalTransactions
                  )}
                  icon={
                    ReceiptText
                  }
                  type="purple"
                />

                <ReportCard
                  title="Average Sale"
                  value={formatMoney(
                    averageSale
                  )}
                  icon={
                    TrendingUp
                  }
                  type="emerald"
                />

                <ReportCard
                  title="Items Sold"
                  value={formatNumber(
                    totalItemsSold
                  )}
                  icon={Package}
                  type="amber"
                />
              </div>

              {/* SECONDARY */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SmallSummary
                  title="Returns"
                  value={formatNumber(
                    totalReturns
                  )}
                  icon={RotateCcw}
                />

                <SmallSummary
                  title="Voids"
                  value={formatNumber(
                    totalVoids
                  )}
                  icon={Ban}
                />

                <SmallSummary
                  title="Discount Value"
                  value={formatMoney(
                    totalDiscount
                  )}
                  icon={
                    BadgePercent
                  }
                />
              </div>

              {/* TOP PRODUCTS */}

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                      Top Products
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Best performing
                      products in the
                      selected period.
                    </p>
                  </div>

                  {topProducts.length ===
                  0 ? (
                    <EmptyReport
                      icon={
                        Package
                      }
                      text="No product data available"
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {topProducts
                        .slice(0, 5)
                        .map(
                          (
                            item,
                            index
                          ) => {
                            const name =
                              item.productName ??
                              item.name ??
                              item.product
                                ?.name ??
                              "Product";

                            const qty =
                              item.quantitySold ??
                              item.totalQuantity ??
                              item.quantity ??
                              0;

                            const revenue =
                              item.revenue ??
                              item.totalSales ??
                              item.salesAmount ??
                              0;

                            return (
                              <div
                                key={
                                  item.id ??
                                  item.productId ??
                                  index
                                }
                                className="flex items-center justify-between gap-4 px-5 py-4"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                                    {index +
                                      1}
                                  </span>

                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-800">
                                      {
                                        name
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {formatNumber(
                                        qty
                                      )}{" "}
                                      sold
                                    </p>
                                  </div>
                                </div>

                                <p className="whitespace-nowrap font-bold text-emerald-600">
                                  {formatMoney(
                                    revenue
                                  )}
                                </p>
                              </div>
                            );
                          }
                        )}
                    </div>
                  )}
                </div>

                {/* PAYMENTS */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                      Payment Summary
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Sales grouped by
                      payment method.
                    </p>
                  </div>

                  {paymentRows.length ===
                  0 ? (
                    <EmptyReport
                      icon={
                        CreditCard
                      }
                      text="No payment data available"
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {paymentRows
                        .slice(0, 6)
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                item.method ??
                                item.paymentMethod ??
                                index
                              }
                              className="flex items-center justify-between gap-4 px-5 py-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                  <WalletCards
                                    size={
                                      17
                                    }
                                  />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {displayText(
                                      item.method ??
                                        item.paymentMethod ??
                                        item.name
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {formatNumber(
                                      item.count ??
                                        item.transactions ??
                                        item.transactionCount ??
                                        0
                                    )}{" "}
                                    transactions
                                  </p>
                                </div>
                              </div>

                              <p className="font-bold text-blue-600">
                                {formatMoney(
                                  item.amount ??
                                    item.totalAmount ??
                                    item.value ??
                                    0
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
          )}

          {/* =================================================
              SALES REPORT
          ================================================= */}

          {activeTab ===
            "sales" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* FILTER */}

              <div className="border-b border-slate-200 p-5">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={
                        salesSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setSalesSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search sale, invoice or cashier..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={
                      salesStatus
                    }
                    onChange={(
                      event
                    ) => {
                      setSalesStatus(
                        event.target
                          .value
                      );

                      setSalesPage(
                        1
                      );
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="">
                      All Status
                    </option>

                    <option value="PENDING_PAYMENT">
                      Pending Payment
                    </option>

                    <option value="PARTIALLY_PAID">
                      Partially Paid
                    </option>

                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>

                    <option value="VOIDED">
                      Voided
                    </option>

                    <option value="PARTIALLY_REFUNDED">
                      Partially Refunded
                    </option>

                    <option value="REFUNDED">
                      Refunded
                    </option>
                  </select>
                </div>
              </div>

              {filteredSales.length ===
              0 ? (
                <EmptyReport
                  icon={
                    ShoppingCart
                  }
                  text="No sales report data found"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px]">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-5 py-4">
                          Sale
                        </th>

                        <th className="px-5 py-4">
                          Invoice
                        </th>

                        <th className="px-5 py-4">
                          Cashier
                        </th>

                        <th className="px-5 py-4">
                          Date
                        </th>

                        <th className="px-5 py-4">
                          Subtotal
                        </th>

                        <th className="px-5 py-4">
                          Discount
                        </th>

                        <th className="px-5 py-4">
                          Tax
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
                      {filteredSales.map(
                        (sale) => (
                          <tr
                            key={
                              sale.id
                            }
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold text-blue-600">
                              {sale.saleNumber ??
                                "—"}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {sale.invoiceNumber ??
                                "—"}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {sale.cashier
                                ?.name ??
                                sale.cashierName ??
                                "—"}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                              {formatDateTime(
                                sale.completedAt ??
                                  sale.createdAt
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatMoney(
                                sale.subtotal ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4 text-red-500">
                              {formatMoney(
                                sale.discountAmount ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatMoney(
                                sale.taxAmount ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4 font-bold text-emerald-600">
                              {formatMoney(
                                sale.grandTotal ??
                                  sale.totalAmount ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  sale.status
                                }
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SALES PAGINATION */}

              {salesTotal > 0 && (
                <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Page{" "}
                    <strong className="text-slate-800">
                      {salesPage}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-slate-800">
                      {
                        salesTotalPages
                      }
                    </strong>
                    {" "}·{" "}
                    {salesTotal} sales
                  </p>

                  <div className="flex items-center gap-3">
                    <select
                      value={
                        salesLimit
                      }
                      onChange={(
                        event
                      ) => {
                        setSalesLimit(
                          Number(
                            event.target
                              .value
                          )
                        );

                        setSalesPage(
                          1
                        );
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
                        salesPage <=
                        1
                      }
                      onClick={() =>
                        setSalesPage(
                          (current) =>
                            Math.max(
                              1,
                              current -
                                1
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
                              current +
                                1
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
          )}

          {/* =================================================
              TOP PRODUCTS
          ================================================= */}

          {activeTab ===
            "products" && (
            <ReportTableCard
              title="Top Selling Products"
              subtitle="Products ranked by sales performance."
            >
              {topProducts.length ===
              0 ? (
                <EmptyReport
                  icon={Package}
                  text="No product performance data"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px]">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-5 py-4">
                          Rank
                        </th>

                        <th className="px-5 py-4">
                          Product
                        </th>

                        <th className="px-5 py-4">
                          SKU
                        </th>

                        <th className="px-5 py-4">
                          Qty Sold
                        </th>

                        <th className="px-5 py-4">
                          Transactions
                        </th>

                        <th className="px-5 py-4">
                          Revenue
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {topProducts.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              item.id ??
                              item.productId ??
                              index
                            }
                          >
                            <td className="px-5 py-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                                {index +
                                  1}
                              </span>
                            </td>

                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {item.productName ??
                                item.name ??
                                item.product
                                  ?.name ??
                                "Product"}
                            </td>

                            <td className="px-5 py-4 font-mono text-sm text-slate-500">
                              {item.sku ??
                                item.product
                                  ?.sku ??
                                "—"}
                            </td>

                            <td className="px-5 py-4 font-semibold text-purple-600">
                              {formatNumber(
                                item.quantitySold ??
                                  item.totalQuantity ??
                                  item.quantity ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatNumber(
                                item.transactions ??
                                  item.salesCount ??
                                  item.transactionCount ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4 font-bold text-emerald-600">
                              {formatMoney(
                                item.revenue ??
                                  item.totalSales ??
                                  item.salesAmount ??
                                  0
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportTableCard>
          )}

          {/* =================================================
              PAYMENTS
          ================================================= */}

          {activeTab ===
            "payments" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ReportCard
                  title="Payment Value"
                  value={formatMoney(
                    firstNumber(
                      paymentReport,
                      [
                        "totalAmount",
                        "totalPayments",
                        "amount",
                      ]
                    )
                  )}
                  icon={Banknote}
                  type="blue"
                />

                <ReportCard
                  title="Transactions"
                  value={formatNumber(
                    firstNumber(
                      paymentReport,
                      [
                        "transactionCount",
                        "totalTransactions",
                        "count",
                      ]
                    )
                  )}
                  icon={
                    ReceiptText
                  }
                  type="purple"
                />

                <ReportCard
                  title="Payment Methods"
                  value={formatNumber(
                    paymentRows.length
                  )}
                  icon={
                    CreditCard
                  }
                  type="emerald"
                />
              </div>

              <ReportTableCard
                title="Payment Method Summary"
                subtitle="Transaction totals grouped by payment method."
              >
                {paymentRows.length ===
                0 ? (
                  <EmptyReport
                    icon={
                      CreditCard
                    }
                    text="No payment report data"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                          <th className="px-5 py-4">
                            Payment Method
                          </th>

                          <th className="px-5 py-4">
                            Transactions
                          </th>

                          <th className="px-5 py-4">
                            Amount
                          </th>

                          <th className="px-5 py-4">
                            Share
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {paymentRows.map(
                          (
                            item,
                            index
                          ) => {
                            const amount =
                              Number(
                                item.amount ??
                                  item.totalAmount ??
                                  item.value ??
                                  0
                              ) || 0;

                            const overall =
                              firstNumber(
                                paymentReport,
                                [
                                  "totalAmount",
                                  "totalPayments",
                                  "amount",
                                ]
                              );

                            const percentage =
                              overall > 0
                                ? (amount /
                                    overall) *
                                  100
                                : Number(
                                    item.percentage ??
                                      0
                                  );

                            return (
                              <tr
                                key={
                                  item.method ??
                                  item.paymentMethod ??
                                  index
                                }
                              >
                                <td className="px-5 py-4 font-semibold text-slate-800">
                                  {displayText(
                                    item.method ??
                                      item.paymentMethod ??
                                      item.name
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {formatNumber(
                                    item.count ??
                                      item.transactions ??
                                      item.transactionCount ??
                                      0
                                  )}
                                </td>

                                <td className="px-5 py-4 font-bold text-emerald-600">
                                  {formatMoney(
                                    amount
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {percentage.toFixed(
                                    1
                                  )}
                                  %
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportTableCard>
            </div>
          )}

          {/* =================================================
              INVENTORY
          ================================================= */}

          {activeTab ===
            "inventory" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ReportCard
                  title="Stock Value"
                  value={formatMoney(
                    firstNumber(
                      inventoryReport,
                      [
                        "totalStockValue",
                        "stockValue",
                        "inventoryValue",
                      ]
                    )
                  )}
                  icon={Banknote}
                  type="blue"
                />

                <ReportCard
                  title="Products"
                  value={formatNumber(
                    firstNumber(
                      inventoryReport,
                      [
                        "totalProducts",
                        "productCount",
                      ]
                    ) ||
                      inventoryRows.length
                  )}
                  icon={Boxes}
                  type="purple"
                />

                <ReportCard
                  title="Low Stock"
                  value={formatNumber(
                    firstNumber(
                      inventoryReport,
                      [
                        "lowStockCount",
                        "lowStock",
                      ]
                    )
                  )}
                  icon={Package}
                  type="amber"
                />
              </div>

              <ReportTableCard
                title="Inventory Report"
                subtitle="Current inventory and stock value."
                right={
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={
                        lowStockOnly
                      }
                      onChange={(
                        event
                      ) =>
                        setLowStockOnly(
                          event.target
                            .checked
                        )
                      }
                      className="h-4 w-4"
                    />

                    Low Stock Only
                  </label>
                }
              >
                {inventoryRows.length ===
                0 ? (
                  <EmptyReport
                    icon={Boxes}
                    text="No inventory report data"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px]">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                          <th className="px-5 py-4">
                            Product
                          </th>

                          <th className="px-5 py-4">
                            SKU
                          </th>

                          <th className="px-5 py-4">
                            Quantity
                          </th>

                          <th className="px-5 py-4">
                            Reorder Level
                          </th>

                          <th className="px-5 py-4">
                            Cost
                          </th>

                          <th className="px-5 py-4">
                            Stock Value
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
                            const quantity =
                              Number(
                                item.quantity ??
                                  item.stockQuantity ??
                                  0
                              ) || 0;

                            const reorder =
                              Number(
                                item.reorderLevel ??
                                  item.product
                                    ?.reorderLevel ??
                                  0
                              ) || 0;

                            const status =
                              quantity <=
                              0
                                ? "OUT_OF_STOCK"
                                : reorder >
                                      0 &&
                                  quantity <=
                                    reorder
                                ? "LOW_STOCK"
                                : "IN_STOCK";

                            return (
                              <tr
                                key={
                                  item.id ??
                                  item.productId ??
                                  index
                                }
                              >
                                <td className="px-5 py-4 font-semibold text-slate-800">
                                  {item.product
                                    ?.name ??
                                    item.productName ??
                                    item.name ??
                                    "—"}
                                </td>

                                <td className="px-5 py-4 font-mono text-sm text-slate-500">
                                  {item.product
                                    ?.sku ??
                                    item.sku ??
                                    "—"}
                                </td>

                                <td className="px-5 py-4 font-bold text-blue-600">
                                  {formatNumber(
                                    quantity
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {formatNumber(
                                    reorder
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {formatMoney(
                                    item.costPrice ??
                                      item.product
                                        ?.costPrice ??
                                      0
                                  )}
                                </td>

                                <td className="px-5 py-4 font-bold text-emerald-600">
                                  {formatMoney(
                                    item.stockValue ??
                                      quantity *
                                        Number(
                                          item.costPrice ??
                                            item
                                              .product
                                              ?.costPrice ??
                                            0
                                        )
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  <StockBadge
                                    status={
                                      status
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportTableCard>
            </div>
          )}

          {/* =================================================
              CASHIER
          ================================================= */}

          {activeTab ===
            "cashiers" && (
            <ReportTableCard
              title="Cashier Performance"
              subtitle="Sales performance by cashier."
            >
              {cashierRows.length ===
              0 ? (
                <EmptyReport
                  icon={Users}
                  text="No cashier performance data"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-5 py-4">
                          Cashier
                        </th>

                        <th className="px-5 py-4">
                          Transactions
                        </th>

                        <th className="px-5 py-4">
                          Total Sales
                        </th>

                        <th className="px-5 py-4">
                          Average Sale
                        </th>

                        <th className="px-5 py-4">
                          Items
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {cashierRows.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              item.cashierId ??
                              item.id ??
                              index
                            }
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                                  <Users
                                    size={
                                      16
                                    }
                                  />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {item.cashier
                                      ?.name ??
                                      item.name ??
                                      item.cashierName ??
                                      "—"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {item.cashier
                                      ?.email ??
                                      item.email ??
                                      ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 font-semibold text-slate-700">
                              {formatNumber(
                                item.transactions ??
                                  item.salesCount ??
                                  item.transactionCount ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4 font-bold text-emerald-600">
                              {formatMoney(
                                item.totalSales ??
                                  item.salesAmount ??
                                  item.revenue ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatMoney(
                                item.averageSale ??
                                  item.avgSale ??
                                  0
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatNumber(
                                item.itemsSold ??
                                  item.quantitySold ??
                                  0
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportTableCard>
          )}

          {/* =================================================
              RETURNS
          ================================================= */}

          {activeTab ===
            "returns" && (
            <OperationalReport
              title="Returns Report"
              icon={RotateCcw}
              report={returnReport}
              rows={returnRows}
              numberKey="returnNumber"
              amountKeys={[
                "refundAmount",
                "totalAmount",
                "amount",
              ]}
              emptyText="No return report data"
            />
          )}

          {/* =================================================
              VOIDS
          ================================================= */}

          {activeTab ===
            "voids" && (
            <OperationalReport
              title="Void Report"
              icon={Ban}
              report={voidReport}
              rows={voidRows}
              numberKey="voidNumber"
              amountKeys={[
                "voidAmount",
                "totalAmount",
                "amount",
              ]}
              emptyText="No void report data"
            />
          )}

          {/* =================================================
              DISCOUNTS
          ================================================= */}

          {activeTab ===
            "discounts" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ReportCard
                  title="Discount Requests"
                  value={formatNumber(
                    firstNumber(
                      discountReport,
                      [
                        "totalRequests",
                        "requestCount",
                        "count",
                      ]
                    ) ||
                      discountRows.length
                  )}
                  icon={
                    BadgePercent
                  }
                  type="purple"
                />

                <ReportCard
                  title="Approved"
                  value={formatNumber(
                    firstNumber(
                      discountReport,
                      [
                        "approvedCount",
                        "approved",
                      ]
                    )
                  )}
                  icon={
                    ReceiptText
                  }
                  type="emerald"
                />

                <ReportCard
                  title="Discount Value"
                  value={formatMoney(
                    firstNumber(
                      discountReport,
                      [
                        "totalDiscountAmount",
                        "discountAmount",
                        "totalValue",
                      ]
                    )
                  )}
                  icon={Banknote}
                  type="blue"
                />
              </div>

              <ReportTableCard
                title="Discount Report"
                subtitle="Discount requests and approval history."
              >
                {discountRows.length ===
                0 ? (
                  <EmptyReport
                    icon={
                      BadgePercent
                    }
                    text="No discount report data"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                          <th className="px-5 py-4">
                            Sale
                          </th>

                          <th className="px-5 py-4">
                            Type
                          </th>

                          <th className="px-5 py-4">
                            Value
                          </th>

                          <th className="px-5 py-4">
                            Reason
                          </th>

                          <th className="px-5 py-4">
                            Status
                          </th>

                          <th className="px-5 py-4">
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {discountRows.map(
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
                                {item.sale
                                  ?.saleNumber ??
                                  item.saleNumber ??
                                  item.saleId ??
                                  "—"}
                              </td>

                              <td className="px-5 py-4">
                                {displayText(
                                  item.discountType
                                )}
                              </td>

                              <td className="px-5 py-4 font-bold text-purple-600">
                                {item.discountType ===
                                "PERCENTAGE"
                                  ? `${
                                      Number(
                                        item.value
                                      ) ||
                                      0
                                    }%`
                                  : formatMoney(
                                      item.value
                                    )}
                              </td>

                              <td className="px-5 py-4">
                                <p className="max-w-60 truncate text-sm text-slate-600">
                                  {item.reason ??
                                    "—"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge
                                  status={
                                    item.status
                                  }
                                />
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                                {formatDateTime(
                                  item.createdAt
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportTableCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ======================================================
// REPORT CARD
// ======================================================

const ReportCard = ({
  title,
  value,
  icon: Icon,
  type = "blue",
}) => {
  const styles = {
    blue: {
      box: "bg-blue-50",
      icon: "text-blue-600",
      value: "text-blue-700",
    },

    purple: {
      box: "bg-purple-50",
      icon: "text-purple-600",
      value: "text-purple-700",
    },

    emerald: {
      box: "bg-emerald-50",
      icon: "text-emerald-600",
      value: "text-emerald-700",
    },

    amber: {
      box: "bg-amber-50",
      icon: "text-amber-600",
      value: "text-amber-700",
    },
  };

  const style =
    styles[type] ??
    styles.blue;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-bold ${style.value}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.box}`}
        >
          <Icon
            size={22}
            className={
              style.icon
            }
          />
        </div>
      </div>
    </div>
  );
};

// ======================================================
// SMALL SUMMARY
// ======================================================

const SmallSummary = ({
  title,
  value,
  icon: Icon,
}) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-xl font-bold text-slate-800">
          {value}
        </p>
      </div>

      <Icon
        size={22}
        className="text-slate-400"
      />
    </div>
  );
};

// ======================================================
// TABLE CARD
// ======================================================

const ReportTableCard = ({
  title,
  subtitle,
  right,
  children,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {right}
      </div>

      {children}
    </div>
  );
};

// ======================================================
// EMPTY
// ======================================================

const EmptyReport = ({
  icon: Icon,
  text,
}) => {
  return (
    <div className="flex min-h-64 items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon size={29} />
        </div>

        <p className="mt-4 font-semibold text-slate-700">
          {text}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Try changing the report
          date range.
        </p>
      </div>
    </div>
  );
};

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({
  status,
}) => {
  let style =
    "border-slate-200 bg-slate-100 text-slate-600";

  if (
    [
      "COMPLETED",
      "APPROVED",
      "ACTIVE",
      "PAID",
    ].includes(status)
  ) {
    style =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    [
      "PENDING",
      "PENDING_PAYMENT",
      "PARTIALLY_PAID",
      "PROCESSING",
    ].includes(status)
  ) {
    style =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    [
      "REJECTED",
      "VOIDED",
      "REFUNDED",
    ].includes(status)
  ) {
    style =
      "border-red-200 bg-red-50 text-red-600";
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-semibold ${style}`}
    >
      {displayText(status)}
    </span>
  );
};

// ======================================================
// STOCK BADGE
// ======================================================

const StockBadge = ({
  status,
}) => {
  let style =
    "border-emerald-200 bg-emerald-50 text-emerald-700";

  if (
    status ===
    "LOW_STOCK"
  ) {
    style =
      "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status ===
    "OUT_OF_STOCK"
  ) {
    style =
      "border-red-200 bg-red-50 text-red-600";
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold ${style}`}
    >
      {displayText(status)}
    </span>
  );
};

// ======================================================
// OPERATIONAL REPORT
//
// Used by:
// Returns
// Voids
// ======================================================

const OperationalReport = ({
  title,
  icon: Icon,
  report,
  rows,
  numberKey,
  amountKeys,
  emptyText,
}) => {
  const totalCount =
    firstNumber(report, [
      "total",
      "count",
      "totalCount",
      "requestCount",
    ]) || rows.length;

  const pending =
    firstNumber(report, [
      "pendingCount",
      "pending",
    ]);

  const completed =
    firstNumber(report, [
      "completedCount",
      "completed",
      "approvedCount",
    ]);

  const totalAmount =
    firstNumber(report, [
      "totalAmount",
      "totalValue",
      "refundAmount",
      "voidAmount",
    ]);

  const getAmount = (row) => {
    for (const key of amountKeys) {
      if (
        row?.[key] !==
          undefined &&
        row?.[key] !== null
      ) {
        return Number(
          row[key]
        ) || 0;
      }
    }

    return 0;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          title="Total"
          value={formatNumber(
            totalCount
          )}
          icon={Icon}
          type="blue"
        />

        <ReportCard
          title="Pending"
          value={formatNumber(
            pending
          )}
          icon={Icon}
          type="amber"
        />

        <ReportCard
          title="Completed"
          value={formatNumber(
            completed
          )}
          icon={Icon}
          type="emerald"
        />

        <ReportCard
          title="Total Value"
          value={formatMoney(
            totalAmount
          )}
          icon={Banknote}
          type="purple"
        />
      </div>

      <ReportTableCard
        title={title}
        subtitle="Operational activity for the selected period."
      >
        {rows.length === 0 ? (
          <EmptyReport
            icon={Icon}
            text={emptyText}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-4">
                    Number
                  </th>

                  <th className="px-5 py-4">
                    Sale
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Reason
                  </th>

                  <th className="px-5 py-4">
                    Date
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
                        {item[
                          numberKey
                        ] ??
                          item.number ??
                          "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.sale
                          ?.saleNumber ??
                          item.saleNumber ??
                          item.saleId ??
                          "—"}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-600">
                        {formatMoney(
                          getAmount(
                            item
                          )
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-64 truncate text-sm text-slate-600">
                          {item.reason ??
                            item.note ??
                            "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(
                          item.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </ReportTableCard>
    </div>
  );
};

export default Reports;