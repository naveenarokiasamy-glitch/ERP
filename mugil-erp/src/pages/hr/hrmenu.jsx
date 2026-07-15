// HRMenu.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  Calendar,
  Logs,
  UserRound,
  Wallet,
  Settings,
  MonitorSmartphone,
  FileBarChart,
  Fingerprint,
} from "lucide-react";
import "./HRMenu.css"; // Create a CSS file for styling
import Header from "../../components/Header";
const HRMenu = () => {
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/hr/dashboard",
      icon: LayoutDashboard,
      description: "HR Overview & Analytics",
    },
    {
      id: "employees",
      title: "Employees",
      path: "/hr/employees",
      icon: Users,
      description: "Manage Employee Records",
    },
    {
      id: "today-attendance",
      title: "Today's Attendance",
      path: "/hr/today-attendance",
      icon: TodayAttendanceIcon,
      description: "Current Day Attendance",
    },
    {
      id: "monthly-attendance",
      title: "Monthly Attendance",
      path: "/hr/monthly-attendance",
      icon: MonthlyAttendanceIcon,
      description: "Monthly Reports & Summary",
    },
    {
      id: "attendance-calendar",
      title: "Attendance Calendar",
      path: "/hr/attendance-calendar",
      icon: CalendarIcon,
      description: "Calendar View of Attendance",
    },
    {
      id: "attendance-logs",
      title: "Attendance Logs",
      path: "/hr/attendance-logs",
      icon: LogsIcon,
      description: "Biometric Punch Logs",
    },
    {
      id: "salary-settings",
      title: "Salary Settings",
      path: "/hr/salary-settings",
      icon: Settings,
      description: "Configure Salary Structure",
    },
    {
      id: "payroll",
      title: "Payroll",
      path: "/hr/payroll",
      icon: Wallet,
      description: "Employee Payroll Management",
    },
    {
      id: "device-management",
      title: "Device Management",
      path: "/hr/device-management",
      icon: Fingerprint,
      description: "Manage Biometric Devices",
    },
    {
      id: "reports",
      title: "Reports",
      path: "/hr/reports",
      icon: FileBarChart,
      description: "Attendance & Payroll Reports",
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
     <>
          <Header />

    <div className="hr-menu-container">
      <div className="hr-menu-header">
        <h2 className="hr-menu-title">HR Management</h2>
        <p className="hr-menu-subtitle">Select a module to get started</p>
      </div>

      <div className="hr-menu-grid">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`hr-menu-card ${active ? "active" : ""}`}
            >
              <div className="hr-menu-card-icon">
                <IconComponent />
              </div>
              <div className="hr-menu-card-content">
                <h3 className="hr-menu-card-title">{item.title}</h3>
                <p className="hr-menu-card-description">{item.description}</p>
              </div>
              <div className="hr-menu-card-arrow">
                <span className="arrow-icon">→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="hr-menu-quick-actions">
        <div className="hr-menu-quick-header">
          <h3 className="quick-title">Quick Actions</h3>
        </div>
        <div className="hr-menu-quick-grid">
          <Link to="/hr/today-attendance" className="quick-action-card">
            <span className="quick-icon">📋</span>
            <span className="quick-label">Take Attendance</span>
          </Link>
          <Link to="/hr/monthly-attendance" className="quick-action-card">
            <span className="quick-icon">📊</span>
            <span className="quick-label">View Reports</span>
          </Link>
          <Link to="/hr/attendance-logs" className="quick-action-card">
            <span className="quick-icon">🔍</span>
            <span className="quick-label">Check Logs</span>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default HRMenu;

// Icons.jsx - Create this file for icons
export const DashboardIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const EmployeesIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const TodayAttendanceIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M12 2v4" />
    <path d="M12 22v-4" />
  </svg>
);

export const MonthlyAttendanceIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

export const CalendarIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const LogsIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

export const ProfileIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
