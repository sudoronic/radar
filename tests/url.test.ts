import {expect,test} from "vitest";
import {publicUrl,safeReturn} from "@/lib/utils/url";
test("rejects unsafe external links and redirects",()=>{for(const u of ["javascript:alert(1)","http://example.com","https://127.0.0.1","https://[::1]","https://x.local","https://user:pass@example.com"]) expect(publicUrl(u)).toBeNull();expect(publicUrl("https://example.com/apply")).toBe("https://example.com/apply");expect(safeReturn("//evil.com")).toBe("/for-you");expect(safeReturn("/onboarding")).toBe("/onboarding");});
