import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";
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

  if (!isCorridorDuty) {
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

  return (
    <main
      style={{
        minHeight: "70vh",
        background: "#F7F8F9",
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
            background: "#123B6D",
            color: "#FFFFFF",
            padding: "34px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: "24px",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  marginBottom: "9px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform:
                    "uppercase",
                  opacity: 0.72,
                }}
              >
                {isLeadership
                  ? "Leadership workspace"
                  : "SRC member workspace"}
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
                Duty Tracker
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: "650px",
                  lineHeight: 1.6,
                  opacity: 0.85,
                }}
              >
                Record every duty, every
                location, every completion
                and every cover.
              </p>
            </div>

            <NavLink
              to="/portal"
              style={{
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              ← Portal
            </NavLink>
          </div>
        </section>

        <section
          style={{
            marginTop: "18px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            padding: "18px 20px",
            border:
              "1px solid #D9DDE1",
            background: "#FFFFFF",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                marginBottom: "5px",
                color: "#73777C",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform:
                  "uppercase",
              }}
            >
              Duty date
            </span>

            <strong
              style={{
                fontSize: "18px",
              }}
            >
              {formatDate(selectedDate)}
            </strong>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(
                event.target.value,
              )
            }
            style={{
              padding: "10px 12px",
              border:
                "1px solid #C9CDD1",
              background: "#FFFFFF",
              color: "#111111",
              font: "inherit",
            }}
          />
        </section>

        <section
          style={{
            marginTop: "16px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          {[
            [
              "Total duties",
              totalCount,
            ],
            [
              "Completed",
              completedCount,
            ],
            [
              "Covered",
              coveredCount,
            ],
            [
              "Unaccounted",
              unaccountedCount,
            ],
          ].map(([label, value]) => (
            <article
              key={label}
              style={{
                padding: "18px",
                border:
                  "1px solid #D9DDE1",
                background: "#FFFFFF",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#73777C",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform:
                    "uppercase",
                }}
              >
                {label}
              </span>

              <strong
                style={{
                  fontSize: "28px",
                }}
              >
                {value}
              </strong>
            </article>
          ))}
        </section>

        <section
          style={{
            marginTop: "24px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                color: "#1E5AA8",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform:
                  "uppercase",
              }}
            >
              Coverage log
            </span>

            <h2
              style={{
                margin: "5px 0 0",
                fontSize: "28px",
              }}
            >
              {showAll
                ? "All duties"
                : "My duties"}
            </h2>
          </div>

          {canViewAll && (
            <button
              type="button"
              onClick={() =>
                setShowAll(
                  (current) => !current,
                )
              }
              style={{
                padding: "10px 14px",
                border:
                  "1px solid #D9DDE1",
                background: "#FFFFFF",
                color: "#333333",
                font: "inherit",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showAll
                ? "Show my duties"
                : "Show all duties"}
            </button>
          )}
        </section>

        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "14px 16px",
              border:
                "1px solid #E5BABA",
              background: "#FCECEC",
              color: "#8D2929",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            marginTop: "16px",
            display: "grid",
            gap: "12px",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "36px",
                border:
                  "1px solid #D9DDE1",
                background: "#FFFFFF",
                color: "#73777C",
                textAlign: "center",
              }}
            >
              Loading duties...
            </div>
          ) : sortedDuties.length === 0 ? (
            <div
              style={{
                padding: "36px",
                border:
                  "1px solid #D9DDE1",
                background: "#FFFFFF",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px",
                }}
              >
                No duties scheduled
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#73777C",
                }}
              >
                There are no duties recorded
                for this date.
              </p>
            </div>
          ) : (
            sortedDuties.map((duty) => {
              const statusStyle =
                getStatusStyle(
                  duty.status,
                );

              const isActionRunning =
                actionId === duty.id;

              const coverCandidates =
                getCorridorCoverCandidates(
                  selectedDate,
                  duty,
                );

              const selectedCandidate =
                selectedCoverCandidates[
                  duty.id
                ] ?? "";

              return (
                <article
                  key={duty.id}
                  style={{
                    border:
                      "1px solid #D9DDE1",
                    background: "#FFFFFF",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "auto 1fr auto",
                      gap: "18px",
                      alignItems: "start",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        width: "42px",
                        height: "42px",
                        border:
                          "1px solid #D9DDE1",
                        cursor:
                          duty.status ===
                          "covered"
                            ? "not-allowed"
                            : "pointer",
                      }}
                      title={
                        duty.status ===
                        "covered"
                          ? "This duty has been covered."
                          : "Mark duty as completed"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          duty.status ===
                          "completed"
                        }
                        disabled={
                          isActionRunning ||
                          duty.status ===
                            "covered"
                        }
                        onChange={(event) =>
                          void markCompleted(
                            duty,
                            event.target
                              .checked,
                          )
                        }
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor:
                            "pointer",
                        }}
                      />
                    </label>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "20px",
                          }}
                        >
                          {duty.title}
                        </h3>

                        <span
                          style={{
                            padding:
                              "5px 9px",
                            border: `1px solid ${statusStyle.border}`,
                            background:
                              statusStyle.background,
                            color:
                              statusStyle.color,
                            fontSize:
                              "11px",
                            fontWeight: 700,
                            letterSpacing:
                              "0.04em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {getStatusLabel(
                            duty.status,
                          )}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "18px",
                          flexWrap: "wrap",
                          marginTop: "10px",
                          color: "#555A60",
                          fontSize: "14px",
                        }}
                      >
                        <span>
                          <strong>
                            Time:
                          </strong>{" "}
                          {formatTime(
                            duty.start_time,
                          )}
                          {duty.end_time
                            ? ` – ${formatTime(
                                duty.end_time,
                              )}`
                            : ""}
                        </span>

                        <span>
                          <strong>
                            Location:
                          </strong>{" "}
                          {duty.location}
                        </span>

                        <span>
                          <strong>
                            Assigned:
                          </strong>{" "}
                          {duty.assigned_name ??
                            duty.assigned_to}
                        </span>
                      </div>

                      {duty.notes && (
                        <p
                          style={{
                            margin:
                              "10px 0 0",
                            color:
                              "#73777C",
                            fontSize:
                              "14px",
                          }}
                        >
                          {duty.notes}
                        </p>
                      )}

                      {canViewAll &&
                        duty.status ===
                        "covered" &&
                        duty.covered_by_name && (
                          <div
                            style={{
                              marginTop:
                                "14px",
                              padding:
                                "12px 14px",
                              border:
                                "1px solid #C8D7E9",
                              background:
                                "#EEF3FA",
                              color:
                                "#24558D",
                              fontSize:
                                "14px",
                            }}
                          >
                            <strong>
                              Covered by:
                            </strong>{" "}
                            {
                              duty.covered_by_name
                            }

                            <button
                              type="button"
                              onClick={() =>
                                void clearCover(
                                  duty,
                                )
                              }
                              disabled={
                                isActionRunning
                              }
                              style={{
                                marginLeft:
                                  "12px",
                                border: 0,
                                background:
                                  "transparent",
                                color:
                                  "#24558D",
                                font:
                                  "inherit",
                                fontWeight:
                                  700,
                                textDecoration:
                                  "underline",
                                cursor:
                                  "pointer",
                              }}
                            >
                              Remove cover
                            </button>
                          </div>
                        )}

                      {duty.status !==
                        "completed" &&
                        duty.status !==
                          "covered" && (
                          <div
                            style={{
                              marginTop:
                                "14px",
                              display: "flex",
                              gap: "8px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <select
                              value={
                                selectedCandidate
                              }
                              onChange={(event) =>
                                setSelectedCoverCandidates(
                                  (current) => ({
                                    ...current,
                                    [duty.id]:
                                      event.target
                                        .value,
                                  }),
                                )
                              }
                              disabled={
                                isActionRunning ||
                                coverCandidates.length ===
                                  0
                              }
                              style={{
                                flex:
                                  "1 1 240px",
                                minWidth:
                                  "220px",
                                padding:
                                  "10px 12px",
                                border:
                                  "1px solid #C9CDD1",
                                background:
                                  "#FFFFFF",
                                color:
                                  "#111111",
                                font:
                                  "inherit",
                              }}
                            >
                              <option value="">
                                {coverCandidates.length >
                                0
                                  ? "Select cover person"
                                  : "No cover list available"}
                              </option>

                              {coverCandidates.map(
                                (
                                  candidate,
                                ) => (
                                  <option
                                    key={
                                      candidate
                                    }
                                    value={
                                      candidate
                                    }
                                  >
                                    {candidate}
                                  </option>
                                ),
                              )}
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                void submitCover(
                                  duty,
                                )
                              }
                              disabled={
                                isActionRunning ||
                                !selectedCandidate
                              }
                              style={{
                                padding:
                                  "10px 14px",
                                border:
                                  "1px solid #123B6D",
                                background:
                                  "#123B6D",
                                color:
                                  "#FFFFFF",
                                font:
                                  "inherit",
                                fontWeight:
                                  700,
                                cursor:
                                  isActionRunning ||
                                  !selectedCandidate
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  isActionRunning ||
                                  !selectedCandidate
                                    ? 0.55
                                    : 1,
                              }}
                            >
                              Record cover
                            </button>

                            <span
                              style={{
                                color:
                                  "#A0A4A8",
                                fontSize:
                                  "12px",
                                alignSelf:
                                  "center",
                              }}
                            >
                              {isActionRunning
                                ? "Saving..."
                                : ""}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section
          style={{
            marginTop: "32px",
            paddingTop: "22px",
            borderTop:
              "1px solid #D9DDE1",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#73777C",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            Every duty remains on the record.
            A completed duty records the assigned
            person's completion. A covered duty
            preserves the original assignment and
            records the person who covered it.
            Duties that remain incomplete after
            their scheduled time are flagged as
            unaccounted.
          </p>
        </section>
      </div>
    </main>
  );
}
