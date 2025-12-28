import { logout } from "@/modules/auth/services/auth.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

  const users = await logout();
  return NextResponse.json({
    success: true,
    user: users,
  });
}
