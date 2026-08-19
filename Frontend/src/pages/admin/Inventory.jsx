import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Warehouse,
  Search,
  Plus,
  Minus,
  Package,
  Building2,
  AlertTriangle,
  PackageX,
  Boxes,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// API PATHS
// If your inventoryRoutes.js uses different paths,
// change ONLY these values.
// ======================================================

const INVENTORY_API = {
  list: "/inventory",
  stockIn: "/inventory/stock-in",
  stockOut: "/inventory/stock-out",
};

// ======================================================
// MOVEMENT TYPES
// ======================================================

const STOCK_IN_TYPES = [
  {
    value: "OPENING_STOCK",
    label: "Opening Stock",
  },
  {
    value: "PURCHASE",
    label: "Purchase",
  },
  {
    value: "ADJUSTMENT_IN",
    label: "Adjustment In",
  },
  {
    value: "RETURN",
    label: "Return",
  },
  {
    value: "VOID",
    label: "Void",
  },
  {
    value: "TRANSFER_IN",
    label: "Transfer In",
  },
];

const STOCK_OUT_TYPES = [
  {
    value: "ADJUSTMENT_OUT",
    label: "Adjustment Out",
  },
  {
    value: "DAMAGED",
    label: "Damaged",
  },
  {
    value: "EXPIRED",
    label: "Expired",
  },
  {
    value: "SALE",
    label: "Sale",
  },
  {
    value: "TRANSFER_OUT",
    label: "Transfer Out",
  },
];

const EMPTY_FORM = {
  branchId: "",
  productId: "",
  quantity: "",
  movementType: "",
  reason: "",
  referenceType: "",
  referenceId: "",
};

const Inventory = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [inventories, setInventories] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [branchFilter, setBranchFilter] =
    useState("");

  const [stockFilter, setStockFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [movementMode, setMovementMode] =
    useState("IN");

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // RESPONSE HELPERS
  // ====================================================

  const extractProducts = (response) => {
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

  const extractBranches = (response) => {
    return (
      response?.data?.data?.branches ??
      response?.data?.branches ??
      []
    );
  };

  const extractUnits = (response) => {
    return (
      response?.data?.data?.units ??
      response?.data?.units ??
      []
    );
  };

  // ====================================================
  // FETCH INVENTORY
  // ====================================================

  const fetchInventories = async () => {
    try {
      const params = {};

      if (branchFilter) {
        params.branchId =
          branchFilter;
      }

      if (search.trim()) {
        params.search =
          search.trim();
      }

      const response =
        await api.get(
          INVENTORY_API.list,
          {
            params,
          }
        );

      console.log(
        "Inventory Response:",
        response.data
      );

      const inventoryData =
        response.data?.data
          ?.inventories ?? [];

      setInventories(
        Array.isArray(
          inventoryData
        )
          ? inventoryData
          : []
      );
    } catch (error) {
      console.error(
        "Inventory fetch error:",
        error.response?.data ||
          error.message
      );

      throw error;
    }
  };

  // ====================================================
  // INITIAL DATA
  // ====================================================

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        inventoryResponse,
        productResponse,
        branchResponse,
        unitResponse,
      ] = await Promise.all([
        api.get(
          INVENTORY_API.list
        ),

        api.get("/products", {
          params: {
            status: "ACTIVE",
            page: 1,
            limit: 100,
          },
        }),

        api.get("/branches"),

        api.get("/units", {
          params: {
            status: "ACTIVE",
          },
        }),
      ]);

      // INVENTORY

      const inventoryData =
        inventoryResponse.data
          ?.data?.inventories ??
        [];

      setInventories(
        Array.isArray(
          inventoryData
        )
          ? inventoryData
          : []
      );

      // PRODUCTS

      const productData =
        extractProducts(
          productResponse
        );

      setProducts(
        Array.isArray(productData)
          ? productData
          : []
      );

      // BRANCHES

      const branchData =
        extractBranches(
          branchResponse
        );

      setBranches(
        Array.isArray(branchData)
          ? branchData
          : []
      );

      // UNITS

      const unitData =
        extractUnits(
          unitResponse
        );

      setUnits(
        Array.isArray(unitData)
          ? unitData
          : []
      );
    } catch (error) {
      console.error(
        "Inventory page error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data
          ?.message ||
          "Unable to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  // ====================================================
  // RELOAD WHEN BRANCH FILTER CHANGES
  // ====================================================

  useEffect(() => {
    if (loading) return;

    const timer =
      setTimeout(() => {
        fetchInventories()
          .catch((error) => {
            setError(
              error.response?.data
                ?.message ||
                "Unable to filter inventory."
            );
          });
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [
    branchFilter,
    search,
  ]);

  // ====================================================
  // PRODUCT
  // ====================================================

  const getProduct = (
    inventory
  ) => {
    if (inventory?.product) {
      return inventory.product;
    }

    return products.find(
      (product) =>
        product.id ===
        inventory?.productId
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    inventory
  ) => {
    if (inventory?.branch) {
      return inventory.branch;
    }

    return branches.find(
      (branch) =>
        branch.id ===
        inventory?.branchId
    );
  };

  // ====================================================
  // INVENTORY QUANTITY
  // Handles possible service response naming
  // ====================================================

  const getQuantity = (
    inventory
  ) => {
    const value =
      inventory?.quantity ??
      inventory?.stockQuantity ??
      inventory?.currentQuantity ??
      inventory?.currentStock ??
      inventory?.availableQuantity ??
      inventory?.availableStock ??
      0;

    return Number(value) || 0;
  };

  // ====================================================
  // UNIT
  // ====================================================

  const getProductBaseUnit = (
    product
  ) => {
    if (!product) return null;

    if (product.baseUnit) {
      return product.baseUnit;
    }

    return units.find(
      (unit) =>
        unit.id ===
        product.baseUnitId
    );
  };

  // ====================================================
  // SELECTED PRODUCT
  // ====================================================

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        form.productId
    );

  const selectedBaseUnit =
    getProductBaseUnit(
      selectedProduct
    );

  // ====================================================
  // STOCK STATUS
  // ====================================================

  const getStockStatus = (
    inventory
  ) => {
    const quantity =
      getQuantity(inventory);

    const product =
      getProduct(inventory);

    const reorderLevel =
      Number(
        product?.reorderLevel
      ) || 0;

    if (quantity <= 0) {
      return "OUT_OF_STOCK";
    }

    if (
      reorderLevel > 0 &&
      quantity <= reorderLevel
    ) {
      return "LOW_STOCK";
    }

    return "IN_STOCK";
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
      products,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const totalItems =
    inventories.length;

  const lowStockItems =
    inventories.filter(
      (inventory) =>
        getStockStatus(
          inventory
        ) === "LOW_STOCK"
    ).length;

  const outOfStockItems =
    inventories.filter(
      (inventory) =>
        getStockStatus(
          inventory
        ) === "OUT_OF_STOCK"
    ).length;

  const inStockItems =
    inventories.filter(
      (inventory) =>
        getStockStatus(
          inventory
        ) === "IN_STOCK"
    ).length;

  // ====================================================
  // OPEN STOCK IN
  // ====================================================

  const openStockInModal =
    () => {
      setMovementMode("IN");

      setForm({
        ...EMPTY_FORM,
        branchId:
          branchFilter || "",
        movementType:
          "OPENING_STOCK",
      });

      setError("");
      setSuccess("");

      setModalOpen(true);
    };

  // ====================================================
  // OPEN STOCK OUT
  // ====================================================

  const openStockOutModal =
    () => {
      setMovementMode("OUT");

      setForm({
        ...EMPTY_FORM,
        branchId:
          branchFilter || "",
        movementType:
          "ADJUSTMENT_OUT",
      });

      setError("");
      setSuccess("");

      setModalOpen(true);
    };

  // ====================================================
  // QUICK STOCK ACTION FROM TABLE
  // ====================================================

  const openInventoryAction = (
    inventory,
    mode
  ) => {
    setMovementMode(mode);

    setForm({
      ...EMPTY_FORM,

      branchId:
        inventory.branchId ||
        inventory.branch?.id ||
        "",

      productId:
        inventory.productId ||
        inventory.product?.id ||
        "",

      movementType:
        mode === "IN"
          ? "ADJUSTMENT_IN"
          : "ADJUSTMENT_OUT",
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setForm(EMPTY_FORM);
  };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ====================================================
  // SAVE STOCK MOVEMENT
  // ====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.branchId) {
        throw new Error(
          "Please select a branch."
        );
      }

      if (!form.productId) {
        throw new Error(
          "Please select a product."
        );
      }

      const quantity =
        Number(form.quantity);

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
        movementMode === "OUT" &&
        form.reason.trim()
          .length < 2
      ) {
        throw new Error(
          "Reason is required for stock out."
        );
      }

      const payload = {
        branchId:
          form.branchId,

        productId:
          form.productId,

        quantity,

        movementType:
          form.movementType,

        reason:
          form.reason.trim() ||
          undefined,

        referenceType:
          form.referenceType
            .trim() ||
          undefined,

        referenceId:
          form.referenceId
            .trim() ||
          undefined,
      };

      console.log(
        "Inventory Payload:",
        payload
      );

      if (
        movementMode === "IN"
      ) {
        await api.post(
          INVENTORY_API.stockIn,
          payload
        );

        setSuccess(
          "Stock added successfully."
        );
      } else {
        await api.post(
          INVENTORY_API.stockOut,
          payload
        );

        setSuccess(
          "Stock removed successfully."
        );
      }

      setModalOpen(false);

      setForm(EMPTY_FORM);

      await fetchInventories();
    } catch (error) {
      console.error(
        "Stock movement error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data
          ?.message ||
          error.message ||
          "Unable to update inventory."
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // RESET FILTERS
  // ====================================================

  const resetFilters = () => {
    setSearch("");
    setBranchFilter("");
    setStockFilter("");
  };

  // ====================================================
  // STATUS STYLE
  // ====================================================

  const statusDetails = (
    status
  ) => {
    if (
      status === "OUT_OF_STOCK"
    ) {
      return {
        label:
          "Out of Stock",

        className:
          "bg-red-50 text-red-600",
      };
    }

    if (
      status === "LOW_STOCK"
    ) {
      return {
        label:
          "Low Stock",

        className:
          "bg-amber-50 text-amber-700",
      };
    }

    return {
      label:
        "In Stock",

      className:
        "bg-emerald-50 text-emerald-700",
    };
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ============================================
            SUCCESS
        ============================================= */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <CheckCircle2
              size={19}
            />

            <span className="flex-1">
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* ============================================
            ERROR
        ============================================= */}

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
            >
              ×
            </button>
          </div>
        )}

        {/* ============================================
            PAGE HEADER
        ============================================= */}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage product stock
              across all branches.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={
                openStockOutModal
              }
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Minus size={18} />

              Stock Out
            </button>

            <button
              type="button"
              onClick={
                openStockInModal
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />

              Stock In
            </button>
          </div>
        </div>

        {/* ============================================
            STAT CARDS
        ============================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Inventory Items
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalItems}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Warehouse
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* IN STOCK */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  In Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {inStockItems}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Boxes
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* LOW */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Low Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {lowStockItems}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* OUT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Out of Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {outOfStockItems}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <PackageX
                  size={23}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            INVENTORY CARD
        ============================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-slate-200 p-5">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* SEARCH */}

              <div className="relative flex-1">

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
                  placeholder="Search product, SKU or barcode..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* BRANCH */}

              <select
                value={
                  branchFilter
                }
                onChange={(e) =>
                  setBranchFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
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

              {/* STOCK */}

              <select
                value={
                  stockFilter
                }
                onChange={(e) =>
                  setStockFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Stock
                </option>

                <option value="IN_STOCK">
                  In Stock
                </option>

                <option value="LOW_STOCK">
                  Low Stock
                </option>

                <option value="OUT_OF_STOCK">
                  Out of Stock
                </option>
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

          {/* ============================================
              LOADING
          ============================================= */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading inventory...
                </p>
              </div>
            </div>
          ) : filteredInventories.length ===
            0 ? (

            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <Warehouse
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No inventory found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Use Stock In to add
                  opening stock.
                </p>

                <button
                  type="button"
                  onClick={
                    openStockInModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus
                    size={17}
                  />

                  Add Opening Stock
                </button>
              </div>
            </div>
          ) : (

            /* ==========================================
               TABLE
            =========================================== */

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Base Unit
                    </th>

                    <th className="px-5 py-4">
                      Stock Quantity
                    </th>

                    <th className="px-5 py-4">
                      Reorder Level
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

                  {filteredInventories.map(
                    (inventory) => {
                      const product =
                        getProduct(
                          inventory
                        );

                      const branch =
                        getBranch(
                          inventory
                        );

                      const unit =
                        getProductBaseUnit(
                          product
                        );

                      const quantity =
                        getQuantity(
                          inventory
                        );

                      const status =
                        getStockStatus(
                          inventory
                        );

                      const details =
                        statusDetails(
                          status
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

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">

                                {product?.imageUrl ? (
                                  <img
                                    src={
                                      product.imageUrl
                                    }
                                    alt={
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package
                                    size={
                                      20
                                    }
                                    className="text-slate-400"
                                  />
                                )}
                              </div>

                              <div>

                                <p className="font-semibold text-slate-800">
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
                                size={16}
                                className="text-slate-400"
                              />

                              <span className="text-sm font-medium text-slate-700">
                                {branch?.name ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          {/* UNIT */}

                          <td className="px-5 py-4">

                            {unit ? (
                              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">

                                {unit.name} (
                                {unit.symbol})

                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4">

                            <p className="text-base font-bold text-slate-800">

                              {quantity.toLocaleString()}

                              {unit?.symbol && (
                                <span className="ml-1 text-sm font-medium text-slate-400">
                                  {
                                    unit.symbol
                                  }
                                </span>
                              )}
                            </p>
                          </td>

                          {/* REORDER */}

                          <td className="px-5 py-4">

                            <span className="text-sm text-slate-600">

                              {Number(
                                product?.reorderLevel
                              ) || 0}

                              {unit?.symbol && (
                                <span className="ml-1">
                                  {
                                    unit.symbol
                                  }
                                </span>
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${details.className}`}
                            >
                              {
                                details.label
                              }
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              {/* ADD */}

                              <button
                                type="button"
                                title="Stock In"
                                onClick={() =>
                                  openInventoryAction(
                                    inventory,
                                    "IN"
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50"
                              >
                                <ArrowDownToLine
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {/* REMOVE */}

                              <button
                                type="button"
                                title="Stock Out"
                                disabled={
                                  quantity <=
                                  0
                                }
                                onClick={() =>
                                  openInventoryAction(
                                    inventory,
                                    "OUT"
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ArrowUpFromLine
                                  size={
                                    16
                                  }
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
        </div>
      </div>

      {/* ==================================================
          STOCK MOVEMENT MODAL
      =================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    movementMode ===
                    "IN"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {movementMode ===
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
                  <h2 className="text-xl font-bold text-slate-900">

                    {movementMode ===
                    "IN"
                      ? "Stock In"
                      : "Stock Out"}

                  </h2>

                  <p className="mt-1 text-sm text-slate-500">

                    {movementMode ===
                    "IN"
                      ? "Add stock to inventory."
                      : "Remove stock from inventory."}

                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >

              {/* BRANCH */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Branch *
                </label>

                <select
                  name="branchId"
                  value={
                    form.branchId
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Select Branch
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
                        {branch.code
                          ? ` (${branch.code})`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PRODUCT */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Product *
                </label>

                <select
                  name="productId"
                  value={
                    form.productId
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Select Product
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
                        {product.name} -{" "}
                        {product.sku}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* SELECTED PRODUCT INFO */}

              {selectedProduct && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex items-start gap-3">

                    <Package
                      size={20}
                      className="mt-0.5 text-blue-600"
                    />

                    <div>

                      <p className="text-sm font-semibold text-blue-900">
                        {
                          selectedProduct.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-blue-700">

                        Product Type:{" "}
                        {
                          selectedProduct.productType
                        }

                      </p>

                      <p className="mt-1 text-xs text-blue-700">

                        Base Unit:{" "}

                        {selectedBaseUnit
                          ? `${selectedBaseUnit.name} (${selectedBaseUnit.symbol})`
                          : "Not available"}

                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MOVEMENT TYPE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Movement Type *
                </label>

                <select
                  name="movementType"
                  value={
                    form.movementType
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >

                  {(movementMode ===
                  "IN"
                    ? STOCK_IN_TYPES
                    : STOCK_OUT_TYPES
                  ).map((type) => (
                    <option
                      key={
                        type.value
                      }
                      value={
                        type.value
                      }
                    >
                      {type.label}
                    </option>
                  ))}

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
                    value={
                      form.quantity
                    }
                    onChange={
                      handleChange
                    }
                    min="0.001"
                    step="0.001"
                    required
                    placeholder="Enter quantity"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-20 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  {selectedBaseUnit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                      {
                        selectedBaseUnit.symbol
                      }
                    </span>
                  )}
                </div>

                {selectedBaseUnit && (
                  <p className="mt-2 text-xs text-slate-400">
                    Enter quantity using
                    the product base unit:{" "}
                    <strong>
                      {
                        selectedBaseUnit.name
                      }
                    </strong>.
                  </p>
                )}
              </div>

              {/* REASON */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  Reason{" "}

                  {movementMode ===
                    "OUT" && "*"}

                </label>

                <textarea
                  name="reason"
                  value={
                    form.reason
                  }
                  onChange={
                    handleChange
                  }
                  required={
                    movementMode ===
                    "OUT"
                  }
                  minLength={
                    movementMode ===
                    "OUT"
                      ? 2
                      : undefined
                  }
                  maxLength={500}
                  rows={3}
                  placeholder={
                    movementMode ===
                    "IN"
                      ? "Example: Initial inventory setup"
                      : "Example: Damaged product"
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* OPTIONAL REFERENCE */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Reference Type
                  </label>

                  <input
                    type="text"
                    name="referenceType"
                    value={
                      form.referenceType
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={50}
                    placeholder="PURCHASE_ORDER"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Reference ID
                  </label>

                  <input
                    type="text"
                    name="referenceId"
                    value={
                      form.referenceId
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={100}
                    placeholder="PO-001"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* INFO */}

              {movementMode ===
                "IN" &&
                form.movementType ===
                  "OPENING_STOCK" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <div className="flex gap-3">

                      <AlertTriangle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <p className="text-xs leading-5 text-amber-700">
                        Opening Stock is
                        normally used when
                        setting the initial
                        inventory quantity
                        for a product in a
                        branch.
                      </p>
                    </div>
                  </div>
                )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={`flex min-w-36 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    movementMode ===
                    "IN"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {movementMode ===
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