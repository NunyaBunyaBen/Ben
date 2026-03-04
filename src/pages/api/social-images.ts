import type { APIRoute } from "astro";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export const GET: APIRoute = async () => {
  try {
    const socialDir = join(process.cwd(), "public", "social");
    const files = await readdir(socialDir);
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort()
      .map((f) => `/social/${f}`);

    return new Response(JSON.stringify(images), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
