import type { Schema } from '@instantdb/react';

type AppSchema = {
  projects: {
    id: string;
    ownerId: string;
    title: string;
    isPublished: boolean;
    startCardId: string | null;
    thumbnailCardId: string | null;
    createdAt: number;
    updatedAt: number;
  };
  cards: {
    id: string;
    projectId: string;
    caption: string;
    assetId: string | null;
    positionX: number;
    positionY: number;
  };
  choices: {
    id: string;
    cardId: string;
    label: string;
    targetCardId: string | null;
    order: number;
  };
  assets: {
    id: string;
    projectId: string;
    storageKey: string;
    url: string;
    width?: number;
    height?: number;
    contentType?: string;
    bytes?: number;
  };
};

export type { AppSchema };
export const schema: Schema<AppSchema> = {
  projects: {
    rules: {},
  },
  cards: {
    rules: {},
  },
  choices: {
    rules: {},
  },
  assets: {
    rules: {},
  },
};
