import { unstable_rethrow } from "next/navigation";

/**
 * Runs a server action for a form and says whether it worked, so the caller can keep what was
 * typed when it didn't. Next's own interrupts (redirect to login on an expired session,
 * notFound) are passed through untouched rather than shown as a failed save.
 */
export async function submitAction(action: (form: FormData) => Promise<void>, data: FormData): Promise<"ok" | "failed"> {
  try {
    await action(data);
    return "ok";
  } catch (err) {
    unstable_rethrow(err);
    return "failed";
  }
}
