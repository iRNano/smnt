"use client";

import type { RouteSubmission } from "@/lib/submissionTypes";

const ADMIN_KEY = "smnt-admin-secret";

export function getAdminSecret(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_KEY);
}

export function setAdminSecret(secret: string): void {
  sessionStorage.setItem(ADMIN_KEY, secret);
}

export function clearAdminSecret(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}

export function adminFetch(url: string, init?: RequestInit): Promise<Response> {
  const secret = getAdminSecret();
  const headers = new Headers(init?.headers);
  if (secret) headers.set("x-smnt-admin-secret", secret);
  return fetch(url, { ...init, headers });
}

export type { RouteSubmission };
