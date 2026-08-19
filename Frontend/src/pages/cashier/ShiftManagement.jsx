import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Save,
  Store,
  WalletCards,
  X,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONFIG
// ======================================================

const TERMINAL_STORAGE_KEY =
  "posTerminalId";

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
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

const formatDuration = (
  openedAt,
  closedAt
) => {
  if (!openedAt) {
    return "-";
  }

  const start =
    new Date(openedAt).getTime();

  const end = closedAt
    ? new Date(closedAt).getTime()
    : Date.now();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return "-";
  }

  const totalMinutes = Math.max(
    0,
    Math.floor(
      (end - start) / 60000
    )
  );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes =
    totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${minutes}m`;
};

const statusClass = (status) => {
  if (status === "OPEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "CLOSED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
};

// ======================================================
// COMPONENT
// ======================================================

const ShiftManagement = () => {
  // ====================================================
  // CURRENT SHIFT
  // ====================================================

  const [currentShift, setCurrentShift] =
    useState(null);

  // ====================================================
  // HISTORY
  // ====================================================

  const [shifts, setShifts] =
    useState([]);

  const [historyStatus, setHistoryStatus] =
    useState("");

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
  // LOADING
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [opening, setOpening] =
    useState(false);

  const [closing, setClosing] =
    useState(false);

  const [detailLoading, setDetailLoading] =
    useState(false);

  // ====================================================
  // MESSAGES
  // ====================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // OPEN SHIFT FORM
  // ====================================================

  const [terminalId, setTerminalId] =
    useState(
      () =>
        localStorage.getItem(
          TERMINAL_STORAGE_KEY
        ) || ""
    );

  const [
    openingCash,
    setOpeningCash,
  ] = useState("");

  const [
    openingNote,
    setOpeningNote,
  ] = useState("");

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const [closeOpen, setCloseOpen] =
    useState(false);

  const [
    closingCash,
    setClosingCash,
  ] = useState("");

  const [
    closingNote,
    setClosingNote,
  ] = useState("");

  // ====================================================
  // DETAIL MODAL
  // ====================================================

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [
    selectedShift,
    setSelectedShift,
  ] = useState(null);

  // ====================================================
  // LOAD CURRENT SHIFT
  // ====================================================

  const loadCurrentShift =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/shifts/current"
          );

        const shift =
          response.data?.data
            ?.shift ?? null;

        setCurrentShift(shift);

        /*
         * If shift exists,
         * remember terminal for
         * this workstation/device.
         */

        if (
          shift?.terminal?.id
        ) {
          localStorage.setItem(
            TERMINAL_STORAGE_KEY,
            shift.terminal.id
          );

          setTerminalId(
            shift.terminal.id
          );
        }

        return shift;
      } catch (error) {
        console.error(
          "Current shift error:",
          error.response?.data ||
            error.message
        );

        throw error;
      }
    }, []);

  // ====================================================
  // LOAD HISTORY
  // ====================================================

  const loadShiftHistory =
    useCallback(async () => {
      try {
        const params = {
          page,
          limit,
        };

        if (historyStatus) {
          params.status =
            historyStatus;
        }

        const response =
          await api.get(
            "/shifts",
            {
              params,
            }
          );

        const result =
          response.data?.data || {};

        const shiftList =
          result.shifts || [];

        setShifts(
          Array.isArray(shiftList)
            ? shiftList
            : []
        );

        const paging =
          result.pagination || {};

        setPagination({
          page:
            Number(paging.page) ||
            page,

          limit:
            Number(paging.limit) ||
            limit,

          total:
            Number(paging.total) ||
            0,

          totalPages: Math.max(
            1,
            Number(
              paging.totalPages
            ) || 1
          ),
        });
      } catch (error) {
        console.error(
          "Shift history error:",
          error.response?.data ||
            error.message
        );

        setShifts([]);

        throw error;
      }
    }, [
      page,
      limit,
      historyStatus,
    ]);

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadCurrentShift(),
          loadShiftHistory(),
        ]);
      } catch (error) {
        if (!active) {
          return;
        }

        setError(
          getErrorMessage(
            error,
            "Unable to load shift information."
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
  }, [
    loadCurrentShift,
    loadShiftHistory,
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

        await Promise.all([
          loadCurrentShift(),
          loadShiftHistory(),
        ]);
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to refresh shift information."
          )
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ====================================================
  // SAVE TERMINAL
  // ====================================================

  const saveTerminalId = () => {
    const value =
      terminalId.trim();

    if (!value) {
      setError(
        "Enter the workstation terminal ID."
      );

      return;
    }

    localStorage.setItem(
      TERMINAL_STORAGE_KEY,
      value
    );

    setSuccess(
      "Terminal saved for this device."
    );

    setError("");
  };

  // ====================================================
  // OPEN SHIFT
  // ====================================================

  const handleOpenShift =
    async (event) => {
      event.preventDefault();

      const terminal =
        terminalId.trim();

      const amount =
        Number(openingCash);

      if (!terminal) {
        setError(
          "Terminal ID is required."
        );

        return;
      }

      if (
        openingCash === "" ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        setError(
          "Enter a valid opening cash amount."
        );

        return;
      }

      try {
        setOpening(true);

        setError("");
        setSuccess("");

        const payload = {
          terminalId:
            terminal,

          openingCash:
            amount,

          ...(openingNote.trim()
            ? {
                openingNote:
                  openingNote.trim(),
              }
            : {}),
        };

        const response =
          await api.post(
            "/shifts/open",
            payload
          );

        const shift =
          response.data?.data
            ?.shift;

        if (!shift) {
          throw new Error(
            "Shift was opened but shift data was not returned."
          );
        }

        localStorage.setItem(
          TERMINAL_STORAGE_KEY,
          terminal
        );

        setCurrentShift(shift);

        setOpeningCash("");
        setOpeningNote("");

        setSuccess(
          response.data?.message ||
            "Cashier shift opened successfully."
        );

        setPage(1);

        await loadShiftHistory();
      } catch (error) {
        console.error(
          "Open shift error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to open shift."
          )
        );
      } finally {
        setOpening(false);
      }
    };

  // ====================================================
  // CURRENT SHIFT EXPECTED CASH
  //
  // Backend formula:
  //
  // openingCash
  // + cashSales
  // + cashIn
  // - cashRefunds
  // - cashOut
  // ====================================================

  const expectedCash =
    useMemo(() => {
      if (!currentShift) {
        return 0;
      }

      return (
        Number(
          currentShift.openingCash ||
            0
        ) +
        Number(
          currentShift.cashSales ||
            0
        ) +
        Number(
          currentShift.cashIn || 0
        ) -
        Number(
          currentShift.cashRefunds ||
            0
        ) -
        Number(
          currentShift.cashOut || 0
        )
      );
    }, [currentShift]);

  // ====================================================
  // CLOSING CASH DIFFERENCE
  // ====================================================

  const closingDifference =
    useMemo(() => {
      if (
        closingCash === ""
      ) {
        return null;
      }

      const amount =
        Number(closingCash);

      if (
        !Number.isFinite(amount)
      ) {
        return null;
      }

      return (
        amount -
        expectedCash
      );
    }, [
      closingCash,
      expectedCash,
    ]);

  // ====================================================
  // OPEN CLOSE MODAL
  // ====================================================

  const openCloseModal = () => {
    if (!currentShift) {
      return;
    }

    setClosingCash("");
    setClosingNote("");

    setError("");

    setCloseOpen(true);
  };

  // ====================================================
  // CLOSE CLOSE MODAL
  // ====================================================

  const closeCloseModal = () => {
    if (closing) {
      return;
    }

    setCloseOpen(false);

    setClosingCash("");
    setClosingNote("");
  };

  // ====================================================
  // USE EXPECTED CASH
  // ====================================================

  const useExpectedCash = () => {
    setClosingCash(
      Number(
        expectedCash
      ).toFixed(2)
    );
  };

  // ====================================================
  // CLOSE SHIFT
  // ====================================================

  const handleCloseShift =
    async (event) => {
      event.preventDefault();

      if (!currentShift) {
        return;
      }

      const actualCash =
        Number(closingCash);

      if (
        closingCash === "" ||
        !Number.isFinite(
          actualCash
        ) ||
        actualCash < 0
      ) {
        setError(
          "Enter a valid closing cash amount."
        );

        return;
      }

      const difference =
        actualCash -
        expectedCash;

      /*
       * Backend requires
       * closing note if
       * cashDifference != 0.
       */

      if (
        Math.abs(difference) >
          0.0001 &&
        !closingNote.trim()
      ) {
        setError(
          "Closing note is required because actual cash is different from expected cash."
        );

        return;
      }

      try {
        setClosing(true);

        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/shifts/${currentShift.id}/close`,
            {
              closingCash:
                actualCash,

              ...(closingNote.trim()
                ? {
                    closingNote:
                      closingNote.trim(),
                  }
                : {}),
            }
          );

        setSuccess(
          response.data?.message ||
            "Cashier shift closed successfully."
        );

        setCurrentShift(null);

        setCloseOpen(false);

        setClosingCash("");
        setClosingNote("");

        setPage(1);

        await loadShiftHistory();
      } catch (error) {
        console.error(
          "Close shift error:",
          error.response?.data ||
            error.message
        );

        setError(
          getErrorMessage(
            error,
            "Unable to close shift."
          )
        );
      } finally {
        setClosing(false);
      }
    };

  // ====================================================
  // VIEW SHIFT
  // ====================================================

  const openShiftDetail =
    async (shift) => {
      try {
        setSelectedShift(
          shift
        );

        setDetailOpen(true);

        setDetailLoading(true);

        setError("");

        const response =
          await api.get(
            `/shifts/${shift.id}`
          );

        const detailedShift =
          response.data?.data
            ?.shift;

        if (detailedShift) {
          setSelectedShift(
            detailedShift
          );
        }
      } catch (error) {
        setError(
          getErrorMessage(
            error,
            "Unable to load shift details."
          )
        );
      } finally {
        setDetailLoading(false);
      }
    };

  // ====================================================
  // CLOSE DETAIL
  // ====================================================

  const closeShiftDetail = () => {
    setDetailOpen(false);

    setSelectedShift(null);
  };

  // ====================================================
  // HISTORY FILTER
  // ====================================================

  const handleHistoryStatus = (
    value
  ) => {
    setHistoryStatus(value);
    setPage(1);
  };

  // ====================================================
  // HISTORY STATS
  // ====================================================

  const historyStats =
    useMemo(() => {
      const closed =
        shifts.filter(
          (shift) =>
            shift.status ===
            "CLOSED"
        );

      const totalSales =
        shifts.reduce(
          (total, shift) =>
            total +
            Number(
              shift.cashSales || 0
            ),
          0
        );

      const totalDifference =
        closed.reduce(
          (total, shift) =>
            total +
            Number(
              shift.cashDifference ||
                0
            ),
          0
        );

      return {
        closedCount:
          closed.length,

        totalSales,

        totalDifference,
      };
    }, [shifts]);

  // ====================================================
  // INITIAL LOADING
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
            Loading shift management...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ==========================================
            HEADER
        =========================================== */}

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Clock3
                size={18}
                className="text-blue-600"
              />

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Cashier POS
              </p>
            </div>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              Shift Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Open, monitor and close your
              cashier shift.
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
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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

        {/* ==========================================
            ERROR
        =========================================== */}

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

        {/* ==========================================
            SUCCESS
        =========================================== */}

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

        {/* ==========================================
            CURRENT SHIFT / OPEN SHIFT
        =========================================== */}

        {currentShift ? (
          <>

            {/* ACTIVE SHIFT HEADER */}

            <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50/60 p-5 lg:p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />

                      <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">
                        Active Shift
                      </p>
                    </div>

                    <h2 className="mt-2 text-2xl font-black text-slate-900">
                      {
                        currentShift.shiftNumber
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Opened{" "}
                      {formatDateTime(
                        currentShift.openedAt
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-xl border border-emerald-200 bg-white px-4 py-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Duration
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatDuration(
                          currentShift.openedAt
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        openCloseModal
                      }
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      <LockKeyhole
                        size={16}
                      />

                      Close Shift
                    </button>
                  </div>
                </div>
              </div>

              {/* BRANCH / TERMINAL */}

              <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-2">
                <div className="bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <Store
                        size={18}
                        className="text-blue-600"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Branch
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        {currentShift
                          ?.branch
                          ?.name || "-"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {currentShift
                          ?.branch
                          ?.code || ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                      <WalletCards
                        size={18}
                        className="text-purple-600"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Terminal
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        {currentShift
                          ?.terminal
                          ?.name || "-"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {currentShift
                          ?.terminal
                          ?.code || ""}

                        {currentShift
                          ?.terminal
                          ?.location
                          ? ` · ${currentShift.terminal.location}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CASH SUMMARY */}

            <div>
              <div className="mb-3">
                <h2 className="text-lg font-black text-slate-900">
                  Cash Summary
                </h2>

                <p className="text-xs text-slate-400">
                  Current shift cash
                  calculation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">

                {/* OPENING */}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Opening Cash
                  </p>

                  <p className="mt-2 text-lg font-black text-slate-900">
                    {formatMoney(
                      currentShift.openingCash
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
                      currentShift.cashSales
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
                      currentShift.cashIn
                    )}
                  </p>
                </div>

                {/* REFUNDS */}

                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-semibold text-orange-600">
                    Cash Refunds
                  </p>

                  <p className="mt-2 text-lg font-black text-orange-700">
                    -{" "}
                    {formatMoney(
                      currentShift.cashRefunds
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
                      currentShift.cashOut
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
            </div>

            {/* OPENING NOTE */}

            {currentShift.openingNote && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Opening Note
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {
                    currentShift.openingNote
                  }
                </p>
              </div>
            )}
          </>
        ) : (
          /* ========================================
             OPEN SHIFT FORM
          ========================================= */

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">

            <form
              onSubmit={
                handleOpenShift
              }
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Clock3
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Open Cashier Shift
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Start your POS session
                    before creating sales.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">

                {/* TERMINAL */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Workstation Terminal ID
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={
                        terminalId
                      }
                      onChange={(event) =>
                        setTerminalId(
                          event.target
                            .value
                        )
                      }
                      placeholder="Terminal UUID"
                      className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="button"
                      onClick={
                        saveTerminalId
                      }
                      className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <Save
                        size={15}
                      />

                      Save
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Saved only on this POS
                    device/browser.
                  </p>
                </div>

                {/* OPENING CASH */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Opening Cash
                  </label>

                  <div className="relative">
                    <Banknote
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        openingCash
                      }
                      onChange={(event) =>
                        setOpeningCash(
                          event.target
                            .value
                        )
                      }
                      placeholder="0.00"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* NOTE */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Opening Note
                  </label>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={
                      openingNote
                    }
                    onChange={(event) =>
                      setOpeningNote(
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional note..."
                    className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {
                      openingNote.length
                    }
                    /500
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    opening
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {opening ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Clock3
                      size={17}
                    />
                  )}

                  Open Shift
                </button>
              </div>
            </form>

            {/* INFORMATION */}

            <div className="space-y-3">
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <Store
                  size={22}
                  className="text-blue-600"
                />

                <h3 className="mt-4 font-black text-blue-900">
                  Terminal Assignment
                </h3>

                <p className="mt-2 text-xs leading-5 text-blue-700">
                  This POS browser keeps the
                  terminal ID locally so the
                  cashier does not need to
                  enter it every day.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <AlertCircle
                  size={22}
                  className="text-amber-600"
                />

                <h3 className="mt-4 font-black text-amber-900">
                  Before Opening
                </h3>

                <p className="mt-2 text-xs leading-5 text-amber-700">
                  The terminal must be active,
                  belong to your branch and
                  must not already be used by
                  another open shift.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            SHIFT HISTORY
        =========================================== */}

        <section>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Shift History
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Your previous cashier shifts.
              </p>
            </div>

            <select
              value={
                historyStatus
              }
              onChange={(event) =>
                handleHistoryStatus(
                  event.target.value
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 outline-none"
            >
              <option value="">
                ALL SHIFTS
              </option>

              <option value="OPEN">
                OPEN
              </option>

              <option value="CLOSED">
                CLOSED
              </option>
            </select>
          </div>

          {/* HISTORY SUMMARY */}

          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-400">
                Total Records
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {pagination.total}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-400">
                Closed on Page
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {
                  historyStats.closedCount
                }
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-600">
                Cash Sales on Page
              </p>

              <p className="mt-2 text-lg font-black text-emerald-700">
                {formatMoney(
                  historyStats.totalSales
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-400">
                Net Difference
              </p>

              <p
                className={`mt-2 text-lg font-black ${
                  historyStats.totalDifference <
                  0
                    ? "text-red-600"
                    : historyStats.totalDifference >
                      0
                    ? "text-emerald-600"
                    : "text-slate-900"
                }`}
              >
                {formatMoney(
                  historyStats.totalDifference
                )}
              </p>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {shifts.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center p-6 text-center">
                <div>
                  <CalendarClock
                    size={42}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-4 font-bold text-slate-700">
                    No shift history
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Shift records will
                    appear here.
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
                          Shift
                        </th>

                        <th className="px-5 py-4">
                          Terminal
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Opening
                        </th>

                        <th className="px-5 py-4">
                          Expected
                        </th>

                        <th className="px-5 py-4">
                          Closing
                        </th>

                        <th className="px-5 py-4">
                          Difference
                        </th>

                        <th className="px-5 py-4">
                          Opened
                        </th>

                        <th className="px-5 py-4 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {shifts.map(
                        (shift) => {
                          const difference =
                            Number(
                              shift.cashDifference ||
                                0
                            );

                          return (
                            <tr
                              key={
                                shift.id
                              }
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-5 py-4">
                                <p className="font-bold text-slate-800">
                                  {
                                    shift.shiftNumber
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatDuration(
                                    shift.openedAt,
                                    shift.closedAt
                                  )}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-bold text-slate-700">
                                  {shift
                                    ?.terminal
                                    ?.name ||
                                    "-"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {shift
                                    ?.terminal
                                    ?.code ||
                                    ""}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                                    shift.status
                                  )}`}
                                >
                                  {
                                    shift.status
                                  }
                                </span>
                              </td>

                              <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                {formatMoney(
                                  shift.openingCash
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                {formatMoney(
                                  shift.expectedCash
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                {shift.closingCash !==
                                null
                                  ? formatMoney(
                                      shift.closingCash
                                    )
                                  : "-"}
                              </td>

                              <td className="px-5 py-4">
                                {shift.status ===
                                "CLOSED" ? (
                                  <span
                                    className={`text-sm font-black ${
                                      difference <
                                      0
                                        ? "text-red-600"
                                        : difference >
                                          0
                                        ? "text-emerald-600"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {difference >
                                    0
                                      ? "+"
                                      : ""}
                                    {formatMoney(
                                      difference
                                    )}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-500">
                                {formatDateTime(
                                  shift.openedAt
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openShiftDetail(
                                        shift
                                      )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                                  >
                                    <Eye
                                      size={
                                        16
                                      }
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
                    {pagination.total} shifts
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
          CLOSE SHIFT MODAL
      =============================================== */}

      {closeOpen &&
        currentShift && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <form
              onSubmit={
                handleCloseShift
              }
              className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-slate-100 p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                    Close Cashier Shift
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      currentShift.shiftNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  disabled={
                    closing
                  }
                  onClick={
                    closeCloseModal
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 p-6">

                {/* CASH CALC */}

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Expected Drawer Cash
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {formatMoney(
                      expectedCash
                    )}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Opening
                      </span>

                      <span className="font-bold text-slate-700">
                        {formatMoney(
                          currentShift.openingCash
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Cash Sales
                      </span>

                      <span className="font-bold text-emerald-600">
                        +{" "}
                        {formatMoney(
                          currentShift.cashSales
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Cash In
                      </span>

                      <span className="font-bold text-blue-600">
                        +{" "}
                        {formatMoney(
                          currentShift.cashIn
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Refunds
                      </span>

                      <span className="font-bold text-orange-600">
                        -{" "}
                        {formatMoney(
                          currentShift.cashRefunds
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Cash Out
                      </span>

                      <span className="font-bold text-red-600">
                        -{" "}
                        {formatMoney(
                          currentShift.cashOut
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CLOSING CASH */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actual Closing Cash
                    </label>

                    <button
                      type="button"
                      onClick={
                        useExpectedCash
                      }
                      className="text-xs font-bold text-blue-600"
                    >
                      Use Expected
                    </button>
                  </div>

                  <div className="relative">
                    <Banknote
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        closingCash
                      }
                      onChange={(event) =>
                        setClosingCash(
                          event.target
                            .value
                        )
                      }
                      placeholder="Count actual cash..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white"
                    />
                  </div>
                </div>

                {/* DIFFERENCE */}

                {closingDifference !==
                  null && (
                  <div
                    className={`rounded-xl border p-4 ${
                      Math.abs(
                        closingDifference
                      ) < 0.0001
                        ? "border-emerald-200 bg-emerald-50"
                        : closingDifference >
                          0
                        ? "border-blue-200 bg-blue-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Cash Difference
                    </p>

                    <p
                      className={`mt-2 text-2xl font-black ${
                        Math.abs(
                          closingDifference
                        ) < 0.0001
                          ? "text-emerald-700"
                          : closingDifference >
                            0
                          ? "text-blue-700"
                          : "text-red-700"
                      }`}
                    >
                      {closingDifference >
                      0
                        ? "+"
                        : ""}
                      {formatMoney(
                        closingDifference
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {Math.abs(
                        closingDifference
                      ) < 0.0001
                        ? "Drawer cash matches expected cash."
                        : closingDifference >
                          0
                        ? "Cash drawer has an overage."
                        : "Cash drawer has a shortage."}
                    </p>
                  </div>
                )}

                {/* NOTE */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Closing Note
                    {closingDifference !==
                      null &&
                      Math.abs(
                        closingDifference
                      ) >
                        0.0001 && (
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      )}
                  </label>

                  <textarea
                    rows={4}
                    maxLength={500}
                    value={
                      closingNote
                    }
                    onChange={(event) =>
                      setClosingNote(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      closingDifference !==
                        null &&
                      Math.abs(
                        closingDifference
                      ) >
                        0.0001
                        ? "Explain cash difference..."
                        : "Optional closing note..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-400"
                  />

                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    {
                      closingNote.length
                    }
                    /500
                  </p>
                </div>

                {/* WARNING */}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-700">
                      After closing this
                      shift, you must open a
                      new shift before
                      creating another sale.
                    </p>
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={
                      closing
                    }
                    onClick={
                      closeCloseModal
                    }
                    className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
                  >
                    Keep Open
                  </button>

                  <button
                    type="submit"
                    disabled={
                      closing
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {closing ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <LockKeyhole
                        size={16}
                      />
                    )}

                    Close Shift
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      {/* ==============================================
          SHIFT DETAIL MODAL
      =============================================== */}

      {detailOpen &&
        selectedShift && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Shift Details
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {
                      selectedShift.shiftNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeShiftDetail
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex min-h-[400px] items-center justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-blue-600"
                  />
                </div>
              ) : (
                <div className="space-y-5 p-6">

                  {/* BASIC */}

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                          selectedShift.status
                        )}`}
                      >
                        {
                          selectedShift.status
                        }
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Terminal
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {selectedShift
                          ?.terminal
                          ?.name || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Opened
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedShift.openedAt
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Closed
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(
                          selectedShift.closedAt
                        )}
                      </p>
                    </div>
                  </div>

                  {/* CASH */}

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-black text-slate-900">
                      Cash Breakdown
                    </h3>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Opening Cash
                        </span>

                        <span className="font-bold text-slate-800">
                          {formatMoney(
                            selectedShift.openingCash
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Cash Sales
                        </span>

                        <span className="font-bold text-emerald-600">
                          +{" "}
                          {formatMoney(
                            selectedShift.cashSales
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Cash In
                        </span>

                        <span className="font-bold text-blue-600">
                          +{" "}
                          {formatMoney(
                            selectedShift.cashIn
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Cash Refunds
                        </span>

                        <span className="font-bold text-orange-600">
                          -{" "}
                          {formatMoney(
                            selectedShift.cashRefunds
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Cash Out
                        </span>

                        <span className="font-bold text-red-600">
                          -{" "}
                          {formatMoney(
                            selectedShift.cashOut
                          )}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-700">
                            Expected Cash
                          </span>

                          <span className="font-black text-slate-900">
                            {formatMoney(
                              selectedShift.expectedCash
                            )}
                          </span>
                        </div>
                      </div>

                      {selectedShift.status ===
                        "CLOSED" && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-700">
                              Closing Cash
                            </span>

                            <span className="font-black text-slate-900">
                              {formatMoney(
                                selectedShift.closingCash
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-bold text-slate-700">
                              Difference
                            </span>

                            <span
                              className={`font-black ${
                                Number(
                                  selectedShift.cashDifference ||
                                    0
                                ) < 0
                                  ? "text-red-600"
                                  : Number(
                                      selectedShift.cashDifference ||
                                        0
                                    ) > 0
                                  ? "text-emerald-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatMoney(
                                selectedShift.cashDifference
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* NOTES */}

                  {selectedShift.openingNote && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Opening Note
                      </p>

                      <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                        {
                          selectedShift.openingNote
                        }
                      </p>
                    </div>
                  )}

                  {selectedShift.closingNote && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Closing Note
                      </p>

                      <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                        {
                          selectedShift.closingNote
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default ShiftManagement;