import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";
import { listAllPosts } from "@/server/services/post";

// Built from the database on request, never at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getEnv().SITE_URL;
  const posts = (await listAllPosts()).filter((p) => p.status === "published");
  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/route`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/register`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/updates`, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({
      url: `${site}/updates/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
