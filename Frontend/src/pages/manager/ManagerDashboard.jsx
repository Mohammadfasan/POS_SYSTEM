import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-LK").format(Number(value) || 0);

const getValue = (object, path) => {
  if (!object || !path) return undefined;

  return path
    .split(".")
    .reduce((currentValue, key) => currentValue?.[key], object);
};

const firstValue = (object, paths, fallback = undefined) => {
  for (const path of paths) {
    const value = getValue(object, path);

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return fallback;
};

const firstNumber = (object, paths, fallback = 0) => {
  const value = firstValue(object, paths, fallback);
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const firstArray = (object, paths = []) => {
  if (Array.isArray(object)) {
    return object;
  }

  for (const path of paths) {
    const value = getValue(object, path);

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const getResponseData = (result, paths = []) => {
  if (result.status !== "fulfilled") {
    return {};
  }

  const response = result.value?.data;

  for (const path of paths) {
    const value = getValue(response, path);

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return response?.data ?? {};
};

const StatCard = ({ label, value, description, accent = "blue" }) => {
  const accentClasses = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span
        className={`absolute left-0 top-0 h-full w-1 ${
          accentClasses[accent] || accentClasses.blue
        }`}
      />

      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
};

const ApprovalCard = ({
  title,
  count,
  description,
  buttonText,
  accent = "blue",
  onClick,
}) => {
  const accentClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(count)}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            accentClasses[accent] || accentClasses.blue
          }`}
        >
          Pending
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>

      <button
        type="button"
        onClick={onClick}
        className="
          mt-5 w-full rounded-xl
          bg-slate-950 px-4 py-2.5
          text-sm font-semibold text-white
          transition
          hover:bg-slate-800
        "
      >
        {buttonText}
      </button>
    </div>
  );
};

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [paymentReport, setPaymentReport] = useState({});
  const [returnReport, setReturnReport] = useState({});
  const [voidReport, setVoidReport] = useState({});
  const [discountReport, setDiscountReport] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await Promise.allSettled([
        api.get("/reports/dashboard"),
        api.get("/reports/top-products", {
          params: { limit: 5 },
        }),
        api.get("/reports/payments"),
        api.get("/reports/returns"),
        api.get("/reports/voids"),
        api.get("/reports/discounts"),
      ]);

      const failedRequests = results.filter(
        (result) => result.status === "rejected"
      );

      const dashboardData = getResponseData(results[0], [
        "data.dashboard",
        "data",
      ]);

      const productData = getResponseData(results[1], [
        "data.products",
        "data.topProducts",
        "data.items",
        "data",
      ]);

      const paymentsData = getResponseData(results[2], [
        "data.payments",
        "data.report",
        "data",
      ]);

      const returnsData = getResponseData(results[3], [
        "data.report",
        "data.returns",
        "data",
      ]);

      const voidsData = getResponseData(results[4], [
        "data.report",
        "data.voids",
        "data",
      ]);

      const discountsData = getResponseData(results[5], [
        "data.report",
        "data.discounts",
        "data",
      ]);

      setDashboard(dashboardData || {});

      setTopProducts(
        Array.isArray(productData)
          ? productData
          : firstArray(productData, ["products", "topProducts", "items", "rows"])
      );

      setPaymentReport(paymentsData || {});
      setReturnReport(returnsData || {});
      setVoidReport(voidsData || {});
      setDiscountReport(discountsData || {});

      if (failedRequests.length === results.length) {
        setError(
          "Manager dashboard data could not be loaded. Please check the backend server."
        );
      } else if (failedRequests.length > 0) {
        setError(
          "Some dashboard information could not be loaded. Other available information is displayed."
        );
      }
    } catch (requestError) {
      console.error(
        "Manager dashboard error:",
        requestError.response?.data || requestError.message
      );

      setError(
        requestError.response?.data?.message ||
          "Unable to load the manager dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const totalSales = firstNumber(dashboard, [
    "totalSales",
    "sales.totalSales",
    "sales.totalAmount",
    "salesAmount",
    "netSales",
    "summary.totalSales",
  ]);

  const totalTransactions = firstNumber(dashboard, [
    "totalTransactions",
    "transactionCount",
    "salesCount",
    "sales.count",
    "summary.totalTransactions",
  ]);

  const averageSale =
    firstNumber(dashboard, [
      "averageSale",
      "averageTransaction",
      "averageTransactionValue",
      "sales.average",
    ]) ||
    (totalTransactions > 0 ? totalSales / totalTransactions : 0);

  const totalItemsSold = firstNumber(dashboard, [
    "itemsSold",
    "totalItemsSold",
    "quantitySold",
    "sales.itemsSold",
  ]);

  const totalReturnCount = firstNumber(returnReport, [
    "total",
    "count",
    "totalReturns",
    "returnCount",
    "summary.total",
  ]);

  const pendingReturns = firstNumber(returnReport, [
    "pending",
    "pendingCount",
    "status.PENDING",
    "summary.pending",
  ]);

  const totalVoidCount = firstNumber(voidReport, [
    "total",
    "count",
    "totalVoids",
    "voidCount",
    "summary.total",
  ]);

  const pendingVoids = firstNumber(voidReport, [
    "pending",
    "pendingCount",
    "status.PENDING",
    "summary.pending",
  ]);

  const totalDiscount = firstNumber(discountReport, [
    "totalAmount",
    "discountAmount",
    "totalDiscount",
    "totalDiscounts",
    "summary.totalAmount",
  ]);

  const pendingDiscounts = firstNumber(discountReport, [
    "pending",
    "pendingCount",
    "status.PENDING",
    "summary.pending",
  ]);

  const productRows = useMemo(
    () => firstArray(topProducts, ["products", "topProducts", "items", "rows"]),
    [topProducts]
  );

  const paymentRows = useMemo(
    () =>
      firstArray(paymentReport, [
        "payments",
        "methods",
        "paymentMethods",
        "items",
        "rows",
        "summary",
      ]),
    [paymentReport]
  );

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading manager dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-lg leading-none text-amber-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Store Overview
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Manager Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor sales, approvals and daily store operations.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => fetchDashboard(true)}
          className="
            rounded-xl border border-slate-300
            bg-white px-5 py-2.5
            text-sm font-semibold text-slate-700
            transition
            hover:border-slate-400 hover:bg-slate-50
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Sales"
          value={formatMoney(totalSales)}
          description="Total completed sales value"
          accent="blue"
        />

        <StatCard
          label="Transactions"
          value={formatNumber(totalTransactions)}
          description="Completed sale transactions"
          accent="emerald"
        />

        <StatCard
          label="Average Sale"
          value={formatMoney(averageSale)}
          description="Average transaction value"
          accent="purple"
        />

        <StatCard
          label="Items Sold"
          value={formatNumber(totalItemsSold)}
          description="Total product quantity sold"
          accent="amber"
        />
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Approval Center
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review pending manager requests.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ApprovalCard
            title="Discount Requests"
            count={pendingDiscounts}
            description="Review discount requests submitted by cashiers."
            buttonText="Review Discounts"
            accent="purple"
            onClick={() => navigate("/manager/discounts")}
          />

          <ApprovalCard
            title="Return Requests"
            count={pendingReturns}
            description="Check and process pending customer returns."
            buttonText="Review Returns"
            accent="amber"
            onClick={() => navigate("/manager/returns")}
          />

          <ApprovalCard
            title="Void Requests"
            count={pendingVoids}
            description="Review pending sale and transaction void requests."
            buttonText="Review Void Requests"
            accent="red"
            onClick={() => navigate("/manager/void-requests")}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Returns"
          value={formatNumber(totalReturnCount)}
          description="All recorded return requests"
          accent="amber"
        />

        <StatCard
          label="Total Void Requests"
          value={formatNumber(totalVoidCount)}
          description="All recorded void requests"
          accent="red"
        />

        <StatCard
          label="Discount Value"
          value={formatMoney(totalDiscount)}
          description="Total approved discount value"
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Top Selling Products
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Best performing products
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/manager/reports")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View report
            </button>
          </div>

          {productRows.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center px-5">
              <p className="text-sm text-slate-400">
                No product information available.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {productRows.slice(0, 5).map((product, index) => {
                const name = firstValue(
                  product,
                  ["name", "productName", "product.name"],
                  "Product"
                );

                const sku = firstValue(
                  product,
                  ["sku", "product.sku"],
                  "—"
                );

                const quantity = firstNumber(product, [
                  "quantity",
                  "quantitySold",
                  "soldQuantity",
                  "totalQuantity",
                  "qty",
                ]);

                const revenue = firstNumber(product, [
                  "revenue",
                  "totalRevenue",
                  "salesAmount",
                  "amount",
                ]);

                return (
                  <div
                    key={product.id || product.productId || `${name}-${index}`}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        SKU: {sku}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        {formatMoney(revenue)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatNumber(quantity)} sold
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Payment Summary</h2>

            <p className="mt-1 text-xs text-slate-500">
              Sales grouped by payment method
            </p>
          </div>

          {paymentRows.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center px-5">
              <p className="text-sm text-slate-400">
                No payment information available.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paymentRows.slice(0, 6).map((payment, index) => {
                const method = firstValue(
                  payment,
                  ["method", "paymentMethod", "type"],
                  "Payment"
                );

                const count = firstNumber(payment, [
                  "count",
                  "transactionCount",
                  "transactions",
                ]);

                const amount = firstNumber(payment, [
                  "amount",
                  "totalAmount",
                  "total",
                  "salesAmount",
                ]);

                return (
                  <div
                    key={payment.id || `${method}-${index}`}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {String(method).replaceAll("_", " ").toUpperCase()}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatNumber(count)} transactions
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-emerald-600">
                      {formatMoney(amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Quick Actions</h2>

        <p className="mt-1 text-sm text-slate-500">
          Access frequently used manager pages.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Sales", "/manager/sales"],
            ["Products", "/manager/products"],
            ["Inventory", "/manager/inventory"],
            ["Returns", "/manager/returns"],
            ["Shifts", "/manager/shifts"],
            ["Reports", "/manager/reports"],
          ].map(([label, path]) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="
                rounded-xl border border-slate-200
                bg-slate-50 px-3 py-4
                text-sm font-semibold text-slate-700
                transition
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-700
              "
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ManagerDashboard;