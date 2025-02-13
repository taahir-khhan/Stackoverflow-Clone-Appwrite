import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import getOrCreateDB from "./models/server/DBSetup";
import getOrCreateStorage from "./models/server/storageSetup";

export async function middleware(request: NextRequest) {
  await Promise.all([getOrCreateDB(), getOrCreateStorage()]);
  return NextResponse.next();
}

export const config = {
  /* Match all request path except for the ones that starts with:  
  - api
  - _next/static
  - _next/image
  - favicon.ico
  */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
