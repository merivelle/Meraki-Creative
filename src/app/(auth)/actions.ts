"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { safeNext } from "@/lib/labels";
import { clientIpHash, rateLimit } from "@/lib/security/abuse";

export type AuthState = { error?: string; message?: string };

export async function signIn(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(String(fd.get("next") ?? ""));
  if (!email || !password) return { error: "Enter your email and password." };
  if (!(await rateLimit(`signin:${await clientIpHash()}`, 900, 20))) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Same message for unknown email and wrong password.
  if (error) return { error: "That email and password don't match an account." };
  redirect(next);
}

export async function requestPasswordReset(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const generic = { message: "If there's an account for that email, a reset link is on its way. It expires in an hour." };
  if (!email) return { error: "Enter your email." };
  if (!(await rateLimit(`reset:${await clientIpHash()}`, 3600, 5))) return generic;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv.siteUrl}/auth/confirm?next=/account/set-password`,
  });
  // Never reveal whether the email exists.
  return generic;
}

export async function setPassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const next = safeNext(String(fd.get("next") ?? ""));
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { error: "Include upper and lower case letters and a number." };
  }
  if (password !== confirm) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your link has expired. Request a new one from the sign-in page." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  await createAdminClient().from("profiles").update({ password_set_at: new Date().toISOString() }).eq("id", user.id);
  redirect(next);
}
