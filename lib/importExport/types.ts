import type { AppSchema } from '@/instant/schema';

export interface ExportedProjectV1 {
  version: 1;
  project: {
    title: string;
    isPublished: boolean;
    startCardId: string | null;
    thumbnailCardId: string | null;
  };
  cards: Array<
    Omit<AppSchema['cards'], 'projectId' | 'assetId'> & { assetId: string | null }
  >;
  choices: Array<Omit<AppSchema['choices'], 'cardId'> & { cardId: string }>;
  assets: Array<
    Omit<AppSchema['assets'], 'projectId'> & {
      projectId?: string;
      width?: number;
      height?: number;
      contentType?: string;
      bytes?: number;
    }
  >;
}
