// Per-field validation messages from an API error: { errors: { message, fields: { field: "msg" } } }.
export const apiFieldErrors = (err: any): Record<string, string> => {
    const data = err?.response?.data ?? err;
    const fields = data?.errors?.fields;
    if (!fields || typeof fields !== "object") return {};
    return Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key.replace(/^data\./, ""), Array.isArray(value) ? String(value[0]) : String(value)]),
    );
};

/**
 * Show API field errors under the matching form inputs. Returns the messages that have no
 * matching input (show those in a toast).
 */
export const applyApiFieldErrors = (
    err: any,
    knownFields: readonly string[],
    setError: (field: any, error: { type: string; message: string }, options: { shouldFocus: boolean }) => void,
): string[] => {
    const unmatched: string[] = [];
    let focused = false;
    for (const [field, message] of Object.entries(apiFieldErrors(err))) {
        if (knownFields.includes(field)) {
            setError(field, { type: "server", message }, { shouldFocus: !focused });
            focused = true;
        } else {
            unmatched.push(message);
        }
    }
    return unmatched;
};
