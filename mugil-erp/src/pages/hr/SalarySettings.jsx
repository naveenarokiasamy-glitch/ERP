import React, { useState, useEffect } from "react";
import {
  employees,
  salarySettings,
  getEmployee,
  updateEmployee,
  searchEmployees,
} from "../../data/hrData";
import "./SalarySettings.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const SALARY_TYPES = ["Monthly", "Daily", "Weekly", "Hourly"];
const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function updateSalarySettings(updates) {
  Object.assign(salarySettings, updates);
  return salarySettings;
}

function buildEmployeeForm(employee) {
  if (!employee) {
    return {
      salaryType: "Monthly",
      salary: "",
      overtimeRate: "",
      bonus: "",
      deduction: "",
      advance: "",
    };
  }
  return {
    salaryType: employee.salaryType,
    salary: employee.salary,
    overtimeRate: employee.overtimeRate,
    bonus: employee.bonus,
    deduction: employee.deduction,
    advance: employee.advance,
  };
}

function buildGlobalForm(settings) {
  return {
    weekStart: settings.weekStart,
    weekEnd: settings.weekEnd,
    pfPercentage: settings.pfPercentage,
    esiPercentage: settings.esiPercentage,
    professionalTax: settings.professionalTax,
    standardWorkingDays: settings.standardWorkingDays,
  };
}

export default function SalarySettings() {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employees[0]?.id ?? null,
  );
  const [employeeForm, setEmployeeForm] = useState(() =>
    buildEmployeeForm(employees[0]),
  );
  const [globalForm, setGlobalForm] = useState(() =>
    buildGlobalForm(salarySettings),
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const employee = getEmployee(selectedEmployeeId);
    setEmployeeForm(buildEmployeeForm(employee));
  }, [selectedEmployeeId]);

  const showNotice = (message) => setNotice(message);

  const employeeOptions = employeeSearch.trim()
    ? searchEmployees(employeeSearch.trim())
    : employees;

  const handleEmployeeFieldChange = (field, value) => {
    setEmployeeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGlobalFieldChange = (field, value) => {
    setGlobalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEmployee = () => {
    if (!selectedEmployeeId) return;
    updateEmployee(selectedEmployeeId, {
      salaryType: employeeForm.salaryType,
      salary: Number(employeeForm.salary) || 0,
      overtimeRate: Number(employeeForm.overtimeRate) || 0,
      bonus: Number(employeeForm.bonus) || 0,
      deduction: Number(employeeForm.deduction) || 0,
      advance: Number(employeeForm.advance) || 0,
    });
    showNotice("Employee salary settings saved.");
  };

  const handleResetEmployee = () => {
    const employee = getEmployee(selectedEmployeeId);
    setEmployeeForm(buildEmployeeForm(employee));
    showNotice("Employee salary settings reset.");
  };

  const handleCancelEmployee = () => {
    const employee = getEmployee(selectedEmployeeId);
    setEmployeeForm(buildEmployeeForm(employee));
  };

  const handleSaveGlobal = () => {
    updateSalarySettings({
      weekStart: globalForm.weekStart,
      weekEnd: globalForm.weekEnd,
      pfPercentage: Number(globalForm.pfPercentage) || 0,
      esiPercentage: Number(globalForm.esiPercentage) || 0,
      professionalTax: Number(globalForm.professionalTax) || 0,
      standardWorkingDays: Number(globalForm.standardWorkingDays) || 0,
    });
    showNotice("Global payroll settings saved.");
  };

  const handleResetGlobal = () => {
    setGlobalForm(buildGlobalForm(salarySettings));
    showNotice("Global payroll settings reset.");
  };

  const handleCancelGlobal = () => {
    setGlobalForm(buildGlobalForm(salarySettings));
  };

  const selectedEmployee = getEmployee(selectedEmployeeId);
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/hr");
  };
  return (
    <>
      <Header />

      <div className="salary-settings-page">
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
            <h1>Salary Settings</h1>
            <p className="page-header-subtitle">
              Configure employee salary structure and global payroll rules.
            </p>
          </div>
        </header>

        {notice && (
          <div className="notice-banner">
            <span>{notice}</span>
            <button
              type="button"
              className="notice-close"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="settings-card">
          <h2 className="settings-card-title">Employee Salary Settings</h2>

          <div className="settings-employee-picker">
            <div className="form-field">
              <label htmlFor="employee-search">Search Employee</label>
              <input
                id="employee-search"
                type="text"
                placeholder="Search by name, code or department..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="employee-select">Employee</label>
              <select
                id="employee-select"
                value={selectedEmployeeId ?? ""}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              >
                {employeeOptions.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEmployee && (
            <p className="settings-employee-meta">
              {selectedEmployee.department} · {selectedEmployee.designation}
            </p>
          )}

          <div className="settings-form-grid">
            <div className="form-field">
              <label htmlFor="salary-type">Salary Type</label>
              <select
                id="salary-type"
                value={employeeForm.salaryType}
                onChange={(e) =>
                  handleEmployeeFieldChange("salaryType", e.target.value)
                }
              >
                {SALARY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="salary-amount">Salary Amount</label>
              <input
                id="salary-amount"
                type="number"
                min="0"
                step="0.01"
                value={employeeForm.salary}
                onChange={(e) =>
                  handleEmployeeFieldChange("salary", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="overtime-rate">Overtime Rate</label>
              <input
                id="overtime-rate"
                type="number"
                min="0"
                step="0.01"
                value={employeeForm.overtimeRate}
                onChange={(e) =>
                  handleEmployeeFieldChange("overtimeRate", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="bonus">Bonus</label>
              <input
                id="bonus"
                type="number"
                min="0"
                step="0.01"
                value={employeeForm.bonus}
                onChange={(e) =>
                  handleEmployeeFieldChange("bonus", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="deduction">Deduction</label>
              <input
                id="deduction"
                type="number"
                min="0"
                step="0.01"
                value={employeeForm.deduction}
                onChange={(e) =>
                  handleEmployeeFieldChange("deduction", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="advance">Advance</label>
              <input
                id="advance"
                type="number"
                min="0"
                step="0.01"
                value={employeeForm.advance}
                onChange={(e) =>
                  handleEmployeeFieldChange("advance", e.target.value)
                }
              />
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEmployee}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetEmployee}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-tertiary"
              onClick={handleCancelEmployee}
            >
              Cancel
            </button>
          </div>
        </section>

        <section className="settings-card">
          <h2 className="settings-card-title">Global Payroll Settings</h2>

          <div className="settings-form-grid">
            <div className="form-field">
              <label htmlFor="week-start">Week Start</label>
              <select
                id="week-start"
                value={globalForm.weekStart}
                onChange={(e) =>
                  handleGlobalFieldChange("weekStart", e.target.value)
                }
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="week-end">Week End</label>
              <select
                id="week-end"
                value={globalForm.weekEnd}
                onChange={(e) =>
                  handleGlobalFieldChange("weekEnd", e.target.value)
                }
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="pf-percentage">PF (%)</label>
              <input
                id="pf-percentage"
                type="number"
                min="0"
                step="0.01"
                value={globalForm.pfPercentage}
                onChange={(e) =>
                  handleGlobalFieldChange("pfPercentage", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="esi-percentage">ESI (%)</label>
              <input
                id="esi-percentage"
                type="number"
                min="0"
                step="0.01"
                value={globalForm.esiPercentage}
                onChange={(e) =>
                  handleGlobalFieldChange("esiPercentage", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="professional-tax">Professional Tax</label>
              <input
                id="professional-tax"
                type="number"
                min="0"
                step="0.01"
                value={globalForm.professionalTax}
                onChange={(e) =>
                  handleGlobalFieldChange("professionalTax", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="working-days">Working Days</label>
              <input
                id="working-days"
                type="number"
                min="0"
                step="1"
                value={globalForm.standardWorkingDays}
                onChange={(e) =>
                  handleGlobalFieldChange("standardWorkingDays", e.target.value)
                }
              />
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveGlobal}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetGlobal}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-tertiary"
              onClick={handleCancelGlobal}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
