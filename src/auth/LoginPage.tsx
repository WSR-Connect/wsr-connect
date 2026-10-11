import { sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { NavLink, useNavigate } from "react-router";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import "./LoginPage.css";

function getFirebaseErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "";
}

function getSignInErrorMessage(error: unknown) {
  switch (getFirebaseErrorCode(error)) {
    case "auth/invalid-email":
      return "That email address doesn't look valid. Check it and try again.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "We couldn't sign you in with those details. Check your school-issued email and password.";
    case "auth/user-disabled":
      return "This account is currently disabled. Please contact your SRC leader.";
    case "auth/too-many-requests":
      return "There have been too many sign-in attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "We couldn't reach the sign-in service. Check your connection and try again.";
    default:
      return "We couldn't sign you in right now. Check your details and try again.";
  }
}

export default function LoginPage() {
  const { signIn, user, isSRC, isLeadership, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user) {
      if (isLeadership) {
        navigate("/portal", { replace: true });
      } else if (isSRC) {
        navigate("/src/home", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [loading, user, isSRC, isLeadership, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");
    setLoggingIn(true);

    try {
      await signIn(email, password);
    } catch (signInError) {
      console.error("Firebase sign-in error:", signInError);
      setError(getSignInErrorMessage(signInError));
      setLoggingIn(false);
    }
  }

  async function handlePasswordReset() {
    if (!emailInputRef.current?.reportValidity()) {
      return;
    }

    setError("");
    setNotice("");
    setResettingPassword(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(
        "If an account exists for this email, a reset link will arrive shortly. Check your inbox and spam folder.",
      );
    } catch (resetError) {
      console.error("Firebase password reset error:", resetError);

      if (getFirebaseErrorCode(resetError) === "auth/user-not-found") {
        setNotice(
          "If an account exists for this email, a reset link will arrive shortly. Check your inbox and spam folder.",
        );
      } else {
        setError(
          "We couldn't send a reset email right now. Check your connection and try again.",
        );
      }
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-layout">
        <section className="login-intro" aria-labelledby="login-intro-title">
          <span className="login-intro__eyebrow">
            GEMS Westminster School — RAK
          </span>
          <h1 id="login-intro-title">
            Your SRC workspace, all in one place.
          </h1>
          <p>
            Sign in to see the tools and updates available to your role.
          </p>

          <ul className="login-intro__features">
            <li>
              <span aria-hidden="true">✓</span>
              Check your duty schedule
            </li>
            <li>
              <span aria-hidden="true">✓</span>
              Keep up with school and SRC updates
            </li>
            <li>
              <span aria-hidden="true">✓</span>
              Open your role’s workspace
            </li>
          </ul>
          <span className="login-intro__orbit" aria-hidden="true" />
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card__brand">
            <span className="login-card__mark" aria-hidden="true">WSR</span>
            <span>WSR Connect</span>
          </div>

          <div className="login-card__heading">
            <span className="login-card__eyebrow">SRC member access</span>
            <h2 id="login-title">Welcome back.</h2>
            <p>Sign in with the individual school account issued to you by your SRC leader.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Account email</label>
              <input
                id="email"
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNotice("");
                }}
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@school.com"
              />
            </div>

            <div className="login-field">
              <div className="login-field__label-row">
                <label htmlFor="password">Password</label>
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="login-message login-message--error" role="alert">
                {error}
              </p>
            )}

            {notice && (
              <p className="login-message login-message--notice" role="status">
                {notice}
              </p>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loggingIn || resettingPassword}
              aria-busy={loggingIn}
            >
              {loggingIn && <span className="login-spinner" aria-hidden="true" />}
              {loggingIn ? "Signing in…" : "Sign in"}
              {!loggingIn && <span aria-hidden="true">↗</span>}
            </button>

            <button
              className="login-reset"
              type="button"
              onClick={() => void handlePasswordReset()}
              disabled={loggingIn || resettingPassword}
            >
              {resettingPassword ? "Sending reset email…" : "Forgot your password?"}
            </button>
          </form>

          <p className="login-card__help">
            Having trouble signing in? Ask your SRC leader to check your account details.
          </p>
          <NavLink className="login-card__back" to="/">
            <span aria-hidden="true">←</span> Back to the public site
          </NavLink>
        </section>
      </div>
    </main>
  );
}
