import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  Barcode,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  Loader2,
  Package,
  RefreshCw,
  ScanLine,
  Search,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const PRODUCT_TYPES = [
  "",
  "FIXED",
  "WEIGHT",
  "VOLUME",
  "LENGTH",
];

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatQuantity = (value) => {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return amount.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
};

const displayProductType = (value) => {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

// ======================================================
// PRODUCT PAGE
// ======================================================

const Products = () => {
  const navigate = useNavigate();

  const barcodeInputRef =
    useRef(null);

  // ====================================================
  // PRODUCTS
  // ====================================================

  const [products, setProducts] =
    useState([]);

  const [inventories, setInventories] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  // ====================================================
  // FILTERS
  // ====================================================

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [productType, setProductType] =
    useState("");

  const [stockFilter, setStockFilter] =
    useState("");

  // ====================================================
  // PAGINATION
  // ====================================================

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(20);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // ====================================================
  // BARCODE
  // ====================================================

  const [barcodeValue, setBarcodeValue] =
    useState("");

  const [
    barcodeLoading,
    setBarcodeLoading,
  ] = useState(false);

  // ====================================================
  // DETAILS
  // ====================================================

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  // ====================================================
  // UI
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // SEARCH DEBOUNCE
  // ====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(
        search.trim()
      );

      setPage(1);
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [search]);

  // ====================================================
  // INVENTORY MAP
  // ====================================================

  const inventoryMap =
    useMemo(() => {
      const map = {};

      inventories.forEach(
        (inventory) => {
          const productId =
            inventory?.productId ||
            inventory?.product?.id;

          if (productId) {
            map[productId] =
              inventory;
          }
        }
      );

      return map;
    }, [inventories]);

  // ====================================================
  // GET INVENTORY
  // ====================================================

  const getProductInventory = (
    product
  ) => {
    if (!product?.id) {
      return null;
    }

    return (
      inventoryMap[
        product.id
      ] || null
    );
  };

  // ====================================================
  // AVAILABLE QUANTITY
  //
  // Inventory is stored in BASE quantity.
  // Convert it to selling-unit quantity.
  // ====================================================

  const getAvailableQuantity = (
    product
  ) => {
    if (
      product?.trackInventory ===
      false
    ) {
      return Infinity;
    }

    const inventory =
      getProductInventory(
        product
      );

    if (!inventory) {
      return 0;
    }

    const availableBase =
      Number(
        inventory.availableQuantity ||
          0
      );

    const conversionFactor =
      Number(
        product?.sellingUnit
          ?.conversionFactor || 1
      );

    if (
      !Number.isFinite(
        conversionFactor
      ) ||
      conversionFactor <= 0
    ) {
      return 0;
    }

    return (
      availableBase /
      conversionFactor
    );
  };

  // ====================================================
  // STOCK STATE
  // ====================================================

  const getStockState = (
    product
  ) => {
    if (
      product?.trackInventory ===
      false
    ) {
      return {
        status: "NOT_TRACKED",
        label: "Not Tracked",
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
      };
    }

    const inventory =
      getProductInventory(
        product
      );

    const available =
      getAvailableQuantity(
        product
      );

    if (
      !inventory ||
      available <= 0
    ) {
      return {
        status: "OUT",
        label: "Out of Stock",
        className:
          "border-red-200 bg-red-50 text-red-600",
      };
    }

    if (inventory.isLowStock) {
      return {
        status: "LOW",
        label: "Low Stock",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    return {
      status: "IN",
      label: "In Stock",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  };

  // ====================================================
  // LOAD CATEGORIES
  // ====================================================

  const loadCategories =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/categories",
            {
              params: {
                status: "ACTIVE",
              },
            }
          );

        const result =
          response.data?.data;

        const list =
          result?.categories ??
          (Array.isArray(result)
            ? result
            : []);

        setCategories(
          Array.isArray(list)
            ? list
            : []
        );
      } catch (error) {
        console.error(
          "Category error:",
          error.response?.data ||
            error.message
        );

        setCategories([]);
      }
    }, []);

  // ====================================================
  // LOAD INVENTORY
  // ====================================================

  const loadInventory =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/inventory"
          );

        const list =
          response.data?.data
            ?.inventories || [];

        setInventories(
          Array.isArray(list)
            ? list
            : []
        );
      } catch (error) {
        console.error(
          "Inventory error:",
          error.response?.data ||
            error.message
        );

        setInventories([]);

        throw error;
      }
    }, []);

  // ====================================================
  // LOAD PRODUCTS
  // ====================================================

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);

        setError("");

        const params = {
          page,
          limit,
          status: "ACTIVE",
        };

        if (debouncedSearch) {
          params.search =
            debouncedSearch;
        }

        if (categoryId) {
          params.categoryId =
            categoryId;
        }

        if (productType) {
          params.productType =
            productType;
        }

        const response =
          await api.get(
            "/products",
            {
              params,
            }
          );

        const result =
          response.data?.data || {};

        const list =
          result.products || [];

        setProducts(
          Array.isArray(list)
            ? list
            : []
        );

        const paging =
          result.pagination || {};

        setPagination({
          page:
            Number(
              paging.page
            ) || page,

          limit:
            Number(
              paging.limit
            ) || limit,

          total:
            Number(
              paging.total
            ) || 0,

          totalPages:
            Math.max(
              1,
              Number(
                paging.totalPages
              ) || 1
            ),
        });
      } catch (error) {
        console.error(
          "Products error:",
          error.response?.data ||
            error.message
        );

        setProducts([]);

        setError(
          getErrorMessage(
            error,
            "Unable to load products."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      limit,
      debouncedSearch,
      categoryId,
      productType,
    ]);

  // ====================================================
  // INITIAL REFERENCE DATA
  // ====================================================

  useEffect(() => {
    Promise.all([
      loadCategories(),
      loadInventory(),
    ]).catch((error) => {
      setError(
        getErrorMessage(
          error,
          "Unable to load product information."
        )
      );
    });
  }, [
    loadCategories,
    loadInventory,
  ]);

  // ====================================================
  // PRODUCT LOAD EFFECT
  // ====================================================

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        setError("");
        setSuccess("");

        await Promise.all([
          loadProducts(),
          loadInventory(),
          loadCategories(),
        ]);
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to refresh products."
          )
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ====================================================
  // BARCODE LOOKUP
  // ====================================================

  const handleBarcodeLookup =
    async (event) => {
      event?.preventDefault();

      const value =
        barcodeValue.trim();

      if (!value) {
        setError(
          "Scan or enter a barcode."
        );

        barcodeInputRef.current?.focus();

        return;
      }

      try {
        setBarcodeLoading(true);

        setError("");
        setSuccess("");

        const response =
          await api.get(
            `/products/barcode/${encodeURIComponent(
              value
            )}`
          );

        const product =
          response.data?.data
            ?.product;

        if (!product) {
          throw new Error(
            "Product was not returned."
          );
        }

        /*
         * Get fresh inventory for barcode
         * price/stock check.
         */

        await loadInventory();

        setSelectedProduct(
          product
        );

        setDetailsOpen(true);

        setBarcodeValue("");

        setSuccess(
          `${product.name} found successfully.`
        );
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Product not found for this barcode."
          )
        );
      } finally {
        setBarcodeLoading(false);

        barcodeInputRef.current?.focus();
      }
    };

  // ====================================================
  // PRODUCT DETAILS
  // ====================================================

  const openDetails =
    async (product) => {
      try {
        setSelectedProduct(
          product
        );

        setDetailsOpen(true);

        setDetailsLoading(true);

        setError("");

        const [
          productResponse,
          inventoryResponse,
        ] = await Promise.all([
          api.get(
            `/products/${product.id}`
          ),

          api.get(
            "/inventory",
            {
              params: {
                productId:
                  product.id,
              },
            }
          ),
        ]);

        const detailedProduct =
          productResponse.data?.data
            ?.product;

        const productInventories =
          inventoryResponse.data?.data
            ?.inventories || [];

        if (detailedProduct) {
          setSelectedProduct(
            detailedProduct
          );
        }

        /*
         * Merge freshly-loaded product
         * inventory into current map.
         */

        if (
          Array.isArray(
            productInventories
          ) &&
          productInventories.length >
            0
        ) {
          setInventories(
            (current) => {
              const newIds =
                new Set(
                  productInventories.map(
                    (item) =>
                      item.id
                  )
                );

              return [
                ...current.filter(
                  (item) =>
                    !newIds.has(
                      item.id
                    )
                ),

                ...productInventories,
              ];
            }
          );
        }
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load product details."
          )
        );
      } finally {
        setDetailsLoading(false);
      }
    };

  // ====================================================
  // CLOSE DETAILS
  // ====================================================

  const closeDetails = () => {
    setDetailsOpen(false);

    setSelectedProduct(null);
  };

  // ====================================================
  // LOCAL STOCK FILTER
  // ====================================================

  const visibleProducts =
    useMemo(() => {
      if (!stockFilter) {
        return products;
      }

      return products.filter(
        (product) => {
          const stock =
            getStockState(
              product
            );

          return (
            stock.status ===
            stockFilter
          );
        }
      );
    }, [
      products,
      stockFilter,
      inventoryMap,
    ]);

  // ====================================================
  // CURRENT PAGE STATS
  // ====================================================

  const stats =
    useMemo(() => {
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let notTracked = 0;

      products.forEach(
        (product) => {
          const stock =
            getStockState(
              product
            );

          if (
            stock.status === "IN"
          ) {
            inStock += 1;
          }

          if (
            stock.status === "LOW"
          ) {
            lowStock += 1;
          }

          if (
            stock.status === "OUT"
          ) {
            outOfStock += 1;
          }

          if (
            stock.status ===
            "NOT_TRACKED"
          ) {
            notTracked += 1;
          }
        }
      );

      return {
        inStock,
        lowStock,
        outOfStock,
        notTracked,
      };
    }, [
      products,
      inventoryMap,
    ]);

  // ====================================================
  // FILTER RESET
  // ====================================================

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setProductType("");
    setStockFilter("");
    setPage(1);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* =========================================
            HEADER
        ========================================== */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Package
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Products & Price Check
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Search products, check prices,
              barcode and current stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cashier/new-sale"
                )
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <ShoppingCart
                size={16}
              />

              New Sale
            </button>
          </div>
        </div>

        {/* =========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <p className="flex-1 text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X
                size={17}
                className="text-red-500"
              />
            </button>
          </div>
        )}

        {/* =========================================
            SUCCESS
        ========================================== */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="flex-1 text-sm font-medium text-emerald-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X
                size={17}
                className="text-emerald-600"
              />
            </button>
          </div>
        )}

        {/* =========================================
            BARCODE PRICE CHECK
        ========================================== */}

        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm lg:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr] lg:items-center">

            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ScanLine
                  size={21}
                />
              </div>

              <h2 className="mt-4 text-lg font-black text-slate-900">
                Quick Price Check
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Scan customer product barcode
                to instantly check price and
                stock availability.
              </p>
            </div>

            <form
              onSubmit={
                handleBarcodeLookup
              }
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Barcode
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  ref={barcodeInputRef}
                  autoFocus
                  type="text"
                  value={barcodeValue}
                  onChange={(event) =>
                    setBarcodeValue(
                      event.target.value
                    )
                  }
                  placeholder="Scan or enter barcode..."
                  className="h-14 w-full rounded-xl border border-blue-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={
                  barcodeLoading
                }
                className="flex h-14 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {barcodeLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Search
                    size={17}
                  />
                )}

                Check
              </button>
            </form>
          </div>
        </div>

        {/* =========================================
            STATS
        ========================================== */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-600">
              In Stock
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {stats.inStock}
            </p>

            <p className="mt-1 text-[10px] text-emerald-600">
              Current page
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-600">
              Low Stock
            </p>

            <p className="mt-2 text-2xl font-black text-amber-700">
              {stats.lowStock}
            </p>

            <p className="mt-1 text-[10px] text-amber-600">
              Current page
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-600">
              Out of Stock
            </p>

            <p className="mt-2 text-2xl font-black text-red-700">
              {stats.outOfStock}
            </p>

            <p className="mt-1 text-[10px] text-red-600">
              Current page
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-400">
              Active Products
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {pagination.total}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Total matching products
            </p>
          </div>
        </div>

        {/* =========================================
            FILTERS
        ========================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_180px_180px_auto]">

            {/* SEARCH */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search name, SKU, barcode or brand..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* CATEGORY */}

            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(
                  event.target.value
                );

                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
            >
              <option value="">
                ALL CATEGORIES
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            {/* PRODUCT TYPE */}

            <select
              value={productType}
              onChange={(event) => {
                setProductType(
                  event.target.value
                );

                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
            >
              {PRODUCT_TYPES.map(
                (type) => (
                  <option
                    key={
                      type ||
                      "ALL"
                    }
                    value={type}
                  >
                    {type ||
                      "ALL TYPES"}
                  </option>
                )
              )}
            </select>

            {/* STOCK */}

            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
            >
              <option value="">
                ALL STOCK
              </option>

              <option value="IN">
                IN STOCK
              </option>

              <option value="LOW">
                LOW STOCK
              </option>

              <option value="OUT">
                OUT OF STOCK
              </option>

              <option value="NOT_TRACKED">
                NOT TRACKED
              </option>
            </select>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* =========================================
            PRODUCTS
        ========================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[450px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading products...
                </p>
              </div>
            </div>
          ) : visibleProducts.length ===
            0 ? (
            <div className="flex min-h-[450px] items-center justify-center p-6 text-center">
              <div>
                <Package
                  size={46}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-black text-slate-700">
                  No Products Found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Try changing your product
                  filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">

                  {/* HEADER */}

                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">
                        Product
                      </th>

                      <th className="px-5 py-4">
                        Category
                      </th>

                      <th className="px-5 py-4">
                        Type
                      </th>

                      <th className="px-5 py-4">
                        Selling Unit
                      </th>

                      <th className="px-5 py-4">
                        Price
                      </th>

                      <th className="px-5 py-4">
                        Available
                      </th>

                      <th className="px-5 py-4">
                        Stock
                      </th>

                      <th className="px-5 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  {/* BODY */}

                  <tbody className="divide-y divide-slate-100">
                    {visibleProducts.map(
                      (product) => {
                        const stock =
                          getStockState(
                            product
                          );

                        const available =
                          getAvailableQuantity(
                            product
                          );

                        return (
                          <tr
                            key={
                              product.id
                            }
                            className="transition hover:bg-slate-50"
                          >
                            {/* PRODUCT */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                                  {product.imageUrl ? (
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
                                        19
                                      }
                                      className="text-slate-400"
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[240px] truncate text-sm font-black text-slate-800">
                                    {
                                      product.name
                                    }
                                  </p>

                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-400">
                                      {
                                        product.sku
                                      }
                                    </span>

                                    {product.barcode && (
                                      <>
                                        <span className="text-slate-300">
                                          ·
                                        </span>

                                        <span className="max-w-[120px] truncate text-xs text-slate-400">
                                          {
                                            product.barcode
                                          }
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {product.brand && (
                                    <p className="mt-1 text-[10px] font-semibold text-blue-500">
                                      {
                                        product.brand
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                {product
                                  ?.category
                                  ?.name ||
                                  "-"}
                              </span>
                            </td>

                            {/* TYPE */}

                            <td className="px-5 py-4">
                              <span className="text-xs font-bold text-slate-600">
                                {displayProductType(
                                  product.productType
                                )}
                              </span>
                            </td>

                            {/* UNIT */}

                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-slate-700">
                                {product
                                  ?.sellingUnit
                                  ?.name ||
                                  "-"}
                              </p>

                              <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                                {product
                                  ?.sellingUnit
                                  ?.symbol ||
                                  ""}
                              </p>
                            </td>

                            {/* PRICE */}

                            <td className="px-5 py-4">
                              <p className="text-base font-black text-slate-900">
                                {formatMoney(
                                  product.sellingPrice
                                )}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-400">
                                per{" "}
                                {product
                                  ?.sellingUnit
                                  ?.symbol ||
                                  "unit"}
                              </p>
                            </td>

                            {/* AVAILABLE */}

                            <td className="px-5 py-4">
                              {product.trackInventory ===
                              false ? (
                                <span className="text-sm font-bold text-slate-500">
                                  Unlimited
                                </span>
                              ) : (
                                <>
                                  <p className="text-sm font-black text-slate-800">
                                    {formatQuantity(
                                      available
                                    )}
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                                    {product
                                      ?.sellingUnit
                                      ?.symbol ||
                                      ""}
                                  </p>
                                </>
                              )}
                            </td>

                            {/* STOCK */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${stock.className}`}
                              >
                                {
                                  stock.label
                                }
                              </span>
                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDetails(
                                      product
                                    )
                                  }
                                  className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Eye
                                    size={
                                      15
                                    }
                                  />

                                  View
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

              {/* =====================================
                  PAGINATION
              ====================================== */}

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  Page{" "}
                  <strong>
                    {pagination.page}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      pagination.totalPages
                    }
                  </strong>
                  {" · "}
                  {pagination.total} products
                </p>

                <div className="flex gap-2">
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
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />

                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    Next

                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===============================================
          PRODUCT DETAIL / PRICE CHECK MODAL
      ================================================ */}

      {detailsOpen &&
        selectedProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                    Product Price Check
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      selectedProduct.name
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex min-h-[450px] items-center justify-center">
                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <ProductDetails
                  product={
                    selectedProduct
                  }
                  inventory={
                    inventoryMap[
                      selectedProduct.id
                    ] || null
                  }
                  getAvailableQuantity={
                    getAvailableQuantity
                  }
                  getStockState={
                    getStockState
                  }
                  navigate={
                    navigate
                  }
                  closeDetails={
                    closeDetails
                  }
                />
              )}
            </div>
          </div>
        )}
    </>
  );
};

// ======================================================
// PRODUCT DETAILS
// ======================================================

const ProductDetails = ({
  product,
  inventory,
  getAvailableQuantity,
  getStockState,
  navigate,
  closeDetails,
}) => {
  const available =
    getAvailableQuantity(
      product
    );

  const stock =
    getStockState(
      product
    );

  return (
    <div className="space-y-6 p-6">

      {/* ===============================================
          PRODUCT TOP
      ================================================ */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[180px_1fr]">

        {/* IMAGE */}

        <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package
              size={48}
              className="text-slate-300"
            />
          )}
        </div>

        {/* MAIN INFO */}

        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${stock.className}`}
            >
              {stock.label}
            </span>

            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
              {displayProductType(
                product.productType
              )}
            </span>
          </div>

          <h3 className="mt-3 text-2xl font-black text-slate-900">
            {product.name}
          </h3>

          {product.brand && (
            <p className="mt-1 text-sm font-bold text-blue-600">
              {product.brand}
            </p>
          )}

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selling Price
            </p>

            <p className="mt-1 text-3xl font-black text-slate-900">
              {formatMoney(
                product.sellingPrice
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              per{" "}
              {product?.sellingUnit
                ?.name ||
                "unit"}
              {product?.sellingUnit
                ?.symbol
                ? ` (${product.sellingUnit.symbol})`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ===============================================
          IDENTIFICATION
      ================================================ */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-2xl bg-slate-50 p-4">
          <Tag
            size={17}
            className="text-slate-400"
          />

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SKU
          </p>

          <p className="mt-1 break-all text-sm font-black text-slate-800">
            {product.sku || "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <Barcode
            size={17}
            className="text-slate-400"
          />

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Barcode
          </p>

          <p className="mt-1 break-all text-sm font-black text-slate-800">
            {product.barcode ||
              "Not Assigned"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <Layers3
            size={17}
            className="text-slate-400"
          />

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Category
          </p>

          <p className="mt-1 text-sm font-black text-slate-800">
            {product?.category
              ?.name || "-"}
          </p>
        </div>
      </div>

      {/* ===============================================
          INVENTORY
      ================================================ */}

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2">
          <Boxes
            size={18}
            className="text-blue-600"
          />

          <h3 className="font-black text-slate-900">
            Inventory Availability
          </h3>
        </div>

        {product.trackInventory ===
        false ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">
              Inventory tracking disabled
            </p>

            <p className="mt-1 text-xs text-slate-400">
              This product does not use
              stock quantity restrictions.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">

            {/* AVAILABLE */}

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase text-emerald-600">
                Available
              </p>

              <p className="mt-2 text-xl font-black text-emerald-700">
                {formatQuantity(
                  available
                )}
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                {product
                  ?.sellingUnit
                  ?.symbol ||
                  ""}
              </p>
            </div>

            {/* PHYSICAL */}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Base Stock
              </p>

              <p className="mt-2 text-xl font-black text-slate-800">
                {formatQuantity(
                  inventory?.quantity
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {product
                  ?.baseUnit
                  ?.symbol ||
                  ""}
              </p>
            </div>

            {/* RESERVED */}

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-[10px] font-bold uppercase text-amber-600">
                Reserved
              </p>

              <p className="mt-2 text-xl font-black text-amber-700">
                {formatQuantity(
                  inventory?.reservedQuantity
                )}
              </p>

              <p className="mt-1 text-xs text-amber-600">
                {product
                  ?.baseUnit
                  ?.symbol ||
                  ""}
              </p>
            </div>

            {/* REORDER */}

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase text-blue-600">
                Reorder Level
              </p>

              <p className="mt-2 text-xl font-black text-blue-700">
                {formatQuantity(
                  product.reorderLevel
                )}
              </p>

              <p className="mt-1 text-xs text-blue-600">
                {product
                  ?.baseUnit
                  ?.symbol ||
                  ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===============================================
          UNITS / TAX
      ================================================ */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Base Unit
          </p>

          <p className="mt-2 text-sm font-black text-slate-800">
            {product?.baseUnit
              ?.name || "-"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {product?.baseUnit
              ?.symbol || ""}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Selling Unit
          </p>

          <p className="mt-2 text-sm font-black text-slate-800">
            {product?.sellingUnit
              ?.name || "-"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Factor:{" "}
            {formatQuantity(
              product?.sellingUnit
                ?.conversionFactor ||
                1
            )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tax Rate
          </p>

          <p className="mt-2 text-sm font-black text-slate-800">
            {Number(
              product.taxRate || 0
            ).toFixed(2)}
            %
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Backend calculated
          </p>
        </div>
      </div>

      {/* ===============================================
          QUANTITY TYPE
      ================================================ */}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-700">
              Quantity Handling
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {product.allowFractionalQuantity
                ? "Fractional quantity allowed."
                : "Whole quantity only."}
            </p>
          </div>

          <span className="text-xs font-black text-blue-600">
            {product.allowFractionalQuantity
              ? "FRACTIONAL"
              : "WHOLE"}
          </span>
        </div>
      </div>

      {/* ===============================================
          DESCRIPTION
      ================================================ */}

      {product.description && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Description
          </p>

          <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {product.description}
          </p>
        </div>
      )}

      {/* ===============================================
          BUTTONS
      ================================================ */}

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={
            closeDetails
          }
          className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>

        <button
          type="button"
          onClick={() => {
            closeDetails();

            navigate(
              "/cashier/new-sale"
            );
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700"
        >
          <ShoppingCart
            size={16}
          />

          New Sale
        </button>
      </div>
    </div>
  );
};

export default Products;