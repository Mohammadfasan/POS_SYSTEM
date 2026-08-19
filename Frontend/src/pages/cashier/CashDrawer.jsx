import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Store,
  WalletCards,
  X,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const TRANSACTION_TYPES = [
  "",
  "SALE",
  "CASH_IN",
  "CASH_OUT",
  "REFUND",
  "VOID",
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

const displayTransactionType = (type) => {
  if (!type) {
    return "Unknown";
  }

  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const isCashIncrease = (type) =>
  ["SALE", "CASH_IN"].includes(type);

const isCashDecrease = (type) =>
  ["CASH_OUT", "REFUND", "VOID"].includes(type);

const transactionClass = (type) => {
  if (type === "SALE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (type === "CASH_IN") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (type === "CASH_OUT") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  if (type === "REFUND") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (type === "VOID") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
};

// ======================================================
// CASH DRAWER
// ======================================================

const CashDrawer = () => {
  const navigate = useNavigate();

  // ====================================================
  // CURRENT DRAWER
  // ====================================================

  const [drawerInfo, setDrawerInfo] =
    useState(null);

  const [noActiveShift, setNoActiveShift] =
    useState(false);

  // ====================================================
  // TRANSACTIONS
  // ====================================================

  const [transactions, setTransactions] =
    useState([]);

  const [transactionType, setTransactionType] =
    useState("");

  const [transactionScope, setTransactionScope] =
    useState("CURRENT");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(10);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });

  // ====================================================
  // UI
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [transactionsLoading, setTransactionsLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [movementLoading, setMovementLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // MOVEMENT MODAL
  // ====================================================

  const [movementOpen, setMovementOpen] =
    useState(false);

  const [movementType, setMovementType] =
    useState(null);

  const [amount, setAmount] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [referenceType, setReferenceType] =
    useState("");

  const [referenceId, setReferenceId] =
    useState("");

  // ====================================================
  // LOAD CURRENT DRAWER
  // ====================================================

  const loadCurrentDrawer =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/cash-drawers/current"
          );

        const data =
          response.data?.data || null;

        setDrawerInfo(data);

        setNoActiveShift(false);

        return data;
      } catch (error) {
        const message =
          getErrorMessage(
            error,
            "Unable to load current cash drawer."
          );

        /*
         * Current drawer endpoint returns an
         * error when cashier has no OPEN shift.
         */

        if (
          error?.response?.status === 400 &&
          message
            .toLowerCase()
            .includes("active shift")
        ) {
          setDrawerInfo(null);
          setNoActiveShift(true);

          return null;
        }

        setDrawerInfo(null);

        throw error;
      }
    }, []);

  // ====================================================
  // LOAD TRANSACTIONS
  // ====================================================

  const loadTransactions =
    useCallback(
      async (info = drawerInfo) => {
        const drawerId =
          info?.drawer?.id;

        if (!drawerId) {
          setTransactions([]);

          setPagination({
            page: 1,
            limit,
            total: 0,
            totalPages: 1,
          });

          return;
        }

        try {
          setTransactionsLoading(true);

          const params = {
            page,
            limit,
          };

          if (transactionType) {
            params.type =
              transactionType;
          }

          if (
            transactionScope ===
              "CURRENT" &&
            info?.shift?.id
          ) {
            params.shiftId =
              info.shift.id;
          }

          const response =
            await api.get(
              `/cash-drawers/${drawerId}/transactions`,
              {
                params,
              }
            );

          const result =
            response.data?.data || {};

          const list =
            result.transactions || [];

          setTransactions(
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

            totalPages:
              Math.max(
                1,
                Number(
                  paging.totalPages
                ) || 1
              ),
          });
        } catch (error) {
          console.error(
            "Drawer transactions error:",
            error.response?.data ||
              error.message
          );

          setTransactions([]);

          setError(
            getErrorMessage(
              error,
              "Unable to load cash drawer transactions."
            )
          );
        } finally {
          setTransactionsLoading(
            false
          );
        }
      },
      [
        drawerInfo,
        page,
        limit,
        transactionType,
        transactionScope,
      ]
    );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);

        setError("");

        const info =
          await loadCurrentDrawer();

        if (
          active &&
          info?.drawer?.id
        ) {
          /*
           * Transactions have a separate
           * effect below.
           */
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setError(
          getErrorMessage(
            error,
            "Unable to load cash drawer."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadCurrentDrawer]);

  // ====================================================
  // TRANSACTION EFFECT
  // ====================================================

  useEffect(() => {
    if (!drawerInfo?.drawer?.id) {
      return;
    }

    loadTransactions();
  }, [
    drawerInfo?.drawer?.id,
    drawerInfo?.shift?.id,
    page,
    transactionType,
    transactionScope,
    loadTransactions,
  ]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        setError("");
        setSuccess("");

        const info =
          await loadCurrentDrawer();

        if (info?.drawer?.id) {
          await loadTransactions(
            info
          );
        }
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to refresh cash drawer."
          )
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ====================================================
  // CURRENT DATA
  // ====================================================

  const drawer =
    drawerInfo?.drawer;

  const shift =
    drawerInfo?.shift;

  const terminal =
    drawerInfo?.terminal;

  const branch =
    drawerInfo?.branch;

  const expectedCash =
    Number(
      shift?.expectedCash || 0
    );

  // ====================================================
  // TRANSACTION STATS
  // ====================================================

  const transactionStats =
    useMemo(() => {
      let cashIn = 0;
      let cashOut = 0;
      let sales = 0;
      let refunds = 0;

      transactions.forEach(
        (transaction) => {
          const value =
            Number(
              transaction.amount || 0
            );

          if (
            transaction.type ===
            "CASH_IN"
          ) {
            cashIn += value;
          }

          if (
            transaction.type ===
            "CASH_OUT"
          ) {
            cashOut += value;
          }

          if (
            transaction.type ===
            "SALE"
          ) {
            sales += value;
          }

          if (
            [
              "REFUND",
              "VOID",
            ].includes(
              transaction.type
            )
          ) {
            refunds += value;
          }
        }
      );

      return {
        cashIn,
        cashOut,
        sales,
        refunds,
      };
    }, [transactions]);

  // ====================================================
  // OPEN MOVEMENT MODAL
  // ====================================================

  const openMovement = (
    type
  ) => {
    if (!drawer?.id) {
      setError(
        "No active cash drawer found."
      );

      return;
    }

    setMovementType(type);

    setAmount("");
    setReason("");
    setReferenceType("");
    setReferenceId("");

    setError("");

    setMovementOpen(true);
  };

  // ====================================================
  // CLOSE MOVEMENT MODAL
  // ====================================================

  const closeMovement = () => {
    if (movementLoading) {
      return;
    }

    setMovementOpen(false);

    setMovementType(null);

    setAmount("");
    setReason("");
    setReferenceType("");
    setReferenceId("");
  };

  // ====================================================
  // SUBMIT CASH MOVEMENT
  // ====================================================

  const handleCashMovement =
    async (event) => {
      event.preventDefault();

      if (
        !drawer?.id ||
        !movementType
      ) {
        return;
      }

      const cashAmount =
        Number(amount);

      const movementReason =
        reason.trim();

      if (
        !Number.isFinite(
          cashAmount
        ) ||
        cashAmount <= 0
      ) {
        setError(
          "Amount must be greater than zero."
        );

        return;
      }

      if (
        movementReason.length <
        2
      ) {
        setError(
          "Reason must contain at least 2 characters."
        );

        return;
      }

      /*
       * Backend also validates this.
       */

      if (
        movementType ===
          "CASH_OUT" &&
        cashAmount >
          expectedCash
      ) {
        setError(
          `Cash out cannot exceed current expected cash ${formatMoney(
            expectedCash
          )}.`
        );

        return;
      }

      try {
        setMovementLoading(true);

        setError("");
        setSuccess("");

        const payload = {
          amount:
            cashAmount,

          reason:
            movementReason,

          ...(referenceType.trim()
            ? {
                referenceType:
                  referenceType.trim(),
              }
            : {}),

          ...(referenceId.trim()
            ? {
                referenceId:
                  referenceId.trim(),
              }
            : {}),
        };

        const endpoint =
          movementType ===
          "CASH_IN"
            ? `/cash-drawers/${drawer.id}/cash-in`
            : `/cash-drawers/${drawer.id}/cash-out`;

        const response =
          await api.post(
            endpoint,
            payload
          );

        setSuccess(
          response.data?.message ||
            (movementType ===
            "CASH_IN"
              ? "Cash added successfully."
              : "Cash removed successfully.")
        );

        setMovementOpen(false);

        setMovementType(null);

        setAmount("");
        setReason("");
        setReferenceType("");
        setReferenceId("");

        const info =
          await loadCurrentDrawer();

        setPage(1);

        if (info?.drawer?.id) {
          await loadTransactions(
            info
          );
        }
      } catch (error) {
        console.error(
          "Cash movement error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to update cash drawer."
          )
        );
      } finally {
        setMovementLoading(
          false
        );
      }
    };

  // ====================================================
  // FILTER CHANGE
  // ====================================================

  const handleTransactionType = (
    value
  ) => {
    setTransactionType(value);
    setPage(1);
  };

  const handleScope = (
    value
  ) => {
    setTransactionScope(value);
    setPage(1);
  };

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading cash drawer...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // NO ACTIVE SHIFT
  // ====================================================

  if (
    noActiveShift ||
    !drawerInfo
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              Cashier POS
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Cash Drawer
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage cash movements
              during your shift.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
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
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <WalletCards
                size={30}
                className="text-amber-600"
              />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              No Active Cash Drawer
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You need an open cashier
              shift before accessing the
              terminal cash drawer.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cashier/shift"
                )
              }
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              Open Cashier Shift
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN UI
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
              <WalletCards
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Cash Drawer
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage physical cash and
              monitor drawer transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
            DRAWER CARD
        ============================================ */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* TOP */}

          <div className="flex flex-col justify-between gap-5 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">
                  Active Drawer
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {drawer.name}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {drawer.code}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  openMovement(
                    "CASH_IN"
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
              >
                <ArrowDownToLine
                  size={16}
                />

                Cash In
              </button>

              <button
                type="button"
                onClick={() =>
                  openMovement(
                    "CASH_OUT"
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
              >
                <ArrowUpFromLine
                  size={16}
                />

                Cash Out
              </button>
            </div>
          </div>

          {/* INFO */}

          <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-3">
            <div className="bg-white p-5">
              <div className="flex items-center gap-3">
                <Store
                  size={18}
                  className="text-blue-600"
                />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Branch
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {branch?.name ||
                      "-"}
                  </p>

                  <p className="text-xs text-slate-400">
                    {branch?.code ||
                      ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5">
              <div className="flex items-center gap-3">
                <WalletCards
                  size={18}
                  className="text-purple-600"
                />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Terminal
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {terminal?.name ||
                      "-"}
                  </p>

                  <p className="text-xs text-slate-400">
                    {terminal?.code ||
                      ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5">
              <div className="flex items-center gap-3">
                <Clock3
                  size={18}
                  className="text-emerald-600"
                />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Shift
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {shift?.shiftNumber ||
                      "-"}
                  </p>

                  <p className="text-xs text-slate-400">
                    {formatDateTime(
                      shift?.openedAt
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===========================================
            CASH SUMMARY
        ============================================ */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">

          {/* OPENING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-400">
              Opening Cash
            </p>

            <p className="mt-2 text-lg font-black text-slate-900">
              {formatMoney(
                shift?.openingCash
              )}
            </p>
          </div>

          {/* SALES */}

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-600">
              Cash Sales
            </p>

            <p className="mt-2 text-lg font-black text-emerald-700">
              +{" "}
              {formatMoney(
                shift?.cashSales
              )}
            </p>
          </div>

          {/* CASH IN */}

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-600">
              Cash In
            </p>

            <p className="mt-2 text-lg font-black text-blue-700">
              +{" "}
              {formatMoney(
                shift?.cashIn
              )}
            </p>
          </div>

          {/* REFUND */}

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-semibold text-orange-600">
              Cash Refunds
            </p>

            <p className="mt-2 text-lg font-black text-orange-700">
              -{" "}
              {formatMoney(
                shift?.cashRefunds
              )}
            </p>
          </div>

          {/* CASH OUT */}

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-600">
              Cash Out
            </p>

            <p className="mt-2 text-lg font-black text-red-700">
              -{" "}
              {formatMoney(
                shift?.cashOut
              )}
            </p>
          </div>

          {/* EXPECTED */}

          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
            <p className="text-xs font-semibold text-slate-300">
              Expected Cash
            </p>

            <p className="mt-2 text-lg font-black">
              {formatMoney(
                expectedCash
              )}
            </p>
          </div>
        </div>

        {/* ===========================================
            TRANSACTIONS
        ============================================ */}

        <section>
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <History
                  size={18}
                  className="text-slate-500"
                />

                <h2 className="text-lg font-black text-slate-900">
                  Drawer Transactions
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Cash movements recorded
                against this drawer.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              {/* SCOPE */}

              <select
                value={
                  transactionScope
                }
                onChange={(event) =>
                  handleScope(
                    event.target
                      .value
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
              >
                <option value="CURRENT">
                  CURRENT SHIFT
                </option>

                <option value="ALL">
                  ALL MY SHIFTS
                </option>
              </select>

              {/* TYPE */}

              <select
                value={
                  transactionType
                }
                onChange={(event) =>
                  handleTransactionType(
                    event.target
                      .value
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none"
              >
                {TRANSACTION_TYPES.map(
                  (type) => (
                    <option
                      key={
                        type ||
                        "ALL"
                      }
                      value={type}
                    >
                      {type
                        ? displayTransactionType(
                            type
                          ).toUpperCase()
                        : "ALL TYPES"}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* CURRENT PAGE STATS */}

          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-600">
                Sales on Page
              </p>

              <p className="mt-2 font-black text-emerald-700">
                {formatMoney(
                  transactionStats.sales
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-600">
                Cash In on Page
              </p>

              <p className="mt-2 font-black text-blue-700">
                {formatMoney(
                  transactionStats.cashIn
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-600">
                Cash Out on Page
              </p>

              <p className="mt-2 font-black text-red-700">
                {formatMoney(
                  transactionStats.cashOut
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold text-orange-600">
                Refund / Void
              </p>

              <p className="mt-2 font-black text-orange-700">
                {formatMoney(
                  transactionStats.refunds
                )}
              </p>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {transactionsLoading ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <Loader2
                  size={30}
                  className="animate-spin text-blue-600"
                />
              </div>
            ) : transactions.length ===
              0 ? (
              <div className="flex min-h-[350px] items-center justify-center p-6 text-center">
                <div>
                  <Banknote
                    size={42}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-4 font-bold text-slate-700">
                    No Transactions
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Cash drawer
                    transactions will
                    appear here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px]">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4">
                          Type
                        </th>

                        <th className="px-5 py-4">
                          Amount
                        </th>

                        <th className="px-5 py-4">
                          Balance Before
                        </th>

                        <th className="px-5 py-4">
                          Balance After
                        </th>

                        <th className="px-5 py-4">
                          Reason
                        </th>

                        <th className="px-5 py-4">
                          Reference
                        </th>

                        <th className="px-5 py-4">
                          Shift
                        </th>

                        <th className="px-5 py-4">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {transactions.map(
                        (
                          transaction
                        ) => (
                          <tr
                            key={
                              transaction.id
                            }
                            className="transition hover:bg-slate-50"
                          >
                            {/* TYPE */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${transactionClass(
                                  transaction.type
                                )}`}
                              >
                                {displayTransactionType(
                                  transaction.type
                                )}
                              </span>
                            </td>

                            {/* AMOUNT */}

                            <td className="px-5 py-4">
                              <p
                                className={`font-black ${
                                  isCashIncrease(
                                    transaction.type
                                  )
                                    ? "text-emerald-600"
                                    : isCashDecrease(
                                        transaction.type
                                      )
                                    ? "text-red-600"
                                    : "text-slate-800"
                                }`}
                              >
                                {isCashIncrease(
                                  transaction.type
                                )
                                  ? "+"
                                  : isCashDecrease(
                                      transaction.type
                                    )
                                  ? "-"
                                  : ""}

                                {formatMoney(
                                  transaction.amount
                                )}
                              </p>
                            </td>

                            {/* BEFORE */}

                            <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                              {formatMoney(
                                transaction.balanceBefore
                              )}
                            </td>

                            {/* AFTER */}

                            <td className="px-5 py-4 text-sm font-bold text-slate-800">
                              {formatMoney(
                                transaction.balanceAfter
                              )}
                            </td>

                            {/* REASON */}

                            <td className="px-5 py-4">
                              <p className="max-w-[240px] text-sm text-slate-600">
                                {transaction.reason ||
                                  "-"}
                              </p>
                            </td>

                            {/* REFERENCE */}

                            <td className="px-5 py-4">
                              <p className="text-xs font-bold text-slate-600">
                                {transaction.referenceType ||
                                  "-"}
                              </p>

                              {transaction.referenceId && (
                                <p className="mt-1 max-w-[150px] truncate text-[10px] text-slate-400">
                                  {
                                    transaction.referenceId
                                  }
                                </p>
                              )}
                            </td>

                            {/* SHIFT */}

                            <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                              {transaction
                                ?.shift
                                ?.shiftNumber ||
                                "-"}
                            </td>

                            {/* DATE */}

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {formatDateTime(
                                transaction.createdAt
                              )}
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
                      {
                        pagination.page
                      }
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {
                        pagination.totalPages
                      }
                    </strong>
                    {" · "}
                    {pagination.total} transactions
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
                              current -
                                1
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
                            current +
                            1
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
        </section>
      </div>

      {/* ==============================================
          CASH MOVEMENT MODAL
      =============================================== */}

      {movementOpen &&
        movementType && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <form
              onSubmit={
                handleCashMovement
              }
              className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-slate-100 p-6">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      movementType ===
                      "CASH_IN"
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    Cash Drawer Movement
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {movementType ===
                    "CASH_IN"
                      ? "Cash In"
                      : "Cash Out"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {drawer.name} ·{" "}
                    {drawer.code}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    movementLoading
                  }
                  onClick={
                    closeMovement
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 p-6">

                {/* CURRENT BALANCE */}

                <div className="rounded-2xl bg-slate-900 p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Current Expected Cash
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {formatMoney(
                      expectedCash
                    )}
                  </p>
                </div>

                {/* AMOUNT */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Amount
                  </label>

                  <div className="relative">
                    <Banknote
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target
                            .value
                        )
                      }
                      placeholder="0.00"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-black outline-none focus:border-blue-400 focus:bg-white"
                    />
                  </div>

                  {movementType ===
                    "CASH_OUT" && (
                    <p className="mt-2 text-xs text-slate-400">
                      Maximum available:{" "}
                      {formatMoney(
                        expectedCash
                      )}
                    </p>
                  )}
                </div>

                {/* REASON */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Reason
                  </label>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reason}
                    onChange={(event) =>
                      setReason(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      movementType ===
                      "CASH_IN"
                        ? "Example: Additional float..."
                        : "Example: Petty cash expense..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-400"
                  />

                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {reason.length}/500
                  </p>
                </div>

                {/* REFERENCE */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Reference Type
                    </label>

                    <input
                      type="text"
                      maxLength={50}
                      value={
                        referenceType
                      }
                      onChange={(event) =>
                        setReferenceType(
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Reference ID
                    </label>

                    <input
                      type="text"
                      maxLength={100}
                      value={
                        referenceId
                      }
                      onChange={(event) =>
                        setReferenceId(
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* PREVIEW */}

                {Number(amount) >
                  0 && (
                  <div
                    className={`rounded-xl border p-4 ${
                      movementType ===
                      "CASH_IN"
                        ? "border-blue-200 bg-blue-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Current
                      </span>

                      <span className="font-bold text-slate-700">
                        {formatMoney(
                          expectedCash
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-500">
                        {movementType ===
                        "CASH_IN"
                          ? "Add"
                          : "Remove"}
                      </span>

                      <span
                        className={`font-bold ${
                          movementType ===
                          "CASH_IN"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {movementType ===
                        "CASH_IN"
                          ? "+"
                          : "-"}
                        {formatMoney(
                          amount
                        )}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-current/10 pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-700">
                          New Expected
                        </span>

                        <span className="text-lg font-black text-slate-900">
                          {formatMoney(
                            movementType ===
                              "CASH_IN"
                              ? expectedCash +
                                  Number(
                                    amount
                                  )
                              : expectedCash -
                                  Number(
                                    amount
                                  )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBMIT */}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={
                      movementLoading
                    }
                    onClick={
                      closeMovement
                    }
                    className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      movementLoading
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white disabled:opacity-50 ${
                      movementType ===
                      "CASH_IN"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {movementLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : movementType ===
                      "CASH_IN" ? (
                      <ArrowDownToLine
                        size={16}
                      />
                    ) : (
                      <ArrowUpFromLine
                        size={16}
                      />
                    )}

                    {movementType ===
                    "CASH_IN"
                      ? "Add Cash"
                      : "Remove Cash"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
    </>
  );
};

export default CashDrawer;