import { db } from './client';
import type { AppSchema } from '@/instant/schema';

export function usePublishedProjects() {
  const { data, isLoading, error } = db.useQuery({
    projects: {
      $: {
        where: { isPublished: true },
      },
    },
  });

  return {
    projects: data?.projects || [],
    isLoading,
    error,
  };
}

export function useProject(projectId: string) {
  const { data, isLoading, error } = db.useQuery({
    projects: {
      $: {
        where: { id: projectId },
      },
    },
    cards: {
      $: {
        where: { projectId },
      },
    },
    choices: {},
    assets: {
      $: {
        where: { projectId },
      },
    },
  });

  const project = data?.projects?.[0];
  const cards = data?.cards || [];
  const allChoices = data?.choices || [];
  const assets = data?.assets || [];

  // Filter choices to only those belonging to cards in this project
  const cardIds = new Set(cards.map((c) => c.id));
  const choices = allChoices.filter((ch) => cardIds.has(ch.cardId));

  return {
    project,
    cards,
    choices,
    assets,
    isLoading,
    error,
  };
}

export function useProjectForEdit(projectId: string) {
  const { data, isLoading, error } = db.useQuery({
    projects: {
      $: {
        where: { id: projectId },
      },
    },
    cards: {
      $: {
        where: { projectId },
      },
    },
    choices: {},
    assets: {
      $: {
        where: { projectId },
      },
    },
  });

  const project = data?.projects?.[0];
  const cards = data?.cards || [];
  const allChoices = data?.choices || [];
  const assets = data?.assets || [];

  // Filter choices to only those belonging to cards in this project
  const cardIds = new Set(cards.map((c) => c.id));
  const choices = allChoices.filter((ch) => cardIds.has(ch.cardId));

  return {
    project,
    cards,
    choices,
    assets,
    isLoading,
    error,
  };
}
