'use client';

import { useState, useEffect, KeyboardEvent } from 'react';

interface EditableTitleProps {
  title: string;
  onUpdate: (title: string) => Promise<void>;
  className?: string;
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4';
  showEditButton?: boolean;
}

export function EditableTitle({
  title,
  onUpdate,
  className = '',
  headingLevel = 'h3',
  showEditButton = true,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when title prop changes (when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditingTitle(title);
    }
  }, [title, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditingTitle(title);
  };

  const handleSave = async () => {
    if (editingTitle.trim() === '') {
      setEditingTitle(title);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(editingTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const HeadingTag = headingLevel;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={`flex-1 px-2 py-1 border border-gray-300 rounded-md ${className} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
        >
          {isSaving ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Cancel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <HeadingTag className={`${className} truncate flex-1`}>
        {title}
      </HeadingTag>
      {showEditButton && (
        <button
          onClick={handleEdit}
          className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
          title="Edit title"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}
