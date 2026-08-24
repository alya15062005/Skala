import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tambahkan token ke request jika ada
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid, clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => apiClient.post("/auth/login", credentials),
  getMe: () => apiClient.get("/auth/me"),
  updateProfile: (data) => apiClient.put("/auth/me", data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append("foto", file);
    return apiClient.post("/auth/upload-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  changePassword: (data) => apiClient.put("/auth/password", data),
  getUsers: () => apiClient.get("/auth/users"),
};

export const penugasanAPI = {
  getAll: () => apiClient.get("/penugasan"),
  create: (data) => apiClient.post("/penugasan", data),
  update: (id, data) => apiClient.put(`/penugasan/${id}`, data),
  delete: (id) => apiClient.delete(`/penugasan/${id}`),
  getOB: () => apiClient.get("/penugasan/ob/all"),
  createOB: (data) => apiClient.post("/penugasan/ob", data),
  updateOB: (id, data) => apiClient.put(`/penugasan/ob/${id}`, data),
  deleteOB: (id) => apiClient.delete(`/penugasan/ob/${id}`),
  getRuangan: () => apiClient.get("/penugasan/ruangan/all"),
  createRuangan: (data) => apiClient.post("/penugasan/ruangan", data),
  getTugas: () => apiClient.get("/penugasan/tugas/all"),
  createLaporan: (data, isFormData = false) => {
    const config = isFormData ? {
      headers: { "Content-Type": "multipart/form-data" }
    } : {};
    return apiClient.post("/penugasan/laporan", data, config);
  },
  getLaporan: (tanggalOrParams) => {
    const params = typeof tanggalOrParams === "string"
      ? { tanggal: tanggalOrParams }
      : (tanggalOrParams || {});
    return apiClient.get("/penugasan/laporan/all", { params });
  },
  getLaporanByPenugasan: (id_penugasan, tanggal) => apiClient.get(`/penugasan/laporan/${id_penugasan}`, {
    params: tanggal ? { tanggal } : {}
  }),
  updateLaporan: (id_laporan, data, isFormData = false) => {
    const config = isFormData ? {
      headers: { "Content-Type": "multipart/form-data" }
    } : {};
    return apiClient.put(`/penugasan/laporan/${id_laporan}`, data, config);
  },
  getAktivitas: (limit) => apiClient.get("/penugasan/aktivitas/all", {
    params: limit ? { limit } : {}
  }),
  createAktivitas: (data) => apiClient.post("/penugasan/aktivitas", data),
};

export const tugasAPI = {
  getAll: () => apiClient.get("/penugasan/tugas/all"),
  create: (data) => apiClient.post("/penugasan/tugas", data),
  update: (id, data) => apiClient.put(`/penugasan/tugas/${id}`, data),
  delete: (id) => apiClient.delete(`/penugasan/tugas/${id}`),
};

export const adminAPI = {
  getDashboardStats: () => apiClient.get("/admin/dashboard"),
  getAllUsers: () => apiClient.get("/admin/users"),
  createUser: (data) => apiClient.post("/admin/users", data),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
};

export const areaAPI = {
  getAll: () => apiClient.get("/area"),
  create: (data) => apiClient.post("/area", data),
  update: (id, data) => apiClient.put(`/area/${id}`, data),
  delete: (id) => apiClient.delete(`/area/${id}`),
};

export const shiftAPI = {
  getAll: () => apiClient.get("/shift"),
  create: (data) => apiClient.post("/shift", data),
  update: (id, data) => apiClient.put(`/shift/${id}`, data),
  delete: (id) => apiClient.delete(`/shift/${id}`),
};

// userAPI placeholder untuk KelolaUser (tanpa backend)
export const userAPI = {
  getAll: () => Promise.resolve({ data: { success: true, data: [] } }),
  create: (data) => Promise.resolve({ data: { success: true } }),
  update: (id, data) => Promise.resolve({ data: { success: true } }),
  delete: (id) => Promise.resolve({ data: { success: true } }),
};

export default apiClient;
