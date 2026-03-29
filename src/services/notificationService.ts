import axios from "axios";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
};

export async function sendToUser(
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [userId],
        target_channel: "push",
        contents: { en: body },
        headings: { en: title },
        ttl: 600,
      },
      { headers },
    );
  } catch (err: any) {
    console.error(
      "[OneSignal] sendToUser error:",
      err?.response?.data ?? err.message,
    );
  }
}

export async function sendToAll(title: string, body: string): Promise<void> {
  await axios.post(
    "https://onesignal.com/api/v1/notifications",
    {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["All"],
      contents: { en: body },
      headings: { en: title },
    },
    { headers },
  );
}
