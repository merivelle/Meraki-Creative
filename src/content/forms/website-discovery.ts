/**
 * Website discovery questionnaire (v1). Branches on the client type passed in the
 * assignment context (ctx.clientType) and on earlier answers.
 * Secrets are never requested: domain/hosting questions ask *where*, not logins.
 * Visual preference cards are intentionally not included yet (see preference_card_sets).
 */
import type { Condition, FormDefinition } from "@/lib/forms/types";

const NO_LOGINS = "Please don't send passwords or login details here. If access is needed, we'll arrange it separately and safely.";

const isActor: Condition = { source: "context", key: "clientType", op: "equals", value: "actor" };
const isFilm: Condition = { source: "context", key: "clientType", op: "in", value: ["director", "filmmaker", "production_company"] };
const isPhotographer: Condition = { source: "context", key: "clientType", op: "equals", value: "photographer" };

export const websiteDiscovery: FormDefinition = {
  key: "website-discovery",
  version: 1,
  title: "Website discovery",
  intro:
    "This is where the site starts. Answer what you can, skip what you can't, and choose “I don't know” whenever that's the honest answer. Your progress saves as you go, so you can come back to it.",
  sections: [
    {
      id: "purpose",
      title: "Purpose and audience",
      questions: [
        { id: "site_purpose", type: "textarea", label: "What is the site for?", required: true, help: "In your own words. What should it do for you?" },
        { id: "audience", type: "textarea", label: "Who needs to see it first?", required: true, help: "Casting, reps, festival programmers, clients, collaborators, fans…" },
        {
          id: "primary_action", type: "radio", label: "What's the one thing a visitor should do?", required: true, allowUnknown: true,
          options: [
            { value: "contact", label: "Get in touch or send an inquiry" },
            { value: "watch", label: "Watch the reel or a film" },
            { value: "view_work", label: "Look through the work" },
            { value: "hire", label: "Book or hire me" },
            { value: "buy", label: "Buy something" },
            { value: "follow", label: "Follow or subscribe" },
            { value: "other", label: "Something else" },
          ],
        },
        { id: "primary_action_other", type: "text", label: "Tell me more about that action", showIf: { key: "primary_action", op: "equals", value: "other" } },
        { id: "identity", type: "text", label: "How do you describe what you do, in one line?", help: "e.g. “Actor and writer based in Los Angeles”" },
        { id: "impression", type: "textarea", label: "What should someone feel after a minute on the site?" },
      ],
    },
    {
      id: "pages",
      title: "Pages and content",
      questions: [
        {
          id: "required_pages", type: "multiselect", label: "Which pages or sections do you need?", required: true,
          help: "Pick everything that feels essential. We'll refine it together.",
          options: [
            { value: "home", label: "Home" },
            { value: "about", label: "About / bio" },
            { value: "work", label: "Work or portfolio" },
            { value: "reel", label: "Reel" },
            { value: "credits", label: "Credits or résumé" },
            { value: "gallery", label: "Photo gallery" },
            { value: "films", label: "Films or projects" },
            { value: "press", label: "Press" },
            { value: "team", label: "Team" },
            { value: "services", label: "Services" },
            { value: "news", label: "News or blog" },
            { value: "shop", label: "Shop" },
            { value: "contact", label: "Contact" },
          ],
        },
        { id: "pages_other", type: "text", label: "Anything else that needs its own page?" },
        { id: "gallery_requirements", type: "textarea", label: "What do the galleries need to hold?", help: "Roughly how many images or videos, and how they should be grouped.", showIf: { key: "required_pages", op: "includes", value: "gallery" } },
        { id: "content_notes", type: "textarea", label: "Anything specific a section must include?" },
      ],
    },
    {
      id: "current",
      title: "Your current site",
      questions: [
        { id: "has_site", type: "yes_no_unsure", label: "Do you have a website now?", required: true },
        { id: "current_site_url", type: "url", label: "Its address", showIf: { key: "has_site", op: "equals", value: "yes" } },
        { id: "replace_reason", type: "textarea", label: "What isn't it doing for you?", help: "What you'd keep, and what you'd change.", showIf: { key: "has_site", op: "equals", value: "yes" } },
      ],
    },
    {
      id: "references",
      title: "References and taste",
      intro: "Links to sites you love, and sites you don't, tell me more than any adjective. They don't have to be in your field.",
      questions: [
        { id: "liked_refs", type: "reference_list", label: "Sites you like", noteLabel: "What you like about it", maxItems: 8 },
        { id: "disliked_refs", type: "reference_list", label: "Sites you don't like", noteLabel: "What you'd want to avoid", maxItems: 8 },
        { id: "brand_words", type: "text", label: "Three to five words for how it should feel" },
        { id: "style_notes", type: "textarea", label: "Any other preferences?", help: "Colors you love or hate, a mood, a film whose look you keep coming back to…" },
      ],
    },
    {
      id: "brand",
      title: "Brand assets",
      questions: [
        { id: "has_logo", type: "yes_no_unsure", label: "Do you have a logo or wordmark?" },
        { id: "brand_colors", type: "text", label: "Existing brand colors", allowUnknown: true, help: "Hex codes if you have them, or just describe them." },
        { id: "brand_fonts", type: "text", label: "Existing fonts", allowUnknown: true },
        { type: "note", id: "brand_upload_note", label: "Logo files, brand guides, and fonts go in the files checklist on your project page, not here." },
      ],
    },
    {
      id: "media",
      title: "Photos, video, and words",
      questions: [
        {
          id: "photos_ready", type: "radio", label: "Are the photos ready?", allowUnknown: true,
          options: [
            { value: "ready", label: "Yes, I have what the site needs" },
            { value: "some", label: "Some, but not all" },
            { value: "none", label: "Not yet" },
          ],
        },
        {
          id: "video_ready", type: "radio", label: "Is the video ready?", allowUnknown: true,
          options: [
            { value: "ready", label: "Yes" },
            { value: "some", label: "Some of it" },
            { value: "none", label: "Not yet" },
            { value: "na", label: "No video on this site" },
          ],
        },
        {
          id: "bio_status", type: "radio", label: "Your bio", allowUnknown: true,
          options: [
            { value: "ready", label: "I have one I'm happy with" },
            { value: "edit", label: "I have one, but it needs work" },
            { value: "write", label: "I need one written" },
          ],
        },
        { id: "bio_text", type: "textarea", label: "Paste your current bio (optional)", maxLength: 5000, showIf: { key: "bio_status", op: "in", value: ["ready", "edit"] } },
        { id: "other_copy", type: "textarea", label: "Any other writing the site needs?", help: "Project descriptions, service descriptions, a statement…" },
      ],
    },
    {
      id: "credits",
      title: "Credits, press, and links",
      questions: [
        { id: "credits", type: "textarea", label: "Credits to feature", help: "Paste them, or point to where they live (IMDb, a résumé file in your checklist)." },
        { id: "has_resume", type: "yes_no_unsure", label: "Do you have a résumé or CV to include?" },
        { id: "press_links", type: "url_list", label: "Press or reviews", maxItems: 15 },
        { id: "professional_links", type: "url_list", label: "Professional profiles and social links", help: "IMDb, Instagram, Vimeo, LinkedIn…", maxItems: 15 },
      ],
    },
    {
      id: "actor",
      title: "For actors",
      showIf: isActor,
      questions: [
        {
          id: "headshots", type: "radio", label: "Headshots", required: true,
          options: [
            { value: "current", label: "I have current headshots" },
            { value: "old", label: "I have some, but they're not current" },
            { value: "none", label: "I need new ones" },
          ],
        },
        { id: "reel_links", type: "url_list", label: "Reel links", maxItems: 5 },
        { id: "clip_links", type: "url_list", label: "Clips or scenes to include", maxItems: 12 },
        { id: "casting_profiles", type: "url_list", label: "Casting profile links", help: "Actors Access, Casting Networks, Backstage, Spotlight…", maxItems: 8 },
      ],
    },
    {
      id: "film",
      title: "Films and projects",
      showIf: isFilm,
      questions: [
        {
          id: "films", type: "repeatable_group", label: "Films or projects to feature", itemLabel: "project", maxItems: 20,
          fields: [
            { id: "title", type: "text", label: "Title", required: true },
            { id: "description", type: "textarea", label: "Short description" },
            { id: "trailer", type: "url", label: "Trailer or film link" },
          ],
        },
        { id: "has_stills", type: "yes_no_unsure", label: "Do you have production stills?" },
        { id: "slate", type: "textarea", label: "Projects in development to show (your slate)", help: "Only what you're comfortable being public." },
        {
          id: "team", type: "repeatable_group", label: "Team members to feature", itemLabel: "person", maxItems: 20,
          showIf: { source: "context", key: "clientType", op: "equals", value: "production_company" },
          fields: [
            { id: "name", type: "text", label: "Name", required: true },
            { id: "role", type: "text", label: "Role" },
          ],
        },
      ],
    },
    {
      id: "photography",
      title: "For photographers",
      showIf: isPhotographer,
      questions: [
        { id: "gallery_organization", type: "textarea", label: "How do you group your work?", required: true, help: "By project, series, client, year, subject…" },
        {
          id: "image_info", type: "multiselect", label: "What should appear with each image?",
          options: [
            { value: "title", label: "Title" },
            { value: "date", label: "Date" },
            { value: "location", label: "Location" },
            { value: "client", label: "Client or publication" },
            { value: "technical", label: "Camera or technical details" },
            { value: "none", label: "Nothing, just the image" },
          ],
        },
        {
          id: "print_sales", type: "yes_no_unsure", label: "Do you want print sales or a shop on the site?",
          help: "Print sales and shops are quoted as additional scope, so this just helps me plan.", flag: "additional_scope",
        },
        { id: "commerce_details", type: "textarea", label: "Tell me about the prints or products", flag: "additional_scope", showIf: { key: "print_sales", op: "equals", value: "yes" } },
      ],
    },
    {
      id: "contact",
      title: "Representation and contact",
      questions: [
        {
          id: "representation", type: "repeatable_group", label: "Representation to list publicly", itemLabel: "contact", maxItems: 6,
          help: "Agents, managers, publicists. Only include what can be public.",
          fields: [
            { id: "type", type: "text", label: "Type (agent, manager…)" },
            { id: "company", type: "text", label: "Company" },
            { id: "name", type: "text", label: "Name" },
            { id: "email", type: "email", label: "Public email" },
          ],
        },
        { id: "public_email", type: "email", label: "Public contact email", help: "The address shown on the site, if any." },
        { id: "form_destination", type: "email", label: "Where should contact-form messages go?", required: true },
      ],
    },
    {
      id: "languages",
      title: "Languages",
      questions: [
        { id: "languages", type: "text", label: "Which languages does the site need?", required: true, placeholder: "e.g. English only" },
        {
          id: "translation_source", type: "radio", label: "Who will provide the translations?",
          showIf: { key: "languages", op: "answered" },
          options: [
            { value: "client", label: "I will" },
            { value: "studio", label: "I'd like help with that" },
            { value: "na", label: "Not needed, one language" },
          ],
          allowUnknown: true,
        },
        { id: "translation_approver", type: "text", label: "Who approves the translations?", showIf: { key: "translation_source", op: "in", value: ["client", "studio"] } },
      ],
    },
    {
      id: "features",
      title: "Features and integrations",
      questions: [
        {
          id: "features", type: "multiselect", label: "Anything the site needs to do?",
          options: [
            { value: "newsletter", label: "Newsletter signup" },
            { value: "booking", label: "Booking or calendar" },
            { value: "shop", label: "Shop or payments" },
            { value: "video", label: "Embedded video (Vimeo, YouTube)" },
            { value: "instagram", label: "Instagram feed" },
            { value: "blog", label: "News or blog" },
            { value: "private", label: "Password-protected pages" },
            { value: "analytics", label: "Visitor analytics" },
          ],
        },
        { id: "integrations", type: "textarea", label: "Any tools it needs to connect to?", help: `Mailing list, booking tool, shop platform… ${NO_LOGINS}` },
        {
          id: "self_edit", type: "multiselect", label: "Once the site is live, what do you want to update yourself?",
          options: [
            { value: "news", label: "News, credits, or upcoming work" },
            { value: "media", label: "Reel, videos, or images" },
            { value: "bio", label: "Bio and text" },
            { value: "press", label: "Press" },
            { value: "none", label: "None, I'd rather someone else handle it" },
          ],
        },
      ],
    },
    {
      id: "domain",
      title: "Domain and hosting",
      intro: NO_LOGINS,
      questions: [
        { id: "has_domain", type: "yes_no_unsure", label: "Do you already own a domain?", required: true },
        { id: "domain_name", type: "text", label: "Which domain?", placeholder: "yourname.com", showIf: { key: "has_domain", op: "equals", value: "yes" } },
        { id: "domain_registrar", type: "text", label: "Where is it managed?", allowUnknown: true, help: "e.g. GoDaddy, Squarespace, Namecheap, Cloudflare", showIf: { key: "has_domain", op: "equals", value: "yes" } },
        {
          id: "current_platform", type: "select", label: "Current website platform", allowUnknown: true,
          showIf: { key: "has_site", op: "equals", value: "yes" },
          options: [
            { value: "wix", label: "Wix" },
            { value: "squarespace", label: "Squarespace" },
            { value: "wordpress", label: "WordPress" },
            { value: "webflow", label: "Webflow" },
            { value: "custom", label: "Custom-built" },
            { value: "other", label: "Something else" },
          ],
        },
        { id: "current_host", type: "text", label: "Who hosts it now, if you know?", allowUnknown: true, showIf: { key: "has_site", op: "equals", value: "yes" } },
      ],
    },
    {
      id: "ownership",
      title: "Ownership, handoff, and upkeep",
      questions: [
        {
          id: "ownership", type: "radio", label: "Who should hold the accounts (domain, hosting)?", allowUnknown: true,
          options: [
            { value: "client", label: "Me, in my own accounts" },
            { value: "studio", label: "I'd like the studio to manage them for me" },
          ],
        },
        {
          id: "maintenance", type: "radio", label: "Once it's live", allowUnknown: true,
          options: [
            { value: "self", label: "I'll look after it myself" },
            { value: "help", label: "I'd like ongoing help" },
            { value: "later", label: "Let's decide later" },
          ],
        },
      ],
    },
    {
      id: "people",
      title: "People and timing",
      questions: [
        { id: "decision_maker", type: "text", label: "Who has the final say?", required: true },
        { id: "approvers", type: "textarea", label: "Anyone else who'll give notes or approve?", help: "Names and roles, e.g. a manager or business partner." },
        { id: "launch_date", type: "date", label: "Is there a date you're working toward?" },
        {
          id: "launch_date_fixed", type: "radio", label: "Is that date fixed?", showIf: { key: "launch_date", op: "answered" },
          options: [
            { value: "fixed", label: "Fixed" },
            { value: "flexible", label: "Flexible" },
          ],
        },
        { id: "dependencies", type: "textarea", label: "Does going live depend on anything else?", help: "A premiere, new headshots, a festival announcement…" },
      ],
    },
  ],
};
