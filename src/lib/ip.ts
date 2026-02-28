import { createHash } from "crypto";
import { headers } from "next/headers";

export async function getIpHash(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const real = h.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || real || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}
