const ANNOUNCEMENTS_API =
  "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/runtime-test";

export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  published_at: string | null;
}

interface PublicAnnouncementsResponse {
  ok: boolean;
  announcements?: PublicAnnouncement[];
  error?: string;
}

export async function loadPublicAnnouncements(
  limit = 30,
): Promise<PublicAnnouncement[]> {
  const url = new URL(ANNOUNCEMENTS_API);
  url.searchParams.set("resource", "public-announcements");
  url.searchParams.set(
    "limit",
    String(Math.min(Math.max(Math.floor(limit), 1), 50)),
  );

  const response = await fetch(url);
  const data =
    (await response.json()) as PublicAnnouncementsResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error ?? "Public announcements could not be loaded.",
    );
  }

  return data.announcements ?? [];
}
