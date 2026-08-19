import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Plus,
  Search,
  Pencil,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  Users,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// FORM
// ======================================================

const EMPTY_FORM = {
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
};

// ======================================================
// PAGE
// ======================================================

const Branches = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    statusLoadingId,
    setStatusLoadingId,
  ] = useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingBranch, setEditingBranch] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [selectedBranch, setSelectedBranch] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [branchUsers, setBranchUsers] =
    useState([]);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // EXTRACT BRANCHES
  // ====================================================

  const extractBranches = (
    response
  ) => {
    const data =
      response?.data?.data;

    if (Array.isArray(data)) {
      return data;
    }

    return (
      data?.branches ??
      response?.data?.branches ??
      []
    );
  };

  // ====================================================
  // LOAD BRANCHES
  // ====================================================

  const loadBranches =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/branches"
          );

        console.log(
          "Branches Response:",
          response.data
        );

        const branchData =
          extractBranches(
            response
          );

        setBranches(
          Array.isArray(
            branchData
          )
            ? branchData
            : []
        );
      } catch (err) {
        console.error(
          "Branch load error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load branches."
        );

        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadBranches();
  }, []);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredBranches =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return branches.filter(
        (branch) => {
          const matchesSearch =
            !keyword ||
            branch.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            branch.code
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            branch.address
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            branch.phone
              ?.toLowerCase()
              .includes(
                keyword
              ) ||
            branch.email
              ?.toLowerCase()
              .includes(
                keyword
              );

          const matchesStatus =
            !statusFilter ||
            branch.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      branches,
      search,
      statusFilter,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const totalBranches =
    branches.length;

  const activeBranches =
    branches.filter(
      (branch) =>
        branch.status ===
        "ACTIVE"
    ).length;

  const inactiveBranches =
    branches.filter(
      (branch) =>
        branch.status ===
        "INACTIVE"
    ).length;

  // ====================================================
  // USER COUNT
  // ====================================================

  const getUserCount = (
    branch
  ) => {
    if (
      Array.isArray(
        branch?.users
      )
    ) {
      return branch.users.length;
    }

    return (
      branch?._count?.users ??
      branch?.userCount ??
      branch?.totalUsers ??
      0
    );
  };

  // ====================================================
  // TERMINAL COUNT
  // ====================================================

  const getTerminalCount = (
    branch
  ) => {
    if (
      Array.isArray(
        branch?.terminals
      )
    ) {
      return branch
        .terminals.length;
    }

    return (
      branch?._count
        ?.terminals ??
      branch?.terminalCount ??
      branch?.totalTerminals ??
      0
    );
  };

  // ====================================================
  // OPEN CREATE
  // ====================================================

  const openCreateModal = () => {
    setEditingBranch(null);

    setForm(
      EMPTY_FORM
    );

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEditModal = (
    branch
  ) => {
    setEditingBranch(
      branch
    );

    setForm({
      code:
        branch.code || "",

      name:
        branch.name || "",

      address:
        branch.address || "",

      phone:
        branch.phone || "",

      email:
        branch.email || "",
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingBranch(null);

    setForm(
      EMPTY_FORM
    );
  };

  // ====================================================
  // FORM CHANGE
  // ====================================================

  const handleChange = (
    event
  ) => {
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
  // PAYLOAD
  //
  // code/name are the main fields.
  // Optional values are only sent when entered.
  // ====================================================

  const buildPayload =
    () => {
      const payload = {
        code:
          form.code.trim(),

        name:
          form.name.trim(),
      };

      if (
        form.address.trim()
      ) {
        payload.address =
          form.address.trim();
      }

      if (
        form.phone.trim()
      ) {
        payload.phone =
          form.phone.trim();
      }

      if (
        form.email.trim()
      ) {
        payload.email =
          form.email.trim();
      }

      return payload;
    };

  // ====================================================
  // SAVE
  // ====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        if (
          !form.code.trim()
        ) {
          throw new Error(
            "Branch code is required."
          );
        }

        if (
          !form.name.trim()
        ) {
          throw new Error(
            "Branch name is required."
          );
        }

        const payload =
          buildPayload();

        console.log(
          "Branch Payload:",
          payload
        );

        if (
          editingBranch
        ) {
          await api.patch(
            `/branches/${editingBranch.id}`,
            payload
          );

          setSuccess(
            "Branch updated successfully."
          );
        } else {
          await api.post(
            "/branches",
            payload
          );

          setSuccess(
            "Branch created successfully."
          );
        }

        await loadBranches();

        setModalOpen(
          false
        );

        setEditingBranch(
          null
        );

        setForm(
          EMPTY_FORM
        );
      } catch (err) {
        console.error(
          "Branch save error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to save branch."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // STATUS
  // ====================================================

  const handleStatusChange =
    async (
      branch,
      newStatus
    ) => {
      try {
        setStatusLoadingId(
          branch.id
        );

        setError("");
        setSuccess("");

        await api.patch(
          `/branches/${branch.id}/status`,
          {
            status:
              newStatus,
          }
        );

        setBranches(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                branch.id
                  ? {
                      ...item,
                      status:
                        newStatus,
                    }
                  : item
            )
        );

        setSuccess(
          `${branch.name} changed to ${newStatus}.`
        );
      } catch (err) {
        console.error(
          "Branch status error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to update branch status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // ====================================================
  // VIEW DETAILS + USERS
  // ====================================================

  const openDetails =
    async (branch) => {
      try {
        setSelectedBranch(
          branch
        );

        setDetailsOpen(
          true
        );

        setDetailsLoading(
          true
        );

        setBranchUsers([]);

        const response =
          await api.get(
            `/branches/${branch.id}/users`
          );

        console.log(
          "Branch Users:",
          response.data
        );

        const data =
          response.data?.data;

        const users =
          data?.users ??
          data?.branchUsers ??
          (Array.isArray(data)
            ? data
            : []);

        setBranchUsers(
          Array.isArray(users)
            ? users
            : []
        );
      } catch (err) {
        console.error(
          "Branch users error:",
          err.response?.data ||
            err.message
        );

        setBranchUsers([]);
      } finally {
        setDetailsLoading(
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
    };

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (
    value
  ) => {
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

    return new Intl.DateTimeFormat(
      "en-LK",
      {
        dateStyle:
          "medium",
      }
    ).format(date);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ===============================================
            SUCCESS
        ================================================ */}

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

        {/* ===============================================
            ERROR
        ================================================ */}

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

        {/* ===============================================
            HEADER
        ================================================ */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Branches
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage Smart POS
              business branches and
              branch information.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />

            Add Branch
          </button>
        </div>

        {/* ===============================================
            STATS
        ================================================ */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Branches
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalBranches}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2
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
                  {activeBranches}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* INACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Inactive
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {inactiveBranches}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertCircle
                  size={23}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===============================================
            MAIN CARD
        ================================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-slate-200 p-5">

            <div className="flex flex-col gap-3 lg:flex-row">

              <div className="relative flex-1">

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
                  placeholder="Search branch name, code, address..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Status
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

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

          {/* =============================================
              LOADING
          ============================================== */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading branches...
                </p>
              </div>
            </div>
          ) : filteredBranches.length ===
            0 ? (

            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <Building2
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No branches found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create your first
                  branch.
                </p>
              </div>
            </div>
          ) : (

            /* ===========================================
               TABLE
            ============================================ */

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Address
                    </th>

                    <th className="px-5 py-4">
                      Contact
                    </th>

                    <th className="px-5 py-4">
                      Users
                    </th>

                    <th className="px-5 py-4">
                      Terminals
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

                  {filteredBranches.map(
                    (branch) => (
                      <tr
                        key={
                          branch.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* BRANCH */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                              <Building2
                                size={20}
                              />
                            </div>

                            <div>

                              <p className="font-semibold text-slate-800">
                                {branch.name ||
                                  "Unnamed Branch"}
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-400">
                                {branch.code ||
                                  "No code"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ADDRESS */}

                        <td className="px-5 py-4">

                          <div className="flex max-w-64 items-start gap-2">

                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            <span className="text-sm text-slate-600">
                              {branch.address ||
                                "—"}
                            </span>
                          </div>
                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">

                          <div className="space-y-1.5">

                            {branch.phone ? (
                              <div className="flex items-center gap-2 text-sm text-slate-600">

                                <Phone
                                  size={14}
                                  className="text-slate-400"
                                />

                                {
                                  branch.phone
                                }
                              </div>
                            ) : null}

                            {branch.email ? (
                              <div className="flex items-center gap-2 text-sm text-slate-600">

                                <Mail
                                  size={14}
                                  className="text-slate-400"
                                />

                                {
                                  branch.email
                                }
                              </div>
                            ) : null}

                            {!branch.phone &&
                              !branch.email && (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                          </div>
                        </td>

                        {/* USERS */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">

                            <Users
                              size={16}
                              className="text-slate-400"
                            />

                            {getUserCount(
                              branch
                            )}
                          </div>
                        </td>

                        {/* TERMINALS */}

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">

                            {getTerminalCount(
                              branch
                            )}{" "}
                            Terminal
                            {getTerminalCount(
                              branch
                            ) === 1
                              ? ""
                              : "s"}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                          {formatDate(
                            branch.createdAt
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <select
                            value={
                              branch.status ||
                              "ACTIVE"
                            }
                            disabled={
                              statusLoadingId ===
                              branch.id
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                branch,
                                e.target
                                  .value
                              )
                            }
                            className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none ${
                              branch.status ===
                              "INACTIVE"
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <option value="ACTIVE">
                              ACTIVE
                            </option>

                            <option value="INACTIVE">
                              INACTIVE
                            </option>
                          </select>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              title="View branch"
                              onClick={() =>
                                openDetails(
                                  branch
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              title="Edit branch"
                              onClick={() =>
                                openEditModal(
                                  branch
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil
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
        </div>
      </div>

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">

                  {editingBranch
                    ? "Edit Branch"
                    : "Add Branch"}

                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter branch
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* CODE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Branch Code *
                  </label>

                  <input
                    type="text"
                    name="code"
                    value={
                      form.code
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="COL001"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Branch Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Colombo Main"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0112345678"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="colombo@smartpos.lk"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* ADDRESS */}

              <div className="mt-5">

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address
                </label>

                <textarea
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  placeholder="Enter branch address..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* BUTTONS */}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-6">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingBranch
                    ? "Update Branch"
                    : "Create Branch"}
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
        selectedBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <Building2
                      size={21}
                    />
                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {
                        selectedBranch.name
                      }
                    </h2>

                    <p className="text-sm text-slate-500">
                      {selectedBranch.code ||
                        "Branch Details"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDetailsOpen(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="p-6">

                {/* DETAILS */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Branch Code
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedBranch.code ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Status
                    </p>

                    <p
                      className={`mt-2 font-semibold ${
                        selectedBranch.status ===
                        "INACTIVE"
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {selectedBranch.status ||
                        "ACTIVE"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Phone
                    </p>

                    <p className="mt-2 text-sm text-slate-700">
                      {selectedBranch.phone ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">
                      Email
                    </p>

                    <p className="mt-2 text-sm text-slate-700">
                      {selectedBranch.email ||
                        "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Address
                  </p>

                  <p className="mt-2 text-sm text-slate-700">
                    {selectedBranch.address ||
                      "—"}
                  </p>
                </div>

                {/* USERS */}

                <div className="mt-7">

                  <div className="mb-4 flex items-center justify-between">

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Branch Users
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Users assigned
                        to this branch.
                      </p>
                    </div>

                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                      {branchUsers.length}
                    </span>
                  </div>

                  {detailsLoading ? (
                    <div className="flex justify-center py-10">

                      <Loader2
                        size={28}
                        className="animate-spin text-blue-600"
                      />
                    </div>
                  ) : branchUsers.length ===
                    0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">

                      <Users
                        size={28}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm text-slate-400">
                        No users assigned
                        to this branch.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">

                      <table className="w-full">

                        <thead className="bg-slate-50">

                          <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                            <th className="px-4 py-3">
                              Employee
                            </th>

                            <th className="px-4 py-3">
                              Role
                            </th>

                            <th className="px-4 py-3">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                          {branchUsers.map(
                            (
                              user
                            ) => (
                              <tr
                                key={
                                  user.id
                                }
                              >

                                <td className="px-4 py-3">

                                  <p className="text-sm font-semibold text-slate-700">

                                    {[
                                      user.firstName,
                                      user.lastName,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        " "
                                      ) ||
                                      user.name ||
                                      user.employeeId ||
                                      "User"}

                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {user.employeeId ||
                                      user.email ||
                                      "—"}
                                  </p>
                                </td>

                                <td className="px-4 py-3">

                                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                    {user.role ||
                                      "—"}
                                  </span>
                                </td>

                                <td className="px-4 py-3">

                                  <span
                                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                                      user.status ===
                                      "ACTIVE"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-red-50 text-red-600"
                                    }`}
                                  >
                                    {user.status ||
                                      "—"}
                                  </span>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default Branches;