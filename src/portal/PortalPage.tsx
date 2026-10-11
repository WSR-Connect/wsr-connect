import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import "./PortalPage.css";

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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function getDubaiGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Dubai",
    }).format(new Date()),
  );

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getDubaiDate() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date());
}

interface SectionCardProps {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  mark: string;
  action: string;
}

function SectionCard({
  eyebrow,
  title,
  description,
  to,
  mark,
  action,
}: SectionCardProps) {
  return (
    <NavLink to={to} className="leadership-tool-card">
      <div className="leadership-tool-card__top">
        <span className="leadership-tool-card__mark" aria-hidden="true">
          {mark}
        </span>
        <span className="leadership-tool-card__eyebrow">{eyebrow}</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <span className="leadership-tool-card__action">
        {action}
        <span aria-hidden="true">↗</span>
      </span>
    </NavLink>
  );
}

const leadershipTools: SectionCardProps[] = [
  {
    eyebrow: "Accountability",
    title: "Duty tracker",
    description:
      "Review daily assignments and record completion or cover, all in one place.",
    to: "/portal/duties",
    mark: "✓",
    action: "Open tracker",
  },
  {
    eyebrow: "Schedule",
    title: "Rota manager",
    description:
      "Manage recurring duties and keep weekly assignments up to date.",
    to: "/portal/rotas",
    mark: "↻",
    action: "Manage rotas",
  },
  {
    eyebrow: "Communication",
    title: "Announcements",
    description:
      "Prepare school and SRC updates, then review what has been shared.",
    to: "/portal/announcements",
    mark: "↗",
    action: "View updates",
  },
  {
    eyebrow: "Schedule",
    title: "Calendar",
    description:
      "Keep school, SRC, meeting, and leadership events organized.",
    to: "/portal/calendar",
    mark: "▦",
    action: "Open calendar",
  },
  {
    eyebrow: "Student voice",
    title: "Feedback inbox",
    description:
      "Review submissions and keep follow-up work moving.",
    to: "/portal/feedback",
    mark: "…",
    action: "Review feedback",
  },
];

export default function PortalPage() {
  const { user, position, signOutUser } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);

    try {
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Firebase sign-out error:", error);
      setSignOutError("You could not be signed out. Please try again.");
      setSigningOut(false);
    }
  }

  const positionLabel = formatPosition(position);
  const dateLabel = getDubaiDate();

  return (
    <main className="leadership-portal">
      <div className="leadership-portal__container">
        <section className="leadership-portal__hero" aria-labelledby="leadership-title">
          <div className="leadership-portal__hero-copy">
            <span className="leadership-portal__eyebrow">
              WSR Connect <span aria-hidden="true">/</span> Leadership
            </span>
            <h1 id="leadership-title">
              {user?.displayName?.trim()
                ? `${getDubaiGreeting()}, ${user.displayName.trim().split(/\s+/)[0]}.`
                : "Welcome back."}
            </h1>
            <p>
              Your leadership tools, schedules, and student updates—together in
              one workspace.
            </p>
            <NavLink className="leadership-portal__primary-link" to="/portal/duties">
              Go to duty tracker <span aria-hidden="true">↗</span>
            </NavLink>
          </div>

          <aside className="leadership-portal__account" aria-label="Account overview">
            <div className="leadership-portal__account-mark" aria-hidden="true">
              {positionLabel
                .split(/\s+/)
                .map((word) => word.charAt(0))
                .join("")
                .slice(0, 2)}
            </div>
            <span className="leadership-portal__account-label">Signed in as</span>
            <strong>{positionLabel}</strong>
            <span className="leadership-portal__account-date">{dateLabel}</span>
            <span className="leadership-portal__account-access">
              Leadership workspace
            </span>
          </aside>
          <span className="leadership-portal__hero-orbit" aria-hidden="true" />
        </section>

        <section className="leadership-portal__tools" aria-labelledby="leadership-tools-title">
          <div className="leadership-portal__section-heading">
            <div>
              <span className="leadership-portal__section-label">Your workspace</span>
              <h2 id="leadership-tools-title">Tools for the work ahead.</h2>
            </div>
            <p>
              Choose a tool to manage duties, keep the team informed, and follow
              up on student feedback.
            </p>
          </div>

          <div className="leadership-portal__tool-grid">
            {leadershipTools.map((tool) => (
              <SectionCard key={tool.to} {...tool} />
            ))}
          </div>
        </section>

        <footer className="leadership-portal__footer">
          <NavLink to="/" className="leadership-portal__back-link">
            <span aria-hidden="true">←</span> Back to WSR Connect
          </NavLink>

          <div className="leadership-portal__signout-group">
            {signOutError && (
              <span className="leadership-portal__signout-error" role="alert">
                {signOutError}
              </span>
            )}
            <button
              className="leadership-portal__signout"
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
