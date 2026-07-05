import bcrypt from 'bcryptjs';

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string; // ID
  createdAt: Date;
}

export interface MockDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  head?: string; // ID
  createdAt: Date;
}

export interface MockClassroom {
  _id: string;
  name: string;
  batch: string;
  department: string; // ID
  advisor?: string; // ID
  createdAt: Date;
}

export interface MockSubject {
  _id: string;
  name: string;
  code: string;
  department: string; // ID
  credits: number;
  description?: string;
  createdAt: Date;
}

// In-memory data store replicating the database seed data
export const mockDepartments: MockDepartment[] = [
  {
    _id: 'dept-cse-id',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    description: 'Department of Computer Science & Engineering',
    head: 'user-faculty-id',
    createdAt: new Date(),
  },
  {
    _id: 'dept-ee-id',
    name: 'Electrical Engineering',
    code: 'EE',
    description: 'Department of Electrical Engineering',
    createdAt: new Date(),
  }
];

export const mockUsers: MockUser[] = [
  {
    _id: 'user-admin-id',
    name: 'Dr. Jane Smith',
    email: 'admin@careerhub.edu',
    password: 'Admin@123', // Raw password for simple matching in mock mode
    role: 'admin',
    createdAt: new Date(),
  },
  {
    _id: 'user-faculty-id',
    name: 'Prof. Alan Turing',
    email: 'faculty@careerhub.edu',
    password: 'Faculty@123',
    role: 'faculty',
    department: 'dept-cse-id',
    createdAt: new Date(),
  },
  {
    _id: 'user-student-id',
    name: 'John Doe',
    email: 'student@careerhub.edu',
    password: 'Student@123',
    role: 'student',
    department: 'dept-cse-id',
    createdAt: new Date(),
  }
];

export const mockClassrooms: MockClassroom[] = [
  {
    _id: 'class-1-id',
    name: 'CS-Section A',
    batch: '2026',
    department: 'dept-cse-id',
    advisor: 'user-faculty-id',
    createdAt: new Date(),
  }
];

export const mockSubjects: MockSubject[] = [
  {
    _id: 'sub-1-id',
    name: 'Data Structures and Algorithms',
    code: 'CS201',
    department: 'dept-cse-id',
    credits: 4,
    description: 'Fundamental study of algorithms and data structures',
    createdAt: new Date(),
  },
  {
    _id: 'sub-2-id',
    name: 'Object Oriented Programming',
    code: 'CS202',
    department: 'dept-cse-id',
    credits: 3,
    description: 'Introduction to OOP principles with Java/C++',
    createdAt: new Date(),
  }
];

// Utility helpers for mock database mode
export const mockDbService = {
  findUserByEmail: async (email: string): Promise<MockUser | null> => {
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return found ? { ...found } : null;
  },

  findUserById: async (id: string): Promise<any | null> => {
    const found = mockUsers.find(u => u._id === id);
    if (!found) return null;
    
    // Populate department
    const dept = mockDepartments.find(d => d._id === found.department);
    return {
      _id: found._id,
      name: found.name,
      email: found.email,
      role: found.role,
      department: dept ? { _id: dept._id, name: dept.name, code: dept.code } : undefined,
      createdAt: found.createdAt,
    };
  },

  countUsers: async (role: 'student' | 'faculty'): Promise<number> => {
    return mockUsers.filter(u => u.role === role).length;
  },

  countDepartments: async (): Promise<number> => {
    return mockDepartments.length;
  },

  countClassrooms: async (): Promise<number> => {
    return mockClassrooms.length;
  }
};
