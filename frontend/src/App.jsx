import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { Menu, Package, Bell } from 'lucide-react';
import { ROLES, MODULE_ACCESS } from './utils/roles';
import Login from './pages/Login';
import Register from './pages/Register';
import MaterialTracking from './pages/MaterialTracking';

import DepartmentManagement from './pages/DepartmentManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import StaffManagement from './pages/StaffManagement';
import AttendanceDashboard from './pages/AttendanceDashboard';
import LeaveSystem from './pages/LeaveSystem';
import VendorManagement from './pages/VendorManagement';
import OrderManagement from './pages/OrderManagement';
import CustomerDirectory from './pages/CustomerDirectory';
import LeadsManagement from './pages/LeadsManagement';
import AcquisitionBoard from './pages/AcquisitionBoard';
import DealsManagement from './pages/DealsManagement';
import CRMInsights from './pages/CRMInsights';
import FieldAudit from './pages/FieldAudit';
import CRMOverview from './pages/CRMOverview';
import MainDashboard from './pages/MainDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';
import Notifications from './pages/Announcements';
import TaskSystem from './pages/TaskSystem';
import SalarySystem from './pages/SalarySystem';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import SalesDashboard from './pages/SalesDashboard';
import SalesInsights from './pages/SalesInsights';
import EmployeeSalary from './pages/EmployeeSalary';
import EmployeeAttendance from './pages/EmployeeAttendance';
import EmployeeTasks from './pages/EmployeeTasks';
import InventoryAnalytics from './pages/InventoryAnalytics';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  if (!user) {
    return (
      <div className="bg-[#f5f7fa] min-h-screen">
        <main className="min-h-screen text-slate-900">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f5f7fa] min-h-screen">
      <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Package size={18} />
            </div>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter">SMTBMS</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 lg:ml-64 min-h-screen text-slate-900 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

const DashboardRouter = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();
  
  if (role === ROLES.EMPLOYEE.toUpperCase()) return <EmployeeDashboard />;
  if (role === ROLES.MANAGER.toUpperCase()) return <ManagerDashboard />;
  if (role === ROLES.HR.toUpperCase()) return <HRDashboard />;
  if (role === ROLES.SALES.toUpperCase() || role === ROLES.SALES_TEAM.toUpperCase()) return <SalesDashboard />;
  
  return <MainDashboard />;
};

const SalaryRouter = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();
  
  if (role === ROLES.EMPLOYEE.toUpperCase()) return <EmployeeSalary />;
  return <SalarySystem />;
};

const TaskRouter = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();
  
  if (role === ROLES.EMPLOYEE.toUpperCase()) return <EmployeeTasks />;
  return <TaskSystem />;
};

const AttendanceRouter = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();
  
  if (role === ROLES.EMPLOYEE.toUpperCase()) return <EmployeeAttendance />;
  return <AttendanceDashboard />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes - Unified RBAC Protection */}
            <Route path="/" element={
              <ProtectedRoute roles={MODULE_ACCESS.DASHBOARD}>
                <DashboardRouter />
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute roles={MODULE_ACCESS.INVENTORY}>
                <MaterialTracking />
              </ProtectedRoute>
            } />

            <Route path="/inventory/analytics" element={
              <ProtectedRoute roles={MODULE_ACCESS.INVENTORY}>
                <InventoryAnalytics />
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute roles={MODULE_ACCESS.EMPLOYEES}>
                <StaffManagement />
              </ProtectedRoute>
            } />

            <Route path="/hrms" element={
              <ProtectedRoute roles={MODULE_ACCESS.EMPLOYEES}>
                <EmployeeManagement />
              </ProtectedRoute>
            } />

            <Route path="/hrms/departments" element={
              <ProtectedRoute roles={MODULE_ACCESS.EMPLOYEES}>
                <DepartmentManagement />
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute roles={MODULE_ACCESS.ATTENDANCE}>
                <AttendanceRouter />
              </ProtectedRoute>
            } />

            <Route path="/leaves" element={
              <ProtectedRoute roles={MODULE_ACCESS.LEAVES}>
                <LeaveSystem />
              </ProtectedRoute>
            } />

            <Route path="/erp/orders" element={
              <ProtectedRoute roles={MODULE_ACCESS.ORDERS}>
                <OrderManagement />
              </ProtectedRoute>
            } />

            {/* ERP Base Redirect */}
            <Route path="/erp" element={<Navigate to="/erp/orders" />} />

            <Route path="/erp/vendors" element={
              <ProtectedRoute roles={MODULE_ACCESS.VENDORS}>
                <VendorManagement />
              </ProtectedRoute>
            } />

            <Route path="/crm/overview" element={<ProtectedRoute roles={MODULE_ACCESS.CRM_INSIGHTS}><CRMOverview /></ProtectedRoute>} />
            <Route path="/crm/leads" element={<ProtectedRoute roles={MODULE_ACCESS.CRM_PIPELINE}><LeadsManagement /></ProtectedRoute>} />
            <Route path="/crm/customers" element={<ProtectedRoute roles={MODULE_ACCESS.CRM_CUSTOMERS}><CustomerDirectory /></ProtectedRoute>} />
            <Route path="/crm/field-audit" element={<ProtectedRoute roles={MODULE_ACCESS.FIELD_AUDIT}><FieldAudit /></ProtectedRoute>} />
            <Route path="/crm/deals" element={<ProtectedRoute roles={MODULE_ACCESS.CRM_SALES}><DealsManagement /></ProtectedRoute>} />
            <Route path="/crm/insights" element={<ProtectedRoute roles={MODULE_ACCESS.CRM_INSIGHTS}><CRMInsights /></ProtectedRoute>} />
            <Route path="/crm" element={<Navigate to="/crm/overview" />} />

            <Route path="/logs" element={
              <ProtectedRoute roles={MODULE_ACCESS.AUDIT_LOGS}>
                <ActivityLogs />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute roles={MODULE_ACCESS.SETTINGS}>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute roles={MODULE_ACCESS.REPORTS}>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/announcements" element={
              <ProtectedRoute roles={MODULE_ACCESS.ANNOUNCEMENTS}>
                <Notifications />
              </ProtectedRoute>
            } />

            <Route path="/tasks" element={
              <ProtectedRoute roles={MODULE_ACCESS.TASKS}>
                <TaskRouter />
              </ProtectedRoute>
            } />
            
            <Route path="/salary" element={
              <ProtectedRoute roles={MODULE_ACCESS.PAYROLL}>
                <SalaryRouter />
              </ProtectedRoute>
            } />

            {/* Legacy Fallback for Materials -> Inventory */}
            <Route path="/materials" element={<Navigate to="/inventory" />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
