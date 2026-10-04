import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";

function formatPosition(position: string | null) {
  if (!position) {
    return "Leadership";
  }

  const labels: Record<string, string> = {
    head_boy: "Head Boy",
    head_girl: "Head Girl",
    assistant_head_boy: "Assistant Head Boy",
    assistant_head_girl: "Assistant Head Girl",
  };

  return (
    labels[position] ??
    position
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1),
      )
      .join(" ")
  );
}

interface SectionCardProps {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
}

function SectionCard({
  eyebrow,
  title,
  description,
  to,
}: SectionCardProps) {
  return (
    <NavLink
      to={to}
      className="portal-tool-card"
    >
      <span className="portal-tool-eyebrow">
        {eyebrow}
      </span>

      <h3 className="portal-tool-title">
        {title}
      </h3>

      <p className="portal-tool-description">
        {description}
      </p>

      <span className="portal-tool-action">
        Open tool <span aria-hidden="true">↗</span>
      </span>
    </NavLink>
  );
}

export default function PortalPage() {
  const {
    user,
    position,
    signOutUser,
  } = useAuth();

  const navigate = useNavigate();

  const positionLabel =
    formatPosition(position);

  async function handleSignOut() {
    try {
      await signOutUser();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Firebase sign-out error:",
        error,
      );
    }
  }

  return (
    <main
      style={{
        background: "#F7F8F9",
        minHeight: "70vh",
        padding: "48px 20px 72px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            padding: "36px",
            background: "#123B6D",
            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  marginBottom: "10px",
                  color: "#FFFFFF",
                  opacity: 0.75,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                WSR Connect
              </span>

              <h1
                style={{
                  margin: "0 0 10px",
                  fontSize:
                    "clamp(30px, 5vw, 44px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                }}
              >
                Leadership Portal
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: "600px",
                  color: "#FFFFFF",
                  opacity: 0.85,
                  lineHeight: 1.6,
                }}
              >
                The private working space
                for the four senior SRC
                leaders.
              </p>
            </div>

            <div
              style={{
                minWidth: "190px",
                padding: "16px",
                border:
                  "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                Signed in as
              </span>

              <strong
                style={{
                  display: "block",
                  fontSize: "17px",
                }}
              >
                {positionLabel}
              </strong>

              {user?.email && (
                <span
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "12px",
                    opacity: 0.7,
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: "32px",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "7px",
                color: "#1E5AA8",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Leadership workspace
            </span>

            <h2
              style={{
                margin: 0,
                fontSize: "28px",
              }}
            >
              Tools you can use now
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#73777C",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Open a tool below to coordinate duties, events,
              announcements, or student feedback.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            <SectionCard
              eyebrow="Accountability"
              title="Duty Tracker"
              description="Track every SRC duty, location and assignment. Record completion or cover so no duty is left unaccounted for."
              to="/portal/duties"
            />

            <SectionCard
              eyebrow="Communication"
              title="Announcements"
              description="Draft and publish school or SRC updates, and review what has already been shared."
              to="/portal/announcements"
            />

            <SectionCard
              eyebrow="Schedule"
              title="Calendar"
              description="View and manage important school, SRC, meeting and leadership events."
              to="/portal/calendar"
            />

            <SectionCard
              eyebrow="Feedback"
              title="Feedback Inbox"
              description="Review student feedback, requests, concerns and follow-up items submitted through WSR Connect."
              to="/portal/feedback"
            />
          </div>
        </section>

        <section
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop:
              "1px solid #D9DDE1",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <NavLink
            to="/"
            style={{
              color: "#3F4348",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            ← Back to public site
          </NavLink>

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: "11px 16px",
              border:
                "1px solid #D9DDE1",
              background: "#FFFFFF",
              color: "#3F4348",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
}
