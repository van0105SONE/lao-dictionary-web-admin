import { wordService } from "@/modules/words/services/word.service";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const isSuccess = await wordService.deleteWord(Number(id));
  return NextResponse.json({
    success: isSuccess,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const response = await wordService.updateWord(Number(id), body);
  return NextResponse.json({
    success: response.is_success,
    message: response.message,
  });
}
