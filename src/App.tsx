import {
  useEffect,
  useState,
} from "react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router";

import ScrollReveal from "./components/ScrollReveal";
import { srcMembers } from "./data/srcMembers";
import { supabase } from "./lib/supabase";
import DutiesPage from "./DutiesPage";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";

import PortalPage from "./portal/PortalPage";
import SRCMemberHomePage from "./portal/SRCMemberHomePage";
import PortalAnnouncementsPage from "./portal/AnnouncementsPage";
import CalendarPage from "./portal/CalendarPage";
import DutyTrackerPage from "./portal/DutyTrackerPage";
import FeedbackInboxPage from "./portal/FeedbackInboxPage";

import "./App.css";

const srcCategories = [
  "House & Sports Leadership",
  "Innovation",
  "Sustainability",
  "Senior Prefects",
  "Prefects",
  "Events",
  "Other Leadership",
];

const seniorLeadershipOrder = [
  "Head Boy",
  "Head Girl",
  "Assistant Head Boy",
  "Assistant Head Girl",
  "Deputy Head Boy",
  "Deputy Head Girl",
];

const feedbackAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const feedbackMaxFileSize = 50 * 1024 * 1024;
const feedbackMaxFiles = 10;

function getSeniorMember(position: string) {
  return srcMembers.find(
    (member) => member.position === position,
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function Header() {
  const location = useLocation();
  const { user, isSRC, isLeadership } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navbarProgress, setNavbarProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      const documentHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const progress =
        documentHeight > 0
          ? Math.min(
              Math.max(scrollTop / documentHeight, 0),
              1,
            )
          : 0;

      setNavbarProgress(progress);
      setScrollProgress(progress);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { label: "Home", path: "/" },
    { label: "Announcements", path: "/announcements" },
    { label: "Events", path: "/events" },
    { label: "SRC", path: "/src" },
    { label: "Duties", path: "/duties" },
    { label: "Resources", path: "/resources" },
    { label: "Feedback", path: "/feedback" },
  ];

  const workspacePath = !user
    ? "/login"
    : isLeadership
      ? "/portal"
      : isSRC
        ? "/src/home"
        : "/login";

  const workspaceLabel = !user
    ? "SRC Login"
    : isLeadership
      ? "Leadership Portal"
      : isSRC
        ? "My SRC"
        : "Sign in";

  return (
    <header
  className={`navbar ${
    location.pathname === "/"
      ? "navbar-home"
      : "navbar-inner-page"
  }`}
  style={
    {
      "--navbar-progress": navbarProgress,
    } as React.CSSProperties
  }
>
      <div
        className="scroll-progress"
        style={{
          transform: `scaleX(${scrollProgress})`,
        }}
        aria-hidden="true"
      />

      <div className="navbar-inner">
        <NavLink
          to="/"
          className="brand"
          aria-label="WSR Connect home"
        >
          <span className="brand-mark">
            WSR
          </span>

          <span>
            <span className="brand-name">
              WSR Connect
            </span>

            <span className="brand-subtitle">
              GEMS Westminster School - RAK
            </span>
          </span>
        </NavLink>

        <nav
          className="nav-links"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-link ${
                  isActive ? "nav-link-active" : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <NavLink
            to={workspacePath}
            className="portal-button"
          >
            {workspaceLabel}
            <span aria-hidden="true">↗</span>
          </NavLink>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={
            menuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      <nav
        className={`mobile-nav ${
          menuOpen ? "mobile-nav-open" : ""
        }`}
        aria-label="Mobile navigation"
      >
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `mobile-nav-link ${
                isActive
                  ? "mobile-nav-link-active"
                  : ""
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <NavLink
          to={workspacePath}
          className="mobile-login-link"
        >
          {workspaceLabel} ↗
        </NavLink>
      </nav>
    </header>
  );
}

/* =========================================================
   FOOTER
   ========================================================= */

function Footer() {
  const location = useLocation();

  const isPortalRoute =
    location.pathname === "/portal" ||
    location.pathname.startsWith("/portal/");

  return (
    <footer className="footer">
      <div>
        <div className="brand-name">
          WSR Connect
        </div>

        <p>GEMS Westminster School - RAK</p>
      </div>

      <div className="footer-right">
        <span>School community platform</span>

        {!isPortalRoute && (
          <NavLink
            className="portal-button"
            to="/portal"
          >
            School Portal →
          </NavLink>
        )}
      </div>
    </footer>
  );
}

/* =========================================================
   PAGE HERO
   ========================================================= */

function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-inner">
        <span className="eyebrow">{eyebrow}</span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </section>
  );
}

/* =========================================================
   HOME PAGE
   ========================================================= */

function HomePage() {
  return (
    <main className="home-page">
      {/* --------------------------------------------------
          HERO
      -------------------------------------------------- */}
      <section className="hero">
        <div
          className="hero-atmosphere"
          aria-hidden="true"
        >
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-grid" />
          <div className="hero-vignette" />
        </div>

        <div className="hero-inner">
          <div className="hero-topline">
            <span>
              GEMS WESTMINSTER SCHOOL — RAK
            </span>

            <span>2026 / 27</span>
          </div>

          <div className="hero-main">
            <div className="hero-copy">
              <p className="hero-kicker">
                THE DIGITAL HOME OF STUDENT LIFE
              </p>

              <h1 className="hero-title">
                <span className="hero-title-line">
                  WSR
                </span>

                <span className="hero-title-line hero-title-accent">
                  CONNECT
                  <span className="hero-title-period">
                    .
                  </span>
                </span>
              </h1>

              <p className="hero-description">
                The digital home of student life at
                Westminster School. Stay informed,
                discover opportunities, meet the
                people shaping our community, and
                keep moving forward.
              </p>

              <div className="hero-actions">
                <NavLink
                  to="/announcements"
                  className="button-primary"
                >
                  Explore WSR
                  <span aria-hidden="true">
                    ↗
                  </span>
                </NavLink>

                <NavLink
                  to="/src"
                  className="button-secondary"
                >
                  Meet the SRC
                </NavLink>
              </div>
            </div>

            <div className="hero-side">
              <div className="hero-side-line" />

              <span className="hero-side-label">
                STUDENT LIFE
              </span>

              <strong>
                Connected.
                <br />
                Informed.
                <br />
                Involved.
              </strong>

              <div className="hero-side-number">
                01
              </div>
            </div>
          </div>

          <div className="hero-bottom">
            <div className="hero-scroll-indicator">
              <span>
                Scroll to explore
              </span>

              <span
                className="hero-scroll-line"
                aria-hidden="true"
              />
            </div>

            <div className="hero-location">
              <span>
                WSR CONNECT
              </span>

              <span>
                STUDENT COMMUNITY PLATFORM
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          INTRO
      -------------------------------------------------- */}
      <section className="intro-section">
        <ScrollReveal className="section-wsr-reveal section-wsr-reveal-intro">
          <div
            className="section-wsr-mark"
            aria-hidden="true"
          >
            WSR
          </div>
        </ScrollReveal>

        <div className="page-container">
          <ScrollReveal>
            <div className="intro-grid">
              <div className="intro-label">
                <span>01</span>
                <span>THE PLATFORM</span>
              </div>

              <div className="intro-content">
                <p className="intro-small">
                  WSR CONNECT
                </p>

                <h2>
                  One school.
                  <br />
                  <em>
                    Everything connected.
                  </em>
                </h2>

                <p className="intro-description">
                  WSR Connect brings the student
                  experience together in one place —
                  from the latest announcements and
                  upcoming events to student
                  leadership, opportunities and
                  essential resources.
                </p>

                <div className="intro-meta">
                  <span>ANNOUNCEMENTS</span>
                  <span>EVENTS</span>
                  <span>LEADERSHIP</span>
                  <span>RESOURCES</span>
                </div>
              </div>

              <div
                className="intro-number"
                aria-hidden="true"
              >
                <span>01</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* --------------------------------------------------
          ANNOUNCEMENTS
      -------------------------------------------------- */}
      <section className="editorial-section">
        <ScrollReveal className="section-wsr-reveal section-wsr-reveal-announcements">
          <div
            className="section-wsr-mark"
            aria-hidden="true"
          >
            WSR
          </div>
        </ScrollReveal>

        <div className="page-container">
          <ScrollReveal>
            <div className="editorial-header">
              <div>
                <p className="editorial-eyebrow">
                  02 / WHAT'S HAPPENING
                </p>

                <h2>
                  The school is
                  <br />
                  <span>
                    always moving.
                  </span>
                </h2>
              </div>

              <NavLink
                to="/announcements"
                className="editorial-link"
              >
                View all announcements
                <span>↗</span>
              </NavLink>
            </div>
          </ScrollReveal>

          <div className="editorial-grid">
            <ScrollReveal delay={100}>
              <NavLink
                to="/announcements"
                className="feature-story"
              >
                <div className="feature-story-background">
                  <div className="feature-story-orb" />
                </div>

                <div className="feature-story-content">
                  <span className="story-tag">
                    FEATURED
                  </span>

                  <h3>
                    Stay connected to
                    <br />
                    what's happening.
                  </h3>

                  <p>
                    Important updates, school
                    news and opportunities in one
                    place.
                  </p>

                  <span className="story-arrow">
                    Explore announcements ↗
                  </span>
                </div>
              </NavLink>
            </ScrollReveal>

            <div className="story-stack">
              <ScrollReveal delay={180}>
                <NavLink
                  to="/announcements"
                  className="story-item"
                >
                  <span className="story-number">
                    01
                  </span>

                  <div>
                    <span className="story-meta">
                      LATEST UPDATE
                    </span>

                    <h3>
                      Important school
                      information
                    </h3>
                  </div>

                  <span className="story-arrow-small">
                    ↗
                  </span>
                </NavLink>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <NavLink
                  to="/announcements"
                  className="story-item"
                >
                  <span className="story-number">
                    02
                  </span>

                  <div>
                    <span className="story-meta">
                      COMMUNITY
                    </span>

                    <h3>
                      What's happening
                      around WSR
                    </h3>
                  </div>

                  <span className="story-arrow-small">
                    ↗
                  </span>
                </NavLink>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <NavLink
                  to="/announcements"
                  className="story-item"
                >
                  <span className="story-number">
                    03
                  </span>

                  <div>
                    <span className="story-meta">
                      OPPORTUNITY
                    </span>

                    <h3>
                      Get involved
                      with school life
                    </h3>
                  </div>

                  <span className="story-arrow-small">
                    ↗
                  </span>
                </NavLink>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          SRC
      -------------------------------------------------- */}
      <section className="leadership-section">
        <div className="leadership-background" />

        <div className="page-container">
          <ScrollReveal>
            <div className="leadership-layout">
              <div className="leadership-index">
                03
              </div>

              <div className="leadership-copy">
                <p className="leadership-eyebrow">
                  STUDENT LEADERSHIP
                </p>

                <h2>
                  The people
                  <br />
                  <span>
                    behind WSR.
                  </span>
                </h2>

                <p>
                  The Student Representative Council
                  exists to represent students,
                  create opportunities and help shape
                  the school community.
                </p>

                <NavLink
                  to="/src"
                  className="leadership-link"
                >
                  Meet the SRC
                  <span>↗</span>
                </NavLink>
              </div>

              <div className="leadership-visual">
                <div className="leadership-orbit orbit-one" />
                <div className="leadership-orbit orbit-two" />

                <div className="leadership-monogram">
                  SRC
                </div>

                <div className="leadership-caption">
                  <span>
                    STUDENT REPRESENTATIVE
                    COUNCIL
                  </span>

                  <strong>
                    2026 / 27
                  </strong>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* --------------------------------------------------
     EVENTS
-------------------------------------------------- */}
<section className="events-section">
  <ScrollReveal className="section-wsr-reveal">
    <div
      className="section-wsr-mark"
      aria-hidden="true"
    >
      WSR
    </div>
  </ScrollReveal>

  <div className="page-container">
    <ScrollReveal>
      <div className="events-heading">
        <div>
          <p className="editorial-eyebrow">
            04 / EVENTS
          </p>

          <h2>
            What's next?
          </h2>
        </div>

        <NavLink
          to="/events"
          className="editorial-link"
        >
          View event calendar
          <span>↗</span>
        </NavLink>
      </div>
    </ScrollReveal>

    <ScrollReveal delay={120}>
      <div className="events-empty-state">
        <div className="events-empty-index">
          <span>EVENTS</span>
          <strong>—</strong>
        </div>

        <div className="events-empty-content">
          <span>WSR CALENDAR</span>

          <h3>
            Upcoming events will appear here.
          </h3>

          <p>
            The public event calendar is now connected
            to the school's central event system.
          </p>
        </div>

        <NavLink
          to="/events"
          className="timeline-arrow"
          aria-label="View events"
        >
          ↗
        </NavLink>
      </div>
    </ScrollReveal>
  </div>
</section>
      {/* --------------------------------------------------
          RESOURCES
      -------------------------------------------------- */}
      <section className="resources-section">
        <ScrollReveal className="section-wsr-reveal section-wsr-reveal-resources">
          <div
            className="section-wsr-mark"
            aria-hidden="true"
          >
            WSR
          </div>
        </ScrollReveal>

        <div className="page-container">
          <ScrollReveal>
            <div className="resources-header">
              <div>
                <p className="editorial-eyebrow">
                  05 / RESOURCES
                </p>

                <h2>
                  Everything you
                  <br />
                  <span>need.</span>
                </h2>
              </div>

              <p>
                Useful links and resources,
                organised so you can get where
                you need to go.
              </p>
            </div>
          </ScrollReveal>

          <div className="resources-grid">
            <ScrollReveal delay={100}>
              <NavLink
                to="/resources"
                className="resource-card resource-card-large"
              >
                <span>01</span>

                <div>
                  <small>
                    ACADEMIC
                  </small>

                  <h3>
                    Academic resources
                  </h3>
                </div>

                <strong>↗</strong>
              </NavLink>
            </ScrollReveal>

            <ScrollReveal delay={160}>
              <NavLink
                to="/resources"
                className="resource-card"
              >
                <span>02</span>

                <div>
                  <small>
                    STUDENT LIFE
                  </small>

                  <h3>
                    Student resources
                  </h3>
                </div>

                <strong>↗</strong>
              </NavLink>
            </ScrollReveal>

            <ScrollReveal delay={220}>
              <NavLink
                to="/resources"
                className="resource-card"
              >
                <span>03</span>

                <div>
                  <small>
                    INFORMATION
                  </small>

                  <h3>
                    Useful information
                  </h3>
                </div>

                <strong>↗</strong>
              </NavLink>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------
          CLOSING CTA
      -------------------------------------------------- */}
      <section className="closing-section">
        <div className="closing-glow" />

        <ScrollReveal className="section-wsr-reveal section-wsr-reveal-closing">
          <div
            className="section-wsr-mark"
            aria-hidden="true"
          >
            WSR
          </div>
        </ScrollReveal>

        <div className="page-container">
          <ScrollReveal>
            <div className="closing-content">
              <p>
                WSR CONNECT
              </p>

              <h2>
                Stay
                <br />
                connected.
              </h2>

              <NavLink
                to="/announcements"
                className="button-primary"
              >
                Explore WSR
                <span aria-hidden="true">
                  ↗
                </span>
              </NavLink>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */

function AnnouncementsPage() {
  return (
    <>
      <PageHero
        eyebrow="WSR CONNECT"
        title="Announcements"
        description="Stay up to date with school news, student leadership updates, community notices and important information."
      />

      <section className="section">
        <div className="announcement-page-grid">
          <article className="announcement-card">
            <div className="announcement-top">
              <span>WSR CONNECT</span>
              <span>—</span>
            </div>

            <h3>
              No announcements published yet.
            </h3>

            <p>
              Official school and student leadership
              announcements will appear here when they
              are published.
            </p>

            <span className="card-link">
              WSR Announcements
            </span>
          </article>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   EVENTS
   ========================================================= */

function EventsPage() {
  const [events, setEvents] = useState<
    Array<{
      id: string;
      title: string;
      description: string | null;
      start_at: string;
      end_at: string | null;
      all_day: boolean;
      location: string | null;
      category: string;
    }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("calendar_events")
        .select(
          "id, title, description, start_at, end_at, all_day, location, category",
        )
        .eq("visibility", "public")
        .order("start_at", {
          ascending: true,
        });

      if (cancelled) {
        return;
      }

      if (fetchError) {
        console.error(
          "Failed to load public events:",
          fetchError,
        );
        setError(
          "Events could not be loaded right now.",
        );
        setEvents([]);
        setLoading(false);
        return;
      }

      setEvents(data ?? []);
      setLoading(false);
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  function formatEventDate(
    startAt: string,
    allDay: boolean,
  ) {
    const date = new Date(startAt);

    if (allDay) {
      return {
        day: date.toLocaleDateString("en-GB", {
          day: "2-digit",
        }),
        month: date.toLocaleDateString("en-GB", {
          month: "short",
        }).toUpperCase(),
      };
    }

    return {
      day: date.toLocaleDateString("en-GB", {
        day: "2-digit",
      }),
      month: date.toLocaleDateString("en-GB", {
        month: "short",
      }).toUpperCase(),
    };
  }

  return (
    <>
      <PageHero
        eyebrow="WSR CONNECT"
        title="Events"
        description="Keep track of upcoming school events, student leadership meetings and community activities."
      />

      <section className="section">
        {loading ? (
          <div className="events-list">
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="events-list">
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="events-list">
            <p>No public events are currently scheduled.</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => {
              const formattedDate = formatEventDate(
                event.start_at,
                event.all_day,
              );

              return (
                <article
                  className="event-row"
                  key={event.id}
                >
                  <div className="event-date">
                    <strong>
                      {formattedDate.day}
                    </strong>
                    <span>
                      {formattedDate.month}
                    </span>
                  </div>

                  <div className="event-main">
                    <span>
                      {event.category}
                    </span>

                    <h3>{event.title}</h3>

                    {event.description && (
                      <p>{event.description}</p>
                    )}

                    {event.location && (
                      <small>
                        {event.location}
                      </small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

/* =========================================================
   SRC
   ========================================================= */

function MemberCard({
  position,
  name,
  grade,
}: {
  position: string;
  name: string;
  grade: string;
}) {
  return (
    <article className="src-member-card">
      <div className="src-member-top">
        <span className="src-member-role">
          {position}
        </span>

        <span className="src-member-grade">
          {grade}
        </span>
      </div>

      <h3>{name}</h3>

      <div className="src-member-footer">
        <span>WSR Student Leadership</span>
      </div>
    </article>
  );
}

function SRCPage() {
  const seniorLeadership = seniorLeadershipOrder
    .map((position) => getSeniorMember(position))
    .filter(
      (
        member,
      ): member is NonNullable<typeof member> =>
        Boolean(member),
    );

  return (
    <>
      <PageHero
        eyebrow="STUDENT LEADERSHIP"
        title="Student Representative Council"
        description="Meet the students representing and leading the WSR community across leadership, houses, innovation, sustainability, events and student leadership."
      />

      <section className="section src-intro">
        <div className="src-intro-card">
          <div>
            <span className="eyebrow">
              WSR SRC
            </span>

            <h2>
              Meet the student leadership team.
            </h2>
          </div>

          <div className="src-intro-stats">
            <div>
              <strong>{srcMembers.length}</strong>
              <span>Listed roles</span>
            </div>

            <div>
              <strong>
                {srcCategories.length + 1}
              </strong>

              <span>Leadership areas</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section src-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              HIGHEST LEADERSHIP
            </span>

            <h2>Senior Leadership</h2>
          </div>

          <span className="src-count">
            {seniorLeadership.length} leaders
          </span>
        </div>

        <div className="src-senior-leadership">
          {Array.from({
            length: Math.ceil(
              seniorLeadership.length / 2,
            ),
          }).map((_, pairIndex) => {
            const first =
              seniorLeadership[pairIndex * 2];

            const second =
              seniorLeadership[pairIndex * 2 + 1];

            if (!first) {
              return null;
            }

            return (
              <div
                key={`${first.position}-${second?.position ?? "single"}`}
                className="src-senior-row"
              >
                <MemberCard
                  position={first.position}
                  name={first.name}
                  grade={first.grade}
                />

                {second && (
                  <MemberCard
                    position={second.position}
                    name={second.name}
                    grade={second.grade}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {srcCategories.map((category) => {
        const members = srcMembers.filter(
          (member) => member.category === category,
        );

        if (members.length === 0) {
          return null;
        }

        return (
          <section
            className="section src-section"
            key={category}
          >
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  SRC
                </span>

                <h2>{category}</h2>
              </div>

              <span className="src-count">
                {members.length}{" "}
                {members.length === 1
                  ? "member"
                  : "members"}
              </span>
            </div>

            <div className="src-member-grid">
              {members.map((member) => (
                <MemberCard
                  key={`${member.position}-${member.name}`}
                  position={member.position}
                  name={member.name}
                  grade={member.grade}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="section">
        <div className="src-contact-note">
          <span className="eyebrow">CONTACT</span>

          <h2>
            Need to reach student leadership?
          </h2>

          <p>
            Public contact details are intentionally
            not displayed here. School-approved contact
            channels can be added to the School Portal
            once authentication and permissions are
            implemented.
          </p>

          <NavLink
            className="secondary-button"
            to="/feedback"
          >
            Send Feedback
          </NavLink>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   RESOURCES
   ========================================================= */

function ResourcesPage() {
  const resources = [
    {
      number: "01",
      title: "School Resources",
      description:
        "Useful documents and school-approved links.",
    },
    {
      number: "02",
      title: "Student Leadership",
      description:
        "Information relating to student leadership and SRC work.",
    },
    {
      number: "03",
      title: "School Information",
      description:
        "Public-facing information for the WSR community.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="WSR CONNECT"
        title="Resources"
        description="A central location for useful school information, documents and links."
      />

      <section className="section">
        <div className="resource-page-grid">
          {resources.map((resource) => (
            <article
              className="resource-card resource-page-card"
              key={resource.title}
            >
              <span>{resource.number}</span>

              <strong>{resource.title}</strong>

              <small>
                {resource.description}
              </small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

/* =========================================================
   FEEDBACK
   ========================================================= */

function FeedbackPage() {
  const [fullName, setFullName] = useState("");
  const [gradeSection, setGradeSection] =
    useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [requestResponse, setRequestResponse] =
    useState(false);

  const [
    requestStaffInvolvement,
    setRequestStaffInvolvement,
  ] = useState(false);

  const [attachments, setAttachments] =
    useState<File[]>([]);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setErrorMessage("");

    const selectedFiles = Array.from(
      event.target.files ?? [],
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const combinedFiles = [
      ...attachments,
      ...selectedFiles,
    ];

    if (
      combinedFiles.length > feedbackMaxFiles
    ) {
      setErrorMessage(
        `You can attach up to ${feedbackMaxFiles} files.`,
      );

      event.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > feedbackMaxFileSize) {
        setErrorMessage(
          `"${file.name}" is larger than the 50 MB limit.`,
        );

        event.target.value = "";
        return;
      }

      if (
        file.type &&
        !feedbackAllowedMimeTypes.includes(file.type)
      ) {
        setErrorMessage(
          `"${file.name}" has an unsupported file type.`,
        );

        event.target.value = "";
        return;
      }
    }

    setAttachments(combinedFiles);
    event.target.value = "";
  };

  const removeAttachment = (
    indexToRemove: number,
  ) => {
    setAttachments((currentFiles) =>
      currentFiles.filter(
        (_, index) => index !== indexToRemove,
      ),
    );

    setErrorMessage("");
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setSubmitted(false);
    setErrorMessage("");

    try {
      if (
        attachments.length > feedbackMaxFiles
      ) {
        throw new Error(
          `You can attach up to ${feedbackMaxFiles} files.`,
        );
      }

      for (const file of attachments) {
        if (file.size > feedbackMaxFileSize) {
          throw new Error(
            `"${file.name}" is larger than the 50 MB limit.`,
          );
        }

        if (
          file.type &&
          !feedbackAllowedMimeTypes.includes(file.type)
        ) {
          throw new Error(
            `"${file.name}" has an unsupported file type.`,
          );
        }
      }

      const formData = new FormData();

      formData.append("full_name", fullName);
      formData.append(
        "grade_section",
        gradeSection,
      );
      formData.append("email", email || "");
      formData.append("category", category);
      formData.append("subject", subject);
      formData.append("message", message);

      formData.append(
        "request_response",
        String(requestResponse),
      );

      formData.append(
        "request_staff_involvement",
        String(requestStaffInvolvement),
      );

      for (const file of attachments) {
        formData.append(
          "attachments",
          file,
          file.name,
        );
      }

      const response = await fetch(
        "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/submit-feedback",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Something went wrong while submitting your feedback.",
        );
      }

      setSubmitted(true);
      setFullName("");
      setGradeSection("");
      setEmail("");
      setCategory("");
      setSubject("");
      setMessage("");
      setRequestResponse(false);
      setRequestStaffInvolvement(false);
      setAttachments([]);
    } catch (error) {
      console.error(
        "Feedback submission failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="YOUR VOICE MATTERS"
        title="Feedback"
        description="Share an idea, concern, report or suggestion with student leadership."
      />

      <section className="section">
        <div className="feedback-panel">
          <span className="eyebrow">
            PUBLIC FEEDBACK
          </span>

          <h2>
            Tell us what could be better.
          </h2>

          <p>
            Your feedback will be submitted to the WSR
            Connect feedback system for review by the
            authorised student leadership team.
          </p>

          {submitted ? (
            <div className="feedback-status">
              <div
                className="feedback-status-marker"
                aria-hidden="true"
              >
                ✓
              </div>

              <div>
                <strong>
                  Feedback submitted successfully.
                </strong>

                <p>
                  Thank you. Your submission has been
                  received and can now be reviewed by
                  the authorised leadership team.
                </p>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setSubmitted(false)
                  }
                >
                  Submit another response
                </button>
              </div>
            </div>
          ) : (
            <form
              className="feedback-form"
              onSubmit={handleSubmit}
            >
              <div className="feedback-form-grid">
                <label>
                  <span>Full Name *</span>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value,
                      )
                    }
                    placeholder="Your full name"
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  <span>Grade & Section *</span>

                  <input
                    type="text"
                    value={gradeSection}
                    onChange={(event) =>
                      setGradeSection(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Year 12A"
                    maxLength={80}
                    required
                  />
                </label>
              </div>

              <label>
                <span>Email Address</span>

                <small>
                  Optional. Provide this if you would like
                  a response.
                </small>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="your.email@example.com"
                  maxLength={254}
                />
              </label>

              <label>
                <span>
                  What is this about? *
                </span>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option
                    value=""
                    disabled
                  >
                    Select a category
                  </option>

                  <option value="suggestion">
                    Suggestion / Idea
                  </option>

                  <option value="concern">
                    Concern
                  </option>

                  <option value="event">
                    Event
                  </option>

                  <option value="facilities">
                    Facilities
                  </option>

                  <option value="src">
                    SRC / Student Leadership
                  </option>

                  <option value="website">
                    WSR Connect / Website
                  </option>

                  <option value="report">
                    Report an Incident
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                <span>Subject *</span>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value,
                    )
                  }
                  placeholder="Briefly describe what your feedback is about"
                  maxLength={200}
                  required
                />
              </label>

              <label>
                <span>Feedback *</span>

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value,
                    )
                  }
                  placeholder="Explain your feedback, concern or report..."
                  maxLength={5000}
                  rows={7}
                  required
                />
              </label>

              <div className="feedback-attachments">
                <div>
                  <span className="feedback-field-label">
                    Attachments
                  </span>

                  <small>
                    Optional. You can attach up to 10 files,
                    with a maximum of 50 MB per file.
                  </small>
                </div>

                <label className="feedback-file-input">
                  <span>Select files</span>

                  <input
                    type="file"
                    multiple
                    accept={[
                      ".jpg",
                      ".jpeg",
                      ".png",
                      ".webp",
                      ".gif",
                      ".pdf",
                      ".txt",
                      ".doc",
                      ".docx",
                      ".xls",
                      ".xlsx",
                      ".ppt",
                      ".pptx",
                    ].join(",")}
                    onChange={
                      handleFileSelection
                    }
                    disabled={
                      submitting ||
                      attachments.length >=
                        feedbackMaxFiles
                    }
                  />
                </label>

                {attachments.length > 0 ? (
                  <div className="feedback-file-list">
                    {attachments.map(
                      (file, index) => (
                        <div
                          className="feedback-file-item"
                          key={`${file.name}-${file.size}-${index}`}
                        >
                          <div>
                            <strong>
                              {file.name}
                            </strong>

                            <small>
                              {formatFileSize(
                                file.size,
                              )}
                            </small>
                          </div>

                          <button
                            type="button"
                            className="feedback-file-remove"
                            onClick={() =>
                              removeAttachment(
                                index,
                              )
                            }
                            disabled={submitting}
                            aria-label={`Remove ${file.name}`}
                          >
                            Remove
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>

              <div className="feedback-options">
                <label className="feedback-checkbox">
                  <input
                    type="checkbox"
                    checked={requestResponse}
                    onChange={(event) =>
                      setRequestResponse(
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    <strong>
                      I would like a response.
                    </strong>

                    <small>
                      If selected, please provide an email
                      address above.
                    </small>
                  </span>
                </label>

                <label className="feedback-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      requestStaffInvolvement
                    }
                    onChange={(event) =>
                      setRequestStaffInvolvement(
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    <strong>
                      I would like a staff member to be
                      involved.
                    </strong>

                    <small>
                      Select this if you would like your
                      concern to be referred for staff
                      involvement.
                    </small>
                  </span>
                </label>
              </div>

              <div className="feedback-privacy">
                <strong>Before you submit</strong>

                <p>
                  Please avoid sharing passwords, account
                  credentials or other highly sensitive
                  information. This feedback system is
                  intended for school-community suggestions,
                  concerns, reports and requests.
                  Submissions are accessible only to
                  authorised members of the WSR Connect
                  leadership system.
                </p>

                <p>
                  This notice is temporary and does not
                  represent a school-approved privacy
                  policy.
                </p>
              </div>

              {errorMessage ? (
                <div
                  className="feedback-error"
                  role="alert"
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Feedback"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

/* =========================================================
   ERROR PAGES
   ========================================================= */

function NotFoundPage() {
  return (
    <section className="portal-page">
      <div className="portal-card">
        <span className="eyebrow">404</span>

        <h1>Page not found.</h1>

        <p>
          The page you're looking for doesn't exist
          in WSR Connect.
        </p>

        <NavLink
          className="primary-button"
          to="/"
        >
          Return home
        </NavLink>
      </div>
    </section>
  );
}

function PortalNotFoundPage() {
  return (
    <section className="portal-page">
      <div className="portal-card">
        <span className="eyebrow">
          404 · LEADERSHIP PORTAL
        </span>

        <h1>Portal page not found.</h1>

        <p>
          This leadership portal page doesn't exist yet
          or the address is incorrect.
        </p>

        <NavLink
          className="primary-button"
          to="/portal"
        >
          Back to Portal
        </NavLink>
      </div>
    </section>
  );
}

/* =========================================================
   APP LAYOUT
   ========================================================= */

function Layout() {
  const location = useLocation();

  const isPortalRoute =
    location.pathname === "/portal" ||
    location.pathname.startsWith("/portal/");

  return (
    <div className="app">
      <Header />

      <main>
        <Routes>
          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/announcements"
            element={<AnnouncementsPage />}
          />

          <Route
            path="/events"
            element={<EventsPage />}
          />

          <Route
            path="/src"
            element={<SRCPage />}
          />

          <Route
            path="/src/home"
            element={
              <ProtectedRoute requiredAccess="src">
                <SRCMemberHomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/duties"
            element={
              <ProtectedRoute requiredAccess="src">
                <DutiesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resources"
            element={<ResourcesPage />}
          />

          <Route
            path="/feedback"
            element={<FeedbackPage />}
          />

          <Route
  path="/portal"
  element={
    <ProtectedRoute requiredAccess="leadership">
      <PortalPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/portal/announcements"
  element={
    <ProtectedRoute requiredAccess="leadership">
      <PortalAnnouncementsPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/portal/calendar"
            element={
              <ProtectedRoute requiredAccess="leadership">
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/duties"
            element={
              <ProtectedRoute requiredAccess="leadership">
                <DutyTrackerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/feedback"
            element={
              <ProtectedRoute requiredAccess="leadership">
                <FeedbackInboxPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/*"
            element={
              <ProtectedRoute requiredAccess="leadership">
                <PortalNotFoundPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="*"
            element={
              isPortalRoute ? (
                <ProtectedRoute requiredAccess="leadership">
                  <PortalNotFoundPage />
                </ProtectedRoute>
              ) : (
                <NotFoundPage />
              )
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
