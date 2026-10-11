import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";
import "./HomeAccessSection.css";

export default function HomeAccessSection() {
  const { user, isSRC, isLeadership } = useAuth();

  const workspacePath = !user
    ? "/login"
    : isLeadership
      ? "/portal"
      : isSRC
        ? "/src/home"
        : "/login";

  const workspaceLabel = isLeadership
    ? "Open leadership workspace"
    : isSRC
      ? "Open my SRC workspace"
      : "Sign in with your SRC account";

  return (
    <section
      className="home-access"
      aria-labelledby="home-access-title"
    >
      <div className="page-container">
        <div className="home-access__heading">
          <div>
            <span className="home-access__eyebrow">
              WSR CONNECT · ACCESS
            </span>
            <h2 id="home-access-title">
              One school home.
              <br />
              <span>Clear ways in.</span>
            </h2>
          </div>

          <p>
            Explore school life openly. SRC members sign in with
            their individual school account to reach their duties
            and workspace.
          </p>
        </div>

        <div className="home-access__cards">
          <article className="home-access__card">
            <div className="home-access__card-top">
              <span className="home-access__number">01</span>
              <span className="home-access__audience">
                OPEN TO THE SCHOOL COMMUNITY
              </span>
            </div>

            <div>
              <h3>Explore WSR</h3>
              <p>
                Browse announcements, upcoming events, the SRC,
                and useful school resources without signing in.
              </p>
            </div>

            <NavLink
              className="home-access__link"
              to="/announcements"
            >
              Explore school updates
              <span aria-hidden="true">↗</span>
            </NavLink>
          </article>

          <article className="home-access__card home-access__card--member">
            <div className="home-access__card-top">
              <span className="home-access__number">02</span>
              <span className="home-access__audience">
                CURRENT SRC MEMBERS
              </span>
            </div>

            <div>
              <h3>Your SRC workspace</h3>
              <p>
                Sign in with the individual school account issued
                to you for your duty schedule and SRC tools.
              </p>
            </div>

            <NavLink
              className="home-access__link"
              to={workspacePath}
            >
              {workspaceLabel}
              <span aria-hidden="true">↗</span>
            </NavLink>
          </article>
        </div>
      </div>
    </section>
  );
}

