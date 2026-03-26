import type { ProfileRow } from '../../types/database';

// Mock the supabase client before importing the module under test
jest.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: true,
  getSupabaseClient: jest.fn()
}));

// Mock the shared error helper so we can control it in tests
jest.mock('@/lib/api/shared', () => ({
  mapSupabaseError: jest.fn((error: unknown, _msg: string) => {
    if (error) throw new Error((error as { message?: string }).message ?? 'Supabase error');
  })
}));

import { getSupabaseClient } from '@/lib/supabase/client';
import { getCurrentProfile, updateCurrentProfile } from '../../lib/api/profiles';

const mockGetSupabaseClient = getSupabaseClient as jest.Mock;

function makeFakeProfileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    bio: 'A short bio',
    profile_image_url: 'https://example.com/avatar.png',
    followers_count: 5,
    following_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    ...overrides
  };
}

function buildChain(finalResult: unknown) {
  // Builds a chainable Supabase query mock: .from().select().eq().maybeSingle()
  const chain: Record<string, jest.Mock> = {};
  chain.maybeSingle = jest.fn().mockResolvedValue(finalResult);
  chain.single = jest.fn().mockResolvedValue(finalResult);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.select = jest.fn().mockReturnValue(chain);
  chain.upsert = jest.fn().mockReturnValue(chain);
  chain.from = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('getCurrentProfile', () => {
  it('returns a correctly mapped camelCase UserProfile', async () => {
    const row = makeFakeProfileRow();
    const chain = buildChain({ data: row, error: null });

    mockGetSupabaseClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
      from: chain.from
    });

    const profile = await getCurrentProfile();

    expect(profile.id).toBe('user-123');
    expect(profile.username).toBe('testuser');
    expect(profile.displayName).toBe('Test User');
    expect(profile.bio).toBe('A short bio');
    expect(profile.profileImageUrl).toBe('https://example.com/avatar.png');
    expect(profile.followersCount).toBe(5);
    expect(profile.followingCount).toBe(3);
  });

  it('throws when there is no authenticated user', async () => {
    const chain = buildChain({ data: null, error: null });

    mockGetSupabaseClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: chain.from
    });

    await expect(getCurrentProfile()).rejects.toThrow('No authenticated user.');
  });

  it('propagates a Supabase error thrown by mapSupabaseError', async () => {
    const chain = buildChain({ data: null, error: { message: 'DB connection failed' } });

    mockGetSupabaseClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
      from: chain.from
    });

    await expect(getCurrentProfile()).rejects.toThrow('DB connection failed');
  });
});

describe('updateCurrentProfile', () => {
  it('returns an updated camelCase UserProfile after upsert', async () => {
    const row = makeFakeProfileRow({ display_name: 'New Name', bio: 'Updated bio' });
    const chain = buildChain({ data: row, error: null });

    mockGetSupabaseClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: { username: 'testuser' }
            }
          }
        })
      },
      from: chain.from
    });

    const profile = await updateCurrentProfile({
      username: 'testuser',
      displayName: 'New Name',
      bio: 'Updated bio',
      profileImageUrl: null
    });

    expect(profile.displayName).toBe('New Name');
    expect(profile.bio).toBe('Updated bio');
  });

  it('throws when there is no authenticated user', async () => {
    const chain = buildChain({ data: null, error: null });

    mockGetSupabaseClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: chain.from
    });

    await expect(
      updateCurrentProfile({ username: 'x', displayName: 'X', bio: null, profileImageUrl: null })
    ).rejects.toThrow('No authenticated user.');
  });
});
