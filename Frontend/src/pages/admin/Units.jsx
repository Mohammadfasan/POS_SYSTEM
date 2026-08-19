import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Scale,
  X,
  Loader2,
  Power,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../../api/axios";

const EMPTY_FORM = {
  code: "",
  name: "",
  symbol: "",
  measurementType: "COUNT",
  conversionFactor: 1,
  isBase: false,
};

const Units = () => {
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [statusLoadingId, setStatusLoadingId] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingUnit, setEditingUnit] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // GET UNITS
  // ==========================================

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/units");

      console.log(
        "Units Response:",
        response.data
      );

      const data =
        response.data?.data?.units ??
        [];

      setUnits(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Units error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to load units."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredUnits =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return units;
      }

      return units.filter(
        (unit) =>
          unit.code
            ?.toLowerCase()
            .includes(keyword) ||
          unit.name
            ?.toLowerCase()
            .includes(keyword) ||
          unit.symbol
            ?.toLowerCase()
            .includes(keyword) ||
          unit.measurementType
            ?.toLowerCase()
            .includes(keyword)
      );
    }, [units, search]);

  // ==========================================
  // CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setEditingUnit(null);

    setForm(EMPTY_FORM);

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ==========================================
  // EDIT
  // ==========================================

  const openEditModal = (unit) => {
    setEditingUnit(unit);

    setForm({
      code: unit.code || "",
      name: unit.name || "",
      symbol: unit.symbol || "",

      measurementType:
        unit.measurementType ||
        "COUNT",

      conversionFactor:
        Number(
          unit.conversionFactor
        ) || 1,

      isBase:
        unit.isBase || false,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  // ==========================================
  // CLOSE
  // ==========================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingUnit(null);
    setForm(EMPTY_FORM);
  };

  // ==========================================
  // CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
          ? value.toUpperCase()
          : value,
    }));
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingUnit) {
        // Backend update schema allows:
        // code, name, symbol, conversionFactor

        const payload = {
          code:
            form.code.trim(),

          name:
            form.name.trim(),

          symbol:
            form.symbol.trim(),

          conversionFactor:
            Number(
              form.conversionFactor
            ),
        };

        await api.patch(
          `/units/${editingUnit.id}`,
          payload
        );

        setSuccess(
          "Unit updated successfully."
        );
      } else {
        const payload = {
          code:
            form.code.trim(),

          name:
            form.name.trim(),

          symbol:
            form.symbol.trim(),

          measurementType:
            form.measurementType,

          conversionFactor:
            Number(
              form.conversionFactor
            ),

          isBase:
            Boolean(
              form.isBase
            ),
        };

        await api.post(
          "/units",
          payload
        );

        setSuccess(
          "Unit created successfully."
        );
      }

      await fetchUnits();

      setModalOpen(false);
      setEditingUnit(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(
        "Unit save error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Unable to save unit."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // STATUS
  // ==========================================

  const handleStatusChange =
    async (unit) => {
      try {
        setStatusLoadingId(
          unit.id
        );

        setError("");
        setSuccess("");

        const newStatus =
          unit.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";

        await api.patch(
          `/units/${unit.id}/status`,
          {
            status: newStatus,
          }
        );

        setUnits((current) =>
          current.map((item) =>
            item.id === unit.id
              ? {
                  ...item,
                  status:
                    newStatus,
                }
              : item
          )
        );

        setSuccess(
          `Unit changed to ${newStatus}.`
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to change unit status."
        );
      } finally {
        setStatusLoadingId(null);
      }
    };

  // ==========================================
  // TYPE STYLE
  // ==========================================

  const typeStyle = (type) => {
    switch (type) {
      case "WEIGHT":
        return "bg-orange-50 text-orange-700";

      case "VOLUME":
        return "bg-cyan-50 text-cyan-700";

      case "LENGTH":
        return "bg-purple-50 text-purple-700";

      default:
        return "bg-blue-50 text-blue-700";
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
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={19} />

            <span className="flex-1">
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Units
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage product measurement
              units such as kg, g, pcs,
              L and ml.
            </p>
          </div>

          <button
            onClick={
              openCreateModal
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />

            Add Unit
          </button>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Units
            </p>

            <p className="mt-2 text-2xl font-bold">
              {units.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Weight Units
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600">
              {
                units.filter(
                  (u) =>
                    u.measurementType ===
                    "WEIGHT"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Volume Units
            </p>

            <p className="mt-2 text-2xl font-bold text-cyan-600">
              {
                units.filter(
                  (u) =>
                    u.measurementType ===
                    "VOLUME"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Count Units
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {
                units.filter(
                  (u) =>
                    u.measurementType ===
                    "COUNT"
                ).length
              }
            </p>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">

            <div className="relative max-w-md">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search units..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">

              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading units...
                </p>
              </div>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center">

              <div className="text-center">

                <Scale
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 font-semibold text-slate-600">
                  No units found
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr className="text-left text-xs font-semibold uppercase text-slate-500">

                    <th className="px-6 py-4">
                      Code
                    </th>

                    <th className="px-6 py-4">
                      Unit
                    </th>

                    <th className="px-6 py-4">
                      Symbol
                    </th>

                    <th className="px-6 py-4">
                      Type
                    </th>

                    <th className="px-6 py-4">
                      Conversion
                    </th>

                    <th className="px-6 py-4">
                      Base
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredUnits.map(
                    (unit) => (
                      <tr
                        key={
                          unit.id
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold">
                            {
                              unit.code
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {unit.name}
                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-lg bg-blue-50 px-3 py-1 font-bold text-blue-700">
                            {
                              unit.symbol
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeStyle(
                              unit.measurementType
                            )}`}
                          >
                            {
                              unit.measurementType
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {
                            unit.conversionFactor
                          }
                        </td>

                        <td className="px-6 py-4">

                          {unit.isBase ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Base
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              unit.status ===
                              "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {
                              unit.status
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                openEditModal(
                                  unit
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil
                                size={
                                  16
                                }
                              />
                            </button>

                            <button
                              disabled={
                                statusLoadingId ===
                                unit.id
                              }
                              onClick={() =>
                                handleStatusChange(
                                  unit
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                            >
                              {statusLoadingId ===
                              unit.id ? (
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

      {/* ==========================================
          MODAL
      ========================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingUnit
                    ? "Edit Unit"
                    : "Add Unit"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure product
                  measurement unit.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
              >
                <X
                  size={20}
                  className="text-slate-400"
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >

              {/* CODE */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Unit Code
                </label>

                <input
                  name="code"
                  value={
                    form.code
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="KG"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Unit Name
                </label>

                <input
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Kilogram"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* SYMBOL */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Symbol
                </label>

                <input
                  name="symbol"
                  value={
                    form.symbol
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="kg"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* TYPE */}

              {!editingUnit && (
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Measurement Type
                  </label>

                  <select
                    name="measurementType"
                    value={
                      form.measurementType
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                  >
                    <option value="COUNT">
                      Count
                    </option>

                    <option value="WEIGHT">
                      Weight
                    </option>

                    <option value="VOLUME">
                      Volume
                    </option>

                    <option value="LENGTH">
                      Length
                    </option>
                  </select>
                </div>
              )}

              {/* CONVERSION */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Conversion Factor
                </label>

                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  name="conversionFactor"
                  value={
                    form.conversionFactor
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Base unit normally uses
                  1. Example: Gram =
                  0.001 when Kilogram is
                  base unit.
                </p>
              </div>

              {/* BASE */}

              {!editingUnit && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">

                  <input
                    type="checkbox"
                    name="isBase"
                    checked={
                      form.isBase
                    }
                    onChange={
                      handleChange
                    }
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Base Unit
                    </p>

                    <p className="text-xs text-slate-400">
                      Mark this as the
                      primary unit for this
                      measurement type.
                    </p>
                  </div>
                </label>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingUnit
                    ? "Update Unit"
                    : "Create Unit"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Units;