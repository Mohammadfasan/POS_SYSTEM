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
  Banknote,
  CalendarDays,
  Hash,
  Boxes,
  CircleX,
  Hourglass,
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

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
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
// RETURNS PAGE
// ======================================================

const Returns = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    returns,
    setReturns,
  ] = useState([]);

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
  // FILTERS
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

  const [
    branchFilter,
    setBranchFilter,
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
  // DETAIL
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
  // FETCH RETURNS
  //
  // GET /returns
  //
  // Backend supports:
  // page
  // limit
  // status
  // branchId
  // saleId
  // search
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
          "Manager Returns:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.returns ??
          result.saleReturns ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeReturns =
          Array.isArray(data)
            ? data
            : [];

        setReturns(
          safeReturns
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
              safeReturns.length
          );

        const safeTotal =
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeReturns.length;

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
          "Return load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load return requests."
        );

        setReturns([]);
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
    fetchReturns();
  }, [
    page,
    limit,
    search,
    statusFilter,
    branchFilter,
  ]);

  // ====================================================
  // RETURN NUMBER
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
  // SALE
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
  // SALE / INVOICE NUMBER
  // ====================================================

  const getSaleNumber = (
    saleReturn
  ) => {
    const sale =
      getSale(saleReturn);

    return (
      sale?.invoiceNumber ??
      sale?.saleNumber ??
      saleReturn
        ?.invoiceNumber ??
      saleReturn
        ?.saleNumber ??
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
    const sale =
      getSale(saleReturn);

    return (
      saleReturn?.branch ??
      sale?.branch ??
      sale?.shift?.branch ??
      saleReturn?.shift
        ?.branch ??
      null
    );
  };

  // ====================================================
  // BRANCH ID
  // ====================================================

  const getBranchId = (
    saleReturn
  ) => {
    const sale =
      getSale(saleReturn);

    return (
      saleReturn?.branchId ??
      sale?.branchId ??
      sale?.shift?.branchId ??
      getBranch(
        saleReturn
      )?.id ??
      null
    );
  };

  // ====================================================
  // BRANCH NAME
  // ====================================================

  const getBranchName = (
    saleReturn
  ) => {
    const branch =
      getBranch(
        saleReturn
      );

    return (
      branch?.name ??
      branch?.code ??
      saleReturn
        ?.branchName ??
      "—"
    );
  };

  // ====================================================
  // BRANCH OPTIONS
  //
  // Do not call /branches because Manager may not have
  // Admin branch-management permission.
  // Build dropdown from loaded return relations.
  // ====================================================

  const branchOptions =
    useMemo(() => {
      const map =
        new Map();

      returns.forEach(
        (saleReturn) => {
          const id =
            getBranchId(
              saleReturn
            );

          if (!id) {
            return;
          }

          map.set(id, {
            id,
            name:
              getBranchName(
                saleReturn
              ),
          });
        }
      );

      return Array.from(
        map.values()
      ).sort((a, b) =>
        String(
          a.name
        ).localeCompare(
          String(
            b.name
          )
        )
      );
    }, [returns]);

  // ====================================================
  // CASHIER / REQUESTER
  // ====================================================

  const getRequester = (
    saleReturn
  ) => {
    const sale =
      getSale(saleReturn);

    const user =
      saleReturn
        ?.requestedBy ??
      saleReturn
        ?.requester ??
      saleReturn
        ?.createdBy ??
      saleReturn
        ?.cashier ??
      saleReturn?.user ??
      sale?.cashier ??
      sale?.shift?.cashier ??
      sale?.shift?.user;

    if (!user) {
      return (
        saleReturn
          ?.cashierName ??
        saleReturn
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
  // CUSTOMER
  // ====================================================

  const getCustomer = (
    saleReturn
  ) => {
    const sale =
      getSale(saleReturn);

    const customer =
      saleReturn?.customer ??
      sale?.customer;

    if (!customer) {
      return (
        saleReturn
          ?.customerName ??
        sale?.customerName ??
        "Walk-in Customer"
      );
    }

    if (
      typeof customer ===
      "string"
    ) {
      return customer;
    }

    const fullName = [
      customer.firstName,
      customer.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      customer.name ||
      customer.phone ||
      "Walk-in Customer"
    );
  };

  // ====================================================
  // REVIEWER
  // ====================================================

  const getReviewer = (
    saleReturn
  ) => {
    const user =
      saleReturn
        ?.approvedBy ??
      saleReturn
        ?.rejectedBy ??
      saleReturn
        ?.reviewedBy ??
      saleReturn
        ?.approver;

    if (!user) {
      return (
        saleReturn
          ?.approvedByName ??
        saleReturn
          ?.rejectedByName ??
        saleReturn
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
    saleReturn
  ) => {
    const items =
      saleReturn?.items ??
      saleReturn
        ?.returnItems ??
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
  // PRODUCT SKU
  // ====================================================

  const getProductSku = (
    item
  ) => {
    return (
      getProduct(item)?.sku ??
      item?.sku ??
      item?.saleItem
        ?.sku ??
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
            ?.returnQuantity ??
          0
      ) || 0
    );
  };

  // ====================================================
  // PRICE
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
  // LINE TOTAL
  // ====================================================

  const getItemTotal = (
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
      getItemPrice(item)
    );
  };

  // ====================================================
  // ITEM COUNT
  // ====================================================

  const getItemCount = (
    saleReturn
  ) => {
    const items =
      getItems(saleReturn);

    if (items.length) {
      return items.reduce(
        (totalQty, item) =>
          totalQty +
          getQuantity(item),
        0
      );
    }

    return (
      Number(
        saleReturn?._count
          ?.returnItems ??
          saleReturn
            ?.itemCount ??
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
    const direct =
      saleReturn
        ?.refundAmount ??
      saleReturn
        ?.totalRefundAmount ??
      saleReturn
        ?.totalAmount ??
      saleReturn?.amount;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return (
        Number(direct) || 0
      );
    }

    return getItems(
      saleReturn
    ).reduce(
      (sum, item) =>
        sum +
        getItemTotal(item),
      0
    );
  };

  // ====================================================
  // REFUNDS
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
  // REQUEST REASON / NOTE
  // ====================================================

  const getNote = (
    saleReturn
  ) => {
    return (
      saleReturn?.note ??
      saleReturn?.reason ??
      "—"
    );
  };

  // ====================================================
  // REJECTION REASON
  // ====================================================

  const getRejectionReason = (
    saleReturn
  ) => {
    return (
      saleReturn
        ?.rejectionReason ??
      saleReturn
        ?.rejectReason ??
      saleReturn
        ?.rejectedReason ??
      "—"
    );
  };

  // ====================================================
  // CANCELLATION REASON
  // ====================================================

  const getCancellationReason = (
    saleReturn
  ) => {
    return (
      saleReturn
        ?.cancellationReason ??
      saleReturn
        ?.cancelReason ??
      saleReturn
        ?.cancelledReason ??
      "—"
    );
  };

  // ====================================================
  // CURRENT PAGE STATS
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

  const processingCount =
    returns.filter(
      (item) =>
        item.status ===
        "PROCESSING"
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
      setBranchFilter("");
      setPage(1);
    };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /returns/:id
  // Response:
  // data.saleReturn
  // ====================================================

  const openDetails =
    async (saleReturn) => {
      try {
        setSelectedReturn(
          saleReturn
        );

        setDetailsOpen(true);
        setDetailLoading(true);
        setError("");

        const response =
          await api.get(
            `/returns/${saleReturn.id}`
          );

        console.log(
          "Manager Return Detail:",
          response.data
        );

        const detailed =
          response.data?.data
            ?.saleReturn ??
          response.data?.data ??
          saleReturn;

        setSelectedReturn(
          detailed
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

  const closeDetails =
    () => {
      setDetailsOpen(false);
      setSelectedReturn(null);
    };

  // ====================================================
  // APPROVE
  //
  // POST /returns/:id/approve
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
          response.data
            ?.message ||
            "Return approved successfully."
        );

        closeDetails();

        await fetchReturns();
      } catch (err) {
        console.error(
          "Approve return error:",
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
  // BODY { reason }
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
            `/returns/${rejectTarget.id}/reject`,
            {
              reason,
            }
          );

        setSuccess(
          response.data
            ?.message ||
            "Return rejected successfully."
        );

        setRejectOpen(false);
        setRejectTarget(null);
        setRejectReason("");

        closeDetails();

        await fetchReturns();
      } catch (err) {
        console.error(
          "Reject return error:",
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
  // BODY { reason }
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
            `/returns/${cancelTarget.id}/cancel`,
            {
              reason,
            }
          );

        setSuccess(
          response.data
            ?.message ||
            "Return cancelled successfully."
        );

        setCancelOpen(false);
        setCancelTarget(null);
        setCancelReason("");

        closeDetails();

        await fetchReturns();
      } catch (err) {
        console.error(
          "Cancel return error:",
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
              requests and manage
              approvals.
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
            KPI
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Returns
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <RotateCcw
                  size={22}
                />
              </div>
            </div>
          </div>

          {/* VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

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

              <Banknote
                size={23}
                className="text-purple-500"
              />
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

                <p className="mt-1 text-xs text-slate-400">
                  Current page
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

          {/* =================================================
              FILTERS
          ================================================= */}

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
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  placeholder="Search return number, invoice or sale..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </form>

              {/* BRANCH */}

              <select
                value={
                  branchFilter
                }
                onChange={(event) => {
                  setBranchFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >

                <option value="">
                  All Available Branches
                </option>

                {branchOptions.map(
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
                  size={34}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading returns...
                </p>
              </div>
            </div>
          ) : returns.length ===
            0 ? (
            /* =================================================
                EMPTY
            ================================================= */

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
                  Return requests from
                  cashiers will appear
                  here.
                </p>
              </div>
            </div>
          ) : (
            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Return No.
                    </th>

                    <th className="px-5 py-4">
                      Invoice
                    </th>

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Cashier
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

                  {returns.map(
                    (saleReturn) => (
                      <tr
                        key={
                          saleReturn.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* RETURN NUMBER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                              <RotateCcw
                                size={18}
                              />
                            </div>

                            <p className="max-w-48 truncate text-sm font-bold text-blue-600">

                              {getReturnNumber(
                                saleReturn
                              )}

                            </p>
                          </div>
                        </td>

                        {/* INVOICE */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <ReceiptText
                              size={15}
                              className="text-blue-500"
                            />

                            <span className="max-w-48 truncate text-sm font-semibold text-slate-700">

                              {getSaleNumber(
                                saleReturn
                              )}

                            </span>
                          </div>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <User
                              size={15}
                              className="text-slate-400"
                            />

                            <span className="max-w-40 truncate text-sm text-slate-600">

                              {getCustomer(
                                saleReturn
                              )}

                            </span>
                          </div>
                        </td>

                        {/* CASHIER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                              <User
                                size={14}
                              />
                            </div>

                            <span className="max-w-40 truncate text-sm font-medium text-slate-700">

                              {getRequester(
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

                            <span className="max-w-44 truncate text-sm text-slate-600">

                              {getBranchName(
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

                              {formatNumber(
                                getItemCount(
                                  saleReturn
                                )
                              )}

                            </span>
                          </div>
                        </td>

                        {/* AMOUNT */}

                        <td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-600">

                          {formatMoney(
                            getReturnAmount(
                              saleReturn
                            )
                          )}

                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                          {formatDateTime(
                            saleReturn
                              .createdAt ??
                              saleReturn
                                .requestedAt
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
                              title="View details"
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
                                title="Approve Return"
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
                                title="Reject Return"
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
            returns.length >
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
                    ({total} returns)
                  </span>
                </p>

                <div className="flex items-center gap-3">

                  <select
                    value={limit}
                    onChange={(event) => {
                      setLimit(
                        Number(
                          event.target
                            .value
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
        selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

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

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                        <RotateCcw
                          size={23}
                        />
                      </div>

                      <div>

                        <p className="font-bold text-slate-900">

                          {getReturnNumber(
                            selectedReturn
                          )}

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                          {formatDateTime(
                            selectedReturn
                              .createdAt ??
                              selectedReturn
                                .requestedAt
                          )}

                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">

                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          selectedReturn.status
                        )}`}
                      >

                        {displayText(
                          selectedReturn.status
                        )}

                      </span>

                      <p className="text-xl font-bold text-emerald-600">

                        {formatMoney(
                          getReturnAmount(
                            selectedReturn
                          )
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      INFORMATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Request Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      {/* INVOICE */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Invoice
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <ReceiptText
                            size={15}
                            className="text-blue-600"
                          />

                          <p className="break-all text-sm font-semibold text-blue-600">

                            {getSaleNumber(
                              selectedReturn
                            )}

                          </p>
                        </div>
                      </div>

                      {/* CUSTOMER */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Customer
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <User
                            size={15}
                            className="text-slate-500"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {getCustomer(
                              selectedReturn
                            )}

                          </p>
                        </div>
                      </div>

                      {/* CASHIER */}

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
                              selectedReturn
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
                              selectedReturn
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      NOTE
                  ======================================== */}

                  <div className="rounded-xl border border-slate-200 p-5">

                    <div className="flex items-start gap-3">

                      <MessageSquareText
                        size={19}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <div>

                        <p className="font-semibold text-slate-800">
                          Return Note
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                          {getNote(
                            selectedReturn
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
                          Returned Items
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Products included
                          in this return.
                        </p>
                      </div>

                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">

                        {formatNumber(
                          getItemCount(
                            selectedReturn
                          )
                        )}{" "}
                        qty

                      </span>
                    </div>

                    {getItems(
                      selectedReturn
                    ).length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-10 text-center">

                        <Package
                          size={30}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm text-slate-400">
                          Item details were
                          not returned by
                          the API.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[850px]">

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

                                <th className="px-4 py-3">
                                  Reason
                                </th>

                                <th className="px-4 py-3">
                                  Restock
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
                                ) => (
                                  <tr
                                    key={
                                      item.id ??
                                      index
                                    }
                                  >

                                    {/* PRODUCT */}

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

                                    {/* SKU */}

                                    <td className="px-4 py-4 font-mono text-sm text-slate-500">

                                      {getProductSku(
                                        item
                                      )}

                                    </td>

                                    {/* QTY */}

                                    <td className="px-4 py-4 font-bold text-slate-700">

                                      {formatNumber(
                                        getQuantity(
                                          item
                                        )
                                      )}

                                    </td>

                                    {/* PRICE */}

                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">

                                      {formatMoney(
                                        getItemPrice(
                                          item
                                        )
                                      )}

                                    </td>

                                    {/* REASON */}

                                    <td className="px-4 py-4">

                                      <p
                                        title={
                                          item.reason ??
                                          ""
                                        }
                                        className="max-w-48 truncate text-sm text-slate-600"
                                      >

                                        {item.reason ??
                                          "—"}

                                      </p>
                                    </td>

                                    {/* RESTOCK */}

                                    <td className="px-4 py-4">

                                      <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
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

                                    {/* TOTAL */}

                                    <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-emerald-600">

                                      {formatMoney(
                                        getItemTotal(
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
                      REFUND SUMMARY
                  ======================================== */}

                  <div className="ml-auto w-full max-w-md rounded-2xl bg-slate-50 p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-semibold text-slate-600">
                          Total Return Amount
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Amount eligible
                          for refund.
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-emerald-600">

                        {formatMoney(
                          getReturnAmount(
                            selectedReturn
                          )
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      REFUNDS
                  ======================================== */}

                  {getRefunds(
                    selectedReturn
                  ).length > 0 && (
                    <div>

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
                              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >

                              <div>

                                <p className="text-sm font-semibold text-slate-800">

                                  {displayText(
                                    refund.method ??
                                      refund.refundMethod ??
                                      "Refund"
                                  )}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                  {refund.transactionReference ??
                                    refund.refundNumber ??
                                    "—"}

                                </p>
                              </div>

                              <div className="sm:text-right">

                                <p className="font-bold text-emerald-600">

                                  {formatMoney(
                                    refund.amount
                                  )}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                  {formatDateTime(
                                    refund.createdAt
                                  )}

                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      REVIEW INFORMATION
                  ======================================== */}

                  {[
                    "APPROVED",
                    "PROCESSING",
                    "REJECTED",
                    "COMPLETED",
                    "CANCELLED",
                  ].includes(
                    selectedReturn.status
                  ) && (
                    <div>

                      <h3 className="font-bold text-slate-900">
                        Review Information
                      </h3>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                        {/* REVIEWER */}

                        <div className="rounded-xl border border-slate-200 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Reviewed By
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">

                            {getReviewer(
                              selectedReturn
                            )}

                          </p>
                        </div>

                        {/* REVIEW DATE */}

                        <div className="rounded-xl border border-slate-200 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Updated / Reviewed
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedReturn
                                .approvedAt ??
                                selectedReturn
                                  .rejectedAt ??
                                selectedReturn
                                  .reviewedAt ??
                                selectedReturn
                                  .updatedAt
                            )}

                          </p>
                        </div>
                      </div>

                      {/* REJECT REASON */}

                      {selectedReturn.status ===
                        "REJECTED" && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                          <p className="text-xs font-semibold uppercase text-red-500">
                            Rejection Reason
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">

                            {getRejectionReason(
                              selectedReturn
                            )}

                          </p>
                        </div>
                      )}

                      {/* CANCEL REASON */}

                      {selectedReturn.status ===
                        "CANCELLED" && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Cancellation Reason
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">

                            {getCancellationReason(
                              selectedReturn
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
                        Return ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {selectedReturn.id ??
                          "—"}

                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Sale ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {selectedReturn.saleId ??
                          getSale(
                            selectedReturn
                          )?.id ??
                          "—"}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      PENDING ACTIONS
                  ======================================== */}

                  {selectedReturn.status ===
                    "PENDING" && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                      {/* CANCEL */}

                      <button
                        type="button"
                        disabled={
                          actionLoadingId ===
                          selectedReturn.id
                        }
                        onClick={() => {
                          setDetailsOpen(
                            false
                          );

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
                          setDetailsOpen(
                            false
                          );

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
                        className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-400"
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
                      APPROVED - CASHIER REFUND
                  ======================================== */}

                  {selectedReturn.status ===
                    "APPROVED" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                          <p className="font-semibold text-blue-700">
                            Return Approved
                          </p>

                          <p className="mt-1 text-sm leading-6 text-blue-600">
                            Manager approval is
                            complete. Refund
                            processing must be
                            completed from the
                            Cashier workflow.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      PROCESSING
                  ======================================== */}

                  {selectedReturn.status ===
                    "PROCESSING" && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">

                      <div className="flex gap-3">

                        <Hourglass
                          size={20}
                          className="mt-0.5 shrink-0 text-purple-600"
                        />

                        <div>

                          <p className="font-semibold text-purple-700">
                            Refund Processing
                          </p>

                          <p className="mt-1 text-sm text-purple-600">
                            This return is
                            currently being
                            processed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      COMPLETED
                  ======================================== */}

                  {selectedReturn.status ===
                    "COMPLETED" && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        <div>

                          <p className="font-semibold text-emerald-700">
                            Return Completed
                          </p>

                          <p className="mt-1 text-sm text-emerald-600">
                            Return and refund
                            process has been
                            completed.
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

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                  <div className="flex gap-3">

                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <div>

                      <p className="text-sm font-semibold text-red-700">
                        Reject this return?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-600">
                        Enter the reason
                        for rejecting this
                        return request.
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
                      <X size={17} />
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

                    <div>

                      <p className="text-sm font-semibold text-amber-700">
                        Cancel this request?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-600">
                        Enter a clear
                        reason for
                        cancelling this
                        return request.
                      </p>
                    </div>
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
                    onChange={(event) =>
                      setCancelReason(
                        event.target.value
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