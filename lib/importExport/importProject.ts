import { db, id } from '@/lib/instantdb/client';
import { createIdMap, remapId } from '@/lib/utils/id';
import {
  createProject,
  createCard,
  createChoice,
  createAsset,
  updateProject,
} from '@/lib/instantdb/mutations';
import type { ExportedProjectV1 } from './types';
import type { AppSchema } from '@/instant/schema';
import { createSceneElement } from '@/lib/instantdb/mutations';

type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type SceneElement = AppSchema['sceneElements'];

export async function importProject(
  data: ExportedProjectV1,
  ownerId: string
): Promise<{ projectId: string }> {
  const now = Date.now();

  const { projectId, cardId: initialCardId } = await createProject(
    ownerId,
    data.project.title || 'Imported Project'
  );

  const cardIdMap = createIdMap(data.cards);
  const choiceIdMap = createIdMap(data.choices);
  const assetIdMap = createIdMap(data.assets);
  // Handle backward compatibility: sceneElements may not exist in old exports
  const sceneElementIdMap = createIdMap((data as any).sceneElements || []);

  const firstImportedCard = data.cards[0];
  if (firstImportedCard) {
    cardIdMap.set(firstImportedCard.id, initialCardId);
  }

  const txs = [];

  for (const asset of data.assets) {
    const newAssetId = assetIdMap.get(asset.id)!;
    txs.push(
      db.tx.assets[newAssetId].update({
        projectId,
        storageKey: asset.storageKey,
        url: asset.url,
        width: asset.width,
        height: asset.height,
        contentType: asset.contentType,
        bytes: asset.bytes,
      })
    );
  }

  for (const card of data.cards) {
    const newCardId = cardIdMap.get(card.id)!;
    const remappedAssetId = remapId(card.assetId, assetIdMap);
    const remappedBackgroundAssetId = remapId(card.backgroundAssetId, assetIdMap);
    const remappedCorrectAnswerAssetId = remapId(
      (card as Card & { correctAnswerAssetId?: string | null }).correctAnswerAssetId,
      assetIdMap
    );
    const remappedIncorrectAnswerAssetId = remapId(
      (card as Card & { incorrectAnswerAssetId?: string | null }).incorrectAnswerAssetId,
      assetIdMap
    );

    txs.push(
      db.tx.cards[newCardId].update({
        projectId,
        caption: card.caption,
        assetId: remappedAssetId,
        backgroundAssetId: remappedBackgroundAssetId,
        correctAnswerAssetId: remappedCorrectAnswerAssetId ?? undefined,
        incorrectAnswerAssetId: remappedIncorrectAnswerAssetId ?? undefined,
        positionX: card.positionX,
        positionY: card.positionY,
      })
    );
  }

  for (const choice of data.choices) {
    const newChoiceId = choiceIdMap.get(choice.id)!;
    const remappedCardId = remapId(choice.cardId, cardIdMap)!;
    const remappedTargetCardId = remapId(choice.targetCardId, cardIdMap);
    const isCorrect = (choice as Choice & { isCorrect?: boolean }).isCorrect;

    txs.push(
      db.tx.choices[newChoiceId].update({
        cardId: remappedCardId,
        label: choice.label,
        targetCardId: remappedTargetCardId,
        order: choice.order,
        isCorrect: isCorrect ?? false,
      })
    );
  }

  const remappedStartCardId = remapId(data.project.startCardId, cardIdMap);
  const remappedThumbnailCardId = remapId(
    data.project.thumbnailCardId,
    cardIdMap
  );

  let remappedQuizQuestionOrder: string | undefined;
  if (data.project.quizQuestionOrder) {
    try {
      const order = JSON.parse(data.project.quizQuestionOrder) as string[];
      remappedQuizQuestionOrder = JSON.stringify(
        order.map((id) => cardIdMap.get(id) ?? id)
      );
    } catch {
      remappedQuizQuestionOrder = data.project.quizQuestionOrder;
    }
  }

  txs.push(
    db.tx.projects[projectId].update({
      title: data.project.title,
      isPublished: data.project.isPublished,
      startCardId: remappedStartCardId,
      thumbnailCardId: remappedThumbnailCardId,
      projectType: data.project.projectType,
      quizQuestionOrder: remappedQuizQuestionOrder,
      quizResultMessages: data.project.quizResultMessages,
      updatedAt: now,
    })
  );

  await db.transact(txs);

  // Import scene elements (backward compatible: may not exist in old exports)
  const sceneElementsToImport = (data as any).sceneElements || [];
  if (sceneElementsToImport.length > 0) {
    const sceneElementTxs = [];
    for (const element of sceneElementsToImport) {
      const newElementId = sceneElementIdMap.get(element.id)!;
      const remappedCardId = remapId(element.cardId, cardIdMap)!;
      const remappedAssetId = remapId(element.assetId, assetIdMap)!;
      const remappedTargetCardId = remapId(element.targetCardId, cardIdMap);

      sceneElementTxs.push(
        db.tx.sceneElements[newElementId].update({
          cardId: remappedCardId,
          assetId: remappedAssetId,
          positionX: element.positionX,
          positionY: element.positionY,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
          targetCardId: remappedTargetCardId,
        })
      );
    }
    if (sceneElementTxs.length > 0) {
      await db.transact(sceneElementTxs);
    }
  }

  return { projectId };
}
