const KEY = "moment-fp";

export function getFingerprint(): string {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const fp = crypto.randomUUID();
  localStorage.setItem(KEY, fp);
  return fp;
}
