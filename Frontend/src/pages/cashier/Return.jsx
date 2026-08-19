import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Loader2,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const RETURN_STATUSES = [
  "",
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

const ELIGIBLE_SALE_STATUSES = [
  "COMPLETED",
  "PARTIALLY_REFUNDED",
];

const ACTIVE_RETURN_STATUSES = [
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
];

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const returnStatusClass = (status) => {
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
      return "border-slate-200 bg-slate-100 text-slate-500";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const paymentMethodClass = (method) => {
  switch (method) {
    case "CASH":
      return "bg-emerald-50 text-emerald-700";

    case "CARD":
      return "bg-blue-50 text-blue-700";

    case "QR":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getPersonName = (person) => {
  if (!person) {
    return "-";
  }

  const name = `${person.firstName || ""} ${
    person.lastName || ""
  }`.trim();

  return (
    name ||
    person.employeeId ||
    "-"
  );
};

const generateIdempotencyKey = () => {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return `return-refund-${crypto.randomUUID()}`;
  }

  return `return-refund-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

// ======================================================
// RETURNS
// ======================================================

const Returns = () => {
  const navigate = useNavigate();

  // ====================================================
  // LIST DATA
  // ====================================================

  const [returns, setReturns] =
    useState([]);

  const [selectedReturn, setSelectedReturn] =
    useState(null);

  // ====================================================
  // LIST FILTER
  // ====================================================

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [status, setStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit] = useState(10);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });

  // ====================================================
  // GENERAL UI
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // DETAIL MODAL
  // ====================================================

  const [detailOpen, setDetailOpen] =
    useState(false);

  // ====================================================
  // CREATE RETURN
  // ====================================================

  const [createOpen, setCreateOpen] =
    useState(false);

  const [saleLookup, setSaleLookup] =
    useState("");

  const [saleResults, setSaleResults] =
    useState([]);

  const [
    saleSearchLoading,
    setSaleSearchLoading,
  ] = useState(false);

  const [
    selectedSale,
    setSelectedSale,
  ] = useState(null);

  const [
    selectedSaleLoading,
    setSelectedSaleLoading,
  ] = useState(false);

  const [
    previousReturnQuantities,
    setPreviousReturnQuantities,
  ] = useState({});

  /*
   * {
   *   [saleItemId]: {
   *      quantity,
   *      reason,
   *      restock
   *   }
   * }
   */

  const [
    returnSelections,
    setReturnSelections,
  ] = useState({});

  const [returnNote, setReturnNote] =
    useState("");

  const [
    createLoading,
    setCreateLoading,
  ] = useState(false);

  // ====================================================
  // CANCEL RETURN
  // ====================================================

  const [cancelOpen, setCancelOpen] =
    useState(false);

  const [cancelTarget, setCancelTarget] =
    useState(null);

  const [cancelReason, setCancelReason] =
    useState("");

  const [
    cancelLoading,
    setCancelLoading,
  ] = useState(false);

  // ====================================================
  // REFUND
  // ====================================================

  const [refundOpen, setRefundOpen] =
    useState(false);

  const [refundTarget, setRefundTarget] =
    useState(null);

  const [
    refundAllocations,
    setRefundAllocations,
  ] = useState([]);

  const [
    refundLoading,
    setRefundLoading,
  ] = useState(false);

  const refundIdempotencyKey =
    useRef(null);

  // ====================================================
  // SEARCH DEBOUNCE
  // ====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(
        search.trim()
      );

      setPage(1);
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [search]);

  // ====================================================
  // LOAD RETURNS
  // ====================================================

  const loadReturns =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (status) {
          params.status = status;
        }

        if (debouncedSearch) {
          params.search =
            debouncedSearch;
        }

        const response =
          await api.get(
            "/returns",
            {
              params,
            }
          );

        const result =
          response.data?.data || {};

        const list =
          result.returns || [];

        setReturns(
          Array.isArray(list)
            ? list
            : []
        );

        const paging =
          result.pagination || {};

        setPagination({
          page:
            Number(
              paging.page
            ) || page,

          limit:
            Number(
              paging.limit
            ) || limit,

          total:
            Number(
              paging.total
            ) || 0,

          totalPages: Math.max(
            1,
            Number(
              paging.totalPages
            ) || 1
          ),
        });
      } catch (error) {
        console.error(
          "Returns load error:",
          error.response?.data ||
            error.message
        );

        setReturns([]);

        setError(
          getErrorMessage(
            error,
            "Unable to load returns."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      limit,
      status,
      debouncedSearch,
    ]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        setError("");
        setSuccess("");

        await loadReturns();
      } finally {
        setRefreshing(false);
      }
    };

  // ====================================================
  // RETURN DETAILS
  // ====================================================

  const getReturnDetails =
    async (returnId) => {
      const response =
        await api.get(
          `/returns/${returnId}`
        );

      return (
        response.data?.data
          ?.saleReturn || null
      );
    };

  // ====================================================
  // OPEN DETAILS
  // ====================================================

  const openDetails =
    async (returnRecord) => {
      try {
        setSelectedReturn(
          returnRecord
        );

        setDetailOpen(true);

        setDetailLoading(true);

        setError("");

        const detail =
          await getReturnDetails(
            returnRecord.id
          );

        if (detail) {
          setSelectedReturn(
            detail
          );
        }
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load return details."
          )
        );
      } finally {
        setDetailLoading(false);
      }
    };

  // ====================================================
  // CLOSE DETAILS
  // ====================================================

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedReturn(null);
  };

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const openCreate = () => {
    setCreateOpen(true);

    setSaleLookup("");
    setSaleResults([]);
    setSelectedSale(null);

    setPreviousReturnQuantities(
      {}
    );

    setReturnSelections({});

    setReturnNote("");

    setError("");
    setSuccess("");
  };

  // ====================================================
  // CLOSE CREATE
  // ====================================================

  const closeCreate = () => {
    if (createLoading) {
      return;
    }

    setCreateOpen(false);

    setSaleLookup("");
    setSaleResults([]);
    setSelectedSale(null);
    setReturnSelections({});
    setPreviousReturnQuantities(
      {}
    );

    setReturnNote("");
  };

  // ====================================================
  // SEARCH SALES
  // ====================================================

  const searchEligibleSales =
    async (event) => {
      event?.preventDefault();

      const value =
        saleLookup.trim();

      if (!value) {
        setError(
          "Enter sale number or invoice number."
        );

        return;
      }

      try {
        setSaleSearchLoading(true);

        setError("");

        const response =
          await api.get(
            "/sales",
            {
              params: {
                search: value,
                page: 1,
                limit: 20,
              },
            }
          );

        const list =
          response.data?.data
            ?.sales || [];

        const eligible =
          list.filter((sale) =>
            ELIGIBLE_SALE_STATUSES.includes(
              sale.status
            )
          );

        setSaleResults(
          eligible
        );

        if (
          eligible.length === 0
        ) {
          setError(
            "No eligible completed sale found."
          );
        }
      } catch (error) {
        setSaleResults([]);

        setError(
          getErrorMessage(
            error,
            "Unable to search sales."
          )
        );
      } finally {
        setSaleSearchLoading(
          false
        );
      }
    };

  // ====================================================
  // LOAD PREVIOUS RETURN QUANTITIES
  // ====================================================

  const loadPreviousReturnsForSale =
    async (saleId) => {
      const response =
        await api.get(
          "/returns",
          {
            params: {
              saleId,
              page: 1,
              limit: 100,
            },
          }
        );

      const previousReturns =
        response.data?.data
          ?.returns || [];

      const activeReturns =
        previousReturns.filter(
          (item) =>
            ACTIVE_RETURN_STATUSES.includes(
              item.status
            )
        );

      if (
        activeReturns.length === 0
      ) {
        return {};
      }

      const responses =
        await Promise.allSettled(
          activeReturns.map(
            (item) =>
              api.get(
                `/returns/${item.id}`
              )
          )
        );

      const quantities = {};

      responses.forEach(
        (result) => {
          if (
            result.status !==
            "fulfilled"
          ) {
            return;
          }

          const saleReturn =
            result.value?.data
              ?.data?.saleReturn;

          saleReturn?.items?.forEach(
            (item) => {
              const saleItemId =
                item.saleItemId;

              if (!saleItemId) {
                return;
              }

              quantities[
                saleItemId
              ] =
                Number(
                  quantities[
                    saleItemId
                  ] || 0
                ) +
                Number(
                  item.quantity || 0
                );
            }
          );
        }
      );

      return quantities;
    };

  // ====================================================
  // SELECT ORIGINAL SALE
  // ====================================================

  const selectSale =
    async (sale) => {
      try {
        setSelectedSaleLoading(
          true
        );

        setError("");

        const [
          saleResponse,
          quantities,
        ] = await Promise.all([
          api.get(
            `/sales/${sale.id}`
          ),

          loadPreviousReturnsForSale(
            sale.id
          ),
        ]);

        const detail =
          saleResponse.data?.data
            ?.sale;

        if (!detail) {
          throw new Error(
            "Sale details not found."
          );
        }

        if (
          !ELIGIBLE_SALE_STATUSES.includes(
            detail.status
          )
        ) {
          throw new Error(
            "This sale is not eligible for return."
          );
        }

        setSelectedSale(detail);

        setPreviousReturnQuantities(
          quantities
        );

        setReturnSelections(
          {}
        );

        setSaleResults([]);
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load sale."
          )
        );
      } finally {
        setSelectedSaleLoading(
          false
        );
      }
    };

  // ====================================================
  // REMAINING RETURNABLE
  // ====================================================

  const getRemainingReturnable = (
    saleItem
  ) => {
    const sold =
      Number(
        saleItem?.quantity || 0
      );

    const previouslyReturned =
      Number(
        previousReturnQuantities[
          saleItem.id
        ] || 0
      );

    return Math.max(
      sold -
        previouslyReturned,
      0
    );
  };

  // ====================================================
  // TOGGLE ITEM
  // ====================================================

  const toggleReturnItem = (
    item
  ) => {
    const remaining =
      getRemainingReturnable(
        item
      );

    if (remaining <= 0) {
      return;
    }

    setReturnSelections(
      (current) => {
        if (current[item.id]) {
          const updated = {
            ...current,
          };

          delete updated[
            item.id
          ];

          return updated;
        }

        return {
          ...current,

          [item.id]: {
            quantity:
              Math.min(
                1,
                remaining
              ),

            reason: "",

            restock:
              item.trackInventory !==
              false,
          },
        };
      }
    );
  };

  // ====================================================
  // UPDATE RETURN ITEM
  // ====================================================

  const updateReturnItem = (
    saleItemId,
    field,
    value
  ) => {
    setReturnSelections(
      (current) => ({
        ...current,

        [saleItemId]: {
          ...current[
            saleItemId
          ],

          [field]: value,
        },
      })
    );
  };

  // ====================================================
  // CREATE RETURN REQUEST
  // ====================================================

  const handleCreateReturn =
    async (event) => {
      event.preventDefault();

      if (!selectedSale) {
        setError(
          "Select an original sale first."
        );

        return;
      }

      const selectedItems =
        Object.entries(
          returnSelections
        );

      if (
        selectedItems.length ===
        0
      ) {
        setError(
          "Select at least one item to return."
        );

        return;
      }

      const items = [];

      for (const [
        saleItemId,
        selection,
      ] of selectedItems) {
        const saleItem =
          selectedSale.items?.find(
            (item) =>
              item.id ===
              saleItemId
          );

        if (!saleItem) {
          continue;
        }

        const quantity =
          Number(
            selection.quantity
          );

        const remaining =
          getRemainingReturnable(
            saleItem
          );

        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity <= 0
        ) {
          setError(
            `Enter a valid return quantity for ${saleItem.productName}.`
          );

          return;
        }

        if (
          quantity > remaining
        ) {
          setError(
            `Only ${remaining} ${saleItem.selectedUnitSymbol || ""} of ${saleItem.productName} can still be returned.`
          );

          return;
        }

        items.push({
          saleItemId,

          quantity,

          reason:
            selection.reason
              ?.trim() ||
            undefined,

          restock:
            selection.restock !==
            false,
        });
      }

      try {
        setCreateLoading(true);

        setError("");
        setSuccess("");

        const payload = {
          saleId:
            selectedSale.id,

          items,

          ...(returnNote.trim()
            ? {
                note:
                  returnNote.trim(),
              }
            : {}),
        };

        console.log(
          "Return payload:",
          payload
        );

        const response =
          await api.post(
            "/returns",
            payload
          );

        const saleReturn =
          response.data?.data
            ?.saleReturn;

        setSuccess(
          saleReturn?.returnNumber
            ? `Return request ${saleReturn.returnNumber} created successfully. Waiting for approval.`
            : response.data
                ?.message ||
                "Return request created successfully."
        );

        setCreateOpen(false);

        setSelectedSale(null);
        setReturnSelections({});
        setPreviousReturnQuantities(
          {}
        );

        setReturnNote("");
        setSaleLookup("");
        setSaleResults([]);

        setStatus("PENDING");
        setPage(1);

        await loadReturns();
      } catch (error) {
        console.error(
          "Create return error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to create return request."
          )
        );
      } finally {
        setCreateLoading(false);
      }
    };

  // ====================================================
  // OPEN CANCEL
  // ====================================================

  const openCancel = (
    returnRecord
  ) => {
    setCancelTarget(
      returnRecord
    );

    setCancelReason("");

    setCancelOpen(true);

    setError("");
  };

  // ====================================================
  // CLOSE CANCEL
  // ====================================================

  const closeCancel = () => {
    if (cancelLoading) {
      return;
    }

    setCancelOpen(false);
    setCancelTarget(null);
    setCancelReason("");
  };

  // ====================================================
  // CANCEL RETURN
  // ====================================================

  const handleCancel =
    async (event) => {
      event.preventDefault();

      if (!cancelTarget) {
        return;
      }

      const reason =
        cancelReason.trim();

      if (reason.length < 2) {
        setError(
          "Cancellation reason must contain at least 2 characters."
        );

        return;
      }

      try {
        setCancelLoading(true);

        setError("");
        setSuccess("");

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

        await loadReturns();
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to cancel return."
          )
        );
      } finally {
        setCancelLoading(false);
      }
    };

  // ====================================================
  // BUILD REFUND ALLOCATIONS
  // ====================================================

  const buildRefundAllocations = (
    saleReturn
  ) => {
    let remaining =
      Number(
        saleReturn
          ?.refundSummary
          ?.requiredRefundAmount ??
          saleReturn?.refundTotal ??
          0
      );

    const payments =
      saleReturn?.sale
        ?.payments || [];

    const allocations = [];

    payments.forEach(
      (payment) => {
        if (remaining <= 0) {
          return;
        }

        const refundable =
          Number(
            payment.refundableAmount ??
              payment.amount ??
              0
          );

        if (refundable <= 0) {
          return;
        }

        const allocation =
          Math.min(
            refundable,
            remaining
          );

        if (allocation > 0) {
          allocations.push({
            paymentId:
              payment.id,

            paymentNumber:
              payment.paymentNumber,

            method:
              payment.method,

            refundableAmount:
              refundable,

            amount:
              allocation.toFixed(
                2
              ),

            transactionReference:
              "",

            note: "",
          });

          remaining =
            Number(
              (
                remaining -
                allocation
              ).toFixed(2)
            );
        }
      }
    );

    return {
      allocations,
      remaining,
    };
  };

  // ====================================================
  // OPEN REFUND
  // ====================================================

  const openRefund =
    async (returnRecord) => {
      try {
        setError("");

        setRefundLoading(true);

        let detailed =
          returnRecord;

        if (
          !returnRecord?.refundSummary ||
          !returnRecord?.sale
            ?.payments
        ) {
          detailed =
            await getReturnDetails(
              returnRecord.id
            );
        }

        if (!detailed) {
          throw new Error(
            "Return details not found."
          );
        }

        if (
          detailed.status !==
          "APPROVED"
        ) {
          throw new Error(
            "Return must be approved before refund."
          );
        }

        const {
          allocations,
          remaining,
        } =
          buildRefundAllocations(
            detailed
          );

        if (remaining > 0.009) {
          throw new Error(
            `Not enough refundable payment balance. Missing ${formatMoney(
              remaining
            )}.`
          );
        }

        setRefundTarget(
          detailed
        );

        setRefundAllocations(
          allocations
        );

        refundIdempotencyKey.current =
          null;

        setRefundOpen(true);

        setDetailOpen(false);
        setSelectedReturn(null);
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to prepare refund."
          )
        );
      } finally {
        setRefundLoading(false);
      }
    };

  // ====================================================
  // CLOSE REFUND
  // ====================================================

  const closeRefund = () => {
    if (refundLoading) {
      return;
    }

    setRefundOpen(false);

    setRefundTarget(null);

    setRefundAllocations(
      []
    );

    refundIdempotencyKey.current =
      null;
  };

  // ====================================================
  // UPDATE REFUND ALLOCATION
  // ====================================================

  const updateRefundAllocation = (
    index,
    field,
    value
  ) => {
    refundIdempotencyKey.current =
      null;

    setRefundAllocations(
      (current) =>
        current.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );
  };

  // ====================================================
  // REFUND TOTAL
  // ====================================================

  const refundAllocationTotal =
    useMemo(() => {
      return refundAllocations.reduce(
        (total, item) =>
          total +
          Number(
            item.amount || 0
          ),
        0
      );
    }, [refundAllocations]);

  const requiredRefundAmount =
    Number(
      refundTarget?.refundSummary
        ?.requiredRefundAmount ??
        refundTarget?.refundTotal ??
        0
    );

  // ====================================================
  // PROCESS REFUND
  // ====================================================

  const processRefund =
    async (event) => {
      event.preventDefault();

      if (!refundTarget) {
        return;
      }

      if (
        refundAllocations.length ===
          0 &&
        requiredRefundAmount > 0
      ) {
        setError(
          "Refund payment allocation is required."
        );

        return;
      }

      if (
        Math.abs(
          refundAllocationTotal -
            requiredRefundAmount
        ) > 0.009
      ) {
        setError(
          `Refund allocations must equal ${formatMoney(
            requiredRefundAmount
          )}.`
        );

        return;
      }

      for (const allocation of refundAllocations) {
        const amount =
          Number(
            allocation.amount
          );

        if (
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          setError(
            "Every refund allocation must be greater than zero."
          );

          return;
        }

        if (
          amount >
          Number(
            allocation.refundableAmount ||
              0
          )
        ) {
          setError(
            `Refund exceeds refundable amount for ${allocation.paymentNumber}.`
          );

          return;
        }

        if (
          ["CARD", "QR"].includes(
            allocation.method
          ) &&
          !allocation.transactionReference.trim()
        ) {
          setError(
            `Refund transaction reference is required for ${allocation.method}.`
          );

          return;
        }
      }

      try {
        setRefundLoading(true);

        setError("");
        setSuccess("");

        if (
          !refundIdempotencyKey.current
        ) {
          refundIdempotencyKey.current =
            generateIdempotencyKey();
        }

        const refunds =
          refundAllocations.map(
            (allocation) => ({
              paymentId:
                allocation.paymentId,

              amount:
                Number(
                  allocation.amount
                ),

              ...(allocation.transactionReference.trim()
                ? {
                    transactionReference:
                      allocation.transactionReference.trim(),
                  }
                : {}),

              ...(allocation.note.trim()
                ? {
                    note:
                      allocation.note.trim(),
                  }
                : {}),
            })
          );

        const response =
          await api.post(
            `/returns/${refundTarget.id}/refund`,
            {
              refunds,
            },
            {
              headers: {
                "Idempotency-Key":
                  refundIdempotencyKey.current,
              },
            }
          );

        refundIdempotencyKey.current =
          null;

        setSuccess(
          response.data?.message ||
            "Return and refund completed successfully."
        );

        setRefundOpen(false);
        setRefundTarget(null);
        setRefundAllocations([]);

        setStatus("COMPLETED");
        setPage(1);

        await loadReturns();
      } catch (error) {
        /*
         * Keep idempotency key after failed
         * request so same exact request can
         * safely be retried.
         */

        setError(
          getErrorMessage(
            error,
            "Unable to process refund."
          )
        );
      } finally {
        setRefundLoading(false);
      }
    };

  // ====================================================
  // STATS
  // ====================================================

  const stats = useMemo(() => {
    return {
      pending:
        returns.filter(
          (item) =>
            item.status ===
            "PENDING"
        ).length,

      approved:
        returns.filter(
          (item) =>
            item.status ===
            "APPROVED"
        ).length,

      completed:
        returns.filter(
          (item) =>
            item.status ===
            "COMPLETED"
        ).length,

      completedValue:
        returns
          .filter(
            (item) =>
              item.status ===
              "COMPLETED"
          )
          .reduce(
            (total, item) =>
              total +
              Number(
                item.refundTotal ||
                  0
              ),
            0
          ),
    };
  }, [returns]);

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ===========================================
            HEADER
        ============================================ */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Returns
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create return requests and
              process approved refunds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
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
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <RotateCcw
                size={16}
              />

              New Return
            </button>
          </div>
        </div>

        {/* ===========================================
            ERROR
        ============================================ */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <p className="flex-1 text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X
                size={17}
                className="text-red-500"
              />
            </button>
          </div>
        )}

        {/* ===========================================
            SUCCESS
        ============================================ */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="flex-1 text-sm font-medium text-emerald-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              <X
                size={17}
                className="text-emerald-600"
              />
            </button>
          </div>
        )}

        {/* ===========================================
            STATS
        ============================================ */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-600">
              Pending on Page
            </p>

            <p className="mt-2 text-2xl font-black text-amber-700">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-semibold text-blue-600">
              Approved on Page
            </p>

            <p className="mt-2 text-2xl font-black text-blue-700">
              {stats.approved}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold text-emerald-600">
              Completed on Page
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {stats.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-400">
              Refund Value
            </p>

            <p className="mt-2 text-xl font-black text-slate-900">
              {formatMoney(
                stats.completedValue
              )}
            </p>
          </div>
        </div>

        {/* ===========================================
            FILTERS
        ============================================ */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Return number, sale number or invoice..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value
                );

                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none"
            >
              {RETURN_STATUSES.map(
                (option) => (
                  <option
                    key={
                      option || "ALL"
                    }
                    value={option}
                  >
                    {option ||
                      "ALL STATUS"}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* ===========================================
            TABLE
        ============================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[430px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading returns...
                </p>
              </div>
            </div>
          ) : returns.length === 0 ? (
            <div className="flex min-h-[430px] items-center justify-center p-6 text-center">
              <div>
                <RotateCcw
                  size={44}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-bold text-slate-700">
                  No returns found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Customer return requests
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">
                        Return
                      </th>

                      <th className="px-5 py-4">
                        Sale
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Items
                      </th>

                      <th className="px-5 py-4">
                        Refund
                      </th>

                      <th className="px-5 py-4">
                        Requested
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {returns.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {
                                item.returnNumber
                              }
                            </p>

                            {item.note && (
                              <p className="mt-1 max-w-[200px] truncate text-xs text-slate-400">
                                {item.note}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-700">
                              {item.sale
                                ?.saleNumber ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {item.sale
                                ?.invoiceNumber ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${returnStatusClass(
                                item.status
                              )}`}
                            >
                              {
                                item.status
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-600">
                            {item?._count
                              ?.items ??
                              "-"}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-slate-800">
                              {formatMoney(
                                item.refundTotal
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDateTime(
                              item.requestedAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openDetails(
                                    item
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {item.status ===
                                "APPROVED" && (
                                <button
                                  type="button"
                                  disabled={
                                    refundLoading
                                  }
                                  onClick={() =>
                                    openRefund(
                                      item
                                    )
                                  }
                                  className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <CreditCard
                                    size={
                                      14
                                    }
                                  />

                                  Refund
                                </button>
                              )}

                              {item.status ===
                                "PENDING" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCancel(
                                      item
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                >
                                  <Trash2
                                    size={
                                      15
                                    }
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

              {/* PAGINATION */}

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  Page{" "}
                  <strong>
                    {pagination.page}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      pagination.totalPages
                    }
                  </strong>
                  {" · "}
                  {pagination.total} returns
                </p>

                <div className="flex gap-2">
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
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />

                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    Next

                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================================
          CREATE RETURN MODAL
      ================================================== */}

      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Customer Return
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Create Return Request
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeCreate
                }
                disabled={
                  createLoading
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateReturn
              }
              className="space-y-6 p-6"
            >

              {/* SALE SEARCH */}

              {!selectedSale && (
                <div>
                  <h3 className="font-black text-slate-900">
                    Find Original Sale
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Search using sale number
                    or invoice number.
                  </p>

                  <div className="mt-4 flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={
                          saleLookup
                        }
                        onChange={(
                          event
                        ) =>
                          setSaleLookup(
                            event.target
                              .value
                          )
                        }
                        placeholder="SL-BR01-... or INV-..."
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={
                        saleSearchLoading
                      }
                      onClick={
                        searchEligibleSales
                      }
                      className="flex min-w-[110px] items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {saleSearchLoading ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>

                  {saleResults.length >
                    0 && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      {saleResults.map(
                        (sale) => (
                          <button
                            key={
                              sale.id
                            }
                            type="button"
                            onClick={() =>
                              selectSale(
                                sale
                              )
                            }
                            className="flex w-full items-center justify-between border-b border-slate-100 p-4 text-left last:border-b-0 hover:bg-slate-50"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {
                                  sale.saleNumber
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {sale.invoiceNumber ||
                                  "No invoice"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-slate-800">
                                {formatMoney(
                                  sale.grandTotal
                                )}
                              </p>

                              <p className="mt-1 text-[10px] font-bold text-emerald-600">
                                {
                                  sale.status
                                }
                              </p>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SELECTED SALE LOADING */}

              {selectedSaleLoading && (
                <div className="flex min-h-60 items-center justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-blue-600"
                  />
                </div>
              )}

              {/* SELECTED SALE */}

              {selectedSale &&
                !selectedSaleLoading && (
                <>
                  <div className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Original Sale
                      </p>

                      <p className="mt-1 font-black text-slate-900">
                        {
                          selectedSale.saleNumber
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedSale.invoiceNumber ||
                          "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900">
                        {formatMoney(
                          selectedSale.grandTotal
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSale(
                            null
                          );

                          setReturnSelections(
                            {}
                          );
                        }}
                        className="mt-2 text-xs font-bold text-blue-600"
                      >
                        Change Sale
                      </button>
                    </div>
                  </div>

                  {/* ITEMS */}

                  <div>
                    <h3 className="font-black text-slate-900">
                      Select Return Items
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Select products and
                      enter return quantity.
                    </p>

                    <div className="mt-4 space-y-3">
                      {selectedSale.items?.map(
                        (item) => {
                          const remaining =
                            getRemainingReturnable(
                              item
                            );

                          const selected =
                            Boolean(
                              returnSelections[
                                item.id
                              ]
                            );

                          const selection =
                            returnSelections[
                              item.id
                            ];

                          return (
                            <div
                              key={
                                item.id
                              }
                              className={`rounded-2xl border p-4 transition ${
                                selected
                                  ? "border-blue-300 bg-blue-50/40"
                                  : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <button
                                  type="button"
                                  disabled={
                                    remaining <=
                                    0
                                  }
                                  onClick={() =>
                                    toggleReturnItem(
                                      item
                                    )
                                  }
                                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                    selected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-300 bg-white"
                                  } disabled:opacity-30`}
                                >
                                  {selected && (
                                    <Check
                                      size={
                                        13
                                      }
                                    />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                    <div>
                                      <p className="font-bold text-slate-800">
                                        {item.productName ||
                                          "Product"}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-400">
                                        {item.sku ||
                                          ""}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="font-black text-slate-800">
                                        {formatMoney(
                                          item.lineTotal
                                        )}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-400">
                                        Sold:{" "}
                                        {
                                          item.quantity
                                        }{" "}
                                        {item.selectedUnitSymbol ||
                                          ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 rounded-xl bg-white p-3 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">
                                        Previously
                                        returned /
                                        active
                                      </span>

                                      <span className="font-bold text-slate-700">
                                        {Number(
                                          previousReturnQuantities[
                                            item
                                              .id
                                          ] ||
                                            0
                                        )}
                                      </span>
                                    </div>

                                    <div className="mt-2 flex justify-between">
                                      <span className="text-slate-500">
                                        Returnable
                                      </span>

                                      <span
                                        className={`font-black ${
                                          remaining >
                                          0
                                            ? "text-emerald-600"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {remaining}{" "}
                                        {item.selectedUnitSymbol ||
                                          ""}
                                      </span>
                                    </div>
                                  </div>

                                  {selected && (
                                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[160px_1fr_150px]">

                                      {/* QTY */}

                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                          Quantity
                                        </label>

                                        <input
                                          type="number"
                                          min="0.001"
                                          step="0.001"
                                          max={
                                            remaining
                                          }
                                          value={
                                            selection.quantity
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateReturnItem(
                                              item.id,
                                              "quantity",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400"
                                        />
                                      </div>

                                      {/* REASON */}

                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                          Item Reason
                                        </label>

                                        <input
                                          type="text"
                                          maxLength={
                                            500
                                          }
                                          value={
                                            selection.reason
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            updateReturnItem(
                                              item.id,
                                              "reason",
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                          placeholder="Damaged, wrong item..."
                                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                        />
                                      </div>

                                      {/* RESTOCK */}

                                      <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                          Inventory
                                        </label>

                                        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                                          <input
                                            type="checkbox"
                                            checked={
                                              selection.restock
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateReturnItem(
                                                item.id,
                                                "restock",
                                                event
                                                  .target
                                                  .checked
                                              )
                                            }
                                          />

                                          <span className="text-xs font-bold text-slate-600">
                                            Restock
                                          </span>
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* NOTE */}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Return Note
                    </label>

                    <textarea
                      rows={3}
                      maxLength={500}
                      value={returnNote}
                      onChange={(event) =>
                        setReturnNote(
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional overall return note..."
                      className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* SUBMIT */}

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      disabled={
                        createLoading
                      }
                      onClick={
                        closeCreate
                      }
                      className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        createLoading ||
                        Object.keys(
                          returnSelections
                        ).length ===
                          0
                      }
                      className="flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      {createLoading ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <RotateCcw
                          size={16}
                        />
                      )}

                      Create Return
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          DETAILS
      ================================================== */}

      {detailOpen &&
        selectedReturn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Return Details
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      selectedReturn.returnNumber
                    }
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedReturn.sale
                      ?.saleNumber ||
                      "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex min-h-[450px] items-center justify-center">
                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* SUMMARY */}

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${returnStatusClass(
                          selectedReturn.status
                        )}`}
                      >
                        {
                          selectedReturn.status
                        }
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Refund
                      </p>

                      <p className="mt-1 font-black text-slate-800">
                        {formatMoney(
                          selectedReturn.refundTotal
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Requested By
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {getPersonName(
                          selectedReturn.requestedBy
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Requested At
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedReturn.requestedAt
                        )}
                      </p>
                    </div>
                  </div>

                  {/* APPROVAL */}

                  {selectedReturn.approvedBy && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Approved
                      </p>

                      <p className="mt-1 text-sm font-bold text-blue-800">
                        {getPersonName(
                          selectedReturn.approvedBy
                        )}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {formatDateTime(
                          selectedReturn.approvedAt
                        )}
                      </p>
                    </div>
                  )}

                  {/* REJECT */}

                  {selectedReturn.status ===
                    "REJECTED" && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                        Rejected
                      </p>

                      <p className="mt-2 text-sm text-red-700">
                        {selectedReturn.rejectReason ||
                          "No reason available."}
                      </p>
                    </div>
                  )}

                  {/* ITEMS */}

                  <div>
                    <h3 className="font-black text-slate-900">
                      Returned Items
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      {selectedReturn.items?.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="border-b border-slate-100 p-4 last:border-b-0"
                          >
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {
                                    item.productName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {item.sku ||
                                    ""}
                                </p>

                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                  Qty:{" "}
                                  {
                                    item.quantity
                                  }{" "}
                                  {item.unitSymbol ||
                                    ""}
                                </p>

                                {item.reason && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Reason:{" "}
                                    {
                                      item.reason
                                    }
                                  </p>
                                )}

                                <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">
                                  {item.restock
                                    ? "Restock"
                                    : "Do not restock"}
                                </p>
                              </div>

                              <p className="font-black text-slate-800">
                                {formatMoney(
                                  item.refundTotal
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* REFUND SUMMARY */}

                  {selectedReturn.refundSummary && (
                    <div className="rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-black text-slate-900">
                        Refund Summary
                      </h3>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Required
                          </span>

                          <span className="font-bold text-slate-800">
                            {formatMoney(
                              selectedReturn
                                .refundSummary
                                .requiredRefundAmount
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Processed
                          </span>

                          <span className="font-bold text-emerald-600">
                            {formatMoney(
                              selectedReturn
                                .refundSummary
                                .processedRefundAmount
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPLETED REFUNDS */}

                  {selectedReturn.refunds?.length >
                    0 && (
                    <div>
                      <h3 className="font-black text-slate-900">
                        Refund Transactions
                      </h3>

                      <div className="mt-3 space-y-2">
                        {selectedReturn.refunds.map(
                          (refund) => (
                            <div
                              key={
                                refund.id
                              }
                              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-800">
                                    {
                                      refund.refundNumber
                                    }
                                  </p>

                                  <span
                                    className={`rounded-full px-2 py-1 text-[9px] font-bold ${paymentMethodClass(
                                      refund.method
                                    )}`}
                                  >
                                    {
                                      refund.method
                                    }
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatDateTime(
                                    refund.createdAt
                                  )}
                                </p>
                              </div>

                              <p className="font-black text-slate-800">
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

                  {/* ACTIONS */}

                  <div className="flex gap-3 border-t border-slate-100 pt-5">
                    {selectedReturn.status ===
                      "APPROVED" && (
                      <button
                        type="button"
                        disabled={
                          refundLoading
                        }
                        onClick={() =>
                          openRefund(
                            selectedReturn
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        <CreditCard
                          size={16}
                        />

                        Process Refund
                      </button>
                    )}

                    {selectedReturn.status ===
                      "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          const item =
                            selectedReturn;

                          closeDetails();

                          openCancel(
                            item
                          );
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2
                          size={16}
                        />

                        Cancel Return
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* =================================================
          CANCEL MODAL
      ================================================== */}

      {cancelOpen &&
        cancelTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <form
              onSubmit={
                handleCancel
              }
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Cancel Return
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      cancelTarget.returnNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeCancel
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <textarea
                rows={4}
                maxLength={500}
                value={
                  cancelReason
                }
                onChange={(event) =>
                  setCancelReason(
                    event.target.value
                  )
                }
                placeholder="Cancellation reason..."
                className="mt-5 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-red-400"
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={
                    closeCancel
                  }
                  className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
                >
                  Keep Return
                </button>

                <button
                  type="submit"
                  disabled={
                    cancelLoading
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {cancelLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2
                      size={16}
                    />
                  )}

                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      {/* =================================================
          REFUND MODAL
      ================================================== */}

      {refundOpen &&
        refundTarget && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <form
              onSubmit={
                processRefund
              }
              className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Approved Return
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    Process Refund
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      refundTarget.returnNumber
                    }
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    refundLoading
                  }
                  onClick={
                    closeRefund
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="space-y-5 p-6">

                {/* REQUIRED */}

                <div className="rounded-2xl bg-emerald-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Refund Required
                  </p>

                  <p className="mt-2 text-3xl font-black text-emerald-800">
                    {formatMoney(
                      requiredRefundAmount
                    )}
                  </p>
                </div>

                {/* ALLOCATIONS */}

                <div>
                  <h3 className="font-black text-slate-900">
                    Original Payment Allocation
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Refund is allocated back
                    to the original payments.
                  </p>

                  <div className="mt-4 space-y-3">
                    {refundAllocations.map(
                      (
                        allocation,
                        index
                      ) => (
                        <div
                          key={
                            allocation.paymentId
                          }
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800">
                                  {
                                    allocation.paymentNumber
                                  }
                                </p>

                                <span
                                  className={`rounded-full px-2 py-1 text-[9px] font-bold ${paymentMethodClass(
                                    allocation.method
                                  )}`}
                                >
                                  {
                                    allocation.method
                                  }
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                Refundable:{" "}
                                {formatMoney(
                                  allocation.refundableAmount
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                Refund Amount
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                max={
                                  allocation.refundableAmount
                                }
                                value={
                                  allocation.amount
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateRefundAllocation(
                                    index,
                                    "amount",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-emerald-400"
                              />
                            </div>

                            {[
                              "CARD",
                              "QR",
                            ].includes(
                              allocation.method
                            ) && (
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                                  Refund Reference
                                </label>

                                <input
                                  type="text"
                                  maxLength={
                                    150
                                  }
                                  value={
                                    allocation.transactionReference
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateRefundAllocation(
                                      index,
                                      "transactionReference",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder={`${allocation.method} refund reference`}
                                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
                                />
                              </div>
                            )}
                          </div>

                          <input
                            type="text"
                            maxLength={500}
                            value={
                              allocation.note
                            }
                            onChange={(
                              event
                            ) =>
                              updateRefundAllocation(
                                index,
                                "note",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Optional refund note..."
                            className="mt-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* TOTAL */}

                <div
                  className={`rounded-xl p-4 ${
                    Math.abs(
                      refundAllocationTotal -
                        requiredRefundAmount
                    ) < 0.009
                      ? "bg-emerald-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-slate-600">
                      Allocation Total
                    </span>

                    <span className="text-xl font-black text-slate-900">
                      {formatMoney(
                        refundAllocationTotal
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs leading-5 text-amber-700">
                    CASH refund requires an
                    open cashier shift and an
                    active cash drawer with
                    enough expected cash.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    refundLoading
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {refundLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CreditCard
                      size={17}
                    />
                  )}

                  Complete Refund
                </button>
              </div>
            </form>
          </div>
        )}
    </>
  );
};

export default Returns;