/**
 * Quran Foundation User API Client
 * All requests go through /user-api-proxy (Cloudflare Worker handles auth)
 */

function getSessionId() {
  return localStorage.getItem("ql_session") || null;
}

async function userFetch(path, options = {}) {
  const sessionId = getSessionId();
  if (!sessionId) throw new Error("Not authenticated");

  const res = await fetch(`/user-api-proxy${path}`, {
    ...options,
    headers: {
      "x-session-id": sessionId,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Session expired — clear it
    localStorage.removeItem("ql_session");
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Bookmarks ───

export async function getBookmarks() {
  return userFetch("/bookmarks");
}

export async function createBookmark(verseKey, collectionId) {
  // API expects key as number and verseNumber separately
  const [chapterId, verseNum] = verseKey.split(":").map(Number);
  const body = {
    key: chapterId,
    verseNumber: verseNum,
    type: "ayah",
    group: "verses_6236",
  };
  // Use the __default__ (Favorites) collection for Quran.com compatibility
  const path = collectionId
    ? `/collections/${collectionId}/bookmarks`
    : "/collections/__default__/bookmarks";
  return userFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteBookmark(bookmarkId) {
  return userFetch(`/bookmarks/${bookmarkId}`, {
    method: "DELETE",
  });
}

export async function getBookmarkCollections() {
  return userFetch("/collections");
}

// ─── Session ───

export async function checkSession() {
  const sessionId = getSessionId();
  if (!sessionId) return { authenticated: false };

  const res = await fetch("/auth/session", {
    headers: { "x-session-id": sessionId },
  });

  return res.json();
}

export function login() {
  window.location.href = "/auth/login";
}

export async function logout() {
  const sessionId = getSessionId();
  if (sessionId) {
    await fetch("/auth/logout", {
      headers: { "x-session-id": sessionId },
    }).catch(() => {});
  }
  localStorage.removeItem("ql_session");
}
