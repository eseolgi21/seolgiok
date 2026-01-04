"use client";

import { useCallback, useState } from "react";
import { AdminPostFormInput, AdminUpdateResult } from "../types";
import { AdminUpdateResultSchema } from "../gaurd/events";
// import type { AdminPostFormInput, AdminUpdateResult } from "../../types";
// import { AdminUpdateResultSchema } from "../../gaurd/events";

async function jsonFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `HTTP ${res.status} ${res.statusText} — non-JSON: ${text.slice(0, 300)}`
    );
  }
  const data = (await res.json()) as unknown;
  return data as T;
}

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
