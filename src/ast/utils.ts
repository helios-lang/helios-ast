// deno-lint-ignore-file no-explicit-any

export function capitalizeModuleName(string: string): string {
  if (string.length == 2) return string.toUpperCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function isLastIndex(index: number, array: readonly any[]): boolean {
  return index === array.length - 1;
}
