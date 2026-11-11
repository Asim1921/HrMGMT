import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Logout } from './pages/Logout';
import { MarkAttendance } from './pages/MarkAttendance';
import { AttendanceHistory } from './pages/AttendanceHistory';
import { MyLeaveRequests } from './pages/MyLeaveRequests';
import { LeaveBalance } from './pages/LeaveBalance';
import { ApplyForLeave } from './pages/ApplyForLeave';
import { LeavesApprovals } from './pages/LeavesApprovals';
import { Profile } from './pages/Profile';
import { ChangePassword } from './pages/ChangePassword';
import { UsersList } from './pages/UsersList';
import { TeamAttendance } from './pages/TeamAttendance';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { Announcements } from './pages/Announcements';
import { Holidays } from './pages/Holidays';
import { AuditLog } from './pages/AuditLog';
import { Documents } from './pages/Documents';
import { LeaveCalendar } from './pages/LeaveCalendar';
import { Tasks } from './pages/Tasks';
import { Chat } from './pages/Chat';

function DefaultRedirect() {
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/logout" element={<Logout />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/attendance/mark" element={<ProtectedRoute><MarkAttendance /></ProtectedRoute>} />
      <Route path="/attendance/history" element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>} />
      <Route path="/attendance/team" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><TeamAttendance /></ProtectedRoute>} />
      <Route path="/leaves/apply" element={<ProtectedRoute><ApplyForLeave /></ProtectedRoute>} />
      <Route path="/leaves/my-requests" element={<ProtectedRoute><MyLeaveRequests /></ProtectedRoute>} />
      <Route path="/leaves/balance" element={<ProtectedRoute><LeaveBalance /></ProtectedRoute>} />
      <Route path="/leaves/approvals" element={<ProtectedRoute><LeavesApprovals /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/users/list" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><UsersList /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Reports /></ProtectedRoute>} />
      <Route path="/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute allowedRoles={['super_admin']}><AuditLog /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/leave-calendar" element={<ProtectedRoute><LeaveCalendar /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}
