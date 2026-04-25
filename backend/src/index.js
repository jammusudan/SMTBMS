const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { connectDB } = require('./config/db');

const { protect, authorize } = require('./middleware/authMiddleware');

const app = express();

// Security Middlewares
app.use(helmet()); // Set security headers
app.use(cors());
app.use(express.json());

// Rate Limiting - Relaxed for Dev/Testing usage
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased to 1000 for development flexibility
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Increased to 50 for testing multiple accounts/logins
    message: { message: 'Too many login attempts, please try again after an hour' },
    skipSuccessfulRequests: true
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);

// Connect Database
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/materials', protect, require('./routes/materialRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/crm', require('./routes/crmRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/announcements', require('./routes/notificationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/salaries', require('./routes/salaryRoutes'));
app.use('/api/payroll', require('./routes/salaryRoutes'));
app.use('/api/field-audits', require('./routes/fieldAuditRoutes'));
app.use('/api/audits', require('./routes/auditRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('SMTBMS API is running...');
});

// Port Configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
