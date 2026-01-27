import { db, id } from './client';
import type { AppSchema } from '@/instant/schema';

type Project = AppSchema['projects'];
type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type Asset = AppSchema['assets'];
type SceneElement = AppSchema['sceneElements'];

export async function createProject(
  ownerId: string,
  title: string
): Promise<{ projectId: string; cardId: string }> {
  const now = Date.now();
  
  const projectId = id();
  const cardId = id();
  
  await db.transact([
    db.tx.projects[projectId].update({
      ownerId,
      title,
      isPublished: true,
      startCardId: cardId,
      thumbnailCardId: cardId,
      createdAt: now,
      updatedAt: now,
    }),
    db.tx.cards[cardId].update({
      projectId,
      caption: 'Start',
      assetId: null,
      positionX: 250,
      positionY: 250,
    }),
  ]);

  return { projectId, cardId };
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'ownerId' | 'createdAt'>>
) {
  await db.transact(
    db.tx.projects[projectId].update({
      ...updates,
      updatedAt: Date.now(),
    })
  );
}

export async function deleteProject(
  projectId: string,
  projectCards: Array<{ id: string; assetId?: string | null; backgroundAssetId?: string | null }>,
  projectChoices: Array<{ id: string }>,
  projectAssets: Array<{ id: string }>
) {
  // InstantDB requires manual deletion of related entities.
  // Delete in order: clear references -> delete scene elements -> delete choices -> delete cards -> delete assets -> delete project
  
  // Step 1: Clear all references from the project
  await db.transact(
    db.tx.projects[projectId].update({
      thumbnailCardId: null,
      startCardId: null,
    })
  );

  // Step 2: Query and delete scene elements for all cards in this project
  const cardIds = projectCards.map((c) => c.id);
  if (cardIds.length > 0) {
    // Query all scene elements and filter by cardId in JavaScript
    const { data } = await db.queryOnce({
      sceneElements: {},
    });
    const allSceneElements = data?.sceneElements || [];
    const projectSceneElements = allSceneElements.filter((el) =>
      cardIds.includes(el.cardId)
    );
    if (projectSceneElements.length > 0) {
      const sceneElementsTx = projectSceneElements.map((element) =>
        db.tx.sceneElements[element.id].delete()
      );
      await db.transact(sceneElementsTx);
    }
  }
  
  // Step 3: Delete choices (they reference cards)
  if (projectChoices.length > 0) {
    const choicesTx = projectChoices.map((choice) => db.tx.choices[choice.id].delete());
    await db.transact(choicesTx);
  }
  
  // Step 4: Clear assetId and backgroundAssetId from cards, then delete cards
  const cardsTx: any[] = [];
  projectCards.forEach((card) => {
    const updates: any = {};
    if (card.assetId) {
      updates.assetId = null;
    }
    if (card.backgroundAssetId) {
      updates.backgroundAssetId = null;
    }
    if (Object.keys(updates).length > 0) {
      cardsTx.push(db.tx.cards[card.id].update(updates));
    }
  });
  if (cardsTx.length > 0) {
    await db.transact(cardsTx);
  }
  
  // Now delete the cards
  if (projectCards.length > 0) {
    const deleteCardsTx = projectCards.map((card) => db.tx.cards[card.id].delete());
    await db.transact(deleteCardsTx);
  }
  
  // Step 5: Delete assets
  if (projectAssets.length > 0) {
    const assetsTx = projectAssets.map((asset) => db.tx.assets[asset.id].delete());
    await db.transact(assetsTx);
  }
  
  // Step 6: Finally delete the project
  await db.transact(db.tx.projects[projectId].delete());
}

export async function createCard(
  projectId: string,
  positionX: number,
  positionY: number
): Promise<string> {
  const cardId = id();
  await db.transact(
    db.tx.cards[cardId].update({
      projectId,
      caption: 'New Card',
      assetId: null,
      backgroundAssetId: null,
      positionX,
      positionY,
    })
  );
  return cardId;
}

export async function duplicateCard(
  cardId: string,
  projectId: string
): Promise<string> {
  // Query the original card and its scene elements
  const { data } = await db.queryOnce({
    cards: {
      $: {
        where: { id: cardId },
      },
    },
    sceneElements: {
      $: {
        where: { cardId },
      },
    },
  });

  const originalCard = data?.cards?.[0];
  if (!originalCard) {
    throw new Error('Card not found');
  }

  // Create new card with same properties, offset position
  const newCardId = id();
  const offsetX = 300; // Offset new card to the right
  const offsetY = 0;

  await db.transact(
    db.tx.cards[newCardId].update({
      projectId,
      caption: originalCard.caption || 'New Card',
      assetId: originalCard.assetId,
      backgroundAssetId: originalCard.backgroundAssetId,
      positionX: originalCard.positionX + offsetX,
      positionY: originalCard.positionY + offsetY,
    })
  );

  // Copy scene elements if they exist
  const originalSceneElements = data?.sceneElements || [];
  if (originalSceneElements.length > 0) {
    const sceneElementTx: any[] = [];
    originalSceneElements.forEach((element) => {
      const newElementId = id();
      sceneElementTx.push(
        db.tx.sceneElements[newElementId].update({
          cardId: newCardId,
          assetId: element.assetId,
          positionX: element.positionX,
          positionY: element.positionY,
          zIndex: element.zIndex,
          width: element.width,
          height: element.height,
          targetCardId: null, // Don't copy links to other cards
        })
      );
    });
    await db.transact(sceneElementTx);
  }

  return newCardId;
}

export async function updateCard(
  cardId: string,
  updates: Partial<Omit<Card, 'id' | 'projectId'>>
) {
  await db.transact(db.tx.cards[cardId].update(updates));
}

export async function deleteCard(cardId: string, projectId: string) {
  const { data } = await db.queryOnce({
    choices: {
      $: {
        where: { targetCardId: cardId },
      },
    },
    sceneElements: {
      $: {
        where: { cardId },
      },
    },
  });

  const inboundChoices = data?.choices || [];
  const cardSceneElements = data?.sceneElements || [];
  const tx: any[] = [
    ...inboundChoices.map((choice) =>
      db.tx.choices[choice.id].update({ targetCardId: null })
    ),
  ];

  const { data: outboundData } = await db.queryOnce({
    choices: {
      $: {
        where: { cardId },
      },
    },
  });

  const outboundChoices = outboundData?.choices || [];
  tx.push(
    ...outboundChoices.map((choice) => db.tx.choices[choice.id].delete()),
    ...cardSceneElements.map((element) => db.tx.sceneElements[element.id].delete()),
    db.tx.cards[cardId].delete()
  );

  await db.transact(tx);
}

export async function createChoice(
  cardId: string,
  label: string,
  targetCardId: string | null,
  order: number
): Promise<string> {
  const choiceId = id();
  await db.transact(
    db.tx.choices[choiceId].update({
      cardId,
      label,
      targetCardId,
      order,
    })
  );
  return choiceId;
}

export async function updateChoice(
  choiceId: string,
  updates: Partial<Omit<Choice, 'id' | 'cardId'>>
) {
  await db.transact(db.tx.choices[choiceId].update(updates));
}

export async function deleteChoice(choiceId: string) {
  await db.transact(db.tx.choices[choiceId].delete());
}

export async function createAsset(
  projectId: string,
  storageKey: string,
  url: string,
  metadata?: {
    width?: number;
    height?: number;
    contentType?: string;
    bytes?: number;
  }
): Promise<string> {
  const assetId = id();
  await db.transact(
    db.tx.assets[assetId].update({
      projectId,
      storageKey,
      url,
      ...metadata,
    })
  );
  return assetId;
}

export async function updateAsset(
  assetId: string,
  updates: {
    storageKey?: string;
    url?: string;
    width?: number;
    height?: number;
    contentType?: string;
    bytes?: number;
  }
) {
  await db.transact(db.tx.assets[assetId].update(updates));
}

export async function deleteAsset(assetId: string) {
  await db.transact(db.tx.assets[assetId].delete());
}

export async function createSceneElement(
  cardId: string,
  assetId: string,
  positionX: number,
  positionY: number,
  zIndex: number,
  width?: number,
  height?: number,
  targetCardId?: string | null
): Promise<string> {
  const elementId = id();
  await db.transact(
    db.tx.sceneElements[elementId].update({
      cardId,
      assetId,
      positionX,
      positionY,
      zIndex,
      width,
      height,
      targetCardId: targetCardId || null,
    })
  );
  return elementId;
}

export async function updateSceneElement(
  elementId: string,
  updates: Partial<Omit<SceneElement, 'id' | 'cardId' | 'assetId'>>
) {
  await db.transact(db.tx.sceneElements[elementId].update(updates));
}

export async function deleteSceneElement(elementId: string) {
  await db.transact(db.tx.sceneElements[elementId].delete());
}
