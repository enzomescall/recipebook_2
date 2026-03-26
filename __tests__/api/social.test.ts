jest.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: true,
  getSupabaseClient: jest.fn()
}));

jest.mock('@/lib/api/shared', () => ({
  mapSupabaseError: jest.fn((error: unknown, _msg: string) => {
    if (error) throw new Error((error as { message?: string }).message ?? 'Supabase error');
  })
}));

import { getSupabaseClient } from '@/lib/supabase/client';
import { toggleMealLike, toggleFollowUser } from '../../lib/api/social';

const mockGetSupabaseClient = getSupabaseClient as jest.Mock;

// Build a mock supabase client where:
//   - The SELECT chain ends with maybeSingle() returning `selectResult`
//   - insert/delete are tracked so we can assert which was called
function buildSocialMock(selectResult: { data: unknown; error: null }) {
  const insertMock = jest.fn().mockResolvedValue({ error: null });
  const deleteMock = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    })
  });

  const selectChain = {
    eq: jest.fn()
  };
  // Two chained .eq() calls before .maybeSingle()
  const innerEq = {
    maybeSingle: jest.fn().mockResolvedValue(selectResult)
  };
  selectChain.eq.mockReturnValue(innerEq);

  const fromMock = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue(selectChain),
    insert: insertMock,
    delete: deleteMock
  });

  return { fromMock, insertMock, deleteMock };
}

describe('toggleMealLike', () => {
  const params = { userId: 'user-1', mealId: 'meal-1' };

  it('calls INSERT and returns true when no existing like', async () => {
    const { fromMock, insertMock } = buildSocialMock({ data: null, error: null });
    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const result = await toggleMealLike(params);

    expect(result).toBe(true);
    expect(insertMock).toHaveBeenCalledWith({ user_id: 'user-1', meal_id: 'meal-1' });
  });

  it('calls DELETE and returns false when an existing like is found', async () => {
    const { fromMock, deleteMock } = buildSocialMock({ data: { id: 'like-99' }, error: null });
    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const result = await toggleMealLike(params);

    expect(result).toBe(false);
    expect(deleteMock).toHaveBeenCalled();
  });
});

describe('toggleFollowUser', () => {
  const params = { followerId: 'user-1', followingId: 'user-2' };

  it('calls INSERT and returns true when not already following', async () => {
    const { fromMock, insertMock } = buildSocialMock({ data: null, error: null });
    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const result = await toggleFollowUser(params);

    expect(result).toBe(true);
    expect(insertMock).toHaveBeenCalledWith({ follower_id: 'user-1', following_id: 'user-2' });
  });

  it('calls DELETE and returns false when already following', async () => {
    const { fromMock, deleteMock } = buildSocialMock({ data: { id: 'follow-42' }, error: null });
    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const result = await toggleFollowUser(params);

    expect(result).toBe(false);
    expect(deleteMock).toHaveBeenCalled();
  });
});
