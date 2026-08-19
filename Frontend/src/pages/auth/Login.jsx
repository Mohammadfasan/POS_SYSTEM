import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, loading } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const user = await login(
        identifier.trim(),
        password
      );

      console.log("Logged user:", user);

      switch (user.role) {
        case "ADMIN":
          navigate("/admin", {
            replace: true,
          });
          break;

        case "MANAGER":
          navigate("/manager", {
            replace: true,
          });
          break;

        case "CASHIER":
          navigate("/cashier", {
            replace: true,
          });
          break;

        default:
          navigate("/unauthorized", {
            replace: true,
          });
      }
    } catch (error) {
      console.error("Login failed:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">
              POS
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            POS System
          </h1>

          <p className="text-slate-500 mt-2">
            Sign in to continue
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Identifier */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email or Employee ID
              </label>

              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                placeholder="Email or Employee ID"
                autoComplete="username"
                required
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  text-slate-900
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  disabled:opacity-60
                "
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-slate-300
                  bg-slate-50
                  text-slate-900
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                  disabled:opacity-60
                "
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="
                  bg-red-50
                  border
                  border-red-200
                  text-red-600
                  px-4
                  py-3
                  rounded-xl
                  text-sm
                "
              >
                {error}
              </div>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                py-3
                px-4
                rounded-xl
                bg-blue-600
                text-white
                font-semibold
                transition
                hover:bg-blue-700
                focus:outline-none
                focus:ring-4
                focus:ring-blue-200
                disabled:bg-blue-400
                disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="
                      w-5
                      h-5
                      border-2
                      border-white
                      border-t-transparent
                      rounded-full
                      animate-spin
                    "
                  />

                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Secure Point of Sale Management System
        </p>
      </div>
    </div>
  );
};

export default Login;