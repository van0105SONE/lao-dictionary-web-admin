import { getCurrentUser } from "@/modules/auth/services/auth.service";
import { correctIncorrectService } from "@/modules/incorrectAndCorrect/incorrecAndCorrect.service";
import { reportService } from "@/modules/report/report.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await reportService.getDashboard();
  return NextResponse.json(response);
}
