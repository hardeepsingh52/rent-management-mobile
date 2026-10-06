const GENERIC_MESSAGE = "Something went wrong. Please try again.";

// An API failure that keeps the individual messages (and, for ASP.NET model
// validation, which field each one belongs to) so forms can show them inline.
// `message` is still the joined text, so code that only reads it keeps working.
export class ApiError extends Error {
  messages: string[];
  fieldErrors: Record<string, string[]>;

  constructor(messages: string[], fieldErrors: Record<string, string[]> = {}) {
    super(messages.join(" ") || GENERIC_MESSAGE);
    this.name = "ApiError";
    this.messages = messages;
    this.fieldErrors = fieldErrors;
  }
}

export async function extractApiError(response: Response): Promise<ApiError> {
  const text = (await response.text()).trim();
  if (!text) {
    return new ApiError([GENERIC_MESSAGE]);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // Controllers returning BadRequest("message") send plain text, not JSON.
    return new ApiError([text.length <= 300 ? text : GENERIC_MESSAGE]);
  }

  if (typeof data === "string") {
    return new ApiError([data]);
  }
  if (Array.isArray(data)) {
    return new ApiError(data.map(String));
  }
  if (data && typeof data === "object" && "errors" in data) {
    const errors = (data as { errors?: Record<string, string[] | string> })
      .errors;
    if (errors && typeof errors === "object") {
      const fieldErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(errors)) {
        fieldErrors[key] = Array.isArray(value) ? value : [value];
      }
      return new ApiError(Object.values(fieldErrors).flat(), fieldErrors);
    }
  }
  return new ApiError([GENERIC_MESSAGE]);
}

export async function extractErrorMessage(response: Response): Promise<string> {
  return (await extractApiError(response)).message;
}

// Sorts server messages into per-field messages (using the regexes in
// `matchers`) and a leftover list for the form-level banner.
export function splitServerErrors<K extends string>(
  error: unknown,
  matchers: Partial<Record<K, RegExp>>,
  fallback: string,
): { fields: Partial<Record<K, string>>; rest: string[] } {
  const fields: Partial<Record<K, string>> = {};
  const rest: string[] = [];
  const keys = Object.keys(matchers) as K[];

  function place(text: string, hint: string) {
    const field = keys.find((k) => matchers[k]?.test(hint));
    if (field) {
      fields[field] ??= text;
    } else {
      rest.push(text);
    }
  }

  if (!(error instanceof ApiError)) {
    rest.push(error instanceof Error ? error.message : fallback);
    return { fields, rest };
  }

  const keyedMessages = new Set<string>();
  for (const [key, messages] of Object.entries(error.fieldErrors)) {
    // Keys look like "Bedrooms" or "$.bedrooms"; keep only the last segment.
    const name = key.split(".").pop() ?? key;
    for (const message of messages) {
      keyedMessages.add(message);
      place(message, `${name} ${message}`);
    }
  }
  for (const message of error.messages) {
    if (!keyedMessages.has(message)) {
      place(message, message);
    }
  }
  return { fields, rest };
}
