'use client';

import { GalleryGrid } from '@/components/GalleryGrid';
import { useAuth } from '@/lib/auth/authContext';
import { createProject, createQuiz } from '@/lib/instantdb/mutations';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Home() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  const handleNewProject = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const { projectId } = await createProject(user.username, 'Untitled Project');
      window.location.href = `/edit/${projectId}`;
    } catch (error) {
      console.error('Failed to create project:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to create project: ${errorMessage}\n\nCheck the browser console for details.`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNewQuiz = async () => {
    if (!user) return;
    setIsCreatingQuiz(true);
    try {
      const { projectId } = await createQuiz(user.username, 'Untitled Quiz');
      window.location.href = `/edit/${projectId}`;
    } catch (error) {
      console.error('Failed to create quiz:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to create quiz: ${errorMessage}\n\nCheck the browser console for details.`);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8">
          <div className="flex justify-between items-center mb-8 px-6">
            <h1 className="text-3xl font-bold text-gray-900">Adventure Gallery</h1>
            {user && (
              <div className="flex gap-2">
                <button
                  onClick={handleNewProject}
                  disabled={isCreating || isCreatingQuiz}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'New Project'}
                </button>
                <button
                  onClick={handleNewQuiz}
                  disabled={isCreating || isCreatingQuiz}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCreatingQuiz ? 'Creating...' : 'New Quiz'}
                </button>
              </div>
            )}
          </div>
          <GalleryGrid />
        </div>
      </main>
    </ProtectedRoute>
  );
}
