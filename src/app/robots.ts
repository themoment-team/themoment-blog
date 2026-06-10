import { SITE_URL } from "@shared/config/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/write", "/edit/", "/api/", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
