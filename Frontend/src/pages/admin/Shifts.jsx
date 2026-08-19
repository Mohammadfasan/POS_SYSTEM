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
  RefreshCw,
  RotateCcw,
  Building2,
  Monitor,
  User,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  FileText,
} from "lucide-react";

import api from "../../api/axios";

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
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "CLOSED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

// ======================================================
// PAGE
// ======================================================

const Shifts = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    shifts,
    setShifts,
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

  const [error, setError] =
    useState("");

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
    selectedShift,
    setSelectedShift,
  ] = useState(null);

  const [
    detailsOpen,
    setDetailsOpen,
  ] = useState(false);

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
  // FETCH SHIFTS
  //
  // GET /api/shifts
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

        const response =
          await api.get(
            "/shifts",
            {
              params,
            }
          );

        console.log(
          "Shift Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const shiftData =
          result.shifts ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeShifts =
          Array.isArray(
            shiftData
          )
            ? shiftData
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
            : safeShifts.length
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
    loadBranches();
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [
    page,
    limit,
    statusFilter,
    branchFilter,
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
      shift?.shiftNo ??
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
    const user =
      shift?.cashier ??
      shift?.user ??
      shift?.openedBy;

    if (!user) {
      return (
        shift?.cashierName ??
        "—"
      );
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
  // CASHIER EMPLOYEE ID
  // ====================================================

  const getEmployeeId = (
    shift
  ) => {
    return (
      shift?.cashier
        ?.employeeId ??
      shift?.user
        ?.employeeId ??
      shift?.employeeId ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    shift
  ) => {
    if (shift?.branch) {
      return shift.branch;
    }

    if (
      shift?.terminal?.branch
    ) {
      return shift.terminal
        .branch;
    }

    const branchId =
      shift?.branchId ??
      shift?.terminal
        ?.branchId;

    return branches.find(
      (branch) =>
        branch.id ===
        branchId
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
      shift?.terminalId ??
      "—"
    );
  };

  // ====================================================
  // OPEN DATE
  // ====================================================

  const getOpenTime = (
    shift
  ) => {
    return (
      shift?.openedAt ??
      shift?.startAt ??
      shift?.startedAt ??
      shift?.createdAt ??
      null
    );
  };

  // ====================================================
  // CLOSE DATE
  // ====================================================

  const getCloseTime = (
    shift
  ) => {
    return (
      shift?.closedAt ??
      shift?.endAt ??
      shift?.endedAt ??
      null
    );
  };

  // ====================================================
  // CASH
  // ====================================================

  const getOpeningCash = (
    shift
  ) => {
    return Number(
      shift?.openingCash ??
        0
    );
  };

  const getClosingCash = (
    shift
  ) => {
    if (
      shift?.closingCash ===
        null ||
      shift?.closingCash ===
        undefined
    ) {
      return null;
    }

    return Number(
      shift.closingCash
    );
  };

  // ====================================================
  // OPTIONAL VALUES
  // ====================================================

  const getExpectedCash = (
    shift
  ) => {
    const value =
      shift?.expectedCash ??
      shift?.expectedClosingCash;

    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return Number(value);
  };

  const getVariance = (
    shift
  ) => {
    if (
      shift?.cashVariance !==
        undefined &&
      shift?.cashVariance !==
        null
    ) {
      return Number(
        shift.cashVariance
      );
    }

    if (
      shift?.variance !==
        undefined &&
      shift?.variance !==
        null
    ) {
      return Number(
        shift.variance
      );
    }

    const closing =
      getClosingCash(shift);

    const expected =
      getExpectedCash(shift);

    if (
      closing === null ||
      expected === null
    ) {
      return null;
    }

    return closing - expected;
  };

  // ====================================================
  // FILTERED CURRENT PAGE
  //
  // Backend doesn't expose "search" in Shift controller.
  // So search works locally on current page.
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
          const shiftNumber =
            String(
              getShiftNumber(
                shift
              )
            ).toLowerCase();

          const cashier =
            getCashier(
              shift
            ).toLowerCase();

          const employeeId =
            String(
              getEmployeeId(
                shift
              )
            ).toLowerCase();

          const terminal =
            String(
              getTerminalName(
                shift
              )
            ).toLowerCase();

          const branch =
            String(
              getBranch(shift)
                ?.name ??
                ""
            ).toLowerCase();

          return (
            shiftNumber.includes(
              keyword
            ) ||
            cashier.includes(
              keyword
            ) ||
            employeeId.includes(
              keyword
            ) ||
            terminal.includes(
              keyword
            ) ||
            branch.includes(
              keyword
            )
          );
        }
      );
    }, [
      shifts,
      search,
      branches,
    ]);

  // ====================================================
  // DYNAMIC STATUSES
  //
  // Controller forwards status to service without
  // defining a status enum. Build options from data.
  // ====================================================

  const statusOptions =
    useMemo(() => {
      const values =
        new Set();

      shifts.forEach(
        (shift) => {
          if (shift?.status) {
            values.add(
              shift.status
            );
          }
        }
      );

      // Common open/close lifecycle fallback
      // for when one page has no records of a status.
      values.add("OPEN");
      values.add("CLOSED");

      return Array.from(
        values
      );
    }, [shifts]);

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

  const openingCashTotal =
    shifts.reduce(
      (sum, shift) =>
        sum +
        getOpeningCash(
          shift
        ),
      0
    );

  // ====================================================
  // DETAILS
  //
  // GET /api/shifts/:id
  // ====================================================

  const openDetails =
    async (shift) => {
      try {
        setSelectedShift(
          shift
        );

        setDetailsOpen(true);

        setDetailLoading(
          true
        );

        setError("");

        const response =
          await api.get(
            `/shifts/${shift.id}`
          );

        console.log(
          "Shift Detail Response:",
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
  // RESET
  // ====================================================

  const resetFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      setBranchFilter("");
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
              Shifts
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View cashier shift
              history, opening cash,
              closing cash and shift
              details.
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
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <Clock3
                  size={23}
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

                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {closedCount}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Current page
                </p>
              </div>

              <CheckCircle2
                size={23}
                className="text-slate-500"
              />
            </div>
          </div>

          {/* OPENING CASH */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Opening Cash
                </p>

                <p className="mt-2 text-xl font-bold text-purple-600">
                  {formatMoney(
                    openingCashTotal
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
        </div>

        {/* =================================================
            TABLE CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_auto]">

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
                  placeholder="Search shift, cashier or terminal..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

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
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
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
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Status
                </option>

                {statusOptions.map(
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
                  Loading shifts...
                </p>
              </div>
            </div>
          ) : filteredShifts.length ===
            0 ? (
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

              <table className="w-full min-w-[1150px]">

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
                      Opening Cash
                    </th>

                    <th className="px-5 py-4">
                      Closing Cash
                    </th>

                    <th className="px-5 py-4">
                      Opened
                    </th>

                    <th className="px-5 py-4">
                      Closed
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
                    (shift) => {
                      const branch =
                        getBranch(
                          shift
                        );

                      const closingCash =
                        getClosingCash(
                          shift
                        );

                      return (
                        <tr
                          key={
                            shift.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* SHIFT */}

                          <td className="px-5 py-4">

                            <p className="max-w-52 truncate text-sm font-semibold text-blue-600">

                              {getShiftNumber(
                                shift
                              )}

                            </p>
                          </td>

                          {/* CASHIER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                                <User
                                  size={16}
                                />
                              </div>

                              <div>

                                <p className="whitespace-nowrap text-sm font-semibold text-slate-700">

                                  {getCashier(
                                    shift
                                  )}

                                </p>

                                <p className="mt-1 text-xs text-slate-400">

                                  {getEmployeeId(
                                    shift
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

                              <span className="whitespace-nowrap text-sm text-slate-600">

                                {branch?.name ||
                                  "—"}

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

                          {/* OPENING CASH */}

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">

                            {formatMoney(
                              getOpeningCash(
                                shift
                              )
                            )}

                          </td>

                          {/* CLOSING CASH */}

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">

                            {closingCash !==
                            null
                              ? formatMoney(
                                  closingCash
                                )
                              : "—"}

                          </td>

                          {/* OPENED */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {formatDateTime(
                              getOpenTime(
                                shift
                              )
                            )}

                          </td>

                          {/* CLOSED */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {formatDateTime(
                              getCloseTime(
                                shift
                              )
                            )}

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
                                title="View shift details"
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
            shifts.length > 0 && (
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
                    ({total} shifts)
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
        selectedShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Shift Details
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

                    {getShiftNumber(
                      selectedShift
                    )}

                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedShift(
                      null
                    );
                  }}
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

                  {/* STATUS */}

                  <div className="flex flex-wrap items-center justify-between gap-4">

                    <div>

                      <p className="text-sm text-slate-500">
                        Shift Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          selectedShift.status
                        )}`}
                      >

                        {displayText(
                          selectedShift.status
                        )}

                      </span>
                    </div>

                    <Clock3
                      size={32}
                      className="text-blue-500"
                    />
                  </div>

                  {/* BASIC */}

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* CASHIER */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Cashier
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <User
                          size={16}
                          className="text-purple-600"
                        />

                        <p className="font-semibold text-slate-800">

                          {getCashier(
                            selectedShift
                          )}

                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">

                        {getEmployeeId(
                          selectedShift
                        )}

                      </p>
                    </div>

                    {/* TERMINAL */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Terminal
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <Monitor
                          size={16}
                          className="text-blue-600"
                        />

                        <p className="font-semibold text-slate-800">

                          {getTerminalName(
                            selectedShift
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
                          className="text-slate-500"
                        />

                        <p className="font-semibold text-slate-800">

                          {getBranch(
                            selectedShift
                          )?.name ||
                            "—"}

                        </p>
                      </div>
                    </div>

                    {/* SHIFT NUMBER */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Shift Number
                      </p>

                      <p className="mt-2 break-all font-semibold text-blue-600">

                        {getShiftNumber(
                          selectedShift
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      CASH
                  ======================================== */}

                  <div className="mt-6">

                    <h3 className="font-bold text-slate-900">
                      Cash Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* OPENING */}

                      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-sm font-semibold text-purple-700">
                              Opening Cash
                            </p>

                            <p className="mt-2 text-2xl font-bold text-purple-700">

                              {formatMoney(
                                getOpeningCash(
                                  selectedShift
                                )
                              )}

                            </p>
                          </div>

                          <Banknote
                            size={25}
                            className="text-purple-500"
                          />
                        </div>
                      </div>

                      {/* CLOSING */}

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-sm font-semibold text-emerald-700">
                              Closing Cash
                            </p>

                            <p className="mt-2 text-2xl font-bold text-emerald-700">

                              {getClosingCash(
                                selectedShift
                              ) !== null
                                ? formatMoney(
                                    getClosingCash(
                                      selectedShift
                                    )
                                  )
                                : "—"}

                            </p>
                          </div>

                          <Banknote
                            size={25}
                            className="text-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OPTIONAL EXPECTED / VARIANCE */}

                  {(getExpectedCash(
                    selectedShift
                  ) !== null ||
                    getVariance(
                      selectedShift
                    ) !== null) && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {getExpectedCash(
                        selectedShift
                      ) !== null && (
                        <div className="rounded-xl bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Expected Cash
                          </p>

                          <p className="mt-2 text-lg font-bold text-slate-800">

                            {formatMoney(
                              getExpectedCash(
                                selectedShift
                              )
                            )}

                          </p>
                        </div>
                      )}

                      {getVariance(
                        selectedShift
                      ) !== null && (
                        <div className="rounded-xl bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Cash Variance
                          </p>

                          <p
                            className={`mt-2 text-lg font-bold ${
                              getVariance(
                                selectedShift
                              ) === 0
                                ? "text-emerald-600"
                                : getVariance(
                                    selectedShift
                                  ) > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >

                            {formatMoney(
                              getVariance(
                                selectedShift
                              )
                            )}

                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =======================================
                      TIME
                  ======================================== */}

                  <div className="mt-6">

                    <h3 className="font-bold text-slate-900">
                      Shift Time
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <div className="flex gap-3">

                          <CalendarDays
                            size={19}
                            className="mt-0.5 text-emerald-600"
                          />

                          <div>

                            <p className="text-xs font-semibold uppercase text-slate-400">
                              Opened At
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">

                              {formatDateTime(
                                getOpenTime(
                                  selectedShift
                                )
                              )}

                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <div className="flex gap-3">

                          <CalendarDays
                            size={19}
                            className="mt-0.5 text-slate-500"
                          />

                          <div>

                            <p className="text-xs font-semibold uppercase text-slate-400">
                              Closed At
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-700">

                              {formatDateTime(
                                getCloseTime(
                                  selectedShift
                                )
                              )}

                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      NOTES
                  ======================================== */}

                  {(selectedShift.openingNote ||
                    selectedShift.closingNote) && (
                    <div className="mt-6">

                      <h3 className="font-bold text-slate-900">
                        Shift Notes
                      </h3>

                      <div className="mt-4 space-y-3">

                        {selectedShift.openingNote && (
                          <div className="rounded-xl border border-slate-200 p-4">

                            <div className="flex items-start gap-3">

                              <FileText
                                size={18}
                                className="mt-0.5 text-blue-600"
                              />

                              <div>

                                <p className="text-sm font-semibold text-slate-700">
                                  Opening Note
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">

                                  {
                                    selectedShift.openingNote
                                  }

                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedShift.closingNote && (
                          <div className="rounded-xl border border-slate-200 p-4">

                            <div className="flex items-start gap-3">

                              <FileText
                                size={18}
                                className="mt-0.5 text-slate-500"
                              />

                              <div>

                                <p className="text-sm font-semibold text-slate-700">
                                  Closing Note
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">

                                  {
                                    selectedShift.closingNote
                                  }

                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      OPEN SHIFT MESSAGE
                  ======================================== */}

                  {selectedShift.status ===
                    "OPEN" && (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex gap-3">

                        <CircleDot
                          size={20}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        <div>

                          <p className="font-semibold text-emerald-700">
                            Active Shift
                          </p>

                          <p className="mt-1 text-sm text-emerald-600">
                            This shift is
                            currently open.
                            The cashier who
                            owns the shift
                            must close it
                            from the cashier
                            portal.
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