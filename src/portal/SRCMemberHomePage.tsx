import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../lib/supabase";
import "./SRCMemberHomePage.css";

const DUTIES_API =
  "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/runtime-test";

interface MemberDuty {
  id: string;
  title?: string;
  duty_name?: string;
  start_time: string;
  end_time: string | null;
  location: string;
  status: "pending" | "completed" | "covered" | "unaccounted";
}

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  all_day: boolean;
  location: string | null;
  category: string;
}

function getDubaiDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatEventTime(event: PublicEvent) {
  const date = new Date(event.start_at);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Dubai",
  }).format(date);

  if (event.all_day) {
    return `${formattedDate} · All day`;
  }

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  }).format(date);

  return `${formattedDate} · ${formattedTime}`;
}

function getFirstName(userName: string | null | undefined, email: string | null | undefined) {
  const displayName = userName?.trim();
  if (displayName) {
    return displayName.split(/\s+/)[0];
  }

  const emailName = email?.split("@")[0]?.trim();
  return emailName || "SRC member";
}

export default function SRCMemberHomePage() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<MemberDuty[]>([]);
  const [dutiesLoading, setDutiesLoading] = useState(true);
  const [dutiesError, setDutiesError] = useState<string | null>(null);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const today = getDubaiDateKey(new Date());
  const todayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Dubai",
  }).format(new Date());

  useEffect(() => {
    let cancelled = false;

    async function loadTodayDuties() {
      if (!user) {
        setDutiesLoading(false);
        return;
      }

      setDutiesLoading(true);
      setDutiesError(null);

      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({
          resource: "duties",
          date: today,
        });
        const response = await fetch(
          `${DUTIES_API}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Could not load today's duties.");
        }

        if (!cancelled) {
          setDuties(Array.isArray(data?.duties) ? data.duties : []);
        }
      } catch (error) {
        if (!cancelled) {
          setDutiesError(
            error instanceof Error
              ? error.message
              : "Could not load today's duties.",
          );
        }
      } finally {
        if (!cancelled) {
          setDutiesLoading(false);
        }
      }
    }

    void loadTodayDuties();

    return () => {
      cancelled = true;
    };
  }, [today, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadUpcomingEvents() {
      setEventsLoading(true);
      setEventsError(null);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, description, start_at, all_day, location, category")
        .eq("visibility", "public")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3);

      if (cancelled) {
        return;
      }

      if (error) {
        setEventsError("Upcoming events could not be loaded right now.");
        setEvents([]);
      } else {
        setEvents((data ?? []) as PublicEvent[]);
      }

      setEventsLoading(false);
    }

    void loadUpcomingEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="src-member-home">
      <div className="src-member-home__container">
        <header className="src-member-home__hero">
          <div>
            <span className="src-member-home__eyebrow">SRC member space</span>
            <h1>Welcome, {getFirstName(user?.displayName, user?.email)}</h1>
            <p>Your school day and SRC tools, together in one place.</p>
          </div>

          <div className="src-member-home__date-card">
            <span>Today</span>
            <strong>{todayLabel}</strong>
            <NavLink to="/duties">Open my duties <span aria-hidden="true">↗</span></NavLink>
          </div>
        </header>

        <section className="src-member-home__overview" aria-label="Today's overview">
          <article className="src-member-home__panel">
            <div className="src-member-home__panel-heading">
              <div>
                <span className="src-member-home__section-label">Your schedule</span>
                <h2>Today’s duties</h2>
              </div>
              {!dutiesLoading && !dutiesError && (
                <span className="src-member-home__count">
                  {duties.length} {duties.length === 1 ? "duty" : "duties"}
                </span>
              )}
            </div>

            {dutiesLoading ? (
              <p className="src-member-home__message" role="status">Loading your duties…</p>
            ) : dutiesError ? (
              <p className="src-member-home__message src-member-home__message--error" role="alert">
                {dutiesError}
              </p>
            ) : duties.length === 0 ? (
              <p className="src-member-home__message">
                No duties are scheduled for you today. Open the tracker to check another date.
              </p>
            ) : (
              <ul className="src-member-home__list">
                {duties.slice(0, 3).map((duty) => (
                  <li className="src-member-home__duty" key={duty.id}>
                    <span className={`src-member-home__status src-member-home__status--${duty.status}`}>
                      {duty.status === "unaccounted" ? "Needs review" : duty.status}
                    </span>
                    <div>
                      <strong>{duty.title ?? duty.duty_name ?? "Duty"}</strong>
                      <span>
                        {formatTime(duty.start_time)}
                        {duty.end_time ? `–${formatTime(duty.end_time)}` : ""}
                        {duty.location ? ` · ${duty.location}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <NavLink className="src-member-home__text-link" to="/duties">
              View duty tracker <span aria-hidden="true">→</span>
            </NavLink>
          </article>

          <article className="src-member-home__panel">
            <div className="src-member-home__panel-heading">
              <div>
                <span className="src-member-home__section-label">Coming up</span>
                <h2>School events</h2>
              </div>
              <NavLink className="src-member-home__small-link" to="/events">All events →</NavLink>
            </div>

            {eventsLoading ? (
              <p className="src-member-home__message" role="status">Loading events…</p>
            ) : eventsError ? (
              <p className="src-member-home__message src-member-home__message--error" role="alert">
                {eventsError}
              </p>
            ) : events.length === 0 ? (
              <p className="src-member-home__message">No public events are scheduled yet.</p>
            ) : (
              <ul className="src-member-home__event-list">
                {events.map((event) => (
                  <li className="src-member-home__event" key={event.id}>
                    <span>{formatEventTime(event)}</span>
                    <strong>{event.title}</strong>
                    {event.location && <small>{event.location}</small>}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="src-member-home__tools">
          <div className="src-member-home__tools-heading">
            <span className="src-member-home__section-label">Quick links</span>
            <h2>What do you need?</h2>
          </div>

          <div className="src-member-home__tool-grid">
            <NavLink className="src-member-home__tool" to="/duties">
              <span>Accountability</span>
              <strong>My duties</strong>
              <small>Check assignments, completion, and cover.</small>
              <span className="src-member-home__tool-arrow" aria-hidden="true">↗</span>
            </NavLink>
            <NavLink className="src-member-home__tool" to="/events">
              <span>Schedule</span>
              <strong>Events</strong>
              <small>See upcoming school and SRC events.</small>
              <span className="src-member-home__tool-arrow" aria-hidden="true">↗</span>
            </NavLink>
            <NavLink className="src-member-home__tool" to="/announcements">
              <span>Updates</span>
              <strong>Announcements</strong>
              <small>Visit the WSR Connect announcements page.</small>
              <span className="src-member-home__tool-arrow" aria-hidden="true">↗</span>
            </NavLink>
            <NavLink className="src-member-home__tool" to="/resources">
              <span>Reference</span>
              <strong>Resources</strong>
              <small>Find useful school and SRC information.</small>
              <span className="src-member-home__tool-arrow" aria-hidden="true">↗</span>
            </NavLink>
          </div>
        </section>
      </div>
    </main>
  );
}
