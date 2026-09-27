/** Portfolio media + caption, one variant per layout, matching the original portfolio markup. */
import Link from "next/link";
import type { PortfolioItem } from "@/lib/content/types";

export function WorkMedia({ item }: { item: PortfolioItem }) {
  const cover = item.images.find((i) => i.role === "cover") ?? item.images[0];
  switch (item.layout) {
    case "site":
      return (
        <div className="site-frame">
          <div className="sf-chrome">
            <span className="sf-dot" /><span className="sf-dot" /><span className="sf-dot" />
            <span className="sf-url">{item.urlLabel ?? item.title}</span>
          </div>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.src} alt={cover.alt} width={cover.width ?? 1200} height={cover.height ?? 900} loading="lazy" decoding="async" />
          )}
        </div>
      );
    case "reel":
    case "film":
    case "scene":
      if (item.video?.kind === "file") {
        return (
          <div className="reel" data-reel>
            <video src={item.video.src} poster={item.video.poster} muted loop playsInline preload="metadata" aria-label={item.video.title ?? item.title} />
            <span className="reel-play" />
          </div>
        );
      }
      return <EmbedOrImage item={item} />;
    case "trailer":
      return <EmbedOrImage item={item} />;
    case "grade": {
      const before = item.images.find((i) => i.role === "before");
      const after = item.images.find((i) => i.role === "after");
      if (!before || !after) return <EmbedOrImage item={item} />;
      return (
        <div className="ba" data-ba>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ba-before" src={before.src} alt={before.alt} width={before.width ?? 1600} height={before.height ?? 900} loading="lazy" decoding="async" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ba-after" src={after.src} alt={after.alt} width={after.width ?? 1600} height={after.height ?? 900} loading="lazy" decoding="async" />
          <span className="ba-tag l">Before</span>
          <span className="ba-tag r">After</span>
          <span className="ba-handle" />
        </div>
      );
    }
  }
}

function EmbedOrImage({ item }: { item: PortfolioItem }) {
  if (item.video && item.video.kind !== "file") {
    return (
      <div className="embed">
        <iframe
          src={item.video.src}
          title={item.video.title ?? item.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  const img = item.images[0];
  if (!img) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />;
}

const titleWithType = (item: PortfolioItem) =>
  item.layout === "film" || item.layout === "scene" ? `${item.title} · ${item.typeLabel}` : item.title;

export function WorkCard({ item }: { item: PortfolioItem }) {
  const link = item.videoLinks[0];
  return (
    <figure>
      <WorkMedia item={item} />
      <figcaption className="work-cap2">
        <Link className="t" href={`/work/${item.slug}`}>{titleWithType(item)}</Link>
        {link ? (
          <a href={link.url} className="tag" target="_blank" rel="noopener">{link.label}</a>
        ) : item.typeLabel && item.layout !== "film" && item.layout !== "scene" ? (
          <span className="tag">{item.typeLabel}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}

/** Section headings used on the original portfolio page, in the same order. */
export const WORK_SECTIONS: { layout: PortfolioItem["layout"]; slate: string; heading: string; grid: string; lede?: string }[] = [
  { layout: "reel", slate: "Post-Production", heading: "The reel.", grid: "work-grid-2" },
  { layout: "site", slate: "Digital Presence", heading: "Websites.", grid: "work-grid-3" },
  { layout: "film", slate: "Post-Production", heading: "Films.", grid: "work-grid-2" },
  { layout: "scene", slate: "Editing", heading: "Scenes.", grid: "work-grid-2" },
  { layout: "trailer", slate: "Post-Production", heading: "Trailers.", grid: "work-grid-2" },
  { layout: "grade", slate: "Color", heading: "Color grade, before & after.", grid: "work-grid-2", lede: "Drag to compare the ungraded frame with the final grade." },
];

export function WorkSections({ items }: { items: PortfolioItem[] }) {
  return (
    <>
      {WORK_SECTIONS.map((sec) => {
        const list = items.filter((i) => i.layout === sec.layout);
        if (!list.length) return null;
        return (
          <section className="section" key={sec.layout}>
            <div className="wrap">
              <div className="index-head reveal"><span className="slate-tag">{sec.slate}</span><h2 className="display display-md">{sec.heading}</h2></div>
              {sec.lede && <p className="lede reveal" style={{ marginBottom: "2rem" }}>{sec.lede}</p>}
              <div className={`${sec.grid} reveal`}>
                {list.map((i) => <WorkCard key={i.id} item={i} />)}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
