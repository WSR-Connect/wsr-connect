import { useEffect, useState } from "react";
import {
  loadPublicAnnouncements,
  type PublicAnnouncement,
} from "../lib/publicAnnouncements";

export function usePublicAnnouncements(limit: number) {
  const [announcements, setAnnouncements] =
    useState<PublicAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);

    loadPublicAnnouncements(limit)
      .then((items) => {
        if (active) {
          setAnnouncements(items);
        }
      })
      .catch((requestError: unknown) => {
        console.error(
          "Failed to load public announcements:",
          requestError,
        );

        if (active) {
          setAnnouncements([]);
          setError(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [limit, reloadToken]);

  return {
    announcements,
    loading,
    error,
    reload: () => setReloadToken((token) => token + 1),
  };
}
