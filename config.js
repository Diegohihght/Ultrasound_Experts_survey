/*
  config.js
  ---------
*/

const SURVEY_CONFIG = {

  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxd_e4uSyZgOh1rE8uLySfeYFpQdau9MIaGzxX9HBouq0xwvRkiuVhyrYXbnkw461Io/exec",

  VIDEO_TUTORIAL_URL: "PASTE_YOUR_VIDEO_LINK_HERE",

  // Reference case/folder used for the images shown in the reference view
  GLOBAL_CASE_ID: "2",
  GLOBAL_CASE_LABEL: "Reference case",

  // The 7 algorithms being evaluated globally
  ALGORITHMS: [
    { id: "yiffana_pt",       label: "Percentile Threshold (Yiffana)" },
    { id: "yiffana_blanket",  label: "Percentile Threshold + Blanket" },
    { id: "pipeline_v10_61",  label: "Diffusion + Active Contour" },
    { id: "pipeline_v10_62",  label: "Diffusion + Active Contour (v2)" },
    { id: "pipeline_v10_63",  label: "Diffusion ∩ Contour (Consensus)" },
    { id: "pipeline_v10_70",  label: "Dual-Threshold + Morphology" },
    { id: "pipeline_v10_90",  label: "Bone-Growth Contour (Negative)" },
  ],

  DEGREE_OPTIONS: [
    "Resident",
    "Fellow",
    "Attending / Consultant",
    "Specialist",
    "PhD Researcher",
    "Other",
  ],

};