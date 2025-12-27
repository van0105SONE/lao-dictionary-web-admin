import { login } from "@/modules/auth/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body["email"]) {
    return NextResponse.json({
      error: "email is required",
    });
  } else if (!body["password"]) {
    return NextResponse.json({
      error: "password is required",
    });
  }

  const users = await login(body["email"], body["password"]);
  return NextResponse.json({
    success: true,
    user: users});

}
