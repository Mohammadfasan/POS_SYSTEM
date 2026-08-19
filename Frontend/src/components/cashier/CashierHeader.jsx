import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { Clock, User as UserIcon, Store, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "react-router-dom";

const CashierHeader = () => {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCurrentShift = async () => {
      try {
        const response = await api.get("/shifts/current");
        if (response.data?.success) {
          setCurrentShift(response.data.data?.shift);
        }
      } catch (err) {
        // Shift might not be open, which is fine
        setCurrentShift(null);
      }
    };

    fetchCurrentShift();
    // Refresh shift status every 30 seconds
    const interval = setInterval(fetchCurrentShift, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left section: Terminal & Branch Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Store size={16} className="text-blue-500" />
          <span className="font-semibold text-slate-200">Branch:</span>
          <span>{user?.branch?.name || "Main Branch"}</span>
        </div>

        {currentShift ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Shift Active: {currentShift.shiftNumber}
          </div>
        ) : (
          <Link
            to="/cashier/shift"
            className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-full font-medium hover:bg-rose-500/20 transition"
          >
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            No Active Shift (Start Shift)
          </Link>
        )}
      </div>

      {/* Right section: User Details & Time */}
      <div className="flex items-center gap-6">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm border-r border-slate-800 pr-6">
          <Clock size={16} className="text-blue-500" />
          <span>
            {time.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            {time.toLocaleTimeString()}
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <UserIcon size={18} />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-slate-200">
              {user?.firstName} {user?.lastName}
            </h4>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Shield size={12} className="text-blue-500" />
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CashierHeader;
