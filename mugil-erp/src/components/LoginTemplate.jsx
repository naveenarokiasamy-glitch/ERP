import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

const DEPARTMENTS = [
  {
    label: "Production",
    value: "production",
    loginPath: "/production/login",
  },
  {
    label: "Admin",
    value: "admin",
    loginPath: "/admin/login",
  },
  {
    label: "HR",
    value: "hr",
    loginPath: "/hr/login",
  },
  {
    label: "Material Planning",
    value: "material-planning",
    loginPath: "/material-planning/login",
  },
  {
    label: "Supervisor",
    value: "supervisor",
    loginPath: "/supervisor/login",
  },
  {
    label: "Accounts",
    value: "accounts",
    loginPath: "/accounts/login",
  },
];

const DEFAULT_DEPARTMENT = DEPARTMENTS[0];
const AUTHENTICATION_DELAY_MS = 500;

function getDepartment(value) {
  return (
    DEPARTMENTS.find((department) => department.value === value) ??
    DEFAULT_DEPARTMENT
  );
}

function AlertTriangle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}

export default function LoginTemplate({
  currentDepartment = DEFAULT_DEPARTMENT.value,
}) {
  const initialDepartment = getDepartment(currentDepartment);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [department, setDepartment] = useState(initialDepartment.value);
  const mountedRef = useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const selectedDepartment = getDepartment(department);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setDepartment(getDepartment(currentDepartment).value);
  }, [currentDepartment]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${selectedDepartment.label} Login`;

    return () => {
      document.title = previousTitle;
    };
  }, [selectedDepartment.label]);

  const handleDepartmentChange = (event) => {
    const nextDepartment = DEPARTMENTS.find(
      (item) => item.value === event.target.value,
    );

    if (!nextDepartment) {
      return;
    }

    setDepartment(nextDepartment.value);
    navigate(nextDepartment.loginPath);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, AUTHENTICATION_DELAY_MS);
      });

      if (!mountedRef.current) {
        return;
      }

      const result = await login(normalizedUsername, password);

      if (!mountedRef.current) {
        return;
      }

      if (result?.success) {
        setLoading(false);

        if (department === "material-planning") {
          navigate("/inventory", { replace: true });
        } else if (department === "hr") {
          navigate("/hr", { replace: true });
        } else if (department === "accounts") {
          navigate("/accounts", { replace: true });
        }else {
          navigate("/welcome", { replace: true });
        }

        return;
      }

      setPassword("");
      setError(
        typeof result?.message === "string"
          ? result.message
          : "Unable to sign in. Please try again.",
      );
    } catch {
      if (mountedRef.current) {
        setPassword("");
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`login-root ${"light-theme"}`}>
      <div className="theme-toggle">
        <input
          id="checkbox"
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode((isDark) => !isDark)}
          aria-label="Toggle dark and light theme"
        />

        {/* <label htmlFor="checkbox" className="switch">
          <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
            <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48z" />
          </svg>
        </label> */}
      </div>

      <div className="login-brand">
        <p className="brand-eyebrow">Enterprise Resource Planning</p>

        <h1 className="brand-name">
          Mugil
          <br />
          Industries
        </h1>

        <p className="brand-sub">Integrated Business Platform</p>

        <div className="brand-divider" />

        <ul className="brand-features">
          <li>
            <span className="feature-dot" />
            End-to-end operations management
          </li>
          <li>
            <span className="feature-dot" />
            Real-time analytics and reporting
          </li>
          <li>
            <span className="feature-dot" />
            Procurement, inventory and logistics
          </li>
          <li>
            <span className="feature-dot" />
            Finance and compliance automation
          </li>
          <li>
            <span className="feature-dot" />
            Custom workflows built for your business
          </li>
        </ul>

        <div className="erp-stats">
          <div className="stat-card">
            <ShieldCheck aria-hidden="true" />
            <h3>
              <CountUp end={99.9} duration={3} suffix="%" />
            </h3>
            <p>Reliability</p>
          </div>

          <div className="stat-card">
            <h3>
              <CountUp end={24} duration={3} suffix="/7" />
            </h3>
            <p>Support</p>
          </div>

          <div className="stat-card">
            <h3>ERP</h3>
            <p>Ready</p>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <div className="card-header">
            <div className="card-logo-mark">
              <BriefcaseIcon />
            </div>

            <h2 className="card-title">{selectedDepartment.label} Login</h2>

            <p className="card-subtitle">
              Mugil Industries ERP — Secure Access Portal
            </p>

            <div className="department-group">
              <label className="form-label" htmlFor="department">
                Department
              </label>

              <select
                id="department"
                className="form-input"
                value={department}
                onChange={handleDepartmentChange}
                disabled={loading}
              >
                {DEPARTMENTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="error-alert" id="login-error" role="alert">
              <span className="error-alert-icon">
                <AlertTriangle />
              </span>
              <span className="error-alert-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  <UserIcon />
                </span>

                <input
                  id="username"
                  name="username"
                  className={`form-input${error ? " input-error" : ""}`}
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  spellCheck="false"
                  maxLength={128}
                  required
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  <LockIcon />
                </span>

                <input
                  id="password"
                  name="password"
                  className={`form-input${error ? " input-error" : ""}`}
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  maxLength={256}
                  required
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              <span className="btn-login-inner">
                {loading ? (
                  "Authenticating…"
                ) : (
                  <>
                    Sign In <ArrowRight />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="login-footer">
            © {new Date().getFullYear()} Mugil Industries · All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}
