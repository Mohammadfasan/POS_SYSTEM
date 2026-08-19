import { useState, useEffect } from "react";
import { Users, Search, UserPlus, Phone, Mail, Award, X, CheckCircle, AlertCircle } from "lucide-react";

const INITIAL_CUSTOMERS = [
  { id: "cust-1", firstName: "Alex", lastName: "Johnson", phone: "+1 (555) 019-2834", email: "alex.j@example.com", points: 240, tier: "Gold" },
  { id: "cust-2", firstName: "Sarah", lastName: "Miller", phone: "+1 (555) 014-9821", email: "sarah.m@example.com", points: 85, tier: "Silver" },
  { id: "cust-3", firstName: "Michael", lastName: "Brown", phone: "+1 (555) 017-4732", email: "mbrown@example.com", points: 390, tier: "Platinum" },
  { id: "cust-4", firstName: "Emily", lastName: "Davis", phone: "+1 (555) 012-8839", email: "emily.d@example.com", points: 30, tier: "Bronze" },
];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // New Customer Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("pos_customers");
    if (saved) {
      setCustomers(JSON.parse(saved));
    } else {
      setCustomers(INITIAL_CUSTOMERS);
      localStorage.setItem("pos_customers", JSON.stringify(INITIAL_CUSTOMERS));
    }
  }, []);

  const handleRegisterCustomer = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      alert("First name, Last name, and Phone are required.");
      return;
    }

    const newCustomer = {
      id: `cust-${Date.now()}`,
      firstName,
      lastName,
      phone,
      email: email || "n/a",
      points: 10, // Starting loyalty points
      tier: "Bronze",
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    localStorage.setItem("pos_customers", JSON.stringify(updated));

    setSuccessMsg(`Customer ${firstName} ${lastName} registered successfully!`);
    setShowAddModal(false);

    // Reset Form
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");

    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const getTierBadge = (tier) => {
    const styles = {
      Platinum: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      Gold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Silver: "bg-slate-350/10 text-slate-300 border-slate-300/20",
      Bronze: "bg-amber-800/10 text-amber-600 border-amber-800/20",
    };
    return (
      <span className={`border text-[9px] px-2 py-0.5 rounded-full font-medium ${styles[tier] || "bg-slate-800 text-slate-400"}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Customers Directory</h2>
          <p className="text-slate-400 text-sm">Register new customers and view active loyalty points accounts</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-blue-900/20 active:translate-y-[1px]"
        >
          <UserPlus size={15} />
          Register Customer
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Success</h4>
            <p className="text-xs text-emerald-400/90">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search customers by name or telephone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-white rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none transition"
        />
      </div>

      {/* Customers List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-3 bg-slate-950 border border-slate-850 rounded-2xl">
          <Users size={36} className="text-slate-800" />
          <p className="text-sm font-semibold">No customers matched your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl hover:border-slate-800 transition flex flex-col justify-between space-y-4"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-850 pb-3.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {cust.firstName} {cust.lastName}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {cust.id}</p>
                </div>
                {getTierBadge(cust.tier)}
              </div>

              {/* Body details */}
              <div className="space-y-2 text-xs text-slate-350">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-blue-500" />
                  <span>{cust.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-blue-500" />
                  <span className="truncate max-w-[200px]">{cust.email}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900 mt-2">
                  <Award size={13} className="text-amber-500" />
                  <span className="font-semibold text-slate-250">
                    Loyalty Balance: <span className="text-amber-400 font-bold">{cust.points} pts</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Register New Customer</h3>

            <form onSubmit={handleRegisterCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-450 mb-1.5 uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-455 mb-1.5 uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Johnson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-450 mb-1.5 uppercase">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-450 mb-1.5 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="alex.johnson@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-xs transition"
              >
                Register & Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
