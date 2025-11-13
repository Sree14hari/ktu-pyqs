
'use client';

import { useState, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'pyq_history';

export interface HistoryItem {
    id: string;
    subjectCode: string;
    timestamp: string;
    paperUrls: string[];
    count: number;
}

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(HISTORY_KEY);
            const items = item ? JSON.parse(item) : [];
            // Sort by most recent first
            items.sort((a: HistoryItem, b: HistoryItem) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setHistory(items);
        } catch (error) {
            console.error("Failed to read history from localStorage", error);
            setHistory([]);
        }
    }, []);

    const addHistoryItem = useCallback((item: HistoryItem) => {
        try {
            const newHistory = [item, ...history];
            // Limit history to 20 items to prevent excessive storage use
            const limitedHistory = newHistory.slice(0, 20);
            setHistory(limitedHistory);
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    }, [history]);

    const removeHistoryItem = useCallback((id: string) => {
        try {
            const newHistory = history.filter(item => item.id !== id);
            setHistory(newHistory);
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error("Failed to remove item from localStorage", error);
        }
    }, [history]);

    return { history, addHistoryItem, removeHistoryItem };
}
