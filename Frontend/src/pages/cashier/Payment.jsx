import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

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
   API REQUEST
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

const money = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

/* =========================================================
   IDEMPOTENCY KEY
========================================================= */

const generateIdempotencyKey = () => {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return `payment-${crypto.randomUUID()}`;
  }

  return `payment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

/* =========================================================
   PAYMENT METHOD CARD
========================================================= */

const PaymentMethod = ({
  value,
  current,
  title,
  description,
  onClick,
}) => {
  const active = value === current;

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-md"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <p className="font-bold">
        {title}
      </p>

      <p
        className={`mt-1 text-xs leading-5 ${
          active
            ? "text-slate-300"
            : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </button>
  );
};

/* =========================================================
   SUMMARY ROW
========================================================= */

const SummaryRow = ({
  label,
  value,
  highlight = false,
}) => (
  <div className="flex items-center justify-between gap-5 py-2">
    <span className="text-sm text-slate-500">
      {label}
    </span>

    <span
      className={
        highlight
          ? "text-lg font-bold text-slate-900"
          : "text-sm font-semibold text-slate-800"
      }
    >
      {value}
    </span>
  </div>
);

/* =========================================================
   PAYMENT
========================================================= */

const Payment = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { saleNumber } = useParams();

  /*
   * Sale may already be passed from NewSale.
   * But page also fetches by saleNumber,
   * so refresh works.
   */

  const passedSale =
    location.state?.sale || null;

  const [sale, setSale] =
    useState(passedSale);

  const [method, setMethod] =
    useState("CASH");

  const [amount, setAmount] =
    useState("");

  const [
    tenderedAmount,
    setTenderedAmount,
  ] = useState("");

  const [
    transactionReference,
    setTransactionReference,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    printingReceipt,
    setPrintingReceipt,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    completedPayment,
    setCompletedPayment,
  ] = useState(null);

  /*
   * We keep the same key if a network/error retry happens
   * without changing payment form values.
   */

  const idempotencyKeyRef =
    useRef(null);

  /* =======================================================
     LOAD SALE
  ======================================================= */

  const loadSale = useCallback(
    async () => {
      if (!saleNumber) {
        setError(
          "Sale number is missing"
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await apiRequest(
            `/sales/number/${encodeURIComponent(
              saleNumber
            )}`
          );

        const loadedSale =
          response?.data?.sale;

        if (!loadedSale) {
          throw new Error(
            "Sale information not found"
          );
        }

        setSale(loadedSale);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load sale"
        );
      } finally {
        setLoading(false);
      }
    },
    [saleNumber]
  );

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  /* =======================================================
     PAYMENT SUMMARY
  ======================================================= */

  const grandTotal = Number(
    sale?.grandTotal || 0
  );

  const paidAmount = Number(
    sale?.paymentSummary
      ?.paidAmount || 0
  );

  const remainingAmount = Number(
    sale?.paymentSummary
      ?.remainingAmount ??
      grandTotal
  );

  const fullyPaid =
    sale?.paymentSummary
      ?.fullyPaid ||
    sale?.status === "COMPLETED";

  /* =======================================================
     INITIAL PAYMENT AMOUNT
  ======================================================= */

  useEffect(() => {
    if (
      remainingAmount > 0 &&
      !completedPayment
    ) {
      setAmount(
        remainingAmount.toFixed(2)
      );

      setTenderedAmount(
        remainingAmount.toFixed(2)
      );
    }
  }, [
    remainingAmount,
    completedPayment,
  ]);

  /* =======================================================
     RESET IDEMPOTENCY WHEN FORM CHANGES
  ======================================================= */

  useEffect(() => {
    idempotencyKeyRef.current =
      null;
  }, [
    method,
    amount,
    tenderedAmount,
    transactionReference,
    note,
  ]);

  /* =======================================================
     METHOD CHANGE
  ======================================================= */

  const changeMethod = (
    newMethod
  ) => {
    setMethod(newMethod);
    setError("");
    setSuccess("");

    if (newMethod === "CASH") {
      setTransactionReference("");

      const value = Number(
        amount || remainingAmount
      );

      setTenderedAmount(
        value > 0
          ? value.toFixed(2)
          : ""
      );
    } else {
      setTenderedAmount("");
    }
  };

  /* =======================================================
     QUICK AMOUNTS
  ======================================================= */

  const setFullAmount = () => {
    const value =
      remainingAmount.toFixed(2);

    setAmount(value);

    if (method === "CASH") {
      setTenderedAmount(value);
    }
  };

  const setHalfAmount = () => {
    const value =
      remainingAmount / 2;

    setAmount(
      value.toFixed(2)
    );

    if (method === "CASH") {
      setTenderedAmount(
        value.toFixed(2)
      );
    }
  };

  /* =======================================================
     CHANGE
  ======================================================= */

  const changeAmount = useMemo(() => {
    if (method !== "CASH") {
      return 0;
    }

    const tendered = Number(
      tenderedAmount || 0
    );

    const payment = Number(
      amount || 0
    );

    if (
      !Number.isFinite(tendered) ||
      !Number.isFinite(payment)
    ) {
      return 0;
    }

    return Math.max(
      tendered - payment,
      0
    );
  }, [
    method,
    tenderedAmount,
    amount,
  ]);

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validatePayment = () => {
    const paymentValue =
      Number(amount);

    if (
      !Number.isFinite(
        paymentValue
      ) ||
      paymentValue <= 0
    ) {
      return "Payment amount must be greater than zero";
    }

    if (
      paymentValue >
      remainingAmount
    ) {
      return `Payment cannot exceed remaining amount ${money(
        remainingAmount
      )}`;
    }

    if (method === "CASH") {
      const tendered =
        Number(
          tenderedAmount
        );

      if (
        !Number.isFinite(
          tendered
        ) ||
        tendered < 0
      ) {
        return "Enter a valid tendered amount";
      }

      if (
        tendered <
        paymentValue
      ) {
        return "Tendered amount cannot be less than payment amount";
      }
    }

    if (
      (method === "CARD" ||
        method === "QR") &&
      !transactionReference.trim()
    ) {
      return `${method} transaction reference is required`;
    }

    return null;
  };

  /* =======================================================
     PROCESS PAYMENT
  ======================================================= */

  const processPayment =
    async () => {
      setError("");
      setSuccess("");

      const validationError =
        validatePayment();

      if (validationError) {
        setError(validationError);
        return;
      }

      if (!sale?.id) {
        setError(
          "Sale ID is missing"
        );

        return;
      }

      try {
        setSubmitting(true);

        /*
         * Generate only once for this exact form state.
         */

        if (
          !idempotencyKeyRef.current
        ) {
          idempotencyKeyRef.current =
            generateIdempotencyKey();
        }

        const body = {
          saleId:
            sale.id,

          method,

          amount:
            Number(amount),

          ...(method === "CASH"
            ? {
                tenderedAmount:
                  Number(
                    tenderedAmount
                  ),
              }
            : {}),

          ...(method === "CARD" ||
          method === "QR"
            ? {
                transactionReference:
                  transactionReference.trim(),
              }
            : {}),

          ...(note.trim()
            ? {
                note:
                  note.trim(),
              }
            : {}),
        };

        const response =
          await apiRequest(
            "/payments",
            {
              method: "POST",

              headers: {
                "Idempotency-Key":
                  idempotencyKeyRef.current,
              },

              body:
                JSON.stringify(
                  body
                ),
            }
          );

        const result =
          response?.data;

        if (!result) {
          throw new Error(
            "Payment response is missing"
          );
        }

        setCompletedPayment(
          result
        );

        /*
         * This request has completed.
         * Next payment must use another key.
         */

        idempotencyKeyRef.current =
          null;

        if (result.fullyPaid) {
          setSuccess(
            "Payment completed successfully. Sale finalized."
          );
        } else {
          setSuccess(
            `Partial payment recorded. Remaining: ${money(
              result.remainingAmount
            )}`
          );
        }

        /*
         * Fetch sale again.
         *
         * This gives updated:
         * status
         * invoiceNumber
         * paymentSummary
         */

        const saleResponse =
          await apiRequest(
            `/sales/number/${encodeURIComponent(
              saleNumber
            )}`
          );

        const updatedSale =
          saleResponse?.data?.sale;

        if (updatedSale) {
          setSale(updatedSale);

          if (
            !result.fullyPaid
          ) {
            const remaining =
              Number(
                updatedSale
                  ?.paymentSummary
                  ?.remainingAmount ||
                  0
              );

            setAmount(
              remaining.toFixed(2)
            );

            if (
              method === "CASH"
            ) {
              setTenderedAmount(
                remaining.toFixed(2)
              );
            }

            setTransactionReference(
              ""
            );
          }
        }
      } catch (err) {
        /*
         * Idempotency key stays the same
         * after failure so same request can
         * safely be retried.
         */

        setError(
          err.message ||
            "Unable to process payment"
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =======================================================
     PRINT RECEIPT
  ======================================================= */

  const printReceipt = async () => {
    if (!sale?.id) {
      return;
    }

    try {
      setPrintingReceipt(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/receipts/sale/${sale.id}/text`,
        {
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const text =
        await response.text();

      if (!response.ok) {
        throw new Error(
          text ||
            "Unable to generate receipt"
        );
      }

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=500,height=700"
        );

      if (!printWindow) {
        throw new Error(
          "Popup blocked. Allow popups to print the receipt."
        );
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>
              Receipt - ${
                sale.invoiceNumber ||
                sale.saleNumber
              }
            </title>

            <style>
              body {
                margin: 0;
                padding: 24px;
                background: white;
                color: black;
                font-family: "Courier New", monospace;
              }

              pre {
                white-space: pre-wrap;
                font-size: 13px;
                line-height: 1.4;
              }

              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>

          <body>
            <pre>${text
              .replaceAll(
                "&",
                "&amp;"
              )
              .replaceAll(
                "<",
                "&lt;"
              )
              .replaceAll(
                ">",
                "&gt;"
              )}</pre>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      setError(
        err.message ||
          "Unable to print receipt"
      );
    } finally {
      setPrintingReceipt(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading payment...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     SALE NOT FOUND
  ======================================================= */

  if (!sale) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Sale Not Available
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "Unable to find this sale."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/cashier/new-sale"
              )
            }
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
          >
            Back to New Sale
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

          <div>
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="mb-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              ← Back
            </button>

            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Payment
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Complete Payment
            </h1>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              <span>
                Sale:{" "}
                <strong className="text-slate-700">
                  {sale.saleNumber}
                </strong>
              </span>

              {sale.invoiceNumber && (
                <span>
                  Invoice:{" "}
                  <strong className="text-slate-700">
                    {
                      sale.invoiceNumber
                    }
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              fullyPaid
                ? "bg-emerald-50 text-emerald-700"
                : sale.status ===
                    "PARTIALLY_PAID"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            {sale.status}
          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">
              {success}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_430px]">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-5">

            {/* ===============================================
                FULLY PAID
            =============================================== */}

            {fullyPaid ? (
              <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">

                <div className="mx-auto max-w-xl text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                    ✓
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    Payment Completed
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The sale has been fully
                    paid and finalized
                    successfully.
                  </p>

                  {sale.invoiceNumber && (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-5">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Invoice Number
                      </p>

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {
                          sale.invoiceNumber
                        }
                      </p>

                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={
                        printReceipt
                      }
                      disabled={
                        printingReceipt
                      }
                      className="rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {printingReceipt
                        ? "Preparing..."
                        : "Print Receipt"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/cashier/new-sale"
                        )
                      }
                      className="rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      New Sale
                    </button>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/cashier/sales"
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Sales History
                  </button>

                </div>
              </div>
            ) : (
              <>
                {/* ===========================================
                    PAYMENT METHOD
                =========================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Payment Method
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select how the
                      customer is paying.
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <PaymentMethod
                      value="CASH"
                      current={
                        method
                      }
                      title="Cash"
                      description="Cash payment with change"
                      onClick={
                        changeMethod
                      }
                    />

                    <PaymentMethod
                      value="CARD"
                      current={
                        method
                      }
                      title="Card"
                      description="Debit or credit card"
                      onClick={
                        changeMethod
                      }
                    />

                    <PaymentMethod
                      value="QR"
                      current={
                        method
                      }
                      title="QR"
                      description="QR / digital payment"
                      onClick={
                        changeMethod
                      }
                    />

                  </div>
                </div>

                {/* ===========================================
                    PAYMENT AMOUNT
                =========================================== */}

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Payment Amount
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Full or partial
                        payment can be
                        processed.
                      </p>
                    </div>

                    <p className="text-xl font-bold text-slate-900">
                      {money(
                        remainingAmount
                      )}{" "}
                      due
                    </p>

                  </div>

                  <div className="mt-6">

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount to Pay
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        LKR
                      </span>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={
                          remainingAmount
                        }
                        value={amount}
                        onChange={(
                          event
                        ) =>
                          setAmount(
                            event.target
                              .value
                          )
                        }
                        className="h-14 w-full rounded-xl border border-slate-200 pl-14 pr-4 text-xl font-bold text-slate-900 outline-none transition focus:border-slate-400"
                      />

                    </div>

                    <div className="mt-3 flex gap-2">

                      <button
                        type="button"
                        onClick={
                          setFullAmount
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Full Amount
                      </button>

                      <button
                        type="button"
                        onClick={
                          setHalfAmount
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Half
                      </button>

                    </div>

                  </div>

                  {/* =========================================
                      CASH
                  ========================================= */}

                  {method === "CASH" && (
                    <div className="mt-6 border-t border-slate-100 pt-6">

                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cash Tendered
                      </label>

                      <div className="relative">

                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                          LKR
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            tenderedAmount
                          }
                          onChange={(
                            event
                          ) =>
                            setTenderedAmount(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-14 w-full rounded-xl border border-slate-200 pl-14 pr-4 text-xl font-bold text-slate-900 outline-none focus:border-slate-400"
                        />

                      </div>

                      <div className="mt-4 rounded-xl bg-emerald-50 p-4">

                        <div className="flex items-center justify-between">

                          <span className="text-sm font-semibold text-emerald-700">
                            Change
                          </span>

                          <span className="text-2xl font-bold text-emerald-700">
                            {money(
                              changeAmount
                            )}
                          </span>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* =========================================
                      CARD / QR
                  ========================================= */}

                  {(method === "CARD" ||
                    method === "QR") && (
                    <div className="mt-6 border-t border-slate-100 pt-6">

                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Transaction Reference
                      </label>

                      <input
                        type="text"
                        value={
                          transactionReference
                        }
                        onChange={(
                          event
                        ) =>
                          setTransactionReference(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={
                          method === "CARD"
                            ? "Card transaction / approval reference"
                            : "QR transaction reference"
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400"
                      />

                    </div>
                  )}

                  {/* =========================================
                      NOTE
                  ========================================= */}

                  <div className="mt-6 border-t border-slate-100 pt-6">

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Note
                      <span className="ml-1 font-normal normal-case text-slate-400">
                        optional
                      </span>
                    </label>

                    <textarea
                      rows="3"
                      maxLength="500"
                      value={note}
                      onChange={(
                        event
                      ) =>
                        setNote(
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional payment note..."
                      className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
                    />

                  </div>

                </div>

                {/* ===========================================
                    PROCESS
                =========================================== */}

                <button
                  type="button"
                  onClick={
                    processPayment
                  }
                  disabled={
                    submitting
                  }
                  className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting
                    ? "Processing Payment..."
                    : `Process ${method} Payment`}
                </button>
              </>
            )}
          </div>

          {/* =================================================
              RIGHT SUMMARY
          ================================================= */}

          <div>
            <div className="sticky top-5 space-y-5">

              {/* ===============================================
                  ORDER SUMMARY
              =============================================== */}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 p-5">

                  <h2 className="font-bold text-slate-900">
                    Order Summary
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {sale.saleNumber}
                  </p>

                </div>

                {/* ITEMS */}

                <div className="max-h-[330px] overflow-y-auto">

                  {sale?.items?.length >
                  0 ? (
                    <div className="divide-y divide-slate-100">

                      {sale.items.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="p-4"
                          >

                            <div className="flex justify-between gap-4">

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {item.productName ||
                                    item
                                      .product
                                      ?.name ||
                                    "Product"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Qty:{" "}
                                  {
                                    item.quantity
                                  }{" "}
                                  {item.selectedUnitSymbol ||
                                    ""}
                                </p>

                              </div>

                              <p className="shrink-0 text-sm font-bold text-slate-800">
                                {money(
                                  item.lineTotal
                                )}
                              </p>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No sale items
                    </div>
                  )}

                </div>

                {/* TOTALS */}

                <div className="border-t border-slate-200 p-5">

                  <SummaryRow
                    label="Subtotal"
                    value={money(
                      sale.subtotal
                    )}
                  />

                  <SummaryRow
                    label="Discount"
                    value={`- ${money(
                      sale.discountAmount
                    )}`}
                  />

                  <SummaryRow
                    label="Tax"
                    value={money(
                      sale.taxAmount
                    )}
                  />

                  <div className="my-2 border-t border-slate-200" />

                  <SummaryRow
                    label="Grand Total"
                    value={money(
                      sale.grandTotal
                    )}
                    highlight
                  />

                </div>
              </div>

              {/* ===============================================
                  PAYMENT STATUS
              =============================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <h2 className="font-bold text-slate-900">
                  Payment Status
                </h2>

                <div className="mt-4 space-y-1">

                  <SummaryRow
                    label="Grand Total"
                    value={money(
                      grandTotal
                    )}
                  />

                  <SummaryRow
                    label="Paid"
                    value={money(
                      paidAmount
                    )}
                  />

                  <div className="my-2 border-t border-slate-100" />

                  <SummaryRow
                    label="Remaining"
                    value={money(
                      remainingAmount
                    )}
                    highlight
                  />

                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${
                        grandTotal > 0
                          ? Math.min(
                              (paidAmount /
                                grandTotal) *
                                100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />

                </div>

                <p className="mt-2 text-right text-xs font-semibold text-slate-500">
                  {grandTotal > 0
                    ? Math.min(
                        (paidAmount /
                          grandTotal) *
                          100,
                        100
                      ).toFixed(0)
                    : 0}
                  % paid
                </p>

              </div>

              {/* ===============================================
                  CURRENT PAYMENT RESULT
              =============================================== */}

              {completedPayment
                ?.payment && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                    Last Payment
                  </p>

                  <p className="mt-2 font-bold text-emerald-900">
                    {
                      completedPayment
                        .payment
                        .paymentNumber
                    }
                  </p>

                  <div className="mt-4 space-y-2">

                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">
                        Method
                      </span>

                      <span className="font-bold text-emerald-900">
                        {
                          completedPayment
                            .payment
                            .method
                        }
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">
                        Amount
                      </span>

                      <span className="font-bold text-emerald-900">
                        {money(
                          completedPayment
                            .payment
                            .amount
                        )}
                      </span>
                    </div>

                    {completedPayment
                      .payment
                      .method ===
                      "CASH" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700">
                          Change
                        </span>

                        <span className="font-bold text-emerald-900">
                          {money(
                            completedPayment
                              .payment
                              .changeAmount
                          )}
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Payment;