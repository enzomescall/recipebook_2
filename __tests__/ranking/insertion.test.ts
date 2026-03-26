import {
  createRankingSession,
  nextComparison,
  resolveComparison,
  type RankedItem,
  type RankingSession
} from '../../lib/ranking/insertion';

describe('createRankingSession', () => {
  it('initializes with low=0 and high=items.length', () => {
    const items: RankedItem[] = [
      { id: 'a', rankPosition: 0 },
      { id: 'b', rankPosition: 1 },
      { id: 'c', rankPosition: 2 }
    ];
    const session = createRankingSession('subject', items);
    expect(session.subjectId).toBe('subject');
    expect(session.low).toBe(0);
    expect(session.high).toBe(3);
    expect(session.steps).toEqual([]);
  });

  it('handles an empty items list (high=0)', () => {
    const session = createRankingSession('subject', []);
    expect(session.low).toBe(0);
    expect(session.high).toBe(0);
  });

  it('handles a single-item list (high=1)', () => {
    const session = createRankingSession('subject', [{ id: 'only', rankPosition: 0 }]);
    expect(session.low).toBe(0);
    expect(session.high).toBe(1);
  });
});

describe('nextComparison', () => {
  const items: RankedItem[] = [
    { id: 'a', rankPosition: 0 },
    { id: 'b', rankPosition: 1 },
    { id: 'c', rankPosition: 2 },
    { id: 'd', rankPosition: 3 }
  ];

  it('returns the midpoint item as the right side of the comparison', () => {
    const session = createRankingSession('subject', items);
    // low=0, high=4 → pivot = Math.floor((0+4)/2) = 2 → items[2] = 'c'
    const step = nextComparison(session, items);
    expect(step).not.toBeNull();
    expect(step!.leftId).toBe('subject');
    expect(step!.rightId).toBe('c');
    expect(step!.pivotIndex).toBe(2);
  });

  it('returns null when low === high (insertion point found)', () => {
    const session: RankingSession = {
      subjectId: 'subject',
      low: 2,
      high: 2,
      steps: []
    };
    expect(nextComparison(session, items)).toBeNull();
  });

  it('returns null for an empty items list', () => {
    const session = createRankingSession('subject', []);
    expect(nextComparison(session, [])).toBeNull();
  });
});

describe('resolveComparison', () => {
  const items: RankedItem[] = [
    { id: 'a', rankPosition: 0 },
    { id: 'b', rankPosition: 1 },
    { id: 'c', rankPosition: 2 },
    { id: 'd', rankPosition: 3 }
  ];

  it('moves high down to pivotIndex when subject is preferred', () => {
    const session = createRankingSession('subject', items);
    // pivot = 2, items[2] = 'c'
    const next = resolveComparison(session, items, 'subject', 'c');
    expect(next.high).toBe(2);
    expect(next.low).toBe(0);
  });

  it('moves low up to pivotIndex+1 when compared item is preferred', () => {
    const session = createRankingSession('subject', items);
    // pivot = 2, items[2] = 'c'
    const next = resolveComparison(session, items, 'c', 'c');
    expect(next.low).toBe(3);
    expect(next.high).toBe(4);
  });

  it('records the step in the session', () => {
    const session = createRankingSession('subject', items);
    const next = resolveComparison(session, items, 'subject', 'c');
    expect(next.steps).toHaveLength(1);
    expect(next.steps[0]).toEqual({ leftId: 'subject', rightId: 'c', pivotIndex: 2 });
  });

  it('returns the original session unchanged when comparedAgainstId is not found', () => {
    const session = createRankingSession('subject', items);
    const next = resolveComparison(session, items, 'subject', 'nonexistent');
    expect(next).toEqual(session);
  });

  it('eventually converges to a single insertion point', () => {
    // Walk through a full binary search on a 4-item list
    let session = createRankingSession('subject', items);

    // Step 1: pivot=2 ('c'). Prefer subject → high=2
    let step = nextComparison(session, items)!;
    session = resolveComparison(session, items, 'subject', step.rightId);
    expect(session.high).toBe(2);

    // Step 2: pivot=1 ('b'). Prefer subject → high=1
    step = nextComparison(session, items)!;
    session = resolveComparison(session, items, 'subject', step.rightId);
    expect(session.high).toBe(1);

    // Step 3: pivot=0 ('a'). Prefer subject → high=0
    step = nextComparison(session, items)!;
    session = resolveComparison(session, items, 'subject', step.rightId);
    expect(session.high).toBe(0);

    // Now low===high: converged
    expect(session.low).toBe(0);
    expect(nextComparison(session, items)).toBeNull();
  });
});

describe('full binary insertion simulation', () => {
  const makeItems = (count: number): RankedItem[] =>
    Array.from({ length: count }, (_, i) => ({ id: `item${i}`, rankPosition: i }));

  it('inserts at position 0 when subject is always preferred', () => {
    const items = makeItems(5);
    let session = createRankingSession('subject', items);

    // Always prefer subject (subject is better than everything)
    while (true) {
      const step = nextComparison(session, items);
      if (!step) break;
      session = resolveComparison(session, items, 'subject', step.rightId);
    }

    // low===high===0: subject inserts before all items
    expect(session.low).toBe(0);
    expect(session.high).toBe(0);
  });

  it('inserts at position N when compared item is always preferred', () => {
    const items = makeItems(5);
    let session = createRankingSession('subject', items);

    // Always prefer the compared item (subject is worse than everything)
    while (true) {
      const step = nextComparison(session, items);
      if (!step) break;
      session = resolveComparison(session, items, step.rightId, step.rightId);
    }

    // low===high===5: subject inserts after all items
    expect(session.low).toBe(5);
    expect(session.high).toBe(5);
  });
});
