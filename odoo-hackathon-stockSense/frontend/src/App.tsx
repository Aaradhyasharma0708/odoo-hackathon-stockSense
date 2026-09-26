import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import type { User } from "./types";

const AUTH_STORAGE_KEY = "stocksense.authenticated-user";

function readStoredUser(storage: Storage): User | null {
  const value = storage.getItem(AUTH_STORAGE_KEY);
  if (!value) return null;

  try {
    const user: unknown = JSON.parse(value);
    if (
      typeof user === "object" &&
      user !== null &&
      "fullName" in user &&
      "email" in user &&
      "role" in user &&
      typeof user.fullName === "string" &&
      typeof user.email === "string" &&
      (user.role === "Inventory Manager" || user.role === "Warehouse Staff")
    ) {
      return { fullName: user.fullName, email: user.email, role: user.role };
    }
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }

  storage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(
    () => readStoredUser(window.localStorage) ?? readStoredUser(window.sessionStorage),
  );

  function handleAuthenticated(authenticatedUser: User, rememberMe: boolean) {
    const target = rememberMe ? window.localStorage : window.sessionStorage;
    const other = rememberMe ? window.sessionStorage : window.localStorage;
    other.removeItem(AUTH_STORAGE_KEY);
    target.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <Login onAuthenticated={handleAuthenticated} />
  );
}
