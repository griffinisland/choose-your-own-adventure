// Adventure Builder - InstantDB Schema
// https://instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      // InstantDB provides a signed download URL for serving files.
      // Including this field ensures it is available in $files query results.
      url: i.string().optional(),
    }),
    projects: i.entity({
      ownerId: i.string(),
      title: i.string(),
      isPublished: i.boolean(),
      projectType: i.string(),
      startCardId: i.string().optional(),
      thumbnailCardId: i.string().optional(),
      quizQuestionOrder: i.string().optional(),
      quizResultMessages: i.string().optional(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    cards: i.entity({
      projectId: i.string().indexed(),
      caption: i.string(),
      assetId: i.string().optional(),
      backgroundAssetId: i.string().optional(),
      correctAnswerAssetId: i.string().optional(),
      incorrectAnswerAssetId: i.string().optional(),
      positionX: i.number(),
      positionY: i.number(),
    }),
    choices: i.entity({
      cardId: i.string().indexed(),
      label: i.string(),
      targetCardId: i.string().optional(),
      order: i.number(),
      isCorrect: i.boolean().optional(),
    }),
    assets: i.entity({
      projectId: i.string().indexed(),
      storageKey: i.string(),
      url: i.string(),
      width: i.number().optional(),
      height: i.number().optional(),
      contentType: i.string().optional(),
      bytes: i.number().optional(),
    }),
    sceneElements: i.entity({
      cardId: i.string().indexed(),
      assetId: i.string(),
      positionX: i.number(),
      positionY: i.number(),
      width: i.number().optional(),
      height: i.number().optional(),
      zIndex: i.number(),
      targetCardId: i.string().optional(),
    }),
  },
});

type _AppSchema = typeof _schema;
export interface AppSchema extends _AppSchema {}
export const schema: AppSchema = _schema;
