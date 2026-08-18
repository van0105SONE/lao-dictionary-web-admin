// src/modules/dictionary/services/dictionary.service.ts
import { db } from "@/db";
import { dictionary } from "@/db/schema";
import { count, desc, eq, like, inArray } from "drizzle-orm";

export const wordService = {
  getAllword: async (search?: string, page = 0, limit = 10) => {
    const totalCountResult = await db
      .select({ count: count() })
      .from(dictionary);

    let query: any = db
      .select()
      .from(dictionary)
      .orderBy(desc(dictionary.created_at));

    if (search) {
      query = query.where(like(dictionary.word, `%${search}%`));
    }

    const words = await query.limit(limit).offset((page - 1) * limit);
    const total = totalCountResult[0].count;

    return {
      words: words,
      pagination: {
        page,
        limit,
        total: total,
        totalPages: Number.isNaN(Math.ceil(Number(total) / limit))
          ? 0
          : Math.ceil(Number(total) / limit),
      },
    };
  },

  getWordDetails: async (wordId: number) => {
    const word = await db.select().from(dictionary).where(eq(dictionary.id, wordId));

    return {
      word: word[0],
    };
  },

  deleteWord: async (wordId: number) => {
    try {
      return await db.delete(dictionary).where(eq(dictionary.id, wordId));
    } catch (err) {
      console.log("err: ", err);
    }
  },

  createWord: async (data: {
    word: string;
    pronuncation: string;
    part_of_speech: string;
    description: string;
  }) => {
    try {
      const isExist = await db
        .select()
        .from(dictionary)
        .where(eq(dictionary.word, data.word))
        .limit(1);
      if (isExist[0]) {
        return {
          is_success: false,
          message: "ມີຄຳສັບນີ້ໃນລະບົບແລ້ວ",
        };
      }

      await db
        .insert(dictionary)
        .values({
          word: data.word,
          pronunciation: data.pronuncation,
          part_of_speech: data.part_of_speech,
          description: data.description,
          search_count: 0,
        });

      return {
        is_success: true,
        message: "ເພີ່ມຂໍ້ມູນສຳລເລັດF",
      };
    } catch (err) {
      console.log("err: ", err);
      return {
        is_success: false,
        message: "Internal error",
      };
    }
  },

  updateWord: async (
    id: number,
    data: {
      word: string;
      pronunciation: string;
      part_of_speech: string;
      description: string;
    }
  ) => {
    try {
      await db.update(dictionary).set({
        word: data.word,
        pronunciation: data.pronunciation,
        part_of_speech: data.part_of_speech,
        description: data.description,
      }).where(eq(dictionary.id, id));

      return {
        is_success: true,
        message: "successful updated"
      }
    } catch (err) {
      return {
        is_success: false,
        message: "something went wrong!",
      };
    }
  },
};
