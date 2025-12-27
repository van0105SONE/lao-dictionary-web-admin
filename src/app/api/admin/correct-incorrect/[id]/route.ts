import { correctIncorrectService } from "@/modules/incorrectAndCorrect/incorrecAndCorrect.service";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params;

  const isSuccess = await correctIncorrectService.deleteCorrectIncorrect(
    Number(id)
  );
  return NextResponse.json({
    success: isSuccess,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: number } }
) {
  const { id } = await params;
  const body = await request.json();

  const isSuccess = await correctIncorrectService.updateCorrectIncorrect(Number(id), body);
  return NextResponse.json({
    success: isSuccess,
  });
}
