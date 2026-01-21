import { init, id } from '@instantdb/react';
import { schema } from '@/instant.schema';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

const initDb = () =>
  init({
    appId: APP_ID as string,
    schema,
  });

type DB = ReturnType<typeof initDb>;

function missingAppId(): never {
  throw new Error(
    'Instant must be initialized with an appId. Set NEXT_PUBLIC_INSTANT_APP_ID and redeploy.'
  );
}

// IMPORTANT:
// Do NOT call `init()` with an empty appId.
// If NEXT_PUBLIC_INSTANT_APP_ID is missing in a deployment, InstantDB will throw at import-time,
// crashing the whole app (blank screen). Instead, export a stub that throws only when used,
// allowing the UI to render a helpful configuration message.
export const db: DB = APP_ID
  ? initDb()
  : ({
      transact: missingAppId,
      queryOnce: missingAppId,
      useQuery: missingAppId,
      useAuth: missingAppId,
      useConnectionStatus: missingAppId,
      getAuth: missingAppId,
      getLocalId: missingAppId,
      useLocalId: missingAppId,
      room: missingAppId,
      rooms: missingAppId as unknown as DB['rooms'],
      auth: {
        signInAsGuest: missingAppId,
        signInWithToken: missingAppId,
        sendMagicCode: missingAppId,
        signInWithMagicCode: missingAppId,
        signInWithIdToken: missingAppId,
        createAuthorizationURL: missingAppId,
        signOut: missingAppId,
      } as unknown as DB['auth'],
      storage: {
        upload: missingAppId,
        delete: missingAppId,
        getDownloadUrl: missingAppId,
      } as unknown as DB['storage'],
      tx: missingAppId as unknown as DB['tx'],
      core: missingAppId as unknown as DB['core'],
      _core: missingAppId as unknown as DB['_core'],
    } as unknown as DB);

export { id };
