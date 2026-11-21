import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ trpc: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { trpc } = await params;
  const query = Object.fromEntries(request.nextUrl.searchParams);

  return NextResponse.json({ method: "GET", procedure: trpc, query });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { trpc } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return NextResponse.json({ method: "POST", procedure: trpc, body });
}
