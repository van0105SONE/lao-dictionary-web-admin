import { getCurrentUser } from "@/modules/auth/services/auth.service";
import { wordService } from "@/modules/words/services/word.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await wordService.getAllword(
    "",
    1,
    10
  );
  return NextResponse.json(response);
}
