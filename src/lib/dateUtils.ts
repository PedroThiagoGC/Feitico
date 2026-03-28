export function defaultDateFrom(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function defaultDateTo(): string {
  return new Date().toISOString().split("T")[0];
}
