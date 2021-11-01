import { hit, attempts, has } from './redis-store';

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
    }
  });

  return { createClient };
});

describe('Redis store', () => {
  beforeEach(() => {
    store = {};
  });

  it('increments a value and returns the current value', async () => {
    const hits = await hit('user-1');

    expect(hits).toBe(1);
  });

  it('returns the value for an existing key', async () => {
    // Add 2 hits
    await hit('user-1');
    await hit('user-1');

    const value = await attempts('user-1');

    expect(value).toBe(2);
  });

  it('checks if a key exists', async () => {
    // Create an entry for `user-1`
    await hit('user-1');

    const exists = await has('user-1');
    const doesNotExist = await has('user-2');

    expect(exists).toBe(true);
    expect(doesNotExist).toBe(false);
  });
});
