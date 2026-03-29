import { useState, useCallback } from "react";

export function useEditorHistory(initialText: string) {
  const [history, setHistory] = useState<string[]>([initialText]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pushState = useCallback((newText: string) => {
    setHistory((prev) => {
      // Don't push if it's the exact same text
      if (prev[currentIndex] === newText) return prev;
      
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newText);
      
      // Limit history size to prevent memory leaks
      if (newHistory.length > 100) {
        newHistory.shift();
      }
      return newHistory;
    });
    setCurrentIndex((prev) => Math.min(prev + 1, 100));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return history[currentIndex];
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return history[currentIndex];
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { pushState, undo, redo, canUndo, canRedo, history, currentIndex };
}
