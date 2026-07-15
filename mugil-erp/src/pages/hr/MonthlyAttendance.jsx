import { useState, useMemo } from "react";
import {
  employees,
  departments,
  ATTENDANCE_MONTH,
  ATTENDANCE_YEAR,
  calculateAttendance,
  calculateMonthlySummary,
  getAttendancePercentage,
} from "../../data/hrData";
import "./MonthlyAttendance.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";


function pad2(num) {
  return String(num).padStart(2, "0");
}

const DEFAULT_FILTERS = {
  month: `${ATTENDANCE_YEAR}-${pad2(ATTENDANCE_MONTH)}`,
  department: "",
  employeeId: "",
  search: "",
};

export default function MonthlyAttendance() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [selectedYear, selectedMonth] = useMemo(() => {
    const [y, m] = filters.month.split("-").map(Number);
    return [y, m];
  }, [filters.month]);

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const filteredEmployees = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return employees.filter((emp) => {
      if (filters.department && emp.department !== filters.department)
        return false;
      if (filters.employeeId && String(emp.id) !== String(filters.employeeId))
        return false;
      if (term) {
        const haystack = `${emp.name} ${emp.employeeCode}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [filters]);

  const employeeRows = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const summary = calculateAttendance(emp.id, selectedMonth, selectedYear);
      const attendancePercentage = getAttendancePercentage(
        emp.id,
        selectedMonth,
        selectedYear,
      );
      return {
        employee: emp,
        summary,
        attendancePercentage,
      };
    });
  }, [filteredEmployees, selectedMonth, selectedYear]);

  const monthlySummary = useMemo(
    () => calculateMonthlySummary(selectedMonth, selectedYear),
    [selectedMonth, selectedYear],
  );

  const aggregateSummary = useMemo(() => {
    const totals = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      halfDay: 0,
      holiday: 0,
      weeklyOff: 0,
      workingHours: 0,
      overtimeHours: 0,
    };
    employeeRows.forEach(({ summary }) => {
      totals.present += summary.presentDays;
      totals.absent += summary.absentDays;
      totals.late += summary.lateDays;
      totals.leave += summary.leaveDays;
      totals.halfDay += summary.halfDays;
      totals.holiday += summary.holidayDays;
      totals.weeklyOff += summary.weeklyOffDays;
      totals.workingHours += summary.totalWorkingHours;
      totals.overtimeHours += summary.totalOvertimeHours;
    });
    totals.workingHours = parseFloat(totals.workingHours.toFixed(2));
    totals.overtimeHours = parseFloat(totals.overtimeHours.toFixed(2));

    const avgAttendance = employeeRows.length
      ? parseFloat(
          (
            employeeRows.reduce(
              (sum, row) => sum + row.attendancePercentage,
              0,
            ) / employeeRows.length
          ).toFixed(2),
        )
      : 0;

    return { ...totals, avgAttendance };
  }, [employeeRows]);
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
          <h1 className="page-title">Monthly Attendance</h1>
          <p className="page-subtitle">
            Reporting Period: {selectedYear}-{pad2(selectedMonth)}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left filter-group">
          <div className="filter">
            <label className="filter-label" htmlFor="filter-month">
              Month
            </label>
            <input
              id="filter-month"
              type="month"
              className="filter-input"
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
            />
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="filter-department">
              Department
            </label>
            <select
              id="filter-department"
              className="filter-select"
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="filter-employee">
              Employee
            </label>
            <select
              id="filter-employee"
              className="filter-select"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange("employeeId", e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="filter-search">
              Search
            </label>
            <input
              id="filter-search"
              type="text"
              className="filter-input"
              placeholder="Search employee name or code"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-clear"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Present</span>
          <span className="summary-value status-present">
            {aggregateSummary.present}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Absent</span>
          <span className="summary-value status-absent">
            {aggregateSummary.absent}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Late</span>
          <span className="summary-value status-late">
            {aggregateSummary.late}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Leave</span>
          <span className="summary-value status-leave">
            {aggregateSummary.leave}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Half Day</span>
          <span className="summary-value status-half-day">
            {aggregateSummary.halfDay}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Holiday</span>
          <span className="summary-value status-holiday">
            {aggregateSummary.holiday}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Weekly Off</span>
          <span className="summary-value status-weekly-off">
            {aggregateSummary.weeklyOff}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Attendance %</span>
          <span className="summary-value">
            {aggregateSummary.avgAttendance}%
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Working Hours</span>
          <span className="summary-value">{aggregateSummary.workingHours}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">OT Hours</span>
          <span className="summary-value">
            {aggregateSummary.overtimeHours}
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-head">
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Leave</th>
              <th>Half Day</th>
              <th>Working Hours</th>
              <th>OT Hours</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {employeeRows.map(({ employee, summary, attendancePercentage }) => (
              <tr key={employee.id} className="table-row">
                <td>
                  {employee.employeeCode} - {employee.name}
                </td>
                <td>{employee.department}</td>
                <td className="status-present">{summary.presentDays}</td>
                <td className="status-absent">{summary.absentDays}</td>
                <td className="status-late">{summary.lateDays}</td>
                <td className="status-leave">{summary.leaveDays}</td>
                <td className="status-half-day">{summary.halfDays}</td>
                <td>{summary.totalWorkingHours}</td>
                <td>{summary.totalOvertimeHours}</td>
                <td>
                  <span className="badge badge-percentage">
                    {attendancePercentage}%
                  </span>
                </td>
              </tr>
            ))}
            {employeeRows.length === 0 && (
              <tr className="table-empty-row">
                <td colSpan={10}>No employees match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="footer-note">
        <span>
          Overall monthly records processed:{" "}
          {monthlySummary.totalAttendanceRecords}
        </span>
      </div>
    </div>
    </>
  );
}
