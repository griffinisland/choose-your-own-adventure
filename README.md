# HyperCard Adventures

A web-based visual novel and choose-your-own-adventure builder and player, inspired by HyperCard. Create interactive stories with images, captions, and branching choices.

![HyperCard Adventures](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![InstantDB](https://img.shields.io/badge/InstantDB-0.22-FF6B6B?style=flat-square)

## Features

### 🎮 Play Mode
- Fullscreen 16:9 visual novel experience
- Navigate through story cards by making choices
- Responsive design that scales to fit any screen

### ✏️ Edit Mode
- Visual card list editor
- Inspector sidebar for editing card properties
- Upload and replace background images (1920x1080 recommended)
- Add, edit, and reorder choices
- Set start card for each project
- JSON import/export for backup and sharing

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
│   ├── play/[projectId]/    # Play mode page
│   ├── login/               # Login page
│   └── page.tsx             # Home page (gallery)
├── components/              # React components
│   ├── editor/              # Editor components (CardList, Inspector)
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
2. Use the card list on the left to select a card
3. Use the inspector sidebar on the right to:
   - Edit the caption
   - Upload/replace the background image
   - Add, edit, or delete choices
   - Set as start card
   - Delete the card

### Playing a Project

1. Click "Play" on any published project card
2. Navigate through the story by clicking choice buttons
3. Click "Stop playing" to return to the gallery

### Importing/Exporting Projects

- **Export**: Click "Export JSON" in the edit page toolbar
- **Import**: Click "Import JSON" and select a previously exported JSON file
  - Creates a new project copy with remapped IDs
  - Reuses image URLs from the original project

## Image Specifications

- **Story Card Images**: 1920x1080 (16:9 aspect ratio) recommended
- **Thumbnail Images**: 1280x720 (16:9 aspect ratio) recommended, max 500KB
- **Supported Formats**: JPG, PNG, WEBP

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
