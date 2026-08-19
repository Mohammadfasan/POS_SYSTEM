import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  WalletCards,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Monitor,
  Banknote,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
  CircleCheck,
  CircleOff,
  Wrench,
  ReceiptText,
  User,
  CalendarDays,
  Hash,
  FileText,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// DRAWER STATUSES
// ======================================================

const DRAWER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
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

// ======================================================
// DATE
// ======================================================

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

// ======================================================
// DISPLAY TEXT
// ======================================================

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
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "INACTIVE":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "MAINTENANCE":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

// ======================================================
// TRANSACTION TYPE STYLE
// ======================================================

const getTransactionStyle = (
  type
) => {
  const value =
    String(
      type ?? ""
    ).toUpperCase();

  if (
    value.includes("IN") ||
    value.includes("OPEN")
  ) {
    return {
      className:
        "bg-emerald-50 text-emerald-700",

      Icon:
        ArrowDownToLine,
    };
  }

  if (
    value.includes("OUT") ||
    value.includes("REFUND") ||
    value.includes("CLOSE")
  ) {
    return {
      className:
        "bg-red-50 text-red-600",

      Icon:
        ArrowUpFromLine,
    };
  }

  return {
    className:
      "bg-blue-50 text-blue-700",

    Icon:
      Banknote,
  };
};

// ======================================================
// CASH DRAWERS PAGE
// ======================================================

const CashDrawers = () => {
  // ====================================================
  // DRAWERS
  // ====================================================

  const [
    drawers,
    setDrawers,
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
    transactionLoading,
    setTransactionLoading,
  ] = useState(false);

  // ====================================================
  // ERROR
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
  // DETAIL
  // ====================================================

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

  const [
    selectedDrawer,
    setSelectedDrawer,
  ] = useState(null);

  // ====================================================
  // TRANSACTIONS
  // ====================================================

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    transactionPage,
    setTransactionPage,
  ] = useState(1);

  const [
    transactionLimit,
    setTransactionLimit,
  ] = useState(10);

  const [
    transactionTotal,
    setTransactionTotal,
  ] = useState(0);

  const [
    transactionTotalPages,
    setTransactionTotalPages,
  ] = useState(1);

  // ====================================================
  // FETCH DRAWERS
  //
  // GET /cash-drawers
  //
  // Backend list supports:
  // status
  // ====================================================

  const fetchDrawers =
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
            "/cash-drawers",
            {
              params,
            }
          );

        console.log(
          "Manager Cash Drawers:",
          response.data
        );

        const result =
          response.data?.data;

        const data =
          result?.cashDrawers ??
          result?.drawers ??
          result?.items ??
          result?.rows ??
          (Array.isArray(result)
            ? result
            : []);

        setDrawers(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Cash drawer load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load cash drawers."
        );

        setDrawers([]);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // LOAD
  // ====================================================

  useEffect(() => {
    fetchDrawers();
  }, [statusFilter]);

  // ====================================================
  // TERMINAL
  // ====================================================

  const getTerminal = (
    drawer
  ) => {
    return (
      drawer?.terminal ??
      null
    );
  };

  // ====================================================
  // TERMINAL NAME
  // ====================================================

  const getTerminalName = (
    drawer
  ) => {
    const terminal =
      getTerminal(drawer);

    return (
      terminal?.name ??
      terminal?.code ??
      terminal
        ?.terminalCode ??
      drawer?.terminalName ??
      "—"
    );
  };

  // ====================================================
  // TERMINAL ID
  // ====================================================

  const getTerminalId = (
    drawer
  ) => {
    return (
      drawer?.terminalId ??
      getTerminal(drawer)?.id ??
      null
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    drawer
  ) => {
    return (
      drawer?.branch ??
      drawer?.terminal
        ?.branch ??
      null
    );
  };

  // ====================================================
  // BRANCH NAME
  // ====================================================

  const getBranchName = (
    drawer
  ) => {
    const branch =
      getBranch(drawer);

    return (
      branch?.name ??
      branch?.code ??
      drawer?.branchName ??
      "—"
    );
  };

  // ====================================================
  // CURRENT BALANCE
  // ====================================================

  const getCurrentBalance = (
    drawer
  ) => {
    const value =
      drawer?.currentBalance ??
      drawer?.balance ??
      drawer?.cashBalance ??
      drawer?.currentCash ??
      drawer?.amount ??
      0;

    return (
      Number(value) || 0
    );
  };

  // ====================================================
  // OPENING BALANCE
  // ====================================================

  const getOpeningBalance = (
    drawer
  ) => {
    const value =
      drawer?.openingBalance ??
      drawer?.openingCash ??
      drawer?.startingBalance ??
      0;

    return (
      Number(value) || 0
    );
  };

  // ====================================================
  // CASH IN
  // ====================================================

  const getCashInTotal = (
    drawer
  ) => {
    const value =
      drawer?.cashInTotal ??
      drawer?.totalCashIn ??
      drawer?.cashIn ??
      0;

    return (
      Number(value) || 0
    );
  };

  // ====================================================
  // CASH OUT
  // ====================================================

  const getCashOutTotal = (
    drawer
  ) => {
    const value =
      drawer?.cashOutTotal ??
      drawer?.totalCashOut ??
      drawer?.cashOut ??
      0;

    return (
      Number(value) || 0
    );
  };

  // ====================================================
  // ACTIVE SHIFT
  // ====================================================

  const getActiveShift = (
    drawer
  ) => {
    return (
      drawer?.activeShift ??
      drawer?.shift ??
      drawer?.currentShift ??
      null
    );
  };

  // ====================================================
  // SHIFT NUMBER
  // ====================================================

  const getShiftNumber = (
    drawer
  ) => {
    const shift =
      getActiveShift(
        drawer
      );

    if (!shift) {
      return "No Active Shift";
    }

    return (
      shift?.shiftNumber ??
      shift?.number ??
      shift?.id ??
      "Active Shift"
    );
  };

  // ====================================================
  // CASHIER
  // ====================================================

  const getCashierName = (
    drawer
  ) => {
    const shift =
      getActiveShift(
        drawer
      );

    const user =
      shift?.cashier ??
      shift?.user ??
      drawer?.cashier ??
      null;

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
  // DRAWER CODE
  // ====================================================

  const getDrawerCode = (
    drawer
  ) => {
    return (
      drawer?.code ??
      drawer?.drawerCode ??
      drawer?.id ??
      "—"
    );
  };

  // ====================================================
  // SEARCH FILTER
  //
  // Backend does not support general search.
  // ====================================================

  const filteredDrawers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return drawers;
      }

      return drawers.filter(
        (drawer) => {
          const values = [
            drawer?.name,
            drawer?.code,
            drawer?.status,
            getTerminalName(
              drawer
            ),
            getBranchName(
              drawer
            ),
            getCashierName(
              drawer
            ),
            drawer?.id,
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
      drawers,
      search,
    ]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const total =
    filteredDrawers.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / limit
      )
    );

  const paginatedDrawers =
    useMemo(() => {
      const start =
        (page - 1) *
        limit;

      return filteredDrawers.slice(
        start,
        start + limit
      );
    }, [
      filteredDrawers,
      page,
      limit,
    ]);

  useEffect(() => {
    if (
      page >
      totalPages
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

  const activeCount =
    drawers.filter(
      (drawer) =>
        drawer.status ===
        "ACTIVE"
    ).length;

  const inactiveCount =
    drawers.filter(
      (drawer) =>
        drawer.status ===
        "INACTIVE"
    ).length;

  const maintenanceCount =
    drawers.filter(
      (drawer) =>
        drawer.status ===
        "MAINTENANCE"
    ).length;

  const totalCashBalance =
    drawers.reduce(
      (sum, drawer) =>
        sum +
        getCurrentBalance(
          drawer
        ),
      0
    );

  // ====================================================
  // FETCH TRANSACTIONS
  //
  // GET /cash-drawers/:id/transactions
  // ====================================================

  const fetchTransactions =
    async (
      drawerId,
      targetPage = 1,
      targetLimit =
        transactionLimit
    ) => {
      try {
        setTransactionLoading(
          true
        );

        const response =
          await api.get(
            `/cash-drawers/${drawerId}/transactions`,
            {
              params: {
                page: targetPage,
                limit: targetLimit,
              },
            }
          );

        console.log(
          "Cash Drawer Transactions:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.transactions ??
          result.cashTransactions ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeData =
          Array.isArray(data)
            ? data
            : [];

        setTransactions(
          safeData
        );

        const pagination =
          result.pagination ??
          {};

        const responseTotal =
          Number(
            pagination.total ??
              result.total ??
              result.count ??
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
              targetLimit
          );

        const rawPages =
          pagination.totalPages ??
          result.totalPages ??
          calculatedPages;

        setTransactionTotal(
          safeTotal
        );

        setTransactionTotalPages(
          Math.max(
            1,
            Number(
              rawPages
            ) || 1
          )
        );

        setTransactionPage(
          targetPage
        );
      } catch (err) {
        console.error(
          "Cash drawer transactions error:",
          err.response?.data ||
            err.message
        );

        setTransactions([]);
        setTransactionTotal(0);
        setTransactionTotalPages(1);
      } finally {
        setTransactionLoading(
          false
        );
      }
    };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /cash-drawers/:id
  // GET /cash-drawers/:id/transactions
  // ====================================================

  const openDetails =
    async (drawer) => {
      try {
        setSelectedDrawer(
          drawer
        );

        setDetailsOpen(
          true
        );

        setDetailLoading(
          true
        );

        setError("");

        setTransactions([]);
        setTransactionPage(1);
        setTransactionTotal(0);
        setTransactionTotalPages(1);

        const drawerResult =
          await api.get(
            `/cash-drawers/${drawer.id}`
          );

        const detailed =
          drawerResult.data
            ?.data
            ?.cashDrawer ??
          drawerResult.data
            ?.data
            ?.drawer ??
          drawerResult.data
            ?.data ??
          drawer;

        setSelectedDrawer(
          detailed
        );

        await fetchTransactions(
          drawer.id,
          1,
          transactionLimit
        );
      } catch (err) {
        console.error(
          "Cash drawer detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load cash drawer details."
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

      setSelectedDrawer(
        null
      );

      setTransactions([]);

      setTransactionPage(1);

      setTransactionTotal(0);

      setTransactionTotalPages(
        1
      );
    };

  // ====================================================
  // TRANSACTION AMOUNT
  // ====================================================

  const getTransactionAmount = (
    transaction
  ) => {
    return (
      Number(
        transaction?.amount ??
          transaction
            ?.transactionAmount ??
          0
      ) || 0
    );
  };

  // ====================================================
  // TRANSACTION USER
  // ====================================================

  const getTransactionUser = (
    transaction
  ) => {
    const user =
      transaction?.user ??
      transaction
        ?.createdBy ??
      transaction
        ?.performedBy ??
      transaction?.cashier ??
      null;

    if (!user) {
      return (
        transaction
          ?.performedByName ??
        transaction
          ?.createdByName ??
        "System"
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
      "System"
    );
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
              Cash Drawers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor POS cash
              drawers, terminals and
              transaction history.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={
              fetchDrawers
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
                  Cash Drawers
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {drawers.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <WalletCards
                  size={22}
                />
              </div>
            </div>
          </div>

          {/* BALANCE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Current Cash
            </p>

            <p className="mt-2 text-xl font-bold text-blue-600">

              {formatMoney(
                totalCashBalance
              )}

            </p>
          </div>

          {/* ACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {activeCount}
                </p>
              </div>

              <CircleCheck
                size={23}
                className="text-emerald-500"
              />
            </div>
          </div>

          {/* INACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Inactive
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-600">
                  {inactiveCount}
                </p>
              </div>

              <CircleOff
                size={23}
                className="text-slate-500"
              />
            </div>
          </div>

          {/* MAINTENANCE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Maintenance
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {
                    maintenanceCount
                  }
                </p>
              </div>

              <Wrench
                size={23}
                className="text-amber-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTERS
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
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="Search drawer, terminal, branch or cashier..."
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

                {DRAWER_STATUSES.map(
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
                  Loading cash
                  drawers...
                </p>
              </div>
            </div>
          ) : paginatedDrawers.length ===
            0 ? (
            /* =================================================
                EMPTY
            ================================================= */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <WalletCards
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No cash drawers
                  found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Try changing the
                  filters.
                </p>
              </div>
            </div>
          ) : (
            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Drawer
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Terminal
                    </th>

                    <th className="px-5 py-4">
                      Active Shift
                    </th>

                    <th className="px-5 py-4">
                      Cashier
                    </th>

                    <th className="px-5 py-4">
                      Current Balance
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Updated
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {paginatedDrawers.map(
                    (drawer) => (
                      <tr
                        key={
                          drawer.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* DRAWER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                              <WalletCards
                                size={18}
                              />
                            </div>

                            <div>

                              <p className="max-w-48 truncate text-sm font-semibold text-slate-800">

                                {drawer.name ??
                                  "Cash Drawer"}

                              </p>

                              <p className="mt-1 max-w-48 truncate font-mono text-xs font-semibold text-blue-600">

                                {getDrawerCode(
                                  drawer
                                )}

                              </p>
                            </div>
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
                                drawer
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

                            <span className="max-w-44 truncate text-sm font-medium text-slate-700">

                              {getTerminalName(
                                drawer
                              )}

                            </span>
                          </div>
                        </td>

                        {/* SHIFT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <Clock3
                              size={15}
                              className="text-purple-500"
                            />

                            <span className="max-w-44 truncate text-sm text-slate-600">

                              {getShiftNumber(
                                drawer
                              )}

                            </span>
                          </div>
                        </td>

                        {/* CASHIER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <User
                              size={15}
                              className="text-slate-400"
                            />

                            <span className="max-w-44 truncate text-sm text-slate-600">

                              {getCashierName(
                                drawer
                              )}

                            </span>
                          </div>
                        </td>

                        {/* BALANCE */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <span className="font-bold text-emerald-600">

                            {formatMoney(
                              getCurrentBalance(
                                drawer
                              )
                            )}

                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1.5 text-xs font-semibold ${getStatusStyle(
                              drawer.status
                            )}`}
                          >

                            {displayText(
                              drawer.status
                            )}

                          </span>
                        </td>

                        {/* UPDATED */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                          {formatDateTime(
                            drawer.updatedAt ??
                              drawer.createdAt
                          )}

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end">

                            <button
                              type="button"
                              title="View Cash Drawer"
                              onClick={() =>
                                openDetails(
                                  drawer
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
              CLIENT PAGINATION
          ================================================= */}

          {!loading &&
            filteredDrawers.length >
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

                  {" "}drawers
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
          DETAIL MODAL
      ================================================= */}

      {detailsOpen &&
        selectedDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Cash Drawer Details
                  </h2>

                  <p className="mt-1 font-mono text-sm font-semibold text-blue-600">

                    {getDrawerCode(
                      selectedDrawer
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
                <div className="space-y-7 p-6">

                  {/* =======================================
                      DRAWER HEADER
                  ======================================== */}

                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                        <WalletCards
                          size={23}
                        />
                      </div>

                      <div>

                        <h3 className="text-lg font-bold text-slate-900">

                          {selectedDrawer.name ??
                            "Cash Drawer"}

                        </h3>

                        <p className="mt-1 text-sm text-slate-500">

                          {getBranchName(
                            selectedDrawer
                          )}{" "}
                          ·{" "}
                          {getTerminalName(
                            selectedDrawer
                          )}

                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        selectedDrawer.status
                      )}`}
                    >

                      {displayText(
                        selectedDrawer.status
                      )}

                    </span>
                  </div>

                  {/* =======================================
                      LOCATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Drawer Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                      {/* CODE */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Drawer Code
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Hash
                            size={15}
                            className="text-blue-600"
                          />

                          <p className="font-mono text-sm font-semibold text-slate-700">

                            {getDrawerCode(
                              selectedDrawer
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
                            className="text-purple-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {getBranchName(
                              selectedDrawer
                            )}

                          </p>
                        </div>
                      </div>

                      {/* TERMINAL */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Terminal
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Monitor
                            size={16}
                            className="text-emerald-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {getTerminalName(
                              selectedDrawer
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      BALANCE
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Cash Summary
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      {/* OPENING */}

                      <div className="rounded-xl bg-blue-50 p-4">

                        <p className="text-xs font-semibold uppercase text-blue-500">
                          Opening Cash
                        </p>

                        <p className="mt-2 text-lg font-bold text-blue-700">

                          {formatMoney(
                            getOpeningBalance(
                              selectedDrawer
                            )
                          )}

                        </p>
                      </div>

                      {/* CASH IN */}

                      <div className="rounded-xl bg-emerald-50 p-4">

                        <p className="text-xs font-semibold uppercase text-emerald-500">
                          Cash In
                        </p>

                        <p className="mt-2 text-lg font-bold text-emerald-700">

                          +{" "}
                          {formatMoney(
                            getCashInTotal(
                              selectedDrawer
                            )
                          )}

                        </p>
                      </div>

                      {/* CASH OUT */}

                      <div className="rounded-xl bg-red-50 p-4">

                        <p className="text-xs font-semibold uppercase text-red-500">
                          Cash Out
                        </p>

                        <p className="mt-2 text-lg font-bold text-red-700">

                          -{" "}
                          {formatMoney(
                            getCashOutTotal(
                              selectedDrawer
                            )
                          )}

                        </p>
                      </div>

                      {/* BALANCE */}

                      <div className="rounded-xl bg-purple-50 p-4">

                        <p className="text-xs font-semibold uppercase text-purple-500">
                          Current Balance
                        </p>

                        <p className="mt-2 text-lg font-bold text-purple-700">

                          {formatMoney(
                            getCurrentBalance(
                              selectedDrawer
                            )
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      ACTIVE SHIFT
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Current Shift
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* SHIFT */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Shift
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Clock3
                            size={16}
                            className="text-blue-600"
                          />

                          <p className="font-semibold text-slate-700">

                            {getShiftNumber(
                              selectedDrawer
                            )}

                          </p>
                        </div>
                      </div>

                      {/* CASHIER */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Cashier
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <User
                            size={16}
                            className="text-purple-600"
                          />

                          <p className="font-semibold text-slate-700">

                            {getCashierName(
                              selectedDrawer
                            )}

                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      TRANSACTIONS
                  ======================================== */}

                  <div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          Drawer Transactions
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Cash movement
                          history for this
                          drawer.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          transactionLoading
                        }
                        onClick={() =>
                          fetchTransactions(
                            selectedDrawer.id,
                            transactionPage,
                            transactionLimit
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >

                        <RefreshCw
                          size={14}
                          className={
                            transactionLoading
                              ? "animate-spin"
                              : ""
                          }
                        />

                        Refresh
                      </button>
                    </div>

                    {/* TRANSACTION LOADING */}

                    {transactionLoading ? (
                      <div className="mt-4 flex min-h-48 items-center justify-center rounded-xl border border-slate-200">

                        <Loader2
                          size={27}
                          className="animate-spin text-blue-600"
                        />
                      </div>
                    ) : transactions.length ===
                      0 ? (
                      /* EMPTY */

                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-10 text-center">

                        <ReceiptText
                          size={30}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm text-slate-400">
                          No transactions
                          found for this
                          drawer.
                        </p>
                      </div>
                    ) : (
                      /* TABLE */

                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[900px]">

                            <thead className="bg-slate-50">

                              <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                                <th className="px-4 py-3">
                                  Date
                                </th>

                                <th className="px-4 py-3">
                                  Type
                                </th>

                                <th className="px-4 py-3">
                                  Amount
                                </th>

                                <th className="px-4 py-3">
                                  Reason
                                </th>

                                <th className="px-4 py-3">
                                  Reference
                                </th>

                                <th className="px-4 py-3">
                                  Performed By
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                              {transactions.map(
                                (
                                  transaction,
                                  index
                                ) => {
                                  const style =
                                    getTransactionStyle(
                                      transaction.type ??
                                        transaction.transactionType
                                    );

                                  const Icon =
                                    style.Icon;

                                  return (
                                    <tr
                                      key={
                                        transaction.id ??
                                        index
                                      }
                                    >

                                      {/* DATE */}

                                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">

                                        <div className="flex items-center gap-2">

                                          <CalendarDays
                                            size={14}
                                            className="text-slate-400"
                                          />

                                          {formatDateTime(
                                            transaction.createdAt ??
                                              transaction.date ??
                                              transaction.timestamp
                                          )}
                                        </div>
                                      </td>

                                      {/* TYPE */}

                                      <td className="px-4 py-4">

                                        <span
                                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${style.className}`}
                                        >

                                          <Icon
                                            size={13}
                                          />

                                          {displayText(
                                            transaction.type ??
                                              transaction.transactionType
                                          )}

                                        </span>
                                      </td>

                                      {/* AMOUNT */}

                                      <td className="whitespace-nowrap px-4 py-4">

                                        <span className="font-bold text-slate-800">

                                          {formatMoney(
                                            getTransactionAmount(
                                              transaction
                                            )
                                          )}

                                        </span>
                                      </td>

                                      {/* REASON */}

                                      <td className="px-4 py-4">

                                        <div className="flex items-start gap-2">

                                          <FileText
                                            size={14}
                                            className="mt-0.5 shrink-0 text-slate-400"
                                          />

                                          <p
                                            title={
                                              transaction.reason ??
                                              ""
                                            }
                                            className="max-w-52 truncate text-sm text-slate-600"
                                          >

                                            {transaction.reason ??
                                              "—"}

                                          </p>
                                        </div>
                                      </td>

                                      {/* REFERENCE */}

                                      <td className="px-4 py-4">

                                        <p className="text-xs font-semibold text-slate-600">

                                          {displayText(
                                            transaction.referenceType
                                          )}

                                        </p>

                                        <p className="mt-1 max-w-44 truncate font-mono text-xs text-slate-400">

                                          {transaction.referenceId ??
                                            "—"}

                                        </p>
                                      </td>

                                      {/* USER */}

                                      <td className="px-4 py-4">

                                        <div className="flex items-center gap-2">

                                          <User
                                            size={14}
                                            className="text-purple-500"
                                          />

                                          <span className="max-w-40 truncate text-sm font-medium text-slate-700">

                                            {getTransactionUser(
                                              transaction
                                            )}

                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* =================================
                            TRANSACTION PAGINATION
                        ================================== */}

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                          <p className="text-xs text-slate-500">

                            Page{" "}

                            <span className="font-semibold text-slate-700">
                              {
                                transactionPage
                              }
                            </span>

                            {" "}of{" "}

                            <span className="font-semibold text-slate-700">
                              {
                                transactionTotalPages
                              }
                            </span>

                            {" "}·{" "}

                            {
                              transactionTotal
                            }{" "}
                            transactions
                          </p>

                          <div className="flex items-center gap-2">

                            <select
                              value={
                                transactionLimit
                              }
                              onChange={(event) => {
                                const nextLimit =
                                  Number(
                                    event.target.value
                                  );

                                setTransactionLimit(
                                  nextLimit
                                );

                                fetchTransactions(
                                  selectedDrawer.id,
                                  1,
                                  nextLimit
                                );
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                            >

                              <option value={5}>
                                5
                              </option>

                              <option value={10}>
                                10
                              </option>

                              <option value={20}>
                                20
                              </option>

                              <option value={50}>
                                50
                              </option>
                            </select>

                            <button
                              type="button"
                              disabled={
                                transactionPage <=
                                1
                              }
                              onClick={() =>
                                fetchTransactions(
                                  selectedDrawer.id,
                                  transactionPage -
                                    1,
                                  transactionLimit
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40"
                            >

                              <ChevronLeft
                                size={16}
                              />
                            </button>

                            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white">

                              {
                                transactionPage
                              }

                            </span>

                            <button
                              type="button"
                              disabled={
                                transactionPage >=
                                transactionTotalPages
                              }
                              onClick={() =>
                                fetchTransactions(
                                  selectedDrawer.id,
                                  transactionPage +
                                    1,
                                  transactionLimit
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40"
                            >

                              <ChevronRight
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =======================================
                      IDS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* DRAWER ID */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Cash Drawer ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {selectedDrawer.id ??
                          "—"}

                      </p>
                    </div>

                    {/* TERMINAL ID */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Terminal ID
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-slate-600">

                        {getTerminalId(
                          selectedDrawer
                        ) ??
                          "—"}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      MANAGER INFO
                  ======================================== */}

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                    <div className="flex gap-3">

                      <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <div>

                        <p className="font-semibold text-blue-700">
                          Manager View Only
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-600">
                          Cash In and Cash
                          Out operations are
                          handled by the
                          Cashier. Drawer
                          creation and status
                          configuration are
                          handled by Admin.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default CashDrawers;