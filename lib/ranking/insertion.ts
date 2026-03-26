export type RankedItem = {
  id: string;
  rankPosition: number;
};

export type ComparisonStep = {
  leftId: string;
  rightId: string;
  pivotIndex: number;
};

export type RankingSession = {
  subjectId: string;
  low: number;
  high: number;
  steps: ComparisonStep[];
};

export function createRankingSession(subjectId: string, items: RankedItem[]) {
  return {
    subjectId,
    low: 0,
    high: items.length,
    steps: [] as ComparisonStep[]
  };
}

export function nextComparison(session: RankingSession, items: RankedItem[]) {
  if (session.low >= session.high) {
    return null;
  }

  const pivotIndex = Math.floor((session.low + session.high) / 2);
  const rightItem = items[pivotIndex];
  if (!rightItem) {
    return null;
  }

  return {
    leftId: session.subjectId,
    rightId: rightItem.id,
    pivotIndex
  } satisfies ComparisonStep;
}

export function resolveComparison(
  session: RankingSession,
  items: RankedItem[],
  preferredId: string,
  comparedAgainstId: string
) {
  const pivotIndex = items.findIndex((item) => item.id === comparedAgainstId);
  if (pivotIndex === -1) {
    return session;
  }

  const nextSession = { ...session, steps: [...session.steps] };
  if (preferredId === session.subjectId) {
    nextSession.high = pivotIndex;
  } else {
    nextSession.low = pivotIndex + 1;
  }

  nextSession.steps.push({
    leftId: session.subjectId,
    rightId: comparedAgainstId,
    pivotIndex
  });

  return nextSession;
}
