import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkItem, Person, Sprint, AppState, WorkItemType, WorkItemState, Priority } from '@/types';

interface AppContextType extends AppState {
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addSprint: (name: string) => void;
  setActiveSprint: (id: string | null) => void;
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

const defaultSprints: Sprint[] = [
  { id: 'sprint-1', name: 'Sprint 1', isActive: true },
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
  },
];

const loadState = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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

  const addWorkItem = (item: Omit<WorkItem, 'id' | 'createdAt'>) => {
    const newItem: WorkItem = {
      ...item,
      id: `wi-${Date.now()}`,
      createdAt: Date.now(),
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

  const addSprint = (name: string) => {
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name,
      isActive: false,
    };
    setState(prev => ({ ...prev, sprints: [...prev.sprints, newSprint] }));
  };

  const setActiveSprint = (id: string | null) => {
    setState(prev => ({
      ...prev,
      activeSprint: id,
      sprints: prev.sprints.map(s => ({ ...s, isActive: s.id === id })),
    }));
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
        addPerson,
        updatePerson,
        deletePerson,
        addSprint,
        setActiveSprint,
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
