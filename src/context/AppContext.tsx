import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkItem, Person, Sprint, AppState, WorkItemType, WorkItemState, Priority, Comment } from '@/types';

interface AppContextType extends AppState {
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'comments'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  addComment: (workItemId: string, text: string, authorId?: string) => void;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addSprint: (name: string, startDate?: number) => void;
  setActiveSprint: (id: string | null) => void;
  getNextSprint: () => Sprint | null;
  getPreviousSprint: () => Sprint | null;
  navigateToNextSprint: () => void;
  navigateToPreviousSprint: () => void;
  authenticate: (password: string) => boolean;
  logout: () => void;
  getChildItems: (parentId: string) => WorkItem[];
  getPersonById: (id: string) => Person | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'topi-gang-task-board';
const PASSWORD = 'lockin2024';

const defaultPeople: Person[] = [
  { id: '1', name: 'Alex Chen', handle: 'alex' },
  { id: '2', name: 'Jordan Lee', handle: 'jordan' },
  { id: '3', name: 'Sam Rivera', handle: 'sam' },
  { id: '4', name: 'Casey Kim', handle: 'casey' },
  { id: '5', name: 'Morgan Wu', handle: 'morgan' },
  { id: '6', name: 'Taylor Patel', handle: 'taylor' },
];

// Helper function to calculate 2-week sprint dates
const getSprintDates = (startDate?: number) => {
  const start = startDate || Date.now();
  const end = start + (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
  return { startDate: start, endDate: end };
};

const defaultSprints: Sprint[] = [
  { 
    id: 'sprint-1', 
    name: 'Sprint 1', 
    isActive: true,
    ...getSprintDates()
  },
];

const defaultWorkItems: WorkItem[] = [
  {
    id: 'wi-1',
    title: 'Set up project infrastructure',
    type: 'User Story',
    state: 'Active',
    assigneeId: '1',
    priority: 'High',
    tags: ['setup'],
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-2',
    title: 'Configure CI/CD pipeline',
    type: 'Task',
    state: 'New',
    assigneeId: '2',
    priority: 'High',
    tags: ['devops'],
    parentId: 'wi-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-3',
    title: 'Database migration blocked',
    type: 'Task',
    state: 'Active',
    assigneeId: '3',
    priority: 'Critical',
    tags: ['Blocker', 'database'],
    parentId: 'wi-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-4',
    title: 'Authentication flow broken',
    type: 'Bug',
    state: 'Active',
    assigneeId: '4',
    priority: 'Critical',
    tags: ['Blocker', 'auth'],
    sprintId: 'sprint-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-5',
    title: 'User management epic',
    type: 'Epic',
    state: 'Active',
    assigneeId: '5',
    priority: 'High',
    tags: ['users'],
    sprintId: 'sprint-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-6',
    title: 'Deploy monitoring stack',
    type: 'Operation',
    state: 'New',
    assigneeId: '6',
    priority: 'Medium',
    tags: ['monitoring'],
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
];

/**
 * Migration helper to ensure old data format is compatible with new schema.
 * Adds description and comments fields to work items that may not have them.
 */
const migrateWorkItems = (items: any[]): WorkItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(item => ({
    ...item,
    description: item.description || '',
    comments: item.comments || [],
  }));
};

/**
 * Migration helper for sprints.
 * Ensures all sprints have startDate and endDate fields for 2-week sprint logic.
 * If a sprint is missing dates, it uses the current date as the start date.
 */
const migrateSprints = (sprints: any[]): Sprint[] => {
  if (!Array.isArray(sprints)) {
    return [];
  }
  return sprints.map(sprint => {
    // If sprint already has dates, use them
    if (sprint.startDate && sprint.endDate) {
      return sprint;
    }
    // Migrate old sprints without dates - use current date as start
    const { startDate, endDate } = getSprintDates();
    return {
      ...sprint,
      startDate,
      endDate,
    };
  });
};

const loadState = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old data format
      if (parsed.workItems) {
        parsed.workItems = migrateWorkItems(parsed.workItems);
      }
      if (parsed.sprints) {
        parsed.sprints = migrateSprints(parsed.sprints);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return {};
};

const saveState = (state: Partial<AppState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    return {
      workItems: loaded.workItems || defaultWorkItems,
      people: loaded.people || defaultPeople,
      sprints: loaded.sprints || defaultSprints,
      activeSprint: loaded.activeSprint || 'sprint-1',
      isAuthenticated: false,
    };
  });

  useEffect(() => {
    const { isAuthenticated, ...toSave } = state;
    saveState(toSave);
  }, [state]);

  const addWorkItem = (item: Omit<WorkItem, 'id' | 'createdAt' | 'comments'>) => {
    const newItem: WorkItem = {
      ...item,
      id: `wi-${Date.now()}`,
      createdAt: Date.now(),
      comments: [],
    };
    setState(prev => ({ ...prev, workItems: [...prev.workItems, newItem] }));
  };

  const updateWorkItem = (id: string, updates: Partial<WorkItem>) => {
    setState(prev => ({
      ...prev,
      workItems: prev.workItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteWorkItem = (id: string) => {
    setState(prev => ({
      ...prev,
      workItems: prev.workItems.filter(item => item.id !== id && item.parentId !== id),
    }));
  };

  const addPerson = (person: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...person,
      id: `person-${Date.now()}`,
    };
    setState(prev => ({ ...prev, people: [...prev.people, newPerson] }));
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setState(prev => ({
      ...prev,
      people: prev.people.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deletePerson = (id: string) => {
    setState(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== id),
      workItems: prev.workItems.map(item =>
        item.assigneeId === id ? { ...item, assigneeId: undefined } : item
      ),
    }));
  };

  const addSprint = (name: string, startDate?: number) => {
    const { startDate: sprintStartDate, endDate } = getSprintDates(startDate);
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name,
      isActive: false,
      startDate: sprintStartDate,
      endDate,
    };
    setState(prev => ({ ...prev, sprints: [...prev.sprints, newSprint] }));
  };

  const addComment = (workItemId: string, text: string, authorId?: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      text,
      createdAt: Date.now(),
      authorId,
    };
    setState(prev => ({
      ...prev,
      workItems: prev.workItems.map(item => {
        if (item.id === workItemId) {
          return {
            ...item,
            comments: [...(item.comments || []), newComment],
          };
        }
        return item;
      }),
    }));
  };

  const setActiveSprint = (id: string | null) => {
    setState(prev => ({
      ...prev,
      activeSprint: id,
      sprints: prev.sprints.map(s => ({ ...s, isActive: s.id === id })),
    }));
  };

  // Get next sprint (chronologically by start date)
  const getNextSprint = (): Sprint | null => {
    if (!state.activeSprint) {
      return null;
    }
    const currentSprint = state.sprints.find(s => s.id === state.activeSprint);
    if (!currentSprint) {
      return null;
    }
    // Find next sprint by start date
    const sortedSprints = [...state.sprints].sort((a, b) => a.startDate - b.startDate);
    const currentIndex = sortedSprints.findIndex(s => s.id === state.activeSprint);
    if (currentIndex >= 0 && currentIndex < sortedSprints.length - 1) {
      return sortedSprints[currentIndex + 1];
    }
    return null;
  };

  // Get previous sprint (chronologically by start date)
  const getPreviousSprint = (): Sprint | null => {
    if (!state.activeSprint) {
      return null;
    }
    const currentSprint = state.sprints.find(s => s.id === state.activeSprint);
    if (!currentSprint) {
      return null;
    }
    // Find previous sprint by start date
    const sortedSprints = [...state.sprints].sort((a, b) => a.startDate - b.startDate);
    const currentIndex = sortedSprints.findIndex(s => s.id === state.activeSprint);
    if (currentIndex > 0) {
      return sortedSprints[currentIndex - 1];
    }
    return null;
  };

  // Navigate to next sprint
  const navigateToNextSprint = () => {
    const nextSprint = getNextSprint();
    if (nextSprint) {
      setActiveSprint(nextSprint.id);
    }
  };

  // Navigate to previous sprint
  const navigateToPreviousSprint = () => {
    const previousSprint = getPreviousSprint();
    if (previousSprint) {
      setActiveSprint(previousSprint.id);
    }
  };

  const authenticate = (password: string): boolean => {
    if (password === PASSWORD) {
      setState(prev => ({ ...prev, isAuthenticated: true }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false }));
  };

  const getChildItems = (parentId: string): WorkItem[] => {
    return state.workItems.filter(item => item.parentId === parentId);
  };

  const getPersonById = (id: string): Person | undefined => {
    return state.people.find(p => p.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        addWorkItem,
        updateWorkItem,
        deleteWorkItem,
        addComment,
        addPerson,
        updatePerson,
        deletePerson,
        addSprint,
        setActiveSprint,
        getNextSprint,
        getPreviousSprint,
        navigateToNextSprint,
        navigateToPreviousSprint,
        authenticate,
        logout,
        getChildItems,
        getPersonById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
