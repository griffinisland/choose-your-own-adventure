import { db, id } from './client';
import type { AppSchema } from '@/instant/schema';

type Project = AppSchema['projects'];
type Card = AppSchema['cards'];
type Choice = AppSchema['choices'];
type Asset = AppSchema['assets'];

export async function createProject(
  ownerId: string,
  title: string
): Promise<{ projectId: string; cardId: string }> {
  const now = Date.now();
  
  const projectId = id();
  const cardId = id();
  
  await db.transact(
    db.tx.projects[projectId].update({
      id: projectId,
      ownerId,
      title,
      isPublished: true,
      startCardId: cardId,
      thumbnailCardId: cardId,
      createdAt: now,
      updatedAt: now,
    }),
    db.tx.cards[cardId].update({
      id: cardId,
      projectId,
      caption: 'Start',
      assetId: null,
      positionX: 250,
      positionY: 250,
    })
  );

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
  projectCards: Array<{ id: string; assetId?: string | null }>,
  projectChoices: Array<{ id: string }>,
  projectAssets: Array<{ id: string }>
) {
  // InstantDB requires manual deletion of related entities.
  // Delete in order: clear references -> delete choices -> delete cards -> delete assets -> delete project
  
  // Step 1: Clear all references from the project
  await db.transact(
    db.tx.projects[projectId].update({
      thumbnailCardId: null,
      startCardId: null,
    })
  );
  
  // Step 2: Delete choices (they reference cards)
  if (projectChoices.length > 0) {
    const choicesTx = projectChoices.map((choice) => db.tx.choices[choice.id].delete());
    await db.transact(...choicesTx);
  }
  
  // Step 3: Clear assetId from cards, then delete cards
  const cardsTx: any[] = [];
  projectCards.forEach((card) => {
    if (card.assetId) {
      cardsTx.push(db.tx.cards[card.id].update({ assetId: null }));
    }
  });
  if (cardsTx.length > 0) {
    await db.transact(...cardsTx);
  }
  
  // Now delete the cards
  if (projectCards.length > 0) {
    const deleteCardsTx = projectCards.map((card) => db.tx.cards[card.id].delete());
    await db.transact(...deleteCardsTx);
  }
  
  // Step 4: Delete assets
  if (projectAssets.length > 0) {
    const assetsTx = projectAssets.map((asset) => db.tx.assets[asset.id].delete());
    await db.transact(...assetsTx);
  }
  
  // Step 5: Finally delete the project
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
      id: cardId,
      projectId,
      caption: 'New Card',
      assetId: null,
      positionX,
      positionY,
    })
  );
  return cardId;
}

export async function updateCard(
  cardId: string,
  updates: Partial<Omit<Card, 'id' | 'projectId'>>
) {
  await db.transact(db.tx.cards[cardId].update(updates));
}

export async function deleteCard(cardId: string, projectId: string) {
  const { data } = await db.query({
    choices: {
      $: {
        where: { targetCardId: cardId },
      },
    },
  });

  const inboundChoices = data?.choices || [];
  const tx = [
    ...inboundChoices.map((choice) =>
      db.tx.choices[choice.id].update({ targetCardId: null })
    ),
  ];

  const { data: outboundData } = await db.query({
    choices: {
      $: {
        where: { cardId },
      },
    },
  });

  const outboundChoices = outboundData?.choices || [];
  tx.push(
    ...outboundChoices.map((choice) => db.tx.choices[choice.id].delete()),
    db.tx.cards[cardId].delete()
  );

  await db.transact(...tx);
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
      id: choiceId,
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
      id: assetId,
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
