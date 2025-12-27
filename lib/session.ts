import type { LoginResponse } from "./auth";

export const USER_KEY = "vu:user";
export const ACCESS_TOKEN_KEY = "vu:accessToken";
export const REFRESH_TOKEN_KEY = "vu:refreshToken";
export const TOKEN_EXPIRY_KEY = "vu:tokenExpiry";
export const AUTH_EVENT = "vu-auth-change";
export const ENROLLMENT_EVENT = "vu-enrollment-change";

export type StoredUser = LoginResponse["user"];

function hasWindow() {
	return (
		typeof window !== "undefined" && typeof window.localStorage !== "undefined"
	);
}

function getStorage() {
	return hasWindow() ? window.localStorage : null;
}

function write(key: string, value: string) {
	const storage = getStorage();
	if (!storage) return;
	storage.setItem(key, value);
}

function read(key: string) {
	const storage = getStorage();
	if (!storage) return null;
	return storage.getItem(key);
}

function remove(key: string) {
	const storage = getStorage();
	if (!storage) return;
	storage.removeItem(key);
}

export function persistSession(session: LoginResponse) {
	write(USER_KEY, JSON.stringify(session.user));
	write(ACCESS_TOKEN_KEY, session.accessToken);
	write(REFRESH_TOKEN_KEY, session.refreshToken);
	const expiresAt = Date.now() + session.expiresIn * 1000;
	write(TOKEN_EXPIRY_KEY, expiresAt.toString());
	if (hasWindow()) {
		window.dispatchEvent(new Event(AUTH_EVENT));
	}
}

export function getStoredUser(): StoredUser | null {
	const raw = read(USER_KEY);
	console.log("getStoredUser raw:", raw);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as StoredUser;
	} catch {
		return null;
	}
}

export function getAccessToken() {
	return read(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
	return read(REFRESH_TOKEN_KEY);
}

export function getTokenExpiry(): number | null {
	const raw = read(TOKEN_EXPIRY_KEY);
	if (!raw) return null;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function isSessionExpired(bufferMs = 0) {
	const expiry = getTokenExpiry();
	if (!expiry) return true;
	return Date.now() + bufferMs >= expiry;
}

export function clearSession() {
	remove(USER_KEY);
	remove(ACCESS_TOKEN_KEY);
	remove(REFRESH_TOKEN_KEY);
	remove(TOKEN_EXPIRY_KEY);
	if (hasWindow()) {
		window.dispatchEvent(new Event(AUTH_EVENT));
	}
}
