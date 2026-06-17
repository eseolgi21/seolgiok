"use client";

import { useCallback, useState } from "react";
import { AdminPostFormInput, AdminUpdateResult } from "../types";
import { AdminUpdateResultSchema } from "../gaurd/events";
import { jsonFetch } from "@/lib/fetch";

export function useEventCreate() {
  const [creating, setCreating] = useState<boolean>(false);

  const createOne = useCallback(async (payload: AdminPostFormInput) => {
    setCreating(true);
    try {
      const raw = await jsonFetch<AdminUpdateResult>(
        "/api/admin/boards/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        }
      );
      const parsed = AdminUpdateResultSchema.safeParse(raw);
      if (!parsed.success)
        return { ok: false as const, error: "INVALID_UPDATE_PAYLOAD" };
      return parsed.data;
    } finally {
      setCreating(false);
    }
  }, []);

  return { creating, createOne };
}
