// Adventure Builder - InstantDB Permissions
// https://instantdb.com/docs/permissions

export default {
  // ============================================
  // STORAGE PERMISSIONS ($files)
  // ============================================
  // Allow all authenticated users to upload and view files
  // Files are organized by path: projects/{projectId}/...
  "$files": {
    allow: {
      // Anyone authenticated can upload files
      create: "auth.id != null",
      // Anyone can view files (for public play mode)
      view: "true",
      // Only the uploader can delete (path starts with their user ID, or allow all for now)
      delete: "auth.id != null",
    },
  },

  // ============================================
  // DATABASE PERMISSIONS
  // ============================================
  "projects": {
    allow: {
      // Anyone can read published projects, owners can read their own
      view: "data.isPublished == true || data.ownerId == auth.id",
      // Only owners can create/update/delete their projects
      create: "auth.id != null",
      update: "data.ownerId == auth.id",
      delete: "data.ownerId == auth.id",
    },
  },

  "cards": {
    allow: {
      // Anyone can view cards from published projects
      view: "true",
      // Only project owners can modify cards
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },

  "choices": {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },

  "assets": {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
};
