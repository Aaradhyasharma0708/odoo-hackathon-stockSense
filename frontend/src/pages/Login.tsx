import { useState, type FormEvent } from "react";
import type { User, UserRole } from "../types";

interface LoginProps {
  onAuthenticated: (user: User, rememberMe: boolean) => void;
}

export default function Login({ onAuthenticated }: LoginProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = mode === "signup";

  function changeMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (signup && !fullName.trim()) {
      setError("Enter your full name to continue.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    if (signup && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    if (signup && !role) {
      setError("Choose a role to continue.");
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const cleanEmail = email.trim();
      onAuthenticated(
        {
          fullName: signup ? fullName.trim() : cleanEmail.split("@")[0],
          email: cleanEmail,
          role: signup ? role as UserRole : "Inventory Manager",
        },
        rememberMe,
      );
    }, 200);
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <a className="auth-brand" href="#" aria-label="StockSense home">
          <span className="ss-brand-mark"><span /><span /><span /></span>
          <span><strong>stocksense</strong><small>INVENTORY INTELLIGENCE</small></span>
        </a>
        <div className="auth-brand-copy">
          <span className="eyebrow eyebrow-light">INVENTORY, IN SYNC</span>
          <h1>Clarity for every corner of your warehouse.</h1>
          <p>Keep stock moving, teams aligned, and every decision grounded in what is happening right now.</p>
        </div>
        <span className="auth-brand-footer"><i /> A clearer view of your inventory</span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <a className="auth-brand auth-mobile-brand" href="#" aria-label="StockSense home">
            <span className="ss-brand-mark"><span /><span /><span /></span>
            <span><strong>stocksense</strong><small>INVENTORY INTELLIGENCE</small></span>
          </a>
          <header className="auth-heading">
            <span className="eyebrow">{signup ? "GET STARTED" : "WELCOME BACK"}</span>
            <h2>{signup ? "Create your account" : "Sign in to StockSense"}</h2>
            <p>{signup ? "Set up your workspace access in just a moment." : "Enter your details to access your inventory workspace."}</p>
          </header>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={!signup} className={!signup ? "is-active" : ""} onClick={() => changeMode("login")}>Sign in</button>
            <button type="button" role="tab" aria-selected={signup} className={signup ? "is-active" : ""} onClick={() => changeMode("signup")}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            {signup && <label className="auth-field"><span>Full name</span><input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Alex Morgan" /></label>}
            <label className="auth-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
            <label className="auth-field">
              <span>Password</span>
              <span className="auth-password-wrap">
                <input type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
              </span>
            </label>
            {signup && (
              <>
                <label className="auth-field">
                  <span>Confirm password</span>
                  <span className="auth-password-wrap">
                    <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
                  </span>
                </label>
                <label className="auth-field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value as UserRole | "")}><option value="">Select your role</option><option>Inventory Manager</option><option>Warehouse Staff</option></select></label>
              </>
            )}
            {!signup && (
              <div className="auth-options">
                <label><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Remember me</label>
                <button type="button" className="auth-link" onClick={() => setNotice("Password reset will be available soon.")}>Forgot password?</button>
              </div>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-notice" role="status">{notice}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Please wait..." : signup ? "Create account" : "Sign in"} {!loading && <span>→</span>}</button>
          </form>
          <p className="auth-switch">{signup ? "Already have an account?" : "New to StockSense?"} <button className="auth-link" type="button" onClick={() => changeMode(signup ? "login" : "signup")}>{signup ? "Sign in" : "Create an account"}</button></p>
          <p className="auth-legal">© 2026 StockSense <span>·</span> Inventory, made clearer.</p>
        </div>
      </section>
    </main>
  );
}
