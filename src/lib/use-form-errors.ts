import { useCallback, useState } from "react";
import { splitServerErrors } from "./api-error";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

// Tracks one error message per field, so a failed check never touches the
// values the user has typed.
export function useFormErrors<K extends string>() {
  const [errors, setErrors] = useState<FieldErrors<K>>({});

  const setError = useCallback((key: K, message: string | null) => {
    setErrors((current) => {
      if ((current[key] ?? null) === message) {
        return current;
      }
      return { ...current, [key]: message ?? undefined };
    });
  }, []);

  const clearError = useCallback((key: K) => setError(key, null), [setError]);

  // Runs every rule at once so all problems show together. Rules are listed in
  // form order: `onFirstInvalid` receives the first failing field (e.g. to
  // scroll to it). Returns true when nothing failed.
  const validate = useCallback(
    (
      rules: Record<K, string | null>,
      onFirstInvalid?: (field: K) => void,
    ): boolean => {
      const next: FieldErrors<K> = {};
      let first: K | null = null;
      for (const key of Object.keys(rules) as K[]) {
        const message = rules[key];
        if (message) {
          next[key] = message;
          first ??= key;
        }
      }
      setErrors(next);
      if (first) {
        onFirstInvalid?.(first);
      }
      return first === null;
    },
    [],
  );

  // Shows each server message under the field it names and returns the text
  // for anything it couldn't place (for the form-level banner), or null.
  const applyServerErrors = useCallback(
    (
      error: unknown,
      matchers: Partial<Record<K, RegExp>>,
      fallback: string,
      onFirstInvalid?: (field: K) => void,
    ): string | null => {
      const { fields, rest } = splitServerErrors(error, matchers, fallback);
      const placed = Object.keys(fields) as K[];
      if (placed.length > 0) {
        setErrors((current) => ({ ...current, ...fields }));
        onFirstInvalid?.(placed[0]);
      }
      return rest.length > 0 ? rest.join(" ") : null;
    },
    [],
  );

  return { errors, setError, clearError, validate, applyServerErrors };
}
