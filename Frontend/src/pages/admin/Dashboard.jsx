import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  Boxes,
  CalendarDays,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ======================================================
// HELPERS
// ======================================================

const getToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  "";

const authConfig = () => {
  const token = getToken();

  return {
    withCredentials: true,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  };
};

const formatMoney = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "Rs. 0.00";
  }

  return `Rs. ${number.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString("en-LK");
};

const pickValue = (object, keys, fallback = 0) => {
  for (const key of keys) {
    const parts = key.split(".");
    let current = object;

    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object"
      ) {
        current = undefined;
        break;
      }

      current = current[part];
    }

    if (current !== undefined && current !== null) {
      return current;
    }
  }

  return fallback;
};

const getArray = (object, keys) => {
  const value = pickValue(object, keys, []);

  return Array.isArray(value) ? value : [];
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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
    case "ACTIVE":
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PENDING":
    case "PENDING_PAYMENT":
    case "PARTIALLY_PAID":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "CANCELLED":
    case "VOIDED":
    case "REJECTED":
    case "REFUNDED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

// ======================================================
// SMALL COMPONENTS
// ======================================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  trend,
}) => {
  const positive = Number(trend) >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={23} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend !== undefined && trend !== null ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              positive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {positive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}

            {Math.abs(Number(trend) || 0)}%
          </span>
        ) : null}

        <span className="text-xs text-slate-400">
          {subtitle}
        </span>
      </div>
    </div>
  );
};

// ======================================================
// PAGE
// ======================================================

const Dashboard = () => {
  const [dashboard, setDashboard] = useState({});
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);

  const [filters, setFilters] = useState({
    branchId: "",
    startDate: firstDayOfMonth,
    endDate: today,
  });

  // ====================================================
  // BRANCHES
  // ====================================================

  const loadBranches = useCallback(async () => {
    try {
      setBranchLoading(true);

      const response = await axios.get(
        `${API_URL}/branches`,
        authConfig()
      );

      const data =
        response.data?.data?.branches ||
        response.data?.data ||
        [];

      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Branch load error:", err);
      setBranches([]);
    } finally {
      setBranchLoading(false);
    }
  }, []);

  // ====================================================
  // DASHBOARD
  // ====================================================

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (filters.branchId) {
        params.branchId = filters.branchId;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await axios.get(
        `${API_URL}/reports/dashboard`,
        {
          ...authConfig(),
          params,
        }
      );

      const data =
        response.data?.data?.dashboard || {};

      setDashboard(data);
    } catch (err) {
      console.error(
        "Dashboard load error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load dashboard data."
      );

      setDashboard({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ====================================================
  // VALUES
  // ====================================================

  const stats = useMemo(() => {
    const totalSales = pickValue(dashboard, [
      "totalSales",
      "sales.total",
      "summary.totalSales",
      "salesSummary.totalSales",
      "totals.sales",
    ]);

    const totalTransactions = pickValue(dashboard, [
      "totalTransactions",
      "transactions",
      "sales.count",
      "summary.totalTransactions",
      "salesSummary.totalTransactions",
      "totals.transactions",
    ]);

    const averageOrderValue = pickValue(dashboard, [
      "averageOrderValue",
      "avgOrderValue",
      "summary.averageOrderValue",
      "sales.averageOrderValue",
    ]);

    const totalDiscount = pickValue(dashboard, [
      "totalDiscount",
      "totalDiscounts",
      "discountAmount",
      "summary.totalDiscount",
    ]);

    const totalReturns = pickValue(dashboard, [
      "totalReturns",
      "returnAmount",
      "returns.total",
      "summary.totalReturns",
    ]);

    const totalVoids = pickValue(dashboard, [
      "totalVoids",
      "voidAmount",
      "voids.total",
      "summary.totalVoids",
    ]);

    const lowStock = pickValue(dashboard, [
      "lowStockCount",
      "inventory.lowStock",
      "inventory.lowStockCount",
      "summary.lowStockCount",
    ]);

    const totalProducts = pickValue(dashboard, [
      "totalProducts",
      "products.total",
      "inventory.totalProducts",
      "summary.totalProducts",
    ]);

    return {
      totalSales,
      totalTransactions,
      averageOrderValue,
      totalDiscount,
      totalReturns,
      totalVoids,
      lowStock,
      totalProducts,
    };
  }, [dashboard]);

  const recentSales = useMemo(
    () =>
      getArray(dashboard, [
        "recentSales",
        "recentTransactions",
        "sales.recent",
        "transactions.recent",
      ]),
    [dashboard]
  );

  const topProducts = useMemo(
    () =>
      getArray(dashboard, [
        "topProducts",
        "topSellingProducts",
        "products.top",
      ]),
    [dashboard]
  );

  const paymentSummary = useMemo(
    () =>
      getArray(dashboard, [
        "paymentSummary",
        "payments",
        "paymentMethods",
      ]),
    [dashboard]
  );

  // ====================================================
  // FILTER HANDLERS
  // ====================================================

  const handleFilter = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      branchId: "",
      startDate: firstDayOfMonth,
      endDate: today,
    });
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading && !Object.keys(dashboard).length) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={35}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            SmartPOS admin overview and business performance
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Branch
            </label>

            <select
              name="branchId"
              value={filters.branchId}
              onChange={handleFilter}
              disabled={branchLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                All Branches
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name ||
                    branch.code ||
                    "Unnamed Branch"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start Date
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-3 text-slate-400"
              />

              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilter}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              End Date
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-3 text-slate-400"
              />

              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilter}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div>
            <p className="font-semibold text-red-700">
              Dashboard Error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          MAIN STAT CARDS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatMoney(stats.totalSales)}
          subtitle="Selected period"
          icon={DollarSign}
          iconClass="bg-blue-50 text-blue-600"
          trend={pickValue(dashboard, [
            "salesGrowth",
            "growth.sales",
          ], null)}
        />

        <StatCard
          title="Transactions"
          value={formatNumber(stats.totalTransactions)}
          subtitle="Completed sales"
          icon={ShoppingCart}
          iconClass="bg-emerald-50 text-emerald-600"
          trend={pickValue(dashboard, [
            "transactionGrowth",
            "growth.transactions",
          ], null)}
        />

        <StatCard
          title="Average Order"
          value={formatMoney(stats.averageOrderValue)}
          subtitle="Average bill value"
          icon={TrendingUp}
          iconClass="bg-violet-50 text-violet-600"
        />

        <StatCard
          title="Total Products"
          value={formatNumber(stats.totalProducts)}
          subtitle="Inventory products"
          icon={Package}
          iconClass="bg-orange-50 text-orange-600"
        />
      </div>

      {/* =================================================
          SECOND STAT ROW
      ================================================= */}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Discounts"
          value={formatMoney(stats.totalDiscount)}
          subtitle="Approved discounts"
          icon={BadgeDollarSign}
          iconClass="bg-cyan-50 text-cyan-600"
        />

        <StatCard
          title="Returns"
          value={formatMoney(stats.totalReturns)}
          subtitle="Return value"
          icon={RotateCcw}
          iconClass="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Voids"
          value={formatMoney(stats.totalVoids)}
          subtitle="Voided sales"
          icon={AlertTriangle}
          iconClass="bg-red-50 text-red-600"
        />

        <StatCard
          title="Low Stock"
          value={formatNumber(stats.lowStock)}
          subtitle="Needs attention"
          icon={Boxes}
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* =================================================
          MIDDLE
      ================================================= */}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* TOP PRODUCTS */}

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Top Selling Products
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Best performing products
              </p>
            </div>

            <Package
              size={20}
              className="text-blue-600"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Product
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Revenue
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {topProducts.length > 0 ? (
                  topProducts.slice(0, 6).map((item, index) => (
                    <tr
                      key={
                        item.productId ||
                        item.id ||
                        index
                      }
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                            {index + 1}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {item.productName ||
                                item.name ||
                                item.product?.name ||
                                "Product"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {item.sku ||
                                item.product?.sku ||
                                "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700">
                        {formatNumber(
                          item.quantitySold ??
                            item.quantity ??
                            item.qty ??
                            item.totalQuantity ??
                            0
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                        {formatMoney(
                          item.revenue ??
                            item.totalSales ??
                            item.amount ??
                            0
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-5 py-12 text-center text-sm text-slate-400"
                    >
                      No top product data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT SUMMARY */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Payment Summary
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Payment method breakdown
            </p>
          </div>

          <div className="space-y-4 p-5">
            {paymentSummary.length > 0 ? (
              paymentSummary.map((payment, index) => {
                const method =
                  payment.method ||
                  payment.paymentMethod ||
                  payment.name ||
                  "OTHER";

                return (
                  <div
                    key={`${method}-${index}`}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                          {method === "CASH" ? (
                            <DollarSign size={19} />
                          ) : method === "CARD" ? (
                            <CreditCard size={19} />
                          ) : (
                            <ShoppingCart size={19} />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {method}
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatNumber(
                              payment.count ??
                                payment.transactions ??
                                0
                            )}{" "}
                            transactions
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {formatMoney(
                          payment.amount ??
                            payment.total ??
                            0
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <CreditCard
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm text-slate-400">
                  No payment summary available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          RECENT SALES
      ================================================= */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest POS sales
            </p>
          </div>

          <ShoppingCart
            size={20}
            className="text-blue-600"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Sale / Invoice
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Cashier
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Date
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Items
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Total
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentSales.length > 0 ? (
                recentSales.slice(0, 8).map((sale, index) => (
                  <tr
                    key={sale.id || index}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-blue-600">
                        {sale.invoiceNumber ||
                          sale.saleNumber ||
                          "-"}
                      </p>

                      {sale.invoiceNumber &&
                      sale.saleNumber ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {sale.saleNumber}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {sale.cashier?.name ||
                        sale.cashierName ||
                        sale.cashier?.employeeId ||
                        "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDateTime(
                        sale.completedAt ||
                          sale.createdAt
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                      {formatNumber(
                        sale.itemCount ??
                          sale.items?.length ??
                          0
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                      {formatMoney(
                        sale.grandTotal ??
                          sale.totalAmount ??
                          sale.total ??
                          0
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                          sale.status
                        )}`}
                      >
                        {sale.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No recent transactions available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          QUICK OVERVIEW
      ================================================= */}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Cashier Performance
              </p>

              <p className="mt-1 text-xs text-blue-600">
                Check detailed cashier reports from Reports
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" />

            <div>
              <p className="text-sm font-semibold text-amber-900">
                {formatNumber(stats.lowStock)} Low Stock Items
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Inventory needs attention
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
          <div className="flex items-center gap-3">
            <Bell className="text-purple-600" />

            <div>
              <p className="text-sm font-semibold text-purple-900">
                Admin Notifications
              </p>

              <p className="mt-1 text-xs text-purple-700">
                Review approvals and system alerts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;