import type { AppSchema } from './schema';

type Permissions = {
  projects: {
    'allow read': 'auth.uid == ownerId or isPublished == true';
    'allow create,update,delete': 'auth.uid == ownerId';
  };
  cards: {
    'allow read': 'projects.isPublished == true or projects.ownerId == auth.uid';
    'allow create,update,delete': 'projects.ownerId == auth.uid';
  };
  choices: {
    'allow read': 'cards.projects.isPublished == true or cards.projects.ownerId == auth.uid';
    'allow create,update,delete': 'cards.projects.ownerId == auth.uid';
  };
  assets: {
    'allow read': 'projects.isPublished == true or projects.ownerId == auth.uid';
    'allow create,update,delete': 'projects.ownerId == auth.uid';
  };
};

// Note: This is a TypeScript type definition for documentation.
// Actual permissions are configured in the InstantDB dashboard or via instant-cli.
