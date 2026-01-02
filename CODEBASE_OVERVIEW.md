# Topi Gang Board - Codebase Overview

## 🏗️ Architecture Overview

This is a **React + TypeScript** project management application built with:
- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **React Router** - Routing
- **TanStack Query** - Data fetching (configured but not heavily used)
- **LocalStorage** - Data persistence

## 📁 Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root app component with routing
├── pages/
│   ├── Index.tsx         # Main page (password gate + main board)
│   └── NotFound.tsx      # 404 page
├── context/
│   └── AppContext.tsx    # Global state management (React Context)
├── types/
│   └── index.ts          # TypeScript type definitions
├── components/
│   ├── MainBoard.tsx     # Main container with tabs
│   ├── Dashboard.tsx     # Dashboard view with stats
│   ├── WorkItemList.tsx  # List view for work items
│   ├── WorkItemRow.tsx   # Individual row component
│   ├── WorkItemFilters.tsx # Filter controls
│   ├── TaskCardModal.tsx # Modal for editing tasks
│   ├── AddWorkItemDialog.tsx # Dialog for creating items
│   ├── SprintNavigation.tsx # Sprint navigation controls
│   ├── PeopleManager.tsx # Team member management
│   ├── Header.tsx        # App header
│   ├── PasswordGate.tsx  # Authentication screen
│   └── ui/               # shadcn/ui components (40+ components)
├── hooks/                # Custom React hooks
└── lib/
    └── utils.ts          # Utility functions (cn helper)
```

## 🔑 Key Concepts

### 1. **State Management**
- **Single Source of Truth**: `AppContext.tsx` manages all application state
- **Persistence**: Data saved to `localStorage` automatically on state changes
- **Storage Key**: `'topi-gang-task-board'`
- **Password**: `'lockin2024'` (hardcoded for now)

### 2. **Data Models**

#### WorkItem
```typescript
{
  id: string                    // Auto-generated: `wi-${Date.now()}`
  title: string
  type: 'Epic' | 'User Story' | 'Task' | 'Bug' | 'Operation'
  state: 'New' | 'Active' | 'Done'
  assigneeId?: string           // Reference to Person.id
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  tags: string[]               // Free-form tags
  parentId?: string             // For hierarchical items
  sprintId?: string             // Reference to Sprint.id
  createdAt: number            // Timestamp
  description?: string          // Task description
  comments: Comment[]           // Array of comments
}
```

#### Sprint
```typescript
{
  id: string                    // Auto-generated: `sprint-${Date.now()}`
  name: string                  // e.g., "Sprint 1"
  isActive: boolean
  startDate: number            // Timestamp
  endDate: number              // startDate + 14 days (2 weeks)
}
```

#### Person
```typescript
{
  id: string                    // Auto-generated: `person-${Date.now()}`
  name: string
  handle?: string               // Optional username/handle
}
```

#### Comment
```typescript
{
  id: string                    // Auto-generated: `comment-${Date.now()}`
  text: string
  createdAt: number            // Timestamp
  authorId?: string            // Reference to Person.id
}
```

### 3. **Application Flow**

```
App.tsx
  └── BrowserRouter
      └── Routes
          └── Index (page)
              └── AppProvider (Context)
                  └── AppContent
                      ├── PasswordGate (if not authenticated)
                      └── MainBoard (if authenticated)
                          ├── Header
                          └── Tabs
                              ├── Dashboard
                              ├── Sprint (with SprintNavigation)
                              ├── Task Hub
                              └── People
```

### 4. **Key Features**

#### **Dashboard Tab**
- Shows overview statistics:
  - Team size
  - Active items count
  - Blockers count
  - Done items count
  - Active items by assignee
  - Active items by type
  - List of active blockers

#### **Sprint Tab**
- Shows items assigned to the active sprint
- Sprint navigation controls (Previous/Next)
- Create new sprint button
- Sprint column hidden in list view
- 2-week sprint duration (14 days)

#### **Task Hub Tab** (formerly Backlog)
- Shows items without a sprint assignment
- Full list view with all columns
- Supports creating Epics, Tasks, Stories, Bugs, Operations

#### **People Tab**
- Manage team members
- Add, edit, delete people
- Assign people to work items

### 5. **Work Item Hierarchy**

- **Parent-Child Relationships**: 
  - Epics and User Stories can have child Tasks
  - Operations can have child Tasks
  - Displayed as nested rows in the list view
  - Child items inherit some properties from parents

### 6. **Filtering System**

WorkItemList supports filtering by:
- **Search**: Text search in title (case-insensitive)
- **Type**: Filter by work item type
- **State**: Filter by New/Active/Done
- **Assignee**: Filter by person or unassigned
- **Priority**: Filter by priority level
- **Blocker**: Show only items tagged as "Blocker"

### 7. **Editing Model**

- **List View**: Read-only display (click to open modal)
- **TaskCardModal**: Full editing interface
  - Edit all fields
  - Add/edit description
  - Add/view comments
  - Manage tags (add/remove)
  - Changes save immediately

### 8. **Data Migration**

The app includes migration logic for:
- Adding `description` and `comments` fields to old work items
- Adding `startDate` and `endDate` to old sprints
- Automatically runs on app load if old data format detected

## 🔧 Key Functions in AppContext

### Work Items
- `addWorkItem(item)` - Create new work item
- `updateWorkItem(id, updates)` - Update existing item
- `deleteWorkItem(id)` - Delete item and its children
- `addComment(workItemId, text, authorId?)` - Add comment to item
- `getChildItems(parentId)` - Get all children of a parent

### People
- `addPerson(person)` - Add team member
- `updatePerson(id, updates)` - Update person
- `deletePerson(id)` - Delete person (unassigns from items)
- `getPersonById(id)` - Get person by ID

### Sprints
- `addSprint(name, startDate?)` - Create new 2-week sprint
- `setActiveSprint(id)` - Set active sprint
- `getNextSprint()` - Get next sprint chronologically
- `getPreviousSprint()` - Get previous sprint chronologically
- `navigateToNextSprint()` - Navigate to next sprint
- `navigateToPreviousSprint()` - Navigate to previous sprint

### Authentication
- `authenticate(password)` - Authenticate user
- `logout()` - Log out user

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Custom color scheme** with CSS variables
- **shadcn/ui** components for consistent UI
- **Dark mode support** (via class-based dark mode)
- **Responsive design** with mobile breakpoints

## 📦 Dependencies

### Core
- `react`, `react-dom` - UI framework
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching (configured)

### UI
- `@radix-ui/*` - Headless UI primitives
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `tailwindcss` - Styling

### Utilities
- `clsx`, `tailwind-merge` - Class name utilities
- `zod` - Schema validation (available but not heavily used)

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server (port 8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔐 Security Notes

- Password is hardcoded: `'lockin2024'`
- All data stored in localStorage (client-side only)
- No backend/server required
- No API calls

## 📝 Code Quality

- TypeScript for type safety
- React hooks for state management
- Component-based architecture
- Comments added for complex logic
- Descriptive function and variable names
- Small, focused functions

## 🔄 Recent Changes (Latest Implementation)

1. ✅ Tab reordering: Dashboard → Sprint → Task Hub → People
2. ✅ Backlog renamed to "Task Hub"
3. ✅ Sprint column hidden in Sprint Board view
4. ✅ TaskCardModal for editing (replaces inline editing)
5. ✅ Description and comments support
6. ✅ 2-week sprint logic with dates
7. ✅ Sprint navigation controls
8. ✅ Code refactoring and comments

## 🎯 Potential Improvements

1. **Backend Integration**: Replace localStorage with API calls
2. **Authentication**: Implement proper auth system
3. **Real-time Updates**: WebSocket support for team collaboration
4. **Advanced Filtering**: Save filter presets
5. **Export/Import**: Data export functionality
6. **Search**: Full-text search across descriptions/comments
7. **Notifications**: Alert system for blockers
8. **Analytics**: Sprint velocity tracking
9. **Drag & Drop**: Reorder items in list
10. **Attachments**: File uploads for work items

## 📚 Component Relationships

```
MainBoard
├── Header
└── Tabs
    ├── Dashboard
    │   └── (statistics cards)
    ├── Sprint
    │   ├── SprintNavigation
    │   └── WorkItemList
    │       ├── WorkItemFilters
    │       ├── WorkItemRow (recursive for children)
    │       └── TaskCardModal
    ├── Task Hub
    │   └── WorkItemList
    │       ├── AddWorkItemDialog
    │       ├── WorkItemFilters
    │       ├── WorkItemRow
    │       └── TaskCardModal
    └── People
        └── PeopleManager
```

## 🐛 Known Limitations

1. No data validation beyond TypeScript types
2. No undo/redo functionality
3. No bulk operations
4. No data export/backup
5. Limited to single browser/device (localStorage)
6. No conflict resolution for concurrent edits
7. Password is hardcoded and visible in code

---

**Last Updated**: After latest improvements implementation
**Version**: Based on current codebase state

