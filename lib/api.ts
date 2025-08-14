// apps/web/lib/auth.ts

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  // SSR sırasında localStorage yok; o yüzden hafızadaki kopyayı kullan
  if (typeof window === "undefined") return inMemoryToken;
  try {
    return localStorage.getItem("token");
  } catch {
    return inMemoryToken;
  }
}

export function setToken(t: string | null) {
  inMemoryToken = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  }
}

// Basit placeholder: istersen JWT süresi kontrolü ekleyebilirsin
function isExpired(_t: string | null): boolean {
  return false; // şimdilik her zaman geçerli varsayıyoruz
}

/**
 * Token yoksa veya geçersizse yenilemeye çalışır.
 * Backend’in varsa /api/auth/refresh endpoint’ini kullanır.
 * Yoksa no-op (derleme geçsin, akış çalışsın).
 */
export default async function ensureToken(): Promise<void> {
  const t = getToken();
  if (t && !isExpired(t)) return;

  // (Opsiyonel) refresh denemesi — backend’in varsa aç
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.token) setToken(data.token);
    }
  } catch {
    // sessiz geç
  }
}