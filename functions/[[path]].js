/**
 * CLOUDFLARE WORKER (WITH ASSETS)
 * Handles: audio proxy, R2 assets, content API proxy, user OAuth, user API proxy.
 * Secrets (QURAN_CLIENT_ID, QURAN_CLIENT_SECRET) must be set via:
 *   wrangler pages secret put QURAN_CLIENT_ID
 *   wrangler pages secret put QURAN_CLIENT_SECRET
 */

const AUTH_ENDPOINT = "https://oauth2.quran.foundation";
const API_BASE = "https://apis.quran.foundation";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-session-id",
    "Access-Control-Allow-Credentials": "true",
  };
}

function jsonResponse(data, status = 200, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function generateSessionId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cache = caches.default;
    const origin = request.headers.get("Origin") || url.origin;
    const CLIENT_ID = env.QURAN_CLIENT_ID;
    const CLIENT_SECRET = env.QURAN_CLIENT_SECRET;

    // Handle CORS preflight for all API/auth routes
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ──────────────────────────────────────────
    // 1. Audio Proxying (No Auth)
    // ──────────────────────────────────────────
    if (url.pathname.startsWith("/audio-proxy")) {
      try {
        let audioPath = url.pathname.replace("/audio-proxy", "");
        if (audioPath.startsWith("/")) audioPath = audioPath.substring(1);

        let targetAudioUrl;
        if (
          audioPath.includes("quranicaudio.com") ||
          audioPath.includes("audio.quran.com") ||
          audioPath.includes("everyayah.com")
        ) {
          targetAudioUrl = `https://${audioPath}${url.search}`;
        } else {
          targetAudioUrl = `https://verses.quran.com/${audioPath}${url.search}`;
        }

        let res = await fetch(targetAudioUrl);

        if (res.status === 404 && !audioPath.includes("quranicaudio.com")) {
          const fallbackUrl = `https://mirrors.quranicaudio.com/${audioPath}${url.search}`;
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) res = fallbackRes;
        }

        const audioResponse = new Response(res.body, res);
        audioResponse.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        audioResponse.headers.set("Access-Control-Allow-Origin", "*");
        return audioResponse;
      } catch (e) {
        return new Response("Audio Proxy Error", { status: 502 });
      }
    }

    // ──────────────────────────────────────────
    // 2. R2 Proxying (Assets & Data)
    // ──────────────────────────────────────────
    if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/data/")) {
      const key = decodeURIComponent(url.pathname.substring(1));

      try {
        if (env.MY_BUCKET && (request.method === "GET" || request.method === "HEAD")) {
          const object = await env.MY_BUCKET.get(key, {
            onlyIf: request.headers,
            range: request.headers,
          });

          if (object === null) {
            return await env.ASSETS.fetch(request);
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Cache-Control", "public, max-age=31536000, immutable");

          if (key.endsWith(".mp4")) headers.set("Content-Type", "video/mp4");
          if (key.endsWith(".m4a")) headers.set("Content-Type", "audio/mp4");

          if (!("body" in object)) {
            if (request.headers.get("If-None-Match") === object.httpEtag) {
              return new Response(null, { status: 304, headers });
            }
            return new Response(null, { status: 412, headers });
          }

          return new Response(object.body, {
            status: request.method === "GET" ? 200 : 204,
            headers,
          });
        }

        if (env.MY_BUCKET && (request.method === "PUT" || request.method === "DELETE")) {
          if (request.headers.get("X-Custom-Auth-Key") !== env.AUTH_KEY_SECRET) {
            return new Response("Forbidden", { status: 403 });
          }
          if (request.method === "PUT") {
            await env.MY_BUCKET.put(key, request.body, {
              onlyIf: request.headers,
              httpMetadata: request.headers,
            });
            return new Response(`Put ${key} successfully!`);
          } else {
            await env.MY_BUCKET.delete(key);
            return new Response("Deleted!");
          }
        }
      } catch (e) {
        return new Response(`R2 Error`, { status: 500 });
      }
    }

    // ──────────────────────────────────────────
    // 3. Content API Proxying (Machine Auth)
    // ──────────────────────────────────────────
    if (url.pathname.startsWith("/api-proxy")) {
      try {
        if (!url.searchParams.has("refresh")) {
          let cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;
        }

        async function getFreshToken() {
          const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
          const authRes = await fetch(`${AUTH_ENDPOINT}/oauth2/token`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials&scope=content"
          });
          const data = await authRes.json();
          await env.QURAN_CACHE.put("current_token", data.access_token, { expirationTtl: 3300 });
          return data.access_token;
        }

        let token = await env.QURAN_CACHE.get("current_token");
        if (!token) token = await getFreshToken();

        const apiPath = url.pathname.replace("/api-proxy", "");
        const targetUrl = `${API_BASE}${apiPath}${url.search}`;

        let apiRes = await fetch(targetUrl, {
          headers: {
            "x-auth-token": token,
            "x-client-id": CLIENT_ID,
            "Accept": "application/json"
          }
        });

        if (apiRes.status === 403) {
          const clonedRes = apiRes.clone();
          const errorBody = await clonedRes.json();
          if (errorBody.type === "invalid_token" || errorBody.message?.includes("expired")) {
            token = await getFreshToken();
            apiRes = await fetch(targetUrl, {
              headers: { "x-auth-token": token, "x-client-id": CLIENT_ID, "Accept": "application/json" }
            });
          }
        }

        const finalResponse = new Response(apiRes.body, apiRes);
        finalResponse.headers.set("Access-Control-Allow-Origin", "*");

        if (apiRes.ok) {
          finalResponse.headers.set("Cache-Control", "public, max-age=604800");
          ctx.waitUntil(cache.put(request, finalResponse.clone()));
        }
        return finalResponse;
      } catch (e) {
        return new Response("API Proxy Error", { status: 502 });
      }
    }

    // ──────────────────────────────────────────
    // 4. User OAuth: Login redirect
    // ──────────────────────────────────────────
    if (url.pathname === "/auth/login") {
      const state = generateSessionId();
      const redirectUri = `${url.origin}/auth/callback`;

      // Store state in KV for CSRF validation (5 min TTL)
      await env.QURAN_CACHE.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });

      const authUrl = new URL(`${AUTH_ENDPOINT}/oauth2/auth`);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "openid offline_access bookmark collection");
      authUrl.searchParams.set("state", state);

      return Response.redirect(authUrl.toString(), 302);
    }

    // ──────────────────────────────────────────
    // 5. User OAuth: Callback (exchange code for tokens)
    // ──────────────────────────────────────────
    if (url.pathname === "/auth/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      // Handle OAuth errors (user denied, etc.)
      if (error) {
        const redirectUrl = new URL(url.origin);
        redirectUrl.searchParams.set("auth_error", error);
        return Response.redirect(redirectUrl.toString(), 302);
      }

      if (!code || !state) {
        return jsonResponse({ error: "Missing code or state" }, 400, origin);
      }

      // Validate state to prevent CSRF
      const storedState = await env.QURAN_CACHE.get(`oauth_state:${state}`);
      if (!storedState) {
        return jsonResponse({ error: "Invalid or expired state" }, 403, origin);
      }
      await env.QURAN_CACHE.delete(`oauth_state:${state}`);

      // Exchange code for tokens
      const redirectUri = `${url.origin}/auth/callback`;
      const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

      const tokenRes = await fetch(`${AUTH_ENDPOINT}/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("Token exchange failed:", errBody);
        const redirectUrl = new URL(url.origin);
        redirectUrl.searchParams.set("auth_error", "token_exchange_failed");
        return Response.redirect(redirectUrl.toString(), 302);
      }

      const tokenData = await tokenRes.json();
      const sessionId = generateSessionId();

      // Store tokens server-side in KV (keyed by session ID)
      // access_token typically expires in ~1 hour; refresh_token is long-lived
      const sessionData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        id_token: tokenData.id_token,
        expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
      };

      await env.QURAN_CACHE.put(
        `user_session:${sessionId}`,
        JSON.stringify(sessionData),
        { expirationTtl: 30 * 24 * 3600 } // 30 days
      );

      // Redirect back to app with session ID as URL param
      // The frontend will save it to localStorage and clear from URL
      const redirectUrl = new URL(url.origin);
      redirectUrl.searchParams.set("session_id", sessionId);
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // ──────────────────────────────────────────
    // 6. User OAuth: Session check
    // ──────────────────────────────────────────
    if (url.pathname === "/auth/session") {
      const sessionId = request.headers.get("x-session-id");
      if (!sessionId) {
        return jsonResponse({ authenticated: false }, 200, origin);
      }

      const raw = await env.QURAN_CACHE.get(`user_session:${sessionId}`);
      if (!raw) {
        return jsonResponse({ authenticated: false }, 200, origin);
      }

      const session = JSON.parse(raw);

      // Decode the id_token to get basic user info (it's a JWT)
      let userInfo = null;
      if (session.id_token) {
        try {
          const payload = session.id_token.split(".")[1];
          const decoded = JSON.parse(atob(payload));
          userInfo = {
            sub: decoded.sub,
            name: decoded.name || decoded.preferred_username || null,
            email: decoded.email || null,
          };
        } catch { /* ignore decode errors */ }
      }

      return jsonResponse({ authenticated: true, user: userInfo }, 200, origin);
    }

    // ──────────────────────────────────────────
    // 7. User OAuth: Logout
    // ──────────────────────────────────────────
    if (url.pathname === "/auth/logout") {
      const sessionId = request.headers.get("x-session-id");
      if (sessionId) {
        await env.QURAN_CACHE.delete(`user_session:${sessionId}`);
      }
      return jsonResponse({ success: true }, 200, origin);
    }

    // ──────────────────────────────────────────
    // 8. User API Proxy (User-scoped, requires session)
    // ──────────────────────────────────────────
    if (url.pathname.startsWith("/user-api-proxy")) {
      const sessionId = request.headers.get("x-session-id");
      if (!sessionId) {
        return jsonResponse({ error: "Not authenticated" }, 401, origin);
      }

      const raw = await env.QURAN_CACHE.get(`user_session:${sessionId}`);
      if (!raw) {
        return jsonResponse({ error: "Session expired" }, 401, origin);
      }

      let session = JSON.parse(raw);

      // Refresh token if expired
      if (Date.now() >= session.expires_at && session.refresh_token) {
        const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
        const refreshRes = await fetch(`${AUTH_ENDPOINT}/oauth2/token`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: session.refresh_token,
          }).toString(),
        });

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json();
          session.access_token = newTokens.access_token;
          session.expires_at = Date.now() + (newTokens.expires_in || 3600) * 1000;
          if (newTokens.refresh_token) session.refresh_token = newTokens.refresh_token;
          if (newTokens.id_token) session.id_token = newTokens.id_token;

          await env.QURAN_CACHE.put(
            `user_session:${sessionId}`,
            JSON.stringify(session),
            { expirationTtl: 30 * 24 * 3600 }
          );
        } else {
          // Refresh failed — session is dead
          await env.QURAN_CACHE.delete(`user_session:${sessionId}`);
          return jsonResponse({ error: "Session expired, please log in again" }, 401, origin);
        }
      }

      // Proxy the request to the Quran Foundation User API
      const apiPath = url.pathname.replace("/user-api-proxy", "");
      const targetUrl = `${API_BASE}/auth/v1${apiPath}${url.search}`;

      const proxyHeaders = {
        "x-auth-token": session.access_token,
        "x-client-id": CLIENT_ID,
        "Accept": "application/json",
      };

      // Forward body for POST/PUT/PATCH
      let body = null;
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        body = await request.text();
        proxyHeaders["Content-Type"] = request.headers.get("Content-Type") || "application/json";
      }

      const apiRes = await fetch(targetUrl, {
        method: request.method,
        headers: proxyHeaders,
        body,
      });

      const responseBody = await apiRes.text();
      return new Response(responseBody, {
        status: apiRes.status,
        headers: {
          "Content-Type": apiRes.headers.get("Content-Type") || "application/json",
          ...corsHeaders(origin),
        },
      });
    }

    // ──────────────────────────────────────────
    // 9. Default: Static Assets & SPA Routing
    // ──────────────────────────────────────────
    try {
      let response = await env.ASSETS.fetch(request);

      if (response.status === 404 && !url.pathname.includes(".")) {
        const indexRequest = new Request(url.origin + "/index.html", request);
        response = await env.ASSETS.fetch(indexRequest);
      }

      return response;
    } catch (e) {
      return new Response("Asset Fetch Error", { status: 500 });
    }
  }
};
