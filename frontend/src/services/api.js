import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const materialService = {
    getAll: () => api.get('/materials'),
    getById: (id) => api.get(`/materials/${id}`),
    create: (data) => api.post('/materials', data),
    update: (id, data) => api.put(`/materials/${id}`, data),
    delete: (id) => api.delete(`/materials/${id}`),
    updateStock: (id, data) => api.put(`/materials/${id}/stock`, data),
    getStockLogs: (id) => api.get(`/materials/${id}/logs`),
};

export const hrmsService = {
    // Departments
    getDepartments: () => api.get('/departments'),
    addDepartment: (data) => api.post('/departments', data),
    deleteDepartment: (id) => api.delete(`/departments/${id}`),

    // Employees
    getEmployees: (params) => api.get('/employees', { params }),
    getProfile: () => api.get('/employees/profile'),
    upsertEmployee: (data) => api.post('/employees', data),
    updateSalaryStructure: (id, data) => api.put(`/employees/${id}/salary`, data),
    deleteEmployee: (id) => api.delete(`/employees/${id}`),

    // Attendance
    getAttendance: () => api.get('/attendance'),
    clockIn: () => api.post('/attendance/clock-in'),
    clockOut: () => api.put('/attendance/clock-out'),

    // Leaves
    getLeaves: (params) => api.get('/leaves', { params }),
    applyLeave: (data) => api.post('/leaves', data),
    approveLeave: (id) => api.put(`/leaves/${id}/status`, { status: 'Approved' }),
    rejectLeave: (id) => api.put(`/leaves/${id}/status`, { status: 'Rejected' }),
    cancelLeave: (id) => api.put(`/leaves/${id}/status`, { status: 'Cancelled' }),
    bulkUpdateLeaves: (ids, status) => api.post('/leaves/bulk', { ids, status }),
};

export const staffService = {
    getAll: () => api.get('/staff'),
    getByRole: (role) => api.get(`/staff?role=${role}`),
    updateStatus: (id, status) => api.patch(`/staff/${id}/status`, { status }),
};

export const erpService = {
    // Vendors
    getVendors: () => api.get('/vendors'),
    addVendor: (data) => api.post('/vendors', data),
    updateVendor: (id, data) => api.put(`/vendors/${id}`, data),
    deleteVendor: (id) => api.delete(`/vendors/${id}`),

    // Orders
    getOrders: () => api.get('/orders'),
    getOrderById: (id) => api.get(`/orders/${id}`),
    createOrder: (data) => api.post('/orders', data),
    updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export const crmService = {
    // Customers
    getCustomers: () => api.get('/customers'),
    addCustomer: (data) => api.post('/customers', data),
    updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
    approveCustomer: (id) => api.put(`/customers/${id}/approve/admin`),
    adminApproveCustomer: (id) => api.put(`/customers/${id}/approve/admin`),
    managerApproveCustomer: (id) => api.put(`/customers/${id}/approve/manager`),
    approveCustomer: (id) => api.put(`/customers/${id}/approve`),
    rejectCustomer: (id) => api.put(`/customers/${id}/reject`),

    // Leads
    getLeads: () => api.get('/leads'),
    createLead: (data) => api.post('/leads', data),
    updateLeadStatus: (id, status) => api.put(`/leads/${id}/status`, { status }),
    updateFollowUp: (id, date) => api.put(`/leads/${id}/follow-up`, { next_follow_up: date }),
    convertLead: (id) => api.post(`/leads/${id}/convert`),

    // Deals
    getDeals: () => api.get('/deals'),
    createDeal: (data) => api.post('/deals', data),
    updateDealStage: (id, stage) => api.put(`/deals/${id}/stage`, { stage }),
    deleteDeal: (id) => api.delete(`/deals/${id}`),

    // Transactions
    getTransactions: () => api.get('/transactions'),
    createTransaction: (data) => api.post('/transactions', data),

    // Analytics
    getAnalytics: () => api.get('/crm/analytics'),
    recordSale: (data) => api.post('/sales', data),
    getTrends: () => api.get('/crm/trends'),
};

export const dashboardService = {
    getStats: () => api.get('/dashboard/stats'),
    getEmployeeStats: () => api.get('/dashboard/employee/stats'),
    getHRStats: () => api.get('/dashboard/hr/stats'),
    getPayrollReports: () => api.get('/dashboard/payroll/reports'),
    getSalesStats: () => api.get('/dashboard/sales/stats'),
    getSalesReports: () => api.get('/dashboard/sales/reports'),
    getAnalytics: () => api.get('/dashboard/analytics'),
    search: (query) => api.get(`/dashboard/search?q=${query}`),
};

export const logService = {
    getLogs: (limit = 50) => api.get(`/logs?limit=${limit}`),
    createLog: (data) => api.post('/logs', data),
};

export const settingsService = {
    getUsers: () => api.get('/settings/users'),
    updateUserRole: (userId, role) => api.put('/settings/users/role', { userId, role }),
};

export const notificationService = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id) => api.patch(`/announcements/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    broadcast: (data) => api.post('/notifications/broadcast', data),
    remove: (id) => api.delete(`/notifications/${id}`),
    getLatest: () => api.get('/announcements/latest'),
};

export const taskService = {
    getTasks: () => api.get('/tasks'),
    createTask: (data) => api.post('/tasks', data),
    updateTaskStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
    approveTask: (id) => api.put(`/tasks/${id}/approve`),
    deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const salaryService = {
    getSalaries: (params) => api.get('/salaries', { params }),
    getById: (id) => api.get(`/salaries/${id}`),
    batchGenerate: (data) => api.post('/salaries/batch', data),
    getJobStatus: (id) => api.get(`/salaries/jobs/${id}`),
    addAdjustment: (id, data) => api.patch(`/salaries/${id}/adjustments`, data),
    processPayment: (id, data) => api.put(`/salaries/${id}/payment`, data),
    adminReOpen: (id) => api.post(`/salaries/${id}/re-open`),
    rollbackBatch: (batchId, reason) => api.post(`/salaries/rollback/${batchId}`, { reason }),
    emergencyRollback: (data) => api.post('/payroll/rollback', data),
    logDownload: (id) => api.post(`/salaries/${id}/log-download`)
};

export const fieldAuditService = {
    getAll: () => api.get('/field-audits'),
    create: (data) => api.post('/field-audits', data),
    delete: (id) => api.delete(`/field-audits/${id}`),
};

export const auditService = {
    getBaseline: () => api.get('/audits/baseline'),
    submit: (data) => api.post('/audits', data),
    getHistory: () => api.get('/audits'),
};

export default api;
