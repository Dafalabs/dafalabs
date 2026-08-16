import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(request: Request, path: string[]) {
  const base = process.env.API_INTERNAL_URL?.trim();

  if (!base) {
    return NextResponse.json(
      { detail: "API adresi tanımlı değil." },
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const target = `${base}/${path.join("/")}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) headers.set("x-forwarded-for", "127.0.0.1");

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.append(key, value);
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[dafalabs] API'ye ulaşılamadı:", error);
    return NextResponse.json(
      { detail: "Servise şu anda ulaşılamıyor." },
      { status: 503 },
    );
  }
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: Request, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: Request, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: Request, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: Request, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}
