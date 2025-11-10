import { fetchFromApi } from "./api";

export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload {
	email: string;
	password: string;
	fullName: string;
	role: UserRole;
	avatarUrl?: string;
	bio?: string;
}

export interface LoginResponse {
	user: {
		id: string;
		email: string;
		name?: string;
		fullName?: string;
		role: UserRole;
		avatarUrl?: string | null;
		bio?: string | null;
	};
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

interface RegisterResponse {
	id: string;
	email: string;
	fullName?: string;
	name?: string;
	role: UserRole;
	avatarUrl?: string;
	bio?: string;
}

export async function loginUser(payload: LoginPayload) {
	const data = await fetchFromApi<LoginResponse>(
		"/auth/login",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false }
	);

	if (!data) {
		throw new Error("Authentication service did not respond.");
	}

	return data;
}

export async function registerUser(payload: RegisterPayload) {
	const data = await fetchFromApi<RegisterResponse>(
		"/users",
		{
			method: "POST",
			body: JSON.stringify(payload),
			cache: "no-store",
		},
		{ fallbackToMock: false }
	);

	if (!data) {
		throw new Error("Registration failed with an empty response.");
	}

	return data;
}
