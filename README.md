# HyperCard Adventures

A web-based visual novel and choose-your-own-adventure builder and player, inspired by HyperCard. Create interactive stories with images, captions, and branching choices.

## Version 2.0 - What's New

### 🎨 Scene Builder 2.0
- **Full-screen Scene Builder**: Dedicated page for building complex interactive scenes
- **Background Images**: Upload background images for each story card
- **Overlay Elements**: Add multiple transparent PNG/JPG/GIF/WebP images that can be positioned, resized, and layered
- **Layer Management**: Control z-index ordering with send back/bring forward controls
- **Interactive Elements**: Link overlay images to other story cards for clickable hotspots
- **Right Rail Sidebar**: Organized controls panel with element management
- **Drag & Resize**: Intuitive drag-and-drop positioning with resize handles
- **Visual Feedback**: Bounding boxes and resize handles for precise editing

### 🎯 Enhanced Edit Mode
- **Card Duplication**: Duplicate story cards with all properties (images, choices, scene elements)
- **Zoom Lock**: Fixed at 50% zoom for consistent editing experience
- **Improved Card Selection**: Reliable card clicking and inspector opening at all zoom levels
- **Ghost Preview**: Visual feedback when dragging cards
- **Scene Thumbnails**: Card thumbnails display complete scenes (background + overlay elements)

### 📸 Image Support
- **Multiple Formats**: Support for JPG, PNG, GIF, and WebP images
- **Scene Elements**: Upload overlay images for interactive scenes
- **Background Images**: Separate background image system for scene building

![HyperCard Adventures](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![InstantDB](https://img.shields.io/badge/InstantDB-0.22-FF6B6B?style=flat-square)

## Features

### 🎮 Play Mode
- Fullscreen 16:9 visual novel experience
- Navigate through story cards by making choices
- **Interactive Scenes**: Click on overlay elements to navigate to linked cards
- **Scene Rendering**: Displays complete scenes with backgrounds and overlay elements
- Responsive design that scales to fit any screen

### ✏️ Edit Mode
- **React Flow Canvas**: Visual node-based editor with drag-and-drop card positioning
- **Inspector Sidebar**: Edit card properties, choices, and scene elements
- **Scene Builder**: Full-screen editor for building interactive scenes with backgrounds and overlay elements
- **Card Duplication**: Duplicate cards with all properties intact
- **Background Images**: Upload background images for scene building (1920x1080 recommended)
- **Overlay Elements**: Add multiple images that can be positioned, resized, and linked to other cards
- **Layer Management**: Control element stacking order (z-index)
- **Add, edit, and reorder choices**: Manage branching story paths
- **Set start card**: Designate the entry point for each project
- **JSON import/export**: Backup and share projects
- **Zoom Lock**: Fixed at 50% for consistent editing experience

### 🏠 Gallery
- Public gallery of all published projects
- Thumbnail images (1280x720 recommended)
- Inline project title editing
- Play and Edit buttons
- Project deletion with confirmation

### 🔐 Authentication
- Custom admin authentication system
- Session-based login (stored in sessionStorage)
- Protected routes for editing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: InstantDB (real-time database, auth, file storage)
- **Deployment**: Ready for Netlify

## Prerequisites

- Node.js 18+ and npm
- InstantDB account and app ID
- Git (for cloning)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone git@github.com:griffinisland/choose-your-own-adventure.git
cd choose-your-own-adventure
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure InstantDB

1. Create an account at [instantdb.com](https://instantdb.com)
2. Create a new app
3. Copy your App ID
4. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_INSTANT_APP_ID=your-app-id-here
```

### 4. Push InstantDB Schema and Permissions

The project includes schema and permissions files that need to be pushed to InstantDB:

**Option A: Using instant-cli (Recommended)**

```bash
npx instant-cli push
```

**Option B: Manual Configuration**

1. Go to your InstantDB dashboard
2. Navigate to Schema and copy the contents of `instant/schema.ts`
3. Navigate to Permissions and copy the contents of `instant/permissions.ts`

### 5. Configure Admin Users

Edit `lib/auth/adminUsers.ts` to set your admin credentials:

```typescript
const ADMIN_USERS = [
  { username: 'YourUsername', password: 'YourPassword' },
  // Add more admin users as needed
];
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── edit/[projectId]/    # Edit mode page
│   │   └── scene/[cardId]/  # Scene Builder page (v2.0)
│   ├── play/[projectId]/    # Play mode page
│   ├── login/               # Login page
│   └── page.tsx             # Home page (gallery)
├── components/              # React components
│   ├── editor/              # Editor components
│   │   ├── FlowCanvas.tsx   # React Flow canvas editor
│   │   ├── CardNode.tsx     # Story card node component
│   │   ├── Inspector.tsx    # Card inspector sidebar
│   │   ├── SceneBuilder.tsx # Scene Builder (v2.0)
│   │   └── DeletableEdge.tsx # Deletable connection edges
│   ├── AuthButton.tsx       # Authentication button
│   ├── GalleryGrid.tsx      # Project gallery grid
│   ├── PlayerStage.tsx      # Play mode stage
│   └── ...
├── lib/
│   ├── auth/                # Custom authentication
│   ├── instantdb/           # InstantDB client, queries, mutations
│   └── importExport/        # JSON import/export functionality
├── instant/
│   ├── schema.ts            # InstantDB schema definition
│   └── permissions.ts       # InstantDB permissions rules
└── docs/                    # Documentation files
```

## Usage

### Creating a Project

1. Sign in with your admin credentials
2. Click "New Project" on the home page
3. You'll be redirected to the edit page

### Editing a Project

1. Click "Edit" on any project card (must be signed in as admin)
2. **Canvas View**: Drag and drop cards to reposition them on the canvas
3. Click on a card to select it and open the inspector
4. Use the inspector sidebar on the right to:
   - Edit the caption
   - Enter Scene Builder to create interactive scenes
   - Add, edit, or delete choices
   - Set as start card
   - Duplicate the card (v2.0)
   - Delete the card

### Building Scenes (v2.0)

1. Select a card in edit mode
2. Click "Enter Scene Builder" in the inspector
3. **Upload Background**: Add a background image for the scene
4. **Add Elements**: Upload overlay images (PNG, JPG, GIF, WebP)
5. **Position Elements**: Drag elements to position them
6. **Resize Elements**: Use resize handles to adjust size
7. **Manage Layers**: Use ↑/↓ buttons to change element stacking order
8. **Link Elements**: Click the link button to connect elements to other cards
9. **Delete Elements**: Use the delete button to remove elements
10. Click "Save & Exit" to return to edit mode

### Playing a Project

1. Click "Play" on any published project card
2. Navigate through the story by clicking choice buttons
3. Click "Stop playing" to return to the gallery

### Importing/Exporting Projects

- **Export**: Click "Export JSON" in the edit page toolbar
  - Exports all project data including scenes, background images, and overlay elements (v2.0)
- **Import**: Click "Import JSON" and select a previously exported JSON file
  - Creates a new project copy with remapped IDs
  - Reuses image URLs from the original project
  - Preserves scene elements and background images (v2.0)

## Image Specifications

- **Background Images**: 1920x1080 (16:9 aspect ratio) recommended for scene backgrounds
- **Overlay Elements**: Transparent PNG recommended for overlay elements, but JPG, PNG, GIF, and WebP are all supported
- **Story Card Images**: 1920x1080 (16:9 aspect ratio) recommended (legacy support)
- **Thumbnail Images**: 1280x720 (16:9 aspect ratio) recommended, max 500KB
- **Supported Formats**: JPG, PNG, GIF, WebP (v2.0)

## Deployment

### Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variable: `NEXT_PUBLIC_INSTANT_APP_ID=your-app-id`
6. Deploy!

### Environment Variables

Make sure to set `NEXT_PUBLIC_INSTANT_APP_ID` in your deployment platform's environment variables.

## Development Notes

- The app uses InstantDB guest authentication for public queries (play mode)
- Custom authentication is used for admin access (edit mode)
- Image URLs are retrieved from InstantDB's `$files` query, not stored directly
- All mutations are handled through `lib/instantdb/mutations.ts`

## Troubleshooting

### Images not loading
- Ensure InstantDB storage permissions are configured correctly
- Check that `$files` entity is included in your schema
- Verify your `NEXT_PUBLIC_INSTANT_APP_ID` is set correctly

### Can't create projects
- Verify you're signed in as an admin user
- Check InstantDB schema and permissions are pushed
- Check browser console for error messages

### Thumbnails not persisting
- Ensure the `$files` query is working (check network tab)
- Verify storage permissions allow file uploads

## License

This project is private and proprietary.

## Contributing

This is a private project. For questions or issues, please contact the repository owner.

---

Built with Next.js and InstantDB
