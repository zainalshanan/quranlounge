/**
 * CLOUDFLARE WORKER (WITH ASSETS)
 * Optimized for performance: Aggressive caching for R2 assets.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cache = caches.default;

    // 1. Audio Proxying (Bypass Auth)
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

    // 2. R2 Proxying (Assets & Data)
    if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/data/")) {
      const key = decodeURIComponent(url.pathname.substring(1)); 

      try {
        if (env.MY_BUCKET && (request.method === "GET" || request.method === "HEAD")) {
          // Cloudflare R2 get() returns null if not found, 
          // or an object without body if preconditions fail.
          const object = await env.MY_BUCKET.get(key, {
            onlyIf: request.headers,
            range: request.headers,
          });

          if (object === null) {
            // Not in R2, fallback to static assets
            return await env.ASSETS.fetch(request);
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
          
          if (key.endsWith(".mp4")) headers.set("Content-Type", "video/mp4");
          if (key.endsWith(".m4a")) headers.set("Content-Type", "audio/mp4");

          // Standard R2/S3 behavior: 
          // If no body but object exists, precondition failed (likely 304 or 412)
          if (!("body" in object)) {
            // If it's a conditional GET (If-None-Match), return 304
            if (request.headers.get("If-None-Match") === object.httpEtag) {
              return new Response(null, { status: 304, headers });
            }
            // Otherwise it truly failed a precondition
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

    // 3. API Proxying (Authenticated)
    if (url.pathname.startsWith("/api-proxy")) {
      try {
        if (!url.searchParams.has("refresh")) {
          let cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;
        }

        const CLIENT_ID = "02b6a41f-d00a-475d-beae-82d5185d6907";
        const CLIENT_SECRET = "QaYhiKIibWpADvYztiAt.ebmIY";
        const AUTH_ENDPOINT = "https://oauth2.quran.foundation";

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
          await env.QURAN_CACHE.put("current_token", data.access_token, { expirationTtl: 3500 });
          return data.access_token;
        }

        let token = await env.QURAN_CACHE.get("current_token");
        if (!token) token = await getFreshToken();

        const apiPath = url.pathname.replace("/api-proxy", "");
        const targetUrl = `https://apis.quran.foundation${apiPath}${url.search}`;
        
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
          if (errorBody.type === "invalid_token" || errorBody.message.includes("expired")) {
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

    // 4. Default: Static Assets & SPA Routing
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
