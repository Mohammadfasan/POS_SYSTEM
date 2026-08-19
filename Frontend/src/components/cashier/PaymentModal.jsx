import { useEffect, useState } from "react";
import {
  Banknote,
  CreditCard,
  X,
  CheckCircle2,
} from "lucide-react";

const PaymentModal = ({
  open,
  total,
  onClose,
  onConfirm,
  loading,
}) => {
  const [method, setMethod] = useState("CASH");
  const [tenderedAmount, setTenderedAmount] =
    useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setTenderedAmount("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const numericTendered =
    Number(tenderedAmount) || 0;

  const change =
    method === "CASH"
      ? Math.max(numericTendered - total, 0)
      : 0;

  const handleConfirm = () => {
    setError("");

    if (method === "CASH") {
      if (!tenderedAmount) {
        setError("Enter tendered amount.");
        return;
      }

      if (numericTendered < total) {
        setError(
          "Tendered amount cannot be less than total."
        );
        return;
      }
    }

    onConfirm({
      method,
      amount: total,
      tenderedAmount:
        method === "CASH"
          ? numericTendered
          : total,
      changeAmount: change,
    });
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Complete Payment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select payment method
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={21} />
          </button>
        </div>

        <div className="p-6">
          {/* Total */}
          <div className="mb-6 rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">
              Amount to Pay
            </p>

            <h3 className="mt-1 text-3xl font-bold">
              {formatMoney(total)}
            </h3>
          </div>

          {/* Payment methods */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Payment Method
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("CASH")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-semibold transition ${
                  method === "CASH"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote size={20} />
                Cash
              </button>

              <button
                type="button"
                onClick={() => setMethod("CARD")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 font-semibold transition ${
                  method === "CARD"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard size={20} />
                Card
              </button>
            </div>
          </div>

          {/* Cash */}
          {method === "CASH" && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tendered Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={tenderedAmount}
                onChange={(e) =>
                  setTenderedAmount(e.target.value)
                }
                placeholder="Enter received amount"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              {/* Quick amounts */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[100, 500, 1000, 2000, 5000].map(
                  (amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setTenderedAmount(amount)
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Rs. {amount}
                    </button>
                  )
                )}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-4">
                <span className="font-medium text-emerald-700">
                  Change
                </span>

                <span className="text-xl font-bold text-emerald-700">
                  {formatMoney(change)}
                </span>
              </div>
            </div>
          )}

          {method === "CARD" && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              Collect card payment using the terminal,
              then confirm the transaction.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Confirm */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            <CheckCircle2 size={19} />

            {loading
              ? "Processing Payment..."
              : `Pay ${formatMoney(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;