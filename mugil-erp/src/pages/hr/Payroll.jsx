import React, { useState, useMemo } from 'react';
import {
  employees,
  departments,
  ATTENDANCE_MONTH,
  ATTENDANCE_YEAR,
  getEmployee,
  generatePayroll,
  calculatePayroll,
  updatePayroll,
  markPayrollPaid,
  getMonthlyPayroll,
  getWeeklyPayroll,
  getReferenceDate,
} from '../../data/hrData';
import './Payroll.css';

import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const SALARY_TYPES = ['Monthly', 'Daily', 'Weekly', 'Hourly'];
const PAYMENT_STATUSES = ['Paid', 'Processing', 'Pending'];

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '—';
  return value;
}

function getWeekStartDate() {
  const ref = getReferenceDate();
  if (!ref) return null;
  const refDate = new Date(ref);
  refDate.setDate(refDate.getDate() - 6);
  const y = refDate.getFullYear();
  const m = String(refDate.getMonth() + 1).padStart(2, '0');
  const d = String(refDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function statusClassName(status) {
  const normalized = String(status || '').toLowerCase().replace(/\s+/g, '-');
  return `status-badge status-badge--${normalized}`;
}

export default function Payroll() {
  const [month] = useState(ATTENDANCE_MONTH);
  const [year] = useState(ATTENDANCE_YEAR);
  const [records, setRecords] = useState(() => getMonthlyPayroll(ATTENDANCE_MONTH, ATTENDANCE_YEAR));
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [notice, setNotice] = useState('');

  const refreshList = () => {
    setRecords(getMonthlyPayroll(month, year));
  };

  const showNotice = (message) => {
    setNotice(message);
  };

  const handleGeneratePayroll = () => {
    generatePayroll(month, year);
    refreshList();
    showNotice('Payroll generated for the selected period.');
  };

  const handleRefreshAll = () => {
    refreshList();
    showNotice('Payroll list refreshed.');
  };

  const handleMarkPaid = (id) => {
    markPayrollPaid(id);
    refreshList();
    showNotice('Payroll marked as paid.');
  };

  const handleRefreshRow = (employeeId, id) => {
    const recalculated = calculatePayroll(employeeId, month, year);
    if (recalculated) {
      updatePayroll(id, recalculated);
      refreshList();
      showNotice('Payroll recalculated for employee.');
    }
  };

  const enrichedRecords = useMemo(() => {
    return records
      .map((record) => {
        const employee = getEmployee(record.employeeId);
        return employee ? { ...record, employee } : null;
      })
      .filter(Boolean);
  }, [records]);

  const filteredRecords = useMemo(() => {
    let list = enrichedRecords;

    if (departmentFilter) {
      list = list.filter((r) => r.employee.department === departmentFilter);
    }
    if (salaryTypeFilter) {
      list = list.filter((r) => r.employee.salaryType === salaryTypeFilter);
    }
    if (statusFilter) {
      list = list.filter((r) => r.paymentStatus === statusFilter);
    }
    if (employeeFilter) {
      list = list.filter((r) => String(r.employeeId) === employeeFilter);
    }
    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.employee.name.toLowerCase().includes(keyword) ||
          r.employee.employeeCode.toLowerCase().includes(keyword) ||
          r.employee.department.toLowerCase().includes(keyword)
      );
    }
    return list;
  }, [enrichedRecords, departmentFilter, salaryTypeFilter, statusFilter, employeeFilter, search]);

  const summary = useMemo(() => {
    const weekStart = getWeekStartDate();
    const weeklyRecords = weekStart ? getWeeklyPayroll(weekStart) : [];
    const weeklyTotal = weeklyRecords.reduce((sum, r) => sum + r.totalPay, 0);

    const paidRecords = enrichedRecords.filter((r) => r.paymentStatus === 'Paid');
    const pendingRecords = enrichedRecords.filter((r) => r.paymentStatus !== 'Paid');

    const grossTotal = enrichedRecords.reduce((sum, r) => sum + r.grossSalary, 0);
    const netTotal = enrichedRecords.reduce((sum, r) => sum + r.netSalary, 0);
    const overtimeTotal = enrichedRecords.reduce((sum, r) => sum + r.overtimePay, 0);
    const paidTotal = paidRecords.reduce((sum, r) => sum + r.netSalary, 0);
    const pendingTotal = pendingRecords.reduce((sum, r) => sum + r.netSalary, 0);

    return {
      weeklyTotal,
      monthlyTotal: netTotal,
      paidTotal,
      pendingTotal,
      grossTotal,
      netTotal,
      overtimeTotal,
    };
  }, [enrichedRecords]);

const navigate = useNavigate();
const handleBack = () => {
    navigate("/hr");
  };

  return (
    <>
          <Header />

    <div className="payroll-page">
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
      <header className="page-header">
        <div className="page-header-title">
          <h1>Payroll Management</h1>
          <p className="page-header-subtitle">
            Salary period: {String(month).padStart(2, '0')}/{year}
          </p>
        </div>
        <div className="page-header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search employee, code or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={handleGeneratePayroll}>
            Generate Payroll
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleRefreshAll}>
            Refresh
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice-banner">
          <span>{notice}</span>
          <button type="button" className="notice-close" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-card-label">Weekly Payroll</span>
          <span className="summary-card-value">{formatCurrency(summary.weeklyTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Monthly Payroll</span>
          <span className="summary-card-value">{formatCurrency(summary.monthlyTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Paid Salary</span>
          <span className="summary-card-value">{formatCurrency(summary.paidTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Pending Salary</span>
          <span className="summary-card-value">{formatCurrency(summary.pendingTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Gross Salary</span>
          <span className="summary-card-value">{formatCurrency(summary.grossTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Net Salary</span>
          <span className="summary-card-value">{formatCurrency(summary.netTotal)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Total Overtime Pay</span>
          <span className="summary-card-value">{formatCurrency(summary.overtimeTotal)}</span>
        </div>
      </section>

      <section className="filters-bar">
        <div className="filter-group">
          <label htmlFor="filter-department">Department</label>
          <select
            id="filter-department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-salary-type">Salary Type</label>
          <select
            id="filter-salary-type"
            value={salaryTypeFilter}
            onChange={(e) => setSalaryTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {SALARY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">Payment Status</label>
          <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-employee">Employee</label>
          <select id="filter-employee" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} - {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group filter-group--search">
          <label htmlFor="filter-search">Search</label>
          <input
            id="filter-search"
            type="text"
            placeholder="Quick search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="table-wrapper">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Salary Type</th>
              <th>Basic Salary</th>
              <th>Allowance</th>
              <th>Bonus</th>
              <th>Deduction</th>
              <th>Advance</th>
              <th>OT Pay</th>
              <th>Gross Salary</th>
              <th>Net Salary</th>
              <th>Payment Status</th>
              <th>Payment Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={15} className="table-empty-row">
                  No payroll records found.
                </td>
              </tr>
            )}
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.employee.employeeCode}</td>
                <td>{record.employee.name}</td>
                <td>{record.employee.department}</td>
                <td>{record.employee.salaryType}</td>
                <td>{formatCurrency(record.basicSalary)}</td>
                <td>{formatCurrency(record.allowance)}</td>
                <td>{formatCurrency(record.bonus)}</td>
                <td>{formatCurrency(record.deduction)}</td>
                <td>{formatCurrency(record.advance)}</td>
                <td>{formatCurrency(record.overtimePay)}</td>
                <td>{formatCurrency(record.grossSalary)}</td>
                <td>{formatCurrency(record.netSalary)}</td>
                <td>
                  <span className={statusClassName(record.paymentStatus)}>{record.paymentStatus}</span>
                </td>
                <td>{formatDate(record.paymentDate)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => setSelectedPayslip(record)}
                    >
                      View Payslip
                    </button>
                    <button
                      type="button"
                      className="btn btn-link"
                      disabled={record.paymentStatus === 'Paid'}
                      onClick={() => handleMarkPaid(record.id)}
                    >
                      Mark Paid
                    </button>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => handleRefreshRow(record.employeeId, record.id)}
                    >
                      Refresh
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedPayslip && (
        <div className="modal-overlay" onClick={() => setSelectedPayslip(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payslip - {selectedPayslip.salarySlipNumber}</h2>
              <button type="button" className="modal-close" onClick={() => setSelectedPayslip(null)}>
                ×
              </button>
            </div>
            <div className="payslip-details">
              <div className="payslip-row">
                <span className="payslip-label">Employee</span>
                <span className="payslip-value">
                  {selectedPayslip.employee.name} ({selectedPayslip.employee.employeeCode})
                </span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Department</span>
                <span className="payslip-value">{selectedPayslip.employee.department}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Salary Month</span>
                <span className="payslip-value">{selectedPayslip.salaryMonth}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Basic Salary</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.basicSalary)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Allowance</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.allowance)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Bonus</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.bonus)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Overtime Pay</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.overtimePay)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Gross Salary</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.grossSalary)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Deduction</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.deduction)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Advance</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.advance)}</span>
              </div>
              <div className="payslip-row payslip-row--total">
                <span className="payslip-label">Net Salary</span>
                <span className="payslip-value">{formatCurrency(selectedPayslip.netSalary)}</span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Payment Status</span>
                <span className={statusClassName(selectedPayslip.paymentStatus)}>
                  {selectedPayslip.paymentStatus}
                </span>
              </div>
              <div className="payslip-row">
                <span className="payslip-label">Payment Date</span>
                <span className="payslip-value">{formatDate(selectedPayslip.paymentDate)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedPayslip(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
