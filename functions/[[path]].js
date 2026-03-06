/**
 * CLOUDFLARE EDGE PROXY - ULTRA DEBUG MODE
 * This version forces token refreshes and prevents error caching.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cache = caches.default;

  // 1. Audio Proxying (Bypass Auth)
  if (url.pathname.startsWith("/audio-proxy")) {
    // Remove prefix and handle leading slash carefully
    let audioPath = url.pathname.replace("/audio-proxy", "");
    if (audioPath.startsWith("/")) audioPath = audioPath.substring(1);
    
    // Logic: If the path starts with a known domain mirror, use it directly. 
    // Otherwise, default to verses.quran.com.
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
    
    console.log(`[Audio Proxy] Fetching: ${targetAudioUrl}`);
    let res = await fetch(targetAudioUrl);
    
    // Fallback: If 404 on verses.quran.com, try the mirror
    if (res.status === 404 && !audioPath.includes("quranicaudio.com")) {
      const fallbackUrl = `https://mirrors.quranicaudio.com/${audioPath}${url.search}`;
      console.log(`[Audio Proxy] 404 Primary, trying fallback: ${fallbackUrl}`);
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) res = fallbackRes;
    }

    // Return the response with caching headers
    const audioResponse = new Response(res.body, res);
    audioResponse.headers.set("Cache-Control", "public, max-age=2592000");
    audioResponse.headers.set("Access-Control-Allow-Origin", "*");
    return audioResponse;
  }

  // 2. API Proxying (Authenticated)
  if (url.pathname.startsWith("/api-proxy")) {
    console.log(`\n--- [Proxy Debug Start: ${url.pathname}] ---`);
    
    // Check Global CDN Cache (Only if not explicitly bypassed)
    if (!url.searchParams.has("refresh")) {
      let cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log("[Proxy] CDN Cache Hit");
        return cachedResponse;
      }
    }

    const CLIENT_ID = "02b6a41f-d00a-475d-beae-82d5185d6907";
    const CLIENT_SECRET = "QaYhiKIibWpADvYztiAt.ebmIY";
    const AUTH_ENDPOINT = "https://oauth2.quran.foundation";

    async function getFreshToken() {
      console.log("[Proxy] Requesting NEW token from Auth Server...");
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
      if (!authRes.ok) {
        console.error("[Proxy] AUTH SERVER ERROR:", data);
        throw new Error("Auth Failed");
      }
      
      console.log("[Proxy] Token Acquired. First 10 chars:", data.access_token.substring(0, 10));
      // Save to KV with a shorter TTL for safety
      await env.QURAN_CACHE.put("current_token", data.access_token, { expirationTtl: 3500 });
      return data.access_token;
    }

    let token = await env.QURAN_CACHE.get("current_token");
    if (!token) {
      console.log("[Proxy] No token in KV.");
      token = await getFreshToken();
    } else {
      console.log("[Proxy] Found token in KV.");
    }

    const apiPath = url.pathname.replace("/api-proxy", "");
    const targetUrl = `https://apis.quran.foundation${apiPath}${url.search}`;
    
    async function attemptFetch(activeToken) {
      console.log(`[Proxy] Fetching: ${targetUrl}`);
      return await fetch(targetUrl, {
        headers: {
          "x-auth-token": activeToken,
          "x-client-id": CLIENT_ID,
          "Accept": "application/json"
        }
      });
    }

    let apiRes = await attemptFetch(token);
    console.log(`[Proxy] Upstream Status: ${apiRes.status}`);

    // If 403, we MUST check the body to see if it's a token issue
    if (apiRes.status === 403) {
      const clonedRes = apiRes.clone();
      const errorBody = await clonedRes.json();
      console.log("[Proxy] 403 Error Body:", errorBody);

      if (errorBody.type === "invalid_token" || errorBody.message.includes("expired")) {
        console.log("[Proxy] FORCING TOKEN REFRESH...");
        token = await getFreshToken();
        apiRes = await attemptFetch(token);
        console.log(`[Proxy] Retry Status: ${apiRes.status}`);
      }
    }

    // Prepare response
    const finalResponse = new Response(apiRes.body, apiRes);
    finalResponse.headers.set("Access-Control-Allow-Origin", "*");
    
    // CRITICAL: If the response is still an error, tell the browser NOT to cache it
    if (!apiRes.ok) {
      finalResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    } else {
      finalResponse.headers.set("Cache-Control", "public, max-age=604800");
      // Only cache successful responses in the Global CDN
      context.waitUntil(cache.put(request, finalResponse.clone()));
    }

    console.log("--- [Proxy Debug End] ---\n");
    return finalResponse;
  }

  return context.next();
}
