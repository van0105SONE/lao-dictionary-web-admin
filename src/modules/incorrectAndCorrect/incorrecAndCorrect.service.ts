// src/modules/dictionary/services/dictionary.service.ts
import { db } from "@/db";
import { correct_and_incorrect, dictionary } from "@/db/schema";

import { count, eq, like } from "drizzle-orm";

export const correctIncorrectService = {
  getAllIncorrectAndCorrect: async (search?: string, page = 0, limit = 10) => {
    const totalCountResult = await db
      .select({ count: count() })
      .from(correct_and_incorrect);

    let query: any = db.select().from(correct_and_incorrect);

    if (search) {
      query = query.where(
        like(correct_and_incorrect.correct_word, `%${search}%`)
      );
    }

    let correctIncorrect: any[] = await query
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      words: correctIncorrect,
      pagination: {
        page,
        limit,
        total: totalCountResult[0].count,
        totalPages: Number.isNaN(Math.ceil(Number(totalCountResult) / limit))
          ? 0
          : Math.ceil(Number(totalCountResult) / limit),
      },
    };
  },

  deleteCorrectIncorrect: async (id: number) => {
    try {
      return await db
        .delete(correct_and_incorrect)
        .where(eq(correct_and_incorrect.id, id));
      // cascades for definitions/examples via Drizzle foreign keys
    } catch (err) {
      console.log("err: ", err);
    }
  },

  createCorrectIncorrect: async (data: {
    incorrect_word: string;
    correct_word: string;
    explanation: string;
  }) => {
    try {
      const result = await db
        .insert(correct_and_incorrect)
        .values({
          incorrect_word: data.incorrect_word,
          correct_word: data.correct_word,
          explanation: data.explanation,
        })
        .returning();

      return result;
    } catch (err) {
      console.log("err: ", err);
      throw err;
    }
  },

  updateCorrectIncorrect: async (
    id: number,
    data: {
      incorrect_word: string;
      correct_word: string;
      explaination: string;
    }
  ) => {
    console.log("update request ====> ", data);
    await db
      .update(correct_and_incorrect)
      .set({
        incorrect_word: data.correct_word,
        correct_word: data.correct_word,
        explanation: data.explaination,
      })
      .where(eq(correct_and_incorrect.id, id));
  },
};
