import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const getBackendBaseUrl = () => {
  const url = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("BACKEND_API_URL is not configured");
  }

  return url.replace(/\/+$/, "");
};

const buildTargetUrl = (path: string[], request: NextRequest) => {
  const backendBaseUrl = getBackendBaseUrl();
  const url = new URL(`${backendBaseUrl}/${path.join("/")}`);
  url.search = request.nextUrl.search;
  return url.toString();
};

const getForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (
      [
        "host",
        "connection",
        "content-length",
        "accept-encoding",
        "x-forwarded-host",
        "x-forwarded-port",
        "x-forwarded-proto",
      ].includes(normalizedKey)
    ) {
      return;
    }

    headers.set(key, value);
  });

  headers.set("x-forwarded-host", request.headers.get("host") || "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
};

const proxyRequest = async (request: NextRequest, params: { path: string[] }) => {
  try {
    const targetUrl = buildTargetUrl(params.path, request);
    const method = request.method.toUpperCase();
    const headers = getForwardHeaders(request);

    const init: RequestInit = {
      method,
      headers,
      redirect: "manual",
      cache: "no-store",
    };

    if (!["GET", "HEAD"].includes(method)) {
      init.body = await request.text();
    }

    const backendResponse = await fetch(targetUrl, init);
    const responseHeaders = new Headers();

    backendResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-encoding") {
        return;
      }
      responseHeaders.append(key, value);
    });

    responseHeaders.set("cache-control", "no-store, no-cache, must-revalidate");

    const setCookieHeader = backendResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      responseHeaders.set("set-cookie", setCookieHeader);
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Proxy request failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
};

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await context.params);
}
