// src/modules/dictionary/services/dictionary.service.ts
import { db } from "@/db";
import {
  definitions,
  definitionTexts,
  dictionary,
  examples,
  exampleSentences,
  users,
} from "@/db/schema";

import { count, eq, like } from "drizzle-orm";

export const wordService = {
  getAllword: async (search?: string, page = 0, limit = 10) => {
    const totalCountResult = await db
      .select({ count: count() })
      .from(dictionary);

    let query: any = db.select().from(dictionary);

    if (search) {
      query = query.where(like(dictionary.word, `%${search}%`));
    }

    let words: any[] = await query.limit(limit).offset((page - 1) * limit);

    for (const item of words) {
      const defs = await db
        .select()
        .from(definitions)
        .where(eq(definitions.wordId, item.id));

      const definitionDetails = await Promise.all(
        defs.map(async (d) => {
          const texts = await db
            .select()
            .from(definitionTexts)
            .where(eq(definitionTexts.definitionId, d.id));
          return texts;
        })
      );

      // fetch examples + example sentences
      const exs = await db
        .select()
        .from(examples)
        .where(eq(examples.wordId, item.id));

      const exampleDetails = await Promise.all(
        exs.map(async (e) => {
          const sentences = await db
            .select()
            .from(exampleSentences)
            .where(eq(exampleSentences.exampleId, e.id));
          return sentences;
        })
      );

      item.definitions = definitionDetails[0];
      item.examples = exampleDetails[0];
    }

    return {
      words: words,
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

  getWordDetails: async (wordId: number) => {
    // fetch definitions + definition texts
    const defs = await db
      .select()
      .from(definitions)
      .where(eq(definitions.wordId, wordId));

    const definitionDetails = await Promise.all(
      defs.map(async (d) => {
        const texts = await db
          .select()
          .from(definitionTexts)
          .where(eq(definitionTexts.definitionId, d.id));
        return { ...d, texts };
      })
    );

    // fetch examples + example sentences
    const exs = await db
      .select()
      .from(examples)
      .where(eq(examples.wordId, wordId));

    const exampleDetails = await Promise.all(
      exs.map(async (e) => {
        const sentences = await db
          .select()
          .from(exampleSentences)
          .where(eq(exampleSentences.exampleId, e.id));
        return { ...e, sentences };
      })
    );

    return {
      word: (
        await db.select().from(dictionary).where(eq(dictionary.id, wordId))
      )[0],
      definitions: definitionDetails,
      examples: exampleDetails,
    };
  },

  deleteWord: async (wordId: number) => {
    try {
      const definition = await db
        .select()
        .from(definitions)
        .where(eq(definitions.wordId, wordId));

      const example = await db
        .select()
        .from(examples)
        .where(eq(examples.wordId, wordId));

      await db.delete(definitions).where(eq(definitions.wordId, wordId));
      await db.delete(examples).where(eq(examples.wordId, wordId));
      await db
        .delete(definitionTexts)
        .where(eq(definitionTexts.definitionId, definition[0].id));
      await db
        .delete(exampleSentences)
        .where(eq(exampleSentences.exampleId, example[0].id));
      return await db.delete(dictionary).where(eq(dictionary.id, wordId));
      // cascades for definitions/examples via Drizzle foreign keys
    } catch (err) {
      console.log("err: ", err);
    }
  },

  createWord: async (data: {
    word: string;
    pronunciation: string;
    part_of_speech: string;
    meaning: string;
    definitions: { language: string; text: string }[];
    examples: { text: string }[];
  }) => {
    try {
      console.log("incoming request====> ", data);
      const result = await db
        .insert(dictionary)
        .values({
          word: data.word,
          meaning: data.meaning,
          pronunciation: data.pronunciation,
          part_of_speech: data.part_of_speech,
          search_count: 0,
        })
        .returning();

      const defintion = await db
        .insert(definitions)
        .values({ wordId: result[0].id })
        .returning();
      const example = await db
        .insert(examples)
        .values({ wordId: result[0].id })
        .returning();
      for (const item of data.definitions) {
        await db.insert(definitionTexts).values({
          definitionId: defintion[0].id,
          language: item.language,
          text: item.text,
          kind: "definition",
        });
      }

      for (const item of data.examples) {
        await db.insert(exampleSentences).values({
          exampleId: example[0].id,
          text: item.text,
        });
      }
    } catch (err) {
      console.log("err: ", err);
      throw err;
    }
  },

  updateWord: async (
    id: number,
    data: {
      word: string;
      pronunciation: string;
      part_of_speech: string;
      meaning: string;
      definitions: {
        id: number;
        definitionId: number;
        language: string;
        text: string;
      }[];
      examples: { id: number; exampleId: number; text: string }[];
    }
  ) => {
    console.log('update request ====> ', data)
    const definition = await db
      .select()
      .from(definitions)
      .where(eq(definitions.wordId, id));

    const example = await db
      .select()
      .from(examples)
      .where(eq(examples.wordId, id));

    for (const item of data.definitions) {
      const defintionText = await db
        .select()
        .from(definitionTexts)
        .where(eq(definitionTexts.id, item.id));
      if (defintionText.length <= 0) {
        await db.insert(definitionTexts).values({
          definitionId: definition[0].id,
          language: item.language,
          text: item.text,
          kind: "definition",
        });
      } else {
        await db
          .update(definitionTexts)
          .set({ text: item.text, language: item.language })
          .where(eq(definitionTexts.id, item.id));
      }
    }

    for (const item of data.examples) {
      const exampleSentence = await db
        .select()
        .from(exampleSentences)
        .where(eq(exampleSentences.id, item.id));
      if (exampleSentence.length <= 0) {
        await db.insert(exampleSentences).values({
           exampleId: example[0].id,
           text: item.text
        });
      } else {
        await db
          .update(exampleSentences)
          .set({ text: item.text })
          .where(eq(exampleSentences.id, item.id));
      }
    }

    await db.update(dictionary).set(data).where(eq(dictionary.id, id));
  },
};
