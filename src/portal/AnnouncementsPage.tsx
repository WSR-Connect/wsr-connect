import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

const ANNOUNCEMENTS_API =
  "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/runtime-test";

interface Announcement {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
  pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AnnouncementsResponse {
  ok: boolean;
  resource: "announcements";
  announcements: Announcement[];
  authorized?: boolean;
  error?: string;
}

interface AnnouncementResponse {
  ok: boolean;
  resource: "announcements";
  announcement?: Announcement;
  error?: string;
}

interface AnnouncementForm {
  title: string;
  content: string;
  status: "draft" | "published";
  visibility: "public" | "private";
  pinned: boolean;
}

const initialForm: AnnouncementForm = {
  title: "",
  content: "",
  status: "draft",
  visibility: "public",
  pinned: false,
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementsPage() {
  const {
    user,
    isLeadership,
    loading: authLoading,
  } = useAuth();

  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<AnnouncementForm>(
      initialForm,
    );

  const getAuthorizationHeader =
    useCallback(async () => {
      if (!user) {
        throw new Error(
          "You must be signed in.",
        );
      }

      const token =
        await user.getIdToken();

      if (!token) {
        throw new Error(
          "Could not obtain a Firebase authentication token.",
        );
      }

      return {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "application/json",
      };
    }, [user]);

  const loadAnnouncements =
    useCallback(async () => {
      if (!user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers =
          await getAuthorizationHeader();

        const response = await fetch(
          `${ANNOUNCEMENTS_API}?resource=announcements`,
          {
            method: "GET",
            headers,
          },
        );

        const data =
          (await response.json()) as AnnouncementsResponse;

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Failed to load announcements.",
          );
        }

        if (!data.ok) {
          throw new Error(
            data.error ??
              "The announcements request failed.",
          );
        }

        if (
          data.authorized === false
        ) {
          throw new Error(
            "Leadership authorization required.",
          );
        }

        setAnnouncements(
          data.announcements ?? [],
        );
      } catch (requestError) {
        console.error(
          "Failed to load announcements:",
          requestError,
        );

        setAnnouncements([]);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Announcements could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      getAuthorizationHeader,
      user,
    ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !isLeadership
    ) {
      return;
    }

    void loadAnnouncements();
  }, [
    authLoading,
    user,
    isLeadership,
    loadAnnouncements,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const headers =
        await getAuthorizationHeader();

      const response = await fetch(
        `${ANNOUNCEMENTS_API}?resource=announcements`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            status: form.status,
            visibility:
              form.visibility,
            pinned: form.pinned,
          }),
        },
      );

      const data =
        (await response.json()) as AnnouncementResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to create announcement.",
        );
      }

      if (!data.ok) {
        throw new Error(
          data.error ??
            "The announcement could not be created.",
        );
      }

      setForm(initialForm);

      setSuccess(
        "Announcement created successfully.",
      );

      await loadAnnouncements();
    } catch (requestError) {
      console.error(
        "Failed to create announcement:",
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Announcement could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main
        style={{
          padding: "48px 20px",
          background: "#F7F8F9",
          minHeight: "70vh",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          Loading leadership access...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        style={{
          padding: "48px 20px",
          background: "#F7F8F9",
          minHeight: "70vh",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          You must be signed in to access
          announcements management.
        </div>
      </main>
    );
  }

  if (!isLeadership) {
    return (
      <main
        style={{
          padding: "48px 20px",
          background: "#F7F8F9",
          minHeight: "70vh",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          Leadership authorization is
          required to manage announcements.
        </div>
      </main>
    );
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
          <span
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.75,
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
            Announcements
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "650px",
              color: "#FFFFFF",
              opacity: 0.85,
              lineHeight: 1.6,
            }}
          >
            Create and review official WSR
            Connect announcements from the
            leadership portal.
          </p>
        </section>

        <section
          style={{
            marginTop: "24px",
            padding: "28px",
            border: "1px solid #D9DDE1",
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              marginBottom: "22px",
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
              Create
            </span>

            <h2
              style={{
                margin: 0,
                fontSize: "26px",
              }}
            >
              New announcement
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <label
              style={{
                display: "grid",
                gap: "7px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Title
              </span>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title:
                      event.target.value,
                  }))
                }
                placeholder="Announcement title"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  border:
                    "1px solid #C9CDD2",
                  background: "#FFFFFF",
                  color: "#111111",
                  font: "inherit",
                }}
              />
            </label>

            <label
              style={{
                display: "grid",
                gap: "7px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Content
              </span>

              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content:
                      event.target.value,
                  }))
                }
                placeholder="Write the announcement..."
                required
                rows={7}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  border:
                    "1px solid #C9CDD2",
                  background: "#FFFFFF",
                  color: "#111111",
                  font: "inherit",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <label
                style={{
                  display: "grid",
                  gap: "7px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status:
                        event.target.value as
                          | "draft"
                          | "published",
                    }))
                  }
                  style={{
                    padding:
                      "12px 14px",
                    border:
                      "1px solid #C9CDD2",
                    background: "#FFFFFF",
                    color: "#111111",
                    font: "inherit",
                  }}
                >
                  <option value="draft">
                    Draft
                  </option>
                  <option value="published">
                    Published
                  </option>
                </select>
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "7px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Visibility
                </span>

                <select
                  value={form.visibility}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      visibility:
                        event.target.value as
                          | "public"
                          | "private",
                    }))
                  }
                  style={{
                    padding:
                      "12px 14px",
                    border:
                      "1px solid #C9CDD2",
                    background: "#FFFFFF",
                    color: "#111111",
                    font: "inherit",
                  }}
                >
                  <option value="public">
                    Public
                  </option>
                  <option value="private">
                    Private
                  </option>
                </select>
              </label>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pinned:
                      event.target.checked,
                  }))
                }
              />

              Pin this announcement
            </label>

            {error && (
              <div
                style={{
                  padding: "12px 14px",
                  border:
                    "1px solid #E0B4B4",
                  background: "#FFF6F6",
                  color: "#8A2020",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: "12px 14px",
                  border:
                    "1px solid #B9D6C2",
                  background: "#F3FAF5",
                  color: "#245C35",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                justifySelf: "start",
                padding: "12px 18px",
                border: "none",
                background: "#123B6D",
                color: "#FFFFFF",
                font: "inherit",
                fontWeight: 700,
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
                opacity: submitting
                  ? 0.65
                  : 1,
              }}
            >
              {submitting
                ? "Creating..."
                : "Create announcement"}
            </button>
          </form>
        </section>

        <section
          style={{
            marginTop: "32px",
          }}
        >
          <div
            style={{
              marginBottom: "18px",
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
              Content
            </span>

            <h2
              style={{
                margin: 0,
                fontSize: "28px",
              }}
            >
              Existing announcements
            </h2>
          </div>

          {loading ? (
            <article
              style={{
                padding: "24px",
                border:
                  "1px solid #D9DDE1",
                background: "#FFFFFF",
              }}
            >
              Loading announcements...
            </article>
          ) : announcements.length === 0 ? (
            <article
              style={{
                padding: "24px",
                border:
                  "1px solid #D9DDE1",
                background: "#FFFFFF",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px",
                }}
              >
                No announcements yet
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#73777C",
                  lineHeight: 1.6,
                }}
              >
                Create the first announcement
                using the form above.
              </p>
            </article>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {announcements.map(
                (announcement) => (
                  <article
                    key={announcement.id}
                    style={{
                      padding: "24px",
                      border:
                        "1px solid #D9DDE1",
                      background: "#FFFFFF",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            marginBottom: "7px",
                            color: "#1E5AA8",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing:
                              "0.08em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {
                            announcement.status
                          }{" "}
                          ·{" "}
                          {
                            announcement.visibility
                          }
                        </span>

                        <h3
                          style={{
                            margin: 0,
                            fontSize: "22px",
                          }}
                        >
                          {
                            announcement.title
                          }
                        </h3>
                      </div>

                      {announcement.pinned && (
                        <span
                          style={{
                            padding:
                              "5px 9px",
                            border:
                              "1px solid #D9DDE1",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          Pinned
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        margin:
                          "16px 0 14px",
                        color: "#3F4348",
                        lineHeight: 1.7,
                        whiteSpace:
                          "pre-wrap",
                      }}
                    >
                      {
                        announcement.content
                      }
                    </p>

                    <small
                      style={{
                        color: "#73777C",
                      }}
                    >
                      Created{" "}
                      {formatDate(
                        announcement.created_at,
                      )}
                    </small>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}