import type { Metadata, Viewport } from "next";
import "@/styles/site.css";
import "@/styles/forms.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.merakicreative.co"),
  icons: {
    icon: [
      { url: "/assets/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/assets/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/assets/favicon/site.webmanifest",
};

export const viewport: Viewport = { themeColor: "#F3F2EE" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Same Google Fonts request as the original static site. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
