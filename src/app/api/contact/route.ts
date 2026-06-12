import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Use Web3Forms directly" }, { status: 404 });
}
