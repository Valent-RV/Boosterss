import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);
const SESSION_KEY = "taskero_simple_session";

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const showToast = (title, message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((current) => [...current, { id, title, message, type }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  };

  const removeToast = (id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        setAuthLoading,
        toasts,
        removeToast,
        showToast,
        logout,
        isAuthenticated: Boolean(user),
        isCompany: user?.role === "company"
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
