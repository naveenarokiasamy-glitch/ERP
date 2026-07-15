import { useState, useMemo } from "react";
import {
  employees,
  ATTENDANCE_MONTH,
  ATTENDANCE_YEAR,
  getEmployeeAttendance,
  calculateAttendance,
} from "../../data/hrData";
import "./AttendanceCalendar.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_DISPLAY = {
  Present: { code: "P", className: "calendar-present" },
  Absent: { code: "A", className: "calendar-absent" },
  Late: { code: "LT", className: "calendar-late" },
  "Half Day": { code: "HD", className: "calendar-halfday" },
  Leave: { code: "L", className: "calendar-leave" },
  Holiday: { code: "H", className: "calendar-holiday" },
  "Weekly Off": { code: "WO", className: "calendar-weeklyoff" },
};

function pad2(num) {
  return String(num).padStart(2, "0");
}

function daysInMonth(year, month1Indexed) {
  return new Date(year, month1Indexed, 0).getDate();
}

export default function AttendanceCalendar() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employees[0]?.id ?? "",
  );
  const [period, setPeriod] = useState(
    `${ATTENDANCE_YEAR}-${pad2(ATTENDANCE_MONTH)}`,
  );

  const [selectedYear, selectedMonth] = useMemo(() => {
    const [y, m] = period.split("-").map(Number);
    return [y, m];
  }, [period]);

  const selectedEmployee = useMemo(
    () =>
      employees.find((emp) => String(emp.id) === String(selectedEmployeeId)),
    [selectedEmployeeId],
  );

  const attendanceByDate = useMemo(() => {
    if (!selectedEmployeeId) return new Map();
    const records = getEmployeeAttendance(selectedEmployeeId).filter((rec) => {
      const [y, m] = rec.date.split("-");
      return Number(y) === selectedYear && Number(m) === selectedMonth;
    });
    const map = new Map();
    records.forEach((rec) => map.set(rec.date, rec));
    return map;
  }, [selectedEmployeeId, selectedYear, selectedMonth]);

  const calendarCells = useMemo(() => {
    const totalDays = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const cells = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push({ key: `pad-${i}`, empty: true });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dateStr = `${selectedYear}-${pad2(selectedMonth)}-${pad2(day)}`;
      const record = attendanceByDate.get(dateStr);
      cells.push({
        key: dateStr,
        empty: false,
        day,
        date: dateStr,
        record,
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, attendanceByDate]);

  const monthSummary = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return calculateAttendance(selectedEmployeeId, selectedMonth, selectedYear);
  }, [selectedEmployeeId, selectedMonth, selectedYear]);
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/hr");
  };
  return (
    <>
      <Header />
      <div className="page">
         <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        <div className="page-header">

          <div className="page-header-left">
            <h1 className="page-title">Attendance Calendar</h1>
            <p className="page-subtitle">
              {selectedEmployee
                ? `${selectedEmployee.employeeCode} - ${selectedEmployee.name}`
                : "Select an employee"}
            </p>
          </div>
         
        </div>


        <div className="toolbar">
          <div className="toolbar-left filter-group">
            <div className="filter">
              <label className="filter-label" htmlFor="calendar-employee">
                Employee
              </label>
              <select
                id="calendar-employee"
                className="filter-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter">
              <label className="filter-label" htmlFor="calendar-month">
                Month
              </label>
              <input
                id="calendar-month"
                type="month"
                className="filter-input"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>
        </div>

        {monthSummary && (
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">Present</span>
              <span className="summary-value status-present">
                {monthSummary.presentDays}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Absent</span>
              <span className="summary-value status-absent">
                {monthSummary.absentDays}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Late</span>
              <span className="summary-value status-late">
                {monthSummary.lateDays}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Leave</span>
              <span className="summary-value status-leave">
                {monthSummary.leaveDays}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Half Day</span>
              <span className="summary-value status-half-day">
                {monthSummary.halfDays}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Holiday</span>
              <span className="summary-value status-holiday">
                {monthSummary.holidayDays}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Weekly Off</span>
              <span className="summary-value status-weekly-off">
                {monthSummary.weeklyOffDays}
              </span>
            </div>
          </div>
        )}

        <div className="calendar-legend">
          {Object.entries(STATUS_DISPLAY).map(
            ([status, { code, className }]) => (
              <div key={status} className="calendar-legend-item">
                <span className={`calendar-legend-badge ${className}`}>
                  {code}
                </span>
                <span className="calendar-legend-label">{status}</span>
              </div>
            ),
          )}
        </div>

        <div className="calendar">
          <div className="calendar-weekday-row">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarCells.map((cell) => {
              if (cell.empty) {
                return (
                  <div
                    key={cell.key}
                    className="calendar-cell calendar-cell-empty"
                  />
                );
              }

              const display = cell.record
                ? STATUS_DISPLAY[cell.record.attendanceStatus]
                : null;

              return (
                <div key={cell.key} className="calendar-cell">
                  <span className="calendar-day-number">{cell.day}</span>
                  {display && (
                    <span
                      className={`calendar-status-badge ${display.className}`}
                    >
                      {display.code}
                    </span>
                  )}
                  {cell.record && cell.record.checkIn && (
                    <span className="calendar-time-note">
                      {cell.record.checkIn}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
