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

    let words: any[] = await query.limit(limit).offset((page - 1) * limit);

    // Batch fetch all related data
    const wordIds = words.map(w => w.id);
    
    // Fetch all definitions and examples in parallel
    const [allDefinitions, allExamples] = await Promise.all([
      db
        .select()
        .from(definitions)
        .where(inArray(definitions.wordId, wordIds)),
      db
        .select()
        .from(examples)
        .where(inArray(examples.wordId, wordIds)),
    ]);

    // Fetch definition texts and example sentences in parallel
    const definitionIds = allDefinitions.map(d => d.id);
    const exampleIds = allExamples.map(e => e.id);

    const [allDefinitionTexts, allExampleSentences] = await Promise.all([
      definitionIds.length > 0
        ? db
            .select()
            .from(definitionTexts)
            .where(inArray(definitionTexts.definitionId, definitionIds))
        : Promise.resolve([]),
      exampleIds.length > 0
        ? db
            .select()
            .from(exampleSentences)
            .where(inArray(exampleSentences.exampleId, exampleIds))
        : Promise.resolve([]),
    ]);

    // Group data by word in memory
    const definitionsByWordId = new Map<number, any[]>();
    const examplesByWordId = new Map<number, any[]>();

    allDefinitions.forEach(def => {
      if (!definitionsByWordId.has(def.wordId)) {
        definitionsByWordId.set(def.wordId, []);
      }
      const texts = allDefinitionTexts.filter(
        dt => dt.definitionId === def.id
      );
      definitionsByWordId.get(def.wordId)!.push(...texts);
    });

    allExamples.forEach(ex => {
      if (!examplesByWordId.has(ex.wordId)) {
        examplesByWordId.set(ex.wordId, []);
      }
      const sentences = allExampleSentences.filter(
        es => es.exampleId === ex.id
      );
      examplesByWordId.get(ex.wordId)!.push(...sentences);
    });

    // Attach grouped data to words
    words = words.map(word => ({
      ...word,
      definitions: definitionsByWordId.get(word.id) || [],
      examples: examplesByWordId.get(word.id) || [],
    }));

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
    // Fetch word, definitions, examples in parallel
    const [word, wordDefinitions, wordExamples] = await Promise.all([
      db.select().from(dictionary).where(eq(dictionary.id, wordId)),
      db
        .select()
        .from(definitions)
        .where(eq(definitions.wordId, wordId)),
      db
        .select()
        .from(examples)
        .where(eq(examples.wordId, wordId)),
    ]);

    // Fetch definition texts and example sentences in parallel
    const definitionIds = wordDefinitions.map(d => d.id);
    const exampleIds = wordExamples.map(e => e.id);

    const [allDefinitionTexts, allExampleSentences] = await Promise.all([
      definitionIds.length > 0
        ? db
            .select()
            .from(definitionTexts)
            .where(inArray(definitionTexts.definitionId, definitionIds))
        : Promise.resolve([]),
      exampleIds.length > 0
        ? db
            .select()
            .from(exampleSentences)
            .where(inArray(exampleSentences.exampleId, exampleIds))
        : Promise.resolve([]),
    ]);

    // Group definition texts by definition id
    const definitionDetails = wordDefinitions.map(def => ({
      ...def,
      texts: allDefinitionTexts.filter(dt => dt.definitionId === def.id),
    }));

    // Group example sentences by example id
    const exampleDetails = wordExamples.map(ex => ({
      ...ex,
      sentences: allExampleSentences.filter(es => es.exampleId === ex.id),
    }));

    return {
      word: word[0],
      definitions: definitionDetails,
      examples: exampleDetails,
    };
  },

  deleteWord: async (wordId: number) => {
    try {
      const [definitions_list, examples_list] = await Promise.all([
        db
          .select()
          .from(definitions)
          .where(eq(definitions.wordId, wordId)),
        db
          .select()
          .from(examples)
          .where(eq(examples.wordId, wordId)),
      ]);

      const definitionIds = definitions_list.map(d => d.id);
      const exampleIds = examples_list.map(e => e.id);

      // Delete in parallel
      await Promise.all([
        db.delete(definitions).where(eq(definitions.wordId, wordId)),
        db.delete(examples).where(eq(examples.wordId, wordId)),
        definitionIds.length > 0
          ? db
              .delete(definitionTexts)
              .where(inArray(definitionTexts.definitionId, definitionIds))
          : Promise.resolve(),
        exampleIds.length > 0
          ? db
              .delete(exampleSentences)
              .where(inArray(exampleSentences.exampleId, exampleIds))
          : Promise.resolve(),
      ]);

      return await db.delete(dictionary).where(eq(dictionary.id, wordId));
    } catch (err) {
      console.log("err: ", err);
    }
  },

  createWord: async (data: {
    word: string;
    pronuncation: string;
    part_of_speech: string;
    definitions: { language: string; text: string, kind: string }[];
    examples: { text: string }[];
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

      const result = await db
        .insert(dictionary)
        .values({
          word: data.word,
          pronunciation: data.pronuncation,
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
          kind: item.kind,
        });
      }

      for (const item of data.examples) {
        await db.insert(exampleSentences).values({
          exampleId: example[0].id,
          text: item.text,
        });
      }

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
      definitions: {
        id: number;
        definitionId: number;
        kind: string;
        language: string;
        text: string;
      }[];
      examples: { id: number; exampleId: number; text: string }[];
    }
  ) => {
    try {

      const definition = await db
        .select()
        .from(definitions)
        .where(eq(definitions.wordId, id));

      const example = await db
        .select()
        .from(examples)
        .where(eq(examples.wordId, id));

      // Get all existing definitions and examples
      const existingDefinitions = await db
        .select()
        .from(definitionTexts)
        .where(eq(definitionTexts.definitionId, definition[0].id));

      const existingExamples = await db
        .select()
        .from(exampleSentences)
        .where(eq(exampleSentences.exampleId, example[0].id));

      // Delete definitions that are not in the request
      const definitionsToDelete = existingDefinitions.filter(
        existing => !data.definitions.some(d => d.id === existing.id)
      );
      for (const defToDelete of definitionsToDelete) {
        await db.delete(definitionTexts).where(eq(definitionTexts.id, defToDelete.id));
      }

      // Delete examples that are not in the request
      const exampleSentencesToDelete = existingExamples.filter(
        existing => !data.examples.some(e => e.id === existing.id)
      );
      for (const exToDelete of exampleSentencesToDelete) {
        await db.delete(exampleSentences).where(eq(exampleSentences.id, exToDelete.id));
      }

      // Insert or update definitions
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
            kind: item.kind,
          });
        } else {
          await db
            .update(definitionTexts)
            .set({ text: item.text, language: item.language, kind: item.kind })
            .where(eq(definitionTexts.id, item.id));
        }
      }

      // Insert or update examples
      for (const item of data.examples) {
        const exampleSentence = await db
          .select()
          .from(exampleSentences)
          .where(eq(exampleSentences.id, item.id));
        if (exampleSentence.length <= 0) {
          await db.insert(exampleSentences).values({
            exampleId: example[0].id,
            text: item.text,
          });
        } else {
          await db
            .update(exampleSentences)
            .set({ text: item.text })
            .where(eq(exampleSentences.id, item.id));
        }
      }

      await db.update(dictionary).set(data).where(eq(dictionary.id, id));

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
