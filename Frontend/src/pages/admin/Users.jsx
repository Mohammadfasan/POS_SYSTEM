import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Pencil,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCog,
  UserRound,
  Building2,
  Mail,
  BadgeCheck,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// API PATHS
//
// If your adminRoutes.js uses different child paths,
// change ONLY this section.
// ======================================================

const USER_API = {
  list: "/admin/users",

  create: "/admin/users",

  update: (userId) =>
    `/admin/users/${userId}`,

  status: (userId) =>
    `/admin/users/${userId}/status`,

  // Branch routes
  assignBranch: (
    branchId,
    userId
  ) =>
    `/branches/${branchId}/users/${userId}`,

  removeBranch: (userId) =>
    `/branches/users/${userId}`,

  branches: "/branches",
};

// ======================================================
// ROLE OPTIONS
// ======================================================

const ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
  },
  {
    value: "MANAGER",
    label: "Manager",
  },
  {
    value: "CASHIER",
    label: "Cashier",
  },
];

// ======================================================
// STATUS OPTIONS
// ======================================================

const STATUSES = [
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
  },
];

// ======================================================
// EMPTY FORM
// ======================================================

const EMPTY_FORM = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "CASHIER",
  status: "ACTIVE",
  branchId: "",
};

// ======================================================
// USERS PAGE
// ======================================================

const Users = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [users, setUsers] =
    useState([]);

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

  const [roleFilter, setRoleFilter] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    branchFilter,
    setBranchFilter,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ====================================================
  // EXTRACT USERS
  // ====================================================

  const extractUsers = (
    response
  ) => {
    const data =
      response?.data?.data;

    if (Array.isArray(data)) {
      return data;
    }

    return (
      data?.users ??
      data?.items ??
      data?.rows ??
      response?.data?.users ??
      []
    );
  };

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
  // LOAD PAGE
  // ====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        userResponse,
        branchResponse,
      ] = await Promise.all([
        api.get(USER_API.list),

        api.get(
          USER_API.branches
        ),
      ]);

      console.log(
        "Users Response:",
        userResponse.data
      );

      console.log(
        "Branches Response:",
        branchResponse.data
      );

      // USERS

      const userData =
        extractUsers(
          userResponse
        );

      setUsers(
        Array.isArray(userData)
          ? userData
          : []
      );

      // BRANCHES

      const branchData =
        extractBranches(
          branchResponse
        );

      setBranches(
        Array.isArray(branchData)
          ? branchData
          : []
      );
    } catch (err) {
      console.error(
        "Users page load error:",
        err.response?.data ||
          err.message
      );

      setError(
        err.response?.data
          ?.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadData();
  }, []);

  // ====================================================
  // GET BRANCH
  // ====================================================

  const getBranch = (user) => {
    if (user?.branch) {
      return user.branch;
    }

    return branches.find(
      (branch) =>
        branch.id ===
        user?.branchId
    );
  };

  // ====================================================
  // FULL NAME
  // ====================================================

  const getFullName = (
    user
  ) => {
    const name = [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      name ||
      user?.name ||
      "Unnamed User"
    );
  };

  // ====================================================
  // FILTER USERS
  // ====================================================

  const filteredUsers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const branch =
            user.branch ||
            branches.find(
              (item) =>
                item.id ===
                user.branchId
            );

          const fullName =
            [
              user.firstName,
              user.lastName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !keyword ||
            fullName.includes(
              keyword
            ) ||
            user.employeeId
              ?.toLowerCase()
              .includes(keyword) ||
            user.email
              ?.toLowerCase()
              .includes(keyword) ||
            branch?.name
              ?.toLowerCase()
              .includes(keyword);

          const matchesRole =
            !roleFilter ||
            user.role ===
              roleFilter;

          const matchesStatus =
            !statusFilter ||
            user.status ===
              statusFilter;

          const matchesBranch =
            !branchFilter ||
            user.branchId ===
              branchFilter ||
            branch?.id ===
              branchFilter;

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus &&
            matchesBranch
          );
        }
      );
    }, [
      users,
      branches,
      search,
      roleFilter,
      statusFilter,
      branchFilter,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const totalUsers =
    users.length;

  const adminCount =
    users.filter(
      (user) =>
        user.role === "ADMIN"
    ).length;

  const managerCount =
    users.filter(
      (user) =>
        user.role === "MANAGER"
    ).length;

  const cashierCount =
    users.filter(
      (user) =>
        user.role === "CASHIER"
    ).length;

  // ====================================================
  // OPEN CREATE MODAL
  // ====================================================

  const openCreateModal = () => {
    setEditingUser(null);

    setForm(EMPTY_FORM);

    setShowPassword(false);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ====================================================
  // OPEN EDIT MODAL
  // ====================================================

  const openEditModal = (
    user
  ) => {
    setEditingUser(user);

    setForm({
      employeeId:
        user.employeeId || "",

      firstName:
        user.firstName || "",

      lastName:
        user.lastName || "",

      email:
        user.email || "",

      password: "",

      role:
        user.role ||
        "CASHIER",

      status:
        user.status ||
        "ACTIVE",

      branchId:
        user.branchId ||
        user.branch?.id ||
        "",
    });

    setShowPassword(false);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    setEditingUser(null);

    setForm(EMPTY_FORM);

    setShowPassword(false);
  };

  // ====================================================
  // HANDLE FORM CHANGE
  // ====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    // ADMIN normally doesn't
    // require a branch.
    if (
      name === "role" &&
      value === "ADMIN"
    ) {
      setForm(
        (current) => ({
          ...current,

          role: value,

          branchId: "",
        })
      );

      return;
    }

    setForm(
      (current) => ({
        ...current,

        [name]:
          name ===
          "employeeId"
            ? value.toUpperCase()
            : value,
      })
    );
  };

  // ====================================================
  // VALIDATE FORM
  // ====================================================

  const validateForm = () => {
    if (
      form.employeeId
        .trim()
        .length < 2
    ) {
      throw new Error(
        "Employee ID is required."
      );
    }

    if (
      form.firstName
        .trim()
        .length < 2
    ) {
      throw new Error(
        "First name is required."
      );
    }

    if (
      form.lastName
        .trim()
        .length < 2
    ) {
      throw new Error(
        "Last name is required."
      );
    }

    if (
      !form.email.trim()
    ) {
      throw new Error(
        "Email is required."
      );
    }

    if (
      !editingUser &&
      form.password.length < 8
    ) {
      throw new Error(
        "Password must contain at least 8 characters."
      );
    }

    if (
      form.role !== "ADMIN" &&
      !form.branchId
    ) {
      throw new Error(
        "Please select a branch for Manager or Cashier."
      );
    }
  };

  // ====================================================
  // CREATE USER PAYLOAD
  // ====================================================

  const buildCreatePayload =
    () => {
      const payload = {
        employeeId:
          form.employeeId.trim(),

        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        password:
          form.password,

        role:
          form.role,
      };

      /*
       * Some backend create-user
       * controllers may accept branchId
       * directly.
       *
       * We include it when available.
       */

      if (
        form.role !==
          "ADMIN" &&
        form.branchId
      ) {
        payload.branchId =
          form.branchId;
      }

      return payload;
    };

  // ====================================================
  // EDIT USER PAYLOAD
  // ====================================================

  const buildUpdatePayload =
    () => {
      const payload = {
        employeeId:
          form.employeeId.trim(),

        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        role:
          form.role,
      };

      /*
       * Send password only when
       * admin enters a new password.
       */

      if (
        form.password.trim()
      ) {
        payload.password =
          form.password;
      }

      return payload;
    };

  // ====================================================
  // ASSIGN BRANCH
  // ====================================================

  const assignBranch = async (
    userId,
    branchId
  ) => {
    if (!branchId) {
      return;
    }

    await api.patch(
      USER_API.assignBranch(
        branchId,
        userId
      )
    );
  };

  // ====================================================
  // REMOVE BRANCH
  // ====================================================

  const removeBranch =
    async (userId) => {
      await api.delete(
        USER_API.removeBranch(
          userId
        )
      );
    };

  // ====================================================
  // CREATE / UPDATE USER
  // ====================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      validateForm();

      // ================================================
      // EDIT
      // ================================================

      if (editingUser) {
        const oldBranchId =
          editingUser.branchId ||
          editingUser.branch?.id ||
          "";

        const updatePayload =
          buildUpdatePayload();

        await api.patch(
          USER_API.update(
            editingUser.id
          ),
          updatePayload
        );

        // ----------------------------------------------
        // ADMIN
        // Remove branch if previous branch exists
        // ----------------------------------------------

        if (
          form.role ===
          "ADMIN"
        ) {
          if (oldBranchId) {
            await removeBranch(
              editingUser.id
            );
          }
        }

        // ----------------------------------------------
        // MANAGER / CASHIER BRANCH
        // ----------------------------------------------

        else if (
          form.branchId &&
          form.branchId !==
            oldBranchId
        ) {
          await assignBranch(
            editingUser.id,
            form.branchId
          );
        }

        // ----------------------------------------------
        // STATUS
        // ----------------------------------------------

        if (
          form.status !==
          editingUser.status
        ) {
          await api.patch(
            USER_API.status(
              editingUser.id
            ),
            {
              status:
                form.status,
            }
          );
        }

        setSuccess(
          "User updated successfully."
        );
      }

      // ================================================
      // CREATE
      // ================================================

      else {
        const payload =
          buildCreatePayload();

        const response =
          await api.post(
            USER_API.create,
            payload
          );

        console.log(
          "Create User Response:",
          response.data
        );

        const createdUser =
          response.data?.data
            ?.user ??
          response.data?.user;

        /*
         * If backend already handles
         * branchId during creation,
         * we don't need another request.
         *
         * If returned user has no branch,
         * assign branch using branch API.
         */

        if (
          createdUser?.id &&
          form.role !==
            "ADMIN" &&
          form.branchId &&
          !createdUser.branchId
        ) {
          await assignBranch(
            createdUser.id,
            form.branchId
          );
        }

        setSuccess(
          "User created successfully."
        );
      }

      // ================================================
      // RELOAD
      // ================================================

      setModalOpen(false);

      setEditingUser(null);

      setForm(EMPTY_FORM);

      await loadData();
    } catch (err) {
      console.error(
        "User save error:",
        err.response?.data ||
          err.message
      );

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Unable to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // QUICK STATUS CHANGE
  // ====================================================

  const handleStatusChange =
    async (
      user,
      newStatus
    ) => {
      try {
        setStatusLoadingId(
          user.id
        );

        setError("");
        setSuccess("");

        await api.patch(
          USER_API.status(
            user.id
          ),
          {
            status:
              newStatus,
          }
        );

        setUsers(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                user.id
                  ? {
                      ...item,

                      status:
                        newStatus,
                    }
                  : item
            )
        );

        setSuccess(
          `${getFullName(
            user
          )} status changed to ${newStatus}.`
        );
      } catch (err) {
        console.error(
          "Status change error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to change user status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // ====================================================
  // RESET FILTER
  // ====================================================

  const resetFilters = () => {
    setSearch("");

    setRoleFilter("");

    setStatusFilter("");

    setBranchFilter("");
  };

  // ====================================================
  // ROLE STYLE
  // ====================================================

  const roleStyle = (
    role
  ) => {
    switch (role) {
      case "ADMIN":
        return {
          className:
            "bg-purple-50 text-purple-700",

          Icon:
            ShieldCheck,
        };

      case "MANAGER":
        return {
          className:
            "bg-blue-50 text-blue-700",

          Icon:
            UserCog,
        };

      default:
        return {
          className:
            "bg-emerald-50 text-emerald-700",

          Icon:
            UserRound,
        };
    }
  };

  // ====================================================
  // STATUS STYLE
  // ====================================================

  const statusStyle = (
    status
  ) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700";

      case "SUSPENDED":
        return "bg-red-50 text-red-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="space-y-6">

        {/* ============================================
            SUCCESS MESSAGE
        ============================================= */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <CheckCircle2
              size={19}
            />

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

        {/* ============================================
            ERROR
        ============================================= */}

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

        {/* ============================================
            HEADER
        ============================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage admins, managers
              and cashiers.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <UserPlus
              size={18}
            />

            Add User
          </button>
        </div>

        {/* ============================================
            STAT CARDS
        ============================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Users
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {totalUsers}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

                <UsersIcon
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* ADMIN */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Admins
                </p>

                <p className="mt-2 text-2xl font-bold text-purple-600">
                  {adminCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

                <ShieldCheck
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* MANAGER */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Managers
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {managerCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <UserCog
                  size={23}
                />
              </div>
            </div>
          </div>

          {/* CASHIERS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Cashiers
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {cashierCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

                <UserRound
                  size={23}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            TABLE CARD
        ============================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ==========================================
              FILTERS
          =========================================== */}

          <div className="border-b border-slate-200 p-5">

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">

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
                  placeholder="Search name, employee ID, email..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* ROLE */}

              <select
                value={
                  roleFilter
                }
                onChange={(e) =>
                  setRoleFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  All Roles
                </option>

                <option value="ADMIN">
                  Admin
                </option>

                <option value="MANAGER">
                  Manager
                </option>

                <option value="CASHIER">
                  Cashier
                </option>
              </select>

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

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

                <option value="SUSPENDED">
                  Suspended
                </option>
              </select>

              {/* BRANCH */}

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

          {/* ==========================================
              LOADING
          =========================================== */}

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading users...
                </p>
              </div>
            </div>
          ) : filteredUsers.length ===
            0 ? (

            /* ========================================
               EMPTY
            ========================================= */

            <div className="flex min-h-80 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                  <UsersIcon
                    size={30}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No users found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create a manager or
                  cashier account.
                </p>
              </div>
            </div>
          ) : (

            /* ========================================
               TABLE
            ========================================= */

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Employee ID
                    </th>

                    <th className="px-5 py-4">
                      Email
                    </th>

                    <th className="px-5 py-4">
                      Role
                    </th>

                    <th className="px-5 py-4">
                      Branch
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Last Login
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredUsers.map(
                    (user) => {
                      const branch =
                        getBranch(
                          user
                        );

                      const {
                        Icon:
                          RoleIcon,
                        className:
                          roleClass,
                      } =
                        roleStyle(
                          user.role
                        );

                      return (
                        <tr
                          key={
                            user.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* USER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

                                {user.firstName
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "U"}

                                {user.lastName
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  ""}

                              </div>

                              <div>

                                <p className="whitespace-nowrap font-semibold text-slate-800">
                                  {getFullName(
                                    user
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  SmartPOS User
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* EMPLOYEE ID */}

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">

                              {user.employeeId ||
                                "—"}

                            </span>
                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <Mail
                                size={
                                  15
                                }
                                className="shrink-0 text-slate-400"
                              />

                              <span className="text-sm text-slate-600">
                                {user.email ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          {/* ROLE */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${roleClass}`}
                            >
                              <RoleIcon
                                size={
                                  14
                                }
                              />

                              {user.role}
                            </span>
                          </td>

                          {/* BRANCH */}

                          <td className="px-5 py-4">

                            {branch ? (
                              <div className="flex items-center gap-2">

                                <Building2
                                  size={
                                    15
                                  }
                                  className="text-slate-400"
                                />

                                <span className="whitespace-nowrap text-sm text-slate-700">
                                  {branch.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                {user.role ===
                                "ADMIN"
                                  ? "All Branches"
                                  : "Not Assigned"}
                              </span>
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {statusLoadingId ===
                            user.id ? (
                              <Loader2
                                size={
                                  17
                                }
                                className="animate-spin text-blue-600"
                              />
                            ) : (
                              <select
                                value={
                                  user.status ||
                                  "ACTIVE"
                                }
                                onChange={(e) =>
                                  handleStatusChange(
                                    user,
                                    e
                                      .target
                                      .value
                                  )
                                }
                                className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold outline-none ${statusStyle(
                                  user.status
                                )}`}
                              >
                                <option value="ACTIVE">
                                  ACTIVE
                                </option>

                                <option value="INACTIVE">
                                  INACTIVE
                                </option>

                                <option value="SUSPENDED">
                                  SUSPENDED
                                </option>
                              </select>
                            )}
                          </td>

                          {/* LAST LOGIN */}

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">

                            {user.lastLoginAt
                              ? new Date(
                                  user.lastLoginAt
                                ).toLocaleString(
                                  "en-LK"
                                )
                              : "Never"}

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    user
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

      {/* ==================================================
          ADD / EDIT USER MODAL
      =================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">

          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* ============================================
                MODAL HEADER
            ============================================= */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {editingUser
                    ? "Edit User"
                    : "Add User"}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {editingUser
                    ? "Update user account and access settings."
                    : "Create a new SmartPOS user account."}

                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            {/* ============================================
                FORM
            ============================================= */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >

              {/* ==========================================
                  PERSONAL INFORMATION
              =========================================== */}

              <div>

                <h3 className="font-bold text-slate-900">
                  User Information
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* EMPLOYEE ID */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Employee ID *
                    </label>

                    <input
                      type="text"
                      name="employeeId"
                      value={
                        form.employeeId
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="EMP001"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email *
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
                      required
                      placeholder="cashier@smartpos.com"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* FIRST NAME */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      First Name *
                    </label>

                    <input
                      type="text"
                      name="firstName"
                      value={
                        form.firstName
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="Mohammed"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {/* LAST NAME */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Last Name *
                    </label>

                    <input
                      type="text"
                      name="lastName"
                      value={
                        form.lastName
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="Fasan"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  ACCESS
              =========================================== */}

              <div>

                <h3 className="font-bold text-slate-900">
                  Access & Assignment
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* ROLE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Role *
                    </label>

                    <select
                      name="role"
                      value={
                        form.role
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >

                      {ROLES.map(
                        (role) => (
                          <option
                            key={
                              role.value
                            }
                            value={
                              role.value
                            }
                          >
                            {
                              role.label
                            }
                          </option>
                        )
                      )}

                    </select>
                  </div>

                  {/* STATUS */}

                  {editingUser && (
                    <div>

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Status *
                      </label>

                      <select
                        name="status"
                        value={
                          form.status
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                      >

                        {STATUSES.map(
                          (
                            status
                          ) => (
                            <option
                              key={
                                status.value
                              }
                              value={
                                status.value
                              }
                            >
                              {
                                status.label
                              }
                            </option>
                          )
                        )}

                      </select>
                    </div>
                  )}

                  {/* BRANCH */}

                  {form.role !==
                    "ADMIN" && (
                    <div
                      className={
                        editingUser
                          ? ""
                          : "md:col-span-2"
                      }
                    >

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
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
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

                      <p className="mt-2 text-xs text-slate-400">
                        Manager and Cashier
                        accounts should be
                        assigned to a branch.
                      </p>
                    </div>
                  )}

                  {/* ADMIN INFO */}

                  {form.role ===
                    "ADMIN" && (
                    <div className="md:col-span-2 rounded-xl border border-purple-100 bg-purple-50 p-4">

                      <div className="flex gap-3">

                        <ShieldCheck
                          size={20}
                          className="mt-0.5 shrink-0 text-purple-600"
                        />

                        <div>

                          <p className="text-sm font-semibold text-purple-800">
                            Administrator
                          </p>

                          <p className="mt-1 text-xs leading-5 text-purple-600">
                            Admin users have
                            system-level access
                            and are not restricted
                            to one branch.
                          </p>

                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="my-7 border-t border-slate-200" />

              {/* ==========================================
                  PASSWORD
              =========================================== */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">

                  {editingUser
                    ? "New Password"
                    : "Password *"}

                </label>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    required={
                      !editingUser
                    }
                    minLength={8}
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Minimum 8 characters"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >

                    {showPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}

                  </button>
                </div>

                {editingUser && (
                  <p className="mt-2 text-xs text-slate-400">
                    Leave this field empty
                    if you don't want to
                    change the password.
                  </p>
                )}
              </div>

              {/* ==========================================
                  SUMMARY
              =========================================== */}

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex gap-3">

                  <BadgeCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-blue-800">
                      User Access
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-600">

                      {form.role ===
                      "ADMIN"
                        ? "This user will have administrator access."
                        : form.role ===
                          "MANAGER"
                        ? "This user will manage operations for the selected branch."
                        : "This user will access cashier/POS operations for the selected branch."}

                    </p>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  ACTION BUTTONS
              =========================================== */}

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">

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

                  {editingUser
                    ? "Update User"
                    : "Create User"}

                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;