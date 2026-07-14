// Shared handler for the `{ reauthRequired: true }` response the backend
// returns when an admin's session is too old for a sensitive action. Logs
// out and reloads so AdminGate's own auth check re-prompts for credentials.
export async function handleReauthRequired(data: unknown): Promise<boolean> {
  if (!data || typeof data !== 'object' || !(data as { reauthRequired?: boolean }).reauthRequired) {
    return false;
  }

  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  window.location.reload();
  return true;
}
