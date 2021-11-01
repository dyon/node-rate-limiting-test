import { hit, attempts, has, tooManyAttempts } from './redis-store';

// Create a manual Redis mock because the `redis-mock` package hasn't been
// updated to support the new Promises functionality added to `redis@next`
let store: any = {};

jest.mock('redis', () => {
  const createClient = () => ({
    on: jest.fn(),
    exists: (key: string) => {
      return !!store[key];
    },
    setEx: (key: string, seconds: number, value: string) => {
      store[key] = {
        seconds,
        value,
      };

      return true;
    },
    get: (key: string) => {
      return store[key]?.value;
    },
    incr: (key: string) => {
      let value = Number(store[key].value);

      store[key].value = ++value;

      return store[key].value;
    },
  });

  return { createClient };
});

describe('Redis store', () => {
  const firstUserIdentifier = 'user-1';
  const secondUserIdentifier = 'user-2';

  beforeEach(() => {
    store = {};
  });

  it('increments a value and returns the current value', async () => {
    const hits = await hit(firstUserIdentifier);

    expect(hits).toBe(1);
  });

  it('returns the value for an existing key', async () => {
    // Add 2 hits
    await hit(firstUserIdentifier);
    await hit(firstUserIdentifier);

    const value = await attempts(firstUserIdentifier);

    expect(value).toBe(2);
  });

  it('checks if a key exists', async () => {
    // Create an entry for the first user
    await hit(firstUserIdentifier);

    const exists = await has(firstUserIdentifier);
    const doesNotExist = await has(secondUserIdentifier);

    expect(exists).toBe(true);
    expect(doesNotExist).toBe(false);
  });

  it('checks if an existing key has reached the maximum number of attempts', async () => {
    const maxAttempts = 2;

    // Add the first hit
    await hit(firstUserIdentifier);
    await hit(secondUserIdentifier);

    let firstUserMaximumReached = await tooManyAttempts(firstUserIdentifier, maxAttempts);
    let secondUserMaximumReached = await tooManyAttempts(secondUserIdentifier, maxAttempts);

    expect(firstUserMaximumReached).toBe(false);
    expect(secondUserMaximumReached).toBe(false);

    // Add a second hit to the first user only
    await hit(firstUserIdentifier);

    firstUserMaximumReached = await tooManyAttempts(firstUserIdentifier, maxAttempts);
    secondUserMaximumReached = await tooManyAttempts(secondUserIdentifier, maxAttempts);

    expect(firstUserMaximumReached).toBe(true);
    expect(secondUserMaximumReached).toBe(false);
  });
});
