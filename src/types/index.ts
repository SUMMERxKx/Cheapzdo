export type WorkItemType = 'Study' | 'Gym' | 'Sports' | 'Running' | 'Entertainment' | 'Other';
export type WorkItemState = 'New' | 'Active' | 'Done';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Person {
  id: string;
  name: string;
  handle?: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  authorId?: string;
}

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  state: WorkItemState;
  assigneeId?: string;
  priority: Priority;
  tags: string[];
  parentId?: string;
  sprintId?: string;
  createdAt: number;
  description?: string;
  comments: Comment[];
}

export interface Sprint {
  id: string;
  name: string;
  isActive: boolean;
  startDate: number;
  endDate: number;
}

export interface BoardNote {
  id: string;
  boardId: string;
  title: string;
  content?: string;
  x: number;
  y: number;
  color?: string;
  createdAt: number;
}

export interface Board {
  id: string;
  name: string;
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  createdAt: number;
}

export interface AppState {
  workItems: WorkItem[];
  people: Person[];
  sprints: Sprint[];
  activeSprint: string | null;
  boards: Board[];
  boardNotes: BoardNote[];
  activeBoard: string | null;
  announcements: Announcement[];
  isAuthenticated: boolean;
}
