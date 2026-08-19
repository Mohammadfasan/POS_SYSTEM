import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Package,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  TriangleAlert,
  CircleX,
  CircleCheck,
  Building2,
  Barcode,
  Scale,
  WalletCards,
  ChevronLeft,
  ChevronRight,
  History,
  Hash,
  Layers3,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../api/axios";

// ======================================================
// MOVEMENT TYPES
// ======================================================

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
  "DAMAGED",
  "EXPIRED",
  "SALE",
  "TRANSFER_OUT",
];

const STOCK_FILTERS = [
  {
    value: "",
    label: "All Stock",
  },
  {
    value: "IN_STOCK",
    label: "In Stock",
  },
  {
    value: "LOW_STOCK",
    label: "Low Stock",
  },
  {
    value: "OUT_OF_STOCK",
    label: "Out of Stock",
  },
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
  ).format(
    Number(value) || 0
  );
};

const formatNumber = (value) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-LK",
    {
      maximumFractionDigits: 3,
    }
  ).format(number);
};

const formatDateTime = (value) => {
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
// INVENTORY PAGE
// ======================================================

const Inventory = () => {
  const navigate =
    useNavigate();

  // ====================================================
  // DATA
  // ====================================================

  const [
    inventories,
    setInventories,
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
    saving,
    setSaving,
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
  // FILTERS
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
    stockFilter,
    setStockFilter,
  ] = useState("");

  // ====================================================
  // CLIENT PAGINATION
  // ====================================================

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    limit,
    setLimit,
  ] = useState(10);

  // ====================================================
  // DETAILS
  // ====================================================

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    selectedInventory,
    setSelectedInventory,
  ] = useState(null);

  // ====================================================
  // STOCK MODAL
  // ====================================================

  const [
    stockModalOpen,
    setStockModalOpen,
  ] = useState(false);

  const [
    stockMode,
    setStockMode,
  ] = useState("IN");

  const [
    stockInventory,
    setStockInventory,
  ] = useState(null);

  const [
    stockForm,
    setStockForm,
  ] = useState({
    quantity: "",
    movementType:
      "ADJUSTMENT_IN",
    reason: "",
    referenceType: "",
    referenceId: "",
  });

  // ====================================================
  // FETCH INVENTORY
  //
  // GET /inventory
  //
  // Backend supports:
  // branchId
  // productId
  // search
  // ====================================================

  const fetchInventories =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (search) {
          params.search =
            search;
        }

        const response =
          await api.get(
            "/inventory",
            {
              params,
            }
          );

        console.log(
          "Manager Inventory:",
          response.data
        );

        const result =
          response.data?.data;

        const data =
          result?.inventories ??
          result?.items ??
          result?.rows ??
          (Array.isArray(result)
            ? result
            : []);

        setInventories(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Inventory load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load inventory."
        );

        setInventories([]);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // LOAD
  // ====================================================

  useEffect(() => {
    fetchInventories();
  }, [search]);

  // ====================================================
  // PRODUCT
  // ====================================================

  const getProduct = (
    inventory
  ) => {
    return (
      inventory?.product ??
      inventory?.inventory
        ?.product ??
      null
    );
  };

  // ====================================================
  // PRODUCT ID
  // ====================================================

  const getProductId = (
    inventory
  ) => {
    return (
      inventory?.productId ??
      getProduct(inventory)?.id ??
      null
    );
  };

  // ====================================================
  // PRODUCT NAME
  // ====================================================

  const getProductName = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return (
      product?.name ??
      inventory?.productName ??
      "Unknown Product"
    );
  };

  // ====================================================
  // SKU
  // ====================================================

  const getSku = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return (
      product?.sku ??
      inventory?.sku ??
      "—"
    );
  };

  // ====================================================
  // BARCODE
  // ====================================================

  const getBarcode = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return (
      product?.barcode ??
      inventory?.barcode ??
      "—"
    );
  };

  // ====================================================
  // CATEGORY
  // ====================================================

  const getCategory = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return (
      product?.category?.name ??
      inventory?.category?.name ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    inventory
  ) => {
    return (
      inventory?.branch ??
      inventory?.warehouse ??
      null
    );
  };

  // ====================================================
  // BRANCH ID
  // ====================================================

  const getBranchId = (
    inventory
  ) => {
    return (
      inventory?.branchId ??
      getBranch(inventory)?.id ??
      null
    );
  };

  // ====================================================
  // BRANCH NAME
  // ====================================================

  const getBranchName = (
    inventory
  ) => {
    const branch =
      getBranch(inventory);

    return (
      branch?.name ??
      branch?.code ??
      inventory?.branchName ??
      "—"
    );
  };

  // ====================================================
  // QUANTITY
  // ====================================================

  const getQuantity = (
    inventory
  ) => {
    return Number(
      inventory?.quantity ??
        inventory?.stockQuantity ??
        inventory?.currentStock ??
        inventory?.availableQuantity ??
        0
    );
  };

  // ====================================================
  // RESERVED
  // ====================================================

  const getReserved = (
    inventory
  ) => {
    return Number(
      inventory?.reservedQuantity ??
        inventory?.reservedStock ??
        inventory?.reserved ??
        0
    );
  };

  // ====================================================
  // AVAILABLE
  // ====================================================

  const getAvailable = (
    inventory
  ) => {
    if (
      inventory
        ?.availableQuantity !==
      undefined
    ) {
      return Number(
        inventory.availableQuantity
      );
    }

    return Math.max(
      0,
      getQuantity(inventory) -
        getReserved(inventory)
    );
  };

  // ====================================================
  // REORDER LEVEL
  // ====================================================

  const getReorderLevel = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return Number(
      inventory?.reorderLevel ??
        product?.reorderLevel ??
        0
    );
  };

  // ====================================================
  // COST
  // ====================================================

  const getCostPrice = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return Number(
      inventory?.averageCost ??
        inventory?.costPrice ??
        product?.costPrice ??
        0
    );
  };

  // ====================================================
  // SELLING PRICE
  // ====================================================

  const getSellingPrice = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    return Number(
      product?.sellingPrice ??
        inventory?.sellingPrice ??
        0
    );
  };

  // ====================================================
  // STOCK VALUE
  // ====================================================

  const getStockValue = (
    inventory
  ) => {
    if (
      inventory?.stockValue !==
      undefined
    ) {
      return Number(
        inventory.stockValue
      );
    }

    return (
      getQuantity(inventory) *
      getCostPrice(inventory)
    );
  };

  // ====================================================
  // UNIT
  // ====================================================

  const getUnit = (
    inventory
  ) => {
    const product =
      getProduct(inventory);

    const unit =
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
  // STOCK STATUS
  // ====================================================

  const getStockStatus = (
    inventory
  ) => {
    const quantity =
      getQuantity(inventory);

    const reorderLevel =
      getReorderLevel(
        inventory
      );

    if (quantity <= 0) {
      return "OUT_OF_STOCK";
    }

    if (
      reorderLevel > 0 &&
      quantity <=
        reorderLevel
    ) {
      return "LOW_STOCK";
    }

    return "IN_STOCK";
  };

  // ====================================================
  // STOCK STATUS STYLE
  // ====================================================

  const getStockStatusStyle = (
    status
  ) => {
    switch (status) {
      case "IN_STOCK":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "LOW_STOCK":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "OUT_OF_STOCK":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  // ====================================================
  // FILTERED INVENTORY
  // ====================================================

  const filteredInventories =
    useMemo(() => {
      if (!stockFilter) {
        return inventories;
      }

      return inventories.filter(
        (inventory) =>
          getStockStatus(
            inventory
          ) === stockFilter
      );
    }, [
      inventories,
      stockFilter,
    ]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const total =
    filteredInventories.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / limit
      )
    );

  const paginatedInventories =
    useMemo(() => {
      const start =
        (page - 1) *
        limit;

      return filteredInventories.slice(
        start,
        start + limit
      );
    }, [
      filteredInventories,
      page,
      limit,
    ]);

  useEffect(() => {
    if (
      page > totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    totalPages,
    page,
  ]);

  // ====================================================
  // STATS
  // ====================================================

  const totalStockValue =
    inventories.reduce(
      (sum, inventory) =>
        sum +
        getStockValue(
          inventory
        ),
      0
    );

  const totalQuantity =
    inventories.reduce(
      (sum, inventory) =>
        sum +
        getQuantity(
          inventory
        ),
      0
    );

  const lowStockCount =
    inventories.filter(
      (inventory) =>
        getStockStatus(
          inventory
        ) ===
        "LOW_STOCK"
    ).length;

  const outOfStockCount =
    inventories.filter(
      (inventory) =>
        getStockStatus(
          inventory
        ) ===
        "OUT_OF_STOCK"
    ).length;

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
  // RESET FILTER
  // ====================================================

  const resetFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStockFilter("");
      setPage(1);
    };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /inventory/:id
  // ====================================================

  const openDetails =
    async (inventory) => {
      try {
        setSelectedInventory(
          inventory
        );

        setDetailsOpen(true);

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/inventory/${inventory.id}`
          );

        const detailed =
          response.data?.data
            ?.inventory ??
          inventory;

        setSelectedInventory(
          detailed
        );
      } catch (err) {
        console.error(
          "Inventory detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load inventory details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // OPEN STOCK MODAL
  // ====================================================

  const openStockModal = (
    inventory,
    mode
  ) => {
    setStockInventory(
      inventory
    );

    setStockMode(mode);

    setStockForm({
      quantity: "",

      movementType:
        mode === "IN"
          ? "ADJUSTMENT_IN"
          : "ADJUSTMENT_OUT",

      reason: "",
      referenceType: "",
      referenceId: "",
    });

    setStockModalOpen(true);
    setError("");
    setSuccess("");
  };

  // ====================================================
  // CLOSE STOCK MODAL
  // ====================================================

  const closeStockModal =
    () => {
      if (saving) {
        return;
      }

      setStockModalOpen(
        false
      );

      setStockInventory(
        null
      );
    };

  // ====================================================
  // STOCK FORM CHANGE
  // ====================================================

  const handleStockChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setStockForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  // ====================================================
  // SUBMIT STOCK
  //
  // POST /inventory/stock-in
  // POST /inventory/stock-out
  // ====================================================

  const handleStockSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setError("");
        setSuccess("");

        if (
          !stockInventory
        ) {
          return;
        }

        const branchId =
          getBranchId(
            stockInventory
          );

        const productId =
          getProductId(
            stockInventory
          );

        if (!branchId) {
          throw new Error(
            "Branch ID is missing for this inventory."
          );
        }

        if (!productId) {
          throw new Error(
            "Product ID is missing for this inventory."
          );
        }

        const quantity =
          Number(
            stockForm.quantity
          );

        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            "Quantity must be greater than 0."
          );
        }

        if (
          stockMode ===
            "OUT" &&
          stockForm.reason
            .trim().length < 2
        ) {
          throw new Error(
            "Stock-out reason must contain at least 2 characters."
          );
        }

        if (
          stockMode ===
            "OUT" &&
          quantity >
            getQuantity(
              stockInventory
            )
        ) {
          throw new Error(
            "Stock-out quantity cannot be greater than current stock."
          );
        }

        setSaving(true);

        const payload = {
          branchId,
          productId,
          quantity,
          movementType:
            stockForm.movementType,
        };

        // ===============================================
        // REASON
        // ===============================================

        if (
          stockMode === "OUT"
        ) {
          payload.reason =
            stockForm.reason.trim();
        } else if (
          stockForm.reason.trim()
        ) {
          payload.reason =
            stockForm.reason.trim();
        }

        // ===============================================
        // OPTIONAL REFERENCE
        // ===============================================

        if (
          stockForm.referenceType
            .trim()
        ) {
          payload.referenceType =
            stockForm.referenceType.trim();
        }

        if (
          stockForm.referenceId
            .trim()
        ) {
          payload.referenceId =
            stockForm.referenceId.trim();
        }

        const endpoint =
          stockMode === "IN"
            ? "/inventory/stock-in"
            : "/inventory/stock-out";

        const response =
          await api.post(
            endpoint,
            payload
          );

        setSuccess(
          response.data?.message ||
            (stockMode ===
            "IN"
              ? "Stock added successfully."
              : "Stock removed successfully.")
        );

        setStockModalOpen(
          false
        );

        setStockInventory(
          null
        );

        setDetailsOpen(
          false
        );

        setSelectedInventory(
          null
        );

        await fetchInventories();
      } catch (err) {
        console.error(
          "Stock adjustment error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to update stock."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // PRODUCT IMAGE
  // ====================================================

  const ProductImage = ({
    inventory,
    large = false,
  }) => {
    const product =
      getProduct(inventory);

    const image =
      product?.imageUrl ??
      inventory?.imageUrl;

    const size =
      large
        ? "h-24 w-24"
        : "h-11 w-11";

    if (image) {
      return (
        <img
          src={image}
          alt={
            getProductName(
              inventory
            )
          }
          className={`${size} shrink-0 rounded-xl border border-slate-200 object-cover`}
          onError={(event) => {
            event.currentTarget.style.display =
              "none";
          }}
        />
      );
    }

    return (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600`}
      >
        <Package
          size={
            large
              ? 34
              : 19
          }
        />
      </div>
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor current stock
              levels and perform stock
              adjustments.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchInventories
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Stock Value
                </p>

                <p className="mt-2 text-xl font-bold text-blue-600">

                  {formatMoney(
                    totalStockValue
                  )}

                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <WalletCards
                  size={21}
                />
              </div>
            </div>
          </div>

          {/* ITEMS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Stock Qty
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">

                  {formatNumber(
                    totalQuantity
                  )}

                </p>
              </div>

              <Boxes
                size={23}
                className="text-emerald-500"
              />
            </div>
          </div>

          {/* LOW */}

          <button
            type="button"
            onClick={() => {
              setStockFilter(
                "LOW_STOCK"
              );

              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-200"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Low Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">

                  {lowStockCount}

                </p>
              </div>

              <TriangleAlert
                size={23}
                className="text-amber-500"
              />
            </div>
          </button>

          {/* OUT */}

          <button
            type="button"
            onClick={() => {
              setStockFilter(
                "OUT_OF_STOCK"
              );

              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-200"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Out of Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">

                  {outOfStockCount}

                </p>
              </div>

              <CircleX
                size={23}
                className="text-red-500"
              />
            </div>
          </button>
        </div>

        {/* =================================================
            TABLE CARD
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
                  placeholder="Search product, SKU or barcode..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

              {/* STOCK STATUS */}

              <select
                value={
                  stockFilter
                }
                onChange={(e) => {
                  setStockFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >

                {STOCK_FILTERS.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {status.label}
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
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
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
                  size={34}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading inventory...
                </p>
              </div>
            </div>
          ) : paginatedInventories.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Boxes
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-700">
                  No inventory found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Try changing your
                  search or stock filter.
                </p>
              </div>
            </div>
          ) : (
            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="px-5 py-4">
                      SKU / Barcode
                    </th>

                    <th className="px-5 py-4">
                      Category
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Stock Qty
                    </th>

                    <th className="px-5 py-4">
                      Reorder Level
                    </th>

                    <th className="px-5 py-4">
                      Cost Price
                    </th>

                    <th className="px-5 py-4">
                      Stock Value
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

                  {paginatedInventories.map(
                    (inventory) => {
                      const status =
                        getStockStatus(
                          inventory
                        );

                      const quantity =
                        getQuantity(
                          inventory
                        );

                      return (
                        <tr
                          key={
                            inventory.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <ProductImage
                                inventory={
                                  inventory
                                }
                              />

                              <div className="min-w-0">

                                <p className="max-w-56 truncate text-sm font-semibold text-slate-800">

                                  {getProductName(
                                    inventory
                                  )}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                  {getUnit(
                                    inventory
                                  ) ||
                                    "Unit —"}

                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">

                            <p className="font-mono text-sm font-semibold text-slate-700">

                              {getSku(
                                inventory
                              )}

                            </p>

                            <p className="mt-1 max-w-40 truncate font-mono text-xs text-slate-400">

                              {getBarcode(
                                inventory
                              )}

                            </p>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700">

                              {getCategory(
                                inventory
                              )}

                            </span>
                          </td>

                          {/* BRANCH */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Building2
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="whitespace-nowrap text-sm text-slate-600">

                                {getBranchName(
                                  inventory
                                )}

                              </span>
                            </div>
                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4">

                            <span
                              className={`text-base font-bold ${
                                quantity <= 0
                                  ? "text-red-600"
                                  : status ===
                                    "LOW_STOCK"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >

                              {formatNumber(
                                quantity
                              )}

                            </span>

                            {getUnit(
                              inventory
                            ) && (
                              <span className="ml-1 text-xs text-slate-400">

                                {getUnit(
                                  inventory
                                )}

                              </span>
                            )}
                          </td>

                          {/* REORDER */}

                          <td className="px-5 py-4 font-semibold text-slate-600">

                            {formatNumber(
                              getReorderLevel(
                                inventory
                              )
                            )}

                          </td>

                          {/* COST */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">

                            {formatMoney(
                              getCostPrice(
                                inventory
                              )
                            )}

                          </td>

                          {/* VALUE */}

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-blue-600">

                            {formatMoney(
                              getStockValue(
                                inventory
                              )
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStockStatusStyle(
                                status
                              )}`}
                            >

                              {displayText(
                                status
                              )}

                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                title="View inventory"
                                onClick={() =>
                                  openDetails(
                                    inventory
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              {/* STOCK IN */}

                              <button
                                type="button"
                                title="Stock In"
                                onClick={() =>
                                  openStockModal(
                                    inventory,
                                    "IN"
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              >
                                <ArrowDownToLine
                                  size={16}
                                />
                              </button>

                              {/* STOCK OUT */}

                              <button
                                type="button"
                                title="Stock Out"
                                disabled={
                                  quantity <= 0
                                }
                                onClick={() =>
                                  openStockModal(
                                    inventory,
                                    "OUT"
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <ArrowUpFromLine
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
              CLIENT PAGINATION
          ================================================= */}

          {!loading &&
            filteredInventories.length >
              0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">

                  Showing{" "}

                  <span className="font-semibold text-slate-800">

                    {(page - 1) *
                      limit +
                      1}

                  </span>

                  {" "}to{" "}

                  <span className="font-semibold text-slate-800">

                    {Math.min(
                      page * limit,
                      total
                    )}

                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {total}
                  </span>

                  {" "}inventory items

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
          INVENTORY DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedInventory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Product Stock Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current inventory
                    information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedInventory(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={21} />
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
                      PRODUCT HEADER
                  ======================================== */}

                  <div className="flex flex-col gap-5 sm:flex-row">

                    <ProductImage
                      inventory={
                        selectedInventory
                      }
                      large
                    />

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-xl font-bold text-slate-900">

                          {getProductName(
                            selectedInventory
                          )}

                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStockStatusStyle(
                            getStockStatus(
                              selectedInventory
                            )
                          )}`}
                        >

                          {displayText(
                            getStockStatus(
                              selectedInventory
                            )
                          )}

                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">

                        {getProduct(
                          selectedInventory
                        )?.description ||
                          "No product description."}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      IDENTIFIERS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        SKU
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <Hash
                          size={15}
                          className="text-blue-600"
                        />

                        <p className="font-mono font-semibold text-slate-700">

                          {getSku(
                            selectedInventory
                          )}

                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Barcode
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <Barcode
                          size={16}
                          className="text-purple-600"
                        />

                        <p className="font-mono text-sm font-semibold text-slate-700">

                          {getBarcode(
                            selectedInventory
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      INFORMATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Inventory Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                      {/* BRANCH */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Branch
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Building2
                            size={16}
                            className="text-blue-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {getBranchName(
                              selectedInventory
                            )}

                          </p>
                        </div>
                      </div>

                      {/* CATEGORY */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Category
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Layers3
                            size={16}
                            className="text-purple-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {getCategory(
                              selectedInventory
                            )}

                          </p>
                        </div>
                      </div>

                      {/* UNIT */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Unit
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Scale
                            size={16}
                            className="text-emerald-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {getUnit(
                              selectedInventory
                            ) ||
                              "—"}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      STOCK SUMMARY
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Stock Summary
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">

                      {/* CURRENT */}

                      <div className="rounded-xl bg-blue-50 p-4">

                        <p className="text-xs font-semibold uppercase text-blue-500">
                          Current Stock
                        </p>

                        <p className="mt-2 text-xl font-bold text-blue-700">

                          {formatNumber(
                            getQuantity(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>

                      {/* RESERVED */}

                      <div className="rounded-xl bg-purple-50 p-4">

                        <p className="text-xs font-semibold uppercase text-purple-500">
                          Reserved
                        </p>

                        <p className="mt-2 text-xl font-bold text-purple-700">

                          {formatNumber(
                            getReserved(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>

                      {/* AVAILABLE */}

                      <div className="rounded-xl bg-emerald-50 p-4">

                        <p className="text-xs font-semibold uppercase text-emerald-500">
                          Available
                        </p>

                        <p className="mt-2 text-xl font-bold text-emerald-700">

                          {formatNumber(
                            getAvailable(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>

                      {/* REORDER */}

                      <div className="rounded-xl bg-amber-50 p-4">

                        <p className="text-xs font-semibold uppercase text-amber-500">
                          Reorder Level
                        </p>

                        <p className="mt-2 text-xl font-bold text-amber-700">

                          {formatNumber(
                            getReorderLevel(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      VALUE
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Stock Value
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Cost Price
                        </p>

                        <p className="mt-2 font-bold text-slate-800">

                          {formatMoney(
                            getCostPrice(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Selling Price
                        </p>

                        <p className="mt-2 font-bold text-emerald-600">

                          {formatMoney(
                            getSellingPrice(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Current Value
                        </p>

                        <p className="mt-2 font-bold text-blue-600">

                          {formatMoney(
                            getStockValue(
                              selectedInventory
                            )
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      DATE
                  ======================================== */}

                  <div className="rounded-xl border border-slate-200 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Last Updated
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-700">

                      {formatDateTime(
                        selectedInventory.updatedAt
                      )}

                    </p>
                  </div>

                  {/* =======================================
                      QUICK ACTION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Quick Actions
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

                      {/* STOCK IN */}

                      <button
                        type="button"
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openStockModal(
                            selectedInventory,
                            "IN"
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <ArrowDownToLine
                          size={17}
                        />

                        Stock In
                      </button>

                      {/* STOCK OUT */}

                      <button
                        type="button"
                        disabled={
                          getQuantity(
                            selectedInventory
                          ) <= 0
                        }
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openStockModal(
                            selectedInventory,
                            "OUT"
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                      >
                        <ArrowUpFromLine
                          size={17}
                        />

                        Stock Out
                      </button>

                      {/* MOVEMENTS */}

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/manager/stock-movements"
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        <History
                          size={17}
                        />

                        Movements
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* =================================================
          STOCK IN / OUT MODAL
      ================================================= */}

      {stockModalOpen &&
        stockInventory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div className="flex items-center gap-3">

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      stockMode === "IN"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {stockMode ===
                    "IN" ? (
                      <ArrowDownToLine
                        size={21}
                      />
                    ) : (
                      <ArrowUpFromLine
                        size={21}
                      />
                    )}
                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-slate-900">

                      {stockMode ===
                      "IN"
                        ? "Stock In"
                        : "Stock Out"}

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                      {getProductName(
                        stockInventory
                      )}

                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeStockModal
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* CURRENT STOCK */}

              <div className="mx-6 mt-5 rounded-xl bg-slate-50 p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Current Stock
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">

                      {formatNumber(
                        getQuantity(
                          stockInventory
                        )
                      )}{" "}

                      {getUnit(
                        stockInventory
                      )}

                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-xs text-slate-400">
                      Branch
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">

                      {getBranchName(
                        stockInventory
                      )}

                    </p>
                  </div>
                </div>
              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleStockSubmit
                }
                className="space-y-5 p-6"
              >

                {/* MOVEMENT TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Movement Type *
                  </label>

                  <select
                    name="movementType"
                    value={
                      stockForm.movementType
                    }
                    onChange={
                      handleStockChange
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >

                    {(stockMode ===
                    "IN"
                      ? STOCK_IN_TYPES
                      : STOCK_OUT_TYPES
                    ).map(
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
                </div>

                {/* QUANTITY */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantity *
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      name="quantity"
                      required
                      min="0.001"
                      step="any"
                      value={
                        stockForm.quantity
                      }
                      onChange={
                        handleStockChange
                      }
                      placeholder="Enter quantity"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm outline-none focus:border-blue-500"
                    />

                    {getUnit(
                      stockInventory
                    ) && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">

                        {getUnit(
                          stockInventory
                        )}

                      </span>
                    )}
                  </div>
                </div>

                {/* REASON */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Reason{" "}

                    {stockMode ===
                      "OUT" && "*"}

                  </label>

                  <textarea
                    name="reason"
                    rows={3}
                    required={
                      stockMode ===
                      "OUT"
                    }
                    maxLength={500}
                    value={
                      stockForm.reason
                    }
                    onChange={
                      handleStockChange
                    }
                    placeholder={
                      stockMode ===
                      "OUT"
                        ? "Reason is required for stock out..."
                        : "Optional stock-in reason..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* REFERENCE */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Reference Type
                    </label>

                    <input
                      type="text"
                      name="referenceType"
                      maxLength={50}
                      value={
                        stockForm.referenceType
                      }
                      onChange={
                        handleStockChange
                      }
                      placeholder="e.g. PO"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Reference ID
                    </label>

                    <input
                      type="text"
                      name="referenceId"
                      maxLength={100}
                      value={
                        stockForm.referenceId
                      }
                      onChange={
                        handleStockChange
                      }
                      placeholder="Optional reference"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* WARNING */}

                {stockMode ===
                  "OUT" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <div className="flex gap-3">

                      <TriangleAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <p className="text-sm leading-6 text-amber-700">
                        Stock out will
                        reduce the
                        available quantity
                        for this branch.
                      </p>
                    </div>
                  </div>
                )}

                {/* ACTION */}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                  <button
                    type="button"
                    disabled={saving}
                    onClick={
                      closeStockModal
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex min-w-36 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${
                      stockMode === "IN"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    } disabled:opacity-50`}
                  >

                    {saving ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : stockMode ===
                      "IN" ? (
                      <ArrowDownToLine
                        size={17}
                      />
                    ) : (
                      <ArrowUpFromLine
                        size={17}
                      />
                    )}

                    {stockMode ===
                    "IN"
                      ? "Add Stock"
                      : "Remove Stock"}

                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default Inventory;