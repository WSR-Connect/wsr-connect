import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
} from "npm:jose";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, POST, PATCH, DELETE, OPTIONS",
};

const FIREBASE_PROJECT_ID = "wsr-connect-c0541";
const FIREBASE_SERVICE_ACCOUNT_SECRET =
  "FIREBASE_SERVICE_ACCOUNT_JSON";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL")!;

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const firebaseJwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

const SCHOOL_TIME_ZONE = "Asia/Dubai";

const allowedPositions = new Set([
  "head_boy",
  "head_girl",
  "assistant_head_boy",
  "assistant_head_girl",
]);

const allowedCategories = new Set([
  "school",
  "src",
  "event",
  "meeting",
  "deadline",
  "academic",
  "other",
]);

const allowedVisibility = new Set([
  "private",
  "public",
]);

const allowedAnnouncementStatuses = [
  "draft",
  "published",
  "archived",
] as const;

const allowedAnnouncementVisibility = [
  "private",
  "public",
] as const;

interface LeadershipUser {
  role: string | null;
  accessLevel: string | null;
  position: string | null;
}

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
  created_at: string;
  updated_at: string;
}

interface DutyRotaInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  duty_name: string;
  location: string;
  assigned_to: string | null;
  assigned_name: string | null;
}

interface DailyDuty {
  id: string;
  rota_id: string;
  duty_date: string;
  start_time: string;
  end_time: string;
  duty_name: string;
  location: string;
  assigned_to: string | null;
  assigned_name: string | null;
  status:
    | "pending"
    | "completed"
    | "covered"
    | "unaccounted";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DutyCover {
  id: string;
  daily_duty_id: string;
  original_assignee: string;
  covered_by: string;
  recorded_at: string;
}

async function verifyFirebaseToken(
  token: string,
) {
  const issuer =
    "https://securetoken.google.com/" +
    FIREBASE_PROJECT_ID;

  const result = await jwtVerify(
    token,
    firebaseJwks,
    {
      issuer,
      audience: FIREBASE_PROJECT_ID,
    },
  );

  if (!result.payload.sub) {
    throw new Error(
      "Firebase token has no subject.",
    );
  }

  return result.payload;
}

function parseServiceAccount() {
  const rawSecret = Deno.env.get(
    FIREBASE_SERVICE_ACCOUNT_SECRET,
  );

  if (!rawSecret) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON secret is missing.",
    );
  }

  const serviceAccount =
    JSON.parse(rawSecret);

  if (
    typeof serviceAccount.project_id !==
      "string" ||
    typeof serviceAccount.client_email !==
      "string" ||
    typeof serviceAccount.private_key !==
      "string"
  ) {
    throw new Error(
      "Firebase service account secret is missing required fields.",
    );
  }

  return serviceAccount;
}

async function getGoogleAccessToken() {
  const serviceAccount =
    parseServiceAccount();

  const privateKey = await importPKCS8(
    serviceAccount.private_key,
    "RS256",
  );

  const now = Math.floor(
    Date.now() / 1000,
  );

  const assertion = await new SignJWT({
    scope:
      "https://www.googleapis.com/auth/datastore",
  })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
    })
    .setIssuer(
      serviceAccount.client_email,
    )
    .setSubject(
      serviceAccount.client_email,
    )
    .setAudience(
      "https://oauth2.googleapis.com/token",
    )
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type:
          "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Google OAuth token request failed: ${errorText}`,
    );
  }

  const data = await response.json();

  if (
    typeof data.access_token !==
    "string"
  ) {
    throw new Error(
      "Google OAuth response did not contain an access token.",
    );
  }

  return data.access_token;
}

async function getFirestoreUser(
  uid: string,
): Promise<LeadershipUser | null> {
  const accessToken =
    await getGoogleAccessToken();

  const firestoreUrl =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;

  const response = await fetch(
    firestoreUrl,
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Firestore request failed: ${errorText}`,
    );
  }

  const document =
    await response.json();

  const fields =
    document.fields ?? {};

  return {
    role:
      fields.role?.stringValue ??
      null,

    accessLevel:
      fields.accessLevel?.stringValue ??
      null,

    position:
      fields.position?.stringValue ??
      null,
  };
}

async function requireLeadership(
  token: string,
) {
  const claims =
    await verifyFirebaseToken(token);

  const uid = claims.sub;

  if (!uid) {
    throw new Error(
      "Firebase token has no UID.",
    );
  }

  const user =
    await getFirestoreUser(uid);

  if (!user) {
    return {
      authorized: false,
      uid,
      user: null,
    };
  }

  const authorized =
    user.role === "src" &&
    user.accessLevel === "leadership" &&
    allowedPositions.has(
      user.position ?? "",
    );

  return {
    authorized,
    uid,
    user,
  };
}

async function requireSRC(
  token: string,
) {
  const claims =
    await verifyFirebaseToken(token);

  const uid = claims.sub;

  if (!uid) {
    throw new Error(
      "Firebase token has no UID.",
    );
  }

  const user =
    await getFirestoreUser(uid);

  if (!user) {
    return {
      authorized: false,
      uid,
      user: null,
      isLeadership: false,
    };
  }

  const isSRC =
    user.role === "src";

  const isLeadership =
    isSRC &&
    user.accessLevel === "leadership" &&
    allowedPositions.has(
      user.position ?? "",
    );

  return {
    authorized: isSRC,
    uid,
    user,
    isLeadership,
  };
}

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function isValidUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidDateString(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  return (
    !Number.isNaN(
      date.getTime(),
    ) &&
    date.toISOString().slice(0, 10) ===
      value
  );
}

function isValidTimeString(
  value: string,
) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(
    value,
  );
}

function normalizeTime(
  value: string,
) {
  return value.length === 5
    ? `${value}:00`
    : value;
}

function parseDutyRotaInput(
  input: Record<string, unknown>,
): { value?: DutyRotaInput; error?: string } {
  const dayOfWeek = input.day_of_week;

  if (
    typeof dayOfWeek !== "number" ||
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    return { error: "Choose a valid day of the week." };
  }

  const startTime = input.start_time;
  const endTime = input.end_time;

  if (
    typeof startTime !== "string" ||
    typeof endTime !== "string" ||
    !isValidTimeString(startTime) ||
    !isValidTimeString(endTime)
  ) {
    return { error: "Enter valid start and end times." };
  }

  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);
  const toMinutes = (value: string) => {
    const [hours, minutes, seconds = 0] = value
      .split(":")
      .map(Number);

    if (
      hours > 23 ||
      minutes > 59 ||
      seconds > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  };
  const startMinutes = toMinutes(normalizedStart);
  const endMinutes = toMinutes(normalizedEnd);

  if (startMinutes === null || endMinutes === null) {
    return { error: "Times must be valid 24-hour times." };
  }

  if (startMinutes >= endMinutes) {
    return { error: "The end time must be after the start time." };
  }

  const readRequiredText = (
    key: "duty_name" | "location",
    label: string,
    maxLength: number,
  ): { value: string | null; error: string | null } => {
    const value = input[key];
    if (typeof value !== "string" || !value.trim()) {
      return { value: null, error: `${label} is required.` };
    }

    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      return {
        value: null,
        error: `${label} must be ${maxLength} characters or fewer.`,
      };
    }

    return { value: trimmed, error: null };
  };

  const dutyName = readRequiredText("duty_name", "Duty name", 160);
  if (dutyName.error) {
    return { error: dutyName.error };
  }

  const location = readRequiredText("location", "Location", 120);
  if (location.error) {
    return { error: location.error };
  }

  const readOptionalText = (
    key: "assigned_to" | "assigned_name",
    label: string,
    maxLength: number,
  ): { value: string | null; error: string | null } => {
    const value = input[key];
    if (value === undefined || value === null) {
      return { value: null, error: null };
    }

    if (typeof value !== "string") {
      return { value: null, error: `${label} must be text.` };
    }

    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      return {
        value: null,
        error: `${label} must be ${maxLength} characters or fewer.`,
      };
    }

    return { value: trimmed || null, error: null };
  };

  const assignedTo = readOptionalText("assigned_to", "Firebase UID", 128);
  if (assignedTo.error) {
    return { error: assignedTo.error };
  }

  const assignedName = readOptionalText("assigned_name", "Assignee name", 120);
  if (assignedName.error) {
    return { error: assignedName.error };
  }

  return {
    value: {
      day_of_week: dayOfWeek,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      duty_name: dutyName.value!,
      location: location.value!,
      assigned_to: assignedTo.value,
      assigned_name: assignedName.value,
    },
  };
}

function getDayOfWeek(
  dateString: string,
) {
  return new Date(
    `${dateString}T00:00:00.000Z`,
  ).getUTCDay();
}

function getSchoolDateTimeParts() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: SCHOOL_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const values: Record<
    string,
    string
  > = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
  };
}

function dutyHasEnded(
  duty: Pick<
    DailyDuty,
    "duty_date" | "end_time"
  >,
) {
  const now =
    getSchoolDateTimeParts();

  if (
    duty.duty_date <
    now.date
  ) {
    return true;
  }

  if (
    duty.duty_date >
    now.date
  ) {
    return false;
  }

  return (
    normalizeTime(duty.end_time) <=
    now.time
  );
}

async function markExpiredDutiesUnaccounted(
  duties: DailyDuty[],
) {
  const pendingExpired =
    duties.filter(
      (duty) =>
        duty.status === "pending" &&
        dutyHasEnded(duty),
    );

  if (
    pendingExpired.length === 0
  ) {
    return duties;
  }

  const expiredIds =
    pendingExpired.map(
      (duty) => duty.id,
    );

  const {
    error: updateError,
  } = await supabase
    .from("daily_duties")
    .update({
      status: "unaccounted",
      updated_at:
        new Date().toISOString(),
    })
    .in("id", expiredIds);

  if (updateError) {
    throw new Error(
      `Failed to update expired duties: ${updateError.message}`,
    );
  }

  return duties.map((duty) =>
    expiredIds.includes(duty.id)
      ? {
          ...duty,
          status: "unaccounted",
        }
      : duty,
  );
}

async function ensureDailyDuties(
  date: string,
) {
  const dayOfWeek =
    getDayOfWeek(date);

  const {
    data: rotas,
    error: rotaError,
  } = await supabase
    .from("duty_rotas")
    .select("*")
    .eq(
      "day_of_week",
      dayOfWeek,
    )
    .order("start_time", {
      ascending: true,
    });

  if (rotaError) {
    throw new Error(
      `Failed to load duty rota: ${rotaError.message}`,
    );
  }

  const typedRotas =
    (rotas ?? []) as DutyRota[];

  if (
    typedRotas.length === 0
  ) {
    return [];
  }

  const rotaIds =
    typedRotas.map(
      (rota) => rota.id,
    );

  const activeRotaIds = new Set(
    typedRotas
      .filter((rota) => rota.active)
      .map((rota) => rota.id),
  );

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("daily_duties")
    .select("*")
    .eq("duty_date", date)
    .in("rota_id", rotaIds);

  if (existingError) {
    throw new Error(
      `Failed to load daily duties: ${existingError.message}`,
    );
  }

  const existingDuties =
    (existing ?? []) as DailyDuty[];

  const existingRotaIds =
    new Set(
      existingDuties.map(
        (duty) => duty.rota_id,
      ),
    );

  const missingRotas =
    typedRotas.filter(
      (rota) =>
        rota.active &&
        !existingRotaIds.has(
          rota.id,
        ),
    );

  for (const rota of missingRotas) {
    const {
      error: insertError,
    } = await supabase
      .from("daily_duties")
      .insert({
        rota_id: rota.id,
        duty_date: date,
        start_time:
          rota.start_time,
        end_time:
          rota.end_time,
        duty_name:
          rota.duty_name,
        location:
          rota.location,
        assigned_to:
          rota.assigned_to,
        assigned_name:
          rota.assigned_name,
        status: "pending",
      });

    if (
      insertError &&
      insertError.code !== "23505"
    ) {
      throw new Error(
        `Failed to create daily duty: ${insertError.message}`,
      );
    }
  }

  const {
    data: duties,
    error: dutiesError,
  } = await supabase
    .from("daily_duties")
    .select("*")
    .eq("duty_date", date)
    .in("rota_id", rotaIds)
    .order("start_time", {
      ascending: true,
    });

  if (dutiesError) {
    throw new Error(
      `Failed to reload daily duties: ${dutiesError.message}`,
    );
  }

  const schoolToday =
    getSchoolDateTimeParts().date;
  const isPastDate =
    date < schoolToday;
  const visibleDuties =
    ((duties ?? []) as DailyDuty[]).filter(
      (duty) =>
        activeRotaIds.has(duty.rota_id) ||
        isPastDate ||
        duty.status !== "pending",
    );

  return markExpiredDutiesUnaccounted(
    visibleDuties,
  );
}

async function getDutyCoverMap(
  dutyIds: string[],
) {
  if (dutyIds.length === 0) {
    return new Map<
      string,
      DutyCover
    >();
  }

  const {
    data: covers,
    error: coversError,
  } = await supabase
    .from("duty_covers")
    .select("*")
    .in(
      "daily_duty_id",
      dutyIds,
    );

  if (coversError) {
    throw new Error(
      `Failed to load duty covers: ${coversError.message}`,
    );
  }

  return new Map(
    (
      (covers ?? []) as DutyCover[]
    ).map((cover) => [
      cover.daily_duty_id,
      cover,
    ]),
  );
}

async function getDailyDutiesForUser(
  date: string,
  uid: string,
) {
  const duties =
    await ensureDailyDuties(date);

  const userDuties =
    duties.filter(
      (duty) =>
        duty.assigned_to === uid,
    );

  const coverMap =
    await getDutyCoverMap(
      userDuties.map(
        (duty) => duty.id,
      ),
    );

  return userDuties.map(
    (duty) => ({
      ...duty,
      cover:
        coverMap.get(duty.id) ??
        null,
    }),
  );
}

async function getLeadershipDutyOverview(
  date: string,
) {
  const duties =
    await ensureDailyDuties(date);

  const coverMap =
    await getDutyCoverMap(
      duties.map(
        (duty) => duty.id,
      ),
    );

  const enriched =
    duties.map((duty) => ({
      ...duty,
      cover:
        coverMap.get(duty.id) ??
        null,
    }));

  const summary = {
    total: enriched.length,

    pending:
      enriched.filter(
        (duty) =>
          duty.status ===
          "pending",
      ).length,

    completed:
      enriched.filter(
        (duty) =>
          duty.status ===
          "completed",
      ).length,

    covered:
      enriched.filter(
        (duty) =>
          duty.status ===
          "covered",
      ).length,

    unaccounted:
      enriched.filter(
        (duty) =>
          duty.status ===
          "unaccounted",
      ).length,
  };

  return {
    duties: enriched,
    summary,
  };
}

async function parseJsonBody(
  req: Request,
) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new Error(
      "Request body must be valid JSON.",
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new Error(
      "Request body must be a JSON object.",
    );
  }

  return body as Record<
    string,
    unknown
  >;
}

Deno.serve(
  async (req: Request) => {
    if (
      req.method === "OPTIONS"
    ) {
      return new Response("OK", {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      const authHeader =
        req.headers.get(
          "Authorization",
        );

      if (
        !authHeader ||
        !authHeader.startsWith(
          "Bearer ",
        )
      ) {
        return jsonResponse(
          {
            error:
              "Missing or invalid Authorization header.",
          },
          401,
        );
      }

      const token =
        authHeader
          .slice("Bearer ".length)
          .trim();

      const url =
        new URL(req.url);

      const resource =
        url.searchParams.get(
          "resource",
        );

      /*
       * ============================================================
       * DUTY TRACKER
       * ============================================================
       */

      if (
        resource === "duties" ||
        resource ===
          "duty-overview" ||
        resource ===
          "duty-complete" ||
        resource === "duty-cover" ||
        resource === "duty-clear-cover" ||
        resource === "duty-rotas"
      ) {
        const authorization =
          await requireSRC(token);

        if (
          !authorization.authorized
        ) {
          return jsonResponse(
            {
              error:
                "SRC authorization required.",
              uid:
                authorization.uid,
              user:
                authorization.user,
            },
            403,
          );
        }

        /*
         * GET /?resource=duties&date=YYYY-MM-DD
         */

        if (
          req.method === "GET" &&
          resource === "duties"
        ) {
          const date =
            url.searchParams.get(
              "date",
            );

          if (
            !date ||
            !isValidDateString(
              date,
            )
          ) {
            return jsonResponse(
              {
                error:
                  "A valid date in YYYY-MM-DD format is required.",
              },
              400,
            );
          }

          const duties =
            await getDailyDutiesForUser(
              date,
              authorization.uid,
            );

          return jsonResponse({
            ok: true,
            resource: "duties",
            date,
            uid:
              authorization.uid,
            duties,
          });
        }

        /*
         * GET /?resource=duty-overview&date=YYYY-MM-DD
         */

        if (
          req.method === "GET" &&
          resource ===
            "duty-overview"
        ) {
          if (
            !authorization.isLeadership
          ) {
            return jsonResponse(
              {
                error:
                  "Leadership authorization required for the duty overview.",
              },
              403,
            );
          }

          const date =
            url.searchParams.get(
              "date",
            );

          if (
            !date ||
            !isValidDateString(
              date,
            )
          ) {
            return jsonResponse(
              {
                error:
                  "A valid date in YYYY-MM-DD format is required.",
              },
              400,
            );
          }

          const overview =
            await getLeadershipDutyOverview(
              date,
            );

          return jsonResponse({
            ok: true,
            resource:
              "duty-overview",
            date,
            uid:
              authorization.uid,
            ...overview,
          });
        }

        if (resource === "duty-rotas") {
          if (!authorization.isLeadership) {
            return jsonResponse(
              { error: "Leadership authorization required to manage rotas." },
              403,
            );
          }

          if (req.method === "GET") {
            const { data: rotas, error } = await supabase
              .from("duty_rotas")
              .select("*")
              .order("day_of_week", { ascending: true })
              .order("start_time", { ascending: true });

            if (error) {
              throw new Error(`Failed to load duty rotas: ${error.message}`);
            }

            return jsonResponse({
              ok: true,
              resource: "duty-rotas",
              rotas: (rotas ?? []) as DutyRota[],
            });
          }

          if (req.method === "POST" || req.method === "PATCH") {
            const body = await parseJsonBody(req);
            const isUpdate = req.method === "PATCH";
            const id = typeof body.id === "string" ? body.id.trim() : "";

            if (isUpdate && !isValidUuid(id)) {
              return jsonResponse({ error: "A valid rota id is required." }, 400);
            }

            let existingRota: DutyRota | null = null;
            if (isUpdate) {
              const { data, error } = await supabase
                .from("duty_rotas")
                .select("*")
                .eq("id", id)
                .maybeSingle();

              if (error) {
                throw new Error(`Failed to load duty rota: ${error.message}`);
              }

              if (!data) {
                return jsonResponse({ error: "Duty rota not found." }, 404);
              }

              existingRota = data as DutyRota;
            }

            const hasScheduleFields = [
              "day_of_week",
              "start_time",
              "end_time",
              "duty_name",
              "location",
              "assigned_to",
              "assigned_name",
            ].some((key) =>
              Object.prototype.hasOwnProperty.call(body, key)
            );
            const hasActive = Object.prototype.hasOwnProperty.call(body, "active");

            if (
              isUpdate &&
              !hasScheduleFields &&
              (!hasActive || typeof body.active !== "boolean")
            ) {
              return jsonResponse({ error: "No valid rota changes were supplied." }, 400);
            }

            if (hasActive && typeof body.active !== "boolean") {
              return jsonResponse({ error: "active must be true or false." }, 400);
            }

            let rotaInput: DutyRotaInput | null = null;
            if (hasScheduleFields || !isUpdate) {
              const parsed = parseDutyRotaInput(body);
              if (!parsed.value) {
                return jsonResponse({ error: parsed.error }, 400);
              }

              rotaInput = parsed.value;

              if (
                isUpdate &&
                existingRota &&
                rotaInput.day_of_week !== existingRota.day_of_week
              ) {
                return jsonResponse(
                  {
                    error:
                      "A rota's weekday is fixed once created. Pause it and create a new rota for a different day so its history stays intact.",
                  },
                  409,
                );
              }

              if (rotaInput.assigned_to) {
                const assignee = await getFirestoreUser(rotaInput.assigned_to);
                if (!assignee || assignee.role !== "src") {
                  return jsonResponse(
                    {
                      error:
                        "That Firebase UID is not linked to an SRC member profile. Check the user's Firestore profile first.",
                    },
                    400,
                  );
                }
              }
            }

            const changedAt = new Date().toISOString();

            if (!isUpdate) {
              const { data: rota, error } = await supabase
                .from("duty_rotas")
                .insert({
                  ...rotaInput,
                  active: true,
                  created_at: changedAt,
                  updated_at: changedAt,
                })
                .select("*")
                .single();

              if (error) {
                throw new Error(`Failed to create duty rota: ${error.message}`);
              }

              return jsonResponse({ ok: true, created: true, rota });
            }

            const changes: Record<string, unknown> = {
              updated_at: changedAt,
            };
            if (rotaInput) {
              Object.assign(changes, rotaInput);
            }
            if (hasActive) {
              changes.active = body.active;
            }

            const { data: rota, error } = await supabase
              .from("duty_rotas")
              .update(changes)
              .eq("id", id)
              .select("*")
              .single();

            if (error) {
              throw new Error(`Failed to update duty rota: ${error.message}`);
            }

            if (rotaInput) {
              const { error: dailyError } = await supabase
                .from("daily_duties")
                .update({
                  start_time: rotaInput.start_time,
                  end_time: rotaInput.end_time,
                  duty_name: rotaInput.duty_name,
                  location: rotaInput.location,
                  assigned_to: rotaInput.assigned_to,
                  assigned_name: rotaInput.assigned_name,
                  updated_at: changedAt,
                })
                .eq("rota_id", id)
                .eq("status", "pending")
                .gte("duty_date", getSchoolDateTimeParts().date);

              if (dailyError) {
                throw new Error(
                  `Rota saved, but future pending duties could not be refreshed: ${dailyError.message}`,
                );
              }
            }

            return jsonResponse({ ok: true, updated: true, rota });
          }

          return jsonResponse(
            { error: `Method ${req.method} is not supported for duty rotas.` },
            405,
          );
        }

        /*
         * POST /?resource=duty-complete
         */

        if (
          req.method === "POST" &&
          resource ===
            "duty-complete"
        ) {
          const body =
            await parseJsonBody(req);

          const completed =
            body.completed !== false;

          const id =
            typeof body.id ===
            "string"
              ? body.id.trim()
              : "";

          if (
            !isValidUuid(id)
          ) {
            return jsonResponse(
              {
                error:
                  "A valid daily duty id is required.",
              },
              400,
            );
          }

          const {
            data: duty,
            error: dutyError,
          } = await supabase
            .from("daily_duties")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (dutyError) {
            throw new Error(
              `Failed to load duty: ${dutyError.message}`,
            );
          }

          if (!duty) {
            return jsonResponse(
              {
                error:
                  "Daily duty not found.",
              },
              404,
            );
          }

          if (
            duty.assigned_to !==
              authorization.uid &&
            !authorization.isLeadership
          ) {
            return jsonResponse(
              {
                error:
                  "You can only update duties assigned to you.",
              },
              403,
            );
          }

          if (
            duty.status ===
            "covered"
          ) {
            return jsonResponse(
              {
                error:
                  "This duty has already been recorded as covered.",
              },
              409,
            );
          }

          if (
            duty.status ===
              "completed" &&
            completed
          ) {
            return jsonResponse({
              ok: true,
              completed: true,
              duty,
            });
          }

          if (
            !completed &&
            duty.status !== "completed"
          ) {
            return jsonResponse({
              ok: true,
              completed: false,
              duty,
            });
          }

          const changedAt =
            new Date().toISOString();

          const {
            data: updatedDuty,
            error: updateError,
          } = await supabase
            .from("daily_duties")
            .update({
              status: completed
                ? "completed"
                : "pending",
              completed_at: completed
                ? changedAt
                : null,
              updated_at: changedAt,
            })
            .eq("id", id)
            .select("*")
            .single();

          if (updateError) {
            throw new Error(
              `Failed to ${completed ? "complete" : "reopen"} duty: ${updateError.message}`,
            );
          }

          return jsonResponse({
            ok: true,
            completed,
            duty: updatedDuty,
          });
        }

        /*
         * POST /?resource=duty-cover
         */

        if (
          req.method === "POST" &&
          resource ===
            "duty-cover"
        ) {
          const body =
            await parseJsonBody(req);

          const id =
            typeof body.id ===
            "string"
              ? body.id.trim()
              : "";

          const coveredBy =
            typeof body.covered_by ===
            "string"
              ? body.covered_by.trim()
              : "";

          if (
            !isValidUuid(id)
          ) {
            return jsonResponse(
              {
                error:
                  "A valid daily duty id is required.",
              },
              400,
            );
          }

          if (!coveredBy) {
            return jsonResponse(
              {
                error:
                  "covered_by is required.",
              },
              400,
            );
          }

          const {
            data: duty,
            error: dutyError,
          } = await supabase
            .from("daily_duties")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (dutyError) {
            throw new Error(
              `Failed to load duty: ${dutyError.message}`,
            );
          }

          if (!duty) {
            return jsonResponse(
              {
                error:
                  "Daily duty not found.",
              },
              404,
            );
          }

          if (
            duty.assigned_to !==
              authorization.uid &&
            !authorization.isLeadership
          ) {
            return jsonResponse(
              {
                error:
                  "You can only record cover for your own assigned duties.",
              },
              403,
            );
          }

          if (
            duty.assigned_to === coveredBy ||
            duty.assigned_name?.toLowerCase() ===
              coveredBy.toLowerCase()
          ) {
            return jsonResponse(
              {
                error:
                  "The original assignee cannot be recorded as their own cover.",
              },
              400,
            );
          }

          if (
            duty.status ===
            "completed"
          ) {
            return jsonResponse(
              {
                error:
                  "This duty is already recorded as completed.",
              },
              409,
            );
          }

          const {
            data: existingCover,
            error:
              existingCoverError,
          } = await supabase
            .from("duty_covers")
            .select("*")
            .eq(
              "daily_duty_id",
              id,
            )
            .maybeSingle();

          if (
            existingCoverError
          ) {
            throw new Error(
              `Failed to load existing cover: ${existingCoverError.message}`,
            );
          }

          if (existingCover) {
            return jsonResponse(
              {
                error:
                  "A cover has already been recorded for this duty.",
                cover:
                  existingCover,
              },
              409,
            );
          }

          const recordedAt =
            new Date().toISOString();

          const {
            data: cover,
            error: coverError,
          } = await supabase
            .from("duty_covers")
            .insert({
              daily_duty_id: id,
              original_assignee:
                duty.assigned_name ??
                duty.assigned_to ??
                "Unassigned",
              covered_by: coveredBy,
              recorded_at:
                recordedAt,
            })
            .select("*")
            .single();

          if (coverError) {
            if (
              coverError.code ===
              "23505"
            ) {
              return jsonResponse(
                {
                  error:
                    "A cover has already been recorded for this duty.",
                },
                409,
              );
            }

            throw new Error(
              `Failed to record duty cover: ${coverError.message}`,
            );
          }

          const {
            data: updatedDuty,
            error: updateError,
          } = await supabase
            .from("daily_duties")
            .update({
              status: "covered",
              completed_at: null,
              updated_at:
                recordedAt,
            })
            .eq("id", id)
            .select("*")
            .single();

          if (updateError) {
            throw new Error(
              `Failed to update covered duty: ${updateError.message}`,
            );
          }

          return jsonResponse({
            ok: true,
            covered: true,
            duty: updatedDuty,
            cover,
          });
        }

        /*
         * POST /?resource=duty-clear-cover
         * Leadership can remove an incorrect cover entry and return
         * the duty to pending in one database transaction.
         */

        if (
          req.method === "POST" &&
          resource === "duty-clear-cover"
        ) {
          if (!authorization.isLeadership) {
            return jsonResponse(
              {
                error:
                  "Leadership authorization is required to remove a duty cover.",
              },
              403,
            );
          }

          const body = await parseJsonBody(req);
          const id =
            typeof body.id === "string"
              ? body.id.trim()
              : "";

          if (!isValidUuid(id)) {
            return jsonResponse(
              {
                error:
                  "A valid daily duty id is required.",
              },
              400,
            );
          }

          const {
            data: duty,
            error: dutyError,
          } = await supabase
            .from("daily_duties")
            .select("id, status")
            .eq("id", id)
            .maybeSingle();

          if (dutyError) {
            throw new Error(
              `Failed to load duty: ${dutyError.message}`,
            );
          }

          if (!duty) {
            return jsonResponse(
              {
                error: "Daily duty not found.",
              },
              404,
            );
          }

          if (duty.status !== "covered") {
            return jsonResponse(
              {
                error:
                  "This duty does not have an active cover to remove.",
              },
              409,
            );
          }

          const { error: clearError } =
            await supabase.rpc(
              "clear_duty_cover",
              { p_daily_duty_id: id },
            );

          if (clearError) {
            throw new Error(
              `Failed to remove duty cover: ${clearError.message}`,
            );
          }

          const {
            data: updatedDuty,
            error: reloadError,
          } = await supabase
            .from("daily_duties")
            .select("*")
            .eq("id", id)
            .single();

          if (reloadError) {
            throw new Error(
              `Failed to reload duty after removing cover: ${reloadError.message}`,
            );
          }

          return jsonResponse({
            ok: true,
            cleared: true,
            duty: updatedDuty,
          });
        }
      }

/*
 * ============================================================
 * ANNOUNCEMENTS
 * ============================================================
 */

if (resource === "announcements") {
  const authorization =
    await requireSRC(token);

  if (
    !authorization.authorized ||
    !authorization.isLeadership
  ) {
    return jsonResponse(
      {
        error:
          "Leadership authorization required.",
        uid:
          authorization.uid,
        user:
          authorization.user,
      },
      403,
    );
  }

  /*
   * GET /?resource=announcements
   */

  if (req.method === "GET") {
    const {
      data: announcements,
      error,
    } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(
        `Failed to load announcements: ${error.message}`,
      );
    }

    return jsonResponse({
      ok: true,
      resource: "announcements",
      announcements:
        announcements ?? [],
    });
  }

  /*
   * POST /?resource=announcements
   */

  if (req.method === "POST") {
    const body =
      await parseJsonBody(req);

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status
        : "draft";

    const visibility =
      typeof body.visibility === "string"
        ? body.visibility
        : "public";

    const pinned =
      typeof body.pinned === "boolean"
        ? body.pinned
        : false;

    const publishedAt =
      body.published_at === null ||
      typeof body.published_at ===
        "string"
        ? body.published_at
        : null;

    const expiresAt =
      body.expires_at === null ||
      typeof body.expires_at ===
        "string"
        ? body.expires_at
        : null;

    if (!title) {
      return jsonResponse(
        {
          error:
            "Title is required.",
        },
        400,
      );
    }

    if (!content) {
      return jsonResponse(
        {
          error:
            "Content is required.",
        },
        400,
      );
    }

    if (
      !allowedAnnouncementStatuses.includes(
        status as
          (typeof allowedAnnouncementStatuses)[number],
      )
    ) {
      return jsonResponse(
        {
          error:
            "Invalid announcement status.",
        },
        400,
      );
    }

    if (
      !allowedAnnouncementVisibility.includes(
        visibility as
          (typeof allowedAnnouncementVisibility)[number],
      )
    ) {
      return jsonResponse(
        {
          error:
            "Invalid announcement visibility.",
        },
        400,
      );
    }

    if (
      publishedAt !== null &&
      Number.isNaN(
        Date.parse(publishedAt),
      )
    ) {
      return jsonResponse(
        {
          error:
            "Invalid published_at date.",
        },
        400,
      );
    }

    if (
      expiresAt !== null &&
      Number.isNaN(
        Date.parse(expiresAt),
      )
    ) {
      return jsonResponse(
        {
          error:
            "Invalid expires_at date.",
        },
        400,
      );
    }

    if (
      publishedAt !== null &&
      expiresAt !== null &&
      new Date(expiresAt) <
        new Date(publishedAt)
    ) {
      return jsonResponse(
        {
          error:
            "expires_at cannot be earlier than published_at.",
        },
        400,
      );
    }

    const createdAt =
      new Date().toISOString();

    const {
      data: announcement,
      error,
    } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        status,
        visibility,
        pinned,
        published_at:
          publishedAt,
        expires_at:
          expiresAt,
        created_by:
          authorization.uid,
        created_at:
          createdAt,
        updated_at:
          createdAt,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Failed to create announcement: ${error.message}`,
      );
    }

    return jsonResponse(
      {
        ok: true,
        resource: "announcements",
        announcement,
      },
      201,
    );
  }

  return jsonResponse(
    {
      error:
        "Method not allowed.",
    },
    405,
  );
}

      /*
       * ============================================================
       * CALENDAR
       * ============================================================
       *
       * Calendar remains leadership-only.
       */

      const authorization =
        await requireLeadership(token);

      if (
        !authorization.authorized
      ) {
        return jsonResponse(
          {
            error:
              "Leadership authorization required.",
            uid:
              authorization.uid,
            user:
              authorization.user,
          },
          403,
        );
      }

      /*
       * GET
       * Load all calendar events.
       */

      if (
        req.method === "GET"
      ) {
        const {
          data: events,
          error: eventsError,
        } = await supabase
          .from("calendar_events")
          .select("*")
          .order("start_at", {
            ascending: true,
          });

        if (eventsError) {
          throw new Error(
            `Failed to load calendar events: ${eventsError.message}`,
          );
        }

        return jsonResponse({
          ok: true,
          authenticated: true,
          authorized: true,
          uid:
            authorization.uid,
          position:
            authorization.user
              ?.position ?? null,
          events,
        });
      }

      /*
       * POST
       * Create a calendar event.
       */

      if (
        req.method === "POST"
      ) {
        const input =
          await parseJsonBody(req);

        const title =
          typeof input.title ===
          "string"
            ? input.title.trim()
            : "";

        if (!title) {
          return jsonResponse(
            {
              error:
                "Title is required.",
            },
            400,
          );
        }

        if (title.length > 200) {
          return jsonResponse(
            {
              error:
                "Title must be 200 characters or fewer.",
            },
            400,
          );
        }

        const description =
          typeof input.description ===
          "string"
            ? input.description.trim() ||
              null
            : null;

        const startAt =
          typeof input.start_at ===
          "string"
            ? input.start_at
            : "";

        if (!startAt) {
          return jsonResponse(
            {
              error:
                "start_at is required.",
            },
            400,
          );
        }

        const startDate =
          new Date(startAt);

        if (
          Number.isNaN(
            startDate.getTime(),
          )
        ) {
          return jsonResponse(
            {
              error:
                "start_at must be a valid date/time.",
            },
            400,
          );
        }

        const endAt =
          typeof input.end_at ===
            "string" &&
          input.end_at.trim() !== ""
            ? input.end_at
            : null;

        if (endAt) {
          const endDate =
            new Date(endAt);

          if (
            Number.isNaN(
              endDate.getTime(),
            )
          ) {
            return jsonResponse(
              {
                error:
                  "end_at must be a valid date/time.",
              },
              400,
            );
          }

          if (
            endDate.getTime() <
            startDate.getTime()
          ) {
            return jsonResponse(
              {
                error:
                  "end_at cannot be before start_at.",
              },
              400,
            );
          }
        }

        const allDay =
          typeof input.all_day ===
          "boolean"
            ? input.all_day
            : false;

        const location =
          typeof input.location ===
          "string"
            ? input.location.trim() ||
              null
            : null;

        const category =
          typeof input.category ===
          "string"
            ? input.category
            : "other";

        if (
          !allowedCategories.has(
            category,
          )
        ) {
          return jsonResponse(
            {
              error:
                "Invalid calendar category.",
            },
            400,
          );
        }

        const visibility =
          typeof input.visibility ===
          "string"
            ? input.visibility
            : "private";

        if (
          !allowedVisibility.has(
            visibility,
          )
        ) {
          return jsonResponse(
            {
              error:
                "Invalid calendar visibility.",
            },
            400,
          );
        }

        const {
          data: event,
          error: insertError,
        } = await supabase
          .from("calendar_events")
          .insert({
            title,
            description,
            start_at:
              startDate.toISOString(),
            end_at: endAt
              ? new Date(
                  endAt,
                ).toISOString()
              : null,
            all_day: allDay,
            location,
            category,
            visibility,
            created_by:
              authorization.uid,
          })
          .select("*")
          .single();

        if (insertError) {
          throw new Error(
            `Failed to create calendar event: ${insertError.message}`,
          );
        }

        return jsonResponse(
          {
            ok: true,
            created: true,
            event,
          },
          201,
        );
      }

      /*
       * PATCH
       * Update an existing calendar event.
       */

      if (
        req.method === "PATCH"
      ) {
        const input =
          await parseJsonBody(req);

        const id =
          typeof input.id ===
          "string"
            ? input.id.trim()
            : "";

        if (!id) {
          return jsonResponse(
            {
              error:
                "Event id is required.",
            },
            400,
          );
        }

        if (!isValidUuid(id)) {
          return jsonResponse(
            {
              error:
                "Event id must be a valid UUID.",
            },
            400,
          );
        }

        const {
          data: existingEvent,
          error:
            existingEventError,
        } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (
          existingEventError
        ) {
          throw new Error(
            `Failed to load calendar event: ${existingEventError.message}`,
          );
        }

        if (!existingEvent) {
          return jsonResponse(
            {
              error:
                "Calendar event not found.",
            },
            404,
          );
        }

        const updates: Record<
          string,
          unknown
        > = {};

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "title",
          )
        ) {
          if (
            typeof input.title !==
            "string"
          ) {
            return jsonResponse(
              {
                error:
                  "title must be a string.",
              },
              400,
            );
          }

          const title =
            input.title.trim();

          if (!title) {
            return jsonResponse(
              {
                error:
                  "Title cannot be empty.",
              },
              400,
            );
          }

          if (title.length > 200) {
            return jsonResponse(
              {
                error:
                  "Title must be 200 characters or fewer.",
              },
              400,
            );
          }

          updates.title = title;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "description",
          )
        ) {
          if (
            input.description !==
              null &&
            typeof input.description !==
              "string"
          ) {
            return jsonResponse(
              {
                error:
                  "description must be a string or null.",
              },
              400,
            );
          }

          updates.description =
            typeof input.description ===
            "string"
              ? input.description.trim() ||
                null
              : null;
        }

        let finalStartAt =
          existingEvent.start_at;

        let finalEndAt =
          existingEvent.end_at;

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "start_at",
          )
        ) {
          if (
            typeof input.start_at !==
            "string"
          ) {
            return jsonResponse(
              {
                error:
                  "start_at must be a string.",
              },
              400,
            );
          }

          const startDate =
            new Date(
              input.start_at,
            );

          if (
            Number.isNaN(
              startDate.getTime(),
            )
          ) {
            return jsonResponse(
              {
                error:
                  "start_at must be a valid date/time.",
              },
              400,
            );
          }

          finalStartAt =
            startDate.toISOString();

          updates.start_at =
            finalStartAt;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "end_at",
          )
        ) {
          if (
            input.end_at !== null &&
            typeof input.end_at !==
              "string"
          ) {
            return jsonResponse(
              {
                error:
                  "end_at must be a string or null.",
              },
              400,
            );
          }

          if (
            input.end_at === null
          ) {
            finalEndAt = null;
            updates.end_at = null;
          } else if (
            typeof input.end_at ===
              "string" &&
            input.end_at.trim() !==
              ""
          ) {
            const endDate =
              new Date(
                input.end_at,
              );

            if (
              Number.isNaN(
                endDate.getTime(),
              )
            ) {
              return jsonResponse(
                {
                  error:
                    "end_at must be a valid date/time.",
                },
                400,
              );
            }

            finalEndAt =
              endDate.toISOString();

            updates.end_at =
              finalEndAt;
          } else {
            finalEndAt = null;
            updates.end_at = null;
          }
        }

        if (
          finalEndAt !== null &&
          new Date(
            finalEndAt,
          ).getTime() <
            new Date(
              finalStartAt,
            ).getTime()
        ) {
          return jsonResponse(
            {
              error:
                "end_at cannot be before start_at.",
            },
            400,
          );
        }

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "all_day",
          )
        ) {
          if (
            typeof input.all_day !==
            "boolean"
          ) {
            return jsonResponse(
              {
                error:
                  "all_day must be a boolean.",
              },
              400,
            );
          }

          updates.all_day =
            input.all_day;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "location",
          )
        ) {
          if (
            input.location !== null &&
            typeof input.location !==
              "string"
          ) {
            return jsonResponse(
              {
                error:
                  "location must be a string or null.",
              },
              400,
            );
          }

          updates.location =
            typeof input.location ===
            "string"
              ? input.location.trim() ||
                null
              : null;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "category",
          )
        ) {
          if (
            typeof input.category !==
            "string"
          ) {
            return jsonResponse(
              {
                error:
                  "category must be a string.",
              },
              400,
            );
          }

          if (
            !allowedCategories.has(
              input.category,
            )
          ) {
            return jsonResponse(
              {
                error:
                  "Invalid calendar category.",
              },
              400,
            );
          }

          updates.category =
            input.category;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            input,
            "visibility",
          )
        ) {
          if (
            typeof input.visibility !==
            "string"
          ) {
            return jsonResponse(
              {
                error:
                  "visibility must be a string.",
              },
              400,
            );
          }

          if (
            !allowedVisibility.has(
              input.visibility,
            )
          ) {
            return jsonResponse(
              {
                error:
                  "Invalid calendar visibility.",
              },
              400,
            );
          }

          updates.visibility =
            input.visibility;
        }

        if (
          Object.keys(updates)
            .length === 0
        ) {
          return jsonResponse(
            {
              error:
                "No valid fields were provided for update.",
            },
            400,
          );
        }

        updates.updated_at =
          new Date().toISOString();

        const {
          data: event,
          error: updateError,
        } = await supabase
          .from("calendar_events")
          .update(updates)
          .eq("id", id)
          .select("*")
          .single();

        if (updateError) {
          throw new Error(
            `Failed to update calendar event: ${updateError.message}`,
          );
        }

        return jsonResponse({
          ok: true,
          updated: true,
          event,
        });
      }

      /*
       * DELETE
       * Delete an existing calendar event.
       */

      if (
        req.method === "DELETE"
      ) {
        const input =
          await parseJsonBody(req);

        const id =
          typeof input.id ===
          "string"
            ? input.id.trim()
            : "";

        if (!id) {
          return jsonResponse(
            {
              error:
                "Event id is required.",
            },
            400,
          );
        }

        if (!isValidUuid(id)) {
          return jsonResponse(
            {
              error:
                "Event id must be a valid UUID.",
            },
            400,
          );
        }

        const {
          data: existingEvent,
          error:
            existingEventError,
        } = await supabase
          .from("calendar_events")
          .select("id")
          .eq("id", id)
          .maybeSingle();

        if (
          existingEventError
        ) {
          throw new Error(
            `Failed to find calendar event: ${existingEventError.message}`,
          );
        }

        if (!existingEvent) {
          return jsonResponse(
            {
              error:
                "Calendar event not found.",
            },
            404,
          );
        }

        const {
          error: deleteError,
        } = await supabase
          .from("calendar_events")
          .delete()
          .eq("id", id);

        if (deleteError) {
          throw new Error(
            `Failed to delete calendar event: ${deleteError.message}`,
          );
        }

        return jsonResponse({
          ok: true,
          deleted: true,
          id,
        });
      }

      return jsonResponse(
        {
          error:
            `Method ${req.method} is not supported.`,
        },
        405,
      );
    } catch (error) {
      console.error(
        "Runtime API error:",
        error,
      );

      return jsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "API request failed.",
        },
        500,
      );
    }
  },
);
