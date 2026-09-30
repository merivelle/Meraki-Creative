/**
 * Real fonts for the design-brief specimens and previews. Google families go through
 * next/font (self-hosted with the build, `preload: false`): the @font-face rules ship with the
 * onboarding CSS, and a browser only downloads a file once text actually uses that face.
 * Satoshi isn't on Google Fonts; it loads from Fontshare (free licence, web use allowed) via
 * <FontshareSatoshi /> only while something on screen uses it.
 */
import {
  Archivo, Archivo_Black, Barlow, Barlow_Condensed, Bebas_Neue, Bodoni_Moda, Bricolage_Grotesque, Caveat,
  Cormorant_Garamond, DM_Sans, DM_Serif_Display, EB_Garamond, Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Sans,
  Instrument_Serif, Inter, Libre_Baskerville, Manrope, Source_Sans_3, Space_Grotesk, Space_Mono, Syne, Work_Sans,
} from "next/font/google";
import type { FontKey } from "@/content/design/typography";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false });
const archivo = Archivo({ subsets: ["latin"], display: "swap", preload: false });
const bodoniModa = Bodoni_Moda({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"] });
const dmSerifDisplay = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, weight: "400", style: ["normal", "italic"] });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, weight: "400", style: ["normal", "italic"] });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], display: "swap", preload: false });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"] });
const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"] });
const workSans = Work_Sans({ subsets: ["latin"], display: "swap", preload: false });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], style: ["normal", "italic"] });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"] });
const bricolageGrotesque = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false });
const syne = Syne({ subsets: ["latin"], display: "swap", preload: false });
const archivoBlack = Archivo_Black({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], display: "swap", preload: false });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], display: "swap", preload: false, weight: ["500", "600", "700"] });
const barlow = Barlow({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600"] });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], display: "swap", preload: false, weight: "400" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600"] });
const spaceMono = Space_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"] });
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false });

const SATOSHI = "'Satoshi', 'Helvetica Neue', Arial, sans-serif";

/** CSS font-family value for each key, pointing at the real loaded face. */
export const FONT: Record<FontKey, string> = {
  inter: inter.style.fontFamily, satoshi: SATOSHI, manrope: manrope.style.fontFamily, sourceSans3: sourceSans3.style.fontFamily,
  spaceGrotesk: spaceGrotesk.style.fontFamily, archivo: archivo.style.fontFamily, bodoniModa: bodoniModa.style.fontFamily,
  dmSerifDisplay: dmSerifDisplay.style.fontFamily, dmSans: dmSans.style.fontFamily, instrumentSerif: instrumentSerif.style.fontFamily,
  instrumentSans: instrumentSans.style.fontFamily, cormorantGaramond: cormorantGaramond.style.fontFamily,
  ebGaramond: ebGaramond.style.fontFamily, workSans: workSans.style.fontFamily, libreBaskerville: libreBaskerville.style.fontFamily,
  fraunces: fraunces.style.fontFamily, bricolageGrotesque: bricolageGrotesque.style.fontFamily, syne: syne.style.fontFamily,
  archivoBlack: archivoBlack.style.fontFamily, ibmPlexSans: ibmPlexSans.style.fontFamily, barlowCondensed: barlowCondensed.style.fontFamily,
  barlow: barlow.style.fontFamily, bebasNeue: bebasNeue.style.fontFamily, ibmPlexMono: ibmPlexMono.style.fontFamily,
  spaceMono: spaceMono.style.fontFamily, caveat: caveat.style.fontFamily,
};

/** Fontshare stylesheet for Satoshi; React hoists and de-duplicates it. */
export function FontshareSatoshi() {
  return <link rel="stylesheet" precedence="default" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" />;
}
