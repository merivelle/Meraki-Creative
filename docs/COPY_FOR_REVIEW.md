# Copy for review

The rebuild keeps the existing wording wherever the page still exists. Below is everything that
is **new or changed**, for Merivelle to approve or rewrite. All of it avoids the banned phrases
in `CLAUDE.md`. The `humanize-writing` skill referenced in `CLAUDE.md` wasn't available in this
environment (there is no `.claude/skills/` folder in the repo), so a humanize pass is still
worth doing.

## Sep 2026: homepage hero + Creative Materials retired
- Hero is now type-led and centred: h1 **"Meraki Creative"**, then "The story is already there."
  and the two buttons. Removed from the hero: the meta strip ("Meraki Creative · Est. 2026" /
  "A creative studio for storytellers · Now Booking") and the lede paragraph. The Los Angeles /
  film editing / website design wording still lives in the page title, description, and the
  sections below.
- New hero row: "( Services )" · "Two crafts, one studio". Cards: **Web Design**, "We build the
  home for it." and **Post-Production**, "We cut the story." (both existing canon lines).
- Statement: "…then build everything around it, from the edit to the site." (was "The edit, the
  site, the materials.")
- Services page: title "Film Editing & Website Design Services in LA | Meraki Creative"; lede
  "Two crafts, one studio standard. We edit the work and build the home for it. The story is
  already there. We help it come across."
- Packages, Work, About, footer, and schema descriptions drop decks/lookbooks/materials.
- Filmmaker Package: removed "Pitch deck or lookbook"; tagline now "The site and the cut,
  designed as one to carry the project." **Still to decide:** the Acting Package line
  "Materials set up to match." (it may mean headshots/bio, not decks).
- Published Supabase rows for the category are hidden in code; archive them in Admin whenever
  convenient, and edit the Filmmaker Package there too (the seed only covers fresh databases).

## Sep 2026: Start a Project, link rows + Web Design deep-dive ("design brief") — please review
All wording lives in `src/lib/inquiry/steps.ts` (screen titles and leads) and
`src/lib/inquiry/definition.ts` (questions and options).

**Links step.** Lead: "Your current site, a reel, the film. Add a note so I know what each one
is." Each row: URL + note ("What is it, or what do you like about it?"), "+ Add another link".

**New required web questions** (after "Do you have a website now?"):
- "Do you already own a domain?" (lead: "Your own address, like yourname.com.") Yes / No / Not sure
- "Are your words, photos, and video ready?" Ready / Some of it / Not yet
- "Once it's live, who makes changes?" I'd like to make small edits myself / The studio makes
  updates for me / Not sure yet

**The opt-in** (web clients, after contact details): "Want to go deeper?" — "About five
minutes, and every screen can be skipped. It helps me design what you're picturing."
Yes, let's go / Skip for now.

**The twelve brief screens** (all optional): Which feels closest? (mood cards + light/dark) ·
In your words. · Colours. · Type & logo. · Which pages do you need? · What goes on the
homepage? (ordered) · Anything the site should do? · Which languages? · Sites you love. ·
Words, photos, and video. · Domain & accounts. · Sign-off & timing.

**Thank-you page offer** (web clients who skipped): "While it's fresh — Want to tell me more
about the design? The look, the pages, the colours. About five minutes, and you can skip
anything." → `/start/design` ("Tell me more." / "The look, the feel, the pages. Everything
you're picturing."), which emails a separate "Design brief: [name]". Its thank-you: "Thank
you. That helps a lot."

**To confirm:** mood names (Minimal & editorial, Cinematic & dark, Warm & classic, Bold &
graphic, Soft & romantic), palette names, type style names, and the homepage section list.

## Sep 2026: Post-Production in three stages (same as Web Design) — please review
`/post-production` now mirrors `/web-design`: hero, six service cards with quick views, three
selected edits, "Included in every edit.", a hover-opening process, FAQs, and a page per
service at `/post-production/<service>`. All copy lives in `src/content/post-production.ts`.

**Packages retired.** No tiers anywhere: one starting price per service. `/packages` (and
`packages.html`) 308 to `/services`; the Acting / Filmmaker bundles are hidden (kept in admin).
"View Packages" buttons now read "View Services" (homepage) or "See the Work" (services page).

**Color grading is not a service.** Removed: the Color Grading service row, the two
before/after grade pieces from the Work, "color grades" in page copy and SEO keywords, and the
"Color grading" / "Reel refresh" options in the Start questionnaire. It survives only as the
add-on "Color grading — Quoted separately" and a yes/no in the post discovery form.

**Starting prices** (researched for a new studio; LA reel editors charge from about $150,
editors roughly $100 per finished minute, social clips $50–150):

| Service | Price | Notes |
|---|---|---|
| Demo reels | From $150 | You asked for reel lower than scene |
| Scene edits | From $200 | One scene, up to three minutes |
| Teasers | From $350 | Your price |
| Trailers | From $850 | Your price |
| Short films | Quote on request | Quoted on runtime and footage |
| Social cutdowns | From $75 per clip | |

**To confirm:**
- "Two revision rounds" is now stated as included in every edit (old packages said it for some).
- Add-ons are all "Quoted separately" except a social cutdown (from $75 per clip): color
  grading, captions or subtitles, extra version or aspect ratio, extra revision round, rush.
- FAQ "Do you handle color and sound too?" now reads "Do you handle sound and color too?":
  sound is part of every edit; color grading is an additional cost.
- Card art borrows existing engravings; prompts for dedicated ones are in
  `docs/ONBOARDING_ILLUSTRATIONS.md`.
- Hero line: "Post-production for storytellers." Services heading: "An edit for every story."
  Work heading: "Stories we've helped shape." Process: "How an edit comes together."

## Sep 2026: Web Design in three stages (main page → quick view → service page)
All website copy and prices come from one file, `src/content/web-design.ts` (services, card
sentences, popup highlights, service-page scope, add-ons, materials, service FAQs, process).
The website packages in `seed.ts` are generated from it, so prices can't drift.

- **Main page `/web-design`:** short intro · three selected sites (Emily, Boomerang, Angelique) ·
  six service cards (price, Quick view, Full details) · four "included" highlights · four-step
  process · five general FAQs (cost, timing, domain and hosting, updates, account control) · CTA.
- **Quick view popups:** name, one line, "From $… · one-time starting price, USD", 4–5
  highlights, one add-on note, More details / Start your project, and "Hosting and domain fees
  are separate. Final scope is confirmed before booking."
- **Service pages `/web-design/<service>-websites`:** who it's for, price, relevant real work,
  starting package (core pages / project entries / included), relevant add-ons, what to prepare,
  3–4 FAQs, and a specific CTA ("Start your actor website.").
- **Prices** (one-time starting, USD): Actor $650 · Director $1,000 · Production company
  $1,500 · Portfolio $900 · Film $750 · Creative business $1,200. Add-ons as before.
- **Packages page** now covers editing and bundles only, and links to Web Design for website prices.
- Wording: "go live" instead of "launch" (house banned-word list), e.g. "Going live included",
  "Go live and hand over".
- Portfolio labels: Meraki Creative → "Our Studio Site"; Merivelle → "Personal Director Site".

**Canny-style pass (Sep 29):** services heading is now "A site for every story."; hero tags read
"Actors", "Filmmakers", "Creative businesses"; service cards, popups, and service pages use the
Start a Project engravings instead of site screenshots; service pages no longer show example
sites; add-ons are grouped as "Pages & content", "Reach", "Tools & access", "Support"; the
process and FAQs are dropdowns. Selected sites (Emily, Boomerang, Angelique) sit below services.

**To confirm before publishing** (the copy is written conditionally around these):
1. Build platform(s). This decides "Can I update it myself?", editor setup pricing, and handover (Nicky's site is on Wix).
2. Who holds domain, hosting, and platform accounts, and how access is shared.
3. Hosting and ongoing costs, and whether you offer ongoing updates.
4. The 14-day post-launch fix period, and what counts as a consolidated revision round.
5. Deposit and payment terms, and what the "proposal" is.
6. Typical timelines, if you want to state any (none are given).
7. Translation workflow; which booking and newsletter services you'll integrate.
8. Font, template, and third-party licensing, and what you hand over.
9. Whether a password-protected area is possible on your platform (offered as "quoted by platform").
10. Service details aren't editable in Admin yet; edits go through `src/content/web-design.ts`.

## Sep 2026: "What we do" + "Featured Work" (Estrela-style)
Replaces the homepage's two pillar sections and "The reel". Row copy reuses existing service summaries.
- Intro under "What we do": "Film editing and website design for actors, directors, and production
  companies in Los Angeles." (keeps the local search words the pillar sections carried)
- 01 Film & trailer editing · 02 Demo reels & scenes · 03 Actor & director websites ·
  04 Production company & film websites. Closing band: "Start with the story." → View all services.
- Featured Work card: "Stories we've helped shape." · "All Work →".

## Sep 2026: testimonials (Shed-style)
Each testimonial now shows a short pull-quote large, with the full quote small beneath it.
Pull-quotes, verbatim from each quote (edit in Admin → Testimonials → "Pull-quote"):
- Liquid Theatre Collective: "A true asset to any production."
- Nicky Chartraw: "An incredible gift for storytelling through her editing."
- Yonatan Shaham Vitos: "The reel also helped me land my first feature film."
Until they're entered in Admin (needs the `pull_quote` migration applied), the site shows the
first clause of each quote, e.g. "Working with Merivelle was nothing short of amazing…".

## Navigation
- Primary nav is now: Home · Web Design · Post-Production · Work · About · Start a Project ·
  Client Login (was Home · Services · Packages · Portfolio · About · Contact).
- Footer "Explore" adds Creative Materials and "All Services", and "Connect" adds Client login.
- The page previously called **Portfolio** is now **Work** (`/work`). The hero, "Stories we've
  helped shape.", is unchanged.

## Process: now asynchronous (homepage "The Schedule", service pages)
Steps were "Call 01–04" with text implying calls. They're now "Step 01–04":
1. **Inquiry.** Tell us about the work through a short form. We reply in writing with questions or a plan and a quote.
2. **Plan.** Once the scope is agreed, you get a project page with a questionnaire and a checklist of what we need from you.
3. **Build.** We design and edit, then post each version to your page. You send your notes as one set and approve what's ready. Revisions are part of the process.
4. **Deliver.** Final files and handoff notes land on your page, ready to send to reps, casting, and festivals.

Intro on service pages: "Everything happens in writing, on your own schedule. No calls are
needed to book or finish a project, though you can always ask for one."

## FAQ changes
- *Web design: "Do you design for people outside Los Angeles?"*: the last sentence changed from
  "The whole process runs over email and calls." to "The whole process runs in writing, through
  your project page and email, so there's no need to schedule calls."
- New, post-production: "How do I send large footage?" and "How do notes work?"
- New, web design: "Who owns the site when it's done?"
- New, creative materials: "What do you need to start a deck or lookbook?"

## New services (Web Design)
- **Photographer Websites.** "Galleries arranged the way you think about your work, with the image details that matter to you. Print sales or a shop can be added as separate scope."
- **Creative Business Websites.** "For studios, composers, and other creative businesses whose work deserves the same care they put into it."
(Neither shows on the homepage unless given a homepage line in Admin → Website content.)

## Web Design page hero
"Websites for actors, directors, filmmakers, photographers, production companies, and other
creative businesses, designed and built out of Los Angeles. Fast, mobile-ready, and shaped
around the work rather than around a template." (Added filmmakers, photographers, and other
creative businesses.)

## New page: Creative Materials (`/creative-materials`)
Hero and title reuse "We design what speaks for it." and the existing materials text. New
line: "Decks and lookbooks built from your script, your references, and what you want the
reader to feel first."

## Start a Project (`/start`, was Contact)
- Lede: "…A few short questions now; the detailed ones come later, once we both know it's a fit.
  I'll reply by email, usually within a couple of business days." (It no longer promises "a clear
  plan, a timeline, and a quote".)
- New sidebar block **How it works**: "Everything runs in writing: this form, then email, then
  your own project page for questionnaires, files, reviews, and approvals. No calls needed."
- "Who I work with" adds photographers and other creative businesses.
- The existing **Turnaround** block ("Most projects begin within a week of booking…") is kept
  as-is. Keep or remove it.
- The form is new: branching questions per service, a budget range with "Unsure", and a
  fixed/flexible deadline.

## Thank-you page and receipt email
Page: "Your inquiry came through. I'll read it properly and reply by email, usually within a
couple of business days. If anything needs clarifying first, I'll ask." Neither the page nor
the receipt email promises acceptance, a quote, or delivery dates.

## Packages: wording differences to settle
Prices are unchanged everywhere. The **packages page wording** is now the single source; the
homepage and service pages show the first three included items from it. The old pages used
slightly different bullet text:
- Homepage *Acting Package* was labelled "Bundle / Most booked" with bullets "Actor website
  built / Demo reel re-edited / Scenes & resume included". It now uses "Bundle / Actor" with
  bullets from the packages page.
- Homepage *Scene Edit* is now titled **Basic Scene Edit** (its name on the packages page).
- The post-production page had different bullets for Cinematic Scene Edit and Trailer Package,
  and the web design page had different bullets for Director and Production Company websites.
- Homepage items said "Details" and linked to the packages page. That's unchanged.
Edit any of these in Admin → Website content → Packages.

## Portal, admin, questionnaires, and emails
All new. Questionnaire wording lives in `src/content/forms/*.ts` (published as v1; edits create
v2 in Admin → Questionnaires). Email wording lives in `src/lib/email/templates.ts`.

## Start a Project: guided onboarding (Sep 2026)
The `/start` page is now a full-screen, one-question-at-a-time flow. New lines:
- Welcome: **"Hi there."** / "The story is already there. Let's start with yours." /
  "A few short questions · about three minutes · no account needed" / **Begin**
- Questions: "What are we making together?" · "And you are…" · "Roughly how big is the site?" ·
  "Do you have a website now?" · "Anything beyond pages?" · "What kind of edit?" ·
  "About how long should it run?" · "Is the footage already shot?" · "A deck, a lookbook, or
  both?" · "Where is the project right now?" · "What's the goal?" ("In a line. Where should
  this work take you?") · "Tell me about the project." · "Anything I should look at?" · "Is there
  a date you're working toward?" · "Roughly what budget do you have in mind?" ("A range is
  plenty. Unsure is a fine answer.") · "How do I reach you?"
- Review: "Here's what you told me." / "Check it over, then send."
- Chip for links from a package: "You came in through [package]".
- The old sidebar (Follow / Who I work with / Where / Turnaround) is no longer on this page.
  Its "Turnaround" promise is gone from here; bring any of it back if you want.
- Thank-you screen: "Thank you. It's on its way." with the same reply-time line as before,
  signed "— Merivelle".
All of it lives in `src/lib/inquiry/steps.ts` (screens) and `src/lib/inquiry/definition.ts`
(answer options).

### Update (Sep 28)
"Pitch deck or lookbook" and "Photographer" were removed from the Start a Project choices.
Photographers pick "Other creative business"; deck and lookbook inquiries use "Not sure yet".
Links from the Creative Materials page or a Pitch Deck / Presentation package still open the
flow and show "You came in through [package]", and that package is saved with the inquiry.
