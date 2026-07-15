import React, { useState, useMemo } from "react";
import {
  departments,
  attendanceRecords,
  getEmployee,
  calculateDashboardSummary,
  getPaidPayroll,
  getPendingPayroll,
  generateAttendanceReport,
  generatePayrollReport,
  generateDepartmentReport,
  generateOvertimeReport,
  generateLateReport,
  paginate,
} from "../../data/hrData";
import "./Report.css";

import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const TABS = [
  { id: "attendance", label: "Attendance Report" },
  { id: "payroll", label: "Payroll Report" },
  { id: "department", label: "Department Report" },
  { id: "overtime", label: "Overtime Report" },
];

const PAGE_SIZE = 10;

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function PaginationBar({ pageInfo, onPageChange }) {
  if (!pageInfo || pageInfo.totalPages <= 1) return null;
  const { currentPage, totalPages, totalRecords } = pageInfo;

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Page {currentPage} of {totalPages} ({totalRecords} records)
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="pagination-button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function AttendanceReportPanel() {
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => {
    const f = {};
    if (department) f.department = department;
    if (status) f.status = status;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return f;
  }, [department, status, dateFrom, dateTo]);

  const report = useMemo(() => generateAttendanceReport(filters), [filters]);
  const pageData = useMemo(
    () => paginate(report.records, page, PAGE_SIZE),
    [report, page],
  );

  const withPageReset = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    

      <div className="report-section">
        <div className="filters-bar">
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select
              className="filter-select"
              value={department}
              onChange={withPageReset(setDepartment)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={status}
              onChange={withPageReset(setStatus)}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
              <option value="Holiday">Holiday</option>
              <option value="Weekly Off">Weekly Off</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">From</label>
            <input
              type="date"
              className="filter-input"
              value={dateFrom}
              onChange={withPageReset(setDateFrom)}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">To</label>
            <input
              type="date"
              className="filter-input"
              value={dateTo}
              onChange={withPageReset(setDateTo)}
            />
          </div>
        </div>

        <div className="report-summary-row">
          <div className="report-summary-chip chip-present">
            Present: {report.summary.present}
          </div>
          <div className="report-summary-chip chip-absent">
            Absent: {report.summary.absent}
          </div>
          <div className="report-summary-chip chip-late">
            Late: {report.summary.late}
          </div>
          <div className="report-summary-chip chip-half-day">
            Half Day: {report.summary.halfDay}
          </div>
          <div className="report-summary-chip chip-leave">
            Leave: {report.summary.leave}
          </div>
          <div className="report-summary-chip chip-total">
            Total Records: {report.totalRecords}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Date</th>
                <th>Day</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.data.map((rec) => {
                const emp = getEmployee(rec.employeeId);
                return (
                  <tr key={rec.id}>
                    <td>{emp ? emp.employeeCode : "-"}</td>
                    <td>{emp ? emp.name : "-"}</td>
                    <td>{emp ? emp.department : "-"}</td>
                    <td>{rec.date}</td>
                    <td>{rec.day}</td>
                    <td>{rec.checkIn || "-"}</td>
                    <td>{rec.checkOut || "-"}</td>
                    <td>{rec.workingHours}</td>
                    <td>{rec.overtimeHours}</td>
                    <td>
                      <span
                        className={`status-badge status-${slugify(rec.attendanceStatus)}`}
                      >
                        {rec.attendanceStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pageData.data.length === 0 && (
                <tr>
                  <td className="empty-row" colSpan={10}>
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar pageInfo={pageData} onPageChange={setPage} />
      </div>
    
  );
}

function PayrollReportPanel() {
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => {
    const f = {};
    if (department) f.department = department;
    if (status) f.status = status;
    return f;
  }, [department, status]);

  const report = useMemo(() => generatePayrollReport(filters), [filters]);
  const pageData = useMemo(
    () => paginate(report.records, page, PAGE_SIZE),
    [report, page],
  );

  const withPageReset = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="report-section">
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Department</label>
          <select
            className="filter-select"
            value={department}
            onChange={withPageReset(setDepartment)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Payment Status</label>
          <select
            className="filter-select"
            value={status}
            onChange={withPageReset(setStatus)}
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Processing">Processing</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="report-summary-row">
        <div className="report-summary-chip chip-total">
          Records: {report.totalRecords}
        </div>
        <div className="report-summary-chip chip-gross">
          Gross: {formatCurrency(report.totalGross)}
        </div>
        <div className="report-summary-chip chip-net">
          Net: {formatCurrency(report.totalNet)}
        </div>
        <div className="report-summary-chip chip-deduction">
          Deduction: {formatCurrency(report.totalDeduction)}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Slip No</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Basic</th>
              <th>Allowance</th>
              <th>Overtime Pay</th>
              <th>Bonus</th>
              <th>Deduction</th>
              <th>Gross</th>
              <th>Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.data.map((rec) => {
              const emp = getEmployee(rec.employeeId);
              return (
                <tr key={rec.id}>
                  <td>{rec.salarySlipNumber}</td>
                  <td>{emp ? emp.name : "-"}</td>
                  <td>{emp ? emp.department : "-"}</td>
                  <td>{formatCurrency(rec.basicSalary)}</td>
                  <td>{formatCurrency(rec.allowance)}</td>
                  <td>{formatCurrency(rec.overtimePay)}</td>
                  <td>{formatCurrency(rec.bonus)}</td>
                  <td>{formatCurrency(rec.deduction)}</td>
                  <td>{formatCurrency(rec.grossSalary)}</td>
                  <td>{formatCurrency(rec.netSalary)}</td>
                  <td>
                    <span
                      className={`status-badge status-${slugify(rec.paymentStatus)}`}
                    >
                      {rec.paymentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pageData.data.length === 0 && (
              <tr>
                <td className="empty-row" colSpan={11}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar pageInfo={pageData} onPageChange={setPage} />
    </div>
  );
}

function DepartmentReportPanel() {
  const report = useMemo(() => generateDepartmentReport(), []);

  return (
    <div className="report-section">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Head</th>
              <th>Employees</th>
              <th>Active</th>
              <th>Present Today</th>
              <th>Avg Salary</th>
              <th>Avg Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {report.map((dept) => (
              <tr key={dept.department}>
                <td>{dept.department}</td>
                <td>{dept.head}</td>
                <td>{dept.employeeCount}</td>
                <td>{dept.activeCount}</td>
                <td>{dept.presentToday}</td>
                <td>{formatCurrency(dept.avgSalary)}</td>
                <td>{dept.avgAttendancePercentage}%</td>
              </tr>
            ))}
            {report.length === 0 && (
              <tr>
                <td className="empty-row" colSpan={7}>
                  No department data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OvertimeReportPanel() {
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);

  const fullReport = useMemo(() => generateOvertimeReport(), []);
  const filteredReport = useMemo(
    () =>
      department
        ? fullReport.filter((r) => r.department === department)
        : fullReport,
    [fullReport, department],
  );
  const pageData = useMemo(
    () => paginate(filteredReport, page, PAGE_SIZE),
    [filteredReport, page],
  );

  const totalHours = useMemo(
    () => filteredReport.reduce((sum, r) => sum + r.totalOvertimeHours, 0),
    [filteredReport],
  );
  const totalPay = useMemo(
    () => filteredReport.reduce((sum, r) => sum + r.overtimePay, 0),
    [filteredReport],
  );

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
    setPage(1);
  };

  return (
    <div className="report-section">
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Department</label>
          <select
            className="filter-select"
            value={department}
            onChange={handleDepartmentChange}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="report-summary-row">
        <div className="report-summary-chip chip-total">
          Employees: {filteredReport.length}
        </div>
        <div className="report-summary-chip chip-overtime">
          Total OT Hours: {totalHours.toFixed(1)}
        </div>
        <div className="report-summary-chip chip-overtime-pay">
          Total OT Pay: {formatCurrency(totalPay)}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Overtime Hours</th>
              <th>Overtime Pay</th>
            </tr>
          </thead>
          <tbody>
            {pageData.data.map((rec) => (
              <tr key={rec.employeeId}>
                <td>{rec.employeeName}</td>
                <td>{rec.department}</td>
                <td>{rec.totalOvertimeHours}</td>
                <td>{formatCurrency(rec.overtimePay)}</td>
              </tr>
            ))}
            {pageData.data.length === 0 && (
              <tr>
                <td className="empty-row" colSpan={4}>
                  No overtime records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar pageInfo={pageData} onPageChange={setPage} />
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("attendance");

  const dashboardSummary = useMemo(() => calculateDashboardSummary(), []);
  const paidPayroll = useMemo(() => getPaidPayroll(), []);
  const pendingPayroll = useMemo(() => getPendingPayroll(), []);
  const overtimeReportAll = useMemo(() => generateOvertimeReport(), []);
  const lateReportAll = useMemo(() => generateLateReport(), []);

  const paidSalaryTotal = useMemo(
    () => paidPayroll.reduce((sum, p) => sum + p.netSalary, 0),
    [paidPayroll],
  );
  const pendingSalaryTotal = useMemo(
    () => pendingPayroll.reduce((sum, p) => sum + p.netSalary, 0),
    [pendingPayroll],
  );
  const totalOvertimeHours = useMemo(
    () => overtimeReportAll.reduce((sum, r) => sum + r.totalOvertimeHours, 0),
    [overtimeReportAll],
  );
  const leaveEmployeeCount = useMemo(() => {
    const ids = new Set(
      attendanceRecords
        .filter((r) => r.attendanceStatus === "Leave")
        .map((r) => r.employeeId),
    );
    return ids.size;
  }, []);

  const overallAttendancePercent = useMemo(() => {
    const report = generateAttendanceReport();
    const nonWorkingCount = attendanceRecords.filter(
      (r) =>
        r.attendanceStatus === "Holiday" || r.attendanceStatus === "Weekly Off",
    ).length;
    const workingRecords = report.totalRecords - nonWorkingCount;
    const presentish =
      report.summary.present + report.summary.late + report.summary.halfDay;
    return workingRecords > 0
      ? ((presentish / workingRecords) * 100).toFixed(1)
      : "0.0";
  }, []);

  const summaryCards = [
    { label: "Total Employees", value: dashboardSummary.totalEmployees },
    { label: "Attendance %", value: `${overallAttendancePercent}%` },
    {
      label: "Monthly Payroll",
      value: formatCurrency(dashboardSummary.totalPayrollThisMonth),
    },
    { label: "Paid Salary", value: formatCurrency(paidSalaryTotal) },
    { label: "Pending Salary", value: formatCurrency(pendingSalaryTotal) },
    { label: "Overtime Hours", value: `${totalOvertimeHours.toFixed(1)} hrs` },
    { label: "Late Employees", value: lateReportAll.length },
    { label: "Leave Employees", value: leaveEmployeeCount },
  ];
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/hr");
  };
  return (
    <>
      <Header />

      <div className="reports-page">
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
        <div className="reports-header">
          <h1 className="reports-title">Reports</h1>
          <p className="reports-subtitle">
            Attendance, payroll and workforce analytics
          </p>
        </div>

        <div className="summary-cards">
          {summaryCards.map((card) => (
            <div className="summary-card" key={card.label}>
              <span className="summary-card-label">{card.label}</span>
              <span className="summary-card-value">{card.value}</span>
            </div>
          ))}
        </div>

        <div className="report-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`report-tab-button${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="report-panel">
          {activeTab === "attendance" && <AttendanceReportPanel />}
          {activeTab === "payroll" && <PayrollReportPanel />}
          {activeTab === "department" && <DepartmentReportPanel />}
          {activeTab === "overtime" && <OvertimeReportPanel />}
        </div>
      </div>
    </>
  );
}
