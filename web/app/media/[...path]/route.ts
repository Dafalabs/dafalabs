export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const base = process.env.API_INTERNAL_URL?.trim();
  if (!base) return new Response(null, { status: 404 });

  const { path } = await context.params;

  try {
    const upstream = await fetch(`${base}/media/${path.join("/")}`, {
      cache: "no-store",
    });

    if (!upstream.ok) return new Response(null, { status: upstream.status });

    const headers = new Headers();
    const type = upstream.headers.get("content-type");
    if (type) headers.set("content-type", type);
    headers.set("cache-control", "public, max-age=31536000, immutable");

    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return new Response(null, { status: 502 });
  }
}
