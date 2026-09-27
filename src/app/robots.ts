import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Internal tools, private areas and auth flows are never indexed.
        disallow: ["/email-kit/", "/motion/", "/social/", "/portal", "/admin", "/auth", "/invite", "/account", "/login", "/api/"],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}
