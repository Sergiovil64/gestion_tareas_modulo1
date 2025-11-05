export interface Task {
  id?: number;
  title: string;
  description: string;
  dueDate: string;
  status?: string;
  priority?: number;
  color?: string;
  imageUrl?: string;
  userId?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'PREMIUM' | 'FREE';
  isActive: boolean;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      admin: number;
      premium: number;
      free: number;
    };
  };
  tasks: {
    total: number;
    byStatus: {
      pending: number;
      inProgress: number;
      completed: number;
    };
  };
}
