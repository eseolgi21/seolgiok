"use client";

import type {
  ResolvedUser,
  ResolveUserResponse,
  SignupBody,
  SignupResponse,
} from "@/app/[locale]/(site)/auth/signup/types/signup/api";
import { isResolveUserResponse } from "@/app/[locale]/(site)/auth/signup/guards/isResolveUserResponse";
import { isSignupResponse } from "@/app/[locale]/(site)/auth/signup/guards/isSignupResponse";

/** fetch with timeout */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function resolveUser(input: string): Promise<ResolvedUser | null> {
  const q = input.trim();
  if (!q) return null;

  try {
    const url = new URL("/api/auth/resolve-user", window.location.origin);
    url.search = new URLSearchParams({ query: q }).toString();

    const res = await fetchWithTimeout(url, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      timeoutMs: 8000,
    });

    const dataUnknown = await res.json().catch(() => ({ ok: false }));
    if (!isResolveUserResponse(dataUnknown)) return null;
    if (!res.ok || !dataUnknown.ok) return null;
    return (dataUnknown as ResolveUserResponse).ok
      ? ((dataUnknown as Extract<ResolveUserResponse, { ok: true }>).user ??
          null)
      : null;
  } catch {
    return null;
  }
}

export async function signup(body: SignupBody): Promise<SignupResponse> {
  try {
    const res = await fetchWithTimeout("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      body: JSON.stringify(body),
      timeoutMs: 10000,
    });

    const dataUnknown = await res.json().catch(() => ({ ok: false }));
    if (isSignupResponse(dataUnknown)) {
      return dataUnknown;
    }
    return { ok: false, code: "UNKNOWN", message: "Invalid response" } as const;
  } catch {
    return { ok: false, code: "UNKNOWN", message: "Network error" } as const;
  }
}
