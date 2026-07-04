import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const CREDENTIALS = {
  username: "1234",
  password: "1234",
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true",
  );

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (username, password) => {
    if (
      username === CREDENTIALS.username &&
      password === CREDENTIALS.password
    ) {
      const loggedUser = { username };

      setIsAuthenticated(true);
      setUser(loggedUser);

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(loggedUser));
      return { success: true };
    }

    return {
      success: false,
      message: "Incorrect username or password.",
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    const loggedUser = { username };

    setIsAuthenticated(true);
    setUser(loggedUser);

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("user", JSON.stringify(loggedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
