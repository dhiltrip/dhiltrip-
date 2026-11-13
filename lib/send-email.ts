/**
 * Sends a copy of a contact message to the DhilTrip inbox through Web3Forms.
 * The access key is meant to be public; Web3Forms only ever delivers to the
 * email address the key was created for.
 */
const ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";

export const emailCopyEnabled = ACCESS_KEY.length > 0;

export async function sendEmailCopy(subject: string, fields: Record<string, string>): Promise<boolean> {
  if (!emailCopyEnabled) return false;
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: ACCESS_KEY, subject, from_name: "DhilTrip website", ...fields }),
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    return response.ok && result?.success === true;
  } catch {
    return false;
  }
}
