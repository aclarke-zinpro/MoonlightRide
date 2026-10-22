/** A Google Maps search link; works on phones (opens the maps app) and desktops. */
export function mapsSearchUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}
