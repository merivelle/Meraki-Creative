import Link from "next/link";
import { getBlock, getContent } from "@/lib/content/queries";
import { breadcrumbs, graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { CtaBand, IndexList, PageHero, Rule, Schedule, serviceRows } from "@/components/site/blocks";

const TITLE = "Video Editing, Website Design & Pitch Decks in LA | Meraki Creative";
const DESCRIPTION =
  "Film and demo reel editing, website design for actors and filmmakers, and pitch deck design. Three crafts, one studio, based in Los Angeles.";

export const metadata = pageMetadata({ path: "/services", title: TITLE, description: DESCRIPTION });

export default async function ServicesPage() {
  const content = await getContent();
  const process = await getBlock("services.process");
  const rows = (cat: string) => serviceRows(content.services.filter((s) => s.categoryId === cat));

  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("WebPage", "/services", TITLE, DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]))} />

      <PageHero
        meta={["Services", "Post-Production · Digital Presence · Creative Materials"]}
        title={<>The story, and<br />everything that carries it.</>}
        lede="Three crafts, one studio standard. We edit the work, build the home for it, and shape the materials that carry it. The story is already there. We help it come across."
      >
        <div className="btn-group">
          <Link href="/start" className="btn btn-primary">Start Your Project</Link>
          <Link href="/packages" className="btn btn-secondary">View Packages</Link>
        </div>
      </PageHero>

      <Rule />

      <section className="section" id="post">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">Post-Production</span>
            <h2 className="display display-lg">We cut the story.</h2>
          </div>
          <p className="lede reveal" style={{ marginBottom: "2rem" }}>Film editing and post-production for actors and filmmakers in Los Angeles. Editing led by a working director and lifelong editor. We shape narrative films, trailers, and reels with an instinct for tension and release. The footage is yours; the cut is the craft.</p>
          <IndexList rows={rows("post-production")} />
          <p className="lede reveal" style={{ marginTop: "2rem" }}>More on how the editing works, what it costs, and what turnaround looks like: <Link href="/post-production" className="txt-link">post-production in Los Angeles</Link>.</p>
        </div>
      </section>

      <Rule />

      <section className="section" id="digital">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">Digital Presence</span>
            <h2 className="display display-lg">We build the home for it.</h2>
          </div>
          <p className="lede reveal" style={{ marginBottom: "2rem" }}>Website design for actors, directors, and production companies in Los Angeles. Clean, cinematic websites that read as seriously as the work you put into them. Built to send to reps, casting, financiers, and festivals.</p>
          <IndexList rows={rows("web-design")} />
          <p className="lede reveal" style={{ marginTop: "2rem" }}>More on how the sites get built, and the ones that are live right now: <Link href="/web-design" className="txt-link">website design for actors and filmmakers</Link>.</p>
        </div>
      </section>

      <Rule />

      <section className="section" id="materials">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">Creative Materials</span>
            <h2 className="display display-lg">We design what speaks for it.</h2>
          </div>
          <p className="lede reveal" style={{ marginBottom: "2rem" }}>Pitch deck and lookbook design for films in development. The documents that carry your project, designed with the same eye as the film so the vision reads on the page the way it does on screen.</p>
          <IndexList rows={rows("creative-materials")} />
          <p className="lede reveal" style={{ marginTop: "2rem" }}>More on decks and lookbooks: <Link href="/creative-materials" className="txt-link">creative materials</Link>.</p>
        </div>
      </section>

      <Rule />

      <Schedule slate="Process" heading={process.heading} steps={process.steps} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap"><p className="lede reveal">{process.intro}</p></div>
      </section>

      <CtaBand
        slate="Not sure what you need?"
        heading={<>Tell us about the work.<br />We&apos;ll handle the rest.</>}
        lede="Tell us where you're trying to get, a rep, a festival, a release, and we'll suggest the right mix of work and a clear quote."
        primary={{ href: "/start", label: "Start Your Project" }}
        secondary={{ href: "/packages", label: "View Packages" }}
      />
    </>
  );
}
