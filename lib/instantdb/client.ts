import { init, id } from '@instantdb/react';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || '';

if (!APP_ID) {
  console.warn('NEXT_PUBLIC_INSTANT_APP_ID is not set');
}

export const db = init({
  appId: APP_ID,
});

export { id };
