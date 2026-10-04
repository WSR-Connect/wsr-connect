import { sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { auth } from "../lib/firebase";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const {
    signIn,
    user,
    isSRC,
    isLeadership,
    loading,
  } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
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
  }, [
    loading,
    user,
    isSRC,
    isLeadership,
    navigate,
  ]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setNotice("");
    setLoggingIn(true);

    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Firebase sign-in error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Sign-in failed.",
      );

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

      const errorCode =
        typeof resetError === "object" &&
        resetError !== null &&
        "code" in resetError
          ? resetError.code
          : null;

      if (errorCode === "auth/user-not-found") {
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
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          border: "1px solid #EEF0F2",
          padding: "32px",
          background: "#FFFFFF",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#1E5AA8",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          WSR Connect
        </p>

        <h1
          style={{
            margin: "0 0 8px",
            color: "#111111",
            fontSize: "28px",
          }}
        >
          SRC & Leadership Login
        </h1>

        <p
          style={{
            margin: "0 0 28px",
            color: "#73777C",
            lineHeight: 1.6,
          }}
        >
          Sign in with the email address and password provided by your
          SRC leader. SRC members go to their member home; senior
          leaders go to the leadership workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#3F4348",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Account email
          </label>

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
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #D9DDE1",
              font: "inherit",
            }}
          />

          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#3F4348",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #D9DDE1",
              font: "inherit",
            }}
          />

          {error && (
            <p
              role="alert"
              style={{
                margin: "0 0 18px",
                color: "#B42318",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              style={{
                margin: "0 0 18px",
                color: "#23643A",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn || resettingPassword}
            style={{
              width: "100%",
              padding: "13px 16px",
              border: 0,
              background: "#1E5AA8",
              color: "#FFFFFF",
              font: "inherit",
              fontWeight: 700,
              cursor: loggingIn ? "wait" : "pointer",
              opacity: loggingIn ? 0.7 : 1,
            }}
          >
            {loggingIn
              ? "Signing in..."
              : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => void handlePasswordReset()}
            disabled={loggingIn || resettingPassword}
            style={{
              display: "block",
              margin: "16px auto 0",
              padding: "4px",
              border: 0,
              background: "transparent",
              color: "#1E5AA8",
              font: "inherit",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "underline",
              cursor: resettingPassword ? "wait" : "pointer",
              opacity: resettingPassword ? 0.7 : 1,
            }}
          >
            {resettingPassword
              ? "Sending reset email..."
              : "Forgot your password?"}
          </button>
        </form>
      </section>
    </main>
  );
}
