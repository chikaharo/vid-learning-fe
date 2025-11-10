"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AUTH_EVENT,
  clearSession,
  getStoredUser,
  type StoredUser,
} from "@/lib/session";

const navigation = [
  { href: "/courses", label: "Courses" },
  { href: "/dashboard", label: "My learning" },
];

export function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return getStoredUser();
  });

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (!event.key || event.key.startsWith("vu:")) {
        setUser(getStoredUser());
      }
    }

    function handleAuthChange() {
      setUser(getStoredUser());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
    };
  }, []);

  function handleSignOut() {
    clearSession();
    setUser(null);
    router.push("/");
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
