// Single source for the gateway base URL (client-side fetches).
export const GATEWAY =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
