/**
 * Post-production discovery questionnaire (v1).
 * Large source footage comes in through external private transfer links; the portal is
 * not a raw-footage host. "I don't know" is allowed wherever a client may reasonably not
 * know the technical answer.
 */
import type { Condition, FormDefinition } from "@/lib/forms/types";

const isReel: Condition = { key: "project_type", op: "in", value: ["demo-reel", "reel-refresh"] };
const isTrailer: Condition = { key: "project_type", op: "in", value: ["trailer", "teaser"] };

export const postProductionDiscovery: FormDefinition = {
  key: "post-production-discovery",
  version: 1,
  title: "Edit discovery",
  intro:
    "This is where the edit starts. Answer what you can, and choose “I don't know” whenever the technical side isn't yours to know. That's what I'm here for. Your progress saves as you go.",
  sections: [
    {
      id: "project",
      title: "The project",
      questions: [
        {
          id: "project_type", type: "select", label: "What are we making?", required: true,
          options: [
            { value: "demo-reel", label: "Demo reel" },
            { value: "scene", label: "Scene edit" },
            { value: "trailer", label: "Trailer" },
            { value: "teaser", label: "Teaser" },
            { value: "short-film", label: "Short film" },
            { value: "social", label: "Social edits" },
            { value: "other", label: "Something else" },
          ],
        },
        { id: "intended_use", type: "textarea", label: "Where will it be seen, and by whom?", required: true, help: "Casting platforms, a festival, reps, social, a pitch meeting…" },
        { id: "final_runtime", type: "text", label: "How long should the finished piece be?", allowUnknown: true, placeholder: "e.g. about 90 seconds" },
        { id: "audience", type: "text", label: "Who is the audience?" },
      ],
    },
    {
      id: "source",
      title: "Your footage",
      intro: "Please send footage through a private transfer link (Frame.io, Google Drive, Dropbox, WeTransfer). Make sure the link allows downloads.",
      questions: [
        { id: "source_quantity", type: "text", label: "Roughly how much material is there?", allowUnknown: true, placeholder: "e.g. 6 scenes, about 2 hours of footage" },
        { id: "footage_format", type: "text", label: "Footage format, if you know it", allowUnknown: true, placeholder: "e.g. ProRes 4K, iPhone video, a Vimeo download" },
        { id: "audio_format", type: "text", label: "Separate audio? What format?", allowUnknown: true, placeholder: "e.g. WAV files from the sound recordist, or none" },
        { id: "transfer_links", type: "url_list", label: "Transfer links", maxItems: 20, help: "You can also add these later in the files checklist." },
        { id: "has_existing_cut", type: "yes_no_unsure", label: "Is there an existing cut or reel?" },
        { id: "existing_cut_link", type: "url", label: "Link to the existing cut", showIf: { key: "has_existing_cut", op: "equals", value: "yes" } },
      ],
    },
    {
      id: "reel",
      title: "For reels",
      showIf: isReel,
      questions: [
        {
          id: "reel_versions", type: "multiselect", label: "Which versions do you need?",
          options: [
            { value: "general", label: "One general reel" },
            { value: "drama", label: "Drama" },
            { value: "comedy", label: "Comedy" },
            { value: "commercial", label: "Commercial" },
          ],
        },
        { id: "reel_open", type: "textarea", label: "Is there a moment you'd want to open on?" },
      ],
    },
    {
      id: "trailer",
      title: "For trailers and teasers",
      showIf: isTrailer,
      questions: [
        { id: "film_cut_link", type: "url", label: "Link to the locked cut of the film", allowUnknown: true },
        { id: "spoilers", type: "textarea", label: "What should it not give away?" },
      ],
    },
    {
      id: "moments",
      title: "Moments and references",
      questions: [
        { id: "preferred_moments", type: "textarea", label: "Scenes, takes, or moments you love", help: "Timestamps help if you have them, e.g. “scene 3 at 01:12”." },
        { id: "avoid_moments", type: "textarea", label: "Anything you'd rather leave out?" },
        { id: "reference_edits", type: "reference_list", label: "Edits you like", noteLabel: "What you like about it", maxItems: 8 },
        { id: "tone", type: "text", label: "Tone in a few words", placeholder: "e.g. tense, quiet, warm, funny" },
        {
          id: "pacing", type: "radio", label: "Pacing", allowUnknown: true,
          options: [
            { value: "patient", label: "Slow and patient" },
            { value: "measured", label: "Measured" },
            { value: "fast", label: "Fast and punchy" },
          ],
        },
      ],
    },
    {
      id: "titles",
      title: "Titles, credits, and logos",
      questions: [
        {
          id: "titles_needed", type: "multiselect", label: "What needs to appear on screen?",
          options: [
            { value: "name", label: "Name card" },
            { value: "title", label: "Title card" },
            { value: "credits", label: "Credits" },
            { value: "logos", label: "Logos" },
            { value: "laurels", label: "Festival laurels" },
            { value: "contact", label: "Contact or rep details" },
            { value: "none", label: "Nothing" },
          ],
        },
        { id: "titles_text", type: "textarea", label: "Exact wording for names, titles, and credits", help: "Spelled exactly as it should appear. Logo files go in the files checklist." },
      ],
    },
    {
      id: "music",
      title: "Music",
      questions: [
        {
          id: "music_licensing", type: "radio", label: "Music", required: true, allowUnknown: true,
          options: [
            { value: "licensed", label: "I have music I'm licensed to use" },
            { value: "find", label: "I need help finding licensed music" },
            { value: "original", label: "Use the film's original score" },
            { value: "none", label: "No music" },
          ],
        },
        { id: "music_notes", type: "textarea", label: "Music preferences", help: "Genres, references, or tracks you have in mind." },
      ],
    },
    {
      id: "finishing",
      title: "Sound and finishing",
      questions: [
        {
          id: "color_work", type: "radio", label: "Color grading (an additional cost)", allowUnknown: true,
          options: [
            { value: "grade", label: "Yes, please quote it" },
            { value: "none", label: "None needed" },
          ],
        },
        {
          id: "sound_work", type: "radio", label: "Sound", allowUnknown: true,
          options: [
            { value: "mix", label: "Full mix and sound design" },
            { value: "clean", label: "Cleanup and balance" },
            { value: "none", label: "None needed" },
          ],
        },
      ],
    },
    {
      id: "delivery",
      title: "Delivery",
      questions: [
        {
          id: "aspect_ratios", type: "multiselect", label: "Aspect ratios needed",
          options: [
            { value: "16x9", label: "16:9 (widescreen)" },
            { value: "9x16", label: "9:16 (vertical)" },
            { value: "1x1", label: "1:1 (square)" },
            { value: "4x5", label: "4:5 (portrait feed)" },
            { value: "239", label: "2.39:1 (scope)" },
            { value: "unsure", label: "I don't know" },
          ],
        },
        {
          id: "destinations", type: "multiselect", label: "Where will the files go?",
          options: [
            { value: "casting", label: "Casting platforms" },
            { value: "vimeo_youtube", label: "Vimeo or YouTube" },
            { value: "festival", label: "Festival submission" },
            { value: "social", label: "Social media" },
            { value: "distributor", label: "Distributor or broadcast spec" },
            { value: "other", label: "Somewhere else" },
          ],
        },
        { id: "delivery_specs", type: "textarea", label: "Any delivery specs you've been given?", showIf: { key: "destinations", op: "in", value: ["festival", "distributor"] } },
        {
          id: "captions", type: "radio", label: "Captions or subtitles", allowUnknown: true,
          options: [
            { value: "burned", label: "Burned into the video" },
            { value: "file", label: "Separate subtitle file" },
            { value: "both", label: "Both" },
            { value: "none", label: "None" },
          ],
        },
        { id: "caption_languages", type: "text", label: "In which languages?", showIf: { key: "captions", op: "in", value: ["burned", "file", "both"] } },
      ],
    },
    {
      id: "people",
      title: "People and timing",
      questions: [
        { id: "deadline", type: "date", label: "Deadline" },
        {
          id: "deadline_fixed", type: "radio", label: "Is that a fixed submission date?", showIf: { key: "deadline", op: "answered" },
          options: [
            { value: "fixed", label: "Yes, it's fixed" },
            { value: "flexible", label: "It's flexible" },
          ],
        },
        { id: "submission_name", type: "text", label: "If it's for a festival or submission, which one?" },
        { id: "decision_maker", type: "text", label: "Who has the final say?", required: true },
        { id: "feedback_contributors", type: "textarea", label: "Who else will give notes?", help: "Notes come back as one combined set per cut, so it helps to know who's involved." },
      ],
    },
  ],
};
