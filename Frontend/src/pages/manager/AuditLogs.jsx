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
  History,
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
        timeStyle: "medium",
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
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

// ======================================================
// SEVERITY STYLE
// ======================================================

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

// ======================================================
// SEVERITY ICON
// ======================================================

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

// ======================================================
// SAFE JSON
// ======================================================

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

// ======================================================
// PRETTY JSON
// ======================================================

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
// STORED USER
// ======================================================

const getStoredUser = () => {
  try {
    const raw =
      localStorage.getItem(
        "user"
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ======================================================
// PAGE
// ======================================================

const AuditLogs = () => {
  // ====================================================
  // USER
  // ====================================================

  const managerUser =
    useMemo(
      () => getStoredUser(),
      []
    );

  const managerBranchId =
    managerUser?.branchId ??
    managerUser?.branch?.id ??
    null;

  const managerBranchName =
    managerUser?.branch?.name ??
    managerUser?.branchName ??
    "Assigned Branch";

  // ====================================================
  // DATA
  // ====================================================

  const [
    auditLogs,
    setAuditLogs,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState(null);

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
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

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
    actorIdFilter,
    setActorIdFilter,
  ] = useState("");

  const [
    entityIdFilter,
    setEntityIdFilter,
  ] = useState("");

  const [
    requestIdFilter,
    setRequestIdFilter,
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
  // DETAIL
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
  // ENTITY HISTORY
  // ====================================================

  const [
    entityHistory,
    setEntityHistory,
  ] = useState([]);

  const [
    historyLoaded,
    setHistoryLoaded,
  ] = useState(false);

  // ====================================================
  // QUERY PARAMS
  //
  // Exact backend query schema:
  //
  // branchId
  // actorId
  // module
  // action
  // severity
  // entityType
  // entityId
  // requestId
  // search
  // startDate
  // endDate
  // page
  // limit
  // ====================================================

  const getParams = () => {
    const params = {
      page,
      limit,
    };

    if (search) {
      params.search =
        search;
    }

    if (branchFilter) {
      params.branchId =
        branchFilter;
    }

    if (actorIdFilter) {
      params.actorId =
        actorIdFilter.trim();
    }

    if (moduleFilter) {
      params.module =
        moduleFilter.trim();
    }

    if (actionFilter) {
      params.action =
        actionFilter.trim();
    }

    if (severityFilter) {
      params.severity =
        severityFilter;
    }

    if (entityTypeFilter) {
      params.entityType =
        entityTypeFilter.trim();
    }

    if (entityIdFilter) {
      params.entityId =
        entityIdFilter.trim();
    }

    if (requestIdFilter) {
      params.requestId =
        requestIdFilter.trim();
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
  // FETCH AUDIT LOGS
  //
  // GET /audits
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
          "Manager Audit Logs:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.auditLogs ??
          result.logs ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        const safeLogs =
          Array.isArray(data)
            ? data
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

        const rawTotal =
          Number(
            pagination.total ??
              result.total ??
              result.count ??
              response.data
                ?.count ??
              safeLogs.length
          );

        const safeTotal =
          Number.isFinite(
            rawTotal
          )
            ? rawTotal
            : safeLogs.length;

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
  // SUMMARY
  //
  // GET /audits/summary
  //
  // Summary supports:
  // branchId
  // startDate
  // endDate
  // ====================================================

  const fetchSummary =
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
          "Manager Audit Summary:",
          response.data
        );

        const data =
          response.data?.data
            ?.summary ??
          response.data?.data ??
          null;

        setSummary(data);
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
  // LOAD
  // ====================================================

  useEffect(() => {
    fetchAuditLogs();
  }, [
    page,
    limit,
    search,
    branchFilter,
    severityFilter,
    moduleFilter,
    actionFilter,
    entityTypeFilter,
    actorIdFilter,
    entityIdFilter,
    requestIdFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchSummary();
  }, [
    branchFilter,
    startDate,
    endDate,
  ]);

  // ====================================================
  // ACTOR
  // ====================================================

  const getActorObject = (
    audit
  ) => {
    return (
      audit?.actor ??
      audit?.user ??
      audit?.performedBy ??
      audit?.createdBy ??
      null
    );
  };

  // ====================================================
  // ACTOR NAME
  // ====================================================

  const getActorName = (
    audit
  ) => {
    const actor =
      getActorObject(audit);

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
      audit?.performedBy
        ?.role ??
      audit?.actorRole ??
      "—"
    );
  };

  // ====================================================
  // ACTOR ID
  // ====================================================

  const getActorId = (
    audit
  ) => {
    return (
      audit?.actorId ??
      getActorObject(audit)?.id ??
      null
    );
  };

  // ====================================================
  // BRANCH
  // ====================================================

  const getBranch = (
    audit
  ) => {
    return (
      audit?.branch ??
      audit?.actor?.branch ??
      audit?.user?.branch ??
      null
    );
  };

  // ====================================================
  // BRANCH ID
  // ====================================================

  const getBranchId = (
    audit
  ) => {
    return (
      audit?.branchId ??
      getBranch(audit)?.id ??
      null
    );
  };

  // ====================================================
  // BRANCH NAME
  // ====================================================

  const getBranchName = (
    audit
  ) => {
    const branch =
      getBranch(audit);

    if (branch?.name) {
      return branch.name;
    }

    if (branch?.code) {
      return branch.code;
    }

    const branchId =
      getBranchId(audit);

    if (
      branchId &&
      managerBranchId &&
      branchId ===
        managerBranchId
    ) {
      return managerBranchName;
    }

    return (
      audit?.branchName ??
      (branchId
        ? "Branch"
        : "System")
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
  // IP
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
  // OLD DATA
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

  // ====================================================
  // NEW DATA
  // ====================================================

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

  // ====================================================
  // METADATA
  // ====================================================

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
  // BRANCH OPTIONS
  //
  // Manager page intentionally does NOT call /branches.
  // Build branch list from audit response + logged user.
  // ====================================================

  const branchOptions =
    useMemo(() => {
      const map =
        new Map();

      if (managerBranchId) {
        map.set(
          managerBranchId,
          {
            id:
              managerBranchId,

            name:
              managerBranchName,
          }
        );
      }

      auditLogs.forEach(
        (audit) => {
          const id =
            getBranchId(audit);

          if (!id) {
            return;
          }

          map.set(
            id,
            {
              id,

              name:
                getBranchName(
                  audit
                ),
            }
          );
        }
      );

      return Array.from(
        map.values()
      ).sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name)
        )
      );
    }, [
      auditLogs,
      managerBranchId,
      managerBranchName,
    ]);

  // ====================================================
  // MODULE OPTIONS
  // ====================================================

  const moduleOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs
            .map((audit) =>
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
            .map((audit) =>
              audit?.action
            )
            .filter(Boolean)
        )
      ).sort();
    }, [auditLogs]);

  // ====================================================
  // ENTITY OPTIONS
  // ====================================================

  const entityOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          auditLogs
            .map((audit) =>
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
  // SUMMARY VALUE
  // ====================================================

  const getSummaryValue = (
    keys,
    fallback = 0
  ) => {
    if (
      !summary ||
      typeof summary !==
        "object"
    ) {
      return fallback;
    }

    for (const key of keys) {
      const direct =
        summary?.[key];

      if (
        direct !== undefined &&
        direct !== null &&
        Number.isFinite(
          Number(direct)
        )
      ) {
        return Number(direct);
      }

      const bySeverity =
        summary?.bySeverity?.[
          key
        ];

      if (
        bySeverity !==
          undefined &&
        bySeverity !==
          null &&
        Number.isFinite(
          Number(bySeverity)
        )
      ) {
        return Number(
          bySeverity
        );
      }

      const severityCounts =
        summary
          ?.severityCounts?.[
          key
        ];

      if (
        severityCounts !==
          undefined &&
        severityCounts !==
          null &&
        Number.isFinite(
          Number(
            severityCounts
          )
        )
      ) {
        return Number(
          severityCounts
        );
      }
    }

    return fallback;
  };

  // ====================================================
  // SUMMARY
  // ====================================================

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
        "INFO",
        "info",
        "infoCount",
      ],
      pageInfoCount
    );

  const summaryWarning =
    getSummaryValue(
      [
        "WARNING",
        "warning",
        "warningCount",
      ],
      pageWarningCount
    );

  const summaryCritical =
    getSummaryValue(
      [
        "CRITICAL",
        "critical",
        "criticalCount",
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
  // DATE
  // ====================================================

  const handleStartDate = (
    value
  ) => {
    if (
      endDate &&
      value &&
      new Date(value) >
        new Date(endDate)
    ) {
      setError(
        "Start date cannot be after end date."
      );

      return;
    }

    setError("");
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
  // RESET
  // ====================================================

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");

    setBranchFilter("");
    setSeverityFilter("");
    setModuleFilter("");
    setActionFilter("");
    setEntityTypeFilter("");

    setActorIdFilter("");
    setEntityIdFilter("");
    setRequestIdFilter("");

    setStartDate("");
    setEndDate("");

    setPage(1);
  };

  // ====================================================
  // OPEN DETAIL
  //
  // GET /audits/:id
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

        setHistoryLoaded(
          false
        );

        setEntityHistory([]);

        setError("");

        const response =
          await api.get(
            `/audits/${audit.id}`
          );

        console.log(
          "Manager Audit Detail:",
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
  // CLOSE DETAIL
  // ====================================================

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedAudit(null);

    setEntityHistory([]);
    setHistoryLoaded(false);
  };

  // ====================================================
  // ENTITY HISTORY
  //
  // GET /audits/entity/:entityType/:entityId
  // ====================================================

  const loadEntityHistory =
    async () => {
      if (
        !selectedAudit
          ?.entityType ||
        !selectedAudit
          ?.entityId
      ) {
        setError(
          "Entity information is not available for this audit log."
        );

        return;
      }

      try {
        setHistoryLoading(
          true
        );

        setError("");

        const entityType =
          encodeURIComponent(
            selectedAudit.entityType
          );

        const entityId =
          encodeURIComponent(
            selectedAudit.entityId
          );

        const response =
          await api.get(
            `/audits/entity/${entityType}/${entityId}`,
            {
              params: {
                page: 1,
                limit: 20,
              },
            }
          );

        console.log(
          "Entity Audit History:",
          response.data
        );

        const result =
          response.data?.data ??
          {};

        const data =
          result.auditLogs ??
          result.logs ??
          result.history ??
          result.items ??
          result.rows ??
          (Array.isArray(result)
            ? result
            : []);

        setEntityHistory(
          Array.isArray(data)
            ? data
            : []
        );

        setHistoryLoaded(
          true
        );
      } catch (err) {
        console.error(
          "Entity history error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load entity audit history."
        );

        setEntityHistory([]);

        setHistoryLoaded(
          true
        );
      } finally {
        setHistoryLoading(
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
      if (
        value === undefined ||
        value === null
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          typeof value ===
            "string"
            ? value
            : prettyJSON(value)
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
              Monitor user actions,
              system activity and
              important security
              events.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              fetchAuditLogs();
              fetchSummary();
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
            MANAGER BRANCH
        ================================================= */}

        {managerBranchId && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

            <Building2
              size={18}
              className="shrink-0 text-blue-600"
            />

            <div>

              <p className="text-sm font-semibold text-blue-800">
                Manager Branch
              </p>

              <p className="mt-0.5 text-xs text-blue-600">
                Logged-in manager
                branch:{" "}
                {managerBranchName}
              </p>
            </div>
          </div>
        )}

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
              FILTERS
          ================================================= */}

          <div className="space-y-4 border-b border-slate-200 p-5">

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
                  maxLength={150}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
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

              {/* SEVERITY */}

              <select
                value={
                  severityFilter
                }
                onChange={(event) => {
                  setSeverityFilter(
                    event.target.value
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
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
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >

                <RotateCcw
                  size={16}
                />

                Reset
              </button>
            </div>

            {/* ROW 2 */}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

              {/* MODULE */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Module
                </label>

                <input
                  type="text"
                  list="manager-audit-modules"
                  value={
                    moduleFilter
                  }
                  maxLength={100}
                  onChange={(event) => {
                    setModuleFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="e.g. SALES"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />

                <datalist id="manager-audit-modules">

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

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Action
                </label>

                <input
                  type="text"
                  list="manager-audit-actions"
                  value={
                    actionFilter
                  }
                  maxLength={100}
                  onChange={(event) => {
                    setActionFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="e.g. CREATE"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />

                <datalist id="manager-audit-actions">

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

              {/* ENTITY TYPE */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Entity Type
                </label>

                <input
                  type="text"
                  list="manager-audit-entities"
                  value={
                    entityTypeFilter
                  }
                  maxLength={100}
                  onChange={(event) => {
                    setEntityTypeFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="e.g. PRODUCT"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />

                <datalist id="manager-audit-entities">

                  {entityOptions.map(
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
            </div>

            {/* ROW 3 */}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

              {/* ACTOR */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Actor ID
                </label>

                <input
                  type="text"
                  value={
                    actorIdFilter
                  }
                  onChange={(event) => {
                    setActorIdFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="User UUID"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* ENTITY ID */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Entity ID
                </label>

                <input
                  type="text"
                  value={
                    entityIdFilter
                  }
                  maxLength={150}
                  onChange={(event) => {
                    setEntityIdFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="Entity ID"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* REQUEST ID */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Request ID
                </label>

                <input
                  type="text"
                  value={
                    requestIdFilter
                  }
                  maxLength={150}
                  onChange={(event) => {
                    setRequestIdFilter(
                      event.target.value
                    );

                    setPage(1);
                  }}
                  placeholder="HTTP request ID"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* ROW 4 DATE */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* START */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Start Date
                </label>

                <div className="relative">

                  <CalendarDays
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    max={
                      endDate ||
                      undefined
                    }
                    onChange={(event) =>
                      handleStartDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* END */}

              <div>

                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  End Date
                </label>

                <div className="relative">

                  <CalendarDays
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    min={
                      startDate ||
                      undefined
                    }
                    onChange={(event) =>
                      handleEndDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
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
                  size={34}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading audit logs...
                </p>
              </div>
            </div>
          ) : auditLogs.length ===
            0 ? (
            /* =================================================
                EMPTY
            ================================================= */

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
                  Try changing the
                  selected filters.
                </p>
              </div>
            </div>
          ) : (
            /* =================================================
                TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1450px]">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Date & Time
                    </th>

                    <th className="px-5 py-4">
                      Severity
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
                      Description
                    </th>

                    <th className="px-5 py-4">
                      IP Address
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

                      return (
                        <tr
                          key={
                            audit.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-4">

                            <div className="flex items-center gap-2">

                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="text-sm text-slate-600">

                                {formatDateTime(
                                  audit.createdAt ??
                                    audit.timestamp ??
                                    audit.date
                                )}

                              </span>
                            </div>
                          </td>

                          {/* SEVERITY */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${style.badge}`}
                            >

                              <SeverityIcon
                                size={13}
                              />

                              {audit.severity ??
                                "INFO"}

                            </span>
                          </td>

                          {/* ACTOR */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">

                                <User
                                  size={14}
                                />
                              </div>

                              <div className="min-w-0">

                                <p className="max-w-44 truncate text-sm font-semibold text-slate-700">

                                  {getActorName(
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

                            <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">

                              {displayText(
                                getModule(
                                  audit
                                )
                              )}

                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Activity
                                size={15}
                                className="text-purple-500"
                              />

                              <span className="whitespace-nowrap text-sm font-semibold text-slate-700">

                                {displayText(
                                  getAction(
                                    audit
                                  )
                                )}

                              </span>
                            </div>
                          </td>

                          {/* ENTITY */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-700">

                              {displayText(
                                audit.entityType
                              )}

                            </p>

                            <p
                              title={
                                audit.entityId ??
                                ""
                              }
                              className="mt-1 max-w-40 truncate font-mono text-xs text-slate-400"
                            >

                              {audit.entityId ??
                                "—"}

                            </p>
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
                                  audit
                                )}

                              </span>
                            </div>
                          </td>

                          {/* DESCRIPTION */}

                          <td className="px-5 py-4">

                            <p
                              title={
                                getDescription(
                                  audit
                                )
                              }
                              className="max-w-72 truncate text-sm text-slate-600"
                            >

                              {getDescription(
                                audit
                              )}

                            </p>
                          </td>

                          {/* IP */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <MonitorCog
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="whitespace-nowrap font-mono text-xs text-slate-500">

                                {getIpAddress(
                                  audit
                                )}

                              </span>
                            </div>
                          </td>

                          {/* VIEW */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                title="View Audit Log"
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

                  {/* LIMIT */}

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

                  {/* PREVIOUS */}

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  {/* CURRENT */}

                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">

                    {page}

                  </span>

                  {/* NEXT */}

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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
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
        selectedAudit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* ===========================================
                  HEADER
              ============================================ */}

              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Audit Log Details
                  </h2>

                  <p className="mt-1 max-w-xl truncate font-mono text-xs text-slate-400">

                    {selectedAudit.id}

                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
                >

                  <X
                    size={21}
                  />
                </button>
              </div>

              {/* ===========================================
                  LOADING
              ============================================ */}

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
                      SUMMARY
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
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
                          >
                            <Icon
                              size={22}
                            />
                          </div>
                        );
                      })()}

                      <div>

                        <p className="text-lg font-bold text-slate-900">

                          {displayText(
                            getAction(
                              selectedAudit
                            )
                          )}

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                          {displayText(
                            getModule(
                              selectedAudit
                            )
                          )}

                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          getSeverityStyle(
                            selectedAudit.severity
                          ).badge
                        }`}
                      >

                        {selectedAudit.severity ??
                          "INFO"}

                      </span>

                      <p className="text-sm font-semibold text-slate-600">

                        {formatDateTime(
                          selectedAudit.createdAt ??
                            selectedAudit.timestamp
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      DESCRIPTION
                  ======================================== */}

                  <div className="rounded-xl border border-slate-200 p-5">

                    <div className="flex items-start gap-3">

                      <Activity
                        size={19}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <div>

                        <p className="font-semibold text-slate-800">
                          Activity Description
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                          {getDescription(
                            selectedAudit
                          )}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      ACTOR
                  ======================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900">
                      User Information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      {/* USER */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Actor
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <User
                            size={16}
                            className="text-purple-600"
                          />

                          <p className="text-sm font-semibold text-slate-800">

                            {getActorName(
                              selectedAudit
                            )}

                          </p>
                        </div>
                      </div>

                      {/* ROLE */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Actor Role
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-800">

                          {displayText(
                            getActorRole(
                              selectedAudit
                            )
                          )}

                        </p>
                      </div>

                      {/* BRANCH */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Branch
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Building2
                            size={16}
                            className="text-blue-600"
                          />

                          <p className="text-sm font-semibold text-slate-800">

                            {getBranchName(
                              selectedAudit
                            )}

                          </p>
                        </div>
                      </div>

                      {/* ACTOR ID */}

                      <div className="rounded-xl bg-slate-50 p-4">

                        <div className="flex items-center justify-between gap-2">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Actor ID
                          </p>

                          {getActorId(
                            selectedAudit
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  getActorId(
                                    selectedAudit
                                  ),
                                  "Actor ID"
                                )
                              }
                              className="text-slate-400 hover:text-blue-600"
                            >
                              <Copy
                                size={14}
                              />
                            </button>
                          )}
                        </div>

                        <p className="mt-2 break-all font-mono text-xs text-slate-600">

                          {getActorId(
                            selectedAudit
                          ) ??
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      ENTITY
                  ======================================== */}

                  <div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          Entity Information
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Resource affected by
                          this activity.
                        </p>
                      </div>

                      {selectedAudit.entityType &&
                        selectedAudit.entityId && (
                        <button
                          type="button"
                          disabled={
                            historyLoading
                          }
                          onClick={
                            loadEntityHistory
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
                        >

                          {historyLoading ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <History
                              size={16}
                            />
                          )}

                          Load Entity History
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                      {/* TYPE */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Entity Type
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <Database
                            size={16}
                            className="text-purple-600"
                          />

                          <p className="font-semibold text-slate-800">

                            {displayText(
                              selectedAudit.entityType
                            )}

                          </p>
                        </div>
                      </div>

                      {/* ENTITY ID */}

                      <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">

                        <div className="flex items-center justify-between gap-3">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Entity ID
                          </p>

                          {selectedAudit.entityId && (
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  selectedAudit.entityId,
                                  "Entity ID"
                                )
                              }
                              className="text-slate-400 transition hover:text-blue-600"
                            >
                              <Copy
                                size={14}
                              />
                            </button>
                          )}
                        </div>

                        <p className="mt-2 break-all font-mono text-xs text-slate-600">

                          {selectedAudit.entityId ??
                            "—"}

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =======================================
                      ENTITY HISTORY
                  ======================================== */}

                  {historyLoaded && (
                    <div>

                      <div className="flex items-center justify-between">

                        <div>

                          <h3 className="font-bold text-slate-900">
                            Entity Audit History
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Recent activity for
                            the same entity.
                          </p>
                        </div>

                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">

                          {entityHistory.length} logs

                        </span>
                      </div>

                      {entityHistory.length ===
                      0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-300 py-10 text-center">

                          <History
                            size={28}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-3 text-sm text-slate-400">
                            No additional entity
                            history found.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">

                          {entityHistory.map(
                            (
                              history,
                              index
                            ) => {
                              const style =
                                getSeverityStyle(
                                  history.severity
                                );

                              return (
                                <div
                                  key={
                                    history.id ??
                                    index
                                  }
                                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                                >

                                  <div className="flex min-w-0 items-start gap-3">

                                    <div
                                      className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                                        history.severity ===
                                        "CRITICAL"
                                          ? "bg-red-500"
                                          : history.severity ===
                                            "WARNING"
                                          ? "bg-amber-500"
                                          : "bg-blue-500"
                                      }`}
                                    />

                                    <div className="min-w-0">

                                      <div className="flex flex-wrap items-center gap-2">

                                        <p className="font-semibold text-slate-800">

                                          {displayText(
                                            getAction(
                                              history
                                            )
                                          )}

                                        </p>

                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
                                        >
                                          {history.severity ??
                                            "INFO"}
                                        </span>
                                      </div>

                                      <p className="mt-1 max-w-2xl truncate text-sm text-slate-500">

                                        {getDescription(
                                          history
                                        )}

                                      </p>
                                    </div>
                                  </div>

                                  <div className="shrink-0 md:text-right">

                                    <p className="text-sm font-semibold text-slate-600">

                                      {getActorName(
                                        history
                                      )}

                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">

                                      {formatDateTime(
                                        history.createdAt
                                      )}

                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  )}

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

                        <div className="flex items-center justify-between gap-3">

                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Request ID
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
                                size={14}
                              />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 flex items-start gap-2">

                          <Fingerprint
                            size={15}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />

                          <p className="break-all font-mono text-xs text-slate-600">

                            {selectedAudit.requestId ??
                              "—"}

                          </p>
                        </div>
                      </div>

                      {/* IP */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          IP Address
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <MonitorCog
                            size={15}
                            className="text-purple-600"
                          />

                          <p className="font-mono text-sm font-semibold text-slate-700">

                            {getIpAddress(
                              selectedAudit
                            )}

                          </p>
                        </div>
                      </div>

                      {/* CREATED */}

                      <div className="rounded-xl border border-slate-200 p-4">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Timestamp
                        </p>

                        <div className="mt-2 flex items-center gap-2">

                          <CalendarDays
                            size={15}
                            className="text-emerald-600"
                          />

                          <p className="text-sm font-semibold text-slate-700">

                            {formatDateTime(
                              selectedAudit.createdAt
                            )}

                          </p>
                        </div>
                      </div>
                    </div>

                    {/* USER AGENT */}

                    <div className="mt-4 rounded-xl border border-slate-200 p-4">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-xs font-semibold uppercase text-slate-400">
                          User Agent
                        </p>

                        {getUserAgent(
                          selectedAudit
                        ) !== "—" && (
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                getUserAgent(
                                  selectedAudit
                                ),
                                "User Agent"
                              )
                            }
                            className="text-slate-400 hover:text-blue-600"
                          >
                            <Copy
                              size={14}
                            />
                          </button>
                        )}
                      </div>

                      <p className="mt-2 break-all text-sm leading-6 text-slate-600">

                        {getUserAgent(
                          selectedAudit
                        )}

                      </p>
                    </div>
                  </div>

                  {/* =======================================
                      DATA CHANGES
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
                          size={19}
                          className="text-blue-600"
                        />

                        <h3 className="font-bold text-slate-900">
                          Data Changes
                        </h3>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">

                        {/* OLD */}

                        <JsonPanel
                          title="Before / Old Data"
                          value={getOldData(
                            selectedAudit
                          )}
                          type="old"
                          onCopy={() =>
                            copyText(
                              getOldData(
                                selectedAudit
                              ),
                              "Old Data"
                            )
                          }
                        />

                        {/* NEW */}

                        <JsonPanel
                          title="After / New Data"
                          value={getNewData(
                            selectedAudit
                          )}
                          type="new"
                          onCopy={() =>
                            copyText(
                              getNewData(
                                selectedAudit
                              ),
                              "New Data"
                            )
                          }
                        />
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

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                          <Database
                            size={19}
                            className="text-purple-600"
                          />

                          <h3 className="font-bold text-slate-900">
                            Metadata
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              getMetadata(
                                selectedAudit
                              ),
                              "Metadata"
                            )
                          }
                          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >

                          <Copy
                            size={14}
                          />

                          Copy
                        </button>
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

                  {/* =======================================
                      AUDIT ID
                  ======================================== */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center justify-between gap-3">

                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Audit Log ID
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            selectedAudit.id,
                            "Audit Log ID"
                          )
                        }
                        className="text-slate-400 transition hover:text-blue-600"
                      >

                        <Copy
                          size={14}
                        />
                      </button>
                    </div>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">

                      {selectedAudit.id ??
                        "—"}

                    </p>
                  </div>

                  {/* =======================================
                      READ ONLY
                  ======================================== */}

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                    <div className="flex gap-3">

                      <Info
                        size={19}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <div>

                        <p className="font-semibold text-blue-700">
                          Read-only Audit Record
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-600">
                          Audit records are
                          system-generated.
                          Manager can inspect
                          logs and entity
                          history, but this
                          page does not modify
                          audit records.
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

// ======================================================
// JSON PANEL
// ======================================================

const JsonPanel = ({
  title,
  value,
  type,
  onCopy,
}) => {
  const isOld =
    type === "old";

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        isOld
          ? "border-red-200"
          : "border-emerald-200"
      }`}
    >

      <div
        className={`flex items-center justify-between px-4 py-3 ${
          isOld
            ? "bg-red-50"
            : "bg-emerald-50"
        }`}
      >

        <p
          className={`text-sm font-semibold ${
            isOld
              ? "text-red-700"
              : "text-emerald-700"
          }`}
        >
          {title}
        </p>

        {value !== null && (
          <button
            type="button"
            onClick={onCopy}
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              isOld
                ? "text-red-600"
                : "text-emerald-600"
            }`}
          >
            <Copy size={13} />

            Copy
          </button>
        )}
      </div>

      <pre className="max-h-96 min-h-40 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-200">

        {prettyJSON(value)}

      </pre>
    </div>
  );
};

export default AuditLogs;