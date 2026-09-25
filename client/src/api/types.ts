export interface User {
  id: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}
