/** Site-wide navigation and identity. Keep the city in titles and schema (local SEO). */
export const PRIMARY_NAV = [
  { href: "/web-design", label: "Web Design" },
  { href: "/post-production", label: "Post-Production" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/start", label: "Start a Project" },
  { href: "/login", label: "Client Login" },
] as const;

export const FOOTER_EXPLORE = [
  { href: "/web-design", label: "Web Design" },
  { href: "/post-production", label: "Post-Production" },
  { href: "/services", label: "All Services" },
  { href: "/packages", label: "Packages" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
] as const;

export const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/merakicreativeofficial/", label: "Instagram" },
  { href: "https://www.imdb.com/name/nm12797336/", label: "IMDb" },
  { href: "https://vimeo.com/merivelle", label: "Vimeo" },
  { href: "https://www.merivelle.net/", label: "merivelle.net" },
] as const;
