import type { ActionResult } from "@/types";

type HttpMethod = "POST" | "PUT" | "DELETE";

async function parseActionResult<T>(
  response: Response
): Promise<ActionResult<T>> {
  const data = await response.json().catch(() => null);

  if (data && typeof data.success === "boolean") {
    return data;
  }

  if (data && typeof data.error === "string") {
    return { success: false, error: data.error };
  }

  if (!response.ok) {
    return { success: false, error: response.statusText || "Request failed" };
  }

  return { success: false, error: "Unexpected response" };
}

export async function submitForm<T>(
  url: string,
  method: HttpMethod,
  formData?: FormData
): Promise<ActionResult<T>> {
  const response = await fetch(url, {
    method,
    body: formData,
  });

  return parseActionResult<T>(response);
}

export async function submitJson<T>(
  url: string,
  method: HttpMethod,
  body?: unknown
): Promise<ActionResult<T>> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parseActionResult<T>(response);
}
