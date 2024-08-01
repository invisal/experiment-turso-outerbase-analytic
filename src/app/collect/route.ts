import { createClient } from "libsql-stateless-easy";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "tid";

export const POST = async (req: NextRequest) => {
  const userAgent = req.headers.get("User-Agent");
  const country = req.headers.get("X-Vercel-IP-Country") ?? "US";
  const ip = req.ip;
  const timestamp = Math.floor(Date.now() / 1000);
  const body = await req.json();
  const platform = (req.headers.get("sec-ch-ua-platform") ?? "").replaceAll(
    '"',
    ""
  );

  let sessionToken = req.cookies.get(COOKIE_NAME)?.value;
  const res = NextResponse.json({
    country,
    platform,
  });

  if (!sessionToken) {
    sessionToken = crypto.randomUUID();
    res.cookies.set(COOKIE_NAME, sessionToken);
  }

  const path = body?.path ?? "/";
  const referrer = body?.referrer ?? null;
  let referrerHost = null;

  if (referrer) {
    try {
      const refererUrl = new URL(referrer);
      referrerHost = refererUrl.host;
    } catch {}
  }

  const client = createClient({
    url: process.env.DATABASE_URL ?? "",
    authToken: process.env.DATABASE_TOKEN,
  });

  try {
    await client.batch([
      {
        sql: "INSERT INTO page_view(session_id, user_agent, country, ip, created_at, path, referrer, referrer_host, platform) VALUES(:session_id, :user_agent, :country, :ip, :created_at, :path, :referrer, :referrer_host, :platform)",
        args: {
          session_id: sessionToken,
          user_agent: userAgent,
          country,
          ip: ip ?? null,
          created_at: timestamp,
          path,
          referrer: referrer ?? null,
          platform,
          referrer_host: referrerHost,
        },
      },
      {
        sql: "INSERT INTO session(session_id, last_visited_at) VALUES(:session_id, :last_visited_at) ON CONFLICT(session_id) DO UPDATE SET last_visited_at = :last_visited_at",
        args: {
          session_id: sessionToken,
          last_visited_at: timestamp,
        },
      },
    ]);
  } catch (e) {
    console.error(e);
  }

  return res;
};
