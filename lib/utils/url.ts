export function safeReturn(value: string | null) { return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/for-you"; }
export function publicUrl(value: string): string | null {
 try { const u = new URL(value); const h = u.hostname.toLowerCase();
 if (u.protocol !== "https:" || u.username || u.password || u.port || !h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h === "localhost" || h.endsWith(".localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":")) return null;
 u.hash = ""; return u.href;
 } catch { return null; }
}
