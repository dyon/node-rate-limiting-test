import { createClient } from 'redis';
import dayjs from 'dayjs';

// TODO: allow overriding the default connection details from the env
export const client = createClient();

client.on('error', (error) => {
  console.error(error);
});

export const hit = async (key: string, decaySeconds: number = 60) => {
  client.setEx(`${key}:timer`, decaySeconds, String(availableAt(decaySeconds)));

  if (!await has(key)) {
    client.setEx(key, decaySeconds, '0');
  }

  return await client.incr(key);
};

export const attempts = async (key: string) => {
  return Number(client.get(key));
};

export const has = async (key: string) => {
  return client.exists(key);
};

export const tooManyAttempts = async (key: string, maxAttempts: number) => {
  if (await attempts(key) >= maxAttempts) {
    if (await has(`${key}:timer`)) {
      return true;
    }

    // resetAttempts(key);
  }

  return false;
};

const availableAt = (seconds: number): number => {
  return dayjs().add(seconds, 'seconds').unix();
};

export default {
  hit,
  attempts,
  has,
};
