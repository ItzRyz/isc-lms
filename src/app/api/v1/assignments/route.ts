import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, data: { message: "assignments placeholder — implement di phase terkait" }, error: null });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, data: { message: "POST assignments — server validation required" }, error: null });
}
