# Phase 1 Implementation Plan: Story Card CRUD

## Overview
This document outlines the implementation plan for Phase 1: Basic story card CRUD functionality with a simple UI (no flow chart editor yet).

## Current State
- Edit page exists at `/edit/[projectId]`
- FlowCanvas component exists (will be hidden for Phase 1)
- Inspector component exists with card editing functionality
- All CRUD mutations exist (createCard, updateCard, deleteCard, createChoice, updateChoice, deleteChoice)
- Play mode exists and works
- Image upload functionality exists

## Implementation Steps

### 1. Create Simple CardList Component ✅
- **File**: `components/editor/CardList.tsx`
- **Purpose**: Replace FlowCanvas with a simple list view of cards
- **Features**:
  - Display cards as a scrollable list
  - Show card thumbnail (if exists), caption, and card number
  - Highlight selected card
  - Click card to select it
  - Empty state message when no cards exist

### 2. Add "Add Card" Button ✅
- **Location**: Edit page top bar, next to project title
- **Functionality**: Creates a new card using `createCard` mutation
- **Behavior**: Auto-selects the newly created card

### 3. Fix Card Image URLs ✅
- **Problem**: Card images may not persist after page refresh (same issue as thumbnails)
- **Solution**: Use `$files` query to get actual storage URLs (same pattern as GalleryGrid thumbnails)
- **Files Updated**:
  - `app/edit/[projectId]/page.tsx` - Edit page card images
  - `app/play/[projectId]/page.tsx` - Play page card images

### 4. Update Edit Page to Use CardList ✅
- **Changes**:
  - Replace FlowCanvas import with CardList
  - Replace FlowCanvas component with CardList in render
  - Remove FlowCanvas-specific handlers (onNodeDragStop, onConnect)
  - Keep Inspector component as-is
  - Auto-select first card when cards load

### 5. Update Image Upload for Card Replacement ✅
- **Problem**: When uploading a new image to replace an existing one, should update the asset instead of creating a new one
- **Solution**: Check if card already has an asset, and if so, use `updateAsset` instead of `createAsset`

### 6. Add Delete Card Button to Inspector ✅
- **Location**: Inspector component, in "Project Settings" section
- **Functionality**: Delete the currently selected card
- **Safety**: Confirmation dialog before deletion

### 7. Verify All CRUD Operations
- **Create Card**: "Add Card" button works, card appears in list
- **Update Card**: Caption editing works, persists after refresh
- **Delete Card**: Delete button works, handles broken links gracefully
- **Create Choice**: "Add Choice" button works
- **Update Choice**: Label and target editing works, persists
- **Delete Choice**: Delete choice button works

### 8. Test Play Mode
- **Normal Flow**: Cards with valid choices navigate correctly
- **Broken Links**: Choices with null/missing targets show friendly message (already implemented in PlayerStage)
- **Image Display**: Card images display correctly in play mode

## Schema Considerations
No schema changes needed - all required fields already exist:
- `cards`: id, projectId, caption, assetId, positionX, positionY
- `choices`: id, cardId, label, targetCardId, order
- `assets`: id, projectId, storageKey, url, contentType, bytes

## Testing Checklist

### Card CRUD
- [ ] Create a new card using "Add Card" button
- [ ] Edit card caption - verify it saves
- [ ] Upload image to card - verify it displays
- [ ] Replace card image - verify old image is replaced
- [ ] Delete card - verify card is removed and selections are cleared
- [ ] Refresh page - verify all cards, captions, and images persist

### Choice CRUD
- [ ] Add choice to a card
- [ ] Edit choice label - verify it saves
- [ ] Set choice target to another card - verify it saves
- [ ] Delete choice - verify choice is removed
- [ ] Refresh page - verify all choices persist

### Play Mode
- [ ] Click "Preview" button - opens play mode in new tab
- [ ] Navigate between cards using choices - verify navigation works
- [ ] Click choice with null target - verify friendly error message
- [ ] Verify card images display correctly in play mode
- [ ] Verify captions display correctly in play mode

### Edge Cases
- [ ] Delete card that has inbound choices - verify choices are set to null (not crash)
- [ ] Delete card that is the start card - verify project still works
- [ ] Create card, then immediately delete it - verify no errors
- [ ] Upload very large image - verify error handling (if size limits exist)

## Files Changed

### New Files
- `components/editor/CardList.tsx` - Simple card list component

### Modified Files
- `app/edit/[projectId]/page.tsx` - Replaced FlowCanvas with CardList, added "Add Card" button, fixed image URLs
- `app/play/[projectId]/page.tsx` - Fixed card image URLs to use $files query
- `components/editor/Inspector.tsx` - Added onDeleteCard prop and Delete Card button
- `lib/instantdb/mutations.ts` - Already has all needed mutations (no changes needed)
