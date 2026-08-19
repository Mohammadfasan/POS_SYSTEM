import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// Main API instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Separate instance only for refresh token
const refreshApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// -------------------------
// REQUEST INTERCEPTOR
// -------------------------

api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// -------------------------
// RESPONSE INTERCEPTOR
// -------------------------

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // No response from server
    if (!error.response) {
      return Promise.reject(error);
    }

    // Access token expired
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse =
          await refreshApi.post("/auth/refresh");

        console.log(
          "Refresh response:",
          refreshResponse.data
        );

        const newAccessToken =
          refreshResponse.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error(
            "New access token not received"
          );
        }

        // Save new access token
        localStorage.setItem(
          "accessToken",
          newAccessToken
        );

        // Add new token to failed request
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error(
          "Session refresh failed:",
          refreshError
        );

        // Clear authentication
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Redirect to login
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;