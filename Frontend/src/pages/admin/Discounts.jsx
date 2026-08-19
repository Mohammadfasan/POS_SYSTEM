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
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// DISCOUNT STATUSES
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
  return new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value) || 0
  );
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
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "REJECTED":
      return "bg-red-50 text-red-600 border-red-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

// ======================================================
// PAGE
// ======================================================

const Discounts = () => {
  // ====================================================
  // MAIN STATE
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
  // REJECT
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
  // GET /api/discounts
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
          "Discount Response:",
          response.data
        );

        const result =
          response.data?.data;

        const discountData =
          result?.discounts ??
          response.data
            ?.discounts ??
          (Array.isArray(result)
            ? result
            : []);

        setDiscounts(
          Array.isArray(
            discountData
          )
            ? discountData
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
      discount?.sale?.cashier;

    if (!user) {
      return (
        discount
          ?.requestedByName ??
        discount
          ?.cashierName ??
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
      return "—";
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
      discount?.branchName ??
      "—"
    );
  };

  // ====================================================
  // VALUE
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
  // FILTER
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
          const sale =
            String(
              getSaleNumber(
                discount
              )
            ).toLowerCase();

          const requester =
            getRequester(
              discount
            ).toLowerCase();

          const reason =
            String(
              discount?.reason ??
                ""
            ).toLowerCase();

          const type =
            String(
              discount
                ?.discountType ??
                ""
            ).toLowerCase();

          const branch =
            getBranchName(
              discount
            ).toLowerCase();

          return (
            sale.includes(
              keyword
            ) ||
            requester.includes(
              keyword
            ) ||
            reason.includes(
              keyword
            ) ||
            type.includes(
              keyword
            ) ||
            branch.includes(
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
  // STATS
  // ====================================================

  const totalCount =
    discounts.length;

  const pendingCount =
    discounts.filter(
      (item) =>
        item.status ===
        "PENDING"
    ).length;

  const approvedCount =
    discounts.filter(
      (item) =>
        item.status ===
        "APPROVED"
    ).length;

  const rejectedCount =
    discounts.filter(
      (item) =>
        item.status ===
        "REJECTED"
    ).length;

  // ====================================================
  // OPEN DETAILS
  //
  // Discount backend currently has NO
  // GET /discounts/:id route.
  //
  // So use data from list and,
  // if saleId exists, load sale details.
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

        console.log(
          "Discount Sale:",
          response.data
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
          "Discount sale load error:",
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
      setSelectedDiscount(null);
      setSelectedSale(null);
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
          "Discount approve error:",
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
  // OPEN REJECT
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
  // BODY:
  // {
  //   reason: "..."
  // }
  // ====================================================

  const handleReject =
    async (event) => {
      event.preventDefault();

      if (!rejectTarget) {
        return;
      }

      try {
        setActionLoadingId(
          rejectTarget.id
        );

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
          "Discount reject error:",
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

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
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

        {/* =================================================
            STATS
        ================================================= */}

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
                <X
                  size={23}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTER
          ================================================= */}

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
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search invoice, cashier, branch or reason..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

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

          {/* =================================================
              CONTENT
          ================================================= */}

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
          ) : filteredDiscounts.length ===
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

            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px]">

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

                  {filteredDiscounts.map(
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
                                ?.invoiceNumber &&
                                discount
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

                        {/* USER */}

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
                                title="Approve"
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
                                title="Reject"
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
        </div>
      </div>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedDiscount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

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
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="p-6">

                {/* STATUS */}

                <div className="flex flex-wrap items-center justify-between gap-4">

                  <div>
                    <p className="text-sm text-slate-500">
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

                  <div className="text-right">

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Requested At
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDateTime(
                        selectedDiscount.createdAt ??
                          selectedDiscount.requestedAt
                      )}
                    </p>
                  </div>
                </div>

                {/* INFO */}

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

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

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Requested By
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {getRequester(
                        selectedDiscount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Branch
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {getBranchName(
                        selectedDiscount
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">

                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Discount Type
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {displayText(
                        selectedDiscount.discountType
                      )}
                    </p>
                  </div>
                </div>

                {/* VALUE */}

                <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-5">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-purple-700">
                        Requested Discount
                      </p>

                      <p className="mt-1 text-xs text-purple-500">
                        Discount amount
                        requested by
                        cashier
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

                <div className="mt-5 rounded-xl border border-slate-200 p-5">

                  <div className="flex items-start gap-3">

                    <MessageSquareText
                      size={20}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>

                      <p className="font-semibold text-slate-800">
                        Discount Reason
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                        {selectedDiscount.reason ||
                          "No reason provided."}

                      </p>
                    </div>
                  </div>
                </div>

                {/* SALE INFO */}

                {saleLoading ? (
                  <div className="mt-5 flex justify-center rounded-xl border border-slate-200 p-8">

                    <Loader2
                      size={25}
                      className="animate-spin text-blue-600"
                    />
                  </div>
                ) : selectedSale ? (
                  <div className="mt-5 rounded-xl border border-slate-200 p-5">

                    <h3 className="font-bold text-slate-900">
                      Sale Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                      <div>
                        <p className="text-xs uppercase text-slate-400">
                          Subtotal
                        </p>

                        <p className="mt-1 font-semibold text-slate-700">
                          {formatMoney(
                            selectedSale.subtotal ??
                              selectedSale.subTotal
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-slate-400">
                          Current Discount
                        </p>

                        <p className="mt-1 font-semibold text-red-500">
                          {formatMoney(
                            selectedSale.discountAmount ??
                              selectedSale.totalDiscount ??
                              0
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-slate-400">
                          Grand Total
                        </p>

                        <p className="mt-1 font-bold text-emerald-600">
                          {formatMoney(
                            selectedSale.grandTotal ??
                              selectedSale.totalAmount ??
                              selectedSale.total
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* REVIEW INFO */}

                {selectedDiscount.status !==
                  "PENDING" && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-5">

                    <h3 className="font-bold text-slate-900">
                      Review Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div>

                        <p className="text-xs uppercase text-slate-400">
                          Reviewed By
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {getReviewer(
                            selectedDiscount
                          )}
                        </p>
                      </div>

                      <div>

                        <p className="text-xs uppercase text-slate-400">
                          Reviewed At
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">

                          {formatDateTime(
                            selectedDiscount.approvedAt ??
                              selectedDiscount.rejectedAt ??
                              selectedDiscount.reviewedAt
                          )}

                        </p>
                      </div>
                    </div>

                    {(selectedDiscount.rejectionReason ||
                      selectedDiscount.rejectReason) && (
                      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">

                        <p className="text-xs font-semibold uppercase text-red-500">
                          Rejection Reason
                        </p>

                        <p className="mt-2 text-sm text-red-700">

                          {selectedDiscount.rejectionReason ??
                            selectedDiscount.rejectReason}

                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIONS */}

                {selectedDiscount.status ===
                  "PENDING" && (
                  <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                    <button
                      type="button"
                      disabled={
                        actionLoadingId ===
                        selectedDiscount.id
                      }
                      onClick={() => {
                        setDetailsOpen(false);

                        openRejectModal(
                          selectedDiscount
                        );
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                    >
                      <X
                        size={17}
                      />

                      Reject
                    </button>

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
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-400"
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

                      Approve Discount
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

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <div>

                      <p className="text-sm font-semibold text-red-700">
                        Reject Request
                      </p>

                      <p className="mt-1 text-sm text-red-600">
                        This discount
                        will not be
                        approved or
                        applied.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Rejection Reason *
                  </label>

                  <textarea
                    value={
                      rejectReason
                    }
                    onChange={(e) =>
                      setRejectReason(
                        e.target.value
                      )
                    }
                    required
                    minLength={2}
                    maxLength={500}
                    rows={4}
                    placeholder="Enter reason for rejection..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />

                  <div className="mt-1 flex justify-between text-xs text-slate-400">

                    <span>
                      Minimum 2 characters
                    </span>

                    <span>
                      {rejectReason.length}/500
                    </span>
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
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoadingId ===
                      rejectTarget.id
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-400"
                  >

                    {actionLoadingId ===
                    rejectTarget.id && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
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