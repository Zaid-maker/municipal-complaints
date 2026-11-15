// Single source of truth for complaint vocabulary.
//
// To add, rename or retire a category, edit this array only: validation, the
// /api/complaints/meta endpoint and the UI all read from here.
export const COMPLAINT_CATEGORIES = Object.freeze([
    { slug: "roads", label: "Roads & potholes" },
    { slug: "water", label: "Water supply" },
    { slug: "sewerage", label: "Sewerage & drainage" },
    { slug: "sanitation", label: "Sanitation & waste" },
    { slug: "street-lighting", label: "Street lighting" },
    { slug: "parks", label: "Parks & trees" },
    { slug: "encroachment", label: "Encroachment" },
    { slug: "other", label: "Other" }
]);

export const COMPLAINT_STATUSES = Object.freeze([
    { slug: "submitted", label: "Submitted" },
    { slug: "acknowledged", label: "Acknowledged" },
    { slug: "in-progress", label: "In progress" },
    { slug: "resolved", label: "Resolved" },
    { slug: "closed", label: "Closed" },
    { slug: "rejected", label: "Rejected" }
]);

export const COMPLAINT_PRIORITIES = Object.freeze([
    { slug: "low", label: "Low" },
    { slug: "normal", label: "Normal" },
    { slug: "high", label: "High" },
    { slug: "urgent", label: "Urgent" }
]);

export const CATEGORY_SLUGS = COMPLAINT_CATEGORIES.map(({ slug }) => slug);

export const STATUS_SLUGS = COMPLAINT_STATUSES.map(({ slug }) => slug);

export const PRIORITY_SLUGS = COMPLAINT_PRIORITIES.map(({ slug }) => slug);

const labelFor = (entries, slug) => entries.find((entry) => entry.slug === slug)?.label ?? slug;

export const categoryLabel = (slug) => labelFor(COMPLAINT_CATEGORIES, slug);

export const statusLabel = (slug) => labelFor(COMPLAINT_STATUSES, slug);

export const priorityLabel = (slug) => labelFor(COMPLAINT_PRIORITIES, slug);
