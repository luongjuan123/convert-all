import { MetadataRoute } from "next";
import { siteConfig, TOOLS_LIST } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.domain;
  const now = new Date();

  const toolPages = TOOLS_LIST.map((tool) => ({
    url: `${baseUrl}/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: tool.popular ? 0.9 : 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...toolPages,
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];
}
