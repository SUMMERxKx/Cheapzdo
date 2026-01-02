import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkItem, Person, Sprint, AppState, WorkItemType, WorkItemState, Priority, Comment, Board, BoardNote, Announcement } from '@/types';
import { supabase } from '@/lib/supabase';

interface AppContextType extends AppState {
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'comments'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  reorderWorkItems: (itemIds: string[]) => void;
  deleteWorkItem: (id: string) => void;
  copyWorkItem: (id: string) => void;
  addComment: (workItemId: string, text: string, authorId?: string) => void;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addSprint: (name: string, startDate?: number) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  setActiveSprint: (id: string | null) => void;
  getNextSprint: () => Sprint | null;
  getPreviousSprint: () => Sprint | null;
  navigateToNextSprint: () => void;
  navigateToPreviousSprint: () => void;
  authenticate: (password: string) => boolean;
  logout: () => void;
  getChildItems: (parentId: string) => WorkItem[];
  getPersonById: (id: string) => Person | undefined;
  addBoard: (name: string) => void;
  deleteBoard: (id: string) => void;
  setActiveBoard: (id: string | null) => void;
  addBoardNote: (boardId: string, title: string, content?: string, color?: string) => void;
  updateBoardNote: (id: string, updates: Partial<BoardNote>) => void;
  deleteBoardNote: (id: string) => void;
  addAnnouncement: (title: string, description: string) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Get password from environment variable
// Note: Vite requires VITE_ prefix for client-side env vars
const PASSWORD = import.meta.env.VITE_BOARD_PASSWORD || import.meta.env.BOARD_PASSWORD || '';

// Helper function to calculate 2-week sprint dates
const getSprintDates = (startDate?: number) => {
  const start = startDate || Date.now();
  const end = start + (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds
  return { startDate: start, endDate: end };
};

// Default data for initial setup
const defaultPeople: Person[] = [
  { id: '1', name: 'Alex Chen', handle: 'alex' },
  { id: '2', name: 'Jordan Lee', handle: 'jordan' },
  { id: '3', name: 'Sam Rivera', handle: 'sam' },
  { id: '4', name: 'Casey Kim', handle: 'casey' },
  { id: '5', name: 'Morgan Wu', handle: 'morgan' },
  { id: '6', name: 'Taylor Patel', handle: 'taylor' },
];

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
    title: 'Study for final exams',
    type: 'Study',
    state: 'Active',
    assigneeId: '1',
    priority: 'High',
    tags: ['exam'],
    createdAt: Date.now(),
    description: '',
    comments: [],
    order: 0,
  },
  {
    id: 'wi-2',
    title: 'Complete math homework',
    type: 'Study',
    state: 'New',
    assigneeId: '2',
    priority: 'High',
    tags: ['homework'],
    parentId: 'wi-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-3',
    title: 'Gym session blocked - no equipment',
    type: 'Gym',
    state: 'Active',
    assigneeId: '3',
    priority: 'Critical',
    tags: ['Blocker', 'equipment'],
    parentId: 'wi-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
  },
  {
    id: 'wi-4',
    title: 'Basketball game',
    type: 'Sports',
    state: 'Active',
    assigneeId: '4',
    priority: 'High',
    tags: ['game'],
    sprintId: 'sprint-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
    order: 1,
  },
  {
    id: 'wi-5',
    title: 'Morning run',
    type: 'Running',
    state: 'Active',
    assigneeId: '5',
    priority: 'Medium',
    tags: ['morning'],
    sprintId: 'sprint-1',
    createdAt: Date.now(),
    description: '',
    comments: [],
    order: 2,
  },
  {
    id: 'wi-6',
    title: 'Movie night',
    type: 'Entertainment',
    state: 'New',
    assigneeId: '6',
    priority: 'Low',
    tags: ['weekend'],
    createdAt: Date.now(),
    description: '',
    comments: [],
    order: 3,
  },
];

// Load all data from Supabase
const loadDataFromSupabase = async (): Promise<Partial<AppState>> => {
  try {
    // Check if Supabase is configured
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
      console.warn('Supabase not configured, using defaults');
      return {};
    }

    // Load people
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: true });

    if (peopleError) {
      console.error('Error loading people:', peopleError);
    }

    // Load sprints
    const { data: sprintsData, error: sprintsError } = await supabase
      .from('sprints')
      .select('*')
      .order('start_date', { ascending: true });

    if (sprintsError) {
      console.error('Error loading sprints:', sprintsError);
    }

    // Load work items
    const { data: workItemsData, error: workItemsError } = await supabase
      .from('work_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (workItemsError) {
      console.error('Error loading work items:', workItemsError);
    }

    // Load comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error loading comments:', commentsError);
    }

    // Combine comments with work items
    const workItemsWithComments: WorkItem[] = (workItemsData || []).map(item => {
      const comments = (commentsData || [])
        .filter(comment => comment.work_item_id === item.id)
        .map(comment => ({
          id: comment.id,
          text: comment.text,
          createdAt: comment.created_at,
          authorId: comment.author_id || undefined,
        }));
      
      return {
        id: item.id,
        title: item.title,
        type: item.type as WorkItemType,
        state: item.state as WorkItemState,
        assigneeId: item.assignee_id || undefined,
        priority: item.priority as Priority,
        tags: item.tags || [],
        parentId: item.parent_id || undefined,
        sprintId: item.sprint_id || undefined,
        createdAt: item.created_at,
        description: item.description || '',
        comments: comments,
        order: item.order ?? undefined,
      };
    });

    // Convert people data
    const people: Person[] = (peopleData || []).map(p => ({
      id: p.id,
      name: p.name,
      handle: p.handle || undefined,
    }));

    // Convert sprints data
    const sprints: Sprint[] = (sprintsData || []).map(s => ({
      id: s.id,
      name: s.name,
      isActive: s.is_active,
      startDate: s.start_date,
      endDate: s.end_date,
    }));

    // Find active sprint
    const activeSprint = sprints.find(s => s.isActive)?.id || sprints[0]?.id || null;

    // Load boards
    const { data: boardsData, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: true });

    if (boardsError) {
      console.error('Error loading boards:', boardsError);
    }

    // Load board notes
    const { data: boardNotesData, error: boardNotesError } = await supabase
      .from('board_notes')
      .select('*')
      .order('created_at', { ascending: true });

    if (boardNotesError) {
      console.error('Error loading board notes:', boardNotesError);
    }

    // Load announcements
    const { data: announcementsData, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (announcementsError) {
      console.error('Error loading announcements:', announcementsError);
    }

    // Convert boards data
    const boards = (boardsData || []).map(b => ({
      id: b.id,
      name: b.name,
      createdAt: typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at).getTime(),
    }));

    // Convert board notes data
    const boardNotes = (boardNotesData || []).map(n => ({
      id: n.id,
      boardId: n.board_id,
      title: n.title,
      content: n.content || undefined,
      x: n.x,
      y: n.y,
      color: n.color || undefined,
      createdAt: typeof n.created_at === 'number' ? n.created_at : new Date(n.created_at).getTime(),
    }));

    // Convert announcements data
    const announcements = (announcementsData || []).map(a => ({
      id: a.id,
      title: a.title,
      description: a.description || undefined,
      createdAt: typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at).getTime(),
    }));

    // Find active board
    const activeBoard = boards.length > 0 ? boards[0].id : null;

    return {
      workItems: workItemsWithComments,
      people: people.length > 0 ? people : defaultPeople,
      sprints: sprints.length > 0 ? sprints : defaultSprints,
      activeSprint: activeSprint || 'sprint-1',
      boards,
      boardNotes,
      activeBoard,
      announcements,
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    return {};
  }
};

// Initialize database with default data if empty
const initializeDatabase = async () => {
  try {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
      return;
    }

    // Check if people table is empty
    const { data: peopleData } = await supabase.from('people').select('id').limit(1);
    if (!peopleData || peopleData.length === 0) {
      // Insert default people
      const peopleToInsert = defaultPeople.map(p => ({
        id: p.id,
        name: p.name,
        handle: p.handle || null,
      }));
      await supabase.from('people').insert(peopleToInsert);
    }

    // Check if sprints table is empty
    const { data: sprintsData } = await supabase.from('sprints').select('id').limit(1);
    if (!sprintsData || sprintsData.length === 0) {
      // Insert default sprint
      const sprintToInsert = defaultSprints.map(s => ({
        id: s.id,
        name: s.name,
        is_active: s.isActive,
        start_date: s.startDate,
        end_date: s.endDate,
      }));
      await supabase.from('sprints').insert(sprintToInsert);
    }

    // Check if work_items table is empty
    const { data: workItemsData } = await supabase.from('work_items').select('id').limit(1);
    if (!workItemsData || workItemsData.length === 0) {
      // Insert default work items
      const workItemsToInsert = defaultWorkItems.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        state: item.state,
        assignee_id: item.assigneeId || null,
        priority: item.priority,
        tags: item.tags,
        parent_id: item.parentId || null,
        sprint_id: item.sprintId || null,
        description: item.description || null,
        created_at: item.createdAt,
        order: item.order ?? null,
      }));
      await supabase.from('work_items').insert(workItemsToInsert);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    workItems: [],
    people: [],
    sprints: [],
    activeSprint: null,
    boards: [],
    boardNotes: [],
    activeBoard: null,
    announcements: [],
      isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await initializeDatabase();
      const data = await loadDataFromSupabase();
      setState(prev => ({
        ...prev,
        workItems: data.workItems || defaultWorkItems,
        people: data.people || defaultPeople,
        sprints: data.sprints || defaultSprints,
        activeSprint: data.activeSprint || 'sprint-1',
        boards: data.boards || [],
        boardNotes: data.boardNotes || [],
        activeBoard: data.activeBoard || null,
        announcements: data.announcements || [],
      }));
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save work item to Supabase
  const saveWorkItemToSupabase = async (item: WorkItem) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    
    try {
      const { error } = await supabase
        .from('work_items')
        .upsert({
          id: item.id,
          title: item.title,
          type: item.type,
          state: item.state,
          assignee_id: item.assigneeId || null,
          priority: item.priority,
          tags: item.tags,
          parent_id: item.parentId || null,
          sprint_id: item.sprintId || null,
          description: item.description || null,
          created_at: item.createdAt,
          order: item.order ?? null,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving work item:', error);
    }
  };

  // Save person to Supabase
  const savePersonToSupabase = async (person: Person) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    
    try {
      const { error } = await supabase
        .from('people')
        .upsert({
          id: person.id,
          name: person.name,
          handle: person.handle || null,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving person:', error);
    }
  };

  // Save sprint to Supabase
  const saveSprintToSupabase = async (sprint: Sprint) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    
    try {
      const { error } = await supabase
        .from('sprints')
        .upsert({
          id: sprint.id,
          name: sprint.name,
          is_active: sprint.isActive,
          start_date: sprint.startDate,
          end_date: sprint.endDate,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving sprint:', error);
    }
  };

  // Save comment to Supabase
  const saveCommentToSupabase = async (comment: Comment, workItemId: string) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          id: comment.id,
          work_item_id: workItemId,
          text: comment.text,
          author_id: comment.authorId || null,
          created_at: comment.createdAt,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const addWorkItem = async (item: Omit<WorkItem, 'id' | 'createdAt' | 'comments'>) => {
    const newItem: WorkItem = {
      ...item,
      id: `wi-${Date.now()}`,
      createdAt: Date.now(),
      comments: [],
    };
    
    // Update state immediately (optimistic update)
    setState(prev => ({ ...prev, workItems: [...prev.workItems, newItem] }));
    
    // Save to Supabase in background (won't block if Supabase not configured)
    try {
      await saveWorkItemToSupabase(newItem);
    } catch (error) {
      console.error('Failed to save to Supabase, but item added locally:', error);
      // Item is already in state, so it will still show up
    }
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>) => {
    setState(prev => {
      const updatedItems = prev.workItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      const updatedItem = updatedItems.find(item => item.id === id);
      if (updatedItem) {
        saveWorkItemToSupabase(updatedItem);
      }
      return { ...prev, workItems: updatedItems };
    });
  };

  const reorderWorkItems = async (itemIds: string[]) => {
    setState(prev => {
      // Only reorder top-level items (no parent)
      const topLevelIds = itemIds.filter(id => {
        const item = prev.workItems.find(i => i.id === id);
        return item && !item.parentId;
      });

      const updatedItems = prev.workItems.map(item => {
        const newIndex = topLevelIds.indexOf(item.id);
        if (newIndex !== -1 && !item.parentId) {
          return { ...item, order: newIndex };
        }
        return item;
      });
      
      // Save all reordered items to Supabase
      topLevelIds.forEach((id, index) => {
        const item = updatedItems.find(i => i.id === id);
        if (item) {
          saveWorkItemToSupabase(item);
        }
      });
      
      return { ...prev, workItems: updatedItems };
    });
  };

  const deleteWorkItem = async (id: string) => {
    setState(prev => ({
      ...prev,
      workItems: prev.workItems.filter(item => item.id !== id && item.parentId !== id),
    }));
    
    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        // Delete comments first (cascade should handle this, but being explicit)
        await supabase.from('comments').delete().eq('work_item_id', id);
        // Delete work item (cascade will delete children)
        await supabase.from('work_items').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting work item:', error);
      }
    }
  };

  const copyWorkItem = async (id: string) => {
    const originalItem = state.workItems.find(item => item.id === id);
    if (!originalItem) return;

    const copiedItem: WorkItem = {
      ...originalItem,
      id: `wi-${Date.now()}`,
      title: `${originalItem.title} (Copy)`,
      createdAt: Date.now(),
      comments: [],
      parentId: undefined, // Don't copy parent relationship
    };

    setState(prev => ({ ...prev, workItems: [...prev.workItems, copiedItem] }));
    await saveWorkItemToSupabase(copiedItem);
  };

  const addPerson = async (person: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...person,
      id: `person-${Date.now()}`,
    };
    setState(prev => ({ ...prev, people: [...prev.people, newPerson] }));
    await savePersonToSupabase(newPerson);
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    setState(prev => {
      const updatedPeople = prev.people.map(p => (p.id === id ? { ...p, ...updates } : p));
      const updatedPerson = updatedPeople.find(p => p.id === id);
      if (updatedPerson) {
        savePersonToSupabase(updatedPerson);
      }
      return { ...prev, people: updatedPeople };
    });
  };

  const deletePerson = async (id: string) => {
    setState(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== id),
      workItems: prev.workItems.map(item =>
        item.assigneeId === id ? { ...item, assigneeId: undefined } : item
      ),
    }));
    
    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        // Update work items to remove assignee
        await supabase.from('work_items').update({ assignee_id: null }).eq('assignee_id', id);
        // Delete person
        await supabase.from('people').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting person:', error);
      }
    }
  };

  const addSprint = async (name: string, startDate?: number) => {
    const { startDate: sprintStartDate, endDate } = getSprintDates(startDate);
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name,
      isActive: false,
      startDate: sprintStartDate,
      endDate,
    };
    setState(prev => ({ ...prev, sprints: [...prev.sprints, newSprint] }));
    await saveSprintToSupabase(newSprint);
  };

  const updateSprint = async (id: string, updates: Partial<Sprint>) => {
    setState(prev => {
      const updatedSprints = prev.sprints.map(sprint =>
        sprint.id === id ? { ...sprint, ...updates } : sprint
      );
      const updatedSprint = updatedSprints.find(s => s.id === id);
      if (updatedSprint) {
        saveSprintToSupabase(updatedSprint);
      }
      return { ...prev, sprints: updatedSprints };
    });
  };

  const deleteSprint = async (id: string) => {
    setState(prev => {
      const newSprints = prev.sprints.filter(s => s.id !== id);
      // If deleted sprint was active, set first sprint as active or null
      let newActiveSprint = prev.activeSprint;
      if (prev.activeSprint === id) {
        newActiveSprint = newSprints.length > 0 ? newSprints[0].id : null;
      }
      // Remove sprintId from work items
      const updatedWorkItems = prev.workItems.map(item =>
        item.sprintId === id ? { ...item, sprintId: undefined } : item
      );
      return {
        ...prev,
        sprints: newSprints,
        activeSprint: newActiveSprint,
        workItems: updatedWorkItems,
      };
    });

    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        // Update work items to remove sprint
        await supabase.from('work_items').update({ sprint_id: null }).eq('sprint_id', id);
        // Delete sprint
        await supabase.from('sprints').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting sprint:', error);
      }
    }
  };

  const addComment = async (workItemId: string, text: string, authorId?: string) => {
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
    await saveCommentToSupabase(newComment, workItemId);
  };

  const setActiveSprint = async (id: string | null) => {
    setState(prev => {
      const updatedSprints = prev.sprints.map(s => ({ ...s, isActive: s.id === id }));
      // Save all sprints to update is_active flags
      updatedSprints.forEach(sprint => saveSprintToSupabase(sprint));
      return {
        ...prev,
        activeSprint: id,
        sprints: updatedSprints,
      };
    });
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

  // Save board to Supabase
  const saveBoardToSupabase = async (board: Board) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    try {
      const { error } = await supabase
        .from('boards')
        .upsert({
          id: board.id,
          name: board.name,
          created_at: board.createdAt,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving board:', error);
    }
  };

  // Save board note to Supabase
  const saveBoardNoteToSupabase = async (note: BoardNote) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    try {
      const { error } = await supabase
        .from('board_notes')
        .upsert({
          id: note.id,
          board_id: note.boardId,
          title: note.title,
          content: note.content || null,
          x: note.x,
          y: note.y,
          color: note.color || null,
          created_at: note.createdAt,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving board note:', error);
    }
  };

  // Save announcement to Supabase
  const saveAnnouncementToSupabase = async (announcement: Announcement) => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;
    try {
      const { error } = await supabase
        .from('announcements')
        .upsert({
          id: announcement.id,
          title: announcement.title,
          description: announcement.description || null,
          created_at: announcement.createdAt,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  // Board management functions
  const addBoard = async (name: string) => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    setState(prev => {
      const newBoards = [...prev.boards, newBoard];
      // Set as active if it's the first board or no active board
      const newActiveBoard = prev.boards.length === 0 || !prev.activeBoard ? newBoard.id : prev.activeBoard;
      return {
        ...prev,
        boards: newBoards,
        activeBoard: newActiveBoard,
      };
    });
    await saveBoardToSupabase(newBoard);
  };

  const deleteBoard = async (id: string) => {
    setState(prev => {
      const newBoards = prev.boards.filter(b => b.id !== id);
      const newNotes = prev.boardNotes.filter(n => n.boardId !== id);
      // If deleted board was active, set first board as active or null
      let newActiveBoard = prev.activeBoard;
      if (prev.activeBoard === id) {
        newActiveBoard = newBoards.length > 0 ? newBoards[0].id : null;
      }
      return {
        ...prev,
        boards: newBoards,
        boardNotes: newNotes,
        activeBoard: newActiveBoard,
      };
    });

    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        // Delete board notes first (cascade should handle this, but being explicit)
        await supabase.from('board_notes').delete().eq('board_id', id);
        // Delete board
        await supabase.from('boards').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting board:', error);
      }
    }
  };

  const setActiveBoard = (id: string | null) => {
    setState(prev => ({ ...prev, activeBoard: id }));
  };

  const addBoardNote = async (boardId: string, title: string, content?: string, color?: string) => {
    const newNote: BoardNote = {
      id: `note-${Date.now()}`,
      boardId,
      title,
      content,
      x: Math.random() * 400 + 50, // Random position
      y: Math.random() * 300 + 50,
      color: color || '#fef3c7', // Default yellow sticky note color
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      boardNotes: [...prev.boardNotes, newNote],
    }));
    await saveBoardNoteToSupabase(newNote);
  };

  const updateBoardNote = async (id: string, updates: Partial<BoardNote>) => {
    setState(prev => {
      const updatedNotes = prev.boardNotes.map(note =>
        note.id === id ? { ...note, ...updates } : note
      );
      const updatedNote = updatedNotes.find(n => n.id === id);
      if (updatedNote) {
        saveBoardNoteToSupabase(updatedNote);
      }
      return {
        ...prev,
        boardNotes: updatedNotes,
      };
    });
  };

  const deleteBoardNote = async (id: string) => {
    setState(prev => ({
      ...prev,
      boardNotes: prev.boardNotes.filter(note => note.id !== id),
    }));

    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        await supabase.from('board_notes').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting board note:', error);
      }
    }
  };

  // Announcement management functions
  const addAnnouncement = async (title: string, description: string) => {
    const newAnnouncement: Announcement = {
      id: `announcement-${Date.now()}`,
      title,
      description,
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, newAnnouncement],
    }));
    await saveAnnouncementToSupabase(newAnnouncement);
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    setState(prev => {
      const updatedAnnouncements = prev.announcements.map(announcement =>
        announcement.id === id ? { ...announcement, ...updates } : announcement
      );
      const updatedAnnouncement = updatedAnnouncements.find(a => a.id === id);
      if (updatedAnnouncement) {
        saveAnnouncementToSupabase(updatedAnnouncement);
      }
      return {
        ...prev,
        announcements: updatedAnnouncements,
      };
    });
  };

  const deleteAnnouncement = async (id: string) => {
    setState(prev => ({
      ...prev,
      announcements: prev.announcements.filter(announcement => announcement.id !== id),
    }));

    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        addWorkItem,
        updateWorkItem,
        reorderWorkItems,
        deleteWorkItem,
        copyWorkItem,
        addComment,
        addPerson,
        updatePerson,
        deletePerson,
        addSprint,
        updateSprint,
        deleteSprint,
        setActiveSprint,
        getNextSprint,
        getPreviousSprint,
        navigateToNextSprint,
        navigateToPreviousSprint,
        authenticate,
        logout,
        getChildItems,
        getPersonById,
        addBoard,
        deleteBoard,
        setActiveBoard,
        addBoardNote,
        updateBoardNote,
        deleteBoardNote,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        isLoading,
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
