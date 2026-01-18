import type { ExportedProjectV1 } from './types';
import type { AppSchema } from '@/instant/schema';

type Project = AppSchema['projects'];
type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type Asset = AppSchema['assets'];

export function exportProject(
  project: Project,
  cards: Card[],
  choices: Choice[],
  assets: Asset[]
): ExportedProjectV1 {
  return {
    version: 1,
    project: {
      title: project.title,
      isPublished: project.isPublished,
      startCardId: project.startCardId,
      thumbnailCardId: project.thumbnailCardId,
    },
    cards: cards.map((card) => ({
      id: card.id,
      caption: card.caption,
      assetId: card.assetId,
      positionX: card.positionX,
      positionY: card.positionY,
    })),
    choices: choices.map((choice) => ({
      id: choice.id,
      cardId: choice.cardId,
      label: choice.label,
      targetCardId: choice.targetCardId,
      order: choice.order,
    })),
    assets: assets.map((asset) => ({
      id: asset.id,
      storageKey: asset.storageKey,
      url: asset.url,
      width: asset.width,
      height: asset.height,
      contentType: asset.contentType,
      bytes: asset.bytes,
    })),
  };
}

export function downloadProject(
  project: Project,
  cards: Card[],
  choices: Choice[],
  assets: Asset[]
): void {
  const exportData = exportProject(project, cards, choices, assets);
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || 'project'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
