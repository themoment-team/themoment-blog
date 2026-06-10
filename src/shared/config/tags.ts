export const ALLOWED_TAGS = [
  "Frontend",
  "Backend",
  "DevOps",
  "AI",
  "Mobile",
  "Database",
  "Infra",
  "Project",
  "Career",
  "ETC",
] as const;

export type AllowedTag = (typeof ALLOWED_TAGS)[number];
