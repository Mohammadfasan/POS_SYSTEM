import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Tags,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Power,
} from "lucide-react";

import api from "../../api/axios";

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
};

const Categories = () => {
  // =============================================
  // STATE
  // =============================================

  const [categories, setCategories] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [statusLoadingId, setStatusLoadingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  // =============================================
  // FETCH CATEGORIES
  // =============================================

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/categories");

      console.log(
        "Categories:",
        response.data
      );

      const categoryData =
        response.data?.data?.categories ??
        [];

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );
    } catch (error) {
      console.error(
        "Category fetch error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // =============================================
  // SEARCH
  // =============================================

  const filteredCategories =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return categories;
      }

      return categories.filter(
        (category) => {
          const code =
            category.code
              ?.toLowerCase() || "";

          const name =
            category.name
              ?.toLowerCase() || "";

          const description =
            category.description
              ?.toLowerCase() || "";

          return (
            code.includes(keyword) ||
            name.includes(keyword) ||
            description.includes(keyword)
          );
        }
      );
    }, [categories, search]);

  // =============================================
  // OPEN CREATE
  // =============================================

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // =============================================
  // OPEN EDIT
  // =============================================

  const openEditModal = (
    category
  ) => {
    setEditingCategory(category);

    setForm({
      code:
        category.code || "",

      name:
        category.name || "",

      description:
        category.description || "",
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // =============================================
  // CLOSE MODAL
  // =============================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  };

  // =============================================
  // FORM CHANGE
  // =============================================

  const handleChange = (
    event
  ) => {
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

  // =============================================
  // CREATE / UPDATE
  // =============================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        code:
          form.code.trim(),

        name:
          form.name.trim(),

        description:
          form.description.trim() ||
          undefined,
      };

      if (editingCategory) {
        await api.patch(
          `/categories/${editingCategory.id}`,
          payload
        );

        setSuccess(
          "Category updated successfully."
        );
      } else {
        await api.post(
          "/categories",
          payload
        );

        setSuccess(
          "Category created successfully."
        );
      }

      await fetchCategories();

      setModalOpen(false);

      setEditingCategory(null);

      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(
        "Category save error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // STATUS CHANGE
  // =============================================

  const handleStatusChange =
    async (category) => {
      try {
        setStatusLoadingId(
          category.id
        );

        setError("");
        setSuccess("");

        const newStatus =
          category.status ===
          "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";

        await api.patch(
          `/categories/${category.id}/status`,
          {
            status:
              newStatus,
          }
        );

        setCategories(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                category.id
                  ? {
                      ...item,
                      status:
                        newStatus,
                    }
                  : item
            )
        );

        setSuccess(
          `Category changed to ${newStatus}.`
        );
      } catch (error) {
        console.error(
          "Status change error:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Unable to change category status."
        );
      } finally {
        setStatusLoadingId(
          null
        );
      }
    };

  // =============================================
  // UI
  // =============================================

  return (
    <>
      <div className="space-y-6">

        {/* =====================================
            MESSAGE
        ====================================== */}

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
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

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

        {/* =====================================
            PAGE TOP
        ====================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Categories
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage POS
              product categories.
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

            Add Category
          </button>
        </div>

        {/* =====================================
            STATS
        ====================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Categories
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {
                categories.filter(
                  (category) =>
                    category.status ===
                    "ACTIVE"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-500">
              {
                categories.filter(
                  (category) =>
                    category.status ===
                    "INACTIVE"
                ).length
              }
            </p>
          </div>
        </div>

        {/* =====================================
            TABLE CARD
        ====================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH */}

          <div className="border-b border-slate-200 p-5">

            <div className="relative max-w-md">

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
                placeholder="Search categories..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading categories...
                </p>
              </div>
            </div>
          ) : filteredCategories.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-72 items-center justify-center">

              <div className="text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Tags
                    size={27}
                  />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No categories found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Create your first
                  category.
                </p>
              </div>
            </div>
          ) : (
            /* TABLE */

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-6 py-4">
                      Code
                    </th>

                    <th className="px-6 py-4">
                      Category
                    </th>

                    <th className="px-6 py-4">
                      Description
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

                  {filteredCategories.map(
                    (
                      category
                    ) => (
                      <tr
                        key={
                          category.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* CODE */}

                        <td className="px-6 py-4">

                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                            {
                              category.code
                            }
                          </span>
                        </td>

                        {/* NAME */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Tags
                                size={
                                  17
                                }
                              />
                            </div>

                            <p className="font-semibold text-slate-800">
                              {
                                category.name
                              }
                            </p>
                          </div>
                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-xs px-6 py-4 text-sm text-slate-500">

                          <p className="truncate">
                            {category.description ||
                              "—"}
                          </p>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              category.status ===
                              "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {
                              category.status
                            }
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  category
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit category"
                            >
                              <Pencil
                                size={
                                  16
                                }
                              />
                            </button>

                            <button
                              type="button"
                              disabled={
                                statusLoadingId ===
                                category.id
                              }
                              onClick={() =>
                                handleStatusChange(
                                  category
                                )
                              }
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
                                category.status ===
                                "ACTIVE"
                                  ? "border-red-100 text-red-500 hover:bg-red-50"
                                  : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={
                                category.status ===
                                "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                            >
                              {statusLoadingId ===
                              category.id ? (
                                <Loader2
                                  size={
                                    16
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Power
                                  size={
                                    16
                                  }
                                />
                              )}
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

      {/* =========================================
          CREATE / EDIT MODAL
      ========================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingCategory
                    ? "Update category information."
                    : "Create a new product category."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >
              <div className="space-y-5">

                {/* CODE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category Code
                    <span className="text-red-500">
                      {" "}
                      *
                    </span>
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
                    minLength={2}
                    maxLength={20}
                    required
                    placeholder="Example: GROC"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Short unique
                    code such as
                    GROC, BEV or
                    DAIRY.
                  </p>
                </div>

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category Name
                    <span className="text-red-500">
                      {" "}
                      *
                    </span>
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
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="Example: Grocery"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="Optional category description..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {
                      form.description
                        .length
                    }
                    /500
                  </p>
                </div>
              </div>

              {/* BUTTONS */}

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={
                          17
                        }
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Categories;