# Copy for review

The rebuild keeps the existing wording wherever the page still exists. Below is everything that
is **new or changed**, for Merivelle to approve or rewrite. All of it avoids the banned phrases
in `CLAUDE.md`. The `humanize-writing` skill referenced in `CLAUDE.md` wasn't available in this
environment (there is no `.claude/skills/` folder in the repo), so a humanize pass is still
worth doing.

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
