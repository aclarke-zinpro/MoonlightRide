import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

// Uses SITE_URL, which is validated at request time rather than during the build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const site = getEnv().SITE_URL;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/register/cancel", "/unsubscribe", "/subscribe"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
