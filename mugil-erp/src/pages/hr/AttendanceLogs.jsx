import { useState, useMemo, useEffect } from 'react';
import {
  employees,
  attendanceLogs,
  getReferenceDate,
  getDevices,
  paginate,
} from '../../data/hrData';
import './AttendanceLogs.css';
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

function statusClassName(status) {
  return `status-${String(status).toLowerCase().replace(/\s+/g, '-')}`;
}

const DEFAULT_FILTERS = {
  date: '',
  employeeId: '',
  device: '',
  verification: '',
  direction: '',
  search: '',
};

export default function AttendanceLogs() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const referenceDate = getReferenceDate();
  const devices = useMemo(() => getDevices(), []);

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, []);

  const deviceNames = useMemo(() => {
    const names = new Set(attendanceLogs.map((log) => log.device));
    return Array.from(names).sort();
  }, []);

  const verificationMethods = useMemo(() => {
    const methods = new Set(attendanceLogs.map((log) => log.verification));
    return Array.from(methods).sort();
  }, []);

  const summaryStats = useMemo(() => {
    return {
      totalLogs: attendanceLogs.length,
      todaysLogs: attendanceLogs.filter((log) => log.date === referenceDate).length,
      fingerprintLogs: attendanceLogs.filter((log) => log.verification === 'Fingerprint').length,
      faceLogs: attendanceLogs.filter((log) => log.verification === 'Face').length,
      cardLogs: attendanceLogs.filter((log) => log.verification === 'Card').length,
      deviceCount: devices.length,
    };
  }, [referenceDate, devices]);

  const joinedLogs = useMemo(() => {
    return attendanceLogs.map((log) => ({
      ...log,
      department: employeeMap.get(log.employeeId)?.department ?? 'Unknown',
    }));
  }, [employeeMap]);

  const filteredLogs = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return joinedLogs.filter((log) => {
      if (filters.date && log.date !== filters.date) return false;
      if (filters.employeeId && String(log.employeeId) !== String(filters.employeeId)) return false;
      if (filters.device && log.device !== filters.device) return false;
      if (filters.verification && log.verification !== filters.verification) return false;
      if (filters.direction && log.direction !== filters.direction) return false;
      if (term) {
        const haystack = `${log.employeeName} ${log.device}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [joinedLogs, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const paginatedResult = useMemo(
    () => paginate(filteredLogs, page, PAGE_SIZE),
    [filteredLogs, page]
  );

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function goToPage(nextPage) {
    if (nextPage < 1 || nextPage > paginatedResult.totalPages) return;
    setPage(nextPage);
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
          <h1 className="page-title">Attendance Logs</h1>
          <p className="page-subtitle">Biometric punch log history</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left filter-group">
          <div className="filter">
            <label className="filter-label" htmlFor="log-filter-date">Date</label>
            <input
              id="log-filter-date"
              type="date"
              className="filter-input"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="log-filter-employee">Employee</label>
            <select
              id="log-filter-employee"
              className="filter-select"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.name}</option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="log-filter-device">Device</label>
            <select
              id="log-filter-device"
              className="filter-select"
              value={filters.device}
              onChange={(e) => handleFilterChange('device', e.target.value)}
            >
              <option value="">All Devices</option>
              {deviceNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="log-filter-verification">Verification</label>
            <select
              id="log-filter-verification"
              className="filter-select"
              value={filters.verification}
              onChange={(e) => handleFilterChange('verification', e.target.value)}
            >
              <option value="">All Methods</option>
              {verificationMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="log-filter-direction">Direction</label>
            <select
              id="log-filter-direction"
              className="filter-select"
              value={filters.direction}
              onChange={(e) => handleFilterChange('direction', e.target.value)}
            >
              <option value="">All Directions</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>

          <div className="filter">
            <label className="filter-label" htmlFor="log-filter-search">Search</label>
            <input
              id="log-filter-search"
              type="text"
              className="filter-input"
              placeholder="Search employee or device"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <button type="button" className="btn btn-clear" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total Logs</span>
          <span className="summary-value">{summaryStats.totalLogs}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Today's Logs</span>
          <span className="summary-value">{summaryStats.todaysLogs}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Fingerprint</span>
          <span className="summary-value">{summaryStats.fingerprintLogs}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Face</span>
          <span className="summary-value">{summaryStats.faceLogs}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Card</span>
          <span className="summary-value">{summaryStats.cardLogs}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Devices</span>
          <span className="summary-value">{summaryStats.deviceCount}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-head">
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Device</th>
              <th>Verification</th>
              <th>Direction</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {paginatedResult.data.map((log) => (
              <tr key={log.id} className="table-row">
                <td>{log.date}</td>
                <td>{log.time}</td>
                <td>{log.employeeName}</td>
                <td>{log.department}</td>
                <td>{log.device}</td>
                <td>{log.verification}</td>
                <td>
                  <span className={`badge badge-direction-${log.direction.toLowerCase()}`}>
                    {log.direction}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statusClassName('Verified')}`}>Verified</span>
                </td>
              </tr>
            ))}
            {paginatedResult.data.length === 0 && (
              <tr className="table-empty-row">
                <td colSpan={8}>No logs match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          className="btn btn-page-prev"
          onClick={() => goToPage(paginatedResult.currentPage - 1)}
          disabled={paginatedResult.currentPage <= 1}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {paginatedResult.currentPage} of {Math.max(paginatedResult.totalPages, 1)} ({paginatedResult.totalRecords} logs)
        </span>
        <button
          type="button"
          className="btn btn-page-next"
          onClick={() => goToPage(paginatedResult.currentPage + 1)}
          disabled={paginatedResult.currentPage >= paginatedResult.totalPages}
        >
          Next
        </button>
      </div>
    </div>
    </>
  );
}
