import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgePercent,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ReceiptText,
  User,
  Building2,
  Percent,
  Banknote,
  MessageSquareText,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// STATUSES
// ======================================================

const DISCOUNT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

// ======================================================
// HELPERS
// ======================================================

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const getStatusStyle = (status) => {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

// ======================================================
// PAGE
// ======================================================

const Discounts = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    discounts,
    setDiscounts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState(null);

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
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
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
    selectedDiscount,
    setSelectedDiscount,
  ] = useState(null);

  const [
    selectedSale,
    setSelectedSale,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    saleLoading,
    setSaleLoading,
  ] = useState(false);

  // ====================================================
  // REJECT MODAL
  // ====================================================

  const [
    rejectOpen,
    setRejectOpen,
  ] = useState(false);

  const [
    rejectTarget,
    setRejectTarget,
  ] = useState(null);

  const [
    rejectReason,
    setRejectReason,
  ] = useState("");

  // ====================================================
  // FETCH DISCOUNTS
  //
  // GET /discounts
  //
  // Backend supports:
  // status
  // ====================================================

  const fetchDiscounts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (statusFilter) {
          params.status =
            statusFilter;
        }

        const response =
          await api.get(
            "/discounts",
            {
              params,
            }
          );

        console.log(
          "Manager Discounts:",
          response.data
        );

        const result =
          response.data?.data;

        const data =
          result?.discounts ??
          response.data?.discounts ??
          (Array.isArray(result)
            ? result
            : []);

        setDiscounts(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Discount load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load discount requests."
        );

        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // LOAD
  // ====================================================

  useEffect(() => {
    fetchDiscounts();
  }, [statusFilter]);

  // ====================================================
  // SALE
  // ====================================================

  const getSale = (
    discount
  ) => {
    return (
      discount?.sale ??
      null
    );
  };

  // ====================================================
  // SALE NUMBER
  // ====================================================

  const getSaleNumber = (
    discount
  ) => {
    const sale =
      getSale(discount);

    return (
      sale?.invoiceNumber ??
      sale?.saleNumber ??
      discount?.invoiceNumber ??
      discount?.saleNumber ??
      discount?.saleId ??
      "—"
    );
  };

  // ====================================================
  // REQUESTER
  // ====================================================

  const getRequester = (
    discount
  ) => {
    const user =
      discount?.requestedBy ??
      discount?.requester ??
      discount?.cashier ??
      discount?.createdBy ??
      discount?.user ??
      discount?.sale?.cashier ??
      discount?.sale?.shift
        ?.cashier ??
      discount?.sale?.shift?.user;

    if (!user) {
      return (
        discount?.requestedByName ??
        discount?.cashierName ??
        "—"
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
      "—"
    );
  };

  // ====================================================
  // REVIEWER
  // ====================================================

  const getReviewer = (
    discount
  ) => {
    const user =
      discount?.approvedBy ??
      discount?.rejectedBy ??
      discount?.reviewedBy ??
      discount?.approver;

    if (!user) {
      return (
        discount?.approvedByName ??
        discount?.rejectedByName ??
        discount?.reviewedByName ??
        "—"
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
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranchName = (
    discount
  ) => {
    return (
      discount?.branch?.name ??
      discount?.sale?.branch
        ?.name ??
      discount?.sale?.shift
        ?.branch?.name ??
      discount?.branchName ??
      "—"
    );
  };

  // ====================================================
  // DISCOUNT VALUE
  // ====================================================

  const getDiscountValue = (
    discount
  ) => {
    const value =
      Number(
        discount?.value
      ) || 0;

    if (
      discount
        ?.discountType ===
      "PERCENTAGE"
    ) {
      return `${value}%`;
    }

    return formatMoney(
      value
    );
  };

  // ====================================================
  // REVIEW REASON
  // ====================================================

  const getRejectReason = (
    discount
  ) => {
    return (
      discount?.rejectionReason ??
      discount?.rejectReason ??
      discount?.reviewReason ??
      discount?.rejectedReason ??
      "—"
    );
  };

  // ====================================================
  // LOCAL SEARCH
  //
  // Backend only supports status.
  // Search happens locally.
  // ====================================================

  const filteredDiscounts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return discounts;
      }

      return discounts.filter(
        (discount) => {
          const values = [
            getSaleNumber(
              discount
            ),
            getRequester(
              discount
            ),
            getBranchName(
              discount
            ),
            discount?.discountType,
            discount?.reason,
            discount?.status,
            discount?.id,
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
      discounts,
      search,
    ]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const total =
    filteredDiscounts.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / limit
      )
    );

  const paginatedDiscounts =
    useMemo(() => {
      const start =
        (page - 1) *
        limit;

      return filteredDiscounts.slice(
        start,
        start + limit
      );
    }, [
      filteredDiscounts,
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
    page,
    totalPages,
  ]);

  // ====================================================
  // STATS
  // ====================================================

  const totalCount =
    discounts.length;

  const pendingCount =
    discounts.filter(
      (discount) =>
        discount.status ===
        "PENDING"
    ).length;

  const approvedCount =
    discounts.filter(
      (discount) =>
        discount.status ===
        "APPROVED"
    ).length;

  const rejectedCount =
    discounts.filter(
      (discount) =>
        discount.status ===
        "REJECTED"
    ).length;

  // ====================================================
  // OPEN DETAILS
  //
  // Discount backend has NO:
  // GET /discounts/:id
  //
  // Use list row + GET /sales/:saleId
  // ====================================================

  const openDetails =
    async (discount) => {
      setSelectedDiscount(
        discount
      );

      setSelectedSale(
        discount?.sale ??
          null
      );

      setDetailsOpen(true);

      if (
        discount?.sale ||
        !discount?.saleId
      ) {
        return;
      }

      try {
        setSaleLoading(true);

        const response =
          await api.get(
            `/sales/${discount.saleId}`
          );

        const sale =
          response.data?.data
            ?.sale ??
          response.data?.data ??
          null;

        setSelectedSale(
          sale
        );
      } catch (err) {
        console.error(
          "Discount sale error:",
          err.response?.data ||
            err.message
        );
      } finally {
        setSaleLoading(false);
      }
    };

  // ====================================================
  // CLOSE DETAILS
  // ====================================================

  const closeDetails =
    () => {
      setDetailsOpen(false);

      setSelectedDiscount(
        null
      );

      setSelectedSale(
        null
      );
    };

  // ====================================================
  // APPROVE
  //
  // POST /discounts/:id/approve
  // ====================================================

  const handleApprove =
    async (discount) => {
      const confirmed =
        window.confirm(
          `Approve discount request for ${getSaleNumber(
            discount
          )}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoadingId(
          discount.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/discounts/${discount.id}/approve`
          );

        setSuccess(
          response.data?.message ||
            "Discount approved and applied successfully."
        );

        closeDetails();

        await fetchDiscounts();
      } catch (err) {
        console.error(
          "Discount approval error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to approve discount request."
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
    };

  // ====================================================
  // OPEN REJECT MODAL
  // ====================================================

  const openRejectModal = (
    discount
  ) => {
    setRejectTarget(
      discount
    );

    setRejectReason("");

    setRejectOpen(true);
  };

  // ====================================================
  // CLOSE REJECT
  // ====================================================

  const closeReject =
    () => {
      if (actionLoadingId) {
        return;
      }

      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    };

  // ====================================================
  // REJECT
  //
  // POST /discounts/:id/reject
  //
  // {
  //   reason
  // }
  // ====================================================

  const handleReject =
    async (event) => {
      event.preventDefault();

      if (!rejectTarget) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        const reason =
          rejectReason.trim();

        if (
          reason.length < 2
        ) {
          throw new Error(
            "Rejection reason must contain at least 2 characters."
          );
        }

        if (
          reason.length > 500
        ) {
          throw new Error(
            "Rejection reason cannot exceed 500 characters."
          );
        }

        setActionLoadingId(
          rejectTarget.id
        );

        const response =
          await api.post(
            `/discounts/${rejectTarget.id}/reject`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Discount request rejected."
        );

        setRejectOpen(false);
        setRejectTarget(null);
        setRejectReason("");

        closeDetails();

        await fetchDiscounts();
      } catch (err) {
        console.error(
          "Discount rejection error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to reject discount request."
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
    };

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      setPage(1);
    };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* =============================================
            SUCCESS
        ============================================== */}

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

        {/* =============================================
            ERROR
        ============================================== */}

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

        {/* =============================================
            HEADER
        ============================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Discount Requests
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review cashier discount
              requests and approve or
              reject them.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchDiscounts
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

        {/* =============================================
            KPI
        ============================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Requests
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <BadgePercent
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {pendingCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                <Clock3
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* APPROVED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Approved
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {approvedCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                <CheckCircle2
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* REJECTED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Rejected
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {rejectedCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">

                <X size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* =============================================
            MAIN CARD
        ============================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_auto]">

              {/* SEARCH */}

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="Search invoice, cashier, branch or reason..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* STATUS */}

              <select
                value={
                  statusFilter
                }
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >

                <option value="">
                  All Status
                </option>

                {DISCOUNT_STATUSES.map(
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
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >

                <RotateCcw
                  size={16}
                />

                Reset
              </button>
            </div>
          </div>

          {/* =============================================
              CONTENT
          ============================================== */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading discount
                  requests...
                </p>
              </div>
            </div>
          ) : paginatedDiscounts.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <BadgePercent
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No discount requests
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Cashier discount
                  requests will appear
                  here.
                </p>
              </div>
            </div>
          ) : (
            /* =============================================
                TABLE
            ============================================== */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Sale / Invoice
                    </th>

                    <th className="px-5 py-4">
                      Requested By
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Value
                    </th>

                    <th className="px-5 py-4">
                      Reason
                    </th>

                    <th className="px-5 py-4">
                      Requested At
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

                  {paginatedDiscounts.map(
                    (discount) => (
                      <tr
                        key={
                          discount.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* SALE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                              <ReceiptText
                                size={18}
                              />
                            </div>

                            <div>

                              <p className="max-w-52 truncate text-sm font-semibold text-blue-600">

                                {getSaleNumber(
                                  discount
                                )}

                              </p>

                              {discount
                                ?.sale
                                ?.saleNumber && (
                                <p className="mt-1 max-w-48 truncate text-xs text-slate-400">

                                  {
                                    discount
                                      .sale
                                      .saleNumber
                                  }

                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* REQUESTER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                              <User
                                size={15}
                              />
                            </div>

                            <span className="whitespace-nowrap text-sm font-medium text-slate-700">

                              {getRequester(
                                discount
                              )}

                            </span>
                          </div>
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
                                discount
                              )}

                            </span>
                          </div>
                        </td>

                        {/* TYPE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            {discount.discountType ===
                            "PERCENTAGE" ? (
                              <Percent
                                size={16}
                                className="text-purple-600"
                              />
                            ) : (
                              <Banknote
                                size={16}
                                className="text-emerald-600"
                              />
                            )}

                            <span className="whitespace-nowrap text-xs font-semibold text-slate-600">

                              {displayText(
                                discount.discountType
                              )}

                            </span>
                          </div>
                        </td>

                        {/* VALUE */}

                        <td className="px-5 py-4">

                          <span className="whitespace-nowrap text-base font-bold text-purple-600">

                            {getDiscountValue(
                              discount
                            )}

                          </span>
                        </td>

                        {/* REASON */}

                        <td className="px-5 py-4">

                          <p
                            title={
                              discount.reason ||
                              ""
                            }
                            className="max-w-60 truncate text-sm text-slate-600"
                          >

                            {discount.reason ||
                              "—"}

                          </p>
                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-500">

                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />

                            {formatDateTime(
                              discount.createdAt ??
                                discount.requestedAt
                            )}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                              discount.status
                            )}`}
                          >

                            {displayText(
                              discount.status
                            )}

                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            {/* VIEW */}

                            <button
                              type="button"
                              title="View details"
                              onClick={() =>
                                openDetails(
                                  discount
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            {/* APPROVE */}

                            {discount.status ===
                              "PENDING" && (
                              <button
                                type="button"
                                title="Approve request"
                                disabled={
                                  actionLoadingId ===
                                  discount.id
                                }
                                onClick={() =>
                                  handleApprove(
                                    discount
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                              >

                                {actionLoadingId ===
                                discount.id ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check
                                    size={17}
                                  />
                                )}
                              </button>
                            )}

                            {/* REJECT */}

                            {discount.status ===
                              "PENDING" && (
                              <button
                                type="button"
                                title="Reject request"
                                disabled={
                                  actionLoadingId ===
                                  discount.id
                                }
                                onClick={() =>
                                  openRejectModal(
                                    discount
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                              >
                                <X
                                  size={17}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =============================================
              PAGINATION
          ============================================== */}

          {!loading &&
            filteredDiscounts.length >
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

                  {" "}requests
                </p>

                <div className="flex items-center gap-3">

                  <select
                    value={limit}
                    onChange={(event) => {
                      setLimit(
                        Number(
                          event.target.value
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
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedDiscount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Discount Request
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

                    {getSaleNumber(
                      selectedDiscount
                    )}

                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="space-y-6 p-6">

                {/* STATUS + DATE */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Status
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        selectedDiscount.status
                      )}`}
                    >

                      {displayText(
                        selectedDiscount.status
                      )}

                    </span>
                  </div>

                  <div className="sm:text-right">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Requested At
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-700">

                      {formatDateTime(
                        selectedDiscount.createdAt ??
                          selectedDiscount.requestedAt
                      )}

                    </p>
                  </div>
                </div>

                {/* INFORMATION */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* SALE */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Sale / Invoice
                    </p>

                    <p className="mt-2 break-all text-sm font-semibold text-blue-600">

                      {getSaleNumber(
                        selectedDiscount
                      )}

                    </p>
                  </div>

                  {/* REQUESTER */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Requested By
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <User
                        size={16}
                        className="text-purple-600"
                      />

                      <p className="text-sm font-semibold text-slate-800">

                        {getRequester(
                          selectedDiscount
                        )}

                      </p>
                    </div>
                  </div>

                  {/* BRANCH */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Branch
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <Building2
                        size={16}
                        className="text-blue-600"
                      />

                      <p className="text-sm font-semibold text-slate-800">

                        {getBranchName(
                          selectedDiscount
                        )}

                      </p>
                    </div>
                  </div>

                  {/* TYPE */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Discount Type
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      {selectedDiscount.discountType ===
                      "PERCENTAGE" ? (
                        <Percent
                          size={16}
                          className="text-purple-600"
                        />
                      ) : (
                        <Banknote
                          size={16}
                          className="text-emerald-600"
                        />
                      )}

                      <p className="font-semibold text-slate-800">

                        {displayText(
                          selectedDiscount.discountType
                        )}

                      </p>
                    </div>
                  </div>
                </div>

                {/* REQUESTED VALUE */}

                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="font-semibold text-purple-700">
                        Requested Discount
                      </p>

                      <p className="mt-1 text-xs text-purple-500">
                        Discount requested
                        by cashier.
                      </p>
                    </div>

                    <p className="text-3xl font-bold text-purple-700">

                      {getDiscountValue(
                        selectedDiscount
                      )}

                    </p>
                  </div>
                </div>

                {/* REASON */}

                <div className="rounded-xl border border-slate-200 p-5">

                  <div className="flex items-start gap-3">

                    <MessageSquareText
                      size={20}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>

                      <p className="font-semibold text-slate-800">
                        Request Reason
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                        {selectedDiscount.reason ||
                          "No reason provided."}

                      </p>
                    </div>
                  </div>
                </div>

                {/* SALE LOADING */}

                {saleLoading && (
                  <div className="flex justify-center rounded-xl border border-slate-200 p-8">

                    <Loader2
                      size={25}
                      className="animate-spin text-blue-600"
                    />
                  </div>
                )}

                {/* SALE INFORMATION */}

                {!saleLoading &&
                  selectedSale && (
                    <div className="rounded-xl border border-slate-200 p-5">

                      <h3 className="font-bold text-slate-900">
                        Sale Information
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                        {/* SUBTOTAL */}

                        <div>

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Subtotal
                          </p>

                          <p className="mt-2 font-semibold text-slate-700">

                            {formatMoney(
                              selectedSale.subtotal ??
                                selectedSale.subTotal ??
                                0
                            )}

                          </p>
                        </div>

                        {/* DISCOUNT */}

                        <div>

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Current Discount
                          </p>

                          <p className="mt-2 font-semibold text-red-500">

                            {formatMoney(
                              selectedSale.discountAmount ??
                                selectedSale.totalDiscount ??
                                0
                            )}

                          </p>
                        </div>

                        {/* TOTAL */}

                        <div>

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Grand Total
                          </p>

                          <p className="mt-2 font-bold text-emerald-600">

                            {formatMoney(
                              selectedSale.grandTotal ??
                                selectedSale.totalAmount ??
                                selectedSale.total ??
                                0
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* REVIEW INFORMATION */}

                {selectedDiscount.status !==
                  "PENDING" && (
                  <div className="rounded-xl bg-slate-50 p-5">

                    <h3 className="font-bold text-slate-900">
                      Review Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div>

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Reviewed By
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-700">

                          {getReviewer(
                            selectedDiscount
                          )}

                        </p>
                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Reviewed At
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-700">

                          {formatDateTime(
                            selectedDiscount.reviewedAt ??
                              selectedDiscount.approvedAt ??
                              selectedDiscount.rejectedAt ??
                              selectedDiscount.updatedAt
                          )}

                        </p>
                      </div>
                    </div>

                    {selectedDiscount.status ===
                      "REJECTED" && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                        <p className="text-xs font-semibold uppercase text-red-500">
                          Rejection Reason
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-red-700">

                          {getRejectReason(
                            selectedDiscount
                          )}

                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* REQUEST ID */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Discount Request ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs text-slate-600">

                    {selectedDiscount.id ??
                      "—"}

                  </p>
                </div>

                {/* ACTIONS */}

                {selectedDiscount.status ===
                  "PENDING" && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                    {/* REJECT */}

                    <button
                      type="button"
                      disabled={
                        actionLoadingId ===
                        selectedDiscount.id
                      }
                      onClick={() => {
                        setDetailsOpen(
                          false
                        );

                        openRejectModal(
                          selectedDiscount
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                    >

                      <X size={17} />

                      Reject
                    </button>

                    {/* APPROVE */}

                    <button
                      type="button"
                      disabled={
                        actionLoadingId ===
                        selectedDiscount.id
                      }
                      onClick={() =>
                        handleApprove(
                          selectedDiscount
                        )
                      }
                      className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                    >

                      {actionLoadingId ===
                      selectedDiscount.id ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Check
                          size={17}
                        />
                      )}

                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* =================================================
          REJECT MODAL
      ================================================= */}

      {rejectOpen &&
        rejectTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Reject Discount
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

                    {getSaleNumber(
                      rejectTarget
                    )}

                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    actionLoadingId ===
                    rejectTarget.id
                  }
                  onClick={
                    closeReject
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleReject
                }
                className="p-6"
              >

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <div>

                      <p className="text-sm font-semibold text-red-700">
                        Reject request?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-600">
                        Enter a clear
                        reason so the
                        cashier knows why
                        this discount was
                        rejected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Rejection Reason *
                  </label>

                  <textarea
                    rows={4}
                    required
                    minLength={2}
                    maxLength={500}
                    value={
                      rejectReason
                    }
                    onChange={(event) =>
                      setRejectReason(
                        event.target.value
                      )
                    }
                    placeholder="Enter rejection reason..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />

                  <div className="mt-1 flex items-center justify-between">

                    <p className="text-xs text-slate-400">
                      Minimum 2
                      characters
                    </p>

                    <p className="text-xs text-slate-400">

                      {
                        rejectReason.length
                      }
                      /500

                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    disabled={
                      actionLoadingId ===
                      rejectTarget.id
                    }
                    onClick={
                      closeReject
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoadingId ===
                      rejectTarget.id
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                  >

                    {actionLoadingId ===
                    rejectTarget.id ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <X size={17} />
                    )}

                    Reject Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default Discounts;