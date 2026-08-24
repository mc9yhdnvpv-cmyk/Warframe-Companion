const PS_PROFILE =
  "https://api-ps4.warframe.com/cdn/getProfileViewingData.php?playerId=";

const PC_PROFILE =
  "https://api.warframe.com/cdn/getProfileViewingData.php?playerId=";

// Your GitHub Pages site
const ALLOWED_ORIGIN =
  "https://mc9yhdnvpv-cmyk.github.io";

function corsHeaders(origin) {
  const allowed =
    origin === ALLOWED_ORIGIN ||
    origin === "null";

  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Cache-Control": "public, max-age=300",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

function validUserId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id || "");
}

async function getProfile(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Warframe-Companion-ReadOnly-Sync",
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    // Keep raw text so we can inspect Cross-Save responses.
  }

  return {
    ok: response.ok,
    status: response.status,
    text,
    data,
  };
}

function findPcAccountId(text) {
  if (!text) return null;

  // Handles messages such as:
  // "Retry with PC account: 0123456789abcdef01234567"
  const match = text.match(
    /Retry\s+with\s+PC\s+account[^a-fA-F0-9]*([a-fA-F0-9]{24})/i
  );

  return match ? match[1] : null;
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (request.method !== "GET") {
      return json(
        {
          ok: false,
          error: "Method not allowed.",
        },
        405,
        origin
      );
    }

    const url = new URL(request.url);

    // Simple test endpoint
    if (url.pathname === "/health") {
      return json(
        {
          ok: true,
          mode: "read-only",
          service: "Warframe Companion Sync",
        },
        200,
        origin
      );
    }

    if (url.pathname !== "/profile") {
      return json(
        {
          ok: false,
          error: "Not found.",
          detail: "Use /profile?userId=YOUR_24_CHARACTER_ID",
        },
        404,
        origin
      );
    }

    const userId = (url.searchParams.get("userId") || "").trim();

    if (!validUserId(userId)) {
      return json(
        {
          ok: false,
          error: "Invalid account ID.",
          detail:
            "Warframe account ID must contain exactly 24 hexadecimal characters.",
        },
        400,
        origin
      );
    }

    try {
      // First try PlayStation.
      const ps = await getProfile(
        PS_PROFILE + encodeURIComponent(userId)
      );

      if (ps.ok && ps.data && ps.data.Results) {
        return json(
          {
            ok: true,
            platform: "PlayStation",
            canonicalUserId: userId,
            profile: ps.data,
          },
          200,
          origin
        );
      }

      // Cross-Save PlayStation responses may tell us
      // to retry using the associated PC account.
      const pcId =
        findPcAccountId(ps.text) ||
        findPcAccountId(JSON.stringify(ps.data || {}));

      if (pcId && validUserId(pcId)) {
        const pc = await getProfile(
          PC_PROFILE + encodeURIComponent(pcId)
        );

        if (pc.ok && pc.data && pc.data.Results) {
          return json(
            {
              ok: true,
              platform: "PC / Cross-Save",
              canonicalUserId: pcId,
              profile: pc.data,
            },
            200,
            origin
          );
        }
      }

      // If no redirect was provided, try the same ID
      // against the PC endpoint as a fallback.
      const pcFallback = await getProfile(
        PC_PROFILE + encodeURIComponent(userId)
      );

      if (
        pcFallback.ok &&
        pcFallback.data &&
        pcFallback.data.Results
      ) {
        return json(
          {
            ok: true,
            platform: "PC / Cross-Save",
            canonicalUserId: userId,
            profile: pcFallback.data,
          },
          200,
          origin
        );
      }

      return json(
        {
          ok: false,
          error: "Warframe profile could not be retrieved.",
          detail:
            "The account ID was accepted, but no readable PlayStation or Cross-Save profile was returned.",
        },
        502,
        origin
      );
    } catch (error) {
      return json(
        {
          ok: false,
          error: "Sync service error.",
          detail: String(error?.message || error),
        },
        500,
        origin
      );
    }
  },
};
