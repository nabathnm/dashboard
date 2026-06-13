import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Task, TaskFilters } from "@/types/task";

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  filters: TaskFilters;
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  selectedTask: null,
  filters: {},
  loading: false,
  error: null,
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      // Also update selectedTask if it's the same one
      if (state.selectedTask?.id === action.payload.id) {
        state.selectedTask = action.payload;
      }
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      if (state.selectedTask?.id === action.payload) {
        state.selectedTask = null;
      }
    },
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = action.payload;
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  setFilters,
  setSelectedTask,
  clearSelectedTask,
  setLoading,
  setError,
} = tasksSlice.actions;

export default tasksSlice.reducer;
