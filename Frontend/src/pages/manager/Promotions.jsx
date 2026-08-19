import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgePercent,
  Plus,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  CalendarDays,
  Package,
  Tags,
  ShoppingCart,
  Percent,
  Banknote,
  Clock3,
  CircleCheck,
  CircleOff,
  Zap,
  Target,
  Hash,
  Building2,
  FileText,
  Save,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const PROMOTION_STATUSES = [
  "ACTIVE",
  "INACTIVE",
];

const PROMOTION_SCOPES = [
  "CART",
  "PRODUCT",
  "CATEGORY",
];

const DISCOUNT_TYPES = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
];

// ======================================================
// EMPTY FORM
// ======================================================

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",

  discountType: "PERCENTAGE",
  scope: "CART",

  value: "",
  minPurchaseAmount: "0",
  maxDiscountAmount: "",

  autoApply: true,
  priority: "0",

  startAt: "",
  endAt: "",

  status: "ACTIVE",

  productId: "",
  categoryId: "",
};

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

// ======================================================
// DATE
// ======================================================

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

// ======================================================
// DISPLAY TEXT
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

// ======================================================
// GET STORED USER
// ======================================================

const getStoredUser = () => {
  try {
    const raw =
      localStorage.getItem(
        "user"
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ======================================================
// PROMOTIONS PAGE
// ======================================================

const Promotions = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    promotions,
    setPromotions,
  ] = useState([]);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  // ====================================================
  // LOADING
  // ====================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    referenceLoading,
    setReferenceLoading,
  ] = useState(false);

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
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    scopeFilter,
    setScopeFilter,
  ] = useState("");

  // ====================================================
  // CREATE MODAL
  // ====================================================

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_FORM,
  });

  // ====================================================
  // DETAILS MODAL
  // ====================================================

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    selectedPromotion,
    setSelectedPromotion,
  ] = useState(null);

  // ====================================================
  // MANAGER USER
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
  // EXTRACT ARRAY
  // ====================================================

  const extractArray = (
    response,
    keys = []
  ) => {
    const result =
      response?.data?.data;

    if (
      Array.isArray(result)
    ) {
      return result;
    }

    for (const key of keys) {
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
  // LOAD REFERENCE DATA
  //
  // Manager can access:
  // GET /products
  // GET /categories
  //
  // No /branches call here.
  // ====================================================

  const loadReferenceData =
    async () => {
      try {
        setReferenceLoading(
          true
        );

        const [
          productResult,
          categoryResult,
        ] =
          await Promise.allSettled([
            api.get(
              "/products",
              {
                params: {
                  page: 1,
                  limit: 100,
                  status: "ACTIVE",
                },
              }
            ),

            api.get(
              "/categories"
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
            "Promotion product reference error:",
            productResult.reason
              ?.response?.data ||
              productResult.reason
                ?.message
          );

          setProducts([]);
        }

        // ===============================================
        // CATEGORIES
        // ===============================================

        if (
          categoryResult.status ===
          "fulfilled"
        ) {
          const data =
            extractArray(
              categoryResult.value,
              [
                "categories",
                "items",
                "rows",
              ]
            );

          setCategories(data);
        } else {
          console.error(
            "Promotion category reference error:",
            categoryResult.reason
              ?.response?.data ||
              categoryResult.reason
                ?.message
          );

          setCategories([]);
        }
      } finally {
        setReferenceLoading(
          false
        );
      }
    };

  // ====================================================
  // FETCH PROMOTIONS
  //
  // GET /promotions
  //
  // Supported backend filters:
  // status
  // scope
  // ====================================================

  const fetchPromotions =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (statusFilter) {
          params.status =
            statusFilter;
        }

        if (scopeFilter) {
          params.scope =
            scopeFilter;
        }

        const response =
          await api.get(
            "/promotions",
            {
              params,
            }
          );

        console.log(
          "Manager Promotions:",
          response.data
        );

        const result =
          response.data?.data;

        const data =
          result?.promotions ??
          result?.items ??
          result?.rows ??
          response.data
            ?.promotions ??
          (Array.isArray(result)
            ? result
            : []);

        setPromotions(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Promotion load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load promotions."
        );

        setPromotions([]);
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

  useEffect(() => {
    fetchPromotions();
  }, [
    statusFilter,
    scopeFilter,
  ]);

  // ====================================================
  // LOCAL SEARCH
  //
  // Backend promotion list has no search query.
  // ====================================================

  const filteredPromotions =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return promotions;
      }

      return promotions.filter(
        (promotion) => {
          const target =
            promotion?.product
              ?.name ??
            promotion?.category
              ?.name ??
            promotion?.branch
              ?.name ??
            "";

          return [
            promotion.name,
            promotion.code,
            promotion.description,
            promotion.discountType,
            promotion.scope,
            target,
          ].some(
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
      promotions,
      search,
    ]);

  // ====================================================
  // STATISTICS
  // ====================================================

  const totalPromotions =
    promotions.length;

  const activePromotions =
    promotions.filter(
      (promotion) =>
        promotion.status ===
        "ACTIVE"
    ).length;

  const inactivePromotions =
    promotions.filter(
      (promotion) =>
        promotion.status ===
        "INACTIVE"
    ).length;

  const autoApplyCount =
    promotions.filter(
      (promotion) =>
        promotion.autoApply ===
        true
    ).length;

  // ====================================================
  // PRODUCT
  // ====================================================

  const getProduct = (
    promotion
  ) => {
    if (
      promotion?.product
    ) {
      return promotion.product;
    }

    return products.find(
      (product) =>
        product.id ===
        promotion?.productId
    );
  };

  // ====================================================
  // CATEGORY
  // ====================================================

  const getCategory = (
    promotion
  ) => {
    if (
      promotion?.category
    ) {
      return promotion.category;
    }

    return categories.find(
      (category) =>
        category.id ===
        promotion?.categoryId
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranchName = (
    promotion
  ) => {
    if (
      promotion?.branch?.name
    ) {
      return promotion.branch.name;
    }

    if (
      promotion?.branch?.code
    ) {
      return promotion.branch.code;
    }

    if (
      promotion?.branchId &&
      managerBranchId &&
      promotion.branchId ===
        managerBranchId
    ) {
      return managerBranchName;
    }

    if (
      promotion?.branchId
    ) {
      return "Branch Promotion";
    }

    return "Global / Auto Scope";
  };

  // ====================================================
  // DISCOUNT VALUE
  // ====================================================

  const getDiscountValue = (
    promotion
  ) => {
    if (
      promotion
        ?.discountType ===
      "PERCENTAGE"
    ) {
      return `${
        Number(
          promotion.value
        ) || 0
      }%`;
    }

    return formatMoney(
      promotion?.value
    );
  };

  // ====================================================
  // SCOPE TARGET
  // ====================================================

  const getScopeTarget = (
    promotion
  ) => {
    switch (
      promotion?.scope
    ) {
      case "PRODUCT":
        return (
          getProduct(promotion)
            ?.name ??
          "Product"
        );

      case "CATEGORY":
        return (
          getCategory(
            promotion
          )?.name ??
          "Category"
        );

      case "CART":
        return "Entire Cart";

      default:
        return "—";
    }
  };

  // ====================================================
  // SCOPE STYLE
  // ====================================================

  const getScopeStyle = (
    scope
  ) => {
    switch (scope) {
      case "CART":
        return {
          className:
            "bg-blue-50 text-blue-700",
          Icon:
            ShoppingCart,
        };

      case "PRODUCT":
        return {
          className:
            "bg-purple-50 text-purple-700",
          Icon:
            Package,
        };

      case "CATEGORY":
        return {
          className:
            "bg-amber-50 text-amber-700",
          Icon:
            Tags,
        };

      default:
        return {
          className:
            "bg-slate-100 text-slate-600",
          Icon:
            Target,
        };
    }
  };

  // ====================================================
  // STATUS STYLE
  // ====================================================

  const getStatusStyle = (
    status
  ) => {
    if (
      status === "ACTIVE"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
  };

  // ====================================================
  // TIME STATUS
  // ====================================================

  const getTimeStatus = (
    promotion
  ) => {
    const now =
      new Date();

    const start =
      promotion?.startAt
        ? new Date(
            promotion.startAt
          )
        : null;

    const end =
      promotion?.endAt
        ? new Date(
            promotion.endAt
          )
        : null;

    if (
      start &&
      !Number.isNaN(
        start.getTime()
      ) &&
      now < start
    ) {
      return {
        label: "Upcoming",
        className:
          "bg-blue-50 text-blue-700",
      };
    }

    if (
      end &&
      !Number.isNaN(
        end.getTime()
      ) &&
      now > end
    ) {
      return {
        label: "Expired",
        className:
          "bg-slate-100 text-slate-500",
      };
    }

    return {
      label: "Running",
      className:
        "bg-emerald-50 text-emerald-700",
    };
  };

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const openCreate =
    () => {
      setForm({
        ...EMPTY_FORM,
      });

      setError("");
      setSuccess("");

      setCreateOpen(true);
    };

  // ====================================================
  // CLOSE CREATE
  // ====================================================

  const closeCreate =
    () => {
      if (saving) {
        return;
      }

      setCreateOpen(false);

      setForm({
        ...EMPTY_FORM,
      });
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

    // ===============================================
    // SCOPE CHANGE
    // ===============================================

    if (
      name === "scope"
    ) {
      setForm(
        (current) => ({
          ...current,

          scope: value,

          productId: "",
          categoryId: "",
        })
      );

      return;
    }

    setForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : name === "code"
            ? value.toUpperCase()
            : value,
      })
    );
  };

  // ====================================================
  // VALIDATE
  // ====================================================

  const validateForm =
    () => {
      if (
        form.code
          .trim()
          .length < 2
      ) {
        throw new Error(
          "Promotion code must contain at least 2 characters."
        );
      }

      if (
        form.name
          .trim()
          .length < 2
      ) {
        throw new Error(
          "Promotion name must contain at least 2 characters."
        );
      }

      const value =
        Number(form.value);

      if (
        !Number.isFinite(
          value
        ) ||
        value <= 0
      ) {
        throw new Error(
          "Discount value must be greater than 0."
        );
      }

      if (
        form.discountType ===
          "PERCENTAGE" &&
        value > 100
      ) {
        throw new Error(
          "Percentage discount cannot exceed 100%."
        );
      }

      const minimum =
        Number(
          form.minPurchaseAmount
        );

      if (
        !Number.isFinite(
          minimum
        ) ||
        minimum < 0
      ) {
        throw new Error(
          "Minimum purchase amount cannot be negative."
        );
      }

      if (
        form.maxDiscountAmount !==
        ""
      ) {
        const maximum =
          Number(
            form.maxDiscountAmount
          );

        if (
          !Number.isFinite(
            maximum
          ) ||
          maximum <= 0
        ) {
          throw new Error(
            "Maximum discount amount must be greater than 0."
          );
        }
      }

      if (!form.startAt) {
        throw new Error(
          "Start date is required."
        );
      }

      if (!form.endAt) {
        throw new Error(
          "End date is required."
        );
      }

      const start =
        new Date(
          form.startAt
        );

      const end =
        new Date(
          form.endAt
        );

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {
        throw new Error(
          "Enter valid promotion dates."
        );
      }

      if (end <= start) {
        throw new Error(
          "End date must be after start date."
        );
      }

      if (
        form.scope ===
          "PRODUCT" &&
        !form.productId
      ) {
        throw new Error(
          "Please select a product."
        );
      }

      if (
        form.scope ===
          "CATEGORY" &&
        !form.categoryId
      ) {
        throw new Error(
          "Please select a category."
        );
      }
    };

  // ====================================================
  // BUILD PAYLOAD
  // ====================================================

  const buildPayload =
    () => {
      const payload = {
        code:
          form.code.trim(),

        name:
          form.name.trim(),

        discountType:
          form.discountType,

        scope:
          form.scope,

        value:
          Number(
            form.value
          ),

        minPurchaseAmount:
          Number(
            form.minPurchaseAmount
          ) || 0,

        autoApply:
          Boolean(
            form.autoApply
          ),

        priority:
          Number(
            form.priority
          ) || 0,

        startAt:
          new Date(
            form.startAt
          ).toISOString(),

        endAt:
          new Date(
            form.endAt
          ).toISOString(),

        status:
          form.status,
      };

      // ===============================================
      // DESCRIPTION
      // ===============================================

      if (
        form.description
          .trim()
      ) {
        payload.description =
          form.description.trim();
      }

      // ===============================================
      // MAX DISCOUNT
      // ===============================================

      if (
        form.maxDiscountAmount !==
        ""
      ) {
        payload.maxDiscountAmount =
          Number(
            form.maxDiscountAmount
          );
      }

      // ===============================================
      // MANAGER BRANCH
      //
      // No /branches API call.
      // If login user contains branchId,
      // send it automatically.
      // ===============================================

      if (managerBranchId) {
        payload.branchId =
          managerBranchId;
      }

      // ===============================================
      // PRODUCT TARGET
      // ===============================================

      if (
        form.scope ===
          "PRODUCT" &&
        form.productId
      ) {
        payload.productId =
          form.productId;
      }

      // ===============================================
      // CATEGORY TARGET
      // ===============================================

      if (
        form.scope ===
          "CATEGORY" &&
        form.categoryId
      ) {
        payload.categoryId =
          form.categoryId;
      }

      return payload;
    };

  // ====================================================
  // CREATE PROMOTION
  //
  // POST /promotions
  // ====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        validateForm();

        const payload =
          buildPayload();

        console.log(
          "Manager Promotion Payload:",
          payload
        );

        const response =
          await api.post(
            "/promotions",
            payload
          );

        setSuccess(
          response.data?.message ||
            "Promotion created successfully."
        );

        setCreateOpen(false);

        setForm({
          ...EMPTY_FORM,
        });

        await fetchPromotions();
      } catch (err) {
        console.error(
          "Create promotion error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to create promotion."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // STATUS CHANGE
  //
  // PATCH /promotions/:id/status
  // ====================================================

  const handleStatusChange =
    async (
      promotion,
      status
    ) => {
      try {
        setStatusLoadingId(
          promotion.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/promotions/${promotion.id}/status`,
            {
              status,
            }
          );

        setPromotions(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                promotion.id
                  ? {
                      ...item,
                      status,
                    }
                  : item
            )
        );

        if (
          selectedPromotion?.id ===
          promotion.id
        ) {
          setSelectedPromotion(
            (current) => ({
              ...current,
              status,
            })
          );
        }

        setSuccess(
          response.data?.message ||
            "Promotion status updated."
        );
      } catch (err) {
        console.error(
          "Promotion status error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to update promotion status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // ====================================================
  // DETAILS
  //
  // GET /promotions/:id
  // ====================================================

  const openDetails =
    async (promotion) => {
      try {
        setSelectedPromotion(
          promotion
        );

        setDetailsOpen(true);

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/promotions/${promotion.id}`
          );

        const detailed =
          response.data?.data
            ?.promotion ??
          response.data?.data ??
          promotion;

        setSelectedPromotion(
          detailed
        );
      } catch (err) {
        console.error(
          "Promotion detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load promotion details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // RESET FILTERS
  // ====================================================

  const resetFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      setScopeFilter("");
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
              Promotions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage
              promotional discounts
              for sales.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              disabled={
                loading ||
                referenceLoading
              }
              onClick={async () => {
                await Promise.all([
                  fetchPromotions(),
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

            <button
              type="button"
              onClick={
                openCreate
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />

              Add Promotion
            </button>
          </div>
        </div>

        {/* =================================================
            MANAGER BRANCH INFO
        ================================================= */}

        {managerBranchId && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

            <Building2
              size={18}
              className="shrink-0 text-blue-600"
            />

            <div>

              <p className="text-sm font-semibold text-blue-800">
                Manager Branch
              </p>

              <p className="mt-0.5 text-xs text-blue-600">
                New promotions will
                use{" "}
                {managerBranchName}.
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            KPI
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Promotions
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalPromotions}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <BadgePercent
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
                  {activePromotions}
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
                  {inactivePromotions}
                </p>
              </div>

              <CircleOff
                size={23}
                className="text-slate-500"
              />
            </div>
          </div>

          {/* AUTO */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Auto Apply
                </p>

                <p className="mt-2 text-2xl font-bold text-purple-600">
                  {autoApplyCount}
                </p>
              </div>

              <Zap
                size={23}
                className="text-purple-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            TABLE CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">

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
                  placeholder="Search promotion name, code or description..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* SCOPE */}

              <select
                value={
                  scopeFilter
                }
                onChange={(e) =>
                  setScopeFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Scopes
                </option>

                {PROMOTION_SCOPES.map(
                  (scope) => (
                    <option
                      key={scope}
                      value={scope}
                    >
                      {displayText(
                        scope
                      )}
                    </option>
                  )
                )}
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
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Status
                </option>

                {PROMOTION_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
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
                  Loading promotions...
                </p>
              </div>
            </div>
          ) : filteredPromotions.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <BadgePercent
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-700">
                  No promotions found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create a new
                  promotion or change
                  the filters.
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
                      Promotion
                    </th>

                    <th className="px-5 py-4">
                      Scope
                    </th>

                    <th className="px-5 py-4">
                      Target
                    </th>

                    <th className="px-5 py-4">
                      Discount
                    </th>

                    <th className="px-5 py-4">
                      Minimum
                    </th>

                    <th className="px-5 py-4">
                      Duration
                    </th>

                    <th className="px-5 py-4">
                      Auto Apply
                    </th>

                    <th className="px-5 py-4">
                      Period
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredPromotions.map(
                    (promotion) => {
                      const {
                        className,
                        Icon,
                      } =
                        getScopeStyle(
                          promotion.scope
                        );

                      const timeStatus =
                        getTimeStatus(
                          promotion
                        );

                      return (
                        <tr
                          key={
                            promotion.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* PROMOTION */}

                          <td className="px-5 py-4">

                            <div>

                              <p className="max-w-52 truncate font-semibold text-slate-800">
                                {
                                  promotion.name
                                }
                              </p>

                              <p className="mt-1 max-w-52 truncate font-mono text-xs font-bold text-blue-600">
                                {
                                  promotion.code
                                }
                              </p>
                            </div>
                          </td>

                          {/* SCOPE */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${className}`}
                            >
                              <Icon
                                size={14}
                              />

                              {displayText(
                                promotion.scope
                              )}
                            </span>
                          </td>

                          {/* TARGET */}

                          <td className="px-5 py-4">

                            <p className="max-w-44 truncate text-sm font-medium text-slate-700">

                              {getScopeTarget(
                                promotion
                              )}

                            </p>

                            {promotion.branchId && (
                              <p className="mt-1 max-w-44 truncate text-xs text-slate-400">

                                {getBranchName(
                                  promotion
                                )}

                              </p>
                            )}
                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              {promotion.discountType ===
                              "PERCENTAGE" ? (
                                <Percent
                                  size={16}
                                  className="text-purple-500"
                                />
                              ) : (
                                <Banknote
                                  size={16}
                                  className="text-emerald-500"
                                />
                              )}

                              <span className="whitespace-nowrap font-bold text-slate-900">

                                {getDiscountValue(
                                  promotion
                                )}

                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">

                              {displayText(
                                promotion.discountType
                              )}

                            </p>
                          </td>

                          {/* MIN */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">

                            {formatMoney(
                              promotion.minPurchaseAmount
                            )}

                          </td>

                          {/* DURATION */}

                          <td className="px-5 py-4">

                            <div className="space-y-1 whitespace-nowrap text-xs text-slate-500">

                              <p>
                                {formatDateTime(
                                  promotion.startAt
                                )}
                              </p>

                              <p>
                                to{" "}
                                {formatDateTime(
                                  promotion.endAt
                                )}
                              </p>
                            </div>
                          </td>

                          {/* AUTO */}

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                                promotion.autoApply
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {promotion.autoApply
                                ? "Yes"
                                : "No"}
                            </span>
                          </td>

                          {/* PERIOD */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${timeStatus.className}`}
                            >
                              <Clock3
                                size={13}
                              />

                              {
                                timeStatus.label
                              }
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                promotion.status ??
                                "ACTIVE"
                              }
                              disabled={
                                statusLoadingId ===
                                promotion.id
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  promotion,
                                  e.target.value
                                )
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${getStatusStyle(
                                promotion.status
                              )}`}
                            >

                              <option value="ACTIVE">
                                Active
                              </option>

                              <option value="INACTIVE">
                                Inactive
                              </option>
                            </select>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                title="View promotion"
                                onClick={() =>
                                  openDetails(
                                    promotion
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

          {/* COUNT */}

          {!loading &&
            filteredPromotions.length >
              0 && (
              <div className="border-t border-slate-200 px-5 py-4">

                <p className="text-sm text-slate-500">

                  Showing{" "}

                  <span className="font-semibold text-slate-800">
                    {
                      filteredPromotions.length
                    }
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {
                      promotions.length
                    }
                  </span>

                  {" "}promotions

                </p>
              </div>
            )}
        </div>
      </div>

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Create Promotion
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure promotion
                  discount, target and
                  active period.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeCreate
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

                <h3 className="font-bold text-slate-900">
                  Basic Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Promotion identity
                  and description.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* CODE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Promotion Code *
                    </label>

                    <div className="relative">

                      <Hash
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="code"
                        required
                        minLength={2}
                        maxLength={50}
                        value={
                          form.code
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="SUMMER20"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 uppercase outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* NAME */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Promotion Name *
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
                      placeholder="Weekend Special"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows={3}
                      maxLength={500}
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter promotion description..."
                      className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {
                        form.description
                          .length
                      }
                      /500
                    </p>
                  </div>
                </div>
              </div>

              {/* =========================================
                  DISCOUNT
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Discount Settings
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* TYPE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Discount Type *
                    </label>

                    <select
                      name="discountType"
                      value={
                        form.discountType
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    >

                      {DISCOUNT_TYPES.map(
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

                  {/* VALUE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      {form.discountType ===
                      "PERCENTAGE"
                        ? "Discount Percentage *"
                        : "Discount Amount *"}

                    </label>

                    <div className="relative">

                      {form.discountType ===
                      "PERCENTAGE" ? (
                        <Percent
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500"
                        />
                      ) : (
                        <Banknote
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}

                      <input
                        type="number"
                        name="value"
                        required
                        min="0.01"
                        max={
                          form.discountType ===
                          "PERCENTAGE"
                            ? "100"
                            : undefined
                        }
                        step="0.01"
                        value={
                          form.value
                        }
                        onChange={
                          handleChange
                        }
                        placeholder={
                          form.discountType ===
                          "PERCENTAGE"
                            ? "10"
                            : "500"
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* MINIMUM */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Minimum Purchase Amount
                    </label>

                    <input
                      type="number"
                      name="minPurchaseAmount"
                      min="0"
                      step="0.01"
                      value={
                        form.minPurchaseAmount
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                    />
                  </div>

                  {/* MAXIMUM */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Maximum Discount Amount
                    </label>

                    <input
                      type="number"
                      name="maxDiscountAmount"
                      min="0.01"
                      step="0.01"
                      value={
                        form.maxDiscountAmount
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Optional"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Useful mainly for
                      percentage
                      promotions.
                    </p>
                  </div>
                </div>
              </div>

              {/* =========================================
                  SCOPE
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Promotion Scope
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Choose where this
                  promotion should be
                  applied.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* SCOPE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Scope *
                    </label>

                    <select
                      name="scope"
                      value={
                        form.scope
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    >

                      <option value="CART">
                        Entire Cart
                      </option>

                      <option value="PRODUCT">
                        Specific Product
                      </option>

                      <option value="CATEGORY">
                        Specific Category
                      </option>
                    </select>
                  </div>

                  {/* CART INFO */}

                  {form.scope ===
                    "CART" && (
                    <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

                      <ShoppingCart
                        size={20}
                        className="shrink-0 text-blue-600"
                      />

                      <div>

                        <p className="text-sm font-semibold text-blue-800">
                          Entire Cart
                        </p>

                        <p className="mt-1 text-xs text-blue-600">
                          Promotion applies
                          to eligible cart
                          total.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PRODUCT */}

                  {form.scope ===
                    "PRODUCT" && (
                    <div>

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Product *
                      </label>

                      <select
                        name="productId"
                        required
                        value={
                          form.productId
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          referenceLoading
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
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
                              {product.name}
                              {product.sku
                                ? ` - ${product.sku}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )}

                  {/* CATEGORY */}

                  {form.scope ===
                    "CATEGORY" && (
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
                        disabled={
                          referenceLoading
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
                      >

                        <option value="">
                          Select Category
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
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================
                  PERIOD
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Promotion Period
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* START */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Start Date & Time *
                    </label>

                    <input
                      type="datetime-local"
                      name="startAt"
                      required
                      value={
                        form.startAt
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* END */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      End Date & Time *
                    </label>

                    <input
                      type="datetime-local"
                      name="endAt"
                      required
                      value={
                        form.endAt
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* =========================================
                  ADVANCED
              ========================================== */}

              <div className="border-t border-slate-200 pt-6">

                <h3 className="font-bold text-slate-900">
                  Advanced Settings
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* PRIORITY */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Priority
                    </label>

                    <input
                      type="number"
                      name="priority"
                      step="1"
                      value={
                        form.priority
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Higher priority can
                      be used when
                      multiple promotions
                      are eligible.
                    </p>
                  </div>

                  {/* STATUS */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Initial Status
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
                    >

                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>
                    </select>
                  </div>

                  {/* AUTO APPLY */}

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 md:col-span-2">

                    <input
                      type="checkbox"
                      name="autoApply"
                      checked={
                        form.autoApply
                      }
                      onChange={
                        handleChange
                      }
                      className="h-4 w-4"
                    />

                    <div className="flex items-center gap-3">

                      <Zap
                        size={19}
                        className="text-purple-600"
                      />

                      <div>

                        <p className="font-semibold text-slate-700">
                          Auto Apply Promotion
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Automatically
                          apply when sale
                          satisfies the
                          promotion rules.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* =========================================
                  ACTION
              ========================================== */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeCreate
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-44 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >

                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus
                      size={17}
                    />
                  )}

                  Create Promotion
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
        selectedPromotion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Promotion Details
                  </h2>

                  <p className="mt-1 font-mono text-sm font-bold text-blue-600">

                    {
                      selectedPromotion.code
                    }

                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedPromotion(
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
                      PROMOTION HEADER
                  ======================================== */}

                  <div className="rounded-2xl border border-slate-200 p-5">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                          <BadgePercent
                            size={23}
                          />
                        </div>

                        <div>

                          <h3 className="text-xl font-bold text-slate-900">

                            {
                              selectedPromotion.name
                            }

                          </h3>

                          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">

                            {selectedPromotion.description ||
                              "No description provided."}

                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          selectedPromotion.status
                        )}`}
                      >

                        {displayText(
                          selectedPromotion.status
                        )}

                      </span>
                    </div>
                  </div>

                  {/* =======================================
                      VALUE
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-xl bg-purple-50 p-4">

                      <p className="text-xs font-semibold uppercase text-purple-500">
                        Discount
                      </p>

                      <p className="mt-2 text-xl font-bold text-purple-700">

                        {getDiscountValue(
                          selectedPromotion
                        )}

                      </p>

                      <p className="mt-1 text-xs text-purple-500">

                        {displayText(
                          selectedPromotion.discountType
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 p-4">

                      <p className="text-xs font-semibold uppercase text-blue-500">
                        Scope
                      </p>

                      <p className="mt-2 font-bold text-blue-700">

                        {displayText(
                          selectedPromotion.scope
                        )}

                      </p>

                      <p className="mt-1 text-xs text-blue-500">

                        {getScopeTarget(
                          selectedPromotion
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">

                      <p className="text-xs font-semibold uppercase text-emerald-500">
                        Auto Apply
                      </p>

                      <p className="mt-2 font-bold text-emerald-700">

                        {selectedPromotion.autoApply
                          ? "Enabled"
                          : "Disabled"}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      AMOUNTS
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Discount Rules
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Minimum Purchase
                        </p>

                        <p className="mt-2 font-bold text-slate-800">

                          {formatMoney(
                            selectedPromotion.minPurchaseAmount
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Max Discount
                        </p>

                        <p className="mt-2 font-bold text-slate-800">

                          {selectedPromotion.maxDiscountAmount !==
                            null &&
                          selectedPromotion.maxDiscountAmount !==
                            undefined
                            ? formatMoney(
                                selectedPromotion.maxDiscountAmount
                              )
                            : "No Limit"}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Priority
                        </p>

                        <p className="mt-2 font-bold text-slate-800">

                          {selectedPromotion.priority ??
                            0}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      TARGET
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Promotion Target
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Applies To
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">

                          {getScopeTarget(
                            selectedPromotion
                          )}

                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Branch
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Building2
                            size={16}
                            className="text-blue-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {getBranchName(
                              selectedPromotion
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      PERIOD
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Promotion Period
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Starts At
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CalendarDays
                            size={16}
                            className="text-emerald-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedPromotion.startAt
                            )}

                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Ends At
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CalendarDays
                            size={16}
                            className="text-red-500"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedPromotion.endAt
                            )}

                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">

                      {(() => {
                        const time =
                          getTimeStatus(
                            selectedPromotion
                          );

                        return (
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${time.className}`}
                          >
                            <Clock3
                              size={14}
                            />

                            {
                              time.label
                            }
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* =======================================
                      IDS
                  ======================================== */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Promotion ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">

                      {selectedPromotion.id ??
                        "—"}

                    </p>
                  </div>

                  {/* =======================================
                      STATUS ACTION
                  ======================================== */}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-sm font-semibold text-slate-700">
                        Promotion Status
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Enable or disable
                        this promotion.
                      </p>
                    </div>

                    <select
                      value={
                        selectedPromotion.status ??
                        "ACTIVE"
                      }
                      disabled={
                        statusLoadingId ===
                        selectedPromotion.id
                      }
                      onChange={(e) =>
                        handleStatusChange(
                          selectedPromotion,
                          e.target.value
                        )
                      }
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none ${getStatusStyle(
                        selectedPromotion.status
                      )}`}
                    >

                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default Promotions;