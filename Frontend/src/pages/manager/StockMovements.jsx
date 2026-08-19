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
  RefreshCw,
  Eye,
  X,
  Hash,
  User,
  CalendarDays,
  FileText,
  Boxes,
  TrendingUp,
  TrendingDown,
  Database,
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

// ======================================================
// HELPERS
// ======================================================

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
    return String(value);
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

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-LK",
    {
      maximumFractionDigits: 3,
    }
  ).format(number);
};

// ======================================================
// PAGE
// ======================================================

const StockMovements = () => {
  // ====================================================
  // MAIN DATA
  // ====================================================

  const [
    movements,
    setMovements,
  ] = useState([]);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    inventories,
    setInventories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    referenceLoading,
    setReferenceLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // FILTER
  // ====================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("");

  const [
    productFilter,
    setProductFilter,
  ] = useState("");

  const [
    movementFilter,
    setMovementFilter,
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
    selectedMovement,
    setSelectedMovement,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  // ====================================================
  // EXTRACT ARRAY
  // ====================================================

  const extractArray = (
    response,
    possibleKeys = []
  ) => {
    const result =
      response?.data?.data;

    if (Array.isArray(result)) {
      return result;
    }

    for (const key of possibleKeys) {
      if (
        Array.isArray(
          result?.[key]
        )
      ) {
        return result[key];
      }
    }

    return [];
  };

  // ====================================================
  // LOAD PRODUCTS + INVENTORY
  //
  // Important:
  // Manager does not need /branches here.
  // Branches are resolved from inventory relations.
  // ====================================================

  const loadReferenceData =
    async () => {
      try {
        setReferenceLoading(
          true
        );

        const [
          productResult,
          inventoryResult,
        ] =
          await Promise.allSettled([
            api.get(
              "/products",
              {
                params: {
                  page: 1,
                  limit: 100,
                },
              }
            ),

            api.get(
              "/inventory"
            ),
          ]);

        // ===============================================
        // PRODUCTS
        // ===============================================

        if (
          productResult.status ===
          "fulfilled"
        ) {
          const data =
            extractArray(
              productResult.value,
              [
                "products",
                "items",
                "rows",
              ]
            );

          setProducts(data);
        } else {
          console.error(
            "Product reference error:",
            productResult.reason
              ?.response?.data ||
              productResult.reason
                ?.message
          );

          setProducts([]);
        }

        // ===============================================
        // INVENTORY
        // ===============================================

        if (
          inventoryResult.status ===
          "fulfilled"
        ) {
          const data =
            extractArray(
              inventoryResult.value,
              [
                "inventories",
                "inventory",
                "items",
                "rows",
              ]
            );

          setInventories(data);
        } else {
          console.error(
            "Inventory reference error:",
            inventoryResult.reason
              ?.response?.data ||
              inventoryResult.reason
                ?.message
          );

          setInventories([]);
        }
      } finally {
        setReferenceLoading(
          false
        );
      }
    };

  // ====================================================
  // FETCH MOVEMENTS
  //
  // GET /stock-movements
  //
  // Exact backend filters:
  // branchId
  // productId
  // movementType
  // page
  // limit
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
          "Manager Stock Movements:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        // ===============================================
        // MOVEMENT ARRAY
        // ===============================================

        const data =
          result.stockMovements ??
          result.movements ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeMovements =
          Array.isArray(data)
            ? data
            : [];

        setMovements(
          safeMovements
        );

        // ===============================================
        // PAGINATION
        // Avoid ?? and || mixed expression.
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
              safeMovements.length
          );

        const safeTotal =
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeMovements.length;

        const calculatedPages =
          Math.ceil(
            safeTotal /
              limit
          );

        const rawTotalPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        const safeTotalPages =
          Math.max(
            1,
            Number(
              rawTotalPages
            ) || 1
          );

        setTotal(
          safeTotal
        );

        setTotalPages(
          safeTotalPages
        );
      } catch (err) {
        console.error(
          "Stock movement load error:",
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
  // INITIAL
  // ====================================================

  useEffect(() => {
    loadReferenceData();
  }, []);

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
  // INVENTORY RESOLVER
  //
  // Fix for:
  // movement.inventory
  // movement.inventoryId
  // ====================================================

  const getMovementInventory = (
    movement
  ) => {
    if (
      movement?.inventory
    ) {
      return movement.inventory;
    }

    if (
      movement?.inventoryId
    ) {
      return inventories.find(
        (inventory) =>
          inventory.id ===
          movement.inventoryId
      );
    }

    return null;
  };

  // ====================================================
  // PRODUCT RESOLVER
  //
  // Supports:
  // movement.product
  // movement.inventory.product
  // movement.productId
  // inventory.productId
  // ====================================================

  const getProduct = (
    movement
  ) => {
    // Direct relation
    if (
      movement?.product
    ) {
      return movement.product;
    }

    // Inventory relation
    const inventory =
      getMovementInventory(
        movement
      );

    if (
      inventory?.product
    ) {
      return inventory.product;
    }

    // Direct product ID
    if (
      movement?.productId
    ) {
      const found =
        products.find(
          (product) =>
            product.id ===
            movement.productId
        );

      if (found) {
        return found;
      }
    }

    // Inventory product ID
    if (
      inventory?.productId
    ) {
      const found =
        products.find(
          (product) =>
            product.id ===
            inventory.productId
        );

      if (found) {
        return found;
      }
    }

    return null;
  };

  // ====================================================
  // PRODUCT ID
  // ====================================================

  const getProductId = (
    movement
  ) => {
    return (
      movement?.productId ??
      getMovementInventory(
        movement
      )?.productId ??
      getProduct(movement)?.id ??
      null
    );
  };

  // ====================================================
  // BRANCH RESOLVER
  //
  // Supports:
  // movement.branch
  // movement.inventory.branch
  // movement.branchId
  // inventory.branchId
  // ====================================================

  const getBranch = (
    movement
  ) => {
    if (
      movement?.branch
    ) {
      return movement.branch;
    }

    const inventory =
      getMovementInventory(
        movement
      );

    if (
      inventory?.branch
    ) {
      return inventory.branch;
    }

    const branchId =
      movement?.branchId ??
      inventory?.branchId;

    if (!branchId) {
      return null;
    }

    // Search another inventory containing branch relation
    const inventoryWithBranch =
      inventories.find(
        (item) =>
          (
            item.branchId ===
              branchId ||
            item.branch?.id ===
              branchId
          ) &&
          item.branch
      );

    return (
      inventoryWithBranch
        ?.branch ??
      {
        id: branchId,
        name: branchId,
      }
    );
  };

  // ====================================================
  // BRANCH ID
  // ====================================================

  const getBranchId = (
    movement
  ) => {
    return (
      movement?.branchId ??
      getMovementInventory(
        movement
      )?.branchId ??
      getBranch(movement)?.id ??
      null
    );
  };

  // ====================================================
  // PERFORMED BY
  // ====================================================

  const getUser = (
    movement
  ) => {
    return (
      movement?.user ??
      movement?.createdBy ??
      movement?.performedBy ??
      movement?.creator ??
      movement?.actor ??
      null
    );
  };

  const getUserName = (
    movement
  ) => {
    const user =
      getUser(movement);

    if (!user) {
      return (
        movement?.performedByName ??
        movement?.createdByName ??
        "System"
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
      "System"
    );
  };

  // ====================================================
  // USER ROLE
  // ====================================================

  const getUserRole = (
    movement
  ) => {
    const user =
      getUser(movement);

    return (
      user?.role ??
      movement?.performedByRole ??
      "—"
    );
  };

  // ====================================================
  // QUANTITY
  //
  // IMPORTANT:
  // Some backend movement rows can already contain -2.
  // Display absolute value and add sign from movement type.
  // This prevents "--2".
  // ====================================================

  const getRawQuantity = (
    movement
  ) => {
    const value =
      movement?.quantity ??
      movement?.stockQuantity ??
      movement?.amount ??
      0;

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : 0;
  };

  const getDisplayQuantity = (
    movement
  ) => {
    return Math.abs(
      getRawQuantity(
        movement
      )
    );
  };

  // ====================================================
  // BALANCE BEFORE
  // ====================================================

  const getBeforeQuantity = (
    movement
  ) => {
    const value =
      movement?.beforeQuantity ??
      movement?.quantityBefore ??
      movement?.previousQuantity ??
      movement?.stockBefore;

    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : null;
  };

  // ====================================================
  // BALANCE AFTER
  // ====================================================

  const getAfterQuantity = (
    movement
  ) => {
    const value =
      movement?.afterQuantity ??
      movement?.quantityAfter ??
      movement?.newQuantity ??
      movement?.stockAfter ??
      movement?.balanceAfter;

    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : null;
  };

  // ====================================================
  // UNIT
  // ====================================================

  const getUnit = (
    movement
  ) => {
    const product =
      getProduct(movement);

    const inventory =
      getMovementInventory(
        movement
      );

    const unit =
      movement?.unit ??
      inventory?.unit ??
      product?.baseUnit ??
      product?.sellingUnit;

    return (
      unit?.symbol ??
      unit?.code ??
      unit?.name ??
      ""
    );
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
  // MOVEMENT STYLE
  // ====================================================

  const movementStyle = (
    type
  ) => {
    if (isStockIn(type)) {
      return {
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",

        icon:
          "bg-emerald-50 text-emerald-600",

        Icon:
          ArrowDownToLine,
      };
    }

    if (isStockOut(type)) {
      return {
        badge:
          "border-red-200 bg-red-50 text-red-700",

        icon:
          "bg-red-50 text-red-600",

        Icon:
          ArrowUpFromLine,
      };
    }

    return {
      badge:
        "border-slate-200 bg-slate-100 text-slate-600",

      icon:
        "bg-slate-100 text-slate-500",

      Icon:
        ArrowLeftRight,
    };
  };

  // ====================================================
  // UNIQUE BRANCH OPTIONS
  //
  // Manager branch route may be Admin-only.
  // Build branches from inventory + movement relations.
  // ====================================================

  const branchOptions =
    useMemo(() => {
      const map =
        new Map();

      // Inventory branches
      inventories.forEach(
        (inventory) => {
          const branch =
            inventory?.branch;

          const id =
            inventory?.branchId ??
            branch?.id;

          if (!id) {
            return;
          }

          map.set(id, {
            id,
            name:
              branch?.name ??
              branch?.code ??
              id,
          });
        }
      );

      // Current movement branches
      movements.forEach(
        (movement) => {
          const branch =
            getBranch(
              movement
            );

          const id =
            getBranchId(
              movement
            );

          if (!id) {
            return;
          }

          map.set(id, {
            id,
            name:
              branch?.name ??
              branch?.code ??
              id,
          });
        }
      );

      return Array.from(
        map.values()
      ).sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name)
        )
      );
    }, [
      inventories,
      movements,
    ]);

  // ====================================================
  // PRODUCT OPTIONS
  //
  // Products + inventory embedded products
  // ====================================================

  const productOptions =
    useMemo(() => {
      const map =
        new Map();

      products.forEach(
        (product) => {
          if (product?.id) {
            map.set(
              product.id,
              product
            );
          }
        }
      );

      inventories.forEach(
        (inventory) => {
          const product =
            inventory?.product;

          if (product?.id) {
            map.set(
              product.id,
              product
            );
          }
        }
      );

      movements.forEach(
        (movement) => {
          const product =
            getProduct(
              movement
            );

          if (product?.id) {
            map.set(
              product.id,
              product
            );
          }
        }
      );

      return Array.from(
        map.values()
      ).sort((a, b) =>
        String(
          a.name ?? ""
        ).localeCompare(
          String(
            b.name ?? ""
          )
        )
      );
    }, [
      products,
      inventories,
      movements,
    ]);

  // ====================================================
  // LOCAL SEARCH
  //
  // Backend has no search query.
  // Search current API page locally.
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
            getProduct(
              movement
            );

          const branch =
            getBranch(
              movement
            );

          const values = [
            product?.name,
            product?.sku,
            product?.barcode,
            branch?.name,
            branch?.code,
            movement?.movementType,
            movement?.reason,
            movement?.referenceType,
            movement?.referenceId,
            getUserName(
              movement
            ),
            movement?.id,
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
      movements,
      search,
      products,
      inventories,
    ]);

  // ====================================================
  // CURRENT PAGE STATISTICS
  // ====================================================

  const stockInMovements =
    movements.filter(
      (movement) =>
        isStockIn(
          movement.movementType
        )
    );

  const stockOutMovements =
    movements.filter(
      (movement) =>
        isStockOut(
          movement.movementType
        )
    );

  const stockInCount =
    stockInMovements.length;

  const stockOutCount =
    stockOutMovements.length;

  const stockInQuantity =
    stockInMovements.reduce(
      (sum, movement) =>
        sum +
        getDisplayQuantity(
          movement
        ),
      0
    );

  const stockOutQuantity =
    stockOutMovements.reduce(
      (sum, movement) =>
        sum +
        getDisplayQuantity(
          movement
        ),
      0
    );

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters =
    () => {
      setSearch("");
      setBranchFilter("");
      setProductFilter("");
      setMovementFilter("");
      setPage(1);
    };

  // ====================================================
  // OPEN DETAILS
  //
  // No stock-movement detail endpoint exists.
  // Uses current row data.
  // ====================================================

  const openDetails = (
    movement
  ) => {
    setSelectedMovement(
      movement
    );

    setDetailsOpen(true);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Stock Movements
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track all inventory
              stock-in, stock-out and
              adjustment history.
            </p>
          </div>

          <button
            type="button"
            disabled={
              loading ||
              referenceLoading
            }
            onClick={async () => {
              await Promise.all([
                fetchMovements(),
                loadReferenceData(),
              ]);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                loading ||
                referenceLoading
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <ClipboardList
                  size={21}
                />
              </div>
            </div>
          </div>

          {/* STOCK IN COUNT */}

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

              <ArrowDownToLine
                size={23}
                className="text-emerald-500"
              />
            </div>
          </div>

          {/* STOCK OUT COUNT */}

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

              <ArrowUpFromLine
                size={23}
                className="text-red-500"
              />
            </div>
          </div>

          {/* TOTAL QUANTITY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Movement Qty
                </p>

                <div className="mt-2 flex items-center gap-4">

                  <span className="font-bold text-emerald-600">
                    +{formatNumber(
                      stockInQuantity
                    )}
                  </span>

                  <span className="font-bold text-red-600">
                    -{formatNumber(
                      stockOutQuantity
                    )}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <ArrowLeftRight
                size={23}
                className="text-purple-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTERS
          ================================================= */}

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
                  placeholder="Search product, SKU, branch, reason, reference..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

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

                {branchOptions.map(
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
                onChange={(e) => {
                  setProductFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >

                <option value="">
                  All Products
                </option>

                {productOptions.map(
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
                onChange={(e) => {
                  setMovementFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
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
                      {displayText(
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

            {/* LOCAL SEARCH NOTE */}

            {search && (
              <p className="mt-3 text-xs text-slate-400">
                Search filters the
                currently loaded API
                page. Branch, Product
                and Movement Type
                filters are handled by
                the backend.
              </p>
            )}
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={34}
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
            /* =================================================
                EMPTY
            ================================================= */

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
                  Stock operations will
                  appear here.
                </p>
              </div>
            </div>
          ) : (
            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px]">

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
                      Stock After
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

                    <th className="px-5 py-4 text-right">
                      Action
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
                          ?.movementType;

                      const {
                        badge,
                        Icon,
                      } =
                        movementStyle(
                          type
                        );

                      const quantity =
                        getDisplayQuantity(
                          movement
                        );

                      const afterQuantity =
                        getAfterQuantity(
                          movement
                        );

                      const unit =
                        getUnit(
                          movement
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

                            <div className="flex items-center gap-2">

                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="text-sm text-slate-600">

                                {formatDateTime(
                                  movement.createdAt ??
                                    movement.date ??
                                    movement.timestamp
                                )}

                              </span>
                            </div>
                          </td>

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                <Package
                                  size={18}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="max-w-52 truncate font-semibold text-slate-800">

                                  {product?.name ??
                                    "Unknown Product"}

                                </p>

                                <p className="mt-1 max-w-52 truncate text-xs text-slate-400">

                                  SKU:{" "}

                                  {product?.sku ??
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

                              <span className="max-w-44 truncate text-sm text-slate-700">

                                {branch?.name ??
                                  branch?.code ??
                                  "—"}

                              </span>
                            </div>
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-semibold ${badge}`}
                            >

                              <Icon
                                size={14}
                              />

                              {displayText(
                                type
                              )}

                            </span>
                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4">

                            <span
                              className={`whitespace-nowrap text-base font-bold ${
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

                              {formatNumber(
                                quantity
                              )}

                              {unit && (
                                <span className="ml-1 text-xs font-semibold text-slate-400">
                                  {unit}
                                </span>
                              )}
                            </span>
                          </td>

                          {/* AFTER */}

                          <td className="px-5 py-4">

                            {afterQuantity !==
                            null ? (
                              <span className="font-semibold text-slate-700">

                                {formatNumber(
                                  afterQuantity
                                )}

                                {unit && (
                                  <span className="ml-1 text-xs text-slate-400">
                                    {unit}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* REASON */}

                          <td className="px-5 py-4">

                            <p
                              title={
                                movement.reason ??
                                ""
                              }
                              className="max-w-56 truncate text-sm text-slate-600"
                            >

                              {movement.reason ??
                                "—"}

                            </p>
                          </td>

                          {/* REFERENCE */}

                          <td className="px-5 py-4">

                            {movement.referenceId ||
                            movement.referenceType ? (
                              <div>

                                <p className="text-xs font-semibold text-slate-600">

                                  {displayText(
                                    movement.referenceType ??
                                      "Reference"
                                  )}

                                </p>

                                <p
                                  title={
                                    movement.referenceId ??
                                    ""
                                  }
                                  className="mt-1 max-w-40 truncate font-mono text-xs text-slate-400"
                                >

                                  {movement.referenceId ??
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

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <User
                                size={15}
                                className="text-purple-500"
                              />

                              <div>

                                <p className="max-w-40 truncate text-sm font-semibold text-slate-700">

                                  {getUserName(
                                    movement
                                  )}

                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">

                                  {displayText(
                                    getUserRole(
                                      movement
                                    )
                                  )}

                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                title="View movement"
                                onClick={() =>
                                  openDetails(
                                    movement
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>
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
            movements.length >
              0 && (
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
                    ({total} movements)
                  </span>
                </p>

                <div className="flex items-center gap-3">

                  {/* LIMIT */}

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  {/* CURRENT */}

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
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
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedMovement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Stock Movement Details
                  </h2>

                  <p className="mt-1 max-w-md truncate font-mono text-xs text-slate-400">

                    {selectedMovement.id}

                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedMovement(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              {/* CONTENT */}

              <div className="space-y-6 p-6">

                {/* =======================================
                    MOVEMENT HEADER
                ======================================== */}

                {(() => {
                  const type =
                    selectedMovement
                      .movementType;

                  const style =
                    movementStyle(
                      type
                    );

                  const Icon =
                    style.Icon;

                  return (
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-4">

                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.icon}`}
                        >
                          <Icon
                            size={22}
                          />
                        </div>

                        <div>

                          <p className="font-bold text-slate-900">

                            {displayText(
                              type
                            )}

                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                          >

                            {isStockIn(
                              type
                            )
                              ? "Stock In"
                              : isStockOut(
                                  type
                                )
                              ? "Stock Out"
                              : "Movement"}

                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">

                        <p
                          className={`text-2xl font-bold ${
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

                          {formatNumber(
                            getDisplayQuantity(
                              selectedMovement
                            )
                          )}

                          {getUnit(
                            selectedMovement
                          ) && (
                            <span className="ml-1 text-sm">
                              {getUnit(
                                selectedMovement
                              )}
                            </span>
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                          {formatDateTime(
                            selectedMovement.createdAt ??
                              selectedMovement.date
                          )}

                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* =======================================
                    PRODUCT + BRANCH
                ======================================== */}

                <div>

                  <h3 className="font-bold text-slate-900">
                    Inventory Information
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* PRODUCT */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Product
                      </p>

                      <div className="mt-3 flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                          <Package
                            size={18}
                          />
                        </div>

                        <div>

                          <p className="font-semibold text-slate-800">

                            {getProduct(
                              selectedMovement
                            )?.name ??
                              "Unknown Product"}

                          </p>

                          <p className="mt-1 text-xs text-slate-400">

                            SKU:{" "}

                            {getProduct(
                              selectedMovement
                            )?.sku ??
                              "—"}

                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BRANCH */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Branch
                      </p>

                      <div className="mt-3 flex items-center gap-3">

                        <Building2
                          size={19}
                          className="text-purple-600"
                        />

                        <div>

                          <p className="font-semibold text-slate-800">

                            {getBranch(
                              selectedMovement
                            )?.name ??
                              getBranch(
                                selectedMovement
                              )?.code ??
                              "—"}

                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-400">

                            {getBranchId(
                              selectedMovement
                            ) ??
                              "—"}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =======================================
                    STOCK CHANGE
                ======================================== */}

                <div>

                  <h3 className="font-bold text-slate-900">
                    Stock Change
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* BEFORE */}

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Stock Before
                      </p>

                      <p className="mt-2 text-xl font-bold text-slate-700">

                        {getBeforeQuantity(
                          selectedMovement
                        ) !== null
                          ? formatNumber(
                              getBeforeQuantity(
                                selectedMovement
                              )
                            )
                          : "—"}

                      </p>
                    </div>

                    {/* MOVEMENT */}

                    <div
                      className={`rounded-xl p-4 ${
                        isStockIn(
                          selectedMovement
                            .movementType
                        )
                          ? "bg-emerald-50"
                          : isStockOut(
                              selectedMovement
                                .movementType
                            )
                          ? "bg-red-50"
                          : "bg-slate-50"
                      }`}
                    >

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Movement Qty
                      </p>

                      <p
                        className={`mt-2 text-xl font-bold ${
                          isStockIn(
                            selectedMovement
                              .movementType
                          )
                            ? "text-emerald-700"
                            : isStockOut(
                                selectedMovement
                                  .movementType
                              )
                            ? "text-red-700"
                            : "text-slate-700"
                        }`}
                      >

                        {isStockIn(
                          selectedMovement
                            .movementType
                        )
                          ? "+"
                          : isStockOut(
                              selectedMovement
                                .movementType
                            )
                          ? "-"
                          : ""}

                        {formatNumber(
                          getDisplayQuantity(
                            selectedMovement
                          )
                        )}

                      </p>
                    </div>

                    {/* AFTER */}

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Stock After
                      </p>

                      <p className="mt-2 text-xl font-bold text-blue-600">

                        {getAfterQuantity(
                          selectedMovement
                        ) !== null
                          ? formatNumber(
                              getAfterQuantity(
                                selectedMovement
                              )
                            )
                          : "—"}

                      </p>
                    </div>
                  </div>
                </div>

                {/* =======================================
                    REASON
                ======================================== */}

                <div>

                  <h3 className="font-bold text-slate-900">
                    Movement Information
                  </h3>

                  <div className="mt-4 space-y-4">

                    <div className="rounded-xl border border-slate-200 p-4">

                      <div className="flex items-start gap-3">

                        <FileText
                          size={18}
                          className="mt-0.5 text-blue-600"
                        />

                        <div>

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Reason
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">

                            {selectedMovement.reason ??
                              "No reason provided."}

                          </p>
                        </div>
                      </div>
                    </div>

                    {/* REFERENCE */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Reference Type
                        </p>

                        <p className="mt-2 font-semibold text-slate-700">

                          {displayText(
                            selectedMovement.referenceType
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Reference ID
                        </p>

                        <p className="mt-2 break-all font-mono text-sm text-slate-700">

                          {selectedMovement.referenceId ??
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =======================================
                    USER
                ======================================== */}

                <div>

                  <h3 className="font-bold text-slate-900">
                    Performed By
                  </h3>

                  <div className="mt-4 rounded-xl border border-slate-200 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                        <User
                          size={17}
                        />
                      </div>

                      <div>

                        <p className="font-semibold text-slate-800">

                          {getUserName(
                            selectedMovement
                          )}

                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                          {displayText(
                            getUserRole(
                              selectedMovement
                            )
                          )}

                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =======================================
                    IDS
                ======================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Movement ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">

                      {selectedMovement.id ??
                        "—"}

                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Inventory ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">

                      {selectedMovement.inventoryId ??
                        getMovementInventory(
                          selectedMovement
                        )?.id ??
                        "—"}

                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default StockMovements;