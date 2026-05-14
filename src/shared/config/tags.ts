export const ALLOWED_TAGS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Go",
  "Python",
  "Java",
  "Kotlin",
  "DevOps",
  "AI/ML",
  "보안",
  "데이터베이스",
  "네트워크",
  "기타",
] as const;

export type AllowedTag = (typeof ALLOWED_TAGS)[number];
