import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  return NextResponse.redirect(`${origin}/masuk`);
}
