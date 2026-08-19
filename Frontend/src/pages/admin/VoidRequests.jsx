import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ReceiptText,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Banknote,
  CalendarDays,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// VOID STATUS
// ======================================================

const VOID_STATUSES = [
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

const VoidRequests = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    voidRequests,
    setVoidRequests,
  ] = useState([]);

  const [
    branches,
    setBranches,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState(null);

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
    selectedVoid,
    setSelectedVoid,
  ] = useState(null);

  const [
    selectedSale,
    setSelectedSale,
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

  const loadBranches =
    async () => {
      try {
        const response =
          await api.get(
            "/branches"
          );

        const result =
          response.data?.data;

        const branchData =
          result?.branches ??
          response.data
            ?.branches ??
          (Array.isArray(result)
            ? result
            : []);

        setBranches(
          Array.isArray(
            branchData
          )
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
  // FETCH VOID REQUESTS
  //
  // GET /api/voids
  // ====================================================

  const fetchVoidRequests =
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
            "/voids",
            {
              params,
            }
          );

        console.log(
          "Void Requests Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const requestData =
          result.voidRequests ??
          result.voids ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeData =
          Array.isArray(
            requestData
          )
            ? requestData
            : [];

        setVoidRequests(
          safeData
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
              response.data
                ?.count ??
              safeData.length
          );

        const calculatedPages =
          Math.ceil(
            responseTotal /
              limit
          );

        const rawPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        setTotal(
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeData.length
        );

        setTotalPages(
          Math.max(
            1,
            Number(rawPages) ||
              1
          )
        );
      } catch (err) {
        console.error(
          "Void request load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load void requests."
        );

        setVoidRequests(
          []
        );

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
    fetchVoidRequests();
  }, [
    page,
    limit,
    search,
    statusFilter,
    branchFilter,
  ]);

  // ====================================================
  // VOID NUMBER
  // ====================================================

  const getVoidNumber = (
    voidRequest
  ) => {
    return (
      voidRequest?.voidNumber ??
      voidRequest?.number ??
      voidRequest?.voidNo ??
      voidRequest?.id ??
      "—"
    );
  };

  // ====================================================
  // SALE
  // ====================================================

  const getSale = (
    voidRequest
  ) => {
    return (
      voidRequest?.sale ??
      selectedSale ??
      null
    );
  };

  // ====================================================
  // SALE NUMBER
  // ====================================================

  const getSaleNumber = (
    voidRequest
  ) => {
    const sale =
      voidRequest?.sale;

    return (
      sale?.invoiceNumber ??
      sale?.saleNumber ??
      voidRequest
        ?.invoiceNumber ??
      voidRequest
        ?.saleNumber ??
      voidRequest?.saleId ??
      "—"
    );
  };

  // ====================================================
  // SALE TOTAL
  // ====================================================

  const getSaleTotal = (
    voidRequest
  ) => {
    const sale =
      getSale(voidRequest);

    return Number(
      sale?.grandTotal ??
        sale?.totalAmount ??
        sale?.total ??
        voidRequest
          ?.saleAmount ??
        voidRequest?.amount ??
        0
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    voidRequest
  ) => {
    if (
      voidRequest?.branch
    ) {
      return voidRequest.branch;
    }

    if (
      voidRequest?.sale
        ?.branch
    ) {
      return voidRequest
        .sale.branch;
    }

    const branchId =
      voidRequest?.branchId ??
      voidRequest?.sale
        ?.branchId;

    return branches.find(
      (branch) =>
        branch.id ===
        branchId
    );
  };

  // ====================================================
  // REQUESTER
  // ====================================================

  const getRequester = (
    voidRequest
  ) => {
    const user =
      voidRequest
        ?.requestedBy ??
      voidRequest?.requester ??
      voidRequest?.createdBy ??
      voidRequest?.cashier ??
      voidRequest?.user ??
      voidRequest?.sale
        ?.cashier;

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
  // REVIEWER
  // ====================================================

  const getReviewer = (
    voidRequest
  ) => {
    const user =
      voidRequest?.approvedBy ??
      voidRequest?.rejectedBy ??
      voidRequest?.reviewedBy ??
      voidRequest?.approver;

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
  // PAYMENT INFO
  // ====================================================

  const getPayments = (
    voidRequest
  ) => {
    const sale =
      getSale(voidRequest);

    const payments =
      voidRequest?.payments ??
      sale?.payments ??
      [];

    return Array.isArray(
      payments
    )
      ? payments
      : [];
  };

  // ====================================================
  // CURRENT PAGE STATS
  // ====================================================

  const pendingCount =
    voidRequests.filter(
      (item) =>
        item.status ===
        "PENDING"
    ).length;

  const approvedCount =
    voidRequests.filter(
      (item) =>
        item.status ===
        "APPROVED"
    ).length;

  const completedCount =
    voidRequests.filter(
      (item) =>
        item.status ===
        "COMPLETED"
    ).length;

  const pageVoidValue =
    useMemo(() => {
      return voidRequests.reduce(
        (
          totalValue,
          voidRequest
        ) =>
          totalValue +
          getSaleTotal(
            voidRequest
          ),
        0
      );
    }, [voidRequests]);

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
  // GET /voids/:id
  // ====================================================

  const openDetails =
    async (voidRequest) => {
      try {
        setSelectedVoid(
          voidRequest
        );

        setSelectedSale(
          voidRequest?.sale ??
            null
        );

        setDetailsOpen(true);

        setDetailLoading(
          true
        );

        setError("");

        const response =
          await api.get(
            `/voids/${voidRequest.id}`
          );

        console.log(
          "Void Detail Response:",
          response.data
        );

        const detailed =
          response.data?.data
            ?.voidRequest ??
          response.data?.data
            ?.void ??
          response.data?.data ??
          voidRequest;

        setSelectedVoid(
          detailed
        );

        if (
          detailed?.sale
        ) {
          setSelectedSale(
            detailed.sale
          );
        } else if (
          detailed?.saleId
        ) {
          try {
            const saleResponse =
              await api.get(
                `/sales/${detailed.saleId}`
              );

            const sale =
              saleResponse.data
                ?.data?.sale ??
              saleResponse.data
                ?.data ??
              null;

            setSelectedSale(
              sale
            );
          } catch (
            saleError
          ) {
            console.error(
              "Void sale detail error:",
              saleError.response
                ?.data ||
                saleError.message
            );
          }
        }
      } catch (err) {
        console.error(
          "Void detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load void request details."
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
    setSelectedVoid(null);
    setSelectedSale(null);
  };

  // ====================================================
  // APPROVE
  //
  // POST /voids/:id/approve
  // ADMIN / MANAGER
  // ====================================================

  const handleApprove =
    async (voidRequest) => {
      const confirmed =
        window.confirm(
          `Approve void request ${getVoidNumber(
            voidRequest
          )}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoadingId(
          voidRequest.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/voids/${voidRequest.id}/approve`
          );

        setSuccess(
          response.data?.message ||
            "Void request approved successfully."
        );

        closeDetails();

        await fetchVoidRequests();
      } catch (err) {
        console.error(
          "Void approve error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to approve void request."
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
    voidRequest
  ) => {
    setRejectTarget(
      voidRequest
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
  // POST /voids/:id/reject
  // BODY { reason }
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
            `/voids/${rejectTarget.id}/reject`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Void request rejected successfully."
        );

        setRejectOpen(false);
        setRejectTarget(null);
        setRejectReason("");

        closeDetails();

        await fetchVoidRequests();
      } catch (err) {
        console.error(
          "Void reject error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to reject void request."
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
    voidRequest
  ) => {
    setCancelTarget(
      voidRequest
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
  // POST /voids/:id/cancel
  // BODY { reason }
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
            `/voids/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data?.message ||
            "Void request cancelled successfully."
        );

        setCancelOpen(false);
        setCancelTarget(null);
        setCancelReason("");

        closeDetails();

        await fetchVoidRequests();
      } catch (err) {
        console.error(
          "Void cancel error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to cancel void request."
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
              Void Requests
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review sale void
              requests and approve or
              reject them.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchVoidRequests
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
              Total Requests
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {total}
            </p>
          </div>

          {/* VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Void Value
            </p>

            <p className="mt-2 text-xl font-bold text-purple-600">
              {formatMoney(
                pageVoidValue
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
            MAIN CARD
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
                  placeholder="Search void number or sale..."
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

                {VOID_STATUSES.map(
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
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading void
                  requests...
                </p>
              </div>
            </div>
          ) : voidRequests.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <Ban
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No void requests
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Cashier void
                  requests will appear
                  here.
                </p>
              </div>
            </div>
          ) : (
            /* TABLE */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1180px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Void No.
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
                      Sale Value
                    </th>

                    <th className="px-5 py-4">
                      Reason
                    </th>

                    <th className="px-5 py-4">
                      Date
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

                  {voidRequests.map(
                    (voidRequest) => {
                      const branch =
                        getBranch(
                          voidRequest
                        );

                      return (
                        <tr
                          key={
                            voidRequest.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* VOID NUMBER */}

                          <td className="px-5 py-4">

                            <p className="max-w-52 truncate font-semibold text-red-600">

                              {getVoidNumber(
                                voidRequest
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
                                  voidRequest
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

                              <span className="whitespace-nowrap text-sm text-slate-700">

                                {getRequester(
                                  voidRequest
                                )}

                              </span>
                            </div>
                          </td>

                          {/* VALUE */}

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">

                            {formatMoney(
                              getSaleTotal(
                                voidRequest
                              )
                            )}

                          </td>

                          {/* REASON */}

                          <td className="px-5 py-4">

                            <p
                              title={
                                voidRequest.reason ||
                                ""
                              }
                              className="max-w-56 truncate text-sm text-slate-600"
                            >
                              {voidRequest.reason ||
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
                                voidRequest.createdAt ??
                                  voidRequest.requestedAt
                              )}
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                                voidRequest.status
                              )}`}
                            >
                              {displayText(
                                voidRequest.status
                              )}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                title="View details"
                                onClick={() =>
                                  openDetails(
                                    voidRequest
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              {/* APPROVE */}

                              {voidRequest.status ===
                                "PENDING" && (
                                <button
                                  type="button"
                                  title="Approve"
                                  disabled={
                                    actionLoadingId ===
                                    voidRequest.id
                                  }
                                  onClick={() =>
                                    handleApprove(
                                      voidRequest
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                                >

                                  {actionLoadingId ===
                                  voidRequest.id ? (
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

                              {voidRequest.status ===
                                "PENDING" && (
                                <button
                                  type="button"
                                  title="Reject"
                                  disabled={
                                    actionLoadingId ===
                                    voidRequest.id
                                  }
                                  onClick={() =>
                                    openRejectModal(
                                      voidRequest
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
            voidRequests.length >
              0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-sm text-slate-500">

                  Page{" "}

                  <span className="font-semibold text-slate-800">
                    {page}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-slate-800">
                    {
                      totalPages
                    }
                  </span>

                  <span className="ml-2">
                    ({total} void requests)
                  </span>
                </div>

                <div className="flex items-center gap-3">

                  <select
                    value={
                      limit
                    }
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 disabled:opacity-40"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 disabled:opacity-40"
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
        selectedVoid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Void Request Details
                  </h2>

                  <p className="mt-1 font-semibold text-red-600">

                    {getVoidNumber(
                      selectedVoid
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

                  {/* BASIC */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Void Number
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-red-600">

                        {getVoidNumber(
                          selectedVoid
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Sale / Invoice
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-slate-800">

                        {getSaleNumber(
                          selectedVoid
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Requested By
                      </p>

                      <p className="mt-2 text-sm font-semibold text-slate-800">

                        {getRequester(
                          selectedVoid
                        )}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                          selectedVoid.status
                        )}`}
                      >
                        {displayText(
                          selectedVoid.status
                        )}
                      </span>
                    </div>
                  </div>

                  {/* SALE VALUE */}

                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-semibold text-red-700">
                          Sale Value
                        </p>

                        <p className="mt-1 text-xs text-red-500">
                          Total value of
                          sale requested
                          for void
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-red-700">

                        {formatMoney(
                          getSaleTotal(
                            selectedVoid
                          )
                        )}

                      </p>
                    </div>
                  </div>

                  {/* REASON */}

                  <div className="mt-5 rounded-xl border border-slate-200 p-5">

                    <div className="flex items-start gap-3">

                      <MessageSquareText
                        size={20}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <div>

                        <p className="font-semibold text-slate-800">
                          Void Reason
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                          {selectedVoid.reason ||
                            "No reason provided."}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SALE DETAILS */}

                  {selectedSale && (
                    <div className="mt-6 rounded-xl border border-slate-200 p-5">

                      <h3 className="font-bold text-slate-900">
                        Original Sale
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
                            Discount
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
                  )}

                  {/* PAYMENTS */}

                  {getPayments(
                    selectedVoid
                  ).length > 0 && (
                    <div className="mt-6">

                      <h3 className="font-bold text-slate-900">
                        Sale Payments
                      </h3>

                      <div className="mt-4 space-y-3">

                        {getPayments(
                          selectedVoid
                        ).map(
                          (
                            payment,
                            index
                          ) => (
                            <div
                              key={
                                payment.id ??
                                index
                              }
                              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                            >

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                                  <Banknote
                                    size={18}
                                  />
                                </div>

                                <div>

                                  <p className="font-semibold text-slate-800">
                                    {payment.method ||
                                      "Payment"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">

                                    {payment.paymentNumber ||
                                      payment.transactionReference ||
                                      "—"}

                                  </p>
                                </div>
                              </div>

                              <p className="font-bold text-slate-900">

                                {formatMoney(
                                  payment.amount
                                )}

                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* REVIEW */}

                  {selectedVoid.status !==
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
                              selectedVoid
                            )}

                          </p>
                        </div>

                        <div>

                          <p className="text-xs uppercase text-slate-400">
                            Reviewed At
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedVoid.approvedAt ??
                                selectedVoid.rejectedAt ??
                                selectedVoid.reviewedAt
                            )}

                          </p>
                        </div>
                      </div>

                      {(selectedVoid.rejectionReason ||
                        selectedVoid.cancelReason ||
                        selectedVoid.cancellationReason) && (
                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">

                          <p className="text-xs font-semibold uppercase text-red-500">
                            Reason
                          </p>

                          <p className="mt-2 text-sm text-red-700">

                            {selectedVoid.rejectionReason ||
                              selectedVoid.cancelReason ||
                              selectedVoid.cancellationReason}

                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ADMIN ACTIONS */}

                  {selectedVoid.status ===
                    "PENDING" && (
                    <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                      {/* CANCEL */}

                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedVoid.id
                        }
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openCancelModal(
                            selectedVoid
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >

                        <Ban
                          size={17}
                        />

                        Cancel Request
                      </button>

                      {/* REJECT */}

                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedVoid.id
                        }
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openRejectModal(
                            selectedVoid
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
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
                          selectedVoid.id
                        }
                        onClick={() =>
                          handleApprove(
                            selectedVoid
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                      >

                        {actionLoadingId ===
                        selectedVoid.id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Check
                            size={17}
                          />
                        )}

                        Approve Void
                      </button>
                    </div>
                  )}

                  {/* APPROVED */}

                  {selectedVoid.status ===
                    "APPROVED" && (
                    <div className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                          <p className="font-semibold text-blue-700">
                            Void Approved
                          </p>

                          <p className="mt-1 text-sm text-blue-600">
                            This void
                            request has been
                            approved. The
                            cashier must
                            execute the void
                            transaction.
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

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Reject Void Request
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {getVoidNumber(
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
                >
                  <X size={20} />
                </button>
              </div>

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
                      Rejected void
                      request cannot
                      proceed to execution.
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
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {rejectReason.length}/500
                  </p>
                </div>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={
                      closeRejectModal
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoadingId ===
                      rejectTarget.id
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-red-400"
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

      {/* =================================================
          CANCEL MODAL
      ================================================= */}

      {cancelOpen &&
        cancelTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Cancel Void Request
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {getVoidNumber(
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
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={
                  handleCancel
                }
                className="p-6"
              >

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
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {cancelReason.length}/500
                </p>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={
                      closeCancelModal
                    }
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoadingId ===
                      cancelTarget.id
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
                  >

                    {actionLoadingId ===
                      cancelTarget.id && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    Cancel Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default VoidRequests;