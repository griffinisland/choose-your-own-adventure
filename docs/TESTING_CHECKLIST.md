# Phase 1 Testing Checklist

## Setup
1. Make sure you're signed in (as a guest user)
2. Create a new project or open an existing project in edit mode

## Card CRUD Tests

### Create Card
- [ ] Click "Add Card" button in the top bar
- [ ] Verify a new card appears in the card list
- [ ] Verify the new card is automatically selected
- [ ] Verify the Inspector panel shows the new card

### Update Card Caption
- [ ] Select a card from the list
- [ ] In the Inspector, edit the caption in the textarea
- [ ] Verify the caption updates in real-time in the Inspector
- [ ] Verify the caption updates in the card list view
- [ ] Refresh the page
- [ ] Verify the caption persists after refresh

### Upload Card Image
- [ ] Select a card
- [ ] In the Inspector, click the file input under "Background Image"
- [ ] Select an image file (JPG, PNG, or WEBP)
- [ ] Verify the image uploads successfully
- [ ] Verify the image appears in the card list thumbnail
- [ ] Refresh the page
- [ ] Verify the image persists after refresh

### Replace Card Image
- [ ] Select a card that already has an image
- [ ] In the Inspector, click the file input again
- [ ] Select a different image file
- [ ] Verify the new image replaces the old one
- [ ] Verify the new image appears in the card list thumbnail
- [ ] Refresh the page
- [ ] Verify the new image persists (not the old one)

### Delete Card
- [ ] Select a card
- [ ] In the Inspector, scroll to "Project Settings" section
- [ ] Click "Delete Card" button
- [ ] Confirm deletion in the dialog
- [ ] Verify the card is removed from the list
- [ ] Verify another card is selected (or Inspector shows "Select a card" message)
- [ ] Refresh the page
- [ ] Verify the card is still deleted

## Choice CRUD Tests

### Create Choice
- [ ] Select a card
- [ ] In the Inspector, scroll to "Choices" section
- [ ] Click "Add Choice" button
- [ ] Verify a new choice appears with label "New Choice"
- [ ] Verify the choice has a target dropdown and delete button

### Update Choice Label
- [ ] Select a card with at least one choice
- [ ] In the choice's label input field, type a new label
- [ ] Verify the label updates in real-time
- [ ] Refresh the page
- [ ] Verify the label persists after refresh

### Set Choice Target
- [ ] Select a card with at least one choice
- [ ] In the choice's target dropdown, select another card
- [ ] Verify the target is set
- [ ] Refresh the page
- [ ] Verify the target persists after refresh

### Delete Choice
- [ ] Select a card with at least one choice
- [ ] Click the "✕" button on a choice
- [ ] Verify the choice is removed
- [ ] Refresh the page
- [ ] Verify the choice is still deleted

## Play Mode Tests

### Open Play Mode
- [ ] Click "Preview" button in the top bar
- [ ] Verify play mode opens in a new tab
- [ ] Verify the starting card is displayed (image, caption, choices)

### Navigate Between Cards
- [ ] In play mode, click a choice button that has a valid target
- [ ] Verify navigation to the target card works
- [ ] Verify the new card's image, caption, and choices are displayed
- [ ] Navigate through multiple cards
- [ ] Verify all navigation works correctly

### Broken Links
- [ ] In edit mode, create a choice with no target (leave dropdown as "None")
- [ ] Save and go to play mode
- [ ] Click the choice with no target
- [ ] Verify a friendly error message appears (should say "This choice goes nowhere yet.")
- [ ] Verify the app does not crash

### Image Display in Play Mode
- [ ] Upload images to multiple cards
- [ ] Go to play mode
- [ ] Navigate between cards
- [ ] Verify all card images display correctly
- [ ] Verify images persist after page refresh in play mode

## Edge Cases

### Delete Card with Inbound Choices
- [ ] Create Card A and Card B
- [ ] Add a choice from Card A to Card B
- [ ] Delete Card B
- [ ] Verify Card B is deleted
- [ ] Verify Card A's choice target is set to null (not crashing)
- [ ] Go to play mode, click the choice from Card A
- [ ] Verify friendly error message appears (doesn't crash)

### Delete Start Card
- [ ] Set a card as the start card (using "Set as Start Card" button)
- [ ] Delete that card
- [ ] Verify the card is deleted
- [ ] Verify the project still loads (may need to set a new start card)
- [ ] Verify play mode still works (may show "No cards available" or use first card)

### Multiple Cards and Choices
- [ ] Create 5+ cards
- [ ] Add 3+ choices to each card
- [ ] Link choices between various cards
- [ ] Verify all cards and choices appear correctly
- [ ] Verify play mode navigation works correctly
- [ ] Refresh the page
- [ ] Verify everything persists

### Empty States
- [ ] Create a new project (should have one default card)
- [ ] Verify the card list shows the default card
- [ ] Verify the Inspector shows the default card when selected
- [ ] Delete all cards (if possible)
- [ ] Verify the card list shows "No cards yet" message
- [ ] Verify the Inspector shows "Select a card to edit its properties" message

## Performance / UX
- [ ] Verify page loads quickly
- [ ] Verify card list scrolls smoothly with many cards
- [ ] Verify image uploads complete without hanging
- [ ] Verify no console errors appear
- [ ] Verify all buttons and inputs are responsive
