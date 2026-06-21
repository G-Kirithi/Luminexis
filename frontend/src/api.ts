import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const franchiseName = sessionStorage.getItem('franchise_name');
  if (franchiseName && config.headers) {
    config.headers['X-Franchise-Name'] = franchiseName;
  }
  return config;
});

export default api;

export const getProducts = () => api.get('/api/products').then(res => res.data);
export const getTables = () => api.get('/api/tables').then(res => res.data);
export const getOrders = () => api.get('/api/orders').then(res => res.data);
export const createOrder = (orderData: any) => api.post('/api/orders', orderData).then(res => res.data);
export const updateOrderStatus = (orderId: number, status: string) => api.put(`/api/orders/${orderId}/status?status=${status}`).then(res => res.data);
export const signupCustomer = (data: any) => api.post('/api/customers/signup', data).then(res => res.data);
export const loginCustomer = (data: any) => api.post('/api/customers/login', data).then(res => res.data);

// --- Franchise API Helpers ---
export const registerFranchise = (payload: { name: string; pin: string }) => api.post('/api/franchises', payload).then(res => res.data);
export const loginFranchise = (payload: { name: string; pin: string }) => api.post('/api/franchises/login', payload).then(res => res.data);
export const getFranchises = () => api.get('/api/franchises').then(res => res.data);
export const getFranchiseStats = () => api.get('/api/franchises/stats').then(res => res.data);
export const getFranchiseAnalytics = (name: string, params: any) => api.get(`/api/franchises/${name}/analytics`, { params }).then(res => res.data);
export const resetFranchiseDb = (name: string) => api.post(`/api/franchises/${name}/reset`).then(res => res.data);

// --- Kitchen Inventory API Helpers ---
export const getInventory = () => api.get('/api/inventory').then(res => res.data);
export const createInventoryItem = (itemData: any) => api.post('/api/inventory', itemData).then(res => res.data);
export const updateInventoryItem = (id: number, itemData: any) => api.put(`/api/inventory/${id}`, itemData).then(res => res.data);
export const deleteInventoryItem = (id: number) => api.delete(`/api/inventory/${id}`).then(res => res.data);

// --- Customer Complaints API Helpers ---
export const uploadComplaintPhoto = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/complaints/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data);
};

export const submitComplaint = (payload: any) => 
  api.post('/api/complaints', payload).then(res => res.data);

export const getComplaints = (customerPhone?: string) => {
  const params = customerPhone ? { customer_phone: customerPhone } : {};
  return api.get('/api/complaints', { params }).then(res => res.data);
};

export const updateComplaintStatus = (id: number, status: string, amount?: number) => 
  api.put(`/api/complaints/${id}/status`, { refund_status: status, refund_amount: amount }).then(res => res.data);

export const createProduct = (productData: any) => api.post('/api/products', productData).then(res => res.data);
export const deleteProduct = (id: number) => api.delete(`/api/products/${id}`).then(res => res.data);
export const getCategories = () => api.get('/api/categories').then(res => res.data);

