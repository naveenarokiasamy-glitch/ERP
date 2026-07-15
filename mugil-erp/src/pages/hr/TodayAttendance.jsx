import { useState, useMemo, Fragment } from "react";
import {
  employees,
  departments,
  shifts,
  attendanceRecords,
  getReferenceDate,
  updateAttendance,
} from "../../data/hrData";
import "./TodayAttendance.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";



const STATUS_OPTIONS = [
  "Present",
  "Absent",
  "Late",
  "Half Day",
  "Leave",
  "Holiday",
  "Weekly Off",
];

function statusClassName(status) {
  return `status-${String(status).toLowerCase().replace(/\s+/g, "-")}`;
}

const DEFAULT_FILTERS = {
  date: "",
  department: "",
  shift: "",
  employeeId: "",
  status: "",
  search: "",
};

export default function TodayAttendance() {
  const referenceDate = getReferenceDate();
  const [version, setVersion] = useState(0);
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    date: referenceDate,
  });
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, []);

  const joinedRecords = useMemo(() => {
    // depends on `version` so it recomputes after updateAttendance() mutations
    void version;
    const selectedDate = filters.date || referenceDate;
    return attendanceRecords
      .filter((rec) => rec.date === selectedDate)
      .map((rec) => ({ ...rec, employee: employeeMap.get(rec.employeeId) }))
      .filter((rec) => rec.employee);
  }, [filters.date, referenceDate, employeeMap, version]);

  const filteredRecords = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return joinedRecords.filter((rec) => {
      if (filters.department && rec.employee.department !== filters.department)
        return false;
      if (filters.shift && rec.employee.shift !== filters.shift) return false;
      if (
        filters.employeeId &&
        String(rec.employeeId) !== String(filters.employeeId)
      )
        return false;
      if (filters.status && rec.attendanceStatus !== filters.status)
        return false;
      if (term) {
        const haystack =
          `${rec.employee.name} ${rec.employee.employeeCode}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [joinedRecords, filters]);

  const summary = useMemo(() => {
    const s = {
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
    filteredRecords.forEach((rec) => {
      if (rec.attendanceStatus === "Present") s.present += 1;
      else if (rec.attendanceStatus === "Absent") s.absent += 1;
      else if (rec.attendanceStatus === "Late") s.late += 1;
      else if (rec.attendanceStatus === "Leave") s.leave += 1;
      else if (rec.attendanceStatus === "Half Day") s.halfDay += 1;
      else if (rec.attendanceStatus === "Holiday") s.holiday += 1;
      else if (rec.attendanceStatus === "Weekly Off") s.weeklyOff += 1;
      s.workingHours += rec.workingHours || 0;
      s.overtimeHours += rec.overtimeHours || 0;
    });
    s.workingHours = parseFloat(s.workingHours.toFixed(2));
    s.overtimeHours = parseFloat(s.overtimeHours.toFixed(2));
    return s;
  }, [filteredRecords]);

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleClearFilters() {
    setFilters({ ...DEFAULT_FILTERS, date: referenceDate });
  }

  function handleRefresh() {
    setFilters({ ...DEFAULT_FILTERS, date: referenceDate });
    setExpandedId(null);
    setEditingId(null);
    setVersion((v) => v + 1);
  }

  function handleQuickMark(recordId, status) {
    updateAttendance(recordId, { attendanceStatus: status });
    setVersion((v) => v + 1);
  }

  function handleView(recordId) {
    setExpandedId((prev) => (prev === recordId ? null : recordId));
  }

  function handleStartEdit(rec) {
    setEditingId(rec.id);
    setEditDraft({
      attendanceStatus: rec.attendanceStatus,
      checkIn: rec.checkIn || "",
      checkOut: rec.checkOut || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  function handleSaveEdit(recordId) {
    updateAttendance(recordId, {
      attendanceStatus: editDraft.attendanceStatus,
      checkIn: editDraft.checkIn || null,
      checkOut: editDraft.checkOut || null,
    });
    setEditingId(null);
    setEditDraft({});
    setVersion((v) => v + 1);
  }
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
            <h1 className="page-title">Today's Attendance</h1>
            <p className="page-subtitle">
              Reference Date: {filters.date || referenceDate}
            </p>
          </div>
          <div className="page-header-right">
            <button
              type="button"
              className="btn btn-refresh"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="toolbar-left filter-group">
            <div className="filter">
              <label className="filter-label" htmlFor="filter-date">
                Date
              </label>
              <input
                id="filter-date"
                type="date"
                className="filter-input"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
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
                onChange={(e) =>
                  handleFilterChange("department", e.target.value)
                }
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
              <label className="filter-label" htmlFor="filter-shift">
                Shift
              </label>
              <select
                id="filter-shift"
                className="filter-select"
                value={filters.shift}
                onChange={(e) => handleFilterChange("shift", e.target.value)}
              >
                <option value="">All Shifts</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.name}>
                    {shift.name}
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
                onChange={(e) =>
                  handleFilterChange("employeeId", e.target.value)
                }
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
              <label className="filter-label" htmlFor="filter-status">
                Attendance Status
              </label>
              <select
                id="filter-status"
                className="filter-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
              {summary.present}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Absent</span>
            <span className="summary-value status-absent">
              {summary.absent}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Late</span>
            <span className="summary-value status-late">{summary.late}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Leave</span>
            <span className="summary-value status-leave">{summary.leave}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Half Day</span>
            <span className="summary-value status-half-day">
              {summary.halfDay}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Holiday</span>
            <span className="summary-value status-holiday">
              {summary.holiday}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Weekly Off</span>
            <span className="summary-value status-weekly-off">
              {summary.weeklyOff}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Working Hours</span>
            <span className="summary-value">{summary.workingHours}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Overtime Hours</span>
            <span className="summary-value">{summary.overtimeHours}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th>Employee Code</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Break</th>
                <th>Working Hours</th>
                <th>OT Hours</th>
                <th>Late Minutes</th>
                <th>Early Exit</th>
                <th>Verification</th>
                <th>Device</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredRecords.map((rec) => (
                <Fragment key={rec.id}>
                  <tr className="table-row">
                    <td>{rec.employee.employeeCode}</td>
                    <td>{rec.employee.name}</td>
                    <td>{rec.employee.department}</td>
                    <td>{rec.employee.shift}</td>
                    {editingId === rec.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={editDraft.checkIn}
                            onChange={(e) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                checkIn: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={editDraft.checkOut}
                            onChange={(e) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                checkOut: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{rec.checkIn || "--"}</td>
                        <td>{rec.checkOut || "--"}</td>
                      </>
                    )}
                    <td>{rec.breakTime}</td>
                    <td>{rec.workingHours}</td>
                    <td>{rec.overtimeHours}</td>
                    <td>{rec.lateMinutes}</td>
                    <td>{rec.earlyExitMinutes}</td>
                    <td>{rec.verificationMethod || "--"}</td>
                    <td>{rec.deviceName}</td>
                    <td>
                      {editingId === rec.id ? (
                        <select
                          className="edit-select"
                          value={editDraft.attendanceStatus}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              attendanceStatus: e.target.value,
                            }))
                          }
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`badge ${statusClassName(rec.attendanceStatus)}`}
                        >
                          {rec.attendanceStatus}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {editingId === rec.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-save"
                              onClick={() => handleSaveEdit(rec.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-cancel"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-view"
                              onClick={() => handleView(rec.id)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="btn btn-edit"
                              onClick={() => handleStartEdit(rec)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-mark-present"
                              onClick={() => handleQuickMark(rec.id, "Present")}
                            >
                              Mark Present
                            </button>
                            <button
                              type="button"
                              className="btn btn-mark-absent"
                              onClick={() => handleQuickMark(rec.id, "Absent")}
                            >
                              Mark Absent
                            </button>
                            <button
                              type="button"
                              className="btn btn-mark-leave"
                              onClick={() => handleQuickMark(rec.id, "Leave")}
                            >
                              Mark Leave
                            </button>
                            <button
                              type="button"
                              className="btn btn-mark-halfday"
                              onClick={() =>
                                handleQuickMark(rec.id, "Half Day")
                              }
                            >
                              Mark Half Day
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === rec.id && (
                    <tr className="table-detail-row">
                      <td colSpan={15}>
                        <div className="detail-panel">
                          <div className="detail-item">
                            <span className="detail-label">Record ID</span>
                            <span className="detail-value">{rec.id}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Day</span>
                            <span className="detail-value">{rec.day}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Direction</span>
                            <span className="detail-value">
                              {rec.direction}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Leave Type</span>
                            <span className="detail-value">
                              {rec.leaveType || "--"}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Designation</span>
                            <span className="detail-value">
                              {rec.employee.designation}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Mobile</span>
                            <span className="detail-value">
                              {rec.employee.mobile}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filteredRecords.length === 0 && (
                <tr className="table-empty-row">
                  <td colSpan={15}>
                    No attendance records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
