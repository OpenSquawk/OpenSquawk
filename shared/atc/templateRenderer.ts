/**
 * Simple template renderer that replaces {variable} placeholders with values.
 * Renders a template string like "{callsign}, cleared to {dest} via {sid}"
 * by replacing {key} placeholders with values from the vars object.
 * Unreplaced placeholders are left as-is (useful for debugging).
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] ?? match
  })
}
