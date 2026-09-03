import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useEmployees } from "./Employees.jsx";
import {
  useAttendance,
  summarizeRange,
  monthRange,
  currentMonthStr,
  formatINR,
  formatHours,
} from "./Attendancewages.jsx";
import "./Salary.css";

/* ==========================================================================
   NOTE ON SCOPE
   --------------------------------------------------------------------------
   No Employee Salary page or salary data model existed in the codebase this
   was built against, so this file introduces a minimal one rather than
   guessing at an architecture that isn't there. It defines a small,
   editable set of salary components (allowances / PF / ESI / tax / other
   deductions) per employee per month, kept in-memory the same way the
   Employees and Attendance modules are. If a real payroll backend/module
   already exists elsewhere in the app, wire that in here instead of this
   local SalaryAdjustmentsProvider.
   ========================================================================== */

function blankAdjustments() {
  return {
    allowances: 0,
    overtime: 0,
    pf: 0,
    esi: 0,
    tax: 0,
    otherDeductions: 0,
  };
}

const SalaryContext = createContext(null);

export function useSalaryAdjustments() {
  const ctx = useContext(SalaryContext);
  if (!ctx)
    throw new Error(
      "useSalaryAdjustments must be used within SalaryAdjustmentsProvider",
    );
  return ctx;
}

export function SalaryAdjustmentsProvider({ children }) {
  const [store, setStore] = useState({});

  function key(employeeId, month) {
    return `${employeeId}__${month}`;
  }

  const getAdjustments = useCallback(
    (employeeId, month) => store[key(employeeId, month)] || blankAdjustments(),
    [store],
  );

  const setAdjustments = useCallback((employeeId, month, updates) => {
    setStore((prev) => ({
      ...prev,
      [key(employeeId, month)]: {
        ...blankAdjustments(),
        ...prev[key(employeeId, month)],
        ...updates,
      },
    }));
  }, []);

  const value = useMemo(
    () => ({ getAdjustments, setAdjustments }),
    [getAdjustments, setAdjustments],
  );

  return (
    <SalaryContext.Provider value={value}>{children}</SalaryContext.Provider>
  );
}

/* ==========================================================================
   SALARY PAGE
   ========================================================================== */
/* ==========================================================================
   SALARY PAGE — with Back Button
   ========================================================================== */

function EmployeeSelect({ value, onChange, employees }) {
  return (
    <select
      className="sal-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.firstName} {e.lastName} — {e.id}
        </option>
      ))}
    </select>
  );
}

function NumberField({ label, value, onChange, hint }) {
  return (
    <label className="sal-field">
      <span className="sal-field-label">{label}</span>
      <input
        className="sal-input"
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="sal-hint">{hint}</span>}
    </label>
  );
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function Salary() {
  const { employees } = useEmployees();
  const { records, getWageConfig } = useAttendance();
  const { getAdjustments, setAdjustments } = useSalaryAdjustments();

  const activeEmployees = employees.filter((e) => !e.archived);
  const [employeeId, setEmployeeId] = useState(activeEmployees[0]?.id || "");
  const [month, setMonth] = useState(currentMonthStr());

  // Navigation handler for back button
  const handleBack = () => {
    window.history.back();
  };

  const employee = activeEmployees.find((e) => e.id === employeeId);
  const config = getWageConfig(employeeId);
  const { start, end } = monthRange(month);
  const summary = summarizeRange(records, start, end, employeeId)[
    employeeId
  ] || {
    daysWorked: 0,
    totalHours: 0,
    totalWage: 0,
    statusCounts: {},
  };

  const isHourly = config.salaryType === "HOURLY";
  const baseAmount = isHourly
    ? summary.totalWage
    : Number(config.monthlySalary) || 0;

  const draft = getAdjustments(employeeId, month);

  function updateDraft(field, value) {
    setAdjustments(employeeId, month, {
      [field]: value === "" ? 0 : Number(value),
    });
  }

  const totalEarnings =
    baseAmount +
    (Number(draft.allowances) || 0) +
    (Number(draft.overtime) || 0);
  const totalDeductions =
    (Number(draft.pf) || 0) +
    (Number(draft.esi) || 0) +
    (Number(draft.tax) || 0) +
    (Number(draft.otherDeductions) || 0);
  const netSalary = totalEarnings - totalDeductions;

  return (
    <div className="sal-page">
      <div className="sal-page-header">
        <div className="sal-page-header-left">
          <button 
            className="sal-back-btn" 
            onClick={handleBack}
            aria-label="Go back"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1>Employee Salary</h1>
            <p>
              Attendance-based wages flow in automatically for hourly employees;
              monthly-salary employees are unaffected.
            </p>
          </div>
        </div>
        <div className="sal-page-header-actions">
          <span className="sal-header-badge">Payroll</span>
        </div>
      </div>

      <div className="sal-toolbar">
        <label className="sal-field">
          <span className="sal-field-label">Employee</span>
          <EmployeeSelect
            value={employeeId}
            onChange={setEmployeeId}
            employees={activeEmployees}
          />
        </label>
        <label className="sal-field">
          <span className="sal-field-label">Salary Period</span>
          <input
            className="sal-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>

      {employee && (
        <div className="sal-card">
          <div className="sal-card-head">
            <div>
              <h2>
                {employee.firstName} {employee.lastName}
              </h2>
              <span className="sal-hint">
                {employee.id} · {employee.designation} · {monthLabel(month)}
              </span>
            </div>
            <span
              className={`sal-type-pill ${isHourly ? "sal-type-hourly" : "sal-type-monthly"}`}
            >
              {isHourly ? "Hourly Wage" : "Monthly Salary"}
            </span>
          </div>

          {isHourly ? (
            <div className="sal-section">
              <h3>Attendance Summary</h3>
              <div className="sal-attendance-grid">
                <div>
                  <span className="sal-mini-label">Working Days</span>
                  <span className="sal-mini-value">{summary.daysWorked}</span>
                </div>
                <div>
                  <span className="sal-mini-label">Total Hours</span>
                  <span className="sal-mini-value">
                    {formatHours(summary.totalHours)}
                  </span>
                </div>
                <div>
                  <span className="sal-mini-label">Hourly Wage</span>
                  <span className="sal-mini-value">
                    ₹{config.hourlyRate || 0}
                  </span>
                </div>
                <div>
                  <span className="sal-mini-label">Attendance Wage</span>
                  <span className="sal-mini-value">
                    {formatINR(summary.totalWage)}
                  </span>
                </div>
              </div>
              <p className="sal-hint">
                Calculated from each day's stored attendance and the hourly rate
                snapshotted on that record — not the current rate — so past
                months stay correct even if the rate has since changed. Edit or
                add records on the <strong>HR Attendance &amp; Wages</strong>{" "}
                page.
              </p>
            </div>
          ) : (
            <div className="sal-section">
              <h3>Base Salary</h3>
              <div className="sal-attendance-grid">
                <div>
                  <span className="sal-mini-label">Monthly Salary</span>
                  <span className="sal-mini-value">
                    {formatINR(config.monthlySalary)}
                  </span>
                </div>
              </div>
              <p className="sal-hint">
                This employee is on a fixed monthly salary, so attendance does
                not change the base amount. Configure the rate on the HR
                Attendance &amp; Wages → Wage Rates tab.
              </p>
            </div>
          )}

          <div className="sal-section">
            <h3>Salary Components</h3>
            <div className="sal-components-grid">
              <NumberField
                label="Allowances"
                value={draft.allowances}
                onChange={(v) => updateDraft("allowances", v)}
              />
              <NumberField
                label="Overtime"
                value={draft.overtime}
                onChange={(v) => updateDraft("overtime", v)}
                hint="No existing overtime system was found to integrate with — entered manually for now."
              />
              <NumberField
                label="PF Deduction"
                value={draft.pf}
                onChange={(v) => updateDraft("pf", v)}
              />
              <NumberField
                label="ESI Deduction"
                value={draft.esi}
                onChange={(v) => updateDraft("esi", v)}
              />
              <NumberField
                label="Tax (TDS)"
                value={draft.tax}
                onChange={(v) => updateDraft("tax", v)}
              />
              <NumberField
                label="Other Deductions"
                value={draft.otherDeductions}
                onChange={(v) => updateDraft("otherDeductions", v)}
              />
            </div>
          </div>

          <div className="sal-totals">
            <div className="sal-totals-row">
              <span>{isHourly ? "Attendance Wage" : "Basic Salary"}</span>
              <span>{formatINR(baseAmount)}</span>
            </div>
            <div className="sal-totals-row">
              <span>Allowances + Overtime</span>
              <span>
                +{" "}
                {formatINR(
                  (Number(draft.allowances) || 0) +
                    (Number(draft.overtime) || 0),
                )}
              </span>
            </div>
            <div className="sal-totals-row sal-totals-sub">
              <span>Gross Earnings</span>
              <span>{formatINR(totalEarnings)}</span>
            </div>
            <div className="sal-totals-row">
              <span>PF + ESI + Tax + Other Deductions</span>
              <span>− {formatINR(totalDeductions)}</span>
            </div>
            <div className="sal-totals-row sal-totals-net">
              <span>Net Salary</span>
              <span>{formatINR(netSalary)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}