import { deleteUser } from "@/modules/users/services/user.service";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const {id} = (await params)

  const isSuccess = await deleteUser(id);
  return NextResponse.json({
    success: isSuccess
  });
}
