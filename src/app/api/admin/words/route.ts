import { getCurrentUser } from "@/modules/auth/services/auth.service";
import { wordService } from "@/modules/words/services/word.service";
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

  const response = await wordService.getAllword(search ?? "", page, limit);
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();

  if (!body["word"]) {
    return NextResponse.json({
      success: false,
      error: "Word is required",
    });
  } else if (
    !body["part_of_speech"] ||
    !body["pronunciation"]
  ) {
    return NextResponse.json({
      success: false,
      error: "Meaning,pronunciation and part of speech  is required",
    });
  }

  const definitions: { language: string; text: string, kind: string }[] = body["definitions"];
  const examples = body["examples"];

  const response = await wordService.createWord({
    word: body["word"],
    part_of_speech: body["part_of_speech"],
    pronuncation: body["pronunciation"],
    definitions: definitions.map((item) => {
      return {
        language: item.language,
        text: item.text,
        kind: item.kind
      };
    }),
    examples: examples,
  });

  return NextResponse.json({
    success: response.is_success,
    message: response.message,
    word: response,
  });
}
