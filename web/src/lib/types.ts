import type { ThemeId } from "./themes";

export type Agent = {
  id: number;
  email: string;
  name: string;
  slug: string;
};

export type Site = {
  agent_id: number;
  brokerage: string;
  title: string;
  phone: string;
  public_email: string;
  office_address: string;
  service_area: string;
  headline: string;
  subheadline: string;
  hero_image: string;
  photo_url: string;
  bio: string;
  primary_color: string;
  accent_color: string;
  font_style: "modern" | "classic";
  theme: ThemeId;
  seo_title: string;
  seo_description: string;
  updated_at: string;
};

export type ListingStatus = "active" | "pending" | "sold";

export type Listing = {
  id: number;
  mls_number: string;
  status: ListingStatus;
  price: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  beds: number;
  baths: number;
  sqft: number;
  lot_acres: number;
  year_built: number;
  property_type: string;
  description: string;
  photos: string[];
  lat: number;
  lng: number;
  listing_office: string;
  listed_at: string;
};

export const STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "showing", label: "Showing" },
  { id: "offer", label: "Offer" },
  { id: "closed", label: "Closed" },
  { id: "lost", label: "Lost" },
] as const;

export type Stage = (typeof STAGES)[number]["id"];

export const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

export type LeadSource = "contact" | "tour" | "listing";

export const SOURCE_LABELS: Record<LeadSource, string> = {
  contact: "Contact form",
  tour: "Tour request",
  listing: "Question about a home",
};

export type Lead = {
  id: number;
  agent_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: LeadSource;
  listing_id: number | null;
  tour_date: string | null;
  stage: Stage;
  unread: number;
  created_at: string;
  updated_at: string;
};

export type LeadEvent = {
  id: number;
  lead_id: number;
  kind: "created" | "stage" | "note" | "email" | "task";
  body: string;
  created_at: string;
};

export type Task = {
  id: number;
  agent_id: number;
  lead_id: number | null;
  title: string;
  due_date: string;
  done_at: string | null;
  created_at: string;
  lead_name?: string | null;
};
