import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   TOKEN
========================================================= */

const getToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken");

/* =========================================================
   API
========================================================= */

const apiRequest = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error?.message ||
        "Request failed"
    );

    error.status = response.status;

    throw error;
  }

  return data;
};

/* =========================================================
   MONEY
========================================================= */

const money = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
};

/* =========================================================
   PRODUCT CARD
========================================================= */

const ProductCard = ({
  product,
  inventory,
  onAdd,
}) => {
  const sellingFactor = Number(
    product?.sellingUnit?.conversionFactor || 1
  );

  const availableBase = Number(
    inventory?.availableQuantity || 0
  );

  const availableSelling =
    sellingFactor > 0
      ? availableBase / sellingFactor
      : 0;

  const outOfStock =
    product?.trackInventory &&
    availableSelling <= 0;

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      className="group flex min-h-[170px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
              {product?.sku || "NO SKU"}
            </p>

            <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900">
              {product?.name}
            </h3>
          </div>

          <div className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {product?.productType}
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {product?.category?.name || "Uncategorized"}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-xl font-bold text-slate-900">
          {money(product?.sellingPrice)}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            per{" "}
            {product?.sellingUnit?.symbol ||
              product?.sellingUnit?.name ||
              "unit"}
          </span>

          {product?.trackInventory ? (
            <span
              className={`text-xs font-semibold ${
                outOfStock
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {outOfStock
                ? "Out of stock"
                : `${availableSelling.toFixed(
                    product?.allowFractionalQuantity
                      ? 3
                      : 0
                  )} available`}
            </span>
          ) : (
            <span className="text-xs font-medium text-blue-600">
              Stock not tracked
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

/* =========================================================
   NEW SALE
========================================================= */

const NewSale = () => {
  const navigate = useNavigate();

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [inventoryMap, setInventoryMap] =
    useState({});

  const [cart, setCart] = useState([]);

  const [shift, setShift] =
    useState(null);

  const [drawerInfo, setDrawerInfo] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [barcode, setBarcode] =
    useState("");

  const [promotionInput, setPromotionInput] =
    useState("");

  const [
    promotionCodes,
    setPromotionCodes,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    productLoading,
    setProductLoading,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [barcodeLoading, setBarcodeLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successSale, setSuccessSale] =
    useState(null);

  /* =======================================================
     SESSION STATUS
  ======================================================= */

  const loadSession = useCallback(
    async () => {
      const [shiftResult, drawerResult] =
        await Promise.allSettled([
          apiRequest("/shifts/current"),
          apiRequest(
            "/cash-drawers/current"
          ),
        ]);

      if (
        shiftResult.status ===
        "fulfilled"
      ) {
        setShift(
          shiftResult.value?.data?.shift ||
            null
        );
      } else {
        setShift(null);
      }

      if (
        drawerResult.status ===
        "fulfilled"
      ) {
        setDrawerInfo(
          drawerResult.value?.data ||
            null
        );
      } else {
        setDrawerInfo(null);
      }
    },
    []
  );

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const loadCategories =
    useCallback(async () => {
      try {
        const response =
          await apiRequest(
            "/categories?status=ACTIVE"
          );

        setCategories(
          response?.data?.categories || []
        );
      } catch {
        setCategories([]);
      }
    }, []);

  /* =======================================================
     INVENTORY
  ======================================================= */

  const loadInventory =
    useCallback(async () => {
      try {
        const response =
          await apiRequest("/inventory");

        const inventories =
          response?.data?.inventories ||
          [];

        const map = {};

        inventories.forEach(
          (inventory) => {
            if (inventory?.productId) {
              map[inventory.productId] =
                inventory;
            } else if (
              inventory?.product?.id
            ) {
              map[
                inventory.product.id
              ] = inventory;
            }
          }
        );

        setInventoryMap(map);
      } catch {
        setInventoryMap({});
      }
    }, []);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const loadProducts = useCallback(
    async () => {
      try {
        setProductLoading(true);

        const params =
          new URLSearchParams();

        params.set("status", "ACTIVE");
        params.set("limit", "100");
        params.set("page", "1");

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (categoryId) {
          params.set(
            "categoryId",
            categoryId
          );
        }

        const response =
          await apiRequest(
            `/products?${params.toString()}`
          );

        setProducts(
          response?.data?.products || []
        );
      } catch (err) {
        setProducts([]);

        setError(
          err.message ||
            "Unable to load products"
        );
      } finally {
        setProductLoading(false);
      }
    },
    [search, categoryId]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        await Promise.all([
          loadSession(),
          loadCategories(),
          loadInventory(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    loadSession,
    loadCategories,
    loadInventory,
  ]);

  /* =======================================================
     PRODUCT SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadProducts]);

  /* =======================================================
     AVAILABLE QUANTITY
  ======================================================= */

  const getAvailableSellingQuantity = (
    product
  ) => {
    if (!product?.trackInventory) {
      return Infinity;
    }

    const inventory =
      inventoryMap[product.id];

    const availableBase = Number(
      inventory?.availableQuantity || 0
    );

    const factor = Number(
      product?.sellingUnit
        ?.conversionFactor || 1
    );

    if (factor <= 0) {
      return 0;
    }

    return availableBase / factor;
  };

  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  const addProduct = (product) => {
    setError("");

    if (!product?.sellingUnit?.id) {
      setError(
        `${product.name} does not have a selling unit`
      );

      return;
    }

    const available =
      getAvailableSellingQuantity(
        product
      );

    const existing = cart.find(
      (item) =>
        item.productId === product.id
    );

    const currentQuantity =
      existing
        ? Number(existing.quantity)
        : 0;

    const nextQuantity =
      currentQuantity + 1;

    if (
      product.trackInventory &&
      nextQuantity > available
    ) {
      setError(
        `Insufficient stock for ${product.name}`
      );

      return;
    }

    if (existing) {
      setCart((previous) =>
        previous.map((item) =>
          item.productId ===
          product.id
            ? {
                ...item,
                quantity:
                  nextQuantity,
              }
            : item
        )
      );

      return;
    }

    setCart((previous) => [
      ...previous,
      {
        productId: product.id,
        unitId:
          product.sellingUnit.id,

        product,
        quantity: 1,
      },
    ]);
  };

  /* =======================================================
     BARCODE
  ======================================================= */

  const handleBarcode = async (event) => {
    event.preventDefault();

    const value = barcode.trim();

    if (!value) {
      return;
    }

    try {
      setBarcodeLoading(true);
      setError("");

      const response =
        await apiRequest(
          `/products/barcode/${encodeURIComponent(
            value
          )}`
        );

      const product =
        response?.data?.product;

      if (!product) {
        throw new Error(
          "Product not found"
        );
      }

      addProduct(product);

      setBarcode("");
    } catch (err) {
      setError(
        err.message ||
          "Barcode product not found"
      );
    } finally {
      setBarcodeLoading(false);
    }
  };

  /* =======================================================
     QUANTITY
  ======================================================= */

  const changeQuantity = (
    productId,
    value
  ) => {
    const item = cart.find(
      (cartItem) =>
        cartItem.productId ===
        productId
    );

    if (!item) {
      return;
    }

    const product = item.product;

    let quantity = Number(value);

    if (
      !Number.isFinite(quantity)
    ) {
      return;
    }

    if (
      !product.allowFractionalQuantity
    ) {
      quantity = Math.floor(quantity);
    }

    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const available =
      getAvailableSellingQuantity(
        product
      );

    if (
      product.trackInventory &&
      quantity > available
    ) {
      setError(
        `Maximum available quantity for ${product.name} is ${available.toFixed(
          product.allowFractionalQuantity
            ? 3
            : 0
        )}`
      );

      return;
    }

    setError("");

    setCart((previous) =>
      previous.map((cartItem) =>
        cartItem.productId ===
        productId
          ? {
              ...cartItem,
              quantity,
            }
          : cartItem
      )
    );
  };

  /* =======================================================
     REMOVE
  ======================================================= */

  const removeItem = (productId) => {
    setCart((previous) =>
      previous.filter(
        (item) =>
          item.productId !==
          productId
      )
    );
  };

  /* =======================================================
     CART SUBTOTAL

     Because this page always submits sellingUnit,
     estimated line total is sellingPrice * quantity.

     Backend calculates exact promotions + tax.
  ======================================================= */

  const estimatedSubtotal =
    useMemo(() => {
      return cart.reduce(
        (total, item) => {
          return (
            total +
            Number(
              item.product?.sellingPrice ||
                0
            ) *
              Number(
                item.quantity || 0
              )
          );
        },
        0
      );
    }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /* =======================================================
     PROMOTION
  ======================================================= */

  const addPromotionCode = () => {
    const code = promotionInput
      .trim()
      .toUpperCase();

    if (!code) {
      return;
    }

    if (code.length < 2) {
      setError(
        "Promotion code is too short"
      );

      return;
    }

    if (
      promotionCodes.includes(code)
    ) {
      setPromotionInput("");
      return;
    }

    if (
      promotionCodes.length >= 10
    ) {
      setError(
        "Maximum 10 promotion codes allowed"
      );

      return;
    }

    setPromotionCodes(
      (previous) => [
        ...previous,
        code,
      ]
    );

    setPromotionInput("");
    setError("");
  };

  const removePromotion = (code) => {
    setPromotionCodes(
      (previous) =>
        previous.filter(
          (item) => item !== code
        )
    );
  };

  /* =======================================================
     CREATE SALE
  ======================================================= */

  const createSale = async () => {
    if (!shift) {
      setError(
        "Open a cashier shift before creating a sale"
      );

      return;
    }

    if (!drawerInfo?.drawer) {
      setError(
        "An active cash drawer is required"
      );

      return;
    }

    if (cart.length === 0) {
      setError(
        "Add at least one product"
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const body = {
        items: cart.map((item) => ({
          productId:
            item.productId,

          unitId:
            item.unitId,

          quantity:
            Number(item.quantity),
        })),

        promotionCodes,
      };

      const response =
        await apiRequest("/sales", {
          method: "POST",

          body: JSON.stringify(body),
        });

      const sale =
        response?.data?.sale;

      if (!sale) {
        throw new Error(
          "Sale was created but response data is missing"
        );
      }

      setSuccessSale(sale);

      /*
       * Refresh stock because sale creation
       * reserves inventory.
       */
      await loadInventory();
    } catch (err) {
      setError(
        err.message ||
          "Unable to create sale"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     CLEAR
  ======================================================= */

  const clearCart = () => {
    if (cart.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Clear all items from the cart?"
      );

    if (confirmed) {
      setCart([]);
      setPromotionCodes([]);
      setError("");
    }
  };

  /* =======================================================
     READY
  ======================================================= */

  const readyForSale =
    Boolean(shift) &&
    Boolean(drawerInfo?.drawer);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Preparing POS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* =================================================
          PAGE
      ================================================== */}

      <div className="mx-auto max-w-[1800px] p-4 sm:p-6">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              POS BILLING
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              New Sale
            </h1>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Shift:{" "}
                {shift?.shiftNumber ||
                  "Not Open"}
              </span>

              <span>
                Terminal:{" "}
                {drawerInfo?.terminal
                  ?.name ||
                  shift?.terminal?.name ||
                  "-"}
              </span>

              <span>
                Drawer:{" "}
                {drawerInfo?.drawer
                  ?.name || "-"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <div
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                readyForSale
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {readyForSale
                ? "Ready for Sale"
                : "POS Not Ready"}
            </div>

            {!shift && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/cashier/shift"
                  )
                }
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open Shift
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-sm font-bold text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            MAIN GRID
        ================================================== */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_430px]">

          {/* ===============================================
              LEFT - PRODUCTS
          =============================================== */}

          <div className="min-w-0 space-y-4">

            {/* SEARCH */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">

                {/* PRODUCT SEARCH */}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product Search
                  </label>

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search product name, SKU, barcode or brand..."
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                {/* BARCODE */}

                <form
                  onSubmit={
                    handleBarcode
                  }
                >
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Barcode Scanner
                  </label>

                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={barcode}
                      onChange={(
                        event
                      ) =>
                        setBarcode(
                          event.target
                            .value
                        )
                      }
                      placeholder="Scan / enter barcode"
                      className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400"
                    />

                    <button
                      disabled={
                        barcodeLoading
                      }
                      className="h-12 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {barcodeLoading
                        ? "..."
                        : "Add"}
                    </button>
                  </div>
                </form>

              </div>
            </div>

            {/* CATEGORIES */}

            <div className="flex gap-2 overflow-x-auto pb-1">

              <button
                type="button"
                onClick={() =>
                  setCategoryId("")
                }
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !categoryId
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                All Products
              </button>

              {categories.map(
                (category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setCategoryId(
                        category.id
                      )
                    }
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      categoryId ===
                      category.id
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {category.name}
                  </button>
                )
              )}

            </div>

            {/* PRODUCTS */}

            {productLoading ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <p className="text-sm font-medium text-slate-500">
                  Loading products...
                </p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      inventory={
                        inventoryMap[
                          product.id
                        ]
                      }
                      onAdd={
                        addProduct
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center">
                  <p className="font-semibold text-slate-700">
                    No products found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Try another search or
                    category.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* ===============================================
              RIGHT - CART
          =============================================== */}

          <div>
            <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* CART HEADER */}

              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Current Sale
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {cart.length} product
                      {cart.length === 1
                        ? ""
                        : "s"}{" "}
                      · {totalItems} units
                    </p>
                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-sm font-semibold text-red-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* CART ITEMS */}

              <div className="max-h-[430px] overflow-y-auto">

                {cart.length === 0 ? (
                  <div className="flex min-h-[280px] items-center justify-center p-8 text-center">
                    <div>
                      <p className="font-semibold text-slate-700">
                        Cart is empty
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Select a product or
                        scan a barcode to
                        begin.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cart.map(
                      (item) => {
                        const product =
                          item.product;

                        const lineTotal =
                          Number(
                            product.sellingPrice
                          ) *
                          Number(
                            item.quantity
                          );

                        return (
                          <div
                            key={
                              item.productId
                            }
                            className="p-4"
                          >
                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    product.sku
                                  }{" "}
                                  ·{" "}
                                  {money(
                                    product.sellingPrice
                                  )}{" "}
                                  /{" "}
                                  {product
                                    .sellingUnit
                                    ?.symbol ||
                                    "unit"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item.productId
                                  )
                                }
                                className="shrink-0 text-lg font-semibold text-slate-300 transition hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">

                              {/* QUANTITY */}

                              <div className="flex items-center rounded-xl border border-slate-200">

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.productId,
                                      Number(
                                        item.quantity
                                      ) -
                                        (product.allowFractionalQuantity
                                          ? 0.001
                                          : 1)
                                    )
                                  }
                                  className="h-9 w-9 text-lg text-slate-600"
                                >
                                  −
                                </button>

                                <input
                                  type="number"
                                  min={
                                    product.allowFractionalQuantity
                                      ? 0.001
                                      : 1
                                  }
                                  step={
                                    product.allowFractionalQuantity
                                      ? 0.001
                                      : 1
                                  }
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    changeQuantity(
                                      item.productId,
                                      event.target
                                        .value
                                    )
                                  }
                                  className="h-9 w-20 border-x border-slate-200 text-center text-sm font-semibold outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.productId,
                                      Number(
                                        item.quantity
                                      ) +
                                        (product.allowFractionalQuantity
                                          ? 0.001
                                          : 1)
                                    )
                                  }
                                  className="h-9 w-9 text-lg text-slate-600"
                                >
                                  +
                                </button>

                              </div>

                              <p className="font-bold text-slate-900">
                                {money(
                                  lineTotal
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

              {/* PROMOTION */}

              <div className="border-t border-slate-200 p-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Promotion Code
                </label>

                <div className="mt-2 flex gap-2">
                  <input
                    value={
                      promotionInput
                    }
                    onChange={(event) =>
                      setPromotionInput(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.preventDefault();
                        addPromotionCode();
                      }
                    }}
                    placeholder="Enter code"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-slate-400"
                  />

                  <button
                    type="button"
                    onClick={
                      addPromotionCode
                    }
                    className="rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                  >
                    Add
                  </button>
                </div>

                {promotionCodes.length >
                  0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {promotionCodes.map(
                      (code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() =>
                            removePromotion(
                              code
                            )
                          }
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                        >
                          {code} ×
                        </button>
                      )
                    )}
                  </div>
                )}

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Automatic promotions are
                  applied by the backend.
                  Enter only manual
                  promotion codes here.
                </p>
              </div>

              {/* TOTAL */}

              <div className="border-t border-slate-200 bg-slate-50 p-5">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Estimated Subtotal
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    {money(
                      estimatedSubtotal
                    )}
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Final discount, tax and
                  grand total are calculated
                  by the server when the
                  sale is created.
                </p>

                <button
                  type="button"
                  disabled={
                    submitting ||
                    !readyForSale ||
                    cart.length === 0
                  }
                  onClick={createSale}
                  className="mt-5 h-13 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting
                    ? "Creating Sale..."
                    : "Create Sale & Continue"}
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          SALE CREATED MODAL
      ================================================== */}

      {successSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 p-6">
              <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-emerald-700">
                Sale Created
              </div>

              <h2 className="mt-4 text-center text-2xl font-bold text-slate-900">
                Ready for Payment
              </h2>

              <p className="mt-2 text-center text-sm text-slate-500">
                {
                  successSale.saleNumber
                }
              </p>
            </div>

            <div className="p-6">

              <div className="space-y-4">

                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-slate-800">
                    {money(
                      successSale.subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">
                    Discount
                  </span>

                  <span className="font-semibold text-emerald-600">
                    -{" "}
                    {money(
                      successSale.discountAmount
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">
                    Tax
                  </span>

                  <span className="font-semibold text-slate-800">
                    {money(
                      successSale.taxAmount
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-end justify-between">
                    <span className="font-semibold text-slate-700">
                      Grand Total
                    </span>

                    <span className="text-3xl font-bold text-slate-900">
                      {money(
                        successSale.grandTotal
                      )}
                    </span>
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/cashier/payment/${successSale.id}`,
                    {
                      state: {
                        sale:
                          successSale,
                      },
                    }
                  )
                }
                className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Proceed to Payment
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/cashier/sales"
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View Sales
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewSale;