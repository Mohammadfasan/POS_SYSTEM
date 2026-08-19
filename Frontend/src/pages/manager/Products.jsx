import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Package,
  Plus,
  Search,
  Eye,
  Pencil,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Barcode,
  Tags,
  Boxes,
  CircleCheck,
  CircleOff,
  Ban,
  ImageIcon,
  DollarSign,
  Scale,
  Save,
  Percent,
  Layers3,
  Hash,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const PRODUCT_TYPES = [
  "FIXED",
  "WEIGHT",
  "VOLUME",
  "LENGTH",
];

const PRODUCT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
];

// ======================================================
// EMPTY FORM
// ======================================================

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
  taxRate: "",
  reorderLevel: "",

  allowFractionalQuantity: false,
  trackInventory: true,

  categoryId: "",
  baseUnitId: "",
  sellingUnitId: "",
};

// ======================================================
// HELPERS
// ======================================================

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
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
// STATUS STYLE
// ======================================================

const getStatusStyle = (
  status
) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "INACTIVE":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "DISCONTINUED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

// ======================================================
// PRODUCTS PAGE
// ======================================================

const Products = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    units,
    setUnits,
  ] = useState([]);

  // ====================================================
  // LOADING
  // ====================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    statusLoadingId,
    setStatusLoadingId,
  ] = useState(null);

  // ====================================================
  // MESSAGE
  // ====================================================

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // ====================================================
  // FILTER
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
    categoryFilter,
    setCategoryFilter,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
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
  // CREATE / EDIT
  // ====================================================

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingProduct,
    setEditingProduct,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  // ====================================================
  // DETAILS
  // ====================================================

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  // ====================================================
  // LOAD CATEGORIES
  // ====================================================

  const loadCategories =
    async () => {
      try {
        const response =
          await api.get(
            "/categories"
          );

        const result =
          response.data?.data;

        const data =
          result?.categories ??
          result?.items ??
          result?.rows ??
          (Array.isArray(result)
            ? result
            : []);

        setCategories(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Category load error:",
          err.response?.data ||
            err.message
        );

        setCategories([]);
      }
    };

  // ====================================================
  // LOAD UNITS
  // ====================================================

  const loadUnits =
    async () => {
      try {
        const response =
          await api.get(
            "/units"
          );

        const result =
          response.data?.data;

        const data =
          result?.units ??
          result?.items ??
          result?.rows ??
          (Array.isArray(result)
            ? result
            : []);

        setUnits(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Unit load error:",
          err.response?.data ||
            err.message
        );

        setUnits([]);
      }
    };

  // ====================================================
  // FETCH PRODUCTS
  //
  // GET /products
  //
  // Controller supports:
  // page
  // limit
  // search
  // categoryId
  // productType
  // status
  // ====================================================

  const fetchProducts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (search) {
          params.search = search;
        }

        if (categoryFilter) {
          params.categoryId =
            categoryFilter;
        }

        if (typeFilter) {
          params.productType =
            typeFilter;
        }

        if (statusFilter) {
          params.status =
            statusFilter;
        }

        const response =
          await api.get(
            "/products",
            {
              params,
            }
          );

        console.log(
          "Manager Products:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.products ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeProducts =
          Array.isArray(data)
            ? data
            : [];

        setProducts(
          safeProducts
        );

        // ===============================================
        // PAGINATION
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
              safeProducts.length
          );

        const calculatedPages =
          Math.ceil(
            responseTotal /
              limit
          );

        const responsePages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        setTotal(
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeProducts.length
        );

        setTotalPages(
          Math.max(
            1,
            Number(
              responsePages
            ) || 1
          )
        );
      } catch (err) {
        console.error(
          "Product load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load products."
        );

        setProducts([]);
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
    loadCategories();
    loadUnits();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    page,
    limit,
    search,
    categoryFilter,
    typeFilter,
    statusFilter,
  ]);

  // ====================================================
  // GET CATEGORY
  // ====================================================

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

  // ====================================================
  // GET BASE UNIT
  // ====================================================

  const getBaseUnit = (
    product
  ) => {
    if (product?.baseUnit) {
      return product.baseUnit;
    }

    return units.find(
      (unit) =>
        unit.id ===
        product?.baseUnitId
    );
  };

  // ====================================================
  // GET SELLING UNIT
  // ====================================================

  const getSellingUnit = (
    product
  ) => {
    if (
      product?.sellingUnit
    ) {
      return product.sellingUnit;
    }

    return units.find(
      (unit) =>
        unit.id ===
        product?.sellingUnitId
    );
  };

  // ====================================================
  // GET UNIT NAME
  // ====================================================

  const getUnitName = (
    unit
  ) => {
    if (!unit) {
      return "—";
    }

    return (
      unit.name ??
      unit.code ??
      unit.symbol ??
      "—"
    );
  };

  // ====================================================
  // STOCK
  //
  // Product API may include inventory relation.
  // If not, display —.
  // ====================================================

  const getStockQuantity = (
    product
  ) => {
    if (
      product?.stockQuantity !==
      undefined
    ) {
      return Number(
        product.stockQuantity
      );
    }

    if (
      product?.quantity !==
      undefined
    ) {
      return Number(
        product.quantity
      );
    }

    if (
      Array.isArray(
        product?.inventories
      )
    ) {
      return product.inventories.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity ??
              item.stockQuantity ??
              0
          ),
        0
      );
    }

    if (
      product?.inventory
        ?.quantity !==
      undefined
    ) {
      return Number(
        product.inventory.quantity
      );
    }

    return null;
  };

  // ====================================================
  // STATS
  //
  // Current loaded page
  // ====================================================

  const activeCount =
    products.filter(
      (product) =>
        product.status ===
        "ACTIVE"
    ).length;

  const inactiveCount =
    products.filter(
      (product) =>
        product.status ===
        "INACTIVE"
    ).length;

  const discontinuedCount =
    products.filter(
      (product) =>
        product.status ===
        "DISCONTINUED"
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
  // RESET
  // ====================================================

  const resetFilters =
    () => {
      setSearchInput("");
      setSearch("");

      setCategoryFilter("");
      setTypeFilter("");
      setStatusFilter("");

      setPage(1);
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
      type,
      checked,
    } = event.target;

    setForm(
      (current) => ({
        ...current,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const openCreate = () => {
    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setSuccess("");

    setFormOpen(true);
  };

  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEdit =
    async (product) => {
      try {
        setEditingProduct(
          product
        );

        setFormOpen(true);
        setSaving(true);
        setError("");

        // Load latest product
        const response =
          await api.get(
            `/products/${product.id}`
          );

        const detailed =
          response.data?.data
            ?.product ??
          product;

        setEditingProduct(
          detailed
        );

        setForm({
          sku:
            detailed.sku ??
            "",

          barcode:
            detailed.barcode ??
            "",

          name:
            detailed.name ??
            "",

          description:
            detailed.description ??
            "",

          brand:
            detailed.brand ??
            "",

          imageUrl:
            detailed.imageUrl ??
            "",

          productType:
            detailed.productType ??
            "FIXED",

          costPrice:
            detailed.costPrice ??
            "",

          sellingPrice:
            detailed.sellingPrice ??
            "",

          taxRate:
            detailed.taxRate ??
            "",

          reorderLevel:
            detailed.reorderLevel ??
            "",

          allowFractionalQuantity:
            Boolean(
              detailed.allowFractionalQuantity
            ),

          trackInventory:
            detailed.trackInventory !==
            false,

          categoryId:
            detailed.categoryId ??
            detailed.category?.id ??
            "",

          baseUnitId:
            detailed.baseUnitId ??
            detailed.baseUnit?.id ??
            "",

          sellingUnitId:
            detailed.sellingUnitId ??
            detailed.sellingUnit?.id ??
            "",
        });
      } catch (err) {
        console.error(
          "Edit product load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load product."
        );

        setFormOpen(false);
        setEditingProduct(null);
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // CLOSE FORM
  // ====================================================

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);

    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // ====================================================
  // BUILD PAYLOAD
  // ====================================================

  const buildPayload = () => {
    const payload = {
      sku:
        form.sku.trim(),

      name:
        form.name.trim(),

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

    // ===============================================
    // OPTIONAL STRING
    // ===============================================

    if (
      form.description.trim()
    ) {
      payload.description =
        form.description.trim();
    }

    if (form.brand.trim()) {
      payload.brand =
        form.brand.trim();
    }

    // ===============================================
    // BARCODE
    //
    // Update schema supports null
    // ===============================================

    if (
      editingProduct
    ) {
      payload.barcode =
        form.barcode.trim() ||
        null;
    } else if (
      form.barcode.trim()
    ) {
      payload.barcode =
        form.barcode.trim();
    }

    // ===============================================
    // IMAGE
    // ===============================================

    if (
      editingProduct
    ) {
      payload.imageUrl =
        form.imageUrl.trim() ||
        null;
    } else if (
      form.imageUrl.trim()
    ) {
      payload.imageUrl =
        form.imageUrl.trim();
    }

    // ===============================================
    // OPTIONAL NUMBERS
    // ===============================================

    if (
      form.taxRate !== ""
    ) {
      payload.taxRate =
        Number(
          form.taxRate
        );
    }

    if (
      form.reorderLevel !==
      ""
    ) {
      payload.reorderLevel =
        Number(
          form.reorderLevel
        );
    }

    return payload;
  };

  // ====================================================
  // VALIDATE
  // ====================================================

  const validateForm = () => {
    if (
      form.sku.trim().length <
      2
    ) {
      return "SKU must contain at least 2 characters.";
    }

    if (
      form.name.trim().length <
      2
    ) {
      return "Product name must contain at least 2 characters.";
    }

    if (
      !PRODUCT_TYPES.includes(
        form.productType
      )
    ) {
      return "Please select a valid product type.";
    }

    if (
      form.costPrice === "" ||
      Number(
        form.costPrice
      ) < 0
    ) {
      return "Enter a valid cost price.";
    }

    if (
      form.sellingPrice ===
        "" ||
      Number(
        form.sellingPrice
      ) <= 0
    ) {
      return "Selling price must be greater than 0.";
    }

    if (
      form.taxRate !== "" &&
      (
        Number(
          form.taxRate
        ) < 0 ||
        Number(
          form.taxRate
        ) > 100
      )
    ) {
      return "Tax rate must be between 0 and 100.";
    }

    if (
      form.reorderLevel !==
        "" &&
      Number(
        form.reorderLevel
      ) < 0
    ) {
      return "Reorder level cannot be negative.";
    }

    if (!form.categoryId) {
      return "Please select a category.";
    }

    if (!form.baseUnitId) {
      return "Please select a base unit.";
    }

    if (
      !form.sellingUnitId
    ) {
      return "Please select a selling unit.";
    }

    return "";
  };

  // ====================================================
  // SAVE PRODUCT
  //
  // CREATE:
  // POST /products
  //
  // UPDATE:
  // PATCH /products/:id
  // ====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setError("");
        setSuccess("");

        const validation =
          validateForm();

        if (validation) {
          setError(validation);
          return;
        }

        setSaving(true);

        const payload =
          buildPayload();

        let response;

        if (editingProduct) {
          response =
            await api.patch(
              `/products/${editingProduct.id}`,
              payload
            );
        } else {
          response =
            await api.post(
              "/products",
              payload
            );
        }

        setSuccess(
          response.data?.message ||
            (editingProduct
              ? "Product updated successfully."
              : "Product created successfully.")
        );

        closeForm();

        await fetchProducts();
      } catch (err) {
        console.error(
          "Product save error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to save product."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // CHANGE STATUS
  //
  // PATCH /products/:id/status
  // ====================================================

  const handleStatusChange =
    async (
      product,
      status
    ) => {
      if (
        !PRODUCT_STATUSES.includes(
          status
        )
      ) {
        return;
      }

      try {
        setStatusLoadingId(
          product.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/products/${product.id}/status`,
            {
              status,
            }
          );

        setSuccess(
          response.data?.message ||
            "Product status updated."
        );

        setProducts(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                product.id
                  ? {
                      ...item,
                      status,
                    }
                  : item
            )
        );

        if (
          selectedProduct?.id ===
          product.id
        ) {
          setSelectedProduct(
            (current) => ({
              ...current,
              status,
            })
          );
        }
      } catch (err) {
        console.error(
          "Product status error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to update product status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /products/:id
  // ====================================================

  const openDetails =
    async (product) => {
      try {
        setSelectedProduct(
          product
        );

        setDetailsOpen(true);

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/products/${product.id}`
          );

        const detailed =
          response.data?.data
            ?.product ??
          product;

        setSelectedProduct(
          detailed
        );
      } catch (err) {
        console.error(
          "Product detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load product details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // PRODUCT IMAGE
  // ====================================================

  const ProductImage = ({
    product,
    size = "normal",
  }) => {
    const dimension =
      size === "large"
        ? "h-24 w-24"
        : "h-11 w-11";

    if (
      product?.imageUrl
    ) {
      return (
        <img
          src={
            product.imageUrl
          }
          alt={
            product.name
          }
          className={`${dimension} shrink-0 rounded-xl border border-slate-200 object-cover`}
          onError={(e) => {
            e.currentTarget.style.display =
              "none";
          }}
        />
      );
    }

    return (
      <div
        className={`${dimension} flex shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600`}
      >
        <Package
          size={
            size === "large"
              ? 35
              : 20
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
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products,
              pricing, units and
              availability.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              disabled={loading}
              onClick={
                fetchProducts
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
                openCreate
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus
                size={18}
              />

              Add Product
            </button>
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Products
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Package
                  size={22}
                />
              </div>
            </div>
          </div>

          {/* ACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {activeCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <CircleCheck
                size={23}
                className="text-emerald-500"
              />
            </div>
          </div>

          {/* INACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Inactive
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-600">
                  {inactiveCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <CircleOff
                size={23}
                className="text-slate-500"
              />
            </div>
          </div>

          {/* DISCONTINUED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Discontinued
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {
                    discontinuedCount
                  }
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <Ban
                size={23}
                className="text-red-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            PRODUCT TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}

          <div className="space-y-3 border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_1fr]">

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
                  placeholder="Search product name, SKU or barcode..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

              {/* CATEGORY */}

              <select
                value={
                  categoryFilter
                }
                onChange={(e) => {
                  setCategoryFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
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
                      {category.name}
                    </option>
                  )
                )}
              </select>

              {/* TYPE */}

              <select
                value={
                  typeFilter
                }
                onChange={(e) => {
                  setTypeFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Product Types
                </option>

                {PRODUCT_TYPES.map(
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

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* STATUS */}

              <select
                value={
                  statusFilter
                }
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
              >
                <option value="">
                  All Status
                </option>

                {PRODUCT_STATUSES.map(
                  (status) => (
                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >
                      {displayText(
                        status
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
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw
                  size={16}
                />

                Reset Filters
              </button>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={34}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading products...
                </p>
              </div>
            </div>
          ) : products.length ===
            0 ? (

            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Package
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-700">
                  No products found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Add or change your
                  filters.
                </p>
              </div>
            </div>
          ) : (

            /* TABLE */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

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
                      Stock
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

                  {products.map(
                    (product) => {
                      const category =
                        getCategory(
                          product
                        );

                      const unit =
                        getSellingUnit(
                          product
                        );

                      const stock =
                        getStockQuantity(
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

                              <ProductImage
                                product={
                                  product
                                }
                              />

                              <div className="min-w-0">

                                <p className="max-w-56 truncate text-sm font-semibold text-slate-800">

                                  {
                                    product.name
                                  }

                                </p>

                                {product.brand && (
                                  <p className="mt-1 max-w-56 truncate text-xs text-slate-400">

                                    {
                                      product.brand
                                    }

                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">

                            <p className="font-mono text-sm font-semibold text-slate-700">

                              {product.sku ||
                                "—"}

                            </p>

                            <p className="mt-1 max-w-40 truncate font-mono text-xs text-slate-400">

                              {product.barcode ||
                                "No Barcode"}

                            </p>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">

                            <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">

                              {category?.name ||
                                "—"}

                            </span>
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-4">

                            <span className="text-sm font-medium text-slate-600">

                              {displayText(
                                product.productType
                              )}

                            </span>
                          </td>

                          {/* UNIT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Scale
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="text-sm text-slate-600">

                                {getUnitName(
                                  unit
                                )}

                              </span>
                            </div>
                          </td>

                          {/* COST */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">

                            {formatMoney(
                              product.costPrice
                            )}

                          </td>

                          {/* SELLING */}

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-600">

                            {formatMoney(
                              product.sellingPrice
                            )}

                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4">

                            {stock ===
                            null ? (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            ) : (
                              <span
                                className={`font-bold ${
                                  stock <= 0
                                    ? "text-red-600"
                                    : product.reorderLevel !==
                                          null &&
                                      product.reorderLevel !==
                                          undefined &&
                                      stock <=
                                        Number(
                                          product.reorderLevel
                                        )
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {stock}
                              </span>
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                product.status ??
                                "ACTIVE"
                              }
                              disabled={
                                statusLoadingId ===
                                product.id
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  product,
                                  e.target.value
                                )
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${getStatusStyle(
                                product.status
                              )}`}
                            >
                              {PRODUCT_STATUSES.map(
                                (
                                  status
                                ) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {displayText(
                                      status
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                title="View product"
                                onClick={() =>
                                  openDetails(
                                    product
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                title="Edit product"
                                onClick={() =>
                                  openEdit(
                                    product
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Pencil
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
            products.length >
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
                    ({total} products)
                  </span>
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

                    <option value={100}>
                      100 / page
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
          CREATE / EDIT MODAL
      ================================================= */}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add New Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingProduct
                    ? "Update product information."
                    : "Create a new POS product."}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeForm
                }
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
              className="space-y-7 p-6"
            >

              {/* =========================================
                  BASIC
              ========================================== */}

              <div>

                <div className="mb-4">

                  <h3 className="font-bold text-slate-900">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Product identity and
                    description.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  {/* NAME */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Product Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      minLength={2}
                      maxLength={150}
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Fresh Milk 1L"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* SKU */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      SKU *
                    </label>

                    <input
                      type="text"
                      name="sku"
                      required
                      minLength={2}
                      maxLength={50}
                      value={
                        form.sku
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="MILK-001"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* BARCODE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Barcode
                    </label>

                    <div className="relative">

                      <Barcode
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="barcode"
                        maxLength={100}
                        value={
                          form.barcode
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="8901234567895"
                        className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* BRAND */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Brand
                    </label>

                    <input
                      type="text"
                      name="brand"
                      maxLength={100}
                      value={
                        form.brand
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Farm Fresh"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* CATEGORY */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category *
                    </label>

                    <select
                      name="categoryId"
                      required
                      value={
                        form.categoryId
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
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

                  {/* PRODUCT TYPE */}

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
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      {PRODUCT_TYPES.map(
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

                  {/* IMAGE */}

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Product Image URL
                    </label>

                    <div className="relative">

                      <ImageIcon
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="url"
                        name="imageUrl"
                        value={
                          form.imageUrl
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="https://example.com/product.jpg"
                        className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows={3}
                      maxLength={1000}
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter product description..."
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* =========================================
                  PRICING
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Pricing
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

                  {/* COST */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Cost Price *
                    </label>

                    <input
                      type="number"
                      name="costPrice"
                      required
                      min="0"
                      step="0.01"
                      value={
                        form.costPrice
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>

                  {/* SELLING */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Selling Price *
                    </label>

                    <input
                      type="number"
                      name="sellingPrice"
                      required
                      min="0.01"
                      step="0.01"
                      value={
                        form.sellingPrice
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>

                  {/* TAX */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tax Rate %
                    </label>

                    <input
                      type="number"
                      name="taxRate"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        form.taxRate
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>

                  {/* REORDER */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Reorder Level
                    </label>

                    <input
                      type="number"
                      name="reorderLevel"
                      min="0"
                      step="0.01"
                      value={
                        form.reorderLevel
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* =========================================
                  UNIT
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Unit Configuration
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                  {/* BASE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Base Unit *
                    </label>

                    <select
                      name="baseUnitId"
                      required
                      value={
                        form.baseUnitId
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="">
                        Select Base Unit
                      </option>

                      {units.map(
                        (unit) => (
                          <option
                            key={
                              unit.id
                            }
                            value={
                              unit.id
                            }
                          >
                            {unit.name ??
                              unit.code}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* SELLING */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Selling Unit *
                    </label>

                    <select
                      name="sellingUnitId"
                      required
                      value={
                        form.sellingUnitId
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="">
                        Select Selling Unit
                      </option>

                      {units.map(
                        (unit) => (
                          <option
                            key={
                              unit.id
                            }
                            value={
                              unit.id
                            }
                          >
                            {unit.name ??
                              unit.code}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* =========================================
                  INVENTORY SETTINGS
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Inventory Settings
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                  {/* TRACK */}

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">

                    <input
                      type="checkbox"
                      name="trackInventory"
                      checked={
                        form.trackInventory
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4"
                    />

                    <div>

                      <p className="font-semibold text-slate-700">
                        Track Inventory
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Maintain stock
                        quantity for this
                        product.
                      </p>
                    </div>
                  </label>

                  {/* FRACTION */}

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">

                    <input
                      type="checkbox"
                      name="allowFractionalQuantity"
                      checked={
                        form.allowFractionalQuantity
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4"
                    />

                    <div>

                      <p className="font-semibold text-slate-700">
                        Allow Fractional Quantity
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Example 0.5 KG or
                        1.25 L.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* =========================================
                  BUTTON
              ========================================== */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeForm
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : editingProduct ? (
                    <Save
                      size={17}
                    />
                  ) : (
                    <Plus
                      size={17}
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

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Product Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete product
                    information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedProduct(
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
                      product={
                        selectedProduct
                      }
                      size="large"
                    />

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-xl font-bold text-slate-900">

                          {
                            selectedProduct.name
                          }

                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            selectedProduct.status
                          )}`}
                        >
                          {displayText(
                            selectedProduct.status
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">

                        {selectedProduct.description ||
                          "No description provided."}

                      </p>

                      {selectedProduct.brand && (
                        <p className="mt-2 text-sm font-semibold text-purple-600">

                          Brand:{" "}
                          {
                            selectedProduct.brand
                          }

                        </p>
                      )}
                    </div>
                  </div>

                  {/* =======================================
                      IDS
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
                          {selectedProduct.sku}
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

                        <p className="break-all font-mono text-sm font-semibold text-slate-700">

                          {selectedProduct.barcode ||
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      PRODUCT INFO
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Product Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Category
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {getCategory(
                            selectedProduct
                          )?.name ||
                            "—"}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Product Type
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {displayText(
                            selectedProduct.productType
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Base Unit
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {getUnitName(
                            getBaseUnit(
                              selectedProduct
                            )
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Selling Unit
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {getUnitName(
                            getSellingUnit(
                              selectedProduct
                            )
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Track Inventory
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {selectedProduct.trackInventory
                            ? "Yes"
                            : "No"}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Fractional Qty
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {selectedProduct.allowFractionalQuantity
                            ? "Allowed"
                            : "Not Allowed"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      PRICING
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Pricing & Stock
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      <div className="rounded-xl bg-blue-50 p-4">

                        <p className="text-xs font-semibold uppercase text-blue-500">
                          Cost Price
                        </p>

                        <p className="mt-2 font-bold text-blue-700">

                          {formatMoney(
                            selectedProduct.costPrice
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 p-4">

                        <p className="text-xs font-semibold uppercase text-emerald-500">
                          Selling Price
                        </p>

                        <p className="mt-2 font-bold text-emerald-700">

                          {formatMoney(
                            selectedProduct.sellingPrice
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl bg-purple-50 p-4">

                        <p className="text-xs font-semibold uppercase text-purple-500">
                          Tax Rate
                        </p>

                        <p className="mt-2 font-bold text-purple-700">

                          {Number(
                            selectedProduct.taxRate ??
                              0
                          )}
                          %

                        </p>
                      </div>

                      <div className="rounded-xl bg-amber-50 p-4">

                        <p className="text-xs font-semibold uppercase text-amber-500">
                          Reorder Level
                        </p>

                        <p className="mt-2 font-bold text-amber-700">

                          {selectedProduct.reorderLevel ??
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      DATES
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs uppercase text-slate-400">
                        Created
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-700">

                        {formatDateTime(
                          selectedProduct.createdAt
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs uppercase text-slate-400">
                        Last Updated
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-700">

                        {formatDateTime(
                          selectedProduct.updatedAt
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      ACTION
                  ======================================== */}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

                    <select
                      value={
                        selectedProduct.status ??
                        "ACTIVE"
                      }
                      disabled={
                        statusLoadingId ===
                        selectedProduct.id
                      }
                      onChange={(e) =>
                        handleStatusChange(
                          selectedProduct,
                          e.target.value
                        )
                      }
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${getStatusStyle(
                        selectedProduct.status
                      )}`}
                    >
                      {PRODUCT_STATUSES.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {displayText(
                              status
                            )}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setDetailsOpen(
                          false
                        );

                        openEdit(
                          selectedProduct
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Pencil
                        size={17}
                      />

                      Edit Product
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default Products;