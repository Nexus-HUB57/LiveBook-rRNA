export interface NotificationPayload {
  title: string;
  content: string;
}

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  console.log(`[Notification] To Owner: ${payload.title}`);
  return true;
}
