/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  tagline?: string;
  warehouseName?: string;
  supervisorName?: string;
  zones?: string[];
  lowStockThreshold?: number;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "WareFlow",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#1E5BBF",
    secondary: "#5A6473",
    accent: "#16A34A",
  },
  tagline: "A known location for every item — dock to truck.",
  warehouseName: "Main Distribution Center",
  supervisorName: "Supervisor",
  zones: ["A", "B", "C", "D", "Cold", "Returns"],
  lowStockThreshold: 10,
  // ─────────────────────────────────────────────────────────────────────
  // Add new field defaults here. See RULES.md §5 for per-type shape.
  // Required branding fields → use the FILL_X_HERE placeholder pattern.
  // Optional/typed defaults → real value with a "// fill it here" comment:
  //
  //   maxItemsPerPage: 12,                     // fill it here
  //   enableNotifications: true,               // fill it here
  //   featuredCategories: [],                  // fill it here
  //   defaultLanguage: "en",                   // must match enum options
  //   launchDate: "2025-01-01T00:00:00.000Z",  // ISO-8601
  //   heroImage: "",                           // resolved URL after upload
  //   galleryImages: [],                       // array of resolved URLs
  // ─────────────────────────────────────────────────────────────────────
};
