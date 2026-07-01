/** Build the stored params JSON for an achievement definition. */
export function paramsFromInput(input: { metric?: string }): string {
  return JSON.stringify(input.metric ? { metric: input.metric } : {});
}
