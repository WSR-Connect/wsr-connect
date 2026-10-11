import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-rota-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPECTED_SPREADSHEET_ID =
  "1N6RMXBu7zAMVsAERXfiWmleeGXpjBK9tAbsPG3pNPOY";
const EXPECTED_SHEET_NAME = "CORRIDOR DUTY (GIRLS)";
const MAX_REQUEST_BYTES = 32_000;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }

  return difference === 0;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Only POST is supported." }, 405);
  }

  const expectedSecret = Deno.env.get("ROTA_SYNC_SECRET");
  const suppliedSecret = request.headers.get("x-rota-sync-secret") ?? "";

  if (!expectedSecret) {
    return jsonResponse({ error: "Rota sync is not configured." }, 503);
  }

  if (!constantTimeEqual(expectedSecret, suppliedSecret)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "The rota payload is too large." }, 413);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "The request body must be valid JSON." }, 400);
  }

  if (
    payload.spreadsheet_id !== EXPECTED_SPREADSHEET_ID ||
    payload.sheet_name !== EXPECTED_SHEET_NAME ||
    !Array.isArray(payload.assignments)
  ) {
    return jsonResponse({ error: "The request does not match the approved rota source." }, 400);
  }

  if (payload.assignments.length !== 64) {
    return jsonResponse({ error: "The sheet must contain all 64 weekday assignments." }, 400);
  }

  const { data, error } = await supabase.rpc(
    "sync_girls_corridor_rota",
    { p_assignments: payload.assignments },
  );

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ ok: true, result: data });
});
