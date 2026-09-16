
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const username = user?.username || "User";

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <header className="erp-header">

      {/* Brand */}
      <div className="erp-brand">
        <span className="erp-brand-line" />

        <span className="erp-brand-name">
          Mugil Engineering Industry
        </span>
      </div>

      {/* Right Side */}
      <div className="erp-user-area">

        {/* User Information */}
        <div className="erp-user-info">

          <div className="erp-avatar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
            </svg>
          </div>

          <div className="erp-user-text">
            <span className="erp-username">
              {username}
            </span>

            <span className="erp-user-role">
              ERP User
            </span>
          </div>

        </div>

        <span className="erp-action-divider" />

        {/* Profile */}
        <div className="erp-profile-wrapper">

          <button
            type="button"
            className="erp-header-action erp-profile-action"
            onClick={handleProfile}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
            </svg>

            <span>Profile</span>
          </button>

          {/* Profile Hover Card */}
          <div className="erp-profile-hover-card">

            <div className="erp-profile-card-loader" />

            <div className="erp-profile-card-title">
              {username}
            </div>

            <div className="erp-profile-card-description">
              ERP User
            </div>

          </div>

        </div>

        <span className="erp-action-divider" />

        {/* Sign Out */}
        <button
          type="button"
          className="erp-header-action erp-signout-action"
          onClick={handleSignOut}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 3v18" />
          </svg>

          <span className="erp-signout-text">
            Sign Out
          </span>

          <span className="erp-signout-hover-text">
            Thanks!
          </span>
        </button>

      </div>
    </header>
  );
}