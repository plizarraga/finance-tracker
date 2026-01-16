import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  return { userId: session.user.id, session };
}

export function isUnauthorizedError(
  error: unknown
): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}
