import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Clock3,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Monitor,
  CalendarDays,
  Banknote,
  ShoppingCart,
  ReceiptText,
  CircleCheck,
  CircleDot,
  WalletCards,
  Hash,
  ArrowRight,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// SHIFT STATUSES
// ======================================================

const SHIFT_STATUSES = [
  "OPEN",
  "CLOSED",
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
    "en-LK"
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

const getStatusStyle = (
  status
) => {
  switch (status) {
    case "OPEN":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

// ======================================================
// SHIFTS PAGE
// ======================================================

const Shifts = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    shifts,
    setShifts,
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

  // ====================================================
  // MESSAGE
  // ====================================================

  const [
    error,
    setError,
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

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("");

  const [
    terminalFilter,
    setTerminalFilter,
  ] = useState("");

  const [
    cashierFilter,
    setCashierFilter,
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
    selectedShift,
    setSelectedShift,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  // ====================================================
  // FETCH SHIFTS
  //
  // GET /shifts
  //
  // Backend filters:
  // status
  // branchId
  // terminalId
  // cashierId
  // page
  // limit
  // ====================================================

  const fetchShifts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit,
        };

        if (statusFilter) {
          params.status =
            statusFilter;
        }

        if (branchFilter) {
          params.branchId =
            branchFilter;
        }

        if (terminalFilter) {
          params.terminalId =
            terminalFilter;
        }

        if (cashierFilter) {
          params.cashierId =
            cashierFilter;
        }

        const response =
          await api.get(
            "/shifts",
            {
              params,
            }
          );

        console.log(
          "Manager Shifts:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.shifts ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeShifts =
          Array.isArray(data)
            ? data
            : [];

        setShifts(
          safeShifts
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
              safeShifts.length
          );

        const safeTotal =
          Number.isFinite(
            responseTotal
          )
            ? responseTotal
            : safeShifts.length;

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
          "Shift load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load shifts."
        );

        setShifts([]);
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
    fetchShifts();
  }, [
    page,
    limit,
    statusFilter,
    branchFilter,
    terminalFilter,
    cashierFilter,
  ]);

  // ====================================================
  // SHIFT NUMBER
  // ====================================================

  const getShiftNumber = (
    shift
  ) => {
    return (
      shift?.shiftNumber ??
      shift?.number ??
      shift?.code ??
      shift?.id ??
      "—"
    );
  };

  // ====================================================
  // CASHIER
  // ====================================================

  const getCashier = (
    shift
  ) => {
    return (
      shift?.cashier ??
      shift?.user ??
      shift?.openedBy ??
      null
    );
  };

  // ====================================================
  // CASHIER ID
  // ====================================================

  const getCashierId = (
    shift
  ) => {
    return (
      shift?.cashierId ??
      getCashier(shift)?.id ??
      null
    );
  };

  // ====================================================
  // CASHIER NAME
  // ====================================================

  const getCashierName = (
    shift
  ) => {
    const cashier =
      getCashier(shift);

    if (!cashier) {
      return (
        shift?.cashierName ??
        "—"
      );
    }

    if (
      typeof cashier ===
      "string"
    ) {
      return cashier;
    }

    const fullName = [
      cashier.firstName,
      cashier.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      cashier.name ||
      cashier.employeeId ||
      cashier.email ||
      "—"
    );
  };

  // ====================================================
  // CASHIER EMAIL
  // ====================================================

  const getCashierEmail = (
    shift
  ) => {
    const cashier =
      getCashier(shift);

    return (
      cashier?.email ??
      shift?.cashierEmail ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    shift
  ) => {
    return (
      shift?.branch ??
      shift?.terminal?.branch ??
      null
    );
  };

  // ====================================================
  // BRANCH ID
  // ====================================================

  const getBranchId = (
    shift
  ) => {
    return (
      shift?.branchId ??
      getBranch(shift)?.id ??
      shift?.terminal
        ?.branchId ??
      null
    );
  };

  // ====================================================
  // BRANCH NAME
  // ====================================================

  const getBranchName = (
    shift
  ) => {
    const branch =
      getBranch(shift);

    return (
      branch?.name ??
      branch?.code ??
      shift?.branchName ??
      "—"
    );
  };

  // ====================================================
  // TERMINAL
  // ====================================================

  const getTerminal = (
    shift
  ) => {
    return (
      shift?.terminal ??
      null
    );
  };

  // ====================================================
  // TERMINAL ID
  // ====================================================

  const getTerminalId = (
    shift
  ) => {
    return (
      shift?.terminalId ??
      getTerminal(shift)?.id ??
      null
    );
  };

  // ====================================================
  // TERMINAL NAME
  // ====================================================

  const getTerminalName = (
    shift
  ) => {
    const terminal =
      getTerminal(shift);

    return (
      terminal?.name ??
      terminal?.code ??
      terminal
        ?.terminalCode ??
      shift?.terminalName ??
      "—"
    );
  };

  // ====================================================
  // OPENING CASH
  // ====================================================

  const getOpeningCash = (
    shift
  ) => {
    return Number(
      shift?.openingCash ??
        shift?.openingAmount ??
        shift?.startingCash ??
        0
    );
  };

  // ====================================================
  // CLOSING CASH
  // ====================================================

  const getClosingCash = (
    shift
  ) => {
    return Number(
      shift?.closingCash ??
        shift?.closingAmount ??
        shift?.actualCash ??
        0
    );
  };

  // ====================================================
  // EXPECTED CASH
  // ====================================================

  const getExpectedCash = (
    shift
  ) => {
    return Number(
      shift?.expectedCash ??
        shift?.expectedAmount ??
        shift?.systemCash ??
        0
    );
  };

  // ====================================================
  // CASH DIFFERENCE
  // ====================================================

  const getCashDifference = (
    shift
  ) => {
    const direct =
      shift?.cashDifference ??
      shift?.difference ??
      shift?.variance;

    if (
      direct !== undefined &&
      direct !== null
    ) {
      return (
        Number(direct) || 0
      );
    }

    if (
      shift?.status ===
      "CLOSED"
    ) {
      return (
        getClosingCash(shift) -
        getExpectedCash(shift)
      );
    }

    return 0;
  };

  // ====================================================
  // TOTAL SALES
  // ====================================================

  const getSalesCount = (
    shift
  ) => {
    return (
      Number(
        shift?.totalSales ??
          shift?.salesCount ??
          shift?._count
            ?.sales ??
          0
      ) || 0
    );
  };

  // ====================================================
  // SALES AMOUNT
  // ====================================================

  const getSalesAmount = (
    shift
  ) => {
    return (
      Number(
        shift
          ?.totalSalesAmount ??
          shift?.salesAmount ??
          shift?.totalAmount ??
          shift?.netSales ??
          0
      ) || 0
    );
  };

  // ====================================================
  // CASH SALES
  // ====================================================

  const getCashSales = (
    shift
  ) => {
    return (
      Number(
        shift
          ?.cashSalesAmount ??
          shift?.cashSales ??
          0
      ) || 0
    );
  };

  // ====================================================
  // CARD SALES
  // ====================================================

  const getCardSales = (
    shift
  ) => {
    return (
      Number(
        shift
          ?.cardSalesAmount ??
          shift?.cardSales ??
          0
      ) || 0
    );
  };

  // ====================================================
  // CASH IN
  // ====================================================

  const getCashIn = (
    shift
  ) => {
    return (
      Number(
        shift
          ?.cashInAmount ??
          shift?.totalCashIn ??
          shift?.cashIn ??
          0
      ) || 0
    );
  };

  // ====================================================
  // CASH OUT
  // ====================================================

  const getCashOut = (
    shift
  ) => {
    return (
      Number(
        shift
          ?.cashOutAmount ??
          shift?.totalCashOut ??
          shift?.cashOut ??
          0
      ) || 0
    );
  };

  // ====================================================
  // DURATION
  // ====================================================

  const getDuration = (
    shift
  ) => {
    const start =
      shift?.openedAt ??
      shift?.startedAt ??
      shift?.startAt ??
      shift?.createdAt;

    const end =
      shift?.closedAt ??
      shift?.endedAt ??
      shift?.endAt;

    if (!start) {
      return "—";
    }

    const startDate =
      new Date(start);

    const endDate =
      end
        ? new Date(end)
        : new Date();

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return "—";
    }

    let diff =
      Math.max(
        0,
        endDate.getTime() -
          startDate.getTime()
      );

    const hours =
      Math.floor(
        diff /
          (1000 *
            60 *
            60)
      );

    diff -=
      hours *
      1000 *
      60 *
      60;

    const minutes =
      Math.floor(
        diff /
          (1000 * 60)
      );

    if (hours === 0) {
      return `${minutes} min`;
    }

    return `${hours}h ${minutes}m`;
  };

  // ====================================================
  // OPTIONS
  //
  // Build from current loaded data.
  // No admin-only branch/user management API required.
  // ====================================================

  const branchOptions =
    useMemo(() => {
      const map =
        new Map();

      shifts.forEach(
        (shift) => {
          const id =
            getBranchId(shift);

          if (!id) {
            return;
          }

          map.set(id, {
            id,
            name:
              getBranchName(
                shift
              ),
          });
        }
      );

      return Array.from(
        map.values()
      );
    }, [shifts]);

  const terminalOptions =
    useMemo(() => {
      const map =
        new Map();

      shifts.forEach(
        (shift) => {
          const id =
            getTerminalId(
              shift
            );

          if (!id) {
            return;
          }

          map.set(id, {
            id,
            name:
              getTerminalName(
                shift
              ),
          });
        }
      );

      return Array.from(
        map.values()
      );
    }, [shifts]);

  const cashierOptions =
    useMemo(() => {
      const map =
        new Map();

      shifts.forEach(
        (shift) => {
          const id =
            getCashierId(
              shift
            );

          if (!id) {
            return;
          }

          map.set(id, {
            id,
            name:
              getCashierName(
                shift
              ),
          });
        }
      );

      return Array.from(
        map.values()
      );
    }, [shifts]);

  // ====================================================
  // LOCAL SEARCH
  //
  // Shift backend does not use general search.
  // ====================================================

  const filteredShifts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return shifts;
      }

      return shifts.filter(
        (shift) => {
          const values = [
            getShiftNumber(
              shift
            ),
            getCashierName(
              shift
            ),
            getCashierEmail(
              shift
            ),
            getBranchName(
              shift
            ),
            getTerminalName(
              shift
            ),
            shift?.status,
            shift?.id,
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
      shifts,
      search,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const openCount =
    shifts.filter(
      (shift) =>
        shift.status ===
        "OPEN"
    ).length;

  const closedCount =
    shifts.filter(
      (shift) =>
        shift.status ===
        "CLOSED"
    ).length;

  const pageSalesCount =
    shifts.reduce(
      (sum, shift) =>
        sum +
        getSalesCount(
          shift
        ),
      0
    );

  const pageSalesAmount =
    shifts.reduce(
      (sum, shift) =>
        sum +
        getSalesAmount(
          shift
        ),
      0
    );

  // ====================================================
  // RESET
  // ====================================================

  const resetFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      setBranchFilter("");
      setTerminalFilter("");
      setCashierFilter("");
      setPage(1);
    };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /shifts/:id
  // ====================================================

  const openDetails =
    async (shift) => {
      try {
        setSelectedShift(
          shift
        );

        setDetailsOpen(
          true
        );

        setDetailLoading(
          true
        );

        setError("");

        const response =
          await api.get(
            `/shifts/${shift.id}`
          );

        console.log(
          "Manager Shift Detail:",
          response.data
        );

        const detailed =
          response.data?.data
            ?.shift ??
          response.data?.data ??
          shift;

        setSelectedShift(
          detailed
        );
      } catch (err) {
        console.error(
          "Shift detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load shift details."
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
      setSelectedShift(null);
    };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

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
              Shifts
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor cashier shifts,
              terminals, sales and cash
              reconciliation.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchShifts
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
                  Total Shifts
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <Clock3
                  size={22}
                />
              </div>
            </div>
          </div>

          {/* OPEN */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Open Shifts
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {openCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <CircleDot
                size={23}
                className="text-emerald-500"
              />
            </div>
          </div>

          {/* CLOSED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Closed Shifts
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-600">
                  {closedCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <CircleCheck
                size={23}
                className="text-slate-500"
              />
            </div>
          </div>

          {/* SALES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Transactions
                </p>

                <p className="mt-2 text-2xl font-bold text-purple-600">

                  {formatNumber(
                    pageSalesCount
                  )}

                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <ShoppingCart
                size={23}
                className="text-purple-500"
              />
            </div>
          </div>

          {/* SALES VALUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Sales Value
            </p>

            <p className="mt-2 text-xl font-bold text-blue-600">

              {formatMoney(
                pageSalesAmount
              )}

            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current page
            </p>
          </div>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="space-y-3 border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr]">

              {/* SEARCH */}

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
                  placeholder="Search shift, cashier, branch or terminal..."
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

                {SHIFT_STATUSES.map(
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
                  All Branches
                </option>

                {branchOptions.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              {/* TERMINAL */}

              <select
                value={
                  terminalFilter
                }
                onChange={(event) => {
                  setTerminalFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
              >

                <option value="">
                  All Terminals
                </option>

                {terminalOptions.map(
                  (terminal) => (
                    <option
                      key={
                        terminal.id
                      }
                      value={
                        terminal.id
                      }
                    >
                      {terminal.name}
                    </option>
                  )
                )}
              </select>

              {/* CASHIER */}

              <select
                value={
                  cashierFilter
                }
                onChange={(event) => {
                  setCashierFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
              >

                <option value="">
                  All Cashiers
                </option>

                {cashierOptions.map(
                  (cashier) => (
                    <option
                      key={
                        cashier.id
                      }
                      value={
                        cashier.id
                      }
                    >
                      {cashier.name}
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
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >

                <RotateCcw
                  size={16}
                />

                Reset Filters
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
                  Loading shifts...
                </p>
              </div>
            </div>
          ) : filteredShifts.length ===
            0 ? (
            /* =================================================
                EMPTY
            ================================================= */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <Clock3
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No shifts found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Cashier shift history
                  will appear here.
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
                      Shift
                    </th>

                    <th className="px-5 py-4">
                      Cashier
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Terminal
                    </th>

                    <th className="px-5 py-4">
                      Opened
                    </th>

                    <th className="px-5 py-4">
                      Closed
                    </th>

                    <th className="px-5 py-4">
                      Duration
                    </th>

                    <th className="px-5 py-4">
                      Opening Cash
                    </th>

                    <th className="px-5 py-4">
                      Sales
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

                  {filteredShifts.map(
                    (shift) => (
                      <tr
                        key={shift.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* SHIFT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                              <Clock3
                                size={18}
                              />
                            </div>

                            <div>

                              <p className="max-w-48 truncate text-sm font-bold text-blue-600">

                                {getShiftNumber(
                                  shift
                                )}

                              </p>

                              <p className="mt-1 max-w-44 truncate font-mono text-xs text-slate-400">

                                {shift.id}

                              </p>
                            </div>
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

                            <span className="max-w-44 truncate text-sm font-semibold text-slate-700">

                              {getCashierName(
                                shift
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
                                shift
                              )}

                            </span>
                          </div>
                        </td>

                        {/* TERMINAL */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <Monitor
                              size={15}
                              className="text-slate-400"
                            />

                            <span className="whitespace-nowrap text-sm text-slate-600">

                              {getTerminalName(
                                shift
                              )}

                            </span>
                          </div>
                        </td>

                        {/* OPENED */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                          {formatDateTime(
                            shift.openedAt ??
                              shift.startedAt ??
                              shift.startAt ??
                              shift.createdAt
                          )}

                        </td>

                        {/* CLOSED */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                          {shift.status ===
                          "OPEN"
                            ? "Still Open"
                            : formatDateTime(
                                shift.closedAt ??
                                  shift.endedAt ??
                                  shift.endAt
                              )}

                        </td>

                        {/* DURATION */}

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">

                          {getDuration(
                            shift
                          )}

                        </td>

                        {/* OPENING CASH */}

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">

                          {formatMoney(
                            getOpeningCash(
                              shift
                            )
                          )}

                        </td>

                        {/* SALES */}

                        <td className="px-5 py-4">

                          <p className="font-bold text-emerald-600">

                            {formatMoney(
                              getSalesAmount(
                                shift
                              )
                            )}

                          </p>

                          <p className="mt-1 text-xs text-slate-400">

                            {getSalesCount(
                              shift
                            )}{" "}
                            transactions

                          </p>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                              shift.status
                            )}`}
                          >

                            {displayText(
                              shift.status
                            )}

                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end">

                            <button
                              type="button"
                              title="View shift"
                              onClick={() =>
                                openDetails(
                                  shift
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
            shifts.length > 0 && (
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
                    ({total} shifts)
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
          DETAIL MODAL
      ================================================= */}

      {detailsOpen &&
        selectedShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Shift Details
                  </h2>

                  <p className="mt-1 font-semibold text-blue-600">

                    {getShiftNumber(
                      selectedShift
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
                <div className="space-y-6 p-6">

                  {/* =======================================
                      TOP
                  ======================================== */}

                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          selectedShift.status ===
                          "OPEN"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >

                        <Clock3
                          size={23}
                        />
                      </div>

                      <div>

                        <p className="text-lg font-bold text-slate-900">

                          {getShiftNumber(
                            selectedShift
                          )}

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                          {getDuration(
                            selectedShift
                          )}

                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        selectedShift.status
                      )}`}
                    >

                      {displayText(
                        selectedShift.status
                      )}

                    </span>
                  </div>

                  {/* =======================================
                      CASHIER / LOCATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Shift Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                      {/* CASHIER */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Cashier
                        </p>

                        <div className="mt-3 flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                            <User
                              size={16}
                            />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-800">

                              {getCashierName(
                                selectedShift
                              )}

                            </p>

                            <p className="mt-1 truncate text-xs text-slate-400">

                              {getCashierEmail(
                                selectedShift
                              )}

                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BRANCH */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Branch
                        </p>

                        <div className="mt-3 flex items-center gap-2">

                          <Building2
                            size={17}
                            className="text-blue-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {getBranchName(
                              selectedShift
                            )}

                          </p>
                        </div>
                      </div>

                      {/* TERMINAL */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Terminal
                        </p>

                        <div className="mt-3 flex items-center gap-2">

                          <Monitor
                            size={17}
                            className="text-emerald-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {getTerminalName(
                              selectedShift
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      TIME LINE
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Shift Timeline
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">

                      {/* OPEN */}

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                        <p className="text-xs font-semibold uppercase text-emerald-500">
                          Opened
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CalendarDays
                            size={16}
                            className="text-emerald-600"
                          />

                          <p className="text-sm font-semibold text-emerald-700">

                            {formatDateTime(
                              selectedShift.openedAt ??
                                selectedShift.startedAt ??
                                selectedShift.startAt ??
                                selectedShift.createdAt
                            )}

                          </p>
                        </div>
                      </div>

                      <div className="hidden items-center justify-center sm:flex">

                        <ArrowRight
                          size={22}
                          className="text-slate-300"
                        />
                      </div>

                      {/* CLOSE */}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Closed
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CalendarDays
                            size={16}
                            className="text-slate-500"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {selectedShift.status ===
                            "OPEN"
                              ? "Shift is still open"
                              : formatDateTime(
                                  selectedShift.closedAt ??
                                    selectedShift.endedAt ??
                                    selectedShift.endAt
                                )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      SALES SUMMARY
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Sales Summary
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      {/* TRANSACTIONS */}

                      <div className="rounded-xl bg-blue-50 p-4">

                        <p className="text-xs font-semibold uppercase text-blue-500">
                          Transactions
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <ShoppingCart
                            size={17}
                            className="text-blue-600"
                          />

                          <p className="text-xl font-bold text-blue-700">

                            {formatNumber(
                              getSalesCount(
                                selectedShift
                              )
                            )}

                          </p>
                        </div>
                      </div>

                      {/* SALES VALUE */}

                      <div className="rounded-xl bg-emerald-50 p-4">

                        <p className="text-xs font-semibold uppercase text-emerald-500">
                          Total Sales
                        </p>

                        <p className="mt-2 text-xl font-bold text-emerald-700">

                          {formatMoney(
                            getSalesAmount(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>

                      {/* CASH SALES */}

                      <div className="rounded-xl bg-purple-50 p-4">

                        <p className="text-xs font-semibold uppercase text-purple-500">
                          Cash Sales
                        </p>

                        <p className="mt-2 font-bold text-purple-700">

                          {formatMoney(
                            getCashSales(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>

                      {/* CARD */}

                      <div className="rounded-xl bg-amber-50 p-4">

                        <p className="text-xs font-semibold uppercase text-amber-500">
                          Card / Other
                        </p>

                        <p className="mt-2 font-bold text-amber-700">

                          {formatMoney(
                            getCardSales(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      CASH RECONCILIATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Cash Reconciliation
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                      {/* OPENING */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Opening Cash
                        </p>

                        <p className="mt-2 font-bold text-slate-800">

                          {formatMoney(
                            getOpeningCash(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>

                      {/* CASH IN */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Cash In
                        </p>

                        <p className="mt-2 font-bold text-emerald-600">

                          +{" "}
                          {formatMoney(
                            getCashIn(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>

                      {/* CASH OUT */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs uppercase text-slate-400">
                          Cash Out
                        </p>

                        <p className="mt-2 font-bold text-red-600">

                          -{" "}
                          {formatMoney(
                            getCashOut(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>

                      {/* EXPECTED */}

                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                        <p className="text-xs font-semibold uppercase text-blue-500">
                          Expected Cash
                        </p>

                        <p className="mt-2 font-bold text-blue-700">

                          {formatMoney(
                            getExpectedCash(
                              selectedShift
                            )
                          )}

                        </p>
                      </div>

                      {/* CLOSING */}

                      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">

                        <p className="text-xs font-semibold uppercase text-purple-500">
                          Closing Cash
                        </p>

                        <p className="mt-2 font-bold text-purple-700">

                          {selectedShift.status ===
                          "CLOSED"
                            ? formatMoney(
                                getClosingCash(
                                  selectedShift
                                )
                              )
                            : "—"}

                        </p>
                      </div>

                      {/* DIFFERENCE */}

                      <div
                        className={`rounded-xl border p-4 ${
                          getCashDifference(
                            selectedShift
                          ) === 0
                            ? "border-emerald-200 bg-emerald-50"
                            : getCashDifference(
                                selectedShift
                              ) > 0
                            ? "border-blue-200 bg-blue-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >

                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Cash Difference
                        </p>

                        <p
                          className={`mt-2 font-bold ${
                            getCashDifference(
                              selectedShift
                            ) === 0
                              ? "text-emerald-700"
                              : getCashDifference(
                                  selectedShift
                                ) > 0
                              ? "text-blue-700"
                              : "text-red-700"
                          }`}
                        >

                          {selectedShift.status ===
                          "CLOSED"
                            ? formatMoney(
                                getCashDifference(
                                  selectedShift
                                )
                              )
                            : "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      NOTES
                  ======================================== */}

                  {(selectedShift
                    ?.openingNote ||
                    selectedShift
                      ?.closingNote ||
                    selectedShift
                      ?.note) && (
                    <div className="rounded-xl border border-slate-200 p-5">

                      <h3 className="font-bold text-slate-900">
                        Shift Notes
                      </h3>

                      {selectedShift
                        ?.openingNote && (
                        <div className="mt-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Opening Note
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                            {
                              selectedShift.openingNote
                            }

                          </p>
                        </div>
                      )}

                      {selectedShift
                        ?.closingNote && (
                        <div className="mt-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Closing Note
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                            {
                              selectedShift.closingNote
                            }

                          </p>
                        </div>
                      )}

                      {!selectedShift
                        ?.openingNote &&
                        !selectedShift
                          ?.closingNote &&
                        selectedShift
                          ?.note && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                            {
                              selectedShift.note
                            }

                          </p>
                        )}
                    </div>
                  )}

                  {/* =======================================
                      IDS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* SHIFT */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Shift ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {selectedShift.id ??
                          "—"}

                      </p>
                    </div>

                    {/* TERMINAL */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Terminal ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {getTerminalId(
                          selectedShift
                        ) ??
                          "—"}

                      </p>
                    </div>

                    {/* CASHIER */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Cashier ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {getCashierId(
                          selectedShift
                        ) ??
                          "—"}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      INFO
                  ======================================== */}

                  {selectedShift.status ===
                    "OPEN" && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex gap-3">

                        <Clock3
                          size={20}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        <div>

                          <p className="font-semibold text-emerald-700">
                            Active Shift
                          </p>

                          <p className="mt-1 text-sm leading-6 text-emerald-600">
                            This shift is
                            currently open.
                            Shift closing is
                            handled by the
                            Cashier workflow.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedShift.status ===
                    "CLOSED" && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                      <div className="flex gap-3">

                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-slate-600"
                        />

                        <div>

                          <p className="font-semibold text-slate-700">
                            Shift Closed
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            This shift has
                            been completed
                            and reconciled.
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
    </>
  );
};

export default Shifts;