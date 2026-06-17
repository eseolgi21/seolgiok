// src/app/[locale]/admin/boards/announcements/hooks/useAnnouncementDetail.ts

"use client";

import { useCallback, useState } from "react";
import type { AdminDetailResult, AdminPostDetail } from "../types";
import { AdminDetailResultSchema } from "../gaurd/announcements";
import { jsonFetch } from "@/lib/fetch";

export function useAnnouncementDetail() {
  const [detail, setDetail] = useState<AdminPostDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const raw = await jsonFetch<AdminDetailResult>(
        `/api/admin/boards/announcements?id=${encodeURIComponent(id)}`,
        {
          cache: "no-store",
        }
      );
      const parsed = AdminDetailResultSchema.safeParse(raw);
      if (!parsed.success) throw new Error("INVALID_DETAIL_PAYLOAD");
      if (parsed.data.ok) {
        setDetail(parsed.data.data);
        return true;
      }
      throw new Error(parsed.data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
      setDetail(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setDetail(null);
    setError(null);
  }, []);

  return { detail, loading, error, load, clear };
}
