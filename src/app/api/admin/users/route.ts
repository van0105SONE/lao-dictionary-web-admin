// src/app/api/admin/users/route.ts
import { getCurrentUser } from "@/modules/auth/services/auth.service";
import {
  createUser,
  deleteUser,
  getAllUsers,
} from "@/modules/users/services/user.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("it about to get user......");
  const currentUser = await getCurrentUser();
  console.log('current user: ', currentUser)
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const response = await getAllUsers("", page, limit);
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const body = await request.json();

  console.log("body data: ", body);
  if (!body["email"]) {
    return NextResponse.json({
      error: "email is required",
    });
  } else if (!body["password"]) {
    return NextResponse.json({
      error: "password is required",
    });
  }

  const users = await createUser(body["email"], body["password"]);
  return NextResponse.json(users);
}
