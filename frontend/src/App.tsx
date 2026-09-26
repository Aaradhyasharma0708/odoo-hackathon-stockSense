import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import type { User } from "./types";

const AUTH_STORAGE_KEY = "stocksense.authenticated-user";

function readStoredUser(storage: Storage): User | null {
  const storedUser = storage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(
    () =>
      readStoredUser(window.localStorage) ??
      readStoredUser(window.sessionStorage),
  );

  function handleAuthenticated(authenticatedUser: User, rememberMe: boolean) {
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;
    otherStorage.removeItem(AUTH_STORAGE_KEY);
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }

  if (!user) {
    return <Login onAuthenticated={handleAuthenticated} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
