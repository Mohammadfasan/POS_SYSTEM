import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RotateCcw,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Package,
  ReceiptText,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  Ban,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// RETURN STATUSES
// ======================================================

const RETURN_STATUSES = [
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
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
  ).format(Number(value) || 0);
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
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "APPROVED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "PROCESSING":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "REJECTED":
      return "bg-red-50 text-red-600 border-red-200";

    case "CANCELLED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

// ======================================================
// PAGE
// ======================================================

const Returns = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [returns, setReturns] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // FILTER
  // ====================================================

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("");

  // ====================================================
  // PAGINATION
  // ====================================================

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const [total, setTotal] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  // ====================================================
  // DETAILS
  // ====================================================

  const [
    selectedReturn,
    setSelectedReturn,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
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
  // CANCEL
  // ====================================================

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    cancelTarget,
    setCancelTarget,
  ] = useState(null);

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  // ====================================================
  // LOAD BRANCHES
  // ====================================================

  const loadBranches = async () => {
    try {
      const response =
        await api.get("/branches");

      const result =
        response.data?.data;

      const branchData =
        result?.branches ??
        response.data?.branches ??
        (Array.isArray(result)
          ? result
          : []);

      setBranches(
        Array.isArray(branchData)
          ? branchData
          : []
      );
    } catch (err) {
      console.error(
        "Branch load error:",
        err.response?.data ||
          err.message
      );

      setBranches([]);
    }
  };

  // ====================================================
  // FETCH RETURNS
  //
  // GET /api/returns
  // ====================================================

  const fetchReturns =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (search) {
          params.search =
            search;
        }

        if (statusFilter) {
          params.status =
            statusFilter;
        }

        if (branchFilter) {
          params.branchId =
            branchFilter;
        }

        const response =
          await api.get(
            "/returns",
            {
              params,
            }
          );

        console.log(
          "Returns Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const returnData =
          result.returns ??
          result.saleReturns ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeReturns =
          Array.isArray(returnData)
            ? returnData
            : [];

        setReturns(safeReturns);

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
              safeReturns.length
          );

        const calculatedPages =
          Math.ceil(
            responseTotal / limit
          );

        const rawTotalPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        setTotal(
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeReturns.length
        );

        setTotalPages(
          Math.max(
            1,
            Number(rawTotalPages) ||
              1
          )
        );
      } catch (err) {
        console.error(
          "Return load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load returns."
        );

        setReturns([]);
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
    loadBranches();
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [
    page,
    limit,
    search,
    statusFilter,
    branchFilter,
  ]);

  // ====================================================
  // GET RETURN NUMBER
  // ====================================================

  const getReturnNumber = (
    saleReturn
  ) => {
    return (
      saleReturn?.returnNumber ??
      saleReturn?.number ??
      saleReturn?.returnNo ??
      saleReturn?.id ??
      "—"
    );
  };

  // ====================================================
  // GET SALE
  // ====================================================

  const getSale = (
    saleReturn
  ) => {
    return (
      saleReturn?.sale ??
      saleReturn?.originalSale ??
      null
    );
  };

  // ====================================================
  // INVOICE / SALE
  // ====================================================

  const getSaleNumber = (
    saleReturn
  ) => {
    const sale =
      getSale(saleReturn);

    return (
      sale?.invoiceNumber ??
      sale?.saleNumber ??
      saleReturn?.invoiceNumber ??
      saleReturn?.saleNumber ??
      saleReturn?.saleId ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    saleReturn
  ) => {
    if (saleReturn?.branch) {
      return saleReturn.branch;
    }

    const sale =
      getSale(saleReturn);

    if (sale?.branch) {
      return sale.branch;
    }

    const branchId =
      saleReturn?.branchId ??
      sale?.branchId;

    return branches.find(
      (branch) =>
        branch.id === branchId
    );
  };

  // ====================================================
  // REQUESTER
  // ====================================================

  const getRequester = (
    saleReturn
  ) => {
    const user =
      saleReturn?.requestedBy ??
      saleReturn?.requester ??
      saleReturn?.createdBy ??
      saleReturn?.cashier ??
      saleReturn?.user ??
      getSale(saleReturn)
        ?.cashier;

    if (!user) {
      return "—";
    }

    if (
      typeof user === "string"
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
    saleReturn
  ) => {
    const user =
      saleReturn?.approvedBy ??
      saleReturn?.rejectedBy ??
      saleReturn?.reviewedBy ??
      saleReturn?.approver;

    if (!user) {
      return "—";
    }

    if (
      typeof user === "string"
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
  // ITEMS
  // ====================================================

  const getItems = (
    saleReturn
  ) => {
    const items =
      saleReturn?.items ??
      saleReturn?.returnItems ??
      [];

    return Array.isArray(items)
      ? items
      : [];
  };

  // ====================================================
  // PRODUCT
  // ====================================================

  const getProduct = (
    item
  ) => {
    return (
      item?.product ??
      item?.saleItem?.product ??
      item?.originalSaleItem
        ?.product ??
      null
    );
  };

  // ====================================================
  // QUANTITY
  // ====================================================

  const getQuantity = (
    item
  ) => {
    return (
      Number(
        item?.quantity ??
          item?.returnQuantity ??
          0
      ) || 0
    );
  };

  // ====================================================
  // ITEM PRICE
  // ====================================================

  const getItemPrice = (
    item
  ) => {
    return (
      Number(
        item?.unitPrice ??
          item?.price ??
          item?.saleItem
            ?.unitPrice ??
          item
            ?.originalSaleItem
            ?.unitPrice ??
          0
      ) || 0
    );
  };

  // ====================================================
  // RETURN AMOUNT
  // ====================================================

  const getReturnAmount = (
    saleReturn
  ) => {
    const directAmount =
      saleReturn
        ?.refundAmount ??
      saleReturn
        ?.totalRefundAmount ??
      saleReturn?.totalAmount ??
      saleReturn?.amount;

    if (
      directAmount !==
        undefined &&
      directAmount !== null
    ) {
      return (
        Number(
          directAmount
        ) || 0
      );
    }

    return getItems(
      saleReturn
    ).reduce(
      (sum, item) => {
        return (
          sum +
          getQuantity(item) *
            getItemPrice(item)
        );
      },
      0
    );
  };

  // ====================================================
  // REFUND DISPLAY
  // ====================================================

  const getRefunds = (
    saleReturn
  ) => {
    const refunds =
      saleReturn?.refunds ??
      saleReturn?.refund ??
      [];

    if (
      Array.isArray(refunds)
    ) {
      return refunds;
    }

    if (refunds) {
      return [refunds];
    }

    return [];
  };

  // ====================================================
  // STATS
  //
  // current API page/filter result
  // ====================================================

  const pendingCount =
    returns.filter(
      (item) =>
        item.status ===
        "PENDING"
    ).length;

  const approvedCount =
    returns.filter(
      (item) =>
        item.status ===
        "APPROVED"
    ).length;

  const completedCount =
    returns.filter(
      (item) =>
        item.status ===
        "COMPLETED"
    ).length;

  const pageAmount =
    useMemo(() => {
      return returns.reduce(
        (sum, saleReturn) =>
          sum +
          getReturnAmount(
            saleReturn
          ),
        0
      );
    }, [returns]);

  // ====================================================
  // SEARCH
  // ====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    setSearch(
      searchInput
        .trim()
    );

    setPage(1);
  };

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("");
    setBranchFilter("");
    setPage(1);
  };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /returns/:id
  // ====================================================

  const openDetails =
    async (saleReturn) => {
      try {
        setDetailsOpen(true);

        setSelectedReturn(
          saleReturn
        );

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/returns/${saleReturn.id}`
          );

        console.log(
          "Return Detail Response:",
          response.data
        );

        const detailedReturn =
          response.data?.data
            ?.saleReturn ??
          response.data?.data
            ?.return ??
          response.data?.data ??
          saleReturn;

        setSelectedReturn(
          detailedReturn
        );
      } catch (err) {
        console.error(
          "Return detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load return details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // CLOSE DETAILS
  // ====================================================

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedReturn(null);
  };

  // ====================================================
  // APPROVE
  //
  // POST /returns/:id/approve
  // ADMIN / MANAGER
  // ====================================================

  const handleApprove =
    async (saleReturn) => {
      const confirmed =
        window.confirm(
          `Approve return ${getReturnNumber(
            saleReturn
          )}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoadingId(
          saleReturn.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/returns/${saleReturn.id}/approve`
          );

        setSuccess(
          response.data?.message ||
            "Return approved successfully."
        );

        closeDetails();

        await fetchReturns();
      } catch (err) {
        console.error(
          "Return approve error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to approve return."
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
    saleReturn
  ) => {
    setRejectTarget(
      saleReturn
    );

    setRejectReason("");

    setRejectOpen(true);
  };

  // ====================================================
  // CLOSE REJECT
  // ====================================================

  const closeRejectModal =
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
  // POST /returns/:id/reject
  // BODY: { reason }
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
            `/returns/${rejectTarget.id}/reject`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Return rejected successfully."
        );

        setRejectOpen(false);
        setRejectTarget(null);
        setRejectReason("");

        closeDetails();

        await fetchReturns();
      } catch (err) {
        console.error(
          "Return reject error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to reject return."
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancelModal = (
    saleReturn
  ) => {
    setCancelTarget(
      saleReturn
    );

    setCancelReason("");

    setCancelOpen(true);
  };

  // ====================================================
  // CLOSE CANCEL
  // ====================================================

  const closeCancelModal =
    () => {
      if (actionLoadingId) {
        return;
      }

      setCancelOpen(false);
      setCancelTarget(null);
      setCancelReason("");
    };

  // ====================================================
  // CANCEL
  //
  // POST /returns/:id/cancel
  // BODY: { reason }
  // ====================================================

  const handleCancel =
    async (event) => {
      event.preventDefault();

      if (!cancelTarget) {
        return;
      }

      try {
        setActionLoadingId(
          cancelTarget.id
        );

        setError("");
        setSuccess("");

        const reason =
          cancelReason.trim();

        if (
          reason.length < 2
        ) {
          throw new Error(
            "Cancellation reason must contain at least 2 characters."
          );
        }

        const response =
          await api.post(
            `/returns/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Return cancelled successfully."
        );

        setCancelOpen(false);
        setCancelTarget(null);
        setCancelReason("");

        closeDetails();

        await fetchReturns();
      } catch (err) {
        console.error(
          "Return cancel error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to cancel return."
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
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
              Returns
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review customer return
              requests and approve or
              reject them.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchReturns
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Returns
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {total}
            </p>
          </div>

          {/* VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Return Value
            </p>

            <p className="mt-2 text-xl font-bold text-purple-600">
              {formatMoney(
                pageAmount
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
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

              <Clock3
                size={23}
                className="text-amber-500"
              />
            </div>
          </div>

          {/* APPROVED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Approved
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {approvedCount}
                </p>
              </div>

              <Check
                size={23}
                className="text-blue-500"
              />
            </div>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {completedCount}
                </p>
              </div>

              <CheckCircle2
                size={23}
                className="text-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            TABLE CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_auto]">

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
                  placeholder="Search return number or sale..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

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
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Status
                </option>

                {RETURN_STATUSES.map(
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
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading returns...
                </p>
              </div>
            </div>
          ) : returns.length === 0 ? (

            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <RotateCcw
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No return requests
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Customer return
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

              <table className="w-full min-w-[1180px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Return No.
                    </th>

                    <th className="px-5 py-4">
                      Sale / Invoice
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Requested By
                    </th>

                    <th className="px-5 py-4">
                      Items
                    </th>

                    <th className="px-5 py-4">
                      Amount
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

                  {returns.map(
                    (saleReturn) => {
                      const branch =
                        getBranch(
                          saleReturn
                        );

                      const items =
                        getItems(
                          saleReturn
                        );

                      return (
                        <tr
                          key={
                            saleReturn.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* RETURN NUMBER */}

                          <td className="px-5 py-4">

                            <p className="max-w-52 truncate font-semibold text-blue-600">

                              {getReturnNumber(
                                saleReturn
                              )}

                            </p>
                          </td>

                          {/* SALE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <ReceiptText
                                size={16}
                                className="shrink-0 text-slate-400"
                              />

                              <span className="max-w-52 truncate text-sm font-medium text-slate-700">

                                {getSaleNumber(
                                  saleReturn
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

                                {branch?.name ||
                                  "—"}

                              </span>
                            </div>
                          </td>

                          {/* REQUESTER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <User
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="whitespace-nowrap text-sm font-medium text-slate-700">

                                {getRequester(
                                  saleReturn
                                )}

                              </span>
                            </div>
                          </td>

                          {/* ITEMS */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Package
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="font-semibold text-slate-700">

                                {items.length ||
                                  saleReturn
                                    ?._count
                                    ?.items ||
                                  0}

                              </span>
                            </div>
                          </td>

                          {/* AMOUNT */}

                          <td className="whitespace-nowrap px-5 py-4">

                            <span className="font-bold text-slate-900">

                              {formatMoney(
                                getReturnAmount(
                                  saleReturn
                                )
                              )}

                            </span>
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {formatDateTime(
                              saleReturn.createdAt ??
                                saleReturn.requestedAt
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                                saleReturn.status
                              )}`}
                            >

                              {displayText(
                                saleReturn.status
                              )}

                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                title="View return"
                                onClick={() =>
                                  openDetails(
                                    saleReturn
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              {/* APPROVE */}

                              {saleReturn.status ===
                                "PENDING" && (
                                <button
                                  type="button"
                                  title="Approve return"
                                  disabled={
                                    actionLoadingId ===
                                    saleReturn.id
                                  }
                                  onClick={() =>
                                    handleApprove(
                                      saleReturn
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                                >

                                  {actionLoadingId ===
                                  saleReturn.id ? (
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

                              {saleReturn.status ===
                                "PENDING" && (
                                <button
                                  type="button"
                                  title="Reject return"
                                  disabled={
                                    actionLoadingId ===
                                    saleReturn.id
                                  }
                                  onClick={() =>
                                    openRejectModal(
                                      saleReturn
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
            returns.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-sm text-slate-500">

                  Page{" "}

                  <span className="font-semibold text-slate-800">
                    {page}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {totalPages}
                  </span>

                  <span className="ml-2">
                    ({total} returns)
                  </span>
                </div>

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
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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
        selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Return Details
                  </h2>

                  <p className="mt-1 font-semibold text-blue-600">

                    {getReturnNumber(
                      selectedReturn
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

              {detailLoading ? (
                <div className="flex min-h-80 items-center justify-center">

                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="p-6">

                  {/* BASIC INFORMATION */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Return Number
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-blue-600">

                        {getReturnNumber(
                          selectedReturn
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Sale / Invoice
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-slate-800">

                        {getSaleNumber(
                          selectedReturn
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Requested By
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-800">

                        {getRequester(
                          selectedReturn
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                          selectedReturn.status
                        )}`}
                      >

                        {displayText(
                          selectedReturn.status
                        )}

                      </span>
                    </div>
                  </div>

                  {/* AMOUNT */}

                  <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-5">

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <p className="font-semibold text-purple-700">
                          Return Value
                        </p>

                        <p className="mt-1 text-xs text-purple-500">
                          Total value of
                          returned products
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-purple-700">

                        {formatMoney(
                          getReturnAmount(
                            selectedReturn
                          )
                        )}

                      </p>
                    </div>
                  </div>

                  {/* NOTE */}

                  {selectedReturn.note && (
                    <div className="mt-5 rounded-xl border border-slate-200 p-5">

                      <div className="flex items-start gap-3">

                        <MessageSquareText
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                          <p className="font-semibold text-slate-800">
                            Return Note
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                            {
                              selectedReturn.note
                            }

                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      RETURNED ITEMS
                  ======================================== */}

                  <div className="mt-7">

                    <div className="mb-4 flex items-center justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          Returned Items
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Products included
                          in this return.
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">

                        {getItems(
                          selectedReturn
                        ).length}

                      </span>
                    </div>

                    {getItems(
                      selectedReturn
                    ).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">

                        <Package
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm text-slate-400">
                          No return item
                          information.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">

                        <table className="w-full min-w-[750px]">

                          <thead className="bg-slate-50">

                            <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                              <th className="px-4 py-3">
                                Product
                              </th>

                              <th className="px-4 py-3">
                                Qty
                              </th>

                              <th className="px-4 py-3">
                                Price
                              </th>

                              <th className="px-4 py-3">
                                Restock
                              </th>

                              <th className="px-4 py-3">
                                Reason
                              </th>

                              <th className="px-4 py-3 text-right">
                                Total
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {getItems(
                              selectedReturn
                            ).map(
                              (
                                item,
                                index
                              ) => {
                                const product =
                                  getProduct(
                                    item
                                  );

                                const quantity =
                                  getQuantity(
                                    item
                                  );

                                const price =
                                  getItemPrice(
                                    item
                                  );

                                return (
                                  <tr
                                    key={
                                      item.id ??
                                      index
                                    }
                                  >

                                    {/* PRODUCT */}

                                    <td className="px-4 py-4">

                                      <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                          <Package
                                            size={18}
                                          />
                                        </div>

                                        <div>

                                          <p className="font-semibold text-slate-800">

                                            {product?.name ||
                                              item.productName ||
                                              "Product"}

                                          </p>

                                          <p className="mt-1 text-xs text-slate-400">

                                            SKU:{" "}

                                            {product?.sku ||
                                              item.sku ||
                                              "—"}

                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    {/* QTY */}

                                    <td className="px-4 py-4 font-semibold text-slate-700">
                                      {quantity}
                                    </td>

                                    {/* PRICE */}

                                    <td className="px-4 py-4 text-sm text-slate-600">

                                      {formatMoney(
                                        price
                                      )}

                                    </td>

                                    {/* RESTOCK */}

                                    <td className="px-4 py-4">

                                      <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                          item.restock !==
                                          false
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-red-50 text-red-600"
                                        }`}
                                      >
                                        {item.restock !==
                                        false
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </td>

                                    {/* REASON */}

                                    <td className="px-4 py-4">

                                      <p className="max-w-56 text-sm text-slate-600">

                                        {item.reason ||
                                          "—"}

                                      </p>
                                    </td>

                                    {/* TOTAL */}

                                    <td className="px-4 py-4 text-right font-bold text-slate-900">

                                      {formatMoney(
                                        quantity *
                                          price
                                      )}

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

                  {/* =======================================
                      REVIEW INFORMATION
                  ======================================== */}

                  {selectedReturn.status !==
                    "PENDING" && (
                    <div className="mt-6 rounded-xl bg-slate-50 p-5">

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
                              selectedReturn
                            )}

                          </p>
                        </div>

                        <div>

                          <p className="text-xs uppercase text-slate-400">
                            Reviewed At
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedReturn.approvedAt ??
                                selectedReturn.rejectedAt ??
                                selectedReturn.reviewedAt
                            )}

                          </p>
                        </div>
                      </div>

                      {(selectedReturn.rejectionReason ||
                        selectedReturn.cancelReason ||
                        selectedReturn.cancellationReason) && (
                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">

                          <p className="text-xs font-semibold uppercase text-red-500">
                            Reason
                          </p>

                          <p className="mt-2 text-sm text-red-700">

                            {selectedReturn.rejectionReason ||
                              selectedReturn.cancelReason ||
                              selectedReturn.cancellationReason}

                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =======================================
                      COMPLETED REFUND INFORMATION
                      DISPLAY ONLY
                  ======================================== */}

                  {selectedReturn.status ===
                    "COMPLETED" &&
                    getRefunds(
                      selectedReturn
                    ).length > 0 && (
                      <div className="mt-6">

                        <h3 className="font-bold text-slate-900">
                          Refund Information
                        </h3>

                        <div className="mt-4 space-y-3">

                          {getRefunds(
                            selectedReturn
                          ).map(
                            (
                              refund,
                              index
                            ) => (
                              <div
                                key={
                                  refund.id ??
                                  index
                                }
                                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                              >

                                <div>

                                  <p className="text-sm font-semibold text-slate-800">

                                    {refund.method ||
                                      refund.refundMethod ||
                                      "Refund"}

                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">

                                    {refund.transactionReference ||
                                      refund.refundNumber ||
                                      "—"}

                                  </p>
                                </div>

                                <p className="font-bold text-emerald-600">

                                  {formatMoney(
                                    refund.amount
                                  )}

                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* =======================================
                      ADMIN ACTIONS
                  ======================================== */}

                  {selectedReturn.status ===
                    "PENDING" && (
                    <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                      {/* CANCEL */}

                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedReturn.id
                        }
                        onClick={() => {
                          setDetailsOpen(false);

                          openCancelModal(
                            selectedReturn
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Ban
                          size={17}
                        />

                        Cancel Return
                      </button>

                      {/* REJECT */}

                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedReturn.id
                        }
                        onClick={() => {
                          setDetailsOpen(false);

                          openRejectModal(
                            selectedReturn
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <X
                          size={17}
                        />

                        Reject
                      </button>

                      {/* APPROVE */}

                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedReturn.id
                        }
                        onClick={() =>
                          handleApprove(
                            selectedReturn
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-400"
                      >

                        {actionLoadingId ===
                        selectedReturn.id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Check
                            size={17}
                          />
                        )}

                        Approve Return
                      </button>
                    </div>
                  )}

                  {/* =======================================
                      APPROVED MESSAGE
                      Refund is cashier responsibility.
                  ======================================== */}

                  {selectedReturn.status ===
                    "APPROVED" && (
                    <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                          <p className="font-semibold text-blue-700">
                            Return Approved
                          </p>

                          <p className="mt-1 text-sm text-blue-600">
                            This return is
                            approved. Refund
                            processing must
                            be completed from
                            the cashier
                            workflow.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                    Reject Return
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

                    {getReturnNumber(
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
                    closeRejectModal
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

                    <p className="text-sm text-red-600">
                      Rejected return
                      request will not
                      proceed to refund
                      processing.
                    </p>
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
                    onChange={(e) =>
                      setRejectReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter rejection reason..."
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
                      closeRejectModal
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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

                    Reject Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =================================================
          CANCEL MODAL
      ================================================= */}

      {cancelOpen &&
        cancelTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Cancel Return
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

                    {getReturnNumber(
                      cancelTarget
                    )}

                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    actionLoadingId ===
                    cancelTarget.id
                  }
                  onClick={
                    closeCancelModal
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleCancel
                }
                className="p-6"
              >

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-sm text-amber-700">
                      Enter a clear
                      reason before
                      cancelling this
                      return request.
                    </p>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cancellation Reason *
                  </label>

                  <textarea
                    rows={4}
                    required
                    minLength={2}
                    maxLength={500}
                    value={
                      cancelReason
                    }
                    onChange={(e) =>
                      setCancelReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter cancellation reason..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  />

                  <div className="mt-1 flex justify-between text-xs text-slate-400">

                    <span>
                      Minimum 2 characters
                    </span>

                    <span>
                      {cancelReason.length}/500
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    disabled={
                      actionLoadingId ===
                      cancelTarget.id
                    }
                    onClick={
                      closeCancelModal
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoadingId ===
                      cancelTarget.id
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
                  >

                    {actionLoadingId ===
                      cancelTarget.id && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    Cancel Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default Returns;