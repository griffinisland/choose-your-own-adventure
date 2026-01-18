# Developer Notes

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- InstantDB account and app created

### Installation

1. Clone the repository (or navigate to the project directory)
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_INSTANT_APP_ID=your-instant-app-id
```

4. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## InstantDB Setup

### Creating an InstantDB App

1. Sign up for an InstantDB account at [instantdb.com](https://instantdb.com)
2. Create a new app in the dashboard
3. Copy your App ID and set it in `.env.local` as `NEXT_PUBLIC_INSTANT_APP_ID`

### Schema and Permissions

The schema is defined in `instant/schema.ts`. The permissions are documented in `instant/permissions.ts` but need to be configured in the InstantDB dashboard or via instant-cli.

#### Using instant-cli (Recommended)

1. Install instant-cli globally:

```bash
npm install -g @instantdb/cli
```

2. Initialize InstantDB in your project:

```bash
instant init
```

3. Push schema and permissions:

```bash
instant push
```

This will sync your schema and permissions from the `instant/` directory to InstantDB.

#### Manual Configuration

Alternatively, you can configure permissions directly in the InstantDB dashboard:

**Projects:**
- Read: `auth.uid == ownerId or isPublished == true`
- Create/Update/Delete: `auth.uid == ownerId`

**Cards:**
- Read: `projects.isPublished == true or projects.ownerId == auth.uid`
- Create/Update/Delete: `projects.ownerId == auth.uid`

**Choices:**
- Read: `cards.projects.isPublished == true or cards.projects.ownerId == auth.uid`
- Create/Update/Delete: `cards.projects.ownerId == auth.uid`

**Assets:**
- Read: `projects.isPublished == true or projects.ownerId == auth.uid`
- Create/Update/Delete: `projects.ownerId == auth.uid`

### Storage Configuration

InstantDB storage is used for image uploads. Storage permissions are configured in the InstantDB dashboard to allow uploads only for project owners.

## Netlify Deployment

### Build Settings

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18.x or higher

### Environment Variables

Add the following environment variable in Netlify:
- `NEXT_PUBLIC_INSTANT_APP_ID`: Your InstantDB App ID

### Deployment

Netlify will automatically deploy when you push to the connected branch (typically `main` or `master`).

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── edit/[projectId]/  # Edit mode page
│   ├── play/[projectId]/  # Play mode page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/gallery page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── editor/           # Editor-specific components
│   ├── AuthButton.tsx    # Authentication button
│   ├── GalleryGrid.tsx   # Gallery grid display
│   ├── PlayerStage.tsx   # Play mode stage
│   └── TopNav.tsx        # Top navigation
├── lib/                  # Utility libraries
│   ├── instantdb/        # InstantDB client and queries
│   ├── importExport/     # JSON import/export logic
│   └── utils/            # General utilities
├── instant/              # InstantDB schema and permissions
│   ├── schema.ts         # TypeScript schema definition
│   └── permissions.ts    # Permissions documentation
└── docs/                 # Documentation
    └── DEV_NOTES.md      # This file
```

## Data Model

### Projects
- `id`: Unique identifier
- `ownerId`: User ID of the project owner
- `title`: Project title
- `isPublished`: Whether the project is publicly visible
- `startCardId`: ID of the starting card
- `thumbnailCardId`: ID of the card to use as thumbnail
- `createdAt`: Creation timestamp (ms)
- `updatedAt`: Last update timestamp (ms)

### Cards
- `id`: Unique identifier
- `projectId`: ID of the parent project
- `caption`: Text caption displayed on the card
- `assetId`: ID of the associated image asset (nullable)
- `positionX`: X position in the editor (for React Flow)
- `positionY`: Y position in the editor (for React Flow)

### Choices
- `id`: Unique identifier
- `cardId`: ID of the source card
- `label`: Button label text
- `targetCardId`: ID of the target card (nullable)
- `order`: Display order (for sorting)

### Assets
- `id`: Unique identifier
- `projectId`: ID of the parent project
- `storageKey`: InstantDB storage key
- `url`: Public URL of the asset
- `width`, `height`, `contentType`, `bytes`: Optional metadata

## Key Features

### Authentication
- Uses InstantDB guest auth for builders
- Public users can play published games without authentication
- Only authenticated owners can edit projects

### Editor Features
- Drag-and-drop flowchart interface (React Flow)
- Visual node connections create choices
- Inspector sidebar for editing card properties
- Image upload via InstantDB storage
- Set start card
- Delete cards (with safe handling of inbound links)
- Delete projects (with cascade delete of all related data)

### Play Mode
- Fullscreen 16:9 stage with responsive scaling
- Image background with caption overlay
- Choice buttons for navigation
- Graceful handling of broken/missing links

### Import/Export
- Export projects as JSON
- Import JSON to create new projects
- ID remapping ensures internal links remain valid
- Asset URLs/keys are preserved (no re-upload)

## Extending the MVP

### Potential Future Features

1. **Variables and Conditions**
   - Add variables/state to projects
   - Conditional choices based on variable values
   - Set variables when making choices

2. **Inventory System**
   - Allow players to collect items
   - Conditional choices based on inventory items

3. **Collaboration**
   - Multiple builders can work on a project simultaneously
   - Real-time presence and conflict resolution

4. **Versioning and History**
   - Track changes to projects
   - Revert to previous versions

5. **Advanced UI/UX**
   - More sophisticated styling and animations
   - Custom fonts, sound effects, music
   - Rich text editor for captions

6. **Monetization**
   - Paid access to games
   - In-game purchases

7. **Community Features**
   - Comments, ratings, sharing
   - Featured games gallery
