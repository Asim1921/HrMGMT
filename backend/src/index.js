import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { attendanceRoutes } from './routes/attendance.js';
import { leaveRoutes } from './routes/leaves.js';
import { leaveBalanceRoutes } from './routes/leave-balance.js';
import { reportRoutes } from './routes/reports.js';
import { profileRoutes } from './routes/profile.js';
import { notificationRoutes } from './routes/notifications.js';
import { announcementRoutes } from './routes/announcements.js';
import { holidayRoutes } from './routes/holidays.js';
import { auditRoutes } from './routes/audit.js';
import { documentRoutes } from './routes/documents.js';
import { taskRoutes } from './routes/tasks.js';
import { chatRoutes } from './routes/chat.js';
import { errorHandler } from './middleware/error.js';
import { initSocket } from './socket/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/leave-balance', leaveBalanceRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/chat', chatRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, service: '101HRMgmt API' }));

app.use(errorHandler);

initSocket(server);

server.listen(PORT, () => {
  console.log(`101HRMgmt API running at http://localhost:${PORT}`);
});
