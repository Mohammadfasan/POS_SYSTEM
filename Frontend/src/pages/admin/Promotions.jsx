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
  CalendarDays,
  Building2,
  Package,
  Tags,
  ShoppingCart,
  Percent,
  Banknote,
  Clock3,
} from "lucide-react";

import api from "../../api/axios";

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

  branchId: "",
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
  ).format(Number(value) || 0);
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

const displayText = (value) => {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

// ======================================================
// PAGE
// ======================================================

const Promotions = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [
    promotions,
    setPromotions,
  ] = useState([]);

  const [branches, setBranches] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    statusLoadingId,
    setStatusLoadingId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    scopeFilter,
    setScopeFilter,
  ] = useState("");

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const [
    detailModalOpen,
    setDetailModalOpen,
  ] = useState(false);

  const [
    selectedPromotion,
    setSelectedPromotion,
  ] = useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  // ====================================================
  // LOAD REFERENCE DATA
  // ====================================================

  const loadReferenceData =
    async () => {
      try {
        const [
          branchResponse,
          productResponse,
          categoryResponse,
        ] = await Promise.all([
          api.get("/branches"),

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
            "/categories",
            {
              params: {
                status: "ACTIVE",
              },
            }
          ),
        ]);

        // ===============================================
        // BRANCHES
        // ===============================================

        const branchResult =
          branchResponse.data?.data;

        const branchData =
          branchResult?.branches ??
          branchResponse.data
            ?.branches ??
          (Array.isArray(
            branchResult
          )
            ? branchResult
            : []);

        setBranches(
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );

        // ===============================================
        // PRODUCTS
        // ===============================================

        const productResult =
          productResponse.data?.data;

        const productData =
          productResult?.products ??
          productResult?.items ??
          productResult?.rows ??
          (Array.isArray(
            productResult
          )
            ? productResult
            : []);

        setProducts(
          Array.isArray(
            productData
          )
            ? productData
            : []
        );

        // ===============================================
        // CATEGORIES
        // ===============================================

        const categoryResult =
          categoryResponse.data?.data;

        const categoryData =
          categoryResult?.categories ??
          (Array.isArray(
            categoryResult
          )
            ? categoryResult
            : []);

        setCategories(
          Array.isArray(
            categoryData
          )
            ? categoryData
            : []
        );
      } catch (err) {
        console.error(
          "Promotion reference data error:",
          err.response?.data ||
            err.message
        );
      }
    };

  // ====================================================
  // LOAD PROMOTIONS
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
          "Promotions Response:",
          response.data
        );

        const result =
          response.data?.data;

        const promotionData =
          result?.promotions ??
          response.data
            ?.promotions ??
          (Array.isArray(result)
            ? result
            : []);

        setPromotions(
          Array.isArray(
            promotionData
          )
            ? promotionData
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
  // INITIAL
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
  // FILTERED PROMOTIONS
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
          return (
            promotion.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            promotion.code
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            promotion.description
              ?.toLowerCase()
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
  // STATS
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

  const autoPromotions =
    promotions.filter(
      (promotion) =>
        promotion.autoApply ===
        true
    ).length;

  // ====================================================
  // GET RELATED DATA
  // ====================================================

  const getBranch = (
    promotion
  ) => {
    if (promotion?.branch) {
      return promotion.branch;
    }

    return branches.find(
      (branch) =>
        branch.id ===
        promotion?.branchId
    );
  };

  const getProduct = (
    promotion
  ) => {
    if (promotion?.product) {
      return promotion.product;
    }

    return products.find(
      (product) =>
        product.id ===
        promotion?.productId
    );
  };

  const getCategory = (
    promotion
  ) => {
    if (promotion?.category) {
      return promotion.category;
    }

    return categories.find(
      (category) =>
        category.id ===
        promotion?.categoryId
    );
  };

  // ====================================================
  // PROMOTION VALUE
  // ====================================================

  const getDiscountValue = (
    promotion
  ) => {
    if (
      promotion.discountType ===
      "PERCENTAGE"
    ) {
      return `${
        Number(
          promotion.value
        ) || 0
      }%`;
    }

    return formatMoney(
      promotion.value
    );
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
            BadgePercent,
        };
    }
  };

  // ====================================================
  // PROMOTION CURRENT DATE STATUS
  // ====================================================

  const getTimeStatus = (
    promotion
  ) => {
    const now = new Date();

    const start =
      promotion.startAt
        ? new Date(
            promotion.startAt
          )
        : null;

    const end =
      promotion.endAt
        ? new Date(
            promotion.endAt
          )
        : null;

    if (
      start &&
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

  const openCreateModal =
    () => {
      setForm(
        EMPTY_FORM
      );

      setError("");
      setSuccess("");

      setCreateModalOpen(
        true
      );
    };

  // ====================================================
  // CLOSE CREATE
  // ====================================================

  const closeCreateModal =
    () => {
      if (saving) {
        return;
      }

      setCreateModalOpen(
        false
      );

      setForm(
        EMPTY_FORM
      );
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

    if (name === "scope") {
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
          type === "checkbox"
            ? checked
            : name ===
              "code"
            ? value.toUpperCase()
            : value,
      })
    );
  };

  // ====================================================
  // VALIDATION
  // ====================================================

  const validateForm =
    () => {
      if (
        !form.code.trim()
      ) {
        throw new Error(
          "Promotion code is required."
        );
      }

      if (
        !form.name.trim()
      ) {
        throw new Error(
          "Promotion name is required."
        );
      }

      if (
        !form.value ||
        Number(
          form.value
        ) <= 0
      ) {
        throw new Error(
          "Discount value must be greater than zero."
        );
      }

      if (
        form.discountType ===
          "PERCENTAGE" &&
        Number(
          form.value
        ) > 100
      ) {
        throw new Error(
          "Percentage discount cannot be greater than 100%."
        );
      }

      if (
        !form.startAt
      ) {
        throw new Error(
          "Start date is required."
        );
      }

      if (
        !form.endAt
      ) {
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
          "Select a product for product promotion."
        );
      }

      if (
        form.scope ===
          "CATEGORY" &&
        !form.categoryId
      ) {
        throw new Error(
          "Select a category for category promotion."
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

      if (
        form.description.trim()
      ) {
        payload.description =
          form.description.trim();
      }

      if (
        form.maxDiscountAmount !==
          ""
      ) {
        payload.maxDiscountAmount =
          Number(
            form.maxDiscountAmount
          );
      }

      if (form.branchId) {
        payload.branchId =
          form.branchId;
      }

      if (
        form.scope ===
          "PRODUCT" &&
        form.productId
      ) {
        payload.productId =
          form.productId;
      }

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
          "Promotion Payload:",
          payload
        );

        await api.post(
          "/promotions",
          payload
        );

        setSuccess(
          "Promotion created successfully."
        );

        setCreateModalOpen(
          false
        );

        setForm(
          EMPTY_FORM
        );

        await fetchPromotions();
      } catch (err) {
        console.error(
          "Promotion create error:",
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
  // ====================================================

  const handleStatusChange =
    async (
      promotion,
      newStatus
    ) => {
      try {
        setStatusLoadingId(
          promotion.id
        );

        setError("");
        setSuccess("");

        await api.patch(
          `/promotions/${promotion.id}/status`,
          {
            status:
              newStatus,
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
                      status:
                        newStatus,
                    }
                  : item
            )
        );

        setSuccess(
          `${promotion.name} changed to ${newStatus}.`
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
  // ====================================================

  const openDetails =
    async (promotion) => {
      try {
        setSelectedPromotion(
          promotion
        );

        setDetailModalOpen(
          true
        );

        setDetailLoading(
          true
        );

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
              Manage discounts,
              promotional campaigns
              and automatic offers.
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

            Add Promotion
          </button>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Promotions
            </p>

            <div className="mt-3 flex items-center justify-between">

              <p className="text-2xl font-bold text-slate-900">
                {totalPromotions}
              </p>

              <BadgePercent
                className="text-blue-600"
                size={24}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-3 text-2xl font-bold text-emerald-600">
              {activePromotions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-3 text-2xl font-bold text-red-600">
              {inactivePromotions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Auto Apply
            </p>

            <p className="mt-3 text-2xl font-bold text-purple-600">
              {autoPromotions}
            </p>
          </div>
        </div>

        {/* =================================================
            MAIN
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search promotion name or code..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={
                  scopeFilter
                }
                onChange={(e) =>
                  setScopeFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Scopes
                </option>

                <option value="CART">
                  Cart
                </option>

                <option value="PRODUCT">
                  Product
                </option>

                <option value="CATEGORY">
                  Category
                </option>
              </select>

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
              </select>

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

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading promotions...
                </p>
              </div>
            </div>
          ) : filteredPromotions.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <BadgePercent
                  size={36}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-4 font-semibold text-slate-700">
                  No promotions found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create a promotion
                  to start offering
                  discounts.
                </p>
              </div>
            </div>
          ) : (
            /* TABLE */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Promotion
                    </th>

                    <th className="px-5 py-4">
                      Scope
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
                      Auto
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
                          className="hover:bg-slate-50"
                        >

                          {/* PROMOTION */}

                          <td className="px-5 py-4">

                            <div>

                              <p className="font-semibold text-slate-800">
                                {promotion.name}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-blue-600">
                                {promotion.code}
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

                              <span className="font-bold text-slate-900">
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

                          <td className="px-5 py-4 text-sm text-slate-600">

                            {formatMoney(
                              promotion.minPurchaseAmount
                            )}
                          </td>

                          {/* DURATION */}

                          <td className="px-5 py-4">

                            <div className="space-y-1 text-xs text-slate-500">

                              <p>
                                From:{" "}
                                {formatDateTime(
                                  promotion.startAt
                                )}
                              </p>

                              <p>
                                To:{" "}
                                {formatDateTime(
                                  promotion.endAt
                                )}
                              </p>
                            </div>
                          </td>

                          {/* AUTO */}

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${timeStatus.className}`}
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
                                promotion.status ||
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
                              className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none ${
                                promotion.status ===
                                "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="INACTIVE">
                                INACTIVE
                              </option>
                            </select>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
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
        </div>
      </div>

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Promotion
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure discount,
                  target and promotion
                  duration.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeCreateModal
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >

              {/* ==========================================
                  BASIC
              =========================================== */}

              <h3 className="font-bold text-slate-900">
                Basic Information
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Promotion Code *
                  </label>

                  <input
                    name="code"
                    value={
                      form.code
                    }
                    onChange={
                      handleChange
                    }
                    required
                    minLength={2}
                    maxLength={50}
                    placeholder="SUMMER20"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Promotion Name *
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
                    placeholder="Summer Discount"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

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
                  maxLength={500}
                  placeholder="Promotion description..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  DISCOUNT
              =========================================== */}

              <h3 className="font-bold text-slate-900">
                Discount Settings
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

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
                    <option value="PERCENTAGE">
                      Percentage
                    </option>

                    <option value="FIXED_AMOUNT">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    {form.discountType ===
                    "PERCENTAGE"
                      ? "Discount Percentage *"
                      : "Discount Amount (LKR) *"}

                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="value"
                    value={
                      form.value
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder={
                      form.discountType ===
                      "PERCENTAGE"
                        ? "10"
                        : "500"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Minimum Purchase
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="minPurchaseAmount"
                    value={
                      form.minPurchaseAmount
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Maximum Discount
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="maxDiscountAmount"
                    value={
                      form.maxDiscountAmount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  SCOPE
              =========================================== */}

              <h3 className="font-bold text-slate-900">
                Promotion Target
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Branch
                  </label>

                  <select
                    name="branchId"
                    value={
                      form.branchId
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none"
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
                          {
                            branch.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {form.scope ===
                  "PRODUCT" && (
                  <div className="md:col-span-2">

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
                            {product.name} -{" "}
                            {product.sku}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                {form.scope ===
                  "CATEGORY" && (
                  <div className="md:col-span-2">

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

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  DATE / OPTIONS
              =========================================== */}

              <h3 className="font-bold text-slate-900">
                Schedule & Options
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Date *
                  </label>

                  <input
                    type="datetime-local"
                    name="startAt"
                    value={
                      form.startAt
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Date *
                  </label>

                  <input
                    type="datetime-local"
                    name="endAt"
                    value={
                      form.endAt
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>

                  <input
                    type="number"
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleChange
                    }
                    step="1"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                  />
                </div>

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
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">

                <input
                  type="checkbox"
                  name="autoApply"
                  checked={
                    form.autoApply
                  }
                  onChange={
                    handleChange
                  }
                  className="mt-1 h-4 w-4"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Auto Apply
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Automatically apply
                    this promotion when
                    sale conditions match.
                  </p>
                </div>
              </label>

              {/* BUTTONS */}

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeCreateModal
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
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

      {detailModalOpen &&
        selectedPromotion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Promotion Details
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {
                      selectedPromotion.code
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDetailModalOpen(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex min-h-72 items-center justify-center">

                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="p-6">

                  <h3 className="text-lg font-bold text-slate-900">
                    {
                      selectedPromotion.name
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selectedPromotion.description ||
                      "No description"}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Discount
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-600">
                        {getDiscountValue(
                          selectedPromotion
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Scope
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {displayText(
                          selectedPromotion.scope
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Minimum Purchase
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {formatMoney(
                          selectedPromotion.minPurchaseAmount
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Max Discount
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {selectedPromotion.maxDiscountAmount !=
                        null
                          ? formatMoney(
                              selectedPromotion.maxDiscountAmount
                            )
                          : "No Limit"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Branch
                      </p>

                      <p className="mt-2 flex items-center gap-2 font-semibold text-slate-800">
                        <Building2
                          size={16}
                        />

                        {getBranch(
                          selectedPromotion
                        )?.name ||
                          "All Branches"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Priority
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {selectedPromotion.priority ??
                          0}
                      </p>
                    </div>
                  </div>

                  {selectedPromotion.scope ===
                    "PRODUCT" && (
                    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4">

                      <p className="text-xs font-semibold uppercase text-purple-500">
                        Target Product
                      </p>

                      <p className="mt-2 font-semibold text-purple-800">
                        {getProduct(
                          selectedPromotion
                        )?.name ||
                          "Unknown Product"}
                      </p>
                    </div>
                  )}

                  {selectedPromotion.scope ===
                    "CATEGORY" && (
                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">

                      <p className="text-xs font-semibold uppercase text-amber-500">
                        Target Category
                      </p>

                      <p className="mt-2 font-semibold text-amber-800">
                        {getCategory(
                          selectedPromotion
                        )?.name ||
                          "Unknown Category"}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 rounded-xl border border-slate-200 p-5">

                    <div className="flex items-start gap-3">

                      <CalendarDays
                        size={20}
                        className="mt-0.5 text-blue-600"
                      />

                      <div>
                        <p className="font-semibold text-slate-800">
                          Promotion
                          Period
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Start:{" "}
                          {formatDateTime(
                            selectedPromotion.startAt
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          End:{" "}
                          {formatDateTime(
                            selectedPromotion.endAt
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        selectedPromotion.status ===
                        "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {selectedPromotion.status}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {selectedPromotion.autoApply
                        ? "Auto Apply"
                        : "Manual Code"}
                    </span>
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