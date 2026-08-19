import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ScrollText,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Building2,
  User,
  ShieldAlert,
  Info,
  TriangleAlert,
  CalendarDays,
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  Fingerprint,
  MonitorCog,
  FileJson,
  Copy,
  CheckCircle2,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONSTANTS
// ======================================================

const SEVERITIES = [
  "INFO",
  "WARNING",
  "CRITICAL",
];

// ======================================================
// HELPERS
// ======================================================

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
        timeStyle: "medium",
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
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const getSeverityStyle = (
  severity
) => {
  switch (severity) {
    case "INFO":
      return {
        badge:
          "border-blue-200 bg-blue-50 text-blue-700",
        icon:
          "bg-blue-50 text-blue-600",
      };

    case "WARNING":
      return {
        badge:
          "border-amber-200 bg-amber-50 text-amber-700",
        icon:
          "bg-amber-50 text-amber-600",
      };

    case "CRITICAL":
      return {
        badge:
          "border-red-200 bg-red-50 text-red-700",
        icon:
          "bg-red-50 text-red-600",
      };

    default:
      return {
        badge:
          "border-slate-200 bg-slate-100 text-slate-600",
        icon:
          "bg-slate-100 text-slate-500",
      };
  }
};

const getSeverityIcon = (
  severity
) => {
  switch (severity) {
    case "CRITICAL":
      return ShieldAlert;

    case "WARNING":
      return TriangleAlert;

    default:
      return Info;
  }
};

const safeJSON = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const prettyJSON = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  if (
    typeof value === "string"
  ) {
    try {
      return JSON.stringify(
        JSON.parse(value),
        null,
        2
      );
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
};

// ======================================================
// PAGE
// ======================================================

const AuditLogs = () => {
  // ====================================================
  // DATA
  // ====================================================

  const [
    auditLogs,
    setAuditLogs,
  ] = useState([]);

  const [
    branches,
    setBranches,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // ====================================================
  // FILTER INPUT
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
    branchFilter,
    setBranchFilter,
  ] = useState("");

  const [
    severityFilter,
    setSeverityFilter,
  ] = useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("");

  const [
    entityTypeFilter,
    setEntityTypeFilter,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
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
    selectedAudit,
    setSelectedAudit,
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
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );
      } catch (err) {
        console.error(
          "Audit branch load error:",
          err.response?.data ||
            err.message
        );

        setBranches([]);
      }
    };

  // ====================================================
  // GET PARAMS
  // ====================================================

  const getParams = () => {
    const params = {
      page,
      limit,
    };

    if (search) {
      params.search = search;
    }

    if (branchFilter) {
      params.branchId =
        branchFilter;
    }

    if (severityFilter) {
      params.severity =
        severityFilter;
    }

    if (moduleFilter) {
      params.module =
        moduleFilter.trim();
    }

    if (actionFilter) {
      params.action =
        actionFilter.trim();
    }

    if (entityTypeFilter) {
      params.entityType =
        entityTypeFilter.trim();
    }

    if (startDate) {
      params.startDate =
        startDate;
    }

    if (endDate) {
      params.endDate =
        endDate;
    }

    return params;
  };

  // ====================================================
  // FETCH AUDITS
  //
  // GET /api/audits
  // ====================================================

  const fetchAuditLogs =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/audits",
            {
              params:
                getParams(),
            }
          );

        console.log(
          "Audit Log Response:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const logData =
          result.auditLogs ??
          result.logs ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeLogs =
          Array.isArray(logData)
            ? logData
            : [];

        setAuditLogs(
          safeLogs
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
              safeLogs.length
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
            : safeLogs.length
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
          "Audit load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load audit logs."
        );

        setAuditLogs([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // LOAD SUMMARY
  //
  // GET /api/audits/summary
  //
  // Summary endpoint accepts:
  // branchId
  // startDate
  // endDate
  // ====================================================

  const loadSummary =
    async () => {
      try {
        const params = {};

        if (branchFilter) {
          params.branchId =
            branchFilter;
        }

        if (startDate) {
          params.startDate =
            startDate;
        }

        if (endDate) {
          params.endDate =
            endDate;
        }

        const response =
          await api.get(
            "/audits/summary",
            {
              params,
            }
          );

        console.log(
          "Audit Summary:",
          response.data
        );

        const summaryData =
          response.data?.data
            ?.summary ??
          response.data?.data ??
          null;

        setSummary(
          summaryData
        );
      } catch (err) {
        console.error(
          "Audit summary error:",
          err.response?.data ||
            err.message
        );

        setSummary(null);
      }
    };

  // ====================================================
  // INITIAL
  // ====================================================

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
    loadSummary();
  }, [
    page,
    limit,
    search,
    branchFilter,
    severityFilter,
    moduleFilter,
    actionFilter,
    entityTypeFilter,
    startDate,
    endDate,
  ]);

  // ====================================================
  // ACTOR
  // ====================================================

  const getActor = (
    audit
  ) => {
    const actor =
      audit?.actor ??
      audit?.user ??
      audit?.performedBy ??
      audit?.createdBy;

    if (!actor) {
      return (
        audit?.actorName ??
        audit?.actorId ??
        "System"
      );
    }

    if (
      typeof actor ===
      "string"
    ) {
      return actor;
    }

    const fullName = [
      actor.firstName,
      actor.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      actor.name ||
      actor.employeeId ||
      actor.email ||
      "System"
    );
  };

  // ====================================================
  // ACTOR ROLE
  // ====================================================

  const getActorRole = (
    audit
  ) => {
    return (
      audit?.actor?.role ??
      audit?.user?.role ??
      audit?.actorRole ??
      "—"
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    audit
  ) => {
    if (audit?.branch) {
      return audit.branch;
    }

    const branchId =
      audit?.branchId;

    return branches.find(
      (branch) =>
        branch.id ===
        branchId
    );
  };

  // ====================================================
  // MODULE
  // ====================================================

  const getModule = (
    audit
  ) => {
    return (
      audit?.module ??
      audit?.entityType ??
      "SYSTEM"
    );
  };

  // ====================================================
  // ACTION
  // ====================================================

  const getAction = (
    audit
  ) => {
    return (
      audit?.action ??
      audit?.event ??
      audit?.operation ??
      "—"
    );
  };

  // ====================================================
  // DESCRIPTION
  // ====================================================

  const getDescription = (
    audit
  ) => {
    return (
      audit?.description ??
      audit?.message ??
      audit?.details ??
      audit?.note ??
      "—"
    );
  };

  // ====================================================
  // IP ADDRESS
  // ====================================================

  const getIpAddress = (
    audit
  ) => {
    return (
      audit?.ipAddress ??
      audit?.ip ??
      audit?.requestIp ??
      "—"
    );
  };

  // ====================================================
  // USER AGENT
  // ====================================================

  const getUserAgent = (
    audit
  ) => {
    return (
      audit?.userAgent ??
      audit?.requestUserAgent ??
      "—"
    );
  };

  // ====================================================
  // MODULE OPTIONS
  // ====================================================

  const moduleOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs
            .map(
              (audit) =>
                audit?.module
            )
            .filter(Boolean)
        )
      ).sort();
    }, [auditLogs]);

  // ====================================================
  // ACTION OPTIONS
  // ====================================================

  const actionOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs
            .map(
              (audit) =>
                audit?.action
            )
            .filter(Boolean)
        )
      ).sort();
    }, [auditLogs]);

  // ====================================================
  // ENTITY TYPE OPTIONS
  // ====================================================

  const entityTypeOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs
            .map(
              (audit) =>
                audit?.entityType
            )
            .filter(Boolean)
        )
      ).sort();
    }, [auditLogs]);

  // ====================================================
  // CURRENT PAGE COUNTS
  // ====================================================

  const pageInfoCount =
    auditLogs.filter(
      (audit) =>
        audit.severity ===
        "INFO"
    ).length;

  const pageWarningCount =
    auditLogs.filter(
      (audit) =>
        audit.severity ===
        "WARNING"
    ).length;

  const pageCriticalCount =
    auditLogs.filter(
      (audit) =>
        audit.severity ===
        "CRITICAL"
    ).length;

  // ====================================================
  // SUMMARY VALUE RESOLVERS
  // ====================================================

  const getSummaryValue = (
    names,
    fallback
  ) => {
    if (
      !summary ||
      typeof summary !==
        "object"
    ) {
      return fallback;
    }

    for (const name of names) {
      const value =
        summary?.[name];

      if (
        value !== undefined &&
        value !== null
      ) {
        const number =
          Number(value);

        if (
          Number.isFinite(number)
        ) {
          return number;
        }
      }
    }

    return fallback;
  };

  const summaryTotal =
    getSummaryValue(
      [
        "total",
        "totalLogs",
        "auditCount",
        "count",
      ],
      total
    );

  const summaryInfo =
    getSummaryValue(
      [
        "info",
        "infoCount",
        "INFO",
      ],
      pageInfoCount
    );

  const summaryWarning =
    getSummaryValue(
      [
        "warning",
        "warningCount",
        "WARNING",
      ],
      pageWarningCount
    );

  const summaryCritical =
    getSummaryValue(
      [
        "critical",
        "criticalCount",
        "CRITICAL",
      ],
      pageCriticalCount
    );

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
  // DATE VALIDATION
  // ====================================================

  const handleStartDate = (
    value
  ) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDate = (
    value
  ) => {
    if (
      startDate &&
      value &&
      new Date(value) <
        new Date(startDate)
    ) {
      setError(
        "End date cannot be earlier than start date."
      );

      return;
    }

    setError("");
    setEndDate(value);
    setPage(1);
  };

  // ====================================================
  // RESET FILTER
  // ====================================================

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");

    setBranchFilter("");
    setSeverityFilter("");
    setModuleFilter("");
    setActionFilter("");
    setEntityTypeFilter("");

    setStartDate("");
    setEndDate("");

    setPage(1);
  };

  // ====================================================
  // OPEN DETAILS
  //
  // GET /api/audits/:id
  // ====================================================

  const openDetails =
    async (audit) => {
      try {
        setSelectedAudit(
          audit
        );

        setDetailsOpen(true);

        setDetailLoading(
          true
        );

        setError("");

        const response =
          await api.get(
            `/audits/${audit.id}`
          );

        console.log(
          "Audit Detail Response:",
          response.data
        );

        const detailed =
          response.data?.data
            ?.auditLog ??
          response.data?.data ??
          audit;

        setSelectedAudit(
          detailed
        );
      } catch (err) {
        console.error(
          "Audit detail error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load audit log details."
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  // ====================================================
  // COPY
  // ====================================================

  const copyText =
    async (
      value,
      label
    ) => {
      if (!value) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          String(value)
        );

        setSuccess(
          `${label} copied.`
        );
      } catch {
        setError(
          `Unable to copy ${label}.`
        );
      }
    };

  // ====================================================
  // CHANGE DATA
  // ====================================================

  const getOldData = (
    audit
  ) => {
    return safeJSON(
      audit?.oldData ??
        audit?.oldValues ??
        audit?.before ??
        audit?.previousData
    );
  };

  const getNewData = (
    audit
  ) => {
    return safeJSON(
      audit?.newData ??
        audit?.newValues ??
        audit?.after ??
        audit?.currentData
    );
  };

  const getMetadata = (
    audit
  ) => {
    return safeJSON(
      audit?.metadata ??
        audit?.meta ??
        audit?.data
    );
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

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Audit Logs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor system
              activities, user actions
              and important security
              events.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              fetchAuditLogs();
              loadSummary();
            }}
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
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Logs
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summaryTotal}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                <ScrollText
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* INFO */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Information
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {summaryInfo}
                </p>
              </div>

              <Info
                size={23}
                className="text-blue-500"
              />
            </div>
          </div>

          {/* WARNING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Warnings
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {summaryWarning}
                </p>
              </div>

              <TriangleAlert
                size={23}
                className="text-amber-500"
              />
            </div>
          </div>

          {/* CRITICAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Critical
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {summaryCritical}
                </p>
              </div>

              <ShieldAlert
                size={23}
                className="text-red-500"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              FILTER AREA
          ================================================= */}

          <div className="border-b border-slate-200 p-5">

            <div className="space-y-4">

              {/* ROW 1 */}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">

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
                    placeholder="Search audit logs..."
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

                {/* SEVERITY */}

                <select
                  value={
                    severityFilter
                  }
                  onChange={(e) => {
                    setSeverityFilter(
                      e.target.value
                    );

                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                >

                  <option value="">
                    All Severities
                  </option>

                  {SEVERITIES.map(
                    (severity) => (
                      <option
                        key={
                          severity
                        }
                        value={
                          severity
                        }
                      >
                        {severity}
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

              {/* ROW 2 */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

                {/* MODULE */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">
                    Module
                  </label>

                  <input
                    type="text"
                    list="audit-modules"
                    value={
                      moduleFilter
                    }
                    onChange={(e) => {
                      setModuleFilter(
                        e.target.value
                      );

                      setPage(1);
                    }}
                    placeholder="e.g. SALES"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none"
                  />

                  <datalist id="audit-modules">

                    {moduleOptions.map(
                      (module) => (
                        <option
                          key={
                            module
                          }
                          value={
                            module
                          }
                        />
                      )
                    )}
                  </datalist>
                </div>

                {/* ACTION */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">
                    Action
                  </label>

                  <input
                    type="text"
                    list="audit-actions"
                    value={
                      actionFilter
                    }
                    onChange={(e) => {
                      setActionFilter(
                        e.target.value
                      );

                      setPage(1);
                    }}
                    placeholder="e.g. CREATE"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none"
                  />

                  <datalist id="audit-actions">

                    {actionOptions.map(
                      (action) => (
                        <option
                          key={
                            action
                          }
                          value={
                            action
                          }
                        />
                      )
                    )}
                  </datalist>
                </div>

                {/* ENTITY */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">
                    Entity Type
                  </label>

                  <input
                    type="text"
                    list="audit-entities"
                    value={
                      entityTypeFilter
                    }
                    onChange={(e) => {
                      setEntityTypeFilter(
                        e.target.value
                      );

                      setPage(1);
                    }}
                    placeholder="e.g. SALE"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none"
                  />

                  <datalist id="audit-entities">

                    {entityTypeOptions.map(
                      (entity) => (
                        <option
                          key={
                            entity
                          }
                          value={
                            entity
                          }
                        />
                      )
                    )}
                  </datalist>
                </div>

                {/* START DATE */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={(e) =>
                      handleStartDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                {/* END */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    onChange={(e) =>
                      handleEndDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
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
                  Loading audit logs...
                </p>
              </div>
            </div>
          ) : auditLogs.length ===
            0 ? (

            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <ScrollText
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No audit logs found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  System activity will
                  appear here.
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
                      Severity
                    </th>

                    <th className="px-5 py-4">
                      Date / Time
                    </th>

                    <th className="px-5 py-4">
                      Actor
                    </th>

                    <th className="px-5 py-4">
                      Module
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>

                    <th className="px-5 py-4">
                      Entity
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Request ID
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {auditLogs.map(
                    (audit) => {
                      const style =
                        getSeverityStyle(
                          audit.severity
                        );

                      const SeverityIcon =
                        getSeverityIcon(
                          audit.severity
                        );

                      const branch =
                        getBranch(
                          audit
                        );

                      return (
                        <tr
                          key={
                            audit.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* SEVERITY */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.icon}`}
                              >
                                <SeverityIcon
                                  size={15}
                                />
                              </div>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${style.badge}`}
                              >

                                {audit.severity ||
                                  "INFO"}

                              </span>
                            </div>
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-4">

                            <div className="flex items-center gap-2 text-sm text-slate-500">

                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />

                              {formatDateTime(
                                audit.createdAt ??
                                  audit.timestamp ??
                                  audit.occurredAt
                              )}
                            </div>
                          </td>

                          {/* ACTOR */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                                <User
                                  size={16}
                                />
                              </div>

                              <div>

                                <p className="max-w-44 truncate text-sm font-semibold text-slate-700">

                                  {getActor(
                                    audit
                                  )}

                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">

                                  {displayText(
                                    getActorRole(
                                      audit
                                    )
                                  )}

                                </p>
                              </div>
                            </div>
                          </td>

                          {/* MODULE */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">

                              {displayText(
                                getModule(
                                  audit
                                )
                              )}

                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <span className="text-sm font-semibold text-slate-700">

                              {displayText(
                                getAction(
                                  audit
                                )
                              )}

                            </span>
                          </td>

                          {/* ENTITY */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-700">

                              {displayText(
                                audit.entityType
                              )}

                            </p>

                            {audit.entityId && (
                              <p
                                title={
                                  audit.entityId
                                }
                                className="mt-1 max-w-36 truncate text-xs text-slate-400"
                              >
                                {
                                  audit.entityId
                                }
                              </p>
                            )}
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
                                  audit.branchId ||
                                  "—"}

                              </span>
                            </div>
                          </td>

                          {/* REQUEST ID */}

                          <td className="px-5 py-4">

                            <p
                              title={
                                audit.requestId ||
                                ""
                              }
                              className="max-w-40 truncate font-mono text-xs text-slate-500"
                            >
                              {audit.requestId ||
                                "—"}
                            </p>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                title="View audit details"
                                onClick={() =>
                                  openDetails(
                                    audit
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
            auditLogs.length >
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
                    ({total} logs)
                  </span>
                </p>

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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
        selectedAudit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Audit Log Details
                  </h2>

                  <p className="mt-1 max-w-lg truncate font-mono text-xs text-slate-400">

                    {selectedAudit.id}

                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailsOpen(
                      false
                    );

                    setSelectedAudit(
                      null
                    );
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
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
                <div className="space-y-6 p-6">

                  {/* =======================================
                      SEVERITY + ACTION
                  ======================================== */}

                  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">

                      {(() => {
                        const style =
                          getSeverityStyle(
                            selectedAudit.severity
                          );

                        const Icon =
                          getSeverityIcon(
                            selectedAudit.severity
                          );

                        return (
                          <>
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.icon}`}
                            >
                              <Icon
                                size={23}
                              />
                            </div>

                            <div>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${style.badge}`}
                              >
                                {selectedAudit.severity ||
                                  "INFO"}
                              </span>

                              <p className="mt-2 font-bold text-slate-900">

                                {displayText(
                                  getAction(
                                    selectedAudit
                                  )
                                )}

                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <p className="text-sm font-semibold text-slate-600">

                      {formatDateTime(
                        selectedAudit.createdAt ??
                          selectedAudit.timestamp ??
                          selectedAudit.occurredAt
                      )}

                    </p>
                  </div>

                  {/* =======================================
                      BASIC DETAILS
                  ======================================== */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* ACTOR */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Actor
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <User
                          size={16}
                          className="text-purple-600"
                        />

                        <p className="font-semibold text-slate-800">

                          {getActor(
                            selectedAudit
                          )}

                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">

                        {displayText(
                          getActorRole(
                            selectedAudit
                          )
                        )}

                      </p>
                    </div>

                    {/* MODULE */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Module
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <MonitorCog
                          size={16}
                          className="text-blue-600"
                        />

                        <p className="font-semibold text-slate-800">

                          {displayText(
                            getModule(
                              selectedAudit
                            )
                          )}

                        </p>
                      </div>
                    </div>

                    {/* ACTION */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Action
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <Activity
                          size={16}
                          className="text-emerald-600"
                        />

                        <p className="font-semibold text-slate-800">

                          {displayText(
                            getAction(
                              selectedAudit
                            )
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
                            selectedAudit
                          )?.name ||
                            selectedAudit.branchId ||
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      DESCRIPTION
                  ======================================== */}

                  {getDescription(
                    selectedAudit
                  ) !== "—" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

                      <p className="text-sm font-semibold text-blue-700">
                        Activity Description
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-600">

                        {getDescription(
                          selectedAudit
                        )}

                      </p>
                    </div>
                  )}

                  {/* =======================================
                      ENTITY INFORMATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Entity Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Entity Type
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Database
                            size={16}
                            className="text-blue-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {displayText(
                              selectedAudit.entityType
                            )}

                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Entity ID
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Fingerprint
                            size={16}
                            className="shrink-0 text-purple-600"
                          />

                          <p className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700">

                            {selectedAudit.entityId ||
                              "—"}

                          </p>

                          {selectedAudit.entityId && (
                            <button
                              type="button"
                              title="Copy entity ID"
                              onClick={() =>
                                copyText(
                                  selectedAudit.entityId,
                                  "Entity ID"
                                )
                              }
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Copy
                                size={15}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      REQUEST INFORMATION
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      Request Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                      {/* REQUEST ID */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Request ID
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <p className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">

                            {selectedAudit.requestId ||
                              "—"}

                          </p>

                          {selectedAudit.requestId && (
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  selectedAudit.requestId,
                                  "Request ID"
                                )
                              }
                              className="text-slate-400 hover:text-blue-600"
                            >
                              <Copy
                                size={15}
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* IP */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          IP Address
                        </p>

                        <p className="mt-2 font-mono text-sm font-semibold text-slate-700">

                          {getIpAddress(
                            selectedAudit
                          )}

                        </p>
                      </div>

                      {/* ACTOR ID */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Actor ID
                        </p>

                        <p
                          title={
                            selectedAudit.actorId ||
                            ""
                          }
                          className="mt-2 truncate font-mono text-sm font-semibold text-slate-700"
                        >

                          {selectedAudit.actorId ||
                            "—"}

                        </p>
                      </div>
                    </div>

                    {/* USER AGENT */}

                    {getUserAgent(
                      selectedAudit
                    ) !== "—" && (
                      <div className="mt-4 rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          User Agent
                        </p>

                        <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">

                          {getUserAgent(
                            selectedAudit
                          )}

                        </p>
                      </div>
                    )}
                  </div>

                  {/* =======================================
                      OLD / NEW DATA
                  ======================================== */}

                  {(getOldData(
                    selectedAudit
                  ) !== null ||
                    getNewData(
                      selectedAudit
                    ) !== null) && (
                    <div>

                      <div className="flex items-center gap-2">

                        <FileJson
                          size={18}
                          className="text-blue-600"
                        />

                        <h3 className="font-bold text-slate-900">
                          Data Changes
                        </h3>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">

                        {/* OLD */}

                        <div className="overflow-hidden rounded-xl border border-red-100">

                          <div className="border-b border-red-100 bg-red-50 px-4 py-3">

                            <p className="text-sm font-semibold text-red-700">
                              Previous Data
                            </p>
                          </div>

                          <pre className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-200">

                            {prettyJSON(
                              getOldData(
                                selectedAudit
                              )
                            )}

                          </pre>
                        </div>

                        {/* NEW */}

                        <div className="overflow-hidden rounded-xl border border-emerald-100">

                          <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">

                            <p className="text-sm font-semibold text-emerald-700">
                              New Data
                            </p>
                          </div>

                          <pre className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-200">

                            {prettyJSON(
                              getNewData(
                                selectedAudit
                              )
                            )}

                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =======================================
                      METADATA
                  ======================================== */}

                  {getMetadata(
                    selectedAudit
                  ) !== null && (
                    <div>

                      <div className="flex items-center gap-2">

                        <FileJson
                          size={18}
                          className="text-purple-600"
                        />

                        <h3 className="font-bold text-slate-900">
                          Metadata
                        </h3>
                      </div>

                      <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200">

                        {prettyJSON(
                          getMetadata(
                            selectedAudit
                          )
                        )}

                      </pre>
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

export default AuditLogs;