import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";
import "./DutyTrackerPage.css";
import {
  corridorCoverAvailability,
  type CorridorCoverDay,
} from "../data/duties";

const FUNCTION_URL =
  "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/runtime-test";

type DutyStatus =
  | "pending"
  | "completed"
  | "covered"
  | "unaccounted";

interface Duty {
  id: string;
  rota_id: string;
  duty_date: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string;
  assigned_to: string | null;
  assigned_name: string | null;
  status: DutyStatus;
  completed_at: string | null;
  completed_by: string | null;
  covered_by_name: string | null;
  covered_by_uid: string | null;
  covered_at: string | null;
  notes: string | null;
}

interface ApiDuty {
  id: string;
  rota_id: string;
  duty_date: string;
  title?: string;
  duty_name?: string;
  start_time: string;
  end_time: string | null;
  location: string;
  assigned_to: string | null;
  assigned_name?: string | null;
  status: DutyStatus;
  completed_at?: string | null;
  completed_by?: string | null;
  covered_by_name?: string | null;
  covered_by_uid?: string | null;
  covered_at?: string | null;
  notes?: string | null;
  cover?: {
    covered_by?: string;
    recorded_at?: string;
  } | null;
}

function normalizeDuty(apiDuty: ApiDuty): Duty {
  return {
    id: apiDuty.id,
    rota_id: apiDuty.rota_id,
    duty_date: apiDuty.duty_date,
    title: apiDuty.title ?? apiDuty.duty_name ?? "Duty",
    start_time: apiDuty.start_time,
    end_time: apiDuty.end_time ?? null,
    location: apiDuty.location,
    assigned_to: apiDuty.assigned_to,
    assigned_name: apiDuty.assigned_name ?? null,
    status: apiDuty.status,
    completed_at: apiDuty.completed_at ?? null,
    completed_by: apiDuty.completed_by ?? null,
    covered_by_name:
      apiDuty.covered_by_name ?? apiDuty.cover?.covered_by ?? null,
    covered_by_uid: apiDuty.covered_by_uid ?? null,
    covered_at:
      apiDuty.covered_at ?? apiDuty.cover?.recorded_at ?? null,
    notes: apiDuty.notes ?? null,
  };
}

interface DutyResponse {
  duties: Duty[];
  summary?: {
    total: number;
    completed: number;
    covered: number;
    pending: number;
    unaccounted: number;
  };
}

function formatTime(time: string | null) {
  if (!time) {
    return "—";
  }

  const [hourString, minuteString] = time.split(":");

  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return time;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString: string) {
  const date = new Date(
    `${dateString}T00:00:00`,
  );

  return date.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTodayString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusLabel(status: DutyStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "covered":
      return "Covered";
    case "unaccounted":
      return "Unaccounted";
    default:
      return "Pending";
  }
}

function getStatusStyle(status: DutyStatus) {
  switch (status) {
    case "completed":
      return {
        background: "#E8F5EC",
        color: "#23643A",
        border: "#B9DEC4",
      };

    case "covered":
      return {
        background: "#EEF3FA",
        color: "#24558D",
        border: "#C8D7E9",
      };

    case "unaccounted":
      return {
        background: "#FCECEC",
        color: "#9A3030",
        border: "#E8BABA",
      };

    default:
      return {
        background: "#F5F5F5",
        color: "#666666",
        border: "#D9DDE1",
      };
  }
}

function getCorridorCoverCandidates(
  selectedDate: string,
  duty: Duty,
) {
  const isCorridorDuty =
    duty.title
      .toLowerCase()
      .includes("corridor") ||
    duty.location
      .toLowerCase()
      .includes("corridor");

  const isGirlsCorridorDuty = duty.title
    .toLowerCase()
    .includes("girls corridor duty");

  // The availability data currently belongs only to girls' corridor duties.
  // Never expose that list on boys' duties; a separate boys' list is needed.
  if (!isCorridorDuty || !isGirlsCorridorDuty) {
    return [];
  }

  const weekday = new Date(
    `${selectedDate}T12:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "long",
  }) as CorridorCoverDay;

  const lessonMatch = duty.title.match(
  /Lesson\s*([1-7])/i,
);

  const lessonNumber = lessonMatch
    ? Number(lessonMatch[1])
    : null;

  if (!lessonNumber) {
    return [];
  }

  return (
    corridorCoverAvailability[weekday]?.[
      lessonNumber - 1
    ] ?? []
  );
}

export default function DutyTrackerPage() {
  const {
    user,
    isSRC,
    isLeadership,
    position,
  } = useAuth();

  const canViewAll =
    isSRC &&
    isLeadership &&
    [
      "head_boy",
      "head_girl",
      "assistant_head_boy",
      "assistant_head_girl",
    ].includes(position ?? "");

  const [selectedDate, setSelectedDate] =
    useState(getTodayString);

  const [duties, setDuties] = useState<Duty[]>(
    [],
  );

  const [summary, setSummary] =
    useState<DutyResponse["summary"]>();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [
    selectedCoverCandidates,
    setSelectedCoverCandidates,
  ] = useState<Record<string, string>>({});

  const [showAll, setShowAll] =
    useState(canViewAll);

  useEffect(() => {
    setShowAll(canViewAll);
  }, [canViewAll]);

  const loadDuties = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token =
        await user.getIdToken();

      const params = new URLSearchParams({
        resource: showAll ? "duty-overview" : "duties",
        date: selectedDate,
      });

      const response = await fetch(
        `${FUNCTION_URL}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to load duties.",
        );
      }

      const apiDuties: ApiDuty[] =
        Array.isArray(data?.duties)
          ? data.duties
          : [];
      setDuties(apiDuties.map(normalizeDuty));

      setSummary(data?.summary);
    } catch (loadError) {
      console.error(
        "Failed to load duties:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load duties.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showAll, user]);

  useEffect(() => {
    void loadDuties();
  }, [loadDuties]);

  const sortedDuties = useMemo(() => {
    return [...duties].sort((a, b) => {
      const timeA = a.start_time ?? "";
      const timeB = b.start_time ?? "";

      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }

      return a.location.localeCompare(
        b.location,
      );
    });
  }, [duties]);

  async function markCompleted(
    duty: Duty,
    completed: boolean,
  ) {
    if (!user) {
      return;
    }

    setActionId(duty.id);
    setError(null);

    try {
      const token =
        await user.getIdToken();

      const response = await fetch(
        `${FUNCTION_URL}?resource=duty-complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: duty.id,
            completed,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to update duty.",
        );
      }

      await loadDuties();
    } catch (actionError) {
      console.error(
        "Failed to update duty:",
        actionError,
      );

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Failed to update duty.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function submitCover(duty: Duty) {
    if (!user) {
      return;
    }

    const name =
      selectedCoverCandidates[duty.id]?.trim();

    if (!name) {
      setError(
        "Select the person covering the duty.",
      );
      return;
    }

    setActionId(duty.id);
    setError(null);

    try {
      const token =
        await user.getIdToken();

      const response = await fetch(
        `${FUNCTION_URL}?resource=duty-cover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: duty.id,
            covered_by: name,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to record cover.",
        );
      }

      setSelectedCoverCandidates(
        (current) => {
          const next = {
            ...current,
          };

          delete next[duty.id];

          return next;
        },
      );

      await loadDuties();
    } catch (actionError) {
      console.error(
        "Failed to record duty cover:",
        actionError,
      );

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Failed to record cover.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function clearCover(duty: Duty) {
    if (!user) {
      return;
    }

    setActionId(duty.id);
    setError(null);

    try {
      const token =
        await user.getIdToken();

      const response = await fetch(
        `${FUNCTION_URL}?resource=duty-clear-cover`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: duty.id,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to remove cover.",
        );
      }

      await loadDuties();
    } catch (actionError) {
      console.error(
        "Failed to remove duty cover:",
        actionError,
      );

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Failed to remove cover.",
      );
    } finally {
      setActionId(null);
    }
  }

  const completedCount =
    summary?.completed ?? 0;

  const coveredCount =
    summary?.covered ?? 0;

  const unaccountedCount =
    summary?.unaccounted ?? 0;

  const totalCount =
    summary?.total ?? duties.length;

  const pendingCount =
    summary?.pending ??
    duties.filter((duty) => duty.status === "pending").length;

  return (
    <main className="duty-tracker">
      <div className="duty-tracker__container">
        <header className="duty-tracker__hero">
          <div className="duty-tracker__hero-copy">
            <span className="duty-tracker__eyebrow">
              {isLeadership ? "Leadership workspace" : "SRC member workspace"}
              <span aria-hidden="true"> / </span>
              Daily coordination
            </span>
            <h1>Duty Tracker</h1>
            <p>
              Keep the day’s assignments clear, record covers, and update each
              duty as it happens.
            </p>
          </div>
          <NavLink className="duty-tracker__hero-link" to={isLeadership ? "/portal" : "/src/home"}>
            {isLeadership ? "Leadership portal" : "My SRC home"}
            <span aria-hidden="true">↗</span>
          </NavLink>
          <span className="duty-tracker__hero-orbit" aria-hidden="true" />
        </header>

        <section className="duty-tracker__date-panel" aria-label="Choose a duty date">
          <div className="duty-tracker__date-copy">
            <span className="duty-tracker__section-label">Viewing schedule</span>
            <strong>{formatDate(selectedDate)}</strong>
          </div>
          <div className="duty-tracker__date-actions">
            <button
              className="duty-tracker__secondary-button"
              type="button"
              onClick={() => setSelectedDate(getTodayString())}
              disabled={selectedDate === getTodayString()}
            >
              Today
            </button>
            <label className="duty-tracker__date-input">
              <span className="duty-tracker__visually-hidden">Choose a date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <button
              className="duty-tracker__secondary-button"
              type="button"
              onClick={() => void loadDuties()}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </section>

        <section className="duty-tracker__metrics" aria-label={`${formatDate(selectedDate)} duty summary`}>
          {[
            { label: "Total duties", value: totalCount, tone: "total" },
            { label: "Pending", value: pendingCount, tone: "pending" },
            { label: "Completed", value: completedCount, tone: "completed" },
            { label: "Covered", value: coveredCount, tone: "covered" },
            { label: "Unaccounted", value: unaccountedCount, tone: "unaccounted" },
          ].map((metric) => (
            <article className={`duty-tracker__metric duty-tracker__metric--${metric.tone}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="duty-tracker__list-heading" aria-labelledby="duty-list-title">
          <div>
            <span className="duty-tracker__section-label">Duty records</span>
            <h2 id="duty-list-title">{showAll ? "All duties" : "My duties"}</h2>
            <p>
              {showAll
                ? "Review the full schedule and update records as needed."
                : "These are the duties assigned to your account for this date."}
            </p>
          </div>
          {canViewAll && (
            <button
              className="duty-tracker__view-toggle"
              type="button"
              onClick={() => setShowAll((current) => !current)}
              aria-pressed={showAll}
            >
              {showAll ? "Show my duties" : "Show all duties"}
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </section>

        {error && (
          <div className="duty-tracker__error" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <section className="duty-tracker__list" aria-label="Duties for selected date" aria-busy={loading}>
          {loading ? (
            <div className="duty-tracker__empty" role="status">
              <span className="duty-tracker__loading-mark" aria-hidden="true">↻</span>
              <strong>Loading duties</strong>
              <span>Getting the latest schedule for this date.</span>
            </div>
          ) : sortedDuties.length === 0 ? (
            <div className="duty-tracker__empty">
              <span className="duty-tracker__empty-mark" aria-hidden="true">—</span>
              <strong>No duties scheduled</strong>
              <span>There are no duties recorded for {formatDate(selectedDate)}.</span>
            </div>
          ) : (
            sortedDuties.map((duty) => {
              const statusStyle = getStatusStyle(duty.status);
              const isActionRunning = actionId === duty.id;
              const coverCandidates = getCorridorCoverCandidates(selectedDate, duty);
              const isBoysCorridorDuty = duty.title
                .toLowerCase()
                .includes("boys corridor duty");
              const selectedCandidate = selectedCoverCandidates[duty.id] ?? "";

              return (
                <article className="duty-tracker__duty-card" key={duty.id} aria-busy={isActionRunning}>
                  <label
                    className={`duty-tracker__completion ${duty.status === "covered" ? "duty-tracker__completion--locked" : ""}`}
                    title={duty.status === "covered" ? "This duty has been covered." : "Mark duty as completed"}
                  >
                    <input
                      type="checkbox"
                      checked={duty.status === "completed"}
                      disabled={isActionRunning || duty.status === "covered"}
                      onChange={(event) => void markCompleted(duty, event.target.checked)}
                      aria-label={`${duty.status === "completed" ? "Mark incomplete" : "Mark complete"}: ${duty.title}`}
                    />
                    <span aria-hidden="true" />
                  </label>

                  <div className="duty-tracker__duty-content">
                    <div className="duty-tracker__duty-title-row">
                      <h3>{duty.title}</h3>
                      <span
                        className={`duty-tracker__status duty-tracker__status--${duty.status}`}
                        style={{
                          backgroundColor: statusStyle.background,
                          borderColor: statusStyle.border,
                          color: statusStyle.color,
                        }}
                      >
                        {getStatusLabel(duty.status)}
                      </span>
                    </div>

                    <div className="duty-tracker__metadata">
                      <span>
                        <small>Time</small>
                        <strong>
                          {formatTime(duty.start_time)}
                          {duty.end_time ? ` – ${formatTime(duty.end_time)}` : ""}
                        </strong>
                      </span>
                      <span>
                        <small>Location</small>
                        <strong>{duty.location}</strong>
                      </span>
                      <span>
                        <small>Assigned to</small>
                        <strong>{duty.assigned_name ?? duty.assigned_to}</strong>
                      </span>
                    </div>

                    {duty.notes && <p className="duty-tracker__notes">{duty.notes}</p>}

                    {canViewAll && duty.status === "covered" && duty.covered_by_name && (
                      <div className="duty-tracker__cover-record">
                        <span>
                          <small>Cover recorded</small>
                          <strong>{duty.covered_by_name}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => void clearCover(duty)}
                          disabled={isActionRunning}
                        >
                          {isActionRunning ? "Removing…" : "Remove cover"}
                        </button>
                      </div>
                    )}

                    {duty.status !== "completed" && duty.status !== "covered" && (
                      <div className="duty-tracker__cover-actions">
                        <label className="duty-tracker__cover-select">
                          <span className="duty-tracker__visually-hidden">Select a cover person for {duty.title}</span>
                          <select
                            value={selectedCandidate}
                            onChange={(event) =>
                              setSelectedCoverCandidates((current) => ({
                                ...current,
                                [duty.id]: event.target.value,
                              }))
                            }
                            disabled={isActionRunning || coverCandidates.length === 0}
                          >
                            <option value="">
                              {coverCandidates.length > 0
                                ? "Select cover person"
                                : isBoysCorridorDuty
                                  ? "Boys-only cover list not configured"
                                  : "No cover list available"}
                            </option>
                            {coverCandidates.map((candidate) => (
                              <option key={candidate} value={candidate}>{candidate}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          className="duty-tracker__record-cover"
                          type="button"
                          onClick={() => void submitCover(duty)}
                          disabled={isActionRunning || !selectedCandidate}
                        >
                          {isActionRunning ? "Saving…" : "Record cover"}
                        </button>
                        {isActionRunning && <span className="duty-tracker__saving" role="status">Saving this duty…</span>}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="duty-tracker__record-note">
          <span className="duty-tracker__record-note-mark" aria-hidden="true">i</span>
          <p>
            Completed duties record the assigned person’s completion. Covered
            duties keep the original assignment and record who covered it.
            Duties left incomplete after their scheduled time are marked
            unaccounted for review.
          </p>
        </aside>
      </div>
    </main>
  );
}
