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
  Package,
  CalendarDays,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Hourglass,
  CircleX,
  Hash,
  Banknote,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// VOID STATUSES
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

const formatNumber = (value) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "en-LK",
    {
      maximumFractionDigits: 3,
    }
  ).format(number);
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

// ======================================================
// STATUS STYLE
// ======================================================

const getStatusStyle = (status) => {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "APPROVED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-600";

    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

// ======================================================
// VOID REQUEST PAGE
// ======================================================

const VoidRequests = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    voidRequests,
    setVoidRequests,
  ] = useState([]);

  // ====================================================
  // LOADING
  // ====================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    actionLoadingId,
    setActionLoadingId,
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
  // DETAILS
  // ====================================================

  const [
    selectedVoid,
    setSelectedVoid,
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
  // FETCH VOID REQUESTS
  //
  // GET /voids
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

        const response =
          await api.get(
            "/voids",
            {
              params,
            }
          );

        console.log(
          "Manager Void Requests:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.voidRequests ??
          result.voids ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeData =
          Array.isArray(data)
            ? data
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
              response.data?.count ??
              safeData.length
          );

        const safeTotal =
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeData.length;

        const calculatedPages =
          Math.ceil(
            safeTotal /
              limit
          );

        const rawPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        setTotal(
          safeTotal
        );

        setTotalPages(
          Math.max(
            1,
            Number(
              rawPages
            ) || 1
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

        setVoidRequests([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // LOAD
  // ====================================================

  useEffect(() => {
    fetchVoidRequests();
  }, [
    page,
    limit,
    search,
    statusFilter,
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
      voidRequest?.requestNumber ??
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
      voidRequest
        ?.originalSale ??
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
      getSale(
        voidRequest
      );

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
  // BRANCH
  // ====================================================

  const getBranch = (
    voidRequest
  ) => {
    const sale =
      getSale(
        voidRequest
      );

    return (
      voidRequest?.branch ??
      sale?.branch ??
      sale?.shift?.branch ??
      voidRequest
        ?.shift?.branch ??
      null
    );
  };

  // ====================================================
  // BRANCH NAME
  // ====================================================

  const getBranchName = (
    voidRequest
  ) => {
    const branch =
      getBranch(
        voidRequest
      );

    return (
      branch?.name ??
      branch?.code ??
      voidRequest
        ?.branchName ??
      "—"
    );
  };

  // ====================================================
  // REQUESTER
  // ====================================================

  const getRequester = (
    voidRequest
  ) => {
    const sale =
      getSale(
        voidRequest
      );

    const user =
      voidRequest
        ?.requestedBy ??
      voidRequest
        ?.requester ??
      voidRequest
        ?.createdBy ??
      voidRequest
        ?.cashier ??
      voidRequest?.user ??
      sale?.cashier ??
      sale?.shift
        ?.cashier ??
      sale?.shift?.user;

    if (!user) {
      return (
        voidRequest
          ?.cashierName ??
        voidRequest
          ?.requestedByName ??
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
    voidRequest
  ) => {
    const user =
      voidRequest
        ?.approvedBy ??
      voidRequest
        ?.rejectedBy ??
      voidRequest
        ?.reviewedBy ??
      voidRequest
        ?.approver;

    if (!user) {
      return (
        voidRequest
          ?.approvedByName ??
        voidRequest
          ?.rejectedByName ??
        voidRequest
          ?.reviewedByName ??
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
  // ITEMS
  // ====================================================

  const getItems = (
    voidRequest
  ) => {
    const items =
      voidRequest?.items ??
      voidRequest
        ?.voidItems ??
      [];

    return Array.isArray(
      items
    )
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
      item?.saleItem
        ?.product ??
      item
        ?.originalSaleItem
        ?.product ??
      null
    );
  };

  // ====================================================
  // PRODUCT NAME
  // ====================================================

  const getProductName = (
    item
  ) => {
    return (
      getProduct(item)
        ?.name ??
      item?.productName ??
      item?.saleItem
        ?.productName ??
      "Product"
    );
  };

  // ====================================================
  // SKU
  // ====================================================

  const getProductSku = (
    item
  ) => {
    return (
      getProduct(item)?.sku ??
      item?.sku ??
      item?.saleItem?.sku ??
      "—"
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
          item
            ?.voidQuantity ??
          0
      ) || 0
    );
  };

  // ====================================================
  // UNIT PRICE
  // ====================================================

  const getUnitPrice = (
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
  // LINE TOTAL
  // ====================================================

  const getLineTotal = (
    item
  ) => {
    const direct =
      item?.totalAmount ??
      item?.lineTotal ??
      item?.total;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return (
        Number(direct) || 0
      );
    }

    return (
      getQuantity(item) *
      getUnitPrice(item)
    );
  };

  // ====================================================
  // ITEM COUNT
  // ====================================================

  const getItemCount = (
    voidRequest
  ) => {
    const items =
      getItems(
        voidRequest
      );

    if (items.length > 0) {
      return items.reduce(
        (sum, item) =>
          sum +
          getQuantity(item),
        0
      );
    }

    return (
      Number(
        voidRequest?._count
          ?.voidItems ??
          voidRequest
            ?.itemCount ??
          0
      ) || 0
    );
  };

  // ====================================================
  // VOID AMOUNT
  // ====================================================

  const getVoidAmount = (
    voidRequest
  ) => {
    const direct =
      voidRequest
        ?.voidAmount ??
      voidRequest
        ?.totalVoidAmount ??
      voidRequest
        ?.totalAmount ??
      voidRequest?.amount;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return (
        Number(direct) || 0
      );
    }

    const items =
      getItems(
        voidRequest
      );

    if (items.length > 0) {
      return items.reduce(
        (sum, item) =>
          sum +
          getLineTotal(item),
        0
      );
    }

    const sale =
      getSale(
        voidRequest
      );

    return (
      Number(
        sale?.grandTotal ??
          sale?.totalAmount ??
          sale?.total ??
          0
      ) || 0
    );
  };

  // ====================================================
  // REQUEST REASON
  // ====================================================

  const getReason = (
    voidRequest
  ) => {
    return (
      voidRequest?.reason ??
      voidRequest?.note ??
      "—"
    );
  };

  // ====================================================
  // REJECTION REASON
  // ====================================================

  const getRejectionReason = (
    voidRequest
  ) => {
    return (
      voidRequest
        ?.rejectionReason ??
      voidRequest
        ?.rejectReason ??
      voidRequest
        ?.rejectedReason ??
      "—"
    );
  };

  // ====================================================
  // CANCEL REASON
  // ====================================================

  const getCancellationReason = (
    voidRequest
  ) => {
    return (
      voidRequest
        ?.cancellationReason ??
      voidRequest
        ?.cancelReason ??
      voidRequest
        ?.cancelledReason ??
      "—"
    );
  };

  // ====================================================
  // STATS
  // ====================================================

  const pendingCount =
    voidRequests.filter(
      (request) =>
        request.status ===
        "PENDING"
    ).length;

  const approvedCount =
    voidRequests.filter(
      (request) =>
        request.status ===
        "APPROVED"
    ).length;

  const processingCount =
    voidRequests.filter(
      (request) =>
        request.status ===
        "PROCESSING"
    ).length;

  const completedCount =
    voidRequests.filter(
      (request) =>
        request.status ===
        "COMPLETED"
    ).length;

  const pageVoidAmount =
    useMemo(() => {
      return voidRequests.reduce(
        (sum, request) =>
          sum +
          getVoidAmount(
            request
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

  const resetFilters =
    () => {
      setSearchInput("");
      setSearch("");
      setStatusFilter("");
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

        setDetailsOpen(true);
        setDetailLoading(true);
        setError("");

        const response =
          await api.get(
            `/voids/${voidRequest.id}`
          );

        console.log(
          "Void Detail:",
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

  const closeDetails =
    () => {
      setDetailsOpen(false);
      setSelectedVoid(null);
    };

  // ====================================================
  // APPROVE
  //
  // POST /voids/:id/approve
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
          response.data
            ?.message ||
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
            `/voids/${rejectTarget.id}/reject`,
            {
              reason,
            }
          );

        setSuccess(
          response.data
            ?.message ||
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
  // ====================================================

  const handleCancel =
    async (event) => {
      event.preventDefault();

      if (!cancelTarget) {
        return;
      }

      try {
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

        if (
          reason.length > 500
        ) {
          throw new Error(
            "Cancellation reason cannot exceed 500 characters."
          );
        }

        setActionLoadingId(
          cancelTarget.id
        );

        const response =
          await api.post(
            `/voids/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data
            ?.message ||
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
              Review cashier void
              requests and approve or
              reject sale cancellations.
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
            KPI
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Requests
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">

                <Ban
                  size={22}
                />
              </div>
            </div>
          </div>

          {/* VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Void Value
            </p>

            <p className="mt-2 text-xl font-bold text-red-600">

              {formatMoney(
                pageVoidAmount
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

                <p className="mt-1 text-xs text-slate-400">
                  Current page
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

                {processingCount >
                  0 && (
                  <p className="mt-1 text-xs text-purple-500">
                    {
                      processingCount
                    }{" "}
                    processing
                  </p>
                )}
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

          {/* =================================================
              FILTER
          ================================================= */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_auto]">

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
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  placeholder="Search void number, invoice or sale..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

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
                  size={34}
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
            /* =================================================
                EMPTY
            ================================================= */

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
            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1300px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Void No.
                    </th>

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
                      Items
                    </th>

                    <th className="px-5 py-4">
                      Amount
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
                    (voidRequest) => (
                      <tr
                        key={
                          voidRequest.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* VOID NUMBER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">

                              <Ban
                                size={18}
                              />
                            </div>

                            <p className="max-w-48 truncate text-sm font-bold text-blue-600">

                              {getVoidNumber(
                                voidRequest
                              )}

                            </p>
                          </div>
                        </td>

                        {/* SALE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <ReceiptText
                              size={15}
                              className="text-blue-500"
                            />

                            <span className="max-w-48 truncate text-sm font-semibold text-slate-700">

                              {getSaleNumber(
                                voidRequest
                              )}

                            </span>
                          </div>
                        </td>

                        {/* REQUESTER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                              <User
                                size={14}
                              />
                            </div>

                            <span className="max-w-40 truncate text-sm font-medium text-slate-700">

                              {getRequester(
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

                            <span className="max-w-44 truncate text-sm text-slate-600">

                              {getBranchName(
                                voidRequest
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

                              {formatNumber(
                                getItemCount(
                                  voidRequest
                                )
                              )}

                            </span>
                          </div>
                        </td>

                        {/* AMOUNT */}

                        <td className="whitespace-nowrap px-5 py-4 font-bold text-red-600">

                          {formatMoney(
                            getVoidAmount(
                              voidRequest
                            )
                          )}

                        </td>

                        {/* REASON */}

                        <td className="px-5 py-4">

                          <p
                            title={
                              getReason(
                                voidRequest
                              ) ?? ""
                            }
                            className="max-w-56 truncate text-sm text-slate-600"
                          >

                            {getReason(
                              voidRequest
                            )}

                          </p>
                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                          {formatDateTime(
                            voidRequest
                              .createdAt ??
                              voidRequest
                                .requestedAt
                          )}

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
                              title="View Details"
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
                                title="Approve Void"
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
                                title="Reject Void"
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
                    )
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
                    ({total} void
                    requests)
                  </span>
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
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedVoid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Void Request Details
                  </h2>

                  <p className="mt-1 font-semibold text-blue-600">

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
                  <X
                    size={21}
                  />
                </button>
              </div>

              {/* LOADING */}

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
                      TOP SUMMARY
                  ======================================== */}

                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">

                        <Ban
                          size={23}
                        />
                      </div>

                      <div>

                        <p className="font-bold text-slate-900">

                          {getVoidNumber(
                            selectedVoid
                          )}

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                          {formatDateTime(
                            selectedVoid
                              .createdAt ??
                              selectedVoid
                                .requestedAt
                          )}

                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          selectedVoid.status
                        )}`}
                      >

                        {displayText(
                          selectedVoid.status
                        )}

                      </span>

                      <p className="text-xl font-bold text-red-600">

                        {formatMoney(
                          getVoidAmount(
                            selectedVoid
                          )
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      REQUEST INFORMATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Request Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      {/* SALE */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Sale / Invoice
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <ReceiptText
                            size={15}
                            className="text-blue-600"
                          />

                          <p className="break-all text-sm font-semibold text-blue-600">

                            {getSaleNumber(
                              selectedVoid
                            )}

                          </p>
                        </div>
                      </div>

                      {/* REQUESTER */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Requested By
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <User
                            size={15}
                            className="text-purple-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {getRequester(
                              selectedVoid
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
                            size={15}
                            className="text-emerald-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {getBranchName(
                              selectedVoid
                            )}

                          </p>
                        </div>
                      </div>

                      {/* ITEMS */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Items
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Package
                            size={15}
                            className="text-amber-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {formatNumber(
                              getItemCount(
                                selectedVoid
                              )
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      REASON
                  ======================================== */}

                  <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">

                    <div className="flex items-start gap-3">

                      <MessageSquareText
                        size={19}
                        className="mt-0.5 shrink-0 text-red-600"
                      />

                      <div>

                        <p className="font-semibold text-red-700">
                          Void Reason
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">

                          {getReason(
                            selectedVoid
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      ITEMS
                  ======================================== */}

                  <div>

                    <div className="flex items-center justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          Void Items
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Products included
                          in this void
                          request.
                        </p>
                      </div>

                      <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">

                        {formatNumber(
                          getItemCount(
                            selectedVoid
                          )
                        )}{" "}
                        qty

                      </span>
                    </div>

                    {getItems(
                      selectedVoid
                    ).length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-10 text-center">

                        <Package
                          size={30}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm text-slate-400">
                          No individual
                          void items were
                          returned by the
                          API.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[750px]">

                            <thead className="bg-slate-50">

                              <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                                <th className="px-4 py-3">
                                  Product
                                </th>

                                <th className="px-4 py-3">
                                  SKU
                                </th>

                                <th className="px-4 py-3">
                                  Qty
                                </th>

                                <th className="px-4 py-3">
                                  Unit Price
                                </th>

                                <th className="px-4 py-3 text-right">
                                  Total
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                              {getItems(
                                selectedVoid
                              ).map(
                                (
                                  item,
                                  index
                                ) => (
                                  <tr
                                    key={
                                      item.id ??
                                      index
                                    }
                                  >

                                    <td className="px-4 py-4">

                                      <div className="flex items-center gap-3">

                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                          <Package
                                            size={16}
                                          />
                                        </div>

                                        <p className="font-semibold text-slate-800">

                                          {getProductName(
                                            item
                                          )}

                                        </p>
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 font-mono text-sm text-slate-500">

                                      {getProductSku(
                                        item
                                      )}

                                    </td>

                                    <td className="px-4 py-4 font-bold text-slate-700">

                                      {formatNumber(
                                        getQuantity(
                                          item
                                        )
                                      )}

                                    </td>

                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">

                                      {formatMoney(
                                        getUnitPrice(
                                          item
                                        )
                                      )}

                                    </td>

                                    <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-red-600">

                                      {formatMoney(
                                        getLineTotal(
                                          item
                                        )
                                      )}

                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =======================================
                      VOID TOTAL
                  ======================================== */}

                  <div className="ml-auto w-full max-w-md rounded-2xl bg-red-50 p-5">

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <p className="font-semibold text-red-700">
                          Total Void Amount
                        </p>

                        <p className="mt-1 text-xs text-red-500">
                          Value affected by
                          this void.
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-red-700">

                        {formatMoney(
                          getVoidAmount(
                            selectedVoid
                          )
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      REVIEW INFORMATION
                  ======================================== */}

                  {selectedVoid.status !==
                    "PENDING" && (
                    <div>

                      <h3 className="font-bold text-slate-900">
                        Review Information
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <div className="rounded-xl border border-slate-200 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Reviewed By
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">

                            {getReviewer(
                              selectedVoid
                            )}

                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Reviewed / Updated
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedVoid
                                .approvedAt ??
                                selectedVoid
                                  .rejectedAt ??
                                selectedVoid
                                  .reviewedAt ??
                                selectedVoid
                                  .updatedAt
                            )}

                          </p>
                        </div>
                      </div>

                      {/* REJECT */}

                      {selectedVoid.status ===
                        "REJECTED" && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                          <p className="text-xs font-semibold uppercase text-red-500">
                            Rejection Reason
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">

                            {getRejectionReason(
                              selectedVoid
                            )}

                          </p>
                        </div>
                      )}

                      {/* CANCEL */}

                      {selectedVoid.status ===
                        "CANCELLED" && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Cancellation Reason
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">

                            {getCancellationReason(
                              selectedVoid
                            )}

                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =======================================
                      IDS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Void ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {selectedVoid.id ??
                          "—"}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Sale ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {selectedVoid.saleId ??
                          getSale(
                            selectedVoid
                          )?.id ??
                          "—"}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      PENDING ACTIONS
                  ======================================== */}

                  {selectedVoid.status ===
                    "PENDING" && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                      {/* CANCEL */}

                      <button
                        type="button"
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openCancelModal(
                            selectedVoid
                          );
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >

                        <Ban
                          size={17}
                        />

                        Cancel Request
                      </button>

                      {/* REJECT */}

                      <button
                        type="button"
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

                          openRejectModal(
                            selectedVoid
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
                          selectedVoid.id
                        }
                        onClick={() =>
                          handleApprove(
                            selectedVoid
                          )
                        }
                        className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-400"
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

                  {/* =======================================
                      APPROVED
                  ======================================== */}

                  {selectedVoid.status ===
                    "APPROVED" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                          <p className="font-semibold text-blue-700">
                            Void Approved
                          </p>

                          <p className="mt-1 text-sm leading-6 text-blue-600">
                            Manager approval
                            is complete. The
                            actual void
                            execution must
                            be performed from
                            the Cashier
                            workflow.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      PROCESSING
                  ======================================== */}

                  {selectedVoid.status ===
                    "PROCESSING" && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">

                      <div className="flex gap-3">

                        <Hourglass
                          size={20}
                          className="mt-0.5 shrink-0 text-purple-600"
                        />

                        <div>

                          <p className="font-semibold text-purple-700">
                            Void Processing
                          </p>

                          <p className="mt-1 text-sm text-purple-600">
                            This approved
                            void is currently
                            being processed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      COMPLETED
                  ======================================== */}

                  {selectedVoid.status ===
                    "COMPLETED" && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        <div>

                          <p className="font-semibold text-emerald-700">
                            Void Completed
                          </p>

                          <p className="mt-1 text-sm text-emerald-600">
                            This void request
                            has been executed
                            successfully.
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
                    Reject Void Request
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

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
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={20}
                  />
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
                        Reject this void?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-600">
                        Enter a reason
                        explaining why the
                        request cannot be
                        approved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Rejection Reason *
                  </label>

                  <textarea
                    required
                    rows={4}
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
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />

                  <div className="mt-1 flex justify-between text-xs text-slate-400">

                    <span>
                      Minimum 2 characters
                    </span>

                    <span>
                      {rejectReason.length}
                      /500
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
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Back
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
                      <X
                        size={17}
                      />
                    )}

                    Reject Void
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
                    Cancel Void Request
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

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
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={20}
                  />
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

                    <div>

                      <p className="text-sm font-semibold text-amber-700">
                        Cancel request?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-600">
                        Enter a reason for
                        cancelling this
                        void request.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cancellation Reason *
                  </label>

                  <textarea
                    required
                    rows={4}
                    minLength={2}
                    maxLength={500}
                    value={
                      cancelReason
                    }
                    onChange={(event) =>
                      setCancelReason(
                        event.target.value
                      )
                    }
                    placeholder="Enter cancellation reason..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                  />

                  <div className="mt-1 flex justify-between text-xs text-slate-400">

                    <span>
                      Minimum 2 characters
                    </span>

                    <span>
                      {cancelReason.length}
                      /500
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
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
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
                    cancelTarget.id ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Ban
                        size={17}
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