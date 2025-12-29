// src/modules/auth/services/user.service.ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/hash";
import { count, eq } from "drizzle-orm";

export async function createUser(
  email: string,
  password: string,
  name?: string | null
) {
  try {
    const result = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: await hashPassword(password),
      })
      .returning({ id: users.id, email: users.email });

    return result[0];
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error("Email already exists");
    }
    throw new Error("Failed to create user");
  }
}

export async function getAllUsers(
  keyword: string,
  page: number,
  limit: number
) {
  const totalCountResult = await db.select({ count: count() }).from(users);
  const result = await db
    .select()
    .from(users)
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(users.createdAt);
  
  const total = totalCountResult[0].count;
  
  return {
    users: result,
    pagination: {
      page,
      limit,
      total: total,
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string }
) {
  return await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email });
}

export async function deleteUser(id: string) {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (user[0].role?.toLocaleLowerCase() == "superadmin") {
      return false;
    }
    await db.delete(users).where(eq(users.id, id));

    return true;
  } catch (err) {
    return false;
  }
}
