import { useState, type FormEvent } from "react";
import type { User, UserRole } from "../types";

interface LoginProps {
  onAuthenticated: (user: User, rememberMe: boolean) => void;
}

type AuthMode = "login" | "signup";

export default function Login({ onAuthenticated }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isSignup && !fullName.trim()) {
      setError("Enter your full name to continue.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    if (isSignup && !role) {
      setError("Choose a role to continue.");
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const user: User = {
        fullName: isSignup
          ? fullName.trim()
          : email.trim().split("@")[0] || "StockSense User",
        email: email.trim(),
        role: isSignup ? role as UserRole : "Inventory Manager",
      };
      onAuthenticated(user, rememberMe);
    }, 300);
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="StockSense">
        <a className="brand brand-light" href="#" aria-label="StockSense home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Stock<span className="brand-accent">Sense</span></span>
        </a>
        <div className="auth-brand-copy">
          <span className="eyebrow eyebrow-light">INVENTORY, IN SYNC</span>
          <h1>Clarity for every corner of your warehouse.</h1>
          <p>
            Keep stock moving, teams aligned, and every decision grounded in
            what is happening right now.
          </p>
        </div>
        <div className="brand-panel-footer">
          <span className="brand-dot" />
          A clearer view of your inventory
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <a className="brand" href="#" aria-label="StockSense home">
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>Stock<span className="brand-accent">Sense</span></span>
            </a>
          </div>
          <div className="auth-heading">
            <span className="eyebrow">{isSignup ? "GET STARTED" : "WELCOME BACK"}</span>
            <h2>{isSignup ? "Create your account" : "Sign in to StockSense"}</h2>
            <p>
              {isSignup
                ? "Set up your workspace access in just a moment."
                : "Enter your details to access your inventory workspace."}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button
              className={!isSignup ? "auth-tab is-active" : "auth-tab"}
              type="button"
              role="tab"
              aria-selected={!isSignup}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              className={isSignup ? "auth-tab is-active" : "auth-tab"}
              type="button"
              role="tab"
              aria-selected={isSignup}
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <label className="field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </label>
            )}

            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <span className="password-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            {isSignup && (
              <>
                <label className="field">
                  <span>Confirm password</span>
                  <span className="password-input-wrap">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter your password"
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>
                <label className="field">
                  <span>Role</span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRole | "")}
                  >
                    <option value="">Select your role</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Warehouse Staff">Warehouse Staff</option>
                  </select>
                </label>
              </>
            )}

            {!isSignup && (
              <div className="auth-options">
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setNotice("Password reset will be available soon.")}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="form-message form-error" role="alert">{error}</p>}
            {notice && <p className="form-message form-notice" role="status">{notice}</p>}

            <button className="button button-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch-copy">
            {isSignup ? "Already have an account?" : "New to StockSense?"}{" "}
            <button
              className="text-button"
              type="button"
              onClick={() => switchMode(isSignup ? "login" : "signup")}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="auth-legal">© 2026 StockSense <span>·</span> Inventory, made clearer.</p>
        </div>
      </section>
    </main>
  );
}
