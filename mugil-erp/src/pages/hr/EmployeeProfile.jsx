import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAttendance,
  calculateAttendance,
  getAttendancePercentage,
  calculatePayroll,
  payrollRecords,
  departments,
  designations,
  shifts,
  ATTENDANCE_MONTH,
  ATTENDANCE_YEAR,
} from "../../data/hrData";
import "./EmployeeProfile.css";
import Header from "../../components/Header";

// ----------------------------------------------------------------------------
// Local constants (UI reference lists only — not employee data)
// ----------------------------------------------------------------------------
const SALARY_TYPES = ["Monthly", "Daily", "Weekly", "Hourly"];
const STATUSES = ["Active", "Inactive"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatINR(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ----------------------------------------------------------------------------
// Small presentational helpers
// ----------------------------------------------------------------------------
function Panel({ title, children, hint, actions }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">{title}</h2>
        <div className="panel-header-right">
          {hint ? <span className="panel-hint">{hint}</span> : null}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="info-grid">
      {items.map(([label, value]) => (
        <div key={label} className="info-item">
          <div className="info-item-label">{label}</div>
          <div className="info-item-value">{value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

function StatChip({ label, value, tone = "ink" }) {
  return (
    <div className={`stat-chip stat-chip-${tone}`}>
      <div className="stat-chip-label">{label}</div>
      <div className="stat-chip-value">{value}</div>
    </div>
  );
}

function BioTag({ label, active }) {
  return (
    <span
      className={`bio-tag ${active ? "bio-tag-active" : "bio-tag-inactive"}`}
    >
      {active ? "● " : "○ "}
      {label} {active ? "(Registered)" : "(Not Registered)"}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusMap = {
    Present: "status-present",
    Late: "status-late",
    Absent: "status-absent",
    "Half Day": "status-halfday",
    Leave: "status-leave",
    Holiday: "status-holiday",
    "Weekly Off": "status-weeklyoff",
  };
  return (
    <span className={`status-badge ${statusMap[status] || ""}`}>{status}</span>
  );
}

function PaymentBadge({ status }) {
  const statusMap = {
    Paid: "payment-paid",
    Processing: "payment-processing",
    Pending: "payment-pending",
  };
  return (
    <span className={`payment-badge ${statusMap[status] || ""}`}>{status}</span>
  );
}

// ----------------------------------------------------------------------------
// Toast system (self-contained, bottom-right, auto-dismiss)
// ----------------------------------------------------------------------------
function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✅" : "❌"}
          </span>
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-close"
            aria-label="Dismiss"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  function push(message, type = "success") {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3000);
  }

  function dismiss(id) {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((t) => t.id !== id));
  }

  useEffect(
    () => () => Object.values(timers.current).forEach(clearTimeout),
    [],
  );

  return { toasts, push, dismiss };
}

// ----------------------------------------------------------------------------
// Delete confirmation modal (with focus management)
// ----------------------------------------------------------------------------
function DeleteModal({ employee, onCancel, onConfirm, isDeleting }) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        const focusables = [cancelRef.current, confirmRef.current];
        const idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey
          ? idx <= 0
            ? focusables.length - 1
            : idx - 1
          : idx === focusables.length - 1
            ? 0
            : idx + 1;
        focusables[next]?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/hr");
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-modal-title" className="modal-title">
          Delete employee?
        </h3>
        <p className="modal-body">
          Are you sure you want to delete <strong>{employee.name}</strong> (
          {employee.employeeCode})?
        </p>
        <p className="modal-warning">
          ⚠ This action cannot be undone. All attendance and payroll records
          will also be removed.
        </p>
        <div className="modal-actions">
          <button
            ref={cancelRef}
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Edit form
// ----------------------------------------------------------------------------
function buildFormState(employee) {
  return {
    department: employee.department,
    designation: employee.designation,
    shift: employee.shift,
    salaryType: employee.salaryType,
    salary: employee.salary,
    bonus: employee.bonus,
    deduction: employee.deduction,
    advance: employee.advance,
    status: employee.status,
    mobile: employee.mobile,
    email: employee.email,
    address: employee.address,
    bloodGroup: employee.bloodGroup,
    emergencyContact: employee.emergencyContact,
  };
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

function EditForm({ employee, onCancel, onSaved, pushToast }) {
  const [form, setForm] = useState(() => buildFormState(employee));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildFormState(employee));
    setErrors({});
  }, [employee]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!MOBILE_REGEX.test(String(form.mobile).trim())) {
      next.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!EMAIL_REGEX.test(String(form.email).trim())) {
      next.email = "Enter a valid email address";
    }
    if (!String(form.address).trim()) {
      next.address = "Address is required";
    }
    if (!String(form.emergencyContact).trim()) {
      next.emergencyContact = "Emergency contact is required";
    }
    ["salary", "bonus", "deduction", "advance"].forEach((key) => {
      const num = Number(form[key]);
      if (Number.isNaN(num) || num < 0) {
        next[key] = "Must be a non-negative number";
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const updates = {
        ...form,
        salary: Number(form.salary),
        bonus: Number(form.bonus),
        deduction: Number(form.deduction),
        advance: Number(form.advance),
        mobile: String(form.mobile).trim(),
        email: String(form.email).trim(),
        address: String(form.address).trim(),
        emergencyContact: String(form.emergencyContact).trim(),
      };
      const result = updateEmployee(employee.id, updates);
      if (result) {
        pushToast("Employee updated successfully", "success");
        onSaved();
      } else {
        pushToast("Failed to update employee", "error");
      }
    } catch (err) {
      pushToast("Failed to update employee", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <div className="edit-form-grid">
        <div className="edit-form-col">
          <Field label="Department">
            <select
              className="input"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Designation">
            <select
              className="input"
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
            >
              {designations.map((d) => (
                <option key={d.id} value={d.title}>
                  {d.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Shift">
            <select
              className="input"
              value={form.shift}
              onChange={(e) => set("shift", e.target.value)}
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Salary Type">
            <select
              className="input"
              value={form.salaryType}
              onChange={(e) => set("salaryType", e.target.value)}
            >
              {SALARY_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mobile" error={errors.mobile}>
            <input
              className={`input ${errors.mobile ? "input-invalid" : ""}`}
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
          <Field label="Blood Group">
            <select
              className="input"
              value={form.bloodGroup}
              onChange={(e) => set("bloodGroup", e.target.value)}
            >
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="edit-form-col">
          <Field label="Salary" error={errors.salary}>
            <input
              className={`input ${errors.salary ? "input-invalid" : ""}`}
              type="number"
              min="0"
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
            />
          </Field>
          <Field label="Bonus" error={errors.bonus}>
            <input
              className={`input ${errors.bonus ? "input-invalid" : ""}`}
              type="number"
              min="0"
              value={form.bonus}
              onChange={(e) => set("bonus", e.target.value)}
            />
          </Field>
          <Field label="Deduction" error={errors.deduction}>
            <input
              className={`input ${errors.deduction ? "input-invalid" : ""}`}
              type="number"
              min="0"
              value={form.deduction}
              onChange={(e) => set("deduction", e.target.value)}
            />
          </Field>
          <Field label="Advance" error={errors.advance}>
            <input
              className={`input ${errors.advance ? "input-invalid" : ""}`}
              type="number"
              min="0"
              value={form.advance}
              onChange={(e) => set("advance", e.target.value)}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              className={`input ${errors.email ? "input-invalid" : ""}`}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Emergency Contact" error={errors.emergencyContact}>
            <input
              className={`input ${errors.emergencyContact ? "input-invalid" : ""}`}
              value={form.emergencyContact}
              onChange={(e) => set("emergencyContact", e.target.value)}
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
        </div>

        <div className="edit-form-full">
          <Field label="Address" error={errors.address}>
            <textarea
              className={`input textarea ${errors.address ? "input-invalid" : ""}`}
              rows={3}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="edit-form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------------
// Main EmployeeProfile Component
// ----------------------------------------------------------------------------
export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  const [version, setVersion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const employee = useMemo(() => getEmployee(id), [id, version]);

  const attendanceSummary = useMemo(
    () => (employee ? calculateAttendance(employee.id) : null),
    [employee],
  );
  const attendancePct = useMemo(
    () => (employee ? getAttendancePercentage(employee.id) : 0),
    [employee],
  );

  const allAttendance = useMemo(() => {
    if (!employee) return [];
    return getEmployeeAttendance(employee.id)
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [employee, version]);

  const payroll = useMemo(() => {
    if (!employee) return null;
    const key = `${ATTENDANCE_YEAR}-${String(ATTENDANCE_MONTH).padStart(2, "0")}`;
    const existing = payrollRecords.find(
      (p) => p.employeeId === employee.id && p.salaryMonth === key,
    );
    return existing || calculatePayroll(employee.id);
  }, [employee, version]);

  const payrollHistory = useMemo(() => {
    if (!employee) return [];
    return payrollRecords
      .filter((p) => p.employeeId === employee.id)
      .slice()
      .sort((a, b) => (a.salaryMonth < b.salaryMonth ? 1 : -1));
  }, [employee, version]);

  function handleSaved() {
    setVersion((v) => v + 1);
    setIsEditing(false);
  }

  function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      const success = deleteEmployee(employee.id);
      if (success) {
        pushToast("Employee deleted successfully", "success");
        setShowDeleteModal(false);
        navigate("/hr/employees");
      } else {
        pushToast("Failed to delete employee", "error");
        setShowDeleteModal(false);
      }
    } catch (err) {
      pushToast("Failed to delete employee", "error");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!employee) {
    return (
      <div className="profile-container">
        <div className="not-found-container">
          <p className="not-found">Employee not found.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/hr/employees")}
          >
            Back to Employees
          </button>
        </div>
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const statusClass =
    employee.status === "Active" ? "status-active" : "status-inactive";

  return (
    <>
      <Header />
      <div className="profile-container">
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
        {/* Header */}
        <div className="profile-header">
          <div>
            <div className="profile-code">
              {employee.employeeCode} · {employee.department}
            </div>
            <h1 className="profile-name">{employee.name}</h1>
            <div className="profile-meta">
              {employee.designation} · {employee.shift} Shift ·{" "}
              <span className={`profile-status ${statusClass}`}>
                {employee.status}
              </span>
            </div>
          </div>
          <div className="profile-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/hr/employees")}
            >
              ← Back to List
            </button>
            {!isEditing && (
              <button
                className="btn btn-warning"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
            {!isEditing && (
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <Panel title={`Edit ${employee.name}`} hint={employee.employeeCode}>
            <EditForm
              employee={employee}
              onCancel={() => setIsEditing(false)}
              onSaved={handleSaved}
              pushToast={pushToast}
            />
          </Panel>
        ) : (
          <div className="profile-grid">
            {/* Left Column */}
            <div>
              <Panel title="Personal Information">
                <InfoGrid
                  items={[
                    ["Employee Code", employee.employeeCode],
                    ["Name", employee.name],
                    ["Age", employee.age],
                    ["Gender", employee.gender],
                    ["Mobile", employee.mobile],
                    ["Email", employee.email],
                    ["Address", employee.address],
                    ["Blood Group", employee.bloodGroup],
                    ["Emergency Contact", employee.emergencyContact],
                  ]}
                />
              </Panel>

              <Panel title="Employment Information">
                <InfoGrid
                  items={[
                    ["Department", employee.department],
                    ["Designation", employee.designation],
                    ["Joining Date", employee.joiningDate],
                    ["Shift", employee.shift],
                    ["Salary Type", employee.salaryType],
                    ["Salary", formatINR(employee.salary)],
                    ["Weekly Off", employee.weeklyOff],
                    ["Status", employee.status],
                  ]}
                />
              </Panel>

              <Panel title="Bank & Identification">
                <InfoGrid
                  items={[
                    ["Bank Name", employee.bankName],
                    ["Account Number", employee.accountNumber],
                    ["IFSC Code", employee.ifsc],
                    ["PAN", employee.pan],
                    ["Aadhaar", employee.aadhaar],
                  ]}
                />
              </Panel>

              <Panel title="Biometric Information">
                <div className="bio-device">
                  Assigned Device: <strong>{employee.attendanceDevice}</strong>
                </div>
                <div className="bio-tags">
                  <BioTag
                    label="Fingerprint"
                    active={employee.fingerRegistered}
                  />
                  <BioTag label="Face" active={employee.faceRegistered} />
                  <BioTag label="Card" active={employee.cardRegistered} />
                </div>
              </Panel>
            </div>

            {/* Right Column */}
            <div>
              <Panel
                title="Attendance Summary"
                hint={`${ATTENDANCE_MONTH}/${ATTENDANCE_YEAR}`}
              >
                <div className="stats-grid">
                  <StatChip
                    label="Present"
                    value={attendanceSummary.presentDays}
                    tone="success"
                  />
                  <StatChip
                    label="Absent"
                    value={attendanceSummary.absentDays}
                    tone="danger"
                  />
                  <StatChip
                    label="Leave"
                    value={attendanceSummary.leaveDays}
                    tone="accent"
                  />
                  <StatChip
                    label="Half Day"
                    value={attendanceSummary.halfDays}
                    tone="ink"
                  />
                  <StatChip
                    label="Late"
                    value={attendanceSummary.lateDays}
                    tone="amber"
                  />
                  <StatChip
                    label="Attendance %"
                    value={`${attendancePct}%`}
                    tone="accent"
                  />
                  <StatChip
                    label="Working Hrs"
                    value={attendanceSummary.totalWorkingHours}
                    tone="ink"
                  />
                  <StatChip
                    label="OT Hrs"
                    value={attendanceSummary.totalOvertimeHours}
                    tone="amber"
                  />
                </div>
              </Panel>

              <Panel
                title="Payroll Summary"
                hint={
                  payroll.salaryMonth ||
                  `${ATTENDANCE_YEAR}-${String(ATTENDANCE_MONTH).padStart(2, "0")}`
                }
              >
                <InfoGrid
                  items={[
                    ["Basic Salary", formatINR(payroll.basicSalary)],
                    ["Allowance", formatINR(payroll.allowance)],
                    ["Bonus", formatINR(payroll.bonus)],
                    ["Deduction", formatINR(payroll.deduction)],
                    ["Advance", formatINR(payroll.advance)],
                    ["OT Pay", formatINR(payroll.overtimePay)],
                    ["Gross Salary", formatINR(payroll.grossSalary)],
                    ["Net Salary", formatINR(payroll.netSalary)],
                  ]}
                />
                <div className="payroll-status">
                  <PaymentBadge status={payroll.paymentStatus} />
                  {payroll.paymentDate && (
                    <span className="payment-date">
                      Paid on: {payroll.paymentDate}
                    </span>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* Attendance History */}
        <Panel
          title="Attendance History"
          hint={`${allAttendance.length} records`}
        >
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {[
                    "Date",
                    "Day",
                    "Check In",
                    "Check Out",
                    "Working Hrs",
                    "OT Hrs",
                    "Status",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAttendance.slice(0, 20).map((rec) => (
                  <tr key={rec.id}>
                    <td className="cell-mono">{rec.date}</td>
                    <td className="cell-muted">{rec.day}</td>
                    <td className="cell-mono">{rec.checkIn || "—"}</td>
                    <td className="cell-mono">{rec.checkOut || "—"}</td>
                    <td className="cell-mono">{rec.workingHours}</td>
                    <td className="cell-mono">{rec.overtimeHours}</td>
                    <td>
                      <StatusBadge status={rec.attendanceStatus} />
                    </td>
                  </tr>
                ))}
                {allAttendance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {allAttendance.length > 20 && (
              <div className="table-footer">
                Showing 20 of {allAttendance.length} records
              </div>
            )}
          </div>
        </Panel>

        {/* Payroll History */}
        <Panel title="Payroll History">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {[
                    "Month",
                    "Basic",
                    "Allowance",
                    "OT Pay",
                    "Bonus",
                    "Deduction",
                    "Net Salary",
                    "Status",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrollHistory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      No payroll records found.
                    </td>
                  </tr>
                )}
                {payrollHistory.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-mono">{p.salaryMonth}</td>
                    <td className="cell-mono">{formatINR(p.basicSalary)}</td>
                    <td className="cell-mono">{formatINR(p.allowance)}</td>
                    <td className="cell-mono">{formatINR(p.overtimePay)}</td>
                    <td className="cell-mono">{formatINR(p.bonus)}</td>
                    <td className="cell-mono">{formatINR(p.deduction)}</td>
                    <td className="cell-mono cell-bold">
                      {formatINR(p.netSalary)}
                    </td>
                    <td>
                      <PaymentBadge status={p.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {showDeleteModal && (
          <DeleteModal
            employee={employee}
            isDeleting={isDeleting}
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
          />
        )}

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </>
  );
}
