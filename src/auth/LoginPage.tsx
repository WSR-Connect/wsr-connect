import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
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
  const [loggingIn, setLoggingIn] = useState(false);

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
          Sign in with the account provided by your SRC leader. SRC
          members go to their member home; senior leaders go to the
          leadership workspace.
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
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
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

          <button
            type="submit"
            disabled={loggingIn}
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
        </form>
      </section>
    </main>
  );
}
