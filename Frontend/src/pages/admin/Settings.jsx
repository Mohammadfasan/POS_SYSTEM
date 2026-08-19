import {
  useEffect,
  useState,
} from "react";

import {
  Settings as SettingsIcon,
  Store,
  ReceiptText,
  Printer,
  ShoppingCart,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Monitor,
  Volume2,
  Package,
  WalletCards,
  ShieldCheck,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// LOCAL STORAGE KEY
// ======================================================

const STORAGE_KEY =
  "smartpos_admin_settings";

// ======================================================
// DEFAULT SETTINGS
// ======================================================

const DEFAULT_SETTINGS = {
  // GENERAL
  systemName: "SmartPOS",
  currency: "LKR",
  currencySymbol: "Rs.",
  timezone: "Asia/Colombo",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12",

  // RECEIPT
  receiptBusinessName: "SmartPOS",
  receiptHeader: "",
  receiptFooter:
    "Thank you for shopping with us!",
  paperSize: "80mm",
  showBranch: true,
  showCashier: true,
  showInvoiceNumber: true,
  showPaymentMethod: true,
  showDiscount: true,

  // PRINTING
  autoPrintReceipt: false,
  printerName: "",
  receiptCopies: 1,
  openDrawerAfterPayment: false,

  // POS
  enableHeldBills: true,
  enableReturns: true,
  enableVoidRequests: true,
  enableDiscountRequests: true,
  lowStockWarning: true,
  confirmBeforeCancel: true,
  clearCartAfterSale: true,

  // NOTIFICATIONS
  enableNotifications: true,
  notificationSound: true,
  lowStockNotifications: true,
  returnNotifications: true,
  voidNotifications: true,
  discountNotifications: true,

  // INTERFACE
  compactMode: false,
  soundEffects: true,
};

// ======================================================
// TABS
// ======================================================

const TABS = [
  {
    id: "general",
    label: "General",
    icon: Store,
  },
  {
    id: "receipt",
    label: "Receipt",
    icon: ReceiptText,
  },
  {
    id: "printer",
    label: "Printer",
    icon: Printer,
  },
  {
    id: "pos",
    label: "POS",
    icon: ShoppingCart,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
];

// ======================================================
// TOGGLE COMPONENT
// ======================================================

const Toggle = ({
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        onChange(!checked)
      }
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked
          ? "bg-blue-600"
          : "bg-slate-300"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : ""
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  );
};

// ======================================================
// SETTING ROW
// ======================================================

const SettingRow = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <p className="font-semibold text-slate-800">
          {title}
        </p>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
};

// ======================================================
// PAGE
// ======================================================

const Settings = () => {
  const [
    activeTab,
    setActiveTab,
  ] = useState("general");

  const [
    settings,
    setSettings,
  ] = useState(
    DEFAULT_SETTINGS
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // LOAD SETTINGS
  // ====================================================

  useEffect(() => {
    try {
      setLoading(true);

      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (stored) {
        const parsed =
          JSON.parse(stored);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
        });
      }
    } catch (err) {
      console.error(
        "Load settings error:",
        err
      );

      setError(
        "Unable to load saved settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ====================================================
  // UPDATE FIELD
  // ====================================================

  const updateSetting = (
    name,
    value
  ) => {
    setSettings(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setSuccess("");
  };

  // ====================================================
  // SAVE
  // ====================================================

  const handleSave =
    async () => {
      try {
        setSaving(true);
        setError("");
        setSuccess("");

        // ===============================================
        // No backend /api/settings route currently.
        // Save locally until backend settings module
        // is implemented.
        // ===============================================

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            settings
          )
        );

        // Small async yield for button feedback.
        await Promise.resolve();

        setSuccess(
          "Settings saved successfully."
        );
      } catch (err) {
        console.error(
          "Save settings error:",
          err
        );

        setError(
          "Unable to save settings."
        );
      } finally {
        setSaving(false);
      }
    };

  // ====================================================
  // RESET
  // ====================================================

  const handleReset = () => {
    const confirmed =
      window.confirm(
        "Reset all settings to default values?"
      );

    if (!confirmed) {
      return;
    }

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );

      setSettings({
        ...DEFAULT_SETTINGS,
      });

      setSuccess(
        "Settings reset to defaults."
      );

      setError("");
    } catch (err) {
      console.error(
        "Reset settings error:",
        err
      );

      setError(
        "Unable to reset settings."
      );
    }
  };

  // ====================================================
  // GENERAL
  // ====================================================

  const renderGeneral = () => {
    return (
      <div>
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-lg font-bold text-slate-900">
            General Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Configure basic SmartPOS
            display and regional
            preferences.
          </p>
        </div>

        {/* SYSTEM NAME */}

        <SettingRow
          title="System Name"
          description="Name displayed inside the POS interface."
        >
          <input
            type="text"
            value={
              settings.systemName
            }
            onChange={(e) =>
              updateSetting(
                "systemName",
                e.target.value
              )
            }
            maxLength={50}
            className="w-full min-w-64 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-72"
          />
        </SettingRow>

        {/* CURRENCY */}

        <SettingRow
          title="Currency"
          description="Default currency displayed in the frontend."
        >
          <select
            value={
              settings.currency
            }
            onChange={(e) =>
              updateSetting(
                "currency",
                e.target.value
              )
            }
            className="w-48 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="LKR">
              LKR - Sri Lankan Rupee
            </option>

            <option value="USD">
              USD - US Dollar
            </option>
          </select>
        </SettingRow>

        {/* SYMBOL */}

        <SettingRow
          title="Currency Symbol"
          description="Short currency symbol used on POS screens."
        >
          <input
            type="text"
            value={
              settings.currencySymbol
            }
            onChange={(e) =>
              updateSetting(
                "currencySymbol",
                e.target.value
              )
            }
            maxLength={10}
            className="w-32 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </SettingRow>

        {/* TIMEZONE */}

        <SettingRow
          title="Timezone"
          description="Timezone used when displaying POS dates and times."
        >
          <select
            value={
              settings.timezone
            }
            onChange={(e) =>
              updateSetting(
                "timezone",
                e.target.value
              )
            }
            className="w-64 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
          >
            <option value="Asia/Colombo">
              Asia / Colombo
            </option>

            <option value="UTC">
              UTC
            </option>
          </select>
        </SettingRow>

        {/* DATE */}

        <SettingRow
          title="Date Format"
          description="Date display format used in the frontend."
        >
          <select
            value={
              settings.dateFormat
            }
            onChange={(e) =>
              updateSetting(
                "dateFormat",
                e.target.value
              )
            }
            className="w-48 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
          >
            <option value="DD/MM/YYYY">
              DD/MM/YYYY
            </option>

            <option value="MM/DD/YYYY">
              MM/DD/YYYY
            </option>

            <option value="YYYY-MM-DD">
              YYYY-MM-DD
            </option>
          </select>
        </SettingRow>

        {/* TIME */}

        <SettingRow
          title="Time Format"
          description="Choose between 12-hour and 24-hour display."
        >
          <select
            value={
              settings.timeFormat
            }
            onChange={(e) =>
              updateSetting(
                "timeFormat",
                e.target.value
              )
            }
            className="w-48 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
          >
            <option value="12">
              12 Hour
            </option>

            <option value="24">
              24 Hour
            </option>
          </select>
        </SettingRow>
      </div>
    );
  };

  // ====================================================
  // RECEIPT
  // ====================================================

  const renderReceipt = () => {
    return (
      <div>
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Receipt Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Configure how printed
            receipts should appear.
          </p>
        </div>

        {/* BUSINESS NAME */}

        <SettingRow
          title="Receipt Business Name"
          description="Business name shown at the top of the receipt."
        >
          <input
            type="text"
            value={
              settings.receiptBusinessName
            }
            onChange={(e) =>
              updateSetting(
                "receiptBusinessName",
                e.target.value
              )
            }
            className="w-full min-w-64 rounded-xl border border-slate-300 px-4 py-2.5 text-sm sm:w-72"
          />
        </SettingRow>

        {/* PAPER */}

        <SettingRow
          title="Paper Size"
          description="Thermal printer receipt width."
        >
          <select
            value={
              settings.paperSize
            }
            onChange={(e) =>
              updateSetting(
                "paperSize",
                e.target.value
              )
            }
            className="w-44 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
          >
            <option value="80mm">
              80 mm
            </option>

            <option value="58mm">
              58 mm
            </option>
          </select>
        </SettingRow>

        {/* HEADER */}

        <div className="border-b border-slate-100 py-5">
          <label className="font-semibold text-slate-800">
            Receipt Header
          </label>

          <p className="mt-1 text-sm text-slate-500">
            Optional message displayed
            before receipt items.
          </p>

          <textarea
            rows={3}
            maxLength={250}
            value={
              settings.receiptHeader
            }
            onChange={(e) =>
              updateSetting(
                "receiptHeader",
                e.target.value
              )
            }
            placeholder="Enter receipt header..."
            className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* FOOTER */}

        <div className="border-b border-slate-100 py-5">
          <label className="font-semibold text-slate-800">
            Receipt Footer
          </label>

          <p className="mt-1 text-sm text-slate-500">
            Message displayed at the
            bottom of every receipt.
          </p>

          <textarea
            rows={3}
            maxLength={250}
            value={
              settings.receiptFooter
            }
            onChange={(e) =>
              updateSetting(
                "receiptFooter",
                e.target.value
              )
            }
            className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <SettingRow
          title="Show Branch"
          description="Display branch information on receipts."
        >
          <Toggle
            checked={
              settings.showBranch
            }
            onChange={(value) =>
              updateSetting(
                "showBranch",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Show Cashier"
          description="Display cashier information on receipts."
        >
          <Toggle
            checked={
              settings.showCashier
            }
            onChange={(value) =>
              updateSetting(
                "showCashier",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Show Invoice Number"
          description="Display invoice number prominently on the receipt."
        >
          <Toggle
            checked={
              settings.showInvoiceNumber
            }
            onChange={(value) =>
              updateSetting(
                "showInvoiceNumber",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Show Payment Method"
          description="Display CASH, CARD or other payment information."
        >
          <Toggle
            checked={
              settings.showPaymentMethod
            }
            onChange={(value) =>
              updateSetting(
                "showPaymentMethod",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Show Discounts"
          description="Display applied discounts on receipts."
        >
          <Toggle
            checked={
              settings.showDiscount
            }
            onChange={(value) =>
              updateSetting(
                "showDiscount",
                value
              )
            }
          />
        </SettingRow>
      </div>
    );
  };

  // ====================================================
  // PRINTER
  // ====================================================

  const renderPrinter = () => {
    return (
      <div>
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Printer Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Configure frontend receipt
            printing preferences.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <p className="font-semibold text-amber-700">
                Printer integration
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-600">
                Browser settings can be
                saved here. Direct
                thermal-printer hardware
                communication needs a
                printer integration
                layer.
              </p>
            </div>
          </div>
        </div>

        <SettingRow
          title="Printer Name"
          description="Optional local printer label used by this POS."
        >
          <input
            type="text"
            value={
              settings.printerName
            }
            onChange={(e) =>
              updateSetting(
                "printerName",
                e.target.value
              )
            }
            placeholder="e.g. POS-80 Printer"
            className="w-full min-w-64 rounded-xl border border-slate-300 px-4 py-2.5 text-sm sm:w-72"
          />
        </SettingRow>

        <SettingRow
          title="Auto Print Receipt"
          description="Automatically start receipt printing after successful payment."
        >
          <Toggle
            checked={
              settings.autoPrintReceipt
            }
            onChange={(value) =>
              updateSetting(
                "autoPrintReceipt",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Receipt Copies"
          description="Default number of receipt copies."
        >
          <select
            value={
              settings.receiptCopies
            }
            onChange={(e) =>
              updateSetting(
                "receiptCopies",
                Number(
                  e.target.value
                )
              )
            }
            className="w-32 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
          >
            <option value={1}>
              1 Copy
            </option>

            <option value={2}>
              2 Copies
            </option>

            <option value={3}>
              3 Copies
            </option>
          </select>
        </SettingRow>

        <SettingRow
          title="Open Drawer After Payment"
          description="Frontend preference for opening the drawer after completed cash payment."
        >
          <Toggle
            checked={
              settings.openDrawerAfterPayment
            }
            onChange={(value) =>
              updateSetting(
                "openDrawerAfterPayment",
                value
              )
            }
          />
        </SettingRow>
      </div>
    );
  };

  // ====================================================
  // POS
  // ====================================================

  const renderPOS = () => {
    return (
      <div>
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-lg font-bold text-slate-900">
            POS Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Control available POS
            workflow features in the
            frontend.
          </p>
        </div>

        <SettingRow
          title="Held Bills"
          description="Show held-bill functionality in the POS interface."
        >
          <Toggle
            checked={
              settings.enableHeldBills
            }
            onChange={(value) =>
              updateSetting(
                "enableHeldBills",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Returns"
          description="Show the customer return-request workflow."
        >
          <Toggle
            checked={
              settings.enableReturns
            }
            onChange={(value) =>
              updateSetting(
                "enableReturns",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Void Requests"
          description="Allow the frontend to display the void-request workflow."
        >
          <Toggle
            checked={
              settings.enableVoidRequests
            }
            onChange={(value) =>
              updateSetting(
                "enableVoidRequests",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Discount Requests"
          description="Enable cashier discount request controls."
        >
          <Toggle
            checked={
              settings.enableDiscountRequests
            }
            onChange={(value) =>
              updateSetting(
                "enableDiscountRequests",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Low Stock Warning"
          description="Show stock warnings when products have low availability."
        >
          <Toggle
            checked={
              settings.lowStockWarning
            }
            onChange={(value) =>
              updateSetting(
                "lowStockWarning",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Confirm Before Cancel"
          description="Ask for confirmation before destructive POS actions."
        >
          <Toggle
            checked={
              settings.confirmBeforeCancel
            }
            onChange={(value) =>
              updateSetting(
                "confirmBeforeCancel",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Clear Cart After Sale"
          description="Automatically reset the POS cart after a completed transaction."
        >
          <Toggle
            checked={
              settings.clearCartAfterSale
            }
            onChange={(value) =>
              updateSetting(
                "clearCartAfterSale",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="Compact Interface"
          description="Use a more compact layout on POS screens."
        >
          <Toggle
            checked={
              settings.compactMode
            }
            onChange={(value) =>
              updateSetting(
                "compactMode",
                value
              )
            }
          />
        </SettingRow>

        <SettingRow
          title="POS Sound Effects"
          description="Enable frontend sounds for successful actions."
        >
          <Toggle
            checked={
              settings.soundEffects
            }
            onChange={(value) =>
              updateSetting(
                "soundEffects",
                value
              )
            }
          />
        </SettingRow>
      </div>
    );
  };

  // ====================================================
  // NOTIFICATIONS
  // ====================================================

  const renderNotifications =
    () => {
      return (
        <div>
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Notification Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure frontend
              notification
              preferences.
            </p>
          </div>

          <SettingRow
            title="Enable Notifications"
            description="Display system notifications in the frontend."
          >
            <Toggle
              checked={
                settings.enableNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "enableNotifications",
                  value
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Notification Sound"
            description="Play a sound when a new notification is displayed."
          >
            <Toggle
              checked={
                settings.notificationSound
              }
              disabled={
                !settings.enableNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "notificationSound",
                  value
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Low Stock Alerts"
            description="Display inventory low-stock notifications."
          >
            <Toggle
              checked={
                settings.lowStockNotifications
              }
              disabled={
                !settings.enableNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "lowStockNotifications",
                  value
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Return Alerts"
            description="Display notifications related to return requests."
          >
            <Toggle
              checked={
                settings.returnNotifications
              }
              disabled={
                !settings.enableNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "returnNotifications",
                  value
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Void Alerts"
            description="Display notifications related to void requests."
          >
            <Toggle
              checked={
                settings.voidNotifications
              }
              disabled={
                !settings.enableNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "voidNotifications",
                  value
                )
              }
            />
          </SettingRow>

          <SettingRow
            title="Discount Alerts"
            description="Display notifications related to discount approvals."
          >
            <Toggle
              checked={
                settings.discountNotifications
              }
              disabled={
                !settings.enableNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "discountNotifications",
                  value
                )
              }
            />
          </SettingRow>
        </div>
      );
    };

  // ====================================================
  // CONTENT
  // ====================================================

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneral();

      case "receipt":
        return renderReceipt();

      case "printer":
        return renderPrinter();

      case "pos":
        return renderPOS();

      case "notifications":
        return renderNotifications();

      default:
        return renderGeneral();
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
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
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle
            size={19}
            className="shrink-0"
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

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <SettingsIcon
              size={24}
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure SmartPOS
              application preferences.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            disabled={saving}
            onClick={
              handleReset
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw
              size={17}
            />

            Reset Defaults
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={
              handleSave
            }
            className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
          >
            {saving ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save
                size={17}
              />
            )}

            Save Settings
          </button>
        </div>
      </div>

      {/* =================================================
          LOCAL STORAGE INFORMATION
      ================================================= */}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="font-semibold text-blue-700">
              Frontend Settings
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-600">
              Current backend does not
              have a Settings API yet.
              These preferences are
              stored in this browser
              until the backend settings
              module is implemented.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN LAYOUT
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">

        {/* =================================================
            LEFT TABS
        ================================================= */}

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">

          {TABS.map(
            ({
              id,
              label,
              icon: Icon,
            }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActiveTab(id)
                }
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition last:mb-0 ${
                  activeTab === id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon
                  size={18}
                />

                {label}
              </button>
            )
          )}
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {renderContent()}
        </div>
      </div>

      {/* =================================================
          SYSTEM INFO
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Monitor
              size={19}
            />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              System Information
            </h2>

            <p className="text-sm text-slate-500">
              Current frontend
              configuration.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Application
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {settings.systemName}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              API
            </p>

            <p
              title={
                api.defaults.baseURL
              }
              className="mt-2 truncate text-sm font-semibold text-slate-800"
            >
              {api.defaults.baseURL ||
                "/api"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Receipt
            </p>

            <div className="mt-2 flex items-center gap-2">
              <ReceiptText
                size={15}
                className="text-blue-600"
              />

              <p className="font-semibold text-slate-800">
                {settings.paperSize}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Currency
            </p>

            <div className="mt-2 flex items-center gap-2">
              <WalletCards
                size={15}
                className="text-emerald-600"
              />

              <p className="font-semibold text-slate-800">
                {settings.currency}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;