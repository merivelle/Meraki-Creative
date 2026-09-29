import { breadcrumbs, graph, pageMetadata, pageNode, personNode, studioNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { CtaBand, PageHero } from "@/components/site/blocks";

const TITLE = "About Merivelle — Editor & Web Designer, Los Angeles";
const DESCRIPTION =
  "Merivelle is a director, actor, and lifelong editor working out of Los Angeles. Meraki Creative is the studio she built around that work.";

export const metadata = pageMetadata({ path: "/about", title: TITLE, description: DESCRIPTION });

export default function AboutPage() {
  return (
    <>
      <JsonLd data={graph(studioNode, personNode, pageNode("AboutPage", "/about", TITLE, DESCRIPTION),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]))} />

      <PageHero
        meta={["About", "The studio"]}
        title="Made with meraki."
        lede={<><i>Meraki</i> (n.): to do something with soul, creativity, and love; to put a piece of yourself into your work. That is the whole idea, and the standard for everything that leaves this studio.</>}
      />

      {/* ============ STORY ============ */}
      <section className="section">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">Who&apos;s behind it</span>
            <h2 className="display display-lg">Hi, I&apos;m Merivelle.</h2>
          </div>
          <div className="split reveal">
            <div>
              <div className="stack" style={{ maxWidth: "60ch" }}>
                <p>I&apos;ve never seen filmmaking as separate disciplines.</p>
                <p>Acting, directing, writing, and editing have always felt connected to me. They are different ways of trying to understand people and tell the truth of a story.</p>
                <p>I started editing when I was eight years old and taught myself Final Cut Pro at nine. What began as curiosity quickly became an obsession. I was fascinated by how the same footage could tell a completely different story depending on how it was put together, and how editing could completely change the way an audience experiences a story.</p>
                <p>That curiosity led me to study film production and editing at the School of Visual Arts in New York City, screenwriting at Loyola Marymount University, and Method acting at the Lee Strasberg Theatre &amp; Film Institute. Working across all of those disciplines taught me how stories are built from every angle, on the page, on set, in the performance, and in the edit.</p>
                <p>I work out of Los Angeles, where I grew up around filmmaking. My grandparents, Lou Antonio and Lane Bradbury, dedicated their lives to storytelling, and from an early age I saw how much work, care, and collaboration goes into bringing a story to life.</p>
                <p>Over time, I realized something frustrating. A lot of talented people create incredible work that never gets the attention it deserves. Not because the work isn&apos;t good, but because it isn&apos;t being presented in a way that allows people to truly see it.</p>
                <p>That&apos;s why I created Meraki Creative.</p>
                <p>I wanted a studio that approaches websites, edits, trailers, and reels with the same mindset I bring to directing. Find the heart of the work, understand what makes it unique, and build something that communicates it clearly.</p>
                <p>Whether I&apos;m cutting a scene, editing a trailer, building a website, or shaping a reel, I&apos;m asking the same question:</p>
                <p style={{ fontStyle: "italic", color: "var(--accent)" }}>What is this story really trying to say?</p>
                <p>You work directly with me. Every project is personal. Every decision is intentional. And every creative choice starts with the story.</p>
              </div>
              <p style={{ fontStyle: "italic", fontSize: "1.25rem", marginTop: "1.6rem", color: "var(--accent)" }}>— Merivelle</p>
            </div>
            <div className="about-portrait" style={{ marginTop: "0.4rem" }}>
              <div className="frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/work/about-merivelle.jpg" alt="Merivelle, director, editor, and founder of Meraki Creative, in Los Angeles" width={1200} height={1801} loading="lazy" decoding="async" style={{ objectPosition: "center top" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW I WORK (DARK BAND) ============ */}
      <section className="section band-night on-night">
        <div className="wrap">
          <div className="index-head reveal">
            <span className="slate-tag">How I work</span>
            <h2 className="display display-md">A few things that stay true.</h2>
          </div>
          <div className="why-grid reveal-stagger reveal">
            <div className="why">
              <span className="k">Fluent</span>
              <h3>Industry-aware, always</h3>
              <p>I build to the conventions your reps, casting offices, festivals, and financiers expect, so your materials read as professional before a word is spoken.</p>
            </div>
            <div className="why">
              <span className="k">Cinematic</span>
              <h3>Over corporate</h3>
              <p>Everything is designed to feel like it belongs in film and theatre. Editorial, restrained, warm. Your work leads; the design gets out of the way.</p>
            </div>
            <div className="why">
              <span className="k">Honest</span>
              <h3>Clear, kind, on time</h3>
              <p>Plain-language updates and turnarounds that respect your deadlines. You will always know what is happening and what is next.</p>
            </div>
            <div className="why">
              <span className="k">Yours</span>
              <h3>Your soul, not mine</h3>
              <p>The goal is never to make it look like me. It is to make it unmistakably you, sharpened, framed, and true to the story you set out to tell.</p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        slate="Let's make something"
        heading={<>Tell me about<br />your work.</>}
        primary={{ href: "/start", label: "Start Your Project" }}
        secondary={{ href: "/work", label: "See the Work" }}
      />
    </>
  );
}
