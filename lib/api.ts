import type { LoginResponse } from "./auth";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isSessionExpired,
  persistSession,
} from "@/lib/session";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:8080/api";

const shouldUseMockData =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
  process.env.USE_MOCK_DATA === "true";

type FetchOptions = {
  fallbackToMock?: boolean;
  auth?: boolean;
};

const TOKEN_REFRESH_BUFFER_MS = 30_000;

function isClient() {
  return typeof window !== "undefined";
}

async function extractErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      const payload = await response.json();
      if (typeof payload?.message === "string") {
        return payload.message;
      }
      if (Array.isArray(payload?.message)) {
        return payload.message.join(", ");
      }
    } catch {
      // ignore parse errors and fall back to text
    }
  }
  const text = await response.text();
  return text || `Request failed with status ${response.status}`;
}

async function requestTokenRefresh(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    throw new Error("Session expired. Please log in again.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch (error) {
    clearSession();
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to refresh session. Please log in again.",
    );
  }

  if (!response.ok) {
    clearSession();
    const message = await extractErrorMessage(response);
    throw new Error(message || "Session expired. Please log in again.");
  }

  const data = (await response.json()) as LoginResponse;
  persistSession(data);
}

async function ensureActiveAccessToken(): Promise<string> {
  if (!isClient()) {
    throw new Error("Authenticated requests are only supported in the browser.");
  }

  if (!getAccessToken() || isSessionExpired(TOKEN_REFRESH_BUFFER_MS)) {
    await requestTokenRefresh();
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }
  return token;
}

export async function fetchFromApi<T>(
  path: string,
  init?: RequestInit,
  options: FetchOptions = {},
): Promise<T | null> {
  const { fallbackToMock = true, auth = false } = options;

  if (fallbackToMock && shouldUseMockData && !auth) {
    return null;
  }

  let hasRetried = false;

  const makeRequest = async (): Promise<T | null> => {
    const isFormData =
      typeof FormData !== "undefined" && init?.body instanceof FormData;
    let headers: HeadersInit = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    };

    if (auth) {
      try {
        const token = await ensureActiveAccessToken();
        headers = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      } catch (error) {
        if (fallbackToMock) {
          console.warn(`Auth required for ${path}. Falling back to mock data.`);
          return null;
        }
        throw error;
      }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: init?.cache ?? "force-cache",
    });

    if (response.status === 401 && auth && !hasRetried) {
      hasRetried = true;
      try {
        await requestTokenRefresh();
      } catch (error) {
        if (fallbackToMock) {
          console.warn(`Session refresh failed for ${path}`, error);
          return null;
        }
        throw error;
      }
      return makeRequest();
    }

    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch (error) {
        console.error("JSON Parse Error:", error);
        // Only log a substring to avoid flooding logs if huge
        console.error("Response Text Preview:", text.substring(0, 1000));
        throw new Error("Invalid JSON response from API");
      }
    }

    return (await response.text()) as T;
  };

  try {
    return await makeRequest();
  } catch (error) {
    if (fallbackToMock && !auth) {
      console.warn(`Falling back to mock data for ${path}`, error);
      return null;
    }
    throw error instanceof Error
      ? error
      : new Error("Unexpected API error");
  }
}
