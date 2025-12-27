import { getCurrentUser } from "@/modules/auth/services/auth.service";
import { correctIncorrectService } from "@/modules/incorrectAndCorrect/incorrecAndCorrect.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const response = await correctIncorrectService.getAllIncorrectAndCorrect(
    search ?? "",
    page,
    limit
  );
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();

  console.log("incoming body: ", body);
  if (!body["incorrect_word"]) {
    return NextResponse.json({
      success: false,
      error: "Incorrect Word is required",
    });
  } else if (
    !body["correct_word"] 
  ) {
    return NextResponse.json({
      success: false,
      error: "Correct word is required",
    });
  }

  console.log('request: ', body)


  const response = await correctIncorrectService.createCorrectIncorrect({
    incorrect_word: body["incorrect_word"],
    correct_word: body["correct_word"],
    explanation: body["explanation"],
  });

  return NextResponse.json({
    success: true,
    word: response,
  });
}
