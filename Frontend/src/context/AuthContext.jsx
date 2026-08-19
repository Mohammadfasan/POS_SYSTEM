import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] =
    useState(false);

  // =========================
  // LOGIN
  // =========================

  const login = async (
    identifier,
    password
  ) => {
    try {
      setLoading(true);

      const response = await api.post(
        "/auth/login",
        {
          identifier,
          password,
        }
      );

      console.log(
        "Login Response:",
        response.data
      );

      const data = response.data?.data;

      if (!data?.user) {
        throw new Error(
          "User information not found"
        );
      }

      const loggedUser = data.user;
      const accessToken =
        data.accessToken;

      if (accessToken) {
        localStorage.setItem(
          "accessToken",
          accessToken
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(loggedUser)
      );

      setUser(loggedUser);

      return loggedUser;
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data ||
          error.message
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = async () => {
    try {
      setLoading(true);

      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "Logout error:",
        error.response?.data ||
          error.message
      );
    } finally {
      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem("user");

      setUser(null);

      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};