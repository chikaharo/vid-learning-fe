"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import {
  AUTH_EVENT,
  USER_KEY,
  clearSession,
  type StoredUser,
} from "@/lib/session";

function subscribeToSession(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith("vu:")) {
      callback();
    }
  };
  const handleAuthChange = () => callback();
  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_EVENT, handleAuthChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_EVENT, handleAuthChange);
  };
}

function getClientSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(USER_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

const navigation = [
  { href: "/courses", label: "Courses" },
  { href: "/dashboard", label: "My learning" },
];

export function SiteHeader() {
  const router = useRouter();
  const userString = useSyncExternalStore(
    subscribeToSession,
    getClientSnapshot,
    getServerSnapshot,
  );
  const user = useMemo<StoredUser | null>(() => {
    if (!userString) {
      return null;
    }
    try {
      return JSON.parse(userString) as StoredUser;
    } catch {
      return null;
    }
  }, [userString]);

  function handleSignOut() {
    clearSession();
    router.push("/");
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("search");
    if (typeof query === "string" && query.trim()) {
      router.push(`/courses?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm uppercase tracking-widest text-white">
            VU
          </span>
          <div className="flex flex-col leading-tight">
            <span>Video</span>
            <span className="text-xs text-zinc-500">University</span>
          </div>
        </Link>
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-8"
        >
          <div className="relative w-full text-zinc-500 focus-within:text-zinc-900">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              name="search"
              id="search"
              className="block w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-3 text-sm placeholder-zinc-500 focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-500 sm:text-sm"
              placeholder="Search courses..."
              type="search"
            />
          </div>
        </form>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
          {user && user.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className="transition hover:text-zinc-900"
            >
              Admin Portal
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Signed in
                </p>
                <p className="font-semibold text-zinc-900">
                  {user.fullName ?? user.name ?? user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-900"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="transition hover:text-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-4 py-2 text-white transition hover:bg-zinc-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {user ? (
            <>
              <span className="text-sm font-semibold text-zinc-900">
                {user.fullName ?? user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
