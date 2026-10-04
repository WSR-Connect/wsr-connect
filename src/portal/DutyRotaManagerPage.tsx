import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";
import "./DutyRotaManagerPage.css";

const ROTAS_API =
  "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/runtime-test";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface DutyRota {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duty_name: string;
  location: string;
  assigned_to: string | null;
  assigned_name: string | null;
  active: boolean;
}

interface RotaDraft {
  day_of_week: string;
  start_time: string;
  end_time: string;
  duty_name: string;
  location: string;
  assigned_to: string;
  assigned_name: string;
}

const EMPTY_DRAFT: RotaDraft = {
  day_of_week: "1",
  start_time: "07:40",
  end_time: "08:35",
  duty_name: "",
  location: "",
  assigned_to: "",
  assigned_name: "",
};

function rotaToDraft(rota: DutyRota): RotaDraft {
  return {
    day_of_week: String(rota.day_of_week),
    start_time: rota.start_time.slice(0, 5),
    end_time: rota.end_time.slice(0, 5),
    duty_name: rota.duty_name,
    location: rota.location,
    assigned_to: rota.assigned_to ?? "",
    assigned_name: rota.assigned_name ?? "",
  };
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export default function DutyRotaManagerPage() {
  const { user } = useAuth();
  const [rotas, setRotas] = useState<DutyRota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRota, setEditingRota] = useState<DutyRota | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<RotaDraft>(EMPTY_DRAFT);
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const loadRotas = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${ROTAS_API}?resource=duty-rotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not load duty rotas.");
      }

      setRotas(Array.isArray(data?.rotas) ? data.rotas : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load duty rotas.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadRotas();
  }, [loadRotas]);

  const visibleRotas = useMemo(() => {
    return rotas.filter((rota) => {
      const matchesDay =
        dayFilter === "all" || rota.day_of_week === Number(dayFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && rota.active) ||
        (statusFilter === "paused" && !rota.active);
      return matchesDay && matchesStatus;
    });
  }, [dayFilter, rotas, statusFilter]);

  function startNewRota() {
    setEditingRota(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setSuccess(null);
    setFormOpen(true);
  }

  function startEditing(rota: DutyRota) {
    setEditingRota(rota);
    setDraft(rotaToDraft(rota));
    setError(null);
    setSuccess(null);
    setFormOpen(true);
  }

  async function saveRota(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${ROTAS_API}?resource=duty-rotas`, {
        method: editingRota ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingRota ? { id: editingRota.id } : {}),
          day_of_week: Number(draft.day_of_week),
          start_time: draft.start_time,
          end_time: draft.end_time,
          duty_name: draft.duty_name,
          location: draft.location,
          assigned_to: draft.assigned_to.trim() || null,
          assigned_name: draft.assigned_name.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save this rota.");
      }

      setSuccess(
        editingRota
          ? "Rota updated. Future pending duties were refreshed."
          : "Rota added to the weekly schedule.",
      );
      setFormOpen(false);
      setEditingRota(null);
      setDraft(EMPTY_DRAFT);
      await loadRotas();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this rota.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rota: DutyRota) {
    if (!user) return;

    const nextActive = !rota.active;
    if (
      !nextActive &&
      !window.confirm(
        `Pause “${rota.duty_name}” on ${DAYS[rota.day_of_week]}? Pending duties will no longer appear for upcoming dates.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${ROTAS_API}?resource=duty-rotas`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: rota.id, active: nextActive }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not update this rota.");
      }

      setSuccess(nextActive ? "Rota resumed." : "Rota paused.");
      await loadRotas();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Could not update this rota.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="rota-manager">
      <div className="rota-manager__container">
        <header className="rota-manager__hero">
          <div>
            <span className="rota-manager__eyebrow">Leadership workspace · duties</span>
            <h1>Rota Manager</h1>
            <p>Maintain the recurring weekly duties and link each assignment to its SRC member.</p>
          </div>
          <NavLink to="/portal/duties">Open duty tracker <span aria-hidden="true">↗</span></NavLink>
        </header>

        {(error || success) && (
          <div
            className={`rota-manager__notice ${error ? "rota-manager__notice--error" : "rota-manager__notice--success"}`}
            role={error ? "alert" : "status"}
          >
            <span>{error ?? success}</span>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccess(null);
              }}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="rota-manager__toolbar" aria-label="Rota filters and actions">
          <label>
            <span>Day</span>
            <select value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
              <option value="all">All days</option>
              {DAYS.map((day, index) => (
                <option key={day} value={index}>{day}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Show</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="active">Active rotas</option>
              <option value="paused">Paused rotas</option>
              <option value="all">All rotas</option>
            </select>
          </label>

          <button type="button" className="rota-manager__secondary-button" onClick={() => void loadRotas()} disabled={loading || saving}>
            Refresh
          </button>
          <button type="button" className="rota-manager__primary-button" onClick={startNewRota}>
            <span aria-hidden="true">+</span> Add duty
          </button>
        </section>

        {formOpen && (
          <section className="rota-manager__form-panel" aria-labelledby="rota-form-title">
            <div className="rota-manager__form-heading">
              <div>
                <span className="rota-manager__section-label">Weekly assignment</span>
                <h2 id="rota-form-title">{editingRota ? "Edit duty" : "Add a duty"}</h2>
              </div>
              <button
                type="button"
                className="rota-manager__close-button"
                onClick={() => setFormOpen(false)}
                aria-label="Close duty form"
              >
                ×
              </button>
            </div>

            <form className="rota-manager__form" onSubmit={saveRota}>
              <label>
                <span>Day of week</span>
                <select
                  value={draft.day_of_week}
                  onChange={(event) => setDraft({ ...draft, day_of_week: event.target.value })}
                  disabled={Boolean(editingRota)}
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
                {editingRota && <small>To move a duty to another day, pause this rota and add a new one. This keeps past records attached to the right weekday.</small>}
              </label>

              <label>
                <span>Duty name</span>
                <input
                  value={draft.duty_name}
                  onChange={(event) => setDraft({ ...draft, duty_name: event.target.value })}
                  maxLength={160}
                  required
                  placeholder="e.g. Corridor duty — Lesson 1"
                />
              </label>

              <label>
                <span>Location</span>
                <input
                  value={draft.location}
                  onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                  maxLength={120}
                  required
                  placeholder="e.g. New Building Corridor"
                />
              </label>

              <label>
                <span>Start time</span>
                <input
                  type="time"
                  value={draft.start_time}
                  onChange={(event) => setDraft({ ...draft, start_time: event.target.value })}
                  required
                />
              </label>

              <label>
                <span>End time</span>
                <input
                  type="time"
                  value={draft.end_time}
                  onChange={(event) => setDraft({ ...draft, end_time: event.target.value })}
                  required
                />
              </label>

              <label>
                <span>Assigned SRC member</span>
                <input
                  value={draft.assigned_name}
                  onChange={(event) => setDraft({ ...draft, assigned_name: event.target.value })}
                  maxLength={120}
                  placeholder="Name shown in the duty tracker"
                />
              </label>

              <label className="rota-manager__uid-field">
                <span>Firebase UID <small>optional until their account is ready</small></span>
                <input
                  value={draft.assigned_to}
                  onChange={(event) => setDraft({ ...draft, assigned_to: event.target.value })}
                  maxLength={128}
                  placeholder="Paste the member's Firebase UID"
                />
                <small>Linking the UID makes this duty appear in that member’s “My duties” view.</small>
              </label>

              <div className="rota-manager__form-actions">
                <button type="button" className="rota-manager__secondary-button" onClick={() => setFormOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="rota-manager__primary-button" disabled={saving}>
                  {saving ? "Saving…" : editingRota ? "Save changes" : "Add duty"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rota-manager__list-section" aria-labelledby="rota-list-title">
          <div className="rota-manager__list-heading">
            <div>
              <span className="rota-manager__section-label">Weekly schedule</span>
              <h2 id="rota-list-title">{visibleRotas.length} {visibleRotas.length === 1 ? "rota" : "rotas"}</h2>
            </div>
            <p>Pausing a rota hides its upcoming pending duties. Completed records stay in the history.</p>
          </div>

          {loading ? (
            <div className="rota-manager__empty" role="status">Loading rotas…</div>
          ) : visibleRotas.length === 0 ? (
            <div className="rota-manager__empty">
              <strong>No rotas match these filters.</strong>
              <span>Try another day or add a recurring duty.</span>
            </div>
          ) : (
            <div className="rota-manager__list">
              {visibleRotas.map((rota) => (
                <article className={`rota-manager__rota ${rota.active ? "" : "rota-manager__rota--paused"}`} key={rota.id}>
                  <div className="rota-manager__rota-time">
                    <strong>{formatTime(rota.start_time)}</strong>
                    <span>to {formatTime(rota.end_time)}</span>
                  </div>
                  <div className="rota-manager__rota-main">
                    <div className="rota-manager__rota-title-row">
                      <h3>{rota.duty_name}</h3>
                      <span className={`rota-manager__badge ${rota.active ? "rota-manager__badge--active" : "rota-manager__badge--paused"}`}>
                        {rota.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p>{DAYS[rota.day_of_week]} · {rota.location}</p>
                    <div className="rota-manager__assignee">
                      <strong>{rota.assigned_name || "No display name assigned"}</strong>
                      <span>{rota.assigned_to ? "Account linked" : "Account not linked"}</span>
                    </div>
                  </div>
                  <div className="rota-manager__rota-actions">
                    <button type="button" className="rota-manager__secondary-button" onClick={() => startEditing(rota)} disabled={saving}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={rota.active ? "rota-manager__pause-button" : "rota-manager__resume-button"}
                      onClick={() => void toggleActive(rota)}
                      disabled={saving}
                    >
                      {rota.active ? "Pause" : "Resume"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
