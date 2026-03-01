export type QuizResultMessage = { minPercent: number; maxPercent: number; message: string };

type AppSchema = {
  $files?: {
    id: string;
    path: string;
    /** Signed download URL returned by InstantDB */
    url?: string;
  };
  projects: {
    id: string;
    ownerId: string;
    title: string;
    isPublished: boolean;
    /** Default 'adventure' for existing records that lack this field */
    projectType?: 'adventure' | 'quiz';
    startCardId: string | null;
    thumbnailCardId: string | null;
    /** JSON array of card IDs; used when projectType === 'quiz' */
    quizQuestionOrder?: string;
    /** JSON array of QuizResultMessage; used when projectType === 'quiz' */
    quizResultMessages?: string;
    createdAt: number;
    updatedAt: number;
  };
  cards: {
    id: string;
    projectId: string;
    caption: string;
    assetId: string | null;
    backgroundAssetId: string | null;
    /** Optional image shown when user answers correctly (quiz only) */
    correctAnswerAssetId?: string | null;
    /** Optional image shown when user answers incorrectly (quiz only) */
    incorrectAnswerAssetId?: string | null;
    positionX: number;
    positionY: number;
  };
  choices: {
    id: string;
    cardId: string;
    label: string;
    targetCardId: string | null;
    order: number;
    /** True for the one correct answer per quiz question; default false for existing records */
    isCorrect?: boolean;
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
  sceneElements: {
    id: string;
    cardId: string;
    assetId: string;
    positionX: number;
    positionY: number;
    width?: number;
    height?: number;
    zIndex: number;
    targetCardId: string | null;
  };
};

export type { AppSchema };
// Runtime schema object (kept for backward compatibility); currently used for dev/docs, not for typechecking.
export const schema = {
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
  sceneElements: {
    rules: {},
  },
} as const;
