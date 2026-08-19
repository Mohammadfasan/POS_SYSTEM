import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Package,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

import api from "../../api/axios";

const EMPTY_FORM = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  brand: "",
  imageUrl: "",

  productType: "FIXED",

  costPrice: "",
  sellingPrice: "",

  taxRate: "0",
  reorderLevel: "0",

  allowFractionalQuantity: false,
  trackInventory: true,

  categoryId: "",
  baseUnitId: "",
  sellingUnitId: "",
};

const PRODUCT_TYPES = [
  {
    value: "FIXED",
    label: "Fixed / Count",
    measurementType: "COUNT",
  },
  {
    value: "WEIGHT",
    label: "Weight",
    measurementType: "WEIGHT",
  },
  {
    value: "VOLUME",
    label: "Volume",
    measurementType: "VOLUME",
  },
  {
    value: "LENGTH",
    label: "Length",
    measurementType: "LENGTH",
  },
];

const Products = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [statusLoadingId, setStatusLoadingId] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productResponse,
        categoryResponse,
        unitResponse,
      ] = await Promise.all([
        api.get("/products", {
          params: {
            page: 1,
            limit: 100,
          },
        }),

        api.get("/categories", {
          params: {
            status: "ACTIVE",
          },
        }),

        api.get("/units", {
          params: {
            status: "ACTIVE",
          },
        }),
      ]);

      console.log(
        "Products:",
        productResponse.data
      );

      console.log(
        "Categories:",
        categoryResponse.data
      );

      console.log(
        "Units:",
        unitResponse.data
      );

      // -----------------------------------------
      // PRODUCTS
      // -----------------------------------------

      const productResult =
        productResponse.data?.data;

      const productData =
        productResult?.products ??
        productResult?.items ??
        productResult?.rows ??
        (Array.isArray(productResult)
          ? productResult
          : []);

      setProducts(
        Array.isArray(productData)
          ? productData
          : []
      );

      // -----------------------------------------
      // CATEGORIES
      // -----------------------------------------

      const categoryData =
        categoryResponse.data?.data
          ?.categories ?? [];

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );

      // -----------------------------------------
      // UNITS
      // -----------------------------------------

      const unitData =
        unitResponse.data?.data
          ?.units ?? [];

      setUnits(
        Array.isArray(unitData)
          ? unitData
          : []
      );
    } catch (error) {
      console.error(
        "Product page load error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to load product data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const getCategory = (
    product
  ) => {
    if (product?.category) {
      return product.category;
    }

    return categories.find(
      (category) =>
        category.id ===
        product?.categoryId
    );
  };

  const getUnit = (
    unitId,
    productUnit
  ) => {
    if (productUnit) {
      return productUnit;
    }

    return units.find(
      (unit) =>
        unit.id === unitId
    );
  };

  const getSellingUnit = (
    product
  ) => {
    return getUnit(
      product?.sellingUnitId,
      product?.sellingUnit
    );
  };

  const getBaseUnit = (
    product
  ) => {
    return getUnit(
      product?.baseUnitId,
      product?.baseUnit
    );
  };

  const formatMoney = (
    amount
  ) => {
    return new Intl.NumberFormat(
      "en-LK",
      {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
      }
    ).format(
      Number(amount) || 0
    );
  };

  // =====================================================
  // FILTERED UNITS FOR PRODUCT TYPE
  // =====================================================

  const selectedProductType =
    PRODUCT_TYPES.find(
      (item) =>
        item.value ===
        form.productType
    );

  const requiredMeasurementType =
    selectedProductType?.measurementType;

  const availableUnits =
    units.filter(
      (unit) =>
        unit.measurementType ===
        requiredMeasurementType
    );

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const category =
            getCategory(product);

          const matchesSearch =
            !keyword ||
            product.name
              ?.toLowerCase()
              .includes(keyword) ||
            product.sku
              ?.toLowerCase()
              .includes(keyword) ||
            product.barcode
              ?.toLowerCase()
              .includes(keyword) ||
            product.brand
              ?.toLowerCase()
              .includes(keyword);

          const matchesCategory =
            !categoryFilter ||
            product.categoryId ===
              categoryFilter ||
            category?.id ===
              categoryFilter;

          const matchesType =
            !typeFilter ||
            product.productType ===
              typeFilter;

          const matchesStatus =
            !statusFilter ||
            product.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesType &&
            matchesStatus
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
      typeFilter,
      statusFilter,
      categories,
    ]);

  // =====================================================
  // OPEN CREATE
  // =====================================================

  const openCreateModal = () => {
    setEditingProduct(null);

    setForm(EMPTY_FORM);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (
    product
  ) => {
    setEditingProduct(product);

    setForm({
      sku:
        product.sku || "",

      barcode:
        product.barcode || "",

      name:
        product.name || "",

      description:
        product.description || "",

      brand:
        product.brand || "",

      imageUrl:
        product.imageUrl || "",

      productType:
        product.productType ||
        "FIXED",

      costPrice:
        product.costPrice ?? "",

      sellingPrice:
        product.sellingPrice ?? "",

      taxRate:
        product.taxRate ?? "0",

      reorderLevel:
        product.reorderLevel ?? "0",

      allowFractionalQuantity:
        Boolean(
          product.allowFractionalQuantity
        ),

      trackInventory:
        product.trackInventory !==
        false,

      categoryId:
        product.categoryId ||
        product.category?.id ||
        "",

      baseUnitId:
        product.baseUnitId ||
        product.baseUnit?.id ||
        "",

      sellingUnitId:
        product.sellingUnitId ||
        product.sellingUnit?.id ||
        "",
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // =====================================================
  // CLOSE
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    if (
      name === "productType"
    ) {
      const fractional =
        value === "WEIGHT" ||
        value === "VOLUME" ||
        value === "LENGTH";

      setForm((current) => ({
        ...current,

        productType: value,

        baseUnitId: "",
        sellingUnitId: "",

        allowFractionalQuantity:
          fractional,
      }));

      return;
    }

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : name === "sku"
          ? value.toUpperCase()
          : value,
    }));
  };

  // =====================================================
  // PAYLOAD
  // =====================================================

  const buildPayload = () => {
    return {
      sku:
        form.sku.trim(),

      barcode:
        form.barcode.trim() ||
        undefined,

      name:
        form.name.trim(),

      description:
        form.description.trim() ||
        undefined,

      brand:
        form.brand.trim() ||
        undefined,

      imageUrl:
        form.imageUrl.trim() ||
        undefined,

      productType:
        form.productType,

      costPrice:
        Number(
          form.costPrice
        ),

      sellingPrice:
        Number(
          form.sellingPrice
        ),

      taxRate:
        form.taxRate === ""
          ? undefined
          : Number(
              form.taxRate
            ),

      reorderLevel:
        form.reorderLevel === ""
          ? undefined
          : Number(
              form.reorderLevel
            ),

      allowFractionalQuantity:
        Boolean(
          form.allowFractionalQuantity
        ),

      trackInventory:
        Boolean(
          form.trackInventory
        ),

      categoryId:
        form.categoryId,

      baseUnitId:
        form.baseUnitId,

      sellingUnitId:
        form.sellingUnitId,
    };
  };

  // =====================================================
  // SAVE PRODUCT
  // =====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (
        !form.categoryId ||
        !form.baseUnitId ||
        !form.sellingUnitId
      ) {
        throw new Error(
          "Category, base unit and selling unit are required."
        );
      }

      const payload =
        buildPayload();

      console.log(
        "Product Payload:",
        payload
      );

      if (editingProduct) {
        await api.patch(
          `/products/${editingProduct.id}`,
          payload
        );

        setSuccess(
          "Product updated successfully."
        );
      } else {
        await api.post(
          "/products",
          payload
        );

        setSuccess(
          "Product created successfully."
        );
      }

      await loadData();

      setModalOpen(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(
        "Product save error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data
          ?.message ||
          error.message ||
          "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const handleStatusChange =
    async (
      product,
      newStatus
    ) => {
      try {
        setStatusLoadingId(
          product.id
        );

        setError("");
        setSuccess("");

        await api.patch(
          `/products/${product.id}/status`,
          {
            status:
              newStatus,
          }
        );

        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                product.id
                  ? {
                      ...item,
                      status:
                        newStatus,
                    }
                  : item
            )
        );

        setSuccess(
          `${product.name} changed to ${newStatus}.`
        );
      } catch (error) {
        console.error(
          "Status update error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data
            ?.message ||
            "Unable to update product status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // =====================================================
  // RESET FILTER
  // =====================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setStatusFilter("");
  };

  // =====================================================
  // STATS
  // =====================================================

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (product) =>
        product.status ===
        "ACTIVE"
    ).length;

  const inactiveProducts =
    products.filter(
      (product) =>
        product.status ===
        "INACTIVE"
    ).length;

  const discontinuedProducts =
    products.filter(
      (product) =>
        product.status ===
        "DISCONTINUED"
    ).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ========================================
            SUCCESS MESSAGE
        ========================================= */}

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

        {/* ========================================
            ERROR
        ========================================= */}

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

        {/* ========================================
            PAGE HEADER
        ========================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage product details,
              pricing, categories and
              selling units.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />

            Add Product
          </button>
        </div>

        {/* ========================================
            STAT CARDS
        ========================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Products
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {activeProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {inactiveProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Discontinued
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {
                discontinuedProducts
              }
            </p>
          </div>
        </div>

        {/* ========================================
            PRODUCT TABLE CARD
        ========================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}

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
                  placeholder="Search by name, SKU, barcode or brand..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* CATEGORY */}

              <select
                value={
                  categoryFilter
                }
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Categories
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
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>

              {/* TYPE */}

              <select
                value={
                  typeFilter
                }
                onChange={(e) =>
                  setTypeFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Types
                </option>

                <option value="FIXED">
                  Fixed
                </option>

                <option value="WEIGHT">
                  Weight
                </option>

                <option value="VOLUME">
                  Volume
                </option>

                <option value="LENGTH">
                  Length
                </option>
              </select>

              {/* STATUS */}

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Status
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

                <option value="DISCONTINUED">
                  Discontinued
                </option>
              </select>

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

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading products...
                </p>
              </div>
            </div>
          ) : filteredProducts.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No products found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create your first
                  product.
                </p>
              </div>
            </div>
          ) : (
            /* TABLE */

            <div className="overflow-x-auto">

              <table className="w-full">

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
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Selling Unit
                    </th>

                    <th className="px-5 py-4">
                      Cost
                    </th>

                    <th className="px-5 py-4">
                      Selling Price
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

                  {filteredProducts.map(
                    (product) => {
                      const category =
                        getCategory(
                          product
                        );

                      const sellingUnit =
                        getSellingUnit(
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

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">

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
                                      21
                                    }
                                    className="text-slate-400"
                                  />
                                )}
                              </div>

                              <div className="min-w-0">

                                <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {product.brand ||
                                    "No brand"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-medium text-slate-700">
                              {
                                product.sku
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {product.barcode ||
                                "No barcode"}
                            </p>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {category?.name ||
                                "—"}
                            </span>
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {
                                product.productType
                              }
                            </span>
                          </td>

                          {/* UNIT */}

                          <td className="px-5 py-4 text-sm text-slate-600">

                            {sellingUnit ? (
                              <>
                                <span className="font-medium text-slate-700">
                                  {
                                    sellingUnit.name
                                  }
                                </span>

                                <span className="ml-1 text-slate-400">
                                  (
                                  {
                                    sellingUnit.symbol
                                  }
                                  )
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* COST */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatMoney(
                              product.costPrice
                            )}
                          </td>

                          {/* SELLING PRICE */}

                          <td className="px-5 py-4">

                            <p className="font-bold text-emerald-600">
                              {formatMoney(
                                product.sellingPrice
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              per{" "}
                              {sellingUnit?.symbol ||
                                "unit"}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                product.status ||
                                "ACTIVE"
                              }
                              disabled={
                                statusLoadingId ===
                                product.id
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  product,
                                  e.target
                                    .value
                                )
                              }
                              className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold outline-none ${
                                product.status ===
                                "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : product.status ===
                                    "DISCONTINUED"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="INACTIVE">
                                INACTIVE
                              </option>

                              <option value="DISCONTINUED">
                                DISCONTINUED
                              </option>
                            </select>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Pencil
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

      {/* =================================================
          ADD / EDIT PRODUCT MODAL
      ================================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure product
                  information, pricing
                  and units.
                </p>
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
              className="p-6"
            >
              {/* ==========================================
                  BASIC INFORMATION
              =========================================== */}

              <div>
                <h3 className="font-bold text-slate-900">
                  Basic Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Main product details.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* PRODUCT NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Product Name *
                    </label>

                    <input
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      required
                      minLength={2}
                      maxLength={150}
                      placeholder="White Sugar"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* SKU */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      SKU *
                    </label>

                    <input
                      name="sku"
                      value={
                        form.sku
                      }
                      onChange={
                        handleChange
                      }
                      required
                      minLength={2}
                      maxLength={50}
                      placeholder="SUGAR-001"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* BARCODE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Barcode
                    </label>

                    <input
                      name="barcode"
                      value={
                        form.barcode
                      }
                      onChange={
                        handleChange
                      }
                      maxLength={100}
                      placeholder="Optional"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* BRAND */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Brand
                    </label>

                    <input
                      name="brand"
                      value={
                        form.brand
                      }
                      onChange={
                        handleChange
                      }
                      maxLength={100}
                      placeholder="Optional brand"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category *
                    </label>

                    <select
                      name="categoryId"
                      value={
                        form.categoryId
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">
                        Select Category
                      </option>

                      {categories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* TYPE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Product Type *
                    </label>

                    <select
                      name="productType"
                      value={
                        form.productType
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    >
                      {PRODUCT_TYPES.map(
                        (type) => (
                          <option
                            key={
                              type.value
                            }
                            value={
                              type.value
                            }
                          >
                            {
                              type.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows={3}
                    maxLength={1000}
                    placeholder="Product description..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* IMAGE */}

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Image URL
                  </label>

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">

                      {form.imageUrl ? (
                        <img
                          src={
                            form.imageUrl
                          }
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={20}
                          className="text-slate-400"
                        />
                      )}
                    </div>

                    <input
                      type="url"
                      name="imageUrl"
                      value={
                        form.imageUrl
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  UNIT SETTINGS
              =========================================== */}

              <div>
                <h3 className="font-bold text-slate-900">
                  Measurement & Units
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Available units are
                  automatically filtered
                  based on product type.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* BASE UNIT */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Base Unit *
                    </label>

                    <select
                      name="baseUnitId"
                      value={
                        form.baseUnitId
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">
                        Select Base Unit
                      </option>

                      {availableUnits.map(
                        (unit) => (
                          <option
                            key={
                              unit.id
                            }
                            value={
                              unit.id
                            }
                          >
                            {unit.name} (
                            {unit.symbol}) -
                            Factor{" "}
                            {
                              unit.conversionFactor
                            }
                            {unit.isBase
                              ? " - Base"
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* SELLING UNIT */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Selling Unit *
                    </label>

                    <select
                      name="sellingUnitId"
                      value={
                        form.sellingUnitId
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">
                        Select Selling Unit
                      </option>

                      {availableUnits.map(
                        (unit) => (
                          <option
                            key={
                              unit.id
                            }
                            value={
                              unit.id
                            }
                          >
                            {unit.name} (
                            {unit.symbol})
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {availableUnits.length ===
                  0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    No active{" "}
                    {
                      requiredMeasurementType
                    }{" "}
                    units found. Create
                    them from Unit
                    Management first.
                  </div>
                )}

                {/* FRACTIONAL */}

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">

                    <input
                      type="checkbox"
                      name="allowFractionalQuantity"
                      checked={
                        form.allowFractionalQuantity
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        form.productType ===
                        "FIXED"
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Allow Fractional
                        Quantity
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Example: 0.5 kg,
                        0.75 L or 1.25 m.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">

                    <input
                      type="checkbox"
                      name="trackInventory"
                      checked={
                        form.trackInventory
                      }
                      onChange={
                        handleChange
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Track Inventory
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Enable stock
                        tracking for this
                        product.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  PRICING
              =========================================== */}

              <div>
                <h3 className="font-bold text-slate-900">
                  Pricing & Stock Rules
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* COST */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Cost Price (LKR) *
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="costPrice"
                      value={
                        form.costPrice
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="350.00"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* SELLING */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Selling Price (LKR) *
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      name="sellingPrice"
                      value={
                        form.sellingPrice
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="400.00"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* TAX */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tax Rate %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      name="taxRate"
                      value={
                        form.taxRate
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* REORDER */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Reorder Level
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      name="reorderLevel"
                      value={
                        form.reorderLevel
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      System can use this
                      value for low-stock
                      alerts.
                    </p>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  BUTTONS
              =========================================== */}

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">

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
                  disabled={
                    saving ||
                    availableUnits.length ===
                      0
                  }
                  className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;