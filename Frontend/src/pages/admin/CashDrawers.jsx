import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  WalletCards,
  Plus,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Monitor,
  Building2,
  CircleDot,
  Wrench,
  CircleOff,
  CalendarDays,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const DRAWER_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
];

const EMPTY_FORM = {
  code: "",
  name: "",
  terminalId: "",
};

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
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "INACTIVE":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "MAINTENANCE":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

// ======================================================
// PAGE
// ======================================================

const CashDrawers = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    drawers,
    setDrawers,
  ] = useState([]);

  const [
    terminals,
    setTerminals,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    statusLoadingId,
    setStatusLoadingId,
  ] = useState(null);

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
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  // ====================================================
  // CREATE
  // ====================================================

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(EMPTY_FORM);

  // ====================================================
  // DETAILS
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
    transactionLoading,
    setTransactionLoading,
  ] = useState(false);

  const [
    transactionType,
    setTransactionType,
  ] = useState("");

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
  // LOAD TERMINALS
  //
  // GET /api/terminals
  // ====================================================

  const loadTerminals =
    async () => {
      try {
        const response =
          await api.get(
            "/terminals"
          );

        console.log(
          "Terminal Response:",
          response.data
        );

        const result =
          response.data?.data;

        const terminalData =
          result?.terminals ??
          response.data
            ?.terminals ??
          (Array.isArray(result)
            ? result
            : []);

        setTerminals(
          Array.isArray(
            terminalData
          )
            ? terminalData
            : []
        );
      } catch (err) {
        console.error(
          "Terminal load error:",
          err.response?.data ||
            err.message
        );

        setTerminals([]);
      }
    };

  // ====================================================
  // FETCH DRAWERS
  //
  // GET /api/cash-drawers
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
          "Cash Drawers Response:",
          response.data
        );

        const result =
          response.data?.data;

        const drawerData =
          result?.drawers ??
          response.data
            ?.drawers ??
          (Array.isArray(result)
            ? result
            : []);

        setDrawers(
          Array.isArray(
            drawerData
          )
            ? drawerData
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
  // INITIAL
  // ====================================================

  useEffect(() => {
    loadTerminals();
  }, []);

  useEffect(() => {
    fetchDrawers();
  }, [statusFilter]);

  // ====================================================
  // GET TERMINAL
  // ====================================================

  const getTerminal = (
    drawer
  ) => {
    if (drawer?.terminal) {
      return drawer.terminal;
    }

    return terminals.find(
      (terminal) =>
        terminal.id ===
        drawer?.terminalId
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
      drawer
        ?.terminalName ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    drawer
  ) => {
    if (drawer?.branch) {
      return drawer.branch;
    }

    const terminal =
      getTerminal(drawer);

    return (
      terminal?.branch ??
      null
    );
  };

  // ====================================================
  // FILTERED DRAWERS
  //
  // Backend only supports status filter,
  // so search is local.
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
          const code =
            String(
              drawer?.code ??
                ""
            ).toLowerCase();

          const name =
            String(
              drawer?.name ??
                ""
            ).toLowerCase();

          const terminal =
            String(
              getTerminalName(
                drawer
              )
            ).toLowerCase();

          const branch =
            String(
              getBranch(drawer)
                ?.name ??
                ""
            ).toLowerCase();

          return (
            code.includes(
              keyword
            ) ||
            name.includes(
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
      drawers,
      search,
      terminals,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const totalDrawers =
    drawers.length;

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

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const openCreateModal =
    () => {
      setForm(
        EMPTY_FORM
      );

      setError("");
      setSuccess("");

      setCreateOpen(true);
    };

  // ====================================================
  // CLOSE CREATE
  // ====================================================

  const closeCreateModal =
    () => {
      if (saving) {
        return;
      }

      setCreateOpen(false);

      setForm(
        EMPTY_FORM
      );
    };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            name === "code"
              ? value.toUpperCase()
              : value,
        })
      );
    };

  // ====================================================
  // CREATE DRAWER
  //
  // POST /cash-drawers
  //
  // {
  //   code,
  //   name,
  //   terminalId
  // }
  // ====================================================

  const handleCreate =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const code =
          form.code.trim();

        const name =
          form.name.trim();

        if (
          code.length < 2
        ) {
          throw new Error(
            "Cash drawer code must contain at least 2 characters."
          );
        }

        if (
          name.length < 2
        ) {
          throw new Error(
            "Cash drawer name must contain at least 2 characters."
          );
        }

        if (!form.terminalId) {
          throw new Error(
            "Please select a terminal."
          );
        }

        const response =
          await api.post(
            "/cash-drawers",
            {
              code,
              name,
              terminalId:
                form.terminalId,
            }
          );

        setSuccess(
          response.data?.message ||
            "Cash drawer created successfully."
        );

        setCreateOpen(false);

        setForm(
          EMPTY_FORM
        );

        await fetchDrawers();
      } catch (err) {
        console.error(
          "Create cash drawer error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to create cash drawer."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // STATUS
  //
  // PATCH /cash-drawers/:id/status
  // ====================================================

  const handleStatusChange =
    async (
      drawer,
      status
    ) => {
      try {
        setStatusLoadingId(
          drawer.id
        );

        setError("");
        setSuccess("");

        const response =
          await api.patch(
            `/cash-drawers/${drawer.id}/status`,
            {
              status,
            }
          );

        setSuccess(
          response.data?.message ||
            `Cash drawer status changed to ${status}.`
        );

        setDrawers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                drawer.id
                  ? {
                      ...item,
                      status,
                    }
                  : item
            )
        );

        if (
          selectedDrawer?.id ===
          drawer.id
        ) {
          setSelectedDrawer(
            (current) => ({
              ...current,
              status,
            })
          );
        }
      } catch (err) {
        console.error(
          "Cash drawer status error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to update cash drawer status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // ====================================================
  // TRANSACTION PARSER
  // ====================================================

  const parseTransactions =
    (
      response,
      limitValue
    ) => {
      const result =
        response.data?.data ??
        {};

      const transactionData =
        result.transactions ??
        result.items ??
        result.rows ??
        (Array.isArray(result)
          ? result
          : []);

      const safeTransactions =
        Array.isArray(
          transactionData
        )
          ? transactionData
          : [];

      const pagination =
        result.pagination ??
        {};

      const totalValue =
        Number(
          pagination.total ??
            result.total ??
            result.count ??
            response.data
              ?.count ??
            safeTransactions.length
        );

      const totalPageValue =
        Number(
          pagination.totalPages ??
            result.totalPages ??
            Math.ceil(
              totalValue /
                limitValue
            ) ??
            1
        );

      return {
        transactions:
          safeTransactions,

        total:
          Number.isFinite(
            totalValue
          )
            ? totalValue
            : safeTransactions.length,

        totalPages:
          Math.max(
            1,
            Number(
              totalPageValue
            ) || 1
          ),
      };
    };

  // ====================================================
  // LOAD TRANSACTIONS
  //
  // GET /cash-drawers/:id/transactions
  // ====================================================

  const loadTransactions =
    async ({
      drawerId,
      pageValue = 1,
      limitValue =
        transactionLimit,
      typeValue =
        transactionType,
    }) => {
      if (!drawerId) {
        return;
      }

      try {
        setTransactionLoading(
          true
        );

        const params = {
          page: pageValue,
          limit: limitValue,
        };

        if (typeValue) {
          params.type =
            typeValue;
        }

        const response =
          await api.get(
            `/cash-drawers/${drawerId}/transactions`,
            {
              params,
            }
          );

        console.log(
          "Cash Drawer Transactions:",
          response.data
        );

        const parsed =
          parseTransactions(
            response,
            limitValue
          );

        setTransactions(
          parsed.transactions
        );

        setTransactionTotal(
          parsed.total
        );

        setTransactionTotalPages(
          parsed.totalPages
        );
      } catch (err) {
        console.error(
          "Transaction load error:",
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
  // ====================================================

  const openDetails =
    async (drawer) => {
      try {
        setSelectedDrawer(
          drawer
        );

        setDetailsOpen(true);

        setDetailLoading(true);

        setTransactionType("");
        setTransactionPage(1);
        setTransactionLimit(10);

        setError("");

        const response =
          await api.get(
            `/cash-drawers/${drawer.id}`
          );

        console.log(
          "Cash Drawer Detail:",
          response.data
        );

        const detailed =
          response.data?.data
            ?.drawer ??
          response.data?.data ??
          drawer;

        setSelectedDrawer(
          detailed
        );

        await loadTransactions({
          drawerId:
            drawer.id,
          pageValue: 1,
          limitValue: 10,
          typeValue: "",
        });
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
  // TRANSACTION TYPE OPTIONS
  //
  // Controller doesn't define enum,
  // so options come from actual API data.
  // ====================================================

  const transactionTypes =
    useMemo(() => {
      return Array.from(
        new Set(
          transactions
            .map(
              (transaction) =>
                transaction?.type
            )
            .filter(Boolean)
        )
      );
    }, [transactions]);

  // ====================================================
  // TRANSACTION TYPE CHANGE
  // ====================================================

  const handleTransactionType =
    async (value) => {
      setTransactionType(
        value
      );

      setTransactionPage(1);

      await loadTransactions({
        drawerId:
          selectedDrawer?.id,
        pageValue: 1,
        limitValue:
          transactionLimit,
        typeValue: value,
      });
    };

  // ====================================================
  // TRANSACTION PAGE CHANGE
  // ====================================================

  const changeTransactionPage =
    async (newPage) => {
      setTransactionPage(
        newPage
      );

      await loadTransactions({
        drawerId:
          selectedDrawer?.id,
        pageValue:
          newPage,
        limitValue:
          transactionLimit,
        typeValue:
          transactionType,
      });
    };

  // ====================================================
  // TRANSACTION LIMIT
  // ====================================================

  const changeTransactionLimit =
    async (value) => {
      const newLimit =
        Number(value);

      setTransactionLimit(
        newLimit
      );

      setTransactionPage(1);

      await loadTransactions({
        drawerId:
          selectedDrawer?.id,
        pageValue: 1,
        limitValue:
          newLimit,
        typeValue:
          transactionType,
      });
    };

  // ====================================================
  // TRANSACTION TYPE STYLE
  // ====================================================

  const getTransactionIcon = (
    transaction
  ) => {
    const type =
      String(
        transaction?.type ??
          ""
      ).toUpperCase();

    if (
      type.includes("IN")
    ) {
      return {
        Icon:
          ArrowDownLeft,
        className:
          "bg-emerald-50 text-emerald-600",
      };
    }

    if (
      type.includes("OUT")
    ) {
      return {
        Icon:
          ArrowUpRight,
        className:
          "bg-red-50 text-red-600",
      };
    }

    return {
      Icon:
        ReceiptText,
      className:
        "bg-blue-50 text-blue-600",
    };
  };

  // ====================================================
  // RESET FILTER
  // ====================================================

  const resetFilters =
    () => {
      setSearch("");
      setStatusFilter("");
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
              Cash Drawers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage POS cash drawers,
              terminals and drawer
              transaction history.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              disabled={loading}
              onClick={
                fetchDrawers
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus
                size={18}
              />

              Add Cash Drawer
            </button>
          </div>
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
                  Total Drawers
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalDrawers}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <WalletCards
                  size={23}
                />
              </div>
            </div>
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

              <CircleDot
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
                className="text-slate-400"
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
                  {maintenanceCount}
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

          {/* FILTER */}

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
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search drawer, terminal or branch..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* STATUS */}

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
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
                  Loading cash drawers...
                </p>
              </div>
            </div>
          ) : filteredDrawers.length ===
            0 ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <WalletCards
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No cash drawers found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create a cash drawer
                  and assign it to a
                  terminal.
                </p>
              </div>
            </div>
          ) : (

            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Drawer
                    </th>

                    <th className="px-5 py-4">
                      Code
                    </th>

                    <th className="px-5 py-4">
                      Terminal
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Created
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

                  {filteredDrawers.map(
                    (drawer) => {
                      const branch =
                        getBranch(
                          drawer
                        );

                      return (
                        <tr
                          key={
                            drawer.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* NAME */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                <WalletCards
                                  size={18}
                                />
                              </div>

                              <div>

                                <p className="font-semibold text-slate-800">
                                  {drawer.name ||
                                    "Cash Drawer"}
                                </p>

                                <p className="mt-1 max-w-40 truncate text-xs text-slate-400">
                                  {drawer.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* CODE */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">

                              {drawer.code ||
                                "—"}

                            </span>
                          </td>

                          {/* TERMINAL */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Monitor
                                size={15}
                                className="text-blue-500"
                              />

                              <span className="text-sm font-medium text-slate-700">

                                {getTerminalName(
                                  drawer
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

                              <span className="text-sm text-slate-600">

                                {branch?.name ||
                                  "—"}

                              </span>
                            </div>
                          </td>

                          {/* CREATED */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {formatDateTime(
                              drawer.createdAt
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                drawer.status ||
                                "ACTIVE"
                              }
                              disabled={
                                statusLoadingId ===
                                drawer.id
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  drawer,
                                  e.target.value
                                )
                              }
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${getStatusStyle(
                                drawer.status
                              )}`}
                            >

                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="INACTIVE">
                                INACTIVE
                              </option>

                              <option value="MAINTENANCE">
                                MAINTENANCE
                              </option>
                            </select>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                title="View drawer details"
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
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Add Cash Drawer
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a drawer and
                  assign it to a POS
                  terminal.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeCreateModal
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X
                  size={21}
                />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreate
              }
              className="p-6"
            >

              {/* CODE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Drawer Code *
                </label>

                <input
                  type="text"
                  name="code"
                  value={
                    form.code
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                  minLength={2}
                  maxLength={30}
                  placeholder="CD-01"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 uppercase outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  2 - 30 characters
                </p>
              </div>

              {/* NAME */}

              <div className="mt-5">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Drawer Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Main Counter Drawer"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* TERMINAL */}

              <div className="mt-5">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Terminal *
                </label>

                <select
                  name="terminalId"
                  value={
                    form.terminalId
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select Terminal
                  </option>

                  {terminals.map(
                    (terminal) => (
                      <option
                        key={
                          terminal.id
                        }
                        value={
                          terminal.id
                        }
                      >
                        {terminal.name ||
                          terminal.code}
                        {terminal.code &&
                        terminal.name
                          ? ` (${terminal.code})`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {terminals.length ===
                  0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No terminals found.
                    Create a terminal
                    first.
                  </p>
                )}
              </div>

              {/* ACTION */}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    closeCreateModal
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    terminals.length ===
                      0
                  }
                  className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >

                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus
                      size={17}
                    />
                  )}

                  Create Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {detailsOpen &&
        selectedDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Cash Drawer Details
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">

                    {selectedDrawer.code ||
                      selectedDrawer.id}

                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedDrawer(
                      null
                    );

                    setTransactions(
                      []
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X
                    size={21}
                  />
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

                  {/* =======================================
                      DRAWER BASIC DETAILS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* NAME */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Drawer Name
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">

                        {selectedDrawer.name ||
                          "—"}

                      </p>
                    </div>

                    {/* CODE */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Code
                      </p>

                      <p className="mt-2 font-bold text-blue-600">

                        {selectedDrawer.code ||
                          "—"}

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
                          className="text-blue-500"
                        />

                        <p className="font-semibold text-slate-800">

                          {getTerminalName(
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
                          className="text-slate-500"
                        />

                        <p className="font-semibold text-slate-800">

                          {getBranch(
                            selectedDrawer
                          )?.name ||
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      STATUS / CREATED
                  ======================================== */}

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* STATUS */}

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Drawer Status
                      </p>

                      <div className="mt-3 flex items-center gap-3">

                        <select
                          value={
                            selectedDrawer.status ||
                            "ACTIVE"
                          }
                          disabled={
                            statusLoadingId ===
                            selectedDrawer.id
                          }
                          onChange={(e) =>
                            handleStatusChange(
                              selectedDrawer,
                              e.target.value
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none ${getStatusStyle(
                            selectedDrawer.status
                          )}`}
                        >

                          <option value="ACTIVE">
                            ACTIVE
                          </option>

                          <option value="INACTIVE">
                            INACTIVE
                          </option>

                          <option value="MAINTENANCE">
                            MAINTENANCE
                          </option>
                        </select>

                        {statusLoadingId ===
                          selectedDrawer.id && (
                          <Loader2
                            size={17}
                            className="animate-spin text-blue-600"
                          />
                        )}
                      </div>
                    </div>

                    {/* CREATED */}

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Created At
                      </p>

                      <div className="mt-3 flex items-center gap-2">

                        <CalendarDays
                          size={16}
                          className="text-slate-400"
                        />

                        <p className="text-sm font-semibold text-slate-700">

                          {formatDateTime(
                            selectedDrawer.createdAt
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      INFORMATION
                  ======================================== */}

                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                    <p className="text-sm font-semibold text-blue-700">
                      Cash movement operations
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-600">
                      Admin can create
                      drawers and manage
                      drawer status.
                      Cash In and Cash Out
                      operations are
                      performed by the
                      cashier.
                    </p>
                  </div>

                  {/* =======================================
                      TRANSACTIONS HEADER
                  ======================================== */}

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                      <h3 className="text-lg font-bold text-slate-900">
                        Transaction History
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        View cash drawer
                        movement history.
                      </p>
                    </div>

                    <div className="flex gap-3">

                      {/* TYPE FILTER */}

                      <select
                        value={
                          transactionType
                        }
                        onChange={(e) =>
                          handleTransactionType(
                            e.target.value
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
                      >

                        <option value="">
                          All Types
                        </option>

                        {transactionTypes.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {displayText(
                                type
                              )}
                            </option>
                          )
                        )}
                      </select>

                      {/* REFRESH */}

                      <button
                        type="button"
                        disabled={
                          transactionLoading
                        }
                        onClick={() =>
                          loadTransactions({
                            drawerId:
                              selectedDrawer.id,

                            pageValue:
                              transactionPage,

                            limitValue:
                              transactionLimit,

                            typeValue:
                              transactionType,
                          })
                        }
                        className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <RefreshCw
                          size={16}
                          className={
                            transactionLoading
                              ? "animate-spin"
                              : ""
                          }
                        />

                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* =======================================
                      TRANSACTIONS
                  ======================================== */}

                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">

                    {transactionLoading ? (
                      <div className="flex min-h-56 items-center justify-center">

                        <Loader2
                          size={28}
                          className="animate-spin text-blue-600"
                        />
                      </div>
                    ) : transactions.length ===
                      0 ? (
                      <div className="flex min-h-56 items-center justify-center">

                        <div className="text-center">

                          <ReceiptText
                            size={30}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm font-semibold text-slate-600">
                            No drawer transactions
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Cash movements will
                            appear here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">

                        <table className="w-full min-w-[800px]">

                          <thead className="bg-slate-50">

                            <tr className="text-left text-xs font-semibold uppercase text-slate-500">

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
                                Date
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {transactions.map(
                              (
                                transaction,
                                index
                              ) => {
                                const {
                                  Icon,
                                  className,
                                } =
                                  getTransactionIcon(
                                    transaction
                                  );

                                return (
                                  <tr
                                    key={
                                      transaction.id ??
                                      index
                                    }
                                    className="hover:bg-slate-50"
                                  >

                                    {/* TYPE */}

                                    <td className="px-4 py-4">

                                      <div className="flex items-center gap-3">

                                        <div
                                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${className}`}
                                        >
                                          <Icon
                                            size={17}
                                          />
                                        </div>

                                        <span className="text-sm font-semibold text-slate-700">

                                          {displayText(
                                            transaction.type
                                          )}

                                        </span>
                                      </div>
                                    </td>

                                    {/* AMOUNT */}

                                    <td className="whitespace-nowrap px-4 py-4">

                                      <span className="font-bold text-slate-900">

                                        {formatMoney(
                                          transaction.amount
                                        )}

                                      </span>
                                    </td>

                                    {/* REASON */}

                                    <td className="px-4 py-4">

                                      <p className="max-w-64 text-sm text-slate-600">

                                        {transaction.reason ||
                                          "—"}

                                      </p>
                                    </td>

                                    {/* REFERENCE */}

                                    <td className="px-4 py-4">

                                      <p className="text-sm font-medium text-slate-700">

                                        {transaction.referenceType ||
                                          "—"}

                                      </p>

                                      {transaction.referenceId && (
                                        <p className="mt-1 max-w-44 truncate text-xs text-slate-400">

                                          {
                                            transaction.referenceId
                                          }

                                        </p>
                                      )}
                                    </td>

                                    {/* DATE */}

                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">

                                      {formatDateTime(
                                        transaction.createdAt ??
                                          transaction.transactionAt
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

                    {/* =======================================
                        TRANSACTION PAGINATION
                    ======================================== */}

                    {!transactionLoading &&
                      transactions.length >
                        0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                          <p className="text-sm text-slate-500">

                            Page{" "}

                            <span className="font-semibold text-slate-800">
                              {
                                transactionPage
                              }
                            </span>

                            {" "}of{" "}

                            <span className="font-semibold text-slate-800">
                              {
                                transactionTotalPages
                              }
                            </span>

                            {" "}(
                            {
                              transactionTotal
                            }{" "}
                            transactions)
                          </p>

                          <div className="flex items-center gap-2">

                            <select
                              value={
                                transactionLimit
                              }
                              onChange={(e) =>
                                changeTransactionLimit(
                                  e.target.value
                                )
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                                transactionPage <=
                                1
                              }
                              onClick={() =>
                                changeTransactionPage(
                                  Math.max(
                                    1,
                                    transactionPage -
                                      1
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

                              {transactionPage}

                            </span>

                            <button
                              type="button"
                              disabled={
                                transactionPage >=
                                transactionTotalPages
                              }
                              onClick={() =>
                                changeTransactionPage(
                                  Math.min(
                                    transactionTotalPages,
                                    transactionPage +
                                      1
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
              )}
            </div>
          </div>
        )}
    </>
  );
};

export default CashDrawers;