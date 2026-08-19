import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Search, Tag, AlertCircle, ShoppingCart, RefreshCw, Barcode, CheckCircle } from "lucide-react";

const PriceCheck = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePriceCheck = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/products", {
        params: { search: query.trim(), limit: 10 },
      });
      if (response.data?.success) {
        setProducts(response.data.data?.products || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search product prices.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">Price Check</h2>
        <p className="text-slate-400 text-sm">Quick item lookup tool for price verification and barcode checks</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">Error</h4>
            <p className="text-xs text-rose-400/90">{error}</p>
          </div>
        </div>
      )}

      {/* Query Search Form */}
      <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Barcode size={18} className="text-blue-500" />
          Product Scan / Lookup
        </h3>
        <form onSubmit={handlePriceCheck} className="flex gap-3">
          <input
            type="text"
            placeholder="Scan barcode or type item name, SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 text-white rounded-xl p-3.5 text-sm focus:outline-none transition font-medium"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl text-xs transition"
          >
            {loading ? "Searching..." : "Search Price"}
          </button>
        </form>
      </div>

      {/* Query Results */}
      {query && products.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
          <Tag size={32} className="mx-auto text-slate-850" />
          <p className="text-sm">No items found matching "{query}"</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Matching Products</h3>
          <div className="grid grid-cols-1 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl hover:border-slate-800 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="space-y-1">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium inline-block">
                    {prod.category?.name || "General"}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1">{prod.name}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-450 mt-1">
                    <span>SKU: <span className="text-slate-300 font-mono font-bold">{prod.sku}</span></span>
                    {prod.barcode && (
                      <span>Barcode: <span className="text-slate-300 font-mono">{prod.barcode}</span></span>
                    )}
                    {prod.brand && <span>Brand: <span className="text-slate-350">{prod.brand}</span></span>}
                  </div>
                </div>

                {/* Price tag summary */}
                <div className="flex items-center gap-6 sm:text-right border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Base Price</span>
                    <span className="text-xl font-extrabold text-blue-450">${parseFloat(prod.sellingPrice).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status</span>
                    <span className={`border text-[9px] px-2.5 py-0.5 rounded-full font-medium inline-block mt-1 ${
                      prod.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {prod.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceCheck;
