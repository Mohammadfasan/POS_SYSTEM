import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Monitor,
  Plus,
  Search,
  Pencil,
  MapPin,
  Building2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

import api from "../../api/axios";

const EMPTY_FORM = {
  code: "",
  name: "",
  location: "",
  branchId: "",
};

const Terminals = () => {
  // ==========================================
  // STATE
  // ==========================================

  const [terminals, setTerminals] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [branchFilter, setBranchFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [statusLoadingId, setStatusLoadingId] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingTerminal, setEditingTerminal] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // GET TERMINALS + BRANCHES
  // ==========================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        terminalResponse,
        branchResponse,
      ] = await Promise.all([
        api.get("/terminals"),
        api.get("/branches"),
      ]);

      console.log(
        "Terminal Response:",
        terminalResponse.data
      );

      console.log(
        "Branch Response:",
        branchResponse.data
      );

      // TERMINALS

      const terminalData =
        terminalResponse.data?.data?.terminals ??
        terminalResponse.data?.terminals ??
        [];

      setTerminals(
        Array.isArray(terminalData)
          ? terminalData
          : []
      );

      // BRANCHES

      const branchData =
        branchResponse.data?.data?.branches ??
        branchResponse.data?.branches ??
        [];

      setBranches(
        Array.isArray(branchData)
          ? branchData
          : []
      );
    } catch (error) {
      console.error(
        "Terminal page load error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to load terminal data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // GET BRANCH
  // ==========================================

  const getBranch = (terminal) => {
    if (terminal?.branch) {
      return terminal.branch;
    }

    return branches.find(
      (branch) =>
        branch.id === terminal?.branchId
    );
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filteredTerminals =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return terminals.filter(
        (terminal) => {
          const branch =
            terminal.branch ||
            branches.find(
              (item) =>
                item.id === terminal.branchId
            );

          const matchesSearch =
            !keyword ||
            terminal.code
              ?.toLowerCase()
              .includes(keyword) ||
            terminal.name
              ?.toLowerCase()
              .includes(keyword) ||
            terminal.location
              ?.toLowerCase()
              .includes(keyword) ||
            branch?.name
              ?.toLowerCase()
              .includes(keyword);

          const matchesBranch =
            !branchFilter ||
            terminal.branchId ===
              branchFilter ||
            branch?.id === branchFilter;

          const matchesStatus =
            !statusFilter ||
            terminal.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesBranch &&
            matchesStatus
          );
        }
      );
    }, [
      terminals,
      branches,
      search,
      branchFilter,
      statusFilter,
    ]);

  // ==========================================
  // CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setEditingTerminal(null);

    setForm(EMPTY_FORM);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ==========================================
  // EDIT MODAL
  // ==========================================

  const openEditModal = (terminal) => {
    setEditingTerminal(terminal);

    setForm({
      code: terminal.code || "",

      name: terminal.name || "",

      location:
        terminal.location || "",

      branchId:
        terminal.branchId ||
        terminal.branch?.id ||
        "",
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingTerminal(null);

    setForm(EMPTY_FORM);
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        name === "code"
          ? value.toUpperCase()
          : value,
    }));
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // EDIT TERMINAL
      if (editingTerminal) {
        const payload = {
          code: form.code.trim(),

          name: form.name.trim(),

          location:
            form.location.trim() ||
            undefined,
        };

        await api.patch(
          `/terminals/${editingTerminal.id}`,
          payload
        );

        setSuccess(
          "Terminal updated successfully."
        );
      }

      // CREATE TERMINAL
      else {
        if (!form.branchId) {
          throw new Error(
            "Please select a branch."
          );
        }

        const payload = {
          code: form.code.trim(),

          name: form.name.trim(),

          location:
            form.location.trim() ||
            undefined,

          branchId:
            form.branchId,
        };

        await api.post(
          "/terminals",
          payload
        );

        setSuccess(
          "Terminal created successfully."
        );
      }

      await fetchData();

      setModalOpen(false);
      setEditingTerminal(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(
        "Terminal save error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save terminal."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // STATUS CHANGE
  // ==========================================

  const handleStatusChange =
    async (terminal, newStatus) => {
      try {
        setStatusLoadingId(
          terminal.id
        );

        setError("");
        setSuccess("");

        await api.patch(
          `/terminals/${terminal.id}/status`,
          {
            status: newStatus,
          }
        );

        setTerminals((current) =>
          current.map((item) =>
            item.id === terminal.id
              ? {
                  ...item,
                  status: newStatus,
                }
              : item
          )
        );

        setSuccess(
          `${terminal.name} status changed to ${newStatus}.`
        );
      } catch (error) {
        console.error(
          "Terminal status error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Unable to update terminal status."
        );
      } finally {
        setStatusLoadingId(null);
      }
    };

  // ==========================================
  // RESET FILTER
  // ==========================================

  const resetFilters = () => {
    setSearch("");
    setBranchFilter("");
    setStatusFilter("");
  };

  // ==========================================
  // STATS
  // ==========================================

  const totalTerminals =
    terminals.length;

  const activeTerminals =
    terminals.filter(
      (terminal) =>
        terminal.status === "ACTIVE"
    ).length;

  const inactiveTerminals =
    terminals.filter(
      (terminal) =>
        terminal.status === "INACTIVE"
    ).length;

  const maintenanceTerminals =
    terminals.filter(
      (terminal) =>
        terminal.status ===
        "MAINTENANCE"
    ).length;

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const statusStyle = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700";

      case "MAINTENANCE":
        return "bg-amber-50 text-amber-700";

      case "INACTIVE":
        return "bg-red-50 text-red-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      <div className="space-y-6">

        {/* SUCCESS */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={19} />

            <span className="flex-1">
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* ERROR */}

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
            >
              ×
            </button>
          </div>
        )}

        {/* ========================================
            HEADER
        ========================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Terminals
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage POS terminals and
              assign them to branches.
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

            Add Terminal
          </button>
        </div>

        {/* ========================================
            STAT CARDS
        ========================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Terminals
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalTerminals}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Monitor size={23} />
              </div>
            </div>
          </div>

          {/* ACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {activeTerminals}
            </p>
          </div>

          {/* MAINTENANCE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Maintenance
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {maintenanceTerminals}
            </p>
          </div>

          {/* INACTIVE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {inactiveTerminals}
            </p>
          </div>
        </div>

        {/* ========================================
            TABLE CARD
        ========================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}

          <div className="border-b border-slate-200 p-5">

            <div className="flex flex-col gap-3 xl:flex-row">

              {/* SEARCH */}

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
                  placeholder="Search terminal code, name, location or branch..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* BRANCH FILTER */}

              <select
                value={
                  branchFilter
                }
                onChange={(e) =>
                  setBranchFilter(
                    e.target.value
                  )
                }
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

              {/* STATUS FILTER */}

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

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

                <option value="MAINTENANCE">
                  Maintenance
                </option>
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

          {/* ========================================
              LOADING
          ========================================= */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading terminals...
                </p>
              </div>
            </div>
          ) : filteredTerminals.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Monitor
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No terminals found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Add your first POS
                  terminal.
                </p>
              </div>
            </div>
          ) : (
            /* ====================================
               TABLE
            ===================================== */

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-6 py-4">
                      Terminal
                    </th>

                    <th className="px-6 py-4">
                      Code
                    </th>

                    <th className="px-6 py-4">
                      Branch
                    </th>

                    <th className="px-6 py-4">
                      Location
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredTerminals.map(
                    (terminal) => {
                      const branch =
                        getBranch(
                          terminal
                        );

                      return (
                        <tr
                          key={
                            terminal.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* TERMINAL */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Monitor
                                  size={
                                    20
                                  }
                                />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {
                                    terminal.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  POS Terminal
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* CODE */}

                          <td className="px-6 py-4">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              {
                                terminal.code
                              }
                            </span>
                          </td>

                          {/* BRANCH */}

                          <td className="px-6 py-4">

                            {branch ? (
                              <div className="flex items-center gap-2">

                                <Building2
                                  size={
                                    16
                                  }
                                  className="text-slate-400"
                                />

                                <span className="text-sm font-medium text-slate-700">
                                  {
                                    branch.name
                                  }
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* LOCATION */}

                          <td className="px-6 py-4">

                            {terminal.location ? (
                              <div className="flex items-center gap-2">

                                <MapPin
                                  size={
                                    16
                                  }
                                  className="text-slate-400"
                                />

                                <span className="text-sm text-slate-600">
                                  {
                                    terminal.location
                                  }
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">

                            {statusLoadingId ===
                            terminal.id ? (
                              <div className="flex items-center gap-2">

                                <Loader2
                                  size={
                                    16
                                  }
                                  className="animate-spin text-blue-600"
                                />

                                <span className="text-xs text-slate-400">
                                  Updating
                                </span>
                              </div>
                            ) : (
                              <select
                                value={
                                  terminal.status ||
                                  "ACTIVE"
                                }
                                onChange={(e) =>
                                  handleStatusChange(
                                    terminal,
                                    e
                                      .target
                                      .value
                                  )
                                }
                                className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none ${statusStyle(
                                  terminal.status
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
                            )}
                          </td>

                          {/* ACTION */}

                          <td className="px-6 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    terminal
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Pencil
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
          )}
        </div>
      </div>

      {/* ==========================================
          ADD / EDIT MODAL
      ========================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">

          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingTerminal
                    ? "Edit Terminal"
                    : "Add Terminal"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingTerminal
                    ? "Update terminal information."
                    : "Create a POS terminal and assign it to a branch."}
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
              className="space-y-5 p-6"
            >

              {/* CODE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Terminal Code *
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
                  minLength={2}
                  maxLength={20}
                  placeholder="POS-01"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Terminal Name *
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
                  minLength={2}
                  maxLength={100}
                  placeholder="Main Counter"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* BRANCH */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Branch *
                </label>

                <select
                  name="branchId"
                  value={
                    form.branchId
                  }
                  onChange={
                    handleChange
                  }
                  required={
                    !editingTerminal
                  }
                  disabled={
                    Boolean(
                      editingTerminal
                    )
                  }
                  className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ${
                    editingTerminal
                      ? "cursor-not-allowed bg-slate-100 text-slate-500"
                      : "bg-white"
                  }`}
                >
                  <option value="">
                    Select Branch
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
                        {branch.code
                          ? ` (${branch.code})`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {editingTerminal && (
                  <p className="mt-2 text-xs text-amber-600">
                    Branch cannot be
                    changed from the
                    current terminal
                    update API.
                  </p>
                )}
              </div>

              {/* LOCATION */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>

                <div className="relative">

                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={150}
                    placeholder="Ground Floor - Counter 01"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* INFO */}

              {!editingTerminal && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex gap-3">

                    <Monitor
                      size={20}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        Terminal Setup
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-600">
                        This terminal will
                        be connected to the
                        selected branch and
                        can later be used
                        for cashier shifts
                        and POS sales.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

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

                  {editingTerminal
                    ? "Update Terminal"
                    : "Create Terminal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Terminals;