const PS_PROFILE =
  "https://api-ps4.warframe.com/cdn/getProfileViewingData.php?playerId=";

const PC_PROFILE =
  "https://api.warframe.com/cdn/getProfileViewingData.php?playerId=";

const ALLOWED_ORIGIN =
  "https://mc9yhdnvpv-cmyk.github.io";

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "null";

  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: corsHeaders(origin),
  });
}

function validUserId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id || "");
}

function truncate(value, max = 2000) {
  const s = String(value ?? "");
  return s.length > max ? s.slice(0, max) + "...[truncated]" : s;
}

async function getProfile(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "Warframe-Companion-ReadOnly-Sync",
    },
    redirect: "follow",
  });

  const text = await response.text();

  let data = null;
  let parseError = null;

  try {
    data = JSON.parse(text);
  } catch (err) {
    parseError = String(err?.message || err);
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    text,
    data,
    parseError,
  };
}

function findPcAccountId(text) {
  if (!text) return null;

  const patterns = [
    /Retry\s+with\s+PC\s+account[^a-fA-F0-9]*([a-fA-F0-9]{24})/i,
    /PC\s+account[^a-fA-F0-9]*([a-fA-F0-9]{24})/i,
    /([a-fA-F0-9]{24})/,
  ];

  for (const pattern of patterns) {
    const match = String(text).match(pattern);
    if (match) return match[1];
  }

  return null;
}

function looksLikeProfile(data) {
  return !!(
    data &&
    typeof data === "object" &&
    (
      Array.isArray(data.Results) ||
      Array.isArray(data.results) ||
      data.LoadOutInventory ||
      data.loadOutInventory ||
      data.DisplayName ||
      data.displayName
    )
  );
}

function diagnostic(result) {
  return {
    ok: result.ok,
    status: result.status,
    statusText: result.statusText,
    finalUrl: result.finalUrl,
    contentType: result.contentType,
    parsedJson: result.data !== null,
    parseError: result.parseError,
    bodyPreview: truncate(result.text),
  };
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

    if (url.pathname === "/health") {
      return json(
        {
          ok: true,
          mode: "read-only",
          service: "Warframe Companion Sync",
          diagnostics: true,
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
      const ps = await getProfile(
        PS_PROFILE + encodeURIComponent(userId)
      );

      if (ps.ok && looksLikeProfile(ps.data)) {
        return json(
          {
            ok: true,
            platform: "PlayStation",
            canonicalUserId: userId,
            profile: ps.data,
            diagnostics: {
              playstation: diagnostic(ps),
            },
          },
          200,
          origin
        );
      }

      const combinedPsText =
        ps.text + "\n" + JSON.stringify(ps.data || {});

      const pcId = findPcAccountId(combinedPsText);

      if (pcId && validUserId(pcId) && pcId !== userId) {
        const pc = await getProfile(
          PC_PROFILE + encodeURIComponent(pcId)
        );

        if (pc.ok && looksLikeProfile(pc.data)) {
          return json(
            {
              ok: true,
              platform: "PC / Cross-Save",
              canonicalUserId: pcId,
              profile: pc.data,
              diagnostics: {
                playstation: diagnostic(ps),
                detectedPcAccountId: pcId,
                pc: diagnostic(pc),
              },
            },
            200,
            origin
          );
        }

        return json(
          {
            ok: false,
            error: "Cross-Save PC profile could not be retrieved.",
            detail:
              "A PC/Cross-Save account ID was detected, but the PC endpoint did not return a readable profile.",
            diagnostics: {
              playstation: diagnostic(ps),
              detectedPcAccountId: pcId,
              pc: diagnostic(pc),
            },
          },
          502,
          origin
        );
      }

      const pcFallback = await getProfile(
        PC_PROFILE + encodeURIComponent(userId)
      );

      if (pcFallback.ok && looksLikeProfile(pcFallback.data)) {
        return json(
          {
            ok: true,
            platform: "PC / Cross-Save",
            canonicalUserId: userId,
            profile: pcFallback.data,
            diagnostics: {
              playstation: diagnostic(ps),
              detectedPcAccountId: pcId,
              pcFallback: diagnostic(pcFallback),
            },
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
            "The account ID was accepted, but neither the PlayStation nor PC endpoint returned a readable profile.",
          diagnostics: {
            playstation: diagnostic(ps),
            detectedPcAccountId: pcId,
            pcFallback: diagnostic(pcFallback),
          },
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
          stack: truncate(error?.stack || "", 3000),
        },
        500,
        origin
      );
    }
  },
};
