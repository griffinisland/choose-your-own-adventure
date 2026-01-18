// Adventure Builder - InstantDB Schema
// https://instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
    }),
    projects: i.entity({
      ownerId: i.string(),
      title: i.string(),
      isPublished: i.boolean(),
      startCardId: i.string().optional(),
      thumbnailCardId: i.string().optional(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    cards: i.entity({
      projectId: i.string().indexed(),
      caption: i.string(),
      assetId: i.string().optional(),
      positionX: i.number(),
      positionY: i.number(),
    }),
    choices: i.entity({
      cardId: i.string().indexed(),
      label: i.string(),
      targetCardId: i.string().optional(),
      order: i.number(),
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
  },
});

type _AppSchema = typeof _schema;
export interface AppSchema extends _AppSchema {}
export const schema: AppSchema = _schema;
