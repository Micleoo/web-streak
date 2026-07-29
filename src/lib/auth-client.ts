import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:5173/api/auth" // using vite proxy
});

export const { signIn, signUp, signOut, useSession } = authClient;
