import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Search,
  Package,
  Building2,
  Loader2,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// MOVEMENT TYPES
// ======================================================

const MOVEMENT_TYPES = [
  "OPENING_STOCK",
  "PURCHASE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "SALE",
  "RETURN",
  "VOID",
  "DAMAGED",
  "EXPIRED",
  "TRANSFER_IN",
  "TRANSFER_OUT",
];

const STOCK_IN_TYPES = [
  "OPENING_STOCK",
  "PURCHASE",
  "ADJUSTMENT_IN",
  "RETURN",
  "VOID",
  "TRANSFER_IN",
];

const STOCK_OUT_TYPES = [
  "ADJUSTMENT_OUT",
  "SALE",
  "DAMAGED",
  "EXPIRED",
  "TRANSFER_OUT",
];

const StockMovements = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [movements, setMovements] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [branchFilter, setBranchFilter] =
    useState("");

  const [productFilter, setProductFilter] =
    useState("");

  const [
    movementFilter,
    setMovementFilter,
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

  // ====================================================
  // EXTRACT PRODUCTS
  // ====================================================

  const extractProducts = (
    response
  ) => {
    const data =
      response?.data?.data;

    if (Array.isArray(data)) {
      return data;
    }

    return (
      data?.products ??
      data?.items ??
      data?.rows ??
      []
    );
  };

  // ====================================================
  // LOAD BRANCHES + PRODUCTS
  // ====================================================

  const loadReferenceData =
    async () => {
      try {
        const [
          productResponse,
          branchResponse,
        ] = await Promise.all([
          api.get("/products", {
            params: {
              status: "ACTIVE",
              page: 1,
              limit: 100,
            },
          }),

          api.get("/branches"),
        ]);

        // ---------------------------
        // PRODUCTS
        // ---------------------------

        const productData =
          extractProducts(
            productResponse
          );

        setProducts(
          Array.isArray(productData)
            ? productData
            : []
        );

        // ---------------------------
        // BRANCHES
        // ---------------------------

        const branchData =
          branchResponse.data?.data
            ?.branches ??
          branchResponse.data
            ?.branches ??
          [];

        setBranches(
          Array.isArray(branchData)
            ? branchData
            : []
        );
      } catch (err) {
        console.error(
          "Reference data error:",
          err.response?.data ||
            err.message
        );
      }
    };

  // ====================================================
  // FETCH STOCK MOVEMENTS
  // ====================================================

  const fetchMovements =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (branchFilter) {
          params.branchId =
            branchFilter;
        }

        if (productFilter) {
          params.productId =
            productFilter;
        }

        if (movementFilter) {
          params.movementType =
            movementFilter;
        }

        const response =
          await api.get(
            "/stock-movements",
            {
              params,
            }
          );

        console.log(
          "Stock Movement Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        // =================================================
        // MOVEMENT ARRAY
        // =================================================

        const movementData =
          result.stockMovements ??
          result.movements ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeMovements =
          Array.isArray(movementData)
            ? movementData
            : [];

        setMovements(
          safeMovements
        );

        // =================================================
        // PAGINATION
        // FIXED VERSION
        // No ?? and || mixing
        // =================================================

        const pagination =
          result.pagination ?? {};

        const responseTotal =
          Number(
            pagination.total ??
              result.total ??
              result.count ??
              response.data?.count ??
              safeMovements.length
          );

        const calculatedPages =
          Math.ceil(
            responseTotal /
              limit
          );

        const rawTotalPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        const responsePages =
          Math.max(
            1,
            Number(
              rawTotalPages
            ) || 1
          );

        setTotal(
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeMovements.length
        );

        setTotalPages(
          responsePages
        );
      } catch (err) {
        console.error(
          "Stock movement error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load stock movements."
        );

        setMovements([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadReferenceData();
  }, []);

  // ====================================================
  // FETCH MOVEMENTS WHEN FILTER/PAGE CHANGES
  // ====================================================

  useEffect(() => {
    fetchMovements();
  }, [
    page,
    limit,
    branchFilter,
    productFilter,
    movementFilter,
  ]);

  // ====================================================
  // GET PRODUCT
  // ====================================================

  const getProduct = (
    movement
  ) => {
    if (movement?.product) {
      return movement.product;
    }

    return products.find(
      (product) =>
        product.id ===
        movement?.productId
    );
  };

  // ====================================================
  // GET BRANCH
  // ====================================================

  const getBranch = (
    movement
  ) => {
    if (movement?.branch) {
      return movement.branch;
    }

    return branches.find(
      (branch) =>
        branch.id ===
        movement?.branchId
    );
  };

  // ====================================================
  // USER NAME
  // ====================================================

  const getUserName = (
    movement
  ) => {
    const user =
      movement?.user ??
      movement?.createdBy ??
      movement?.performedBy ??
      movement?.creator;

    if (!user) {
      return "System";
    }

    if (
      typeof user === "string"
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
      user.employeeId ||
      user.email ||
      "System"
    );
  };

  // ====================================================
  // QUANTITY
  // ====================================================

  const getQuantity = (
    movement
  ) => {
    const value =
      movement?.quantity ??
      movement?.stockQuantity ??
      movement?.amount ??
      0;

    const quantity =
      Number(value);

    return Number.isFinite(
      quantity
    )
      ? quantity
      : 0;
  };

  // ====================================================
  // MOVEMENT DIRECTION
  // ====================================================

  const isStockIn = (
    type
  ) => {
    return STOCK_IN_TYPES.includes(
      type
    );
  };

  const isStockOut = (
    type
  ) => {
    return STOCK_OUT_TYPES.includes(
      type
    );
  };

  // ====================================================
  // LOCAL SEARCH
  // ====================================================

  const filteredMovements =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return movements;
      }

      return movements.filter(
        (movement) => {
          const product =
            movement?.product ||
            products.find(
              (item) =>
                item.id ===
                movement?.productId
            );

          const branch =
            movement?.branch ||
            branches.find(
              (item) =>
                item.id ===
                movement?.branchId
            );

          const movementType =
            movement
              ?.movementType ||
            "";

          const reason =
            movement?.reason ||
            "";

          const referenceId =
            movement
              ?.referenceId ||
            "";

          return (
            product?.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            product?.sku
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            product?.barcode
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            branch?.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            movementType
              .toLowerCase()
              .includes(
                keyword
              ) ||
            reason
              .toLowerCase()
              .includes(
                keyword
              ) ||
            referenceId
              .toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [
      movements,
      search,
      products,
      branches,
    ]);

  // ====================================================
  // CURRENT PAGE STATS
  // ====================================================

  const stockInCount =
    movements.filter(
      (movement) =>
        isStockIn(
          movement.movementType
        )
    ).length;

  const stockOutCount =
    movements.filter(
      (movement) =>
        isStockOut(
          movement.movementType
        )
    ).length;

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (
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
      return String(value);
    }

    try {
      return new Intl.DateTimeFormat(
        "en-LK",
        {
          dateStyle:
            "medium",
          timeStyle:
            "short",
        }
      ).format(date);
    } catch {
      return date.toLocaleString();
    }
  };

  // ====================================================
  // MOVEMENT STYLE
  // ====================================================

  const movementStyle = (
    type
  ) => {
    if (isStockIn(type)) {
      return {
        className:
          "bg-emerald-50 text-emerald-700",
        Icon:
          ArrowDownToLine,
      };
    }

    if (isStockOut(type)) {
      return {
        className:
          "bg-red-50 text-red-600",
        Icon:
          ArrowUpFromLine,
      };
    }

    return {
      className:
        "bg-slate-100 text-slate-600",
      Icon:
        ArrowLeftRight,
    };
  };

  // ====================================================
  // DISPLAY MOVEMENT TYPE
  // ====================================================

  const displayType = (
    type
  ) => {
    if (!type) {
      return "Unknown";
    }

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // ====================================================
  // GET UNIT
  // ====================================================

  const getUnitSymbol = (
    movement,
    product
  ) => {
    if (
      movement?.unit?.symbol
    ) {
      return movement.unit.symbol;
    }

    if (
      product?.baseUnit
        ?.symbol
    ) {
      return product.baseUnit
        .symbol;
    }

    if (
      product?.sellingUnit
        ?.symbol
    ) {
      return product
        .sellingUnit.symbol;
    }

    return "";
  };

  // ====================================================
  // RESET FILTERS
  // ====================================================

  const resetFilters = () => {
    setSearch("");
    setBranchFilter("");
    setProductFilter("");
    setMovementFilter("");
    setPage(1);
  };

  // ====================================================
  // HANDLE FILTERS
  // ====================================================

  const handleBranchFilter = (
    value
  ) => {
    setBranchFilter(value);
    setPage(1);
  };

  const handleProductFilter = (
    value
  ) => {
    setProductFilter(value);
    setPage(1);
  };

  const handleMovementFilter = (
    value
  ) => {
    setMovementFilter(value);
    setPage(1);
  };

  const handleLimitChange = (
    value
  ) => {
    setLimit(Number(value));
    setPage(1);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          ERROR
      ================================================== */}

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
      ================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Stock Movements
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View inventory stock-in,
          stock-out and adjustment
          history.
        </p>
      </div>

      {/* =================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total Movements
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {total}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <ClipboardList
                size={23}
              />
            </div>
          </div>
        </div>

        {/* STOCK IN */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Stock In
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {stockInCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Current page
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <ArrowDownToLine
                size={23}
              />
            </div>
          </div>
        </div>

        {/* STOCK OUT */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Stock Out
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {stockOutCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Current page
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">

              <ArrowUpFromLine
                size={23}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CARD
      ================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =================================================
            FILTER BAR
        ================================================== */}

        <div className="border-b border-slate-200 p-5">

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">

            {/* SEARCH */}

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
                placeholder="Search product, SKU, branch, reason..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* BRANCH */}

            <select
              value={
                branchFilter
              }
              onChange={(e) =>
                handleBranchFilter(
                  e.target.value
                )
              }
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

            {/* PRODUCT */}

            <select
              value={
                productFilter
              }
              onChange={(e) =>
                handleProductFilter(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                All Products
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {product.name}
                  </option>
                )
              )}
            </select>

            {/* MOVEMENT */}

            <select
              value={
                movementFilter
              }
              onChange={(e) =>
                handleMovementFilter(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                All Movements
              </option>

              {MOVEMENT_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {displayType(
                      type
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
        ================================================== */}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">

            <div className="text-center">

              <Loader2
                size={32}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading stock
                movements...
              </p>
            </div>
          </div>
        ) : filteredMovements.length ===
          0 ? (

          /* ===============================================
             EMPTY
          ================================================ */

          <div className="flex min-h-80 items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <ArrowLeftRight
                  size={30}
                />
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No stock movements
                found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Inventory Stock In and
                Stock Out operations will
                appear here.
              </p>
            </div>
          </div>
        ) : (

          /* ===============================================
             TABLE
          ================================================ */

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    Branch
                  </th>

                  <th className="px-5 py-4">
                    Movement
                  </th>

                  <th className="px-5 py-4">
                    Quantity
                  </th>

                  <th className="px-5 py-4">
                    Reason
                  </th>

                  <th className="px-5 py-4">
                    Reference
                  </th>

                  <th className="px-5 py-4">
                    Performed By
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredMovements.map(
                  (movement) => {
                    const product =
                      getProduct(
                        movement
                      );

                    const branch =
                      getBranch(
                        movement
                      );

                    const type =
                      movement
                        .movementType;

                    const {
                      className,
                      Icon,
                    } =
                      movementStyle(
                        type
                      );

                    const quantity =
                      getQuantity(
                        movement
                      );

                    const unitSymbol =
                      getUnitSymbol(
                        movement,
                        product
                      );

                    return (
                      <tr
                        key={
                          movement.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <p className="text-sm text-slate-600">

                            {formatDate(
                              movement.createdAt ??
                                movement.date
                            )}

                          </p>
                        </td>

                        {/* PRODUCT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                              <Package
                                size={18}
                              />
                            </div>

                            <div>

                              <p className="whitespace-nowrap font-semibold text-slate-800">

                                {product?.name ||
                                  "Unknown Product"}

                              </p>

                              <p className="mt-1 text-xs text-slate-400">

                                SKU:{" "}

                                {product?.sku ||
                                  "—"}

                              </p>
                            </div>
                          </div>
                        </td>

                        {/* BRANCH */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <Building2
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="whitespace-nowrap text-sm text-slate-700">

                              {branch?.name ||
                                "—"}

                            </span>
                          </div>
                        </td>

                        {/* MOVEMENT TYPE */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${className}`}
                          >

                            <Icon
                              size={14}
                            />

                            {displayType(
                              type
                            )}

                          </span>
                        </td>

                        {/* QUANTITY */}

                        <td className="px-5 py-4">

                          <span
                            className={`whitespace-nowrap font-bold ${
                              isStockIn(
                                type
                              )
                                ? "text-emerald-600"
                                : isStockOut(
                                    type
                                  )
                                ? "text-red-600"
                                : "text-slate-700"
                            }`}
                          >

                            {isStockIn(
                              type
                            )
                              ? "+"
                              : isStockOut(
                                  type
                                )
                              ? "-"
                              : ""}

                            {quantity.toLocaleString()}

                            {unitSymbol && (
                              <span className="ml-1 text-xs font-semibold text-slate-400">
                                {
                                  unitSymbol
                                }
                              </span>
                            )}
                          </span>
                        </td>

                        {/* REASON */}

                        <td className="px-5 py-4">

                          <p
                            title={
                              movement.reason ||
                              ""
                            }
                            className="max-w-52 truncate text-sm text-slate-600"
                          >

                            {movement.reason ||
                              "—"}

                          </p>
                        </td>

                        {/* REFERENCE */}

                        <td className="px-5 py-4">

                          {movement.referenceId ||
                          movement.referenceType ? (
                            <div>

                              <p className="whitespace-nowrap text-xs font-semibold text-slate-600">

                                {movement.referenceType ||
                                  "Reference"}

                              </p>

                              <p
                                title={
                                  movement.referenceId ||
                                  ""
                                }
                                className="mt-1 max-w-40 truncate text-xs text-slate-400"
                              >

                                {movement.referenceId ||
                                  "—"}

                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        {/* USER */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">

                          {getUserName(
                            movement
                          )}

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
        ================================================== */}

        {!loading && (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            {/* LEFT */}

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
                ({total} total)
              </span>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-3">

              {/* LIMIT */}

              <select
                value={limit}
                onChange={(e) =>
                  handleLimitChange(
                    e.target.value
                  )
                }
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              {/* CURRENT PAGE */}

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
  );
};

export default StockMovements;