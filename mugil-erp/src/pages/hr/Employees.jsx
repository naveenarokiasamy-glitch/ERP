import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  searchByKeyword,
  filterEmployees,
  paginate,
  departments,
  designations,
  shifts,
  calculateMonthlySalary,
} from "../../data/hrData";
import "./Employees.css";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

const SALARY_TYPES = ["Monthly", "Daily", "Weekly", "Hourly"];
const STATUSES = ["Active", "Inactive"];
const PAGE_SIZE = 10;

// ----------------------------------------------------------------------------
// Toast Notification
// ----------------------------------------------------------------------------
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ----------------------------------------------------------------------------
// Badge Component
// ----------------------------------------------------------------------------
function Badge({ status }) {
  const isActive = status === "Active";
  return (
    <span className={`badge ${isActive ? "badge-active" : "badge-inactive"}`}>
      {status}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Field Component for Forms
// ----------------------------------------------------------------------------
function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}

// ----------------------------------------------------------------------------
// InfoRow for View Mode
// ----------------------------------------------------------------------------
function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || "—"}</span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Employee Detail Modal (View + Edit)
// ----------------------------------------------------------------------------
function EmployeeDetailModal({ employee, onClose, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    department: employee.department,
    designation: employee.designation,
    shift: employee.shift,
    salaryType: employee.salaryType,
    salary: employee.salary,
    bonus: employee.bonus || 0,
    deduction: employee.deduction || 0,
    advance: employee.advance || 0,
    status: employee.status,
    mobile: employee.mobile,
    email: employee.email,
    address: employee.address,
    bloodGroup: employee.bloodGroup,
    emergencyContact: employee.emergencyContact,
  });

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...form,
      salary: Number(form.salary),
      bonus: Number(form.bonus),
      deduction: Number(form.deduction),
      advance: Number(form.advance),
    });
    setIsEditing(false);
  }

  function toggleEdit() {
    if (isEditing) {
      // Reset form to original values if canceling edit
      setForm({
        department: employee.department,
        designation: employee.designation,
        shift: employee.shift,
        salaryType: employee.salaryType,
        salary: employee.salary,
        bonus: employee.bonus || 0,
        deduction: employee.deduction || 0,
        advance: employee.advance || 0,
        status: employee.status,
        mobile: employee.mobile,
        email: employee.email,
        address: employee.address,
        bloodGroup: employee.bloodGroup,
        emergencyContact: employee.emergencyContact,
      });
    }
    setIsEditing(!isEditing);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-code">{employee.employeeCode}</div>
            <h2 className="modal-title">{employee.name}</h2>
            <Badge status={employee.status} />
          </div>
          <div className="modal-actions">
            <button
              className={`btn ${isEditing ? "btn-danger" : "btn-warning"}`}
              onClick={toggleEdit}
            >
              {isEditing ? "Cancel Edit" : "Edit"}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {isEditing ? (
          // ------------------------------------------------------------------
          // EDIT MODE
          // ------------------------------------------------------------------
          <form onSubmit={handleSubmit}>
            <div className="edit-grid">
              <Field label="Department">
                <select
                  className="input select"
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
                  className="input select"
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
                  className="input select"
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
                  className="input select"
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
              <Field label="Salary">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.salary}
                  onChange={(e) => set("salary", e.target.value)}
                />
              </Field>
              <Field label="Bonus">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.bonus}
                  onChange={(e) => set("bonus", e.target.value)}
                />
              </Field>
              <Field label="Deduction">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.deduction}
                  onChange={(e) => set("deduction", e.target.value)}
                />
              </Field>
              <Field label="Advance">
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.advance}
                  onChange={(e) => set("advance", e.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  className="input select"
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
              <Field label="Mobile">
                <input
                  className="input"
                  type="text"
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Blood Group">
                <input
                  className="input"
                  type="text"
                  value={form.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                />
              </Field>
              <Field label="Emergency Contact">
                <input
                  className="input"
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => set("emergencyContact", e.target.value)}
                />
              </Field>
              <Field label="Address" className="full-width">
                <input
                  className="input"
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={toggleEdit}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          // ------------------------------------------------------------------
          // VIEW MODE
          // ------------------------------------------------------------------
          <div className="view-mode">
            {/* Two-column layout for employee info */}
            <div className="info-grid">
              <div>
                <InfoRow label="Employee Code" value={employee.employeeCode} />
                <InfoRow label="Department" value={employee.department} />
                <InfoRow label="Designation" value={employee.designation} />
                <InfoRow label="Shift" value={employee.shift} />
                <InfoRow label="Weekly Off" value={employee.weeklyOff} />
                <InfoRow label="Gender" value={employee.gender} />
                <InfoRow label="Age" value={employee.age} />
                <InfoRow label="Blood Group" value={employee.bloodGroup} />
              </div>
              <div>
                <InfoRow label="Mobile" value={employee.mobile} />
                <InfoRow label="Email" value={employee.email} />
                <InfoRow
                  label="Emergency Contact"
                  value={employee.emergencyContact}
                />
                <InfoRow label="Joining Date" value={employee.joiningDate} />
                <InfoRow label="Salary Type" value={employee.salaryType} />
                <InfoRow
                  label="Salary"
                  value={`₹${employee.salary.toLocaleString("en-IN")}`}
                />
                <InfoRow
                  label="Bonus"
                  value={`₹${(employee.bonus || 0).toLocaleString("en-IN")}`}
                />
                <InfoRow
                  label="Deduction"
                  value={`₹${(employee.deduction || 0).toLocaleString("en-IN")}`}
                />
                <InfoRow
                  label="Advance"
                  value={`₹${(employee.advance || 0).toLocaleString("en-IN")}`}
                />
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="section">
              <h4 className="section-title">Bank &amp; Identification</h4>
              <div className="info-grid">
                <div>
                  <InfoRow label="Bank Name" value={employee.bankName} />
                  <InfoRow
                    label="Account Number"
                    value={employee.accountNumber}
                  />
                </div>
                <div>
                  <InfoRow label="IFSC" value={employee.ifsc} />
                  <InfoRow label="PAN" value={employee.pan} />
                  <InfoRow label="Aadhaar" value={employee.aadhaar} />
                </div>
              </div>
            </div>

            {/* Biometric Info */}
            <div className="section">
              <h4 className="section-title">Biometric Information</h4>
              <div className="info-grid">
                <div>
                  <InfoRow label="Device" value={employee.attendanceDevice} />
                </div>
                <div>
                  <InfoRow
                    label="Fingerprint"
                    value={
                      employee.fingerRegistered
                        ? "✓ Registered"
                        : "Not Registered"
                    }
                  />
                  <InfoRow
                    label="Face Recognition"
                    value={
                      employee.faceRegistered
                        ? "✓ Registered"
                        : "Not Registered"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="section">
              <InfoRow label="Address" value={employee.address} />
            </div>

            <div className="modal-footer-actions">
              <Link to={`/employee/${employee.id}`} className="btn btn-primary">
                View Full Profile →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Delete Confirmation Modal
// ----------------------------------------------------------------------------
function DeleteConfirm({ employee, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content delete-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="delete-title">Remove employee?</h3>
        <p className="delete-message">
          <strong>{employee.name}</strong> ({employee.employeeCode}) will be
          permanently removed from the workforce records.
        </p>
        <div className="delete-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main Employees Component
// ----------------------------------------------------------------------------
export default function Employees() {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [shift, setShift] = useState("");
  const [salaryType, setSalaryType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const allEmployees = useMemo(() => getEmployees(), [version]);

  const filtered = useMemo(() => {
    let list = filterEmployees({ department, shift, salaryType, status });
    list = searchByKeyword(list, search, [
      "name",
      "employeeCode",
      "department",
      "designation",
      "mobile",
      "email",
    ]);
    return list;
  }, [allEmployees, search, department, shift, salaryType, status]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  const { data, currentPage, totalRecords } = useMemo(
    () => paginate(filtered, safePage, PAGE_SIZE),
    [filtered, safePage],
  );

  function clearFilters() {
    setSearch("");
    setDepartment("");
    setShift("");
    setSalaryType("");
    setStatus("");
    setPage(1);
  }

  function handleSave(updates) {
    const result = updateEmployee(viewing.id, updates);
    if (result) {
      setToast({ message: "Employee updated successfully", type: "success" });
      setVersion((v) => v + 1);
      // Refresh the viewing data
      const updated = getEmployee(viewing.id);
      setViewing(updated);
    } else {
      setToast({ message: "Update failed", type: "error" });
    }
  }

  function handleDelete() {
    const success = deleteEmployee(deleting.id);
    if (success) {
      setToast({ message: "Employee deleted", type: "success" });
    } else {
      setToast({ message: "Deletion failed", type: "error" });
    }
    setDeleting(null);
    setVersion((v) => v + 1);
    setPage(1);
  }
  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/hr");
  };
  return (
    <>
      <Header />

      <div className="employees-container">
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
        <div className="header">
          <div className="header-subtitle">Workforce Registry</div>
          <h1 className="header-title">Employees</h1>
          <div className="header-count">{totalRecords} matching records</div>
        </div>

        {/* Filters */}
        <div className="filters">
          <input
            className="input"
            placeholder="Search name, code, mobile, email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="input select"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="input select"
            value={shift}
            onChange={(e) => {
              setShift(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Shifts</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="input select"
            value={salaryType}
            onChange={(e) => {
              setSalaryType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Salary Types</option>
            {SALARY_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {[
                    "Code",
                    "Name",
                    "Department",
                    "Designation",
                    "Shift",
                    "Salary Type",
                    "Salary",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={
                        h === "Actions" || h === "Salary"
                          ? "text-right"
                          : "text-left"
                      }
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((emp) => (
                  <tr key={emp.id} className="table-row">
                    <td className="cell-code">{emp.employeeCode}</td>
                    <td>
                      <Link to={`/employee/${emp.id}`} className="name-link">
                        {emp.name}
                      </Link>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>{emp.shift}</td>
                    <td>{emp.salaryType}</td>
                    <td className="text-right cell-salary">
                      ₹{calculateMonthlySalary(emp).toLocaleString("en-IN")}
                    </td>
                    <td>
                      <Badge status={emp.status} />
                    </td>
                    <td className="text-right cell-actions">
                      <Link
                        to={`/hr/employee/${emp.id}`}
                        className="btn btn-view"
                      >
                        View
                      </Link>
                      <button
                        className="btn btn-delete"
                        onClick={() => setDeleting(emp)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      No employees match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="pagination-buttons">
              <button
                className="btn btn-secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {deleting && (
          <DeleteConfirm
            employee={deleting}
            onCancel={() => setDeleting(null)}
            onConfirm={handleDelete}
          />
        )}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}
