import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const username = user?.username || "User";

  return (
    <header className="erp-header">
      <div className="erp-logo">
        <h2>Mugil ERP</h2>
      </div>

      <div className="erp-user-section">
        <span className="user-name">{username}</span>

        {/* Profile button — soft-UI pill, adapted from Uiverse.io by emmanuelh-dev */}
        <div className="profile-btn-wrap">
          <div className="profile-btn-inner">
            <button
              type="button"
              title="Go to profile"
              className="profile-btn"
              onClick={handleProfile}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="profile-btn-icon"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Sign out button — neubrutalist press effect, adapted from Uiverse.io by arthur_6104 */}
        <button
          type="button"
          title="Sign out"
          className="signout-box-button"
          onClick={handleSignOut}
        >
          <span className="signout-box-button-inner">
            <span>Sign Out</span>
          </span>
        </button>
      </div>
    </header>
  );
}