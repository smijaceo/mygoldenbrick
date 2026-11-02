import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: sends signed-out visitors to the login page early.
// The real session check happens on the server in requireAgent().
export function proxy(request: NextRequest) {
  if (!request.cookies.has("imp_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
