import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import {
  Users,
  GraduationCap,
  Network,
  BookOpen,
  Clock,
  Megaphone,
  Edit2,
  Trash2,
  Lock,
  Search,
  Check,
  Shield,
  Eye,
  X,
  Sparkles
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalDepartments: number;
  totalClassrooms: number;
  activeUsers: number;
  inactiveUsers: number;
}

interface Activity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: string;
}

interface DbAnnouncement {
  _id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  publishDate: string;
  faculty?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface DashboardData {
  success: boolean;
  stats: Stats;
  recentActivity: Activity[];
  announcements: Announcement[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  classroom?: {
    _id: string;
    className: string;
    semester: string;
    section: string;
  };
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

interface Classroom {
  _id: string;
  className: string;
  semester: string;
  section: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  faculty?: {
    _id: string;
    name: string;
    email: string;
  };
  students: {
    _id: string;
    name: string;
    email: string;
    status: string;
    department?: any;
  }[];
  subjects: {
    _id: string;
    name: string;
    code: string;
  }[];
  capacity: number;
  academicYear: string;
  status: 'Active' | 'Inactive';
}

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export const AdminDashboard: React.FC<{ view?: string }> = ({ view = 'dashboard' }) => {
  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Local navigation mappings
  const activeTab = view === 'dashboard' ? 'overview' : view;

  // Search & Filter options
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userDeptFilter, setUserDeptFilter] = useState('all');
  const [userClassFilter, setUserClassFilter] = useState('all');

  // Selected User state for View, Edit, Password Reset details modals
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetPasswordText, setResetPasswordText] = useState('');

  // Selected Classroom state for Edit details modals
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

  // Forms opening toggles
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateClassroomOpen, setIsCreateClassroomOpen] = useState(false);
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'medium',
  });

  // Inline roles updates buffer maps (maps userId to select value)
  const [rolesBuffer, setRolesBuffer] = useState<Record<string, string>>({});

  // Forms Input Buffers
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    phone: '',
  });

  const [newClassroom, setNewClassroom] = useState({
    className: '',
    department: '',
    semester: '',
    section: '',
    faculty: '',
    capacity: 60,
    academicYear: '2026',
    status: 'Active',
    selectedStudents: [] as string[],
    selectedSubjects: [] as string[]
  });

  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    description: '',
  });

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    credits: 3,
    department: '',
  });

  // TanStack Queries (Fetching from MongoDB Atlas)
  const { data: dashData, refetch: refetchDash } = useQuery<DashboardData>({
    queryKey: ['adminStats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const { data: usersData, refetch: refetchUsers } = useQuery<{ success: boolean; users: User[] }>({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/admin/users')).data,
  });

  const { data: deptsData, refetch: refetchDepts } = useQuery<{ success: boolean; departments: Department[] }>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/departments')).data,
  });

  const { data: classroomsData, refetch: refetchClassrooms } = useQuery<{ success: boolean; classrooms: Classroom[] }>({
    queryKey: ['classrooms'],
    queryFn: async () => (await api.get('/classrooms')).data,
  });

  const { data: subjectsData, refetch: refetchSubjects } = useQuery<{ success: boolean; subjects: Subject[] }>({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get('/subjects')).data,
  });

  const { data: dbAnnouncementsData, refetch: refetchAnnouncements } = useQuery<{ success: boolean; announcements: DbAnnouncement[] }>({
    queryKey: ['adminAnnouncements'],
    queryFn: async () => (await api.get('/announcements')).data,
  });

  // ==========================================
  // ANNOUNCEMENT ACTIONS
  // ==========================================

  const handleCreateAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', newAnnouncement);
      showToast('Announcement posted successfully');
      setNewAnnouncement({ title: '', message: '', priority: 'medium' });
      setIsCreateAnnouncementOpen(false);
      refetchAnnouncements();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to post announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (annId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete announcement "${title}"?`)) return;
    try {
      await api.delete(`/announcements/${annId}`);
      showToast('Announcement deleted successfully');
      refetchAnnouncements();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete announcement', 'error');
    }
  };

  // ==========================================
  // USER DIRECTORY ACTIONS
  // ==========================================

  const handleToggleUserStatus = async (user: User) => {
    try {
      const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      await api.patch(`/admin/users/${user._id}/status`, { status: nextStatus });
      showToast(`User status set to ${nextStatus}.`);
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleInlineRoleSave = async (userId: string) => {
    const selectedRole = rolesBuffer[userId];
    if (!selectedRole) return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: selectedRole });
      showToast('Role updated successfully');
      // Clear roles buffer for this user
      setRolesBuffer(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This will remove them from all classrooms.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast('User deleted successfully');
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      showToast('User account onboarded successfully');
      setIsCreateUserOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'student', department: '', phone: '' });
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser._id}`, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        department: editingUser.department?._id || null,
        classroom: editingUser.classroom?._id || null,
        status: editingUser.status,
      });
      showToast('User profile updated successfully');
      setEditingUser(null);
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    try {
      await api.put(`/admin/users/${resettingUser._id}`, { password: resetPasswordText });
      showToast('Password reset successfully');
      setResettingUser(null);
      setResetPasswordText('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  // ==========================================
  // CLASSROOM MANAGEMENT ACTIONS
  // ==========================================

  const handleCreateClassroomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classrooms', {
        className: newClassroom.className,
        department: newClassroom.department,
        semester: newClassroom.semester,
        section: newClassroom.section,
        faculty: newClassroom.faculty || undefined,
        students: newClassroom.selectedStudents,
        subjects: newClassroom.selectedSubjects,
        capacity: newClassroom.capacity,
        academicYear: newClassroom.academicYear,
        status: newClassroom.status,
      });
      showToast('Classroom section created');
      setIsCreateClassroomOpen(false);
      setNewClassroom({
        className: '', department: '', semester: '', section: '', faculty: '', capacity: 60, academicYear: '2026', status: 'Active', selectedStudents: [], selectedSubjects: []
      });
      refetchClassrooms();
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create classroom', 'error');
    }
  };

  const handleEditClassroomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom) return;
    try {
      await api.put(`/classrooms/${editingClassroom._id}`, {
        className: editingClassroom.className,
        semester: editingClassroom.semester,
        section: editingClassroom.section,
        faculty: editingClassroom.faculty?._id || null,
        capacity: editingClassroom.capacity,
        academicYear: editingClassroom.academicYear,
        status: editingClassroom.status,
        students: editingClassroom.students.map(s => s._id),
        subjects: editingClassroom.subjects.map(sub => sub._id),
      });
      showToast('Classroom section updated successfully');
      setEditingClassroom(null);
      refetchClassrooms();
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update classroom', 'error');
    }
  };

  const handleDeleteClassroom = async (classId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete classroom "${name}"? Enrolled students will be unassigned.`)) return;
    try {
      await api.delete(`/classrooms/${classId}`);
      showToast('Classroom deleted');
      refetchClassrooms();
      refetchUsers();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete classroom', 'error');
    }
  };

  // ==========================================
  // DEPARTMENTS AND SUBJECTS ACTIONS
  // ==========================================

  const handleCreateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/departments', newDept);
      showToast('Department created');
      setIsCreateDeptOpen(false);
      setNewDept({ name: '', code: '', description: '' });
      refetchDepts();
      refetchDash();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create department', 'error');
    }
  };

  const handleCreateSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subjects', newSubject);
      showToast('Subject created');
      setIsCreateSubjectOpen(false);
      setNewSubject({ name: '', code: '', credits: 3, department: '' });
      refetchSubjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create subject', 'error');
    }
  };

  // ==========================================
  // FILTER DIRECTORY CALCULATIONS
  // ==========================================

  const filteredUsers = usersData?.users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesDept = userDeptFilter === 'all' || u.department?._id === userDeptFilter;
    const matchesClass = userClassFilter === 'all' || u.classroom?._id === userClassFilter;
    return matchesSearch && matchesRole && matchesDept && matchesClass;
  }) || [];

  return (
    <div className="space-y-8 relative">
      {/* Toast Notifications Overlay Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-dropdown border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto transform animate-slideIn ${t.type === 'success'
              ? 'bg-success-light border-success/20 text-success-text'
              : 'bg-danger-light border-danger/20 text-danger-text'
              }`}
          >
            <span>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-text-secondary hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ERP Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">University ERP Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">
            Complete institutional administration panel for roles, classrooms, departments, and course syllabus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setIsCreateDeptOpen(true)}>
            Add Dept
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreateSubjectOpen(true)}>
            Add Subject
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreateUserOpen(true)}>
            Onboard User
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCreateAnnouncementOpen(true)}>
            Add Ann
          </Button>
          <Button size="sm" onClick={() => setIsCreateClassroomOpen(true)}>
            New Classroom
          </Button>
        </div>
      </div>

      {/* ==========================================
          1. DASHBOARD OVERVIEW VIEW
          ========================================== */}
      {activeTab === 'overview' && dashData && (
        <div className="space-y-8">
          {/* Stats Cards Displaying 8 counters from Atlas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Users', value: dashData.stats.totalUsers, icon: Users, color: 'text-primary bg-primary-light border-primary/10' },
              { title: 'Student Scholars', value: dashData.stats.totalStudents, icon: GraduationCap, color: 'text-success bg-success-light border-success/10' },
              { title: 'Faculty Professors', value: dashData.stats.totalFaculty, icon: Users, color: 'text-warning bg-warning-light border-warning/10' },
              { title: 'Administrators', value: dashData.stats.totalAdmins, icon: Shield, color: 'text-danger bg-danger-light border-danger/10' },
              { title: 'Departments', value: dashData.stats.totalDepartments, icon: Network, color: 'text-indigo bg-indigo-50 border-indigo-100' },
              { title: 'Classroom Sections', value: dashData.stats.totalClassrooms, icon: BookOpen, color: 'text-purple bg-purple-50 border-purple-100' },
              { title: 'Active Accounts', value: dashData.stats.activeUsers, icon: Check, color: 'text-emerald bg-emerald-50 border-emerald-100' },
              { title: 'Inactive Accounts', value: dashData.stats.inactiveUsers, icon: X, color: 'text-rose bg-rose-50 border-rose-100' },
            ].map((c) => (
              <Card key={c.title} className="bg-white dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider">{c.title}</p>
                    <h3 className="text-xl font-bold mt-1 text-text-primary dark:text-gray-100">{c.value}</h3>
                  </div>
                  <div className={`p-2 border rounded-md ${c.color}`}>
                    <c.icon className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Audit Activity Logs Panel */}
            <Card className="lg:col-span-2 bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-text-secondary dark:text-slate-400" />
                  <CardTitle>System Activity Logs</CardTitle>
                </div>
                <CardDescription>Live database audit tracking administrative actions.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border dark:divide-dark-border">
                {dashData.recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-secondary dark:text-slate-400 italic">No logged activity events yet.</div>
                ) : (
                  dashData.recentActivity.map((act) => (
                    <div key={act.id} className="py-3 flex items-start gap-4 first:pt-0 last:pb-0">
                      <div className="p-1.5 bg-slate-50 dark:bg-dark-surface/50 border border-border dark:border-dark-border rounded text-text-secondary dark:text-slate-400 mt-0.5 shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-xs font-bold text-text-primary dark:text-gray-200">{act.action}</h4>
                          <span className="text-[10px] text-text-secondary dark:text-slate-400">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-0.5">{act.details}</p>
                        <div className="flex items-center gap-3 mt-1 text-[9px] text-text-secondary dark:text-slate-500 font-semibold">
                          <span>Operator: {act.user}</span>
                          <span>•</span>
                          <span>Timestamp: {new Date(act.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Board Notices Panel */}
            <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4.5 w-4.5 text-text-secondary dark:text-slate-400" />
                  <CardTitle>Global Board Notices</CardTitle>
                </div>
                <CardDescription>Official ERP notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashData.announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-slate-50 dark:bg-dark-surface/40 border border-border dark:border-dark-border rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-text-primary dark:text-gray-200 truncate">{ann.title}</h4>
                      <Badge variant={ann.priority === 'high' ? 'danger' : 'secondary'} className="text-[8px] py-0 px-1 select-none">
                        {ann.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold block pt-1">Date: {ann.date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          2. USER DIRECTORY VIEW
          ========================================== */}
      {activeTab === 'users' && usersData && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>View, audit, edit profiles, reset credentials, or deactivate account states.</CardDescription>
            </div>
            {/* Search and Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2">
              <div className="relative col-span-1 sm:col-span-2 md:w-48">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-150 rounded-md focus:outline-none focus:bg-white dark:focus:bg-dark-card focus:border-primary"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-250 rounded-md px-2 py-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={userDeptFilter}
                onChange={(e) => setUserDeptFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-250 rounded-md px-2 py-2 focus:outline-none cursor-pointer max-w-[140px]"
              >
                <option value="all">All Departments</option>
                {deptsData?.departments.map(d => (
                  <option key={d._id} value={d._id}>{d.code}</option>
                ))}
              </select>

              <select
                value={userClassFilter}
                onChange={(e) => setUserClassFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-250 rounded-md px-2 py-2 focus:outline-none cursor-pointer max-w-[140px]"
              >
                <option value="all">All Classrooms</option>
                {classroomsData?.classrooms.map(c => (
                  <option key={c._id} value={c._id}>{c.className}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3.5 px-4">Profile</th>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Classroom</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover/30">
                      <td className="py-3 px-4">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-dark-surface border border-border dark:border-dark-border flex items-center justify-center font-bold text-text-primary dark:text-gray-200 text-xs shrink-0 select-none">
                          {u.name.charAt(0)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-primary dark:text-gray-200">{u.name}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{u.email}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{u.department?.code || 'Admin Office'}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">
                        {u.classroom ? `${u.classroom.className}` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'faculty' ? 'warning' : 'primary'} className="uppercase text-[8px] py-0 select-none">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          onClick={() => handleToggleUserStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold cursor-pointer select-none border transition-colors ${u.status === 'Active'
                            ? 'bg-success-light border-success/15 text-success-text'
                            : 'bg-danger-light border-danger/15 text-danger-text'
                            }`}
                        >
                          {u.status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover border border-border dark:border-dark-border rounded text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover border border-border dark:border-dark-border rounded text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setResettingUser(u)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-hover border border-border dark:border-dark-border rounded text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500"
                          title="Reset Password"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-1.5 hover:bg-danger-light dark:hover:bg-red-950/20 border border-border dark:border-dark-border hover:border-danger/15 rounded text-text-secondary dark:text-slate-400 hover:text-danger-text"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-secondary italic">
                        No user documents found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          3. ROLE MANAGEMENT VIEW
          ========================================== */}
      {activeTab === 'roles' && usersData && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Role Permissions Directory</CardTitle>
              <CardDescription>Direct role configuration list. Changes immediately update permissions without pages refreshes.</CardDescription>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-150 rounded-md focus:outline-none focus:bg-white dark:focus:bg-dark-card focus:border-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Current Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {usersData.users
                    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((u) => {
                      const bufferValue = rolesBuffer[u._id] || u.role;
                      const hasChanged = bufferValue !== u.role;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover/30">
                          <td className="py-3.5 px-4 font-semibold text-text-primary dark:text-gray-200">{u.name}</td>
                          <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400">{u.email}</td>
                          <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400">{u.department?.code || 'Admin Office'}</td>
                          <td className="py-3.5 px-4">
                            <select
                              value={bufferValue}
                              onChange={(e) => setRolesBuffer(prev => ({ ...prev, [u._id]: e.target.value }))}
                              className="text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border rounded px-2.5 py-1.5 focus:outline-none cursor-pointer font-medium text-text-primary dark:text-gray-200 focus:bg-white dark:focus:bg-dark-card focus:border-primary"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={u.status === 'Active' ? 'success' : 'secondary'} className="text-[8px] py-0 px-2 select-none font-bold">
                              {u.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {hasChanged ? (
                              <Button
                                size="sm"
                                onClick={() => handleInlineRoleSave(u._id)}
                                className="h-7 text-[10px] px-3 flex items-center gap-1.5"
                              >
                                <Check className="h-3 w-3" /> Save Role
                              </Button>
                            ) : (
                              <span className="text-[10px] text-text-secondary dark:text-slate-450 italic font-medium pr-3 select-none">No changes</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          4. CLASSROOM MANAGEMENT VIEW
          ========================================== */}
      {activeTab === 'classrooms' && classroomsData && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Classroom sections</CardTitle>
              <CardDescription>Define schedules, capacity limits, faculty advisors, and subject curriculum.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateClassroomOpen(true)}>
              New Classroom Section
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classroomsData.classrooms.map((cls) => (
                <div key={cls._id} className="p-5 border border-border dark:border-dark-border rounded-lg bg-slate-50/10 dark:bg-dark-surface/40 flex flex-col justify-between hover:shadow-subtle transition-all duration-150">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-text-primary dark:text-gray-200">{cls.className}</h4>
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 font-medium block mt-0.5">
                          {cls.department?.name} • Year {cls.academicYear} • Sec {cls.section}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingClassroom(cls)}
                          className="p-1 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-dark-hover rounded border border-border dark:border-dark-border"
                          title="Edit assignments"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClassroom(cls._id, cls.className)}
                          className="p-1 text-text-secondary dark:text-slate-400 hover:text-danger-text hover:bg-danger-light dark:hover:bg-red-950/20 rounded border border-border dark:border-dark-border"
                          title="Delete classroom"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-border/40 dark:border-dark-border/40">
                        <span className="font-semibold text-text-secondary dark:text-slate-400">Assigned Faculty Advisor</span>
                        <span className="font-medium text-text-primary dark:text-gray-150 bg-white dark:bg-dark-surface border border-border dark:border-dark-border px-2 py-0.5 rounded text-[10px]">
                          {cls.faculty?.name || 'Unassigned'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-border/40 dark:border-dark-border/40">
                        <span className="font-semibold text-text-secondary dark:text-slate-400">Students / Capacity</span>
                        <span className="font-bold text-primary bg-primary-light dark:bg-primary/20 px-2 py-0.5 border border-primary/5 dark:border-primary/30 rounded text-[10px]">
                          {cls.students.length} / {cls.capacity} Enrolled
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-border/40 dark:border-dark-border/40">
                        <span className="font-semibold text-text-secondary dark:text-slate-400">Class Status</span>
                        <Badge variant={cls.status === 'Active' ? 'success' : 'secondary'} className="text-[8px] py-0 px-2 select-none">
                          {cls.status}
                        </Badge>
                      </div>

                      <div>
                        <span className="font-semibold text-text-secondary dark:text-slate-400 block mb-1">Registered Syllabus Subjects</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cls.subjects.map((sub) => (
                            <Badge key={sub._id} variant="secondary" className="text-[9px] px-2 py-0 select-none">
                              {sub.code}
                            </Badge>
                          ))}
                          {cls.subjects.length === 0 && (
                            <span className="text-[10px] text-text-secondary dark:text-slate-450 italic">No course subjects mapped.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {classroomsData.classrooms.length === 0 && (
                <div className="col-span-2 py-12 text-center text-text-secondary dark:text-slate-450 border border-dashed border-border dark:border-dark-border rounded-lg italic">
                  No classroom sections registered in the database.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          5. DEPARTMENTS DIRECTORY VIEW
          ========================================== */}
      {activeTab === 'departments' && deptsData && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Departments Directory</CardTitle>
              <CardDescription>Overview of university departments and academic code registers.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateDeptOpen(true)}>
              Add Department
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {deptsData.departments.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover/30 border-b border-border/40 dark:border-dark-border/40">
                      <td className="py-3.5 px-4">
                        <Badge variant="primary" className="text-[10px] font-bold select-none">{d.code}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-text-primary dark:text-gray-200">{d.name}</td>
                      <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400 truncate max-w-xs">{d.description || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold italic select-none pr-3">System Protected</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          6. SUBJECTS DIRECTORY VIEW
          ========================================== */}
      {activeTab === 'subjects' && subjectsData && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Course Subjects</CardTitle>
              <CardDescription>Curriculum syllabus subjects ledger and credit scoring parameters.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateSubjectOpen(true)}>
              Add Subject
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {subjectsData.subjects.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover/30 border-b border-border/40 dark:border-dark-border/40">
                      <td className="py-3.5 px-4 font-bold text-text-primary dark:text-gray-200">{sub.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-text-primary dark:text-gray-200">{sub.name}</td>
                      <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400 font-bold">{sub.credits} Credits</td>
                      <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400">{sub.department?.name || 'Elective / Core'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 font-semibold italic select-none pr-3">System Protected</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          7. ANNOUNCEMENTS LEDGER VIEW (Admin Panel)
          ========================================== */}
      {activeTab === 'announcements' && dbAnnouncementsData && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Institutional Announcements</CardTitle>
              <CardDescription>Publish updates, system logs, or alerts to the faculty board network.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateAnnouncementOpen(true)}>
              Publish Announcement
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Date Posted</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {dbAnnouncementsData.announcements.map((ann) => (
                    <tr key={ann._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover/30 border-b border-border/40 dark:border-dark-border/40">
                      <td className="py-3.5 px-4 font-bold text-text-primary dark:text-gray-200">{ann.title}</td>
                      <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400 truncate max-w-xs">{ann.message}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={ann.priority === 'high' ? 'danger' : ann.priority === 'medium' ? 'warning' : 'secondary'} className="text-[10px] font-bold select-none uppercase">
                          {ann.priority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400">{new Date(ann.publishDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 text-text-secondary dark:text-slate-400">{ann.faculty?.name || 'Admin'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAnnouncement(ann._id, ann.title)}
                          className="p-1.5 hover:bg-danger-light dark:hover:bg-red-950/20 border border-border dark:border-dark-border hover:border-danger/15 rounded text-text-secondary dark:text-slate-400 hover:text-danger-text"
                          title="Delete Announcement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {dbAnnouncementsData.announcements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-secondary dark:text-slate-400 italic">
                        No announcements posted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          MODALS LAYOUT VIEWPORTS
          ========================================== */}

      {/* A. VIEW USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setViewingUser(null)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>User Account Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex gap-4 items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-light dark:bg-dark-surface border border-primary/10 dark:border-dark-border flex items-center justify-center font-bold text-primary dark:text-gray-250 text-base">
                  {viewingUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary dark:text-gray-200">{viewingUser.name}</h4>
                  <Badge variant="primary" className="uppercase text-[9px] mt-1 select-none font-bold">{viewingUser.role}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-border/40 dark:border-dark-border/40">
                <span className="font-semibold text-text-secondary dark:text-slate-400">Email</span>
                <span className="col-span-2 font-medium text-text-primary dark:text-gray-200 break-all">{viewingUser.email}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-border/40 dark:border-dark-border/40">
                <span className="font-semibold text-text-secondary dark:text-slate-400">Phone</span>
                <span className="col-span-2 font-medium text-text-primary dark:text-gray-200">{viewingUser.phone || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-border/40 dark:border-dark-border/40">
                <span className="font-semibold text-text-secondary dark:text-slate-400">Department</span>
                <span className="col-span-2 font-medium text-text-primary dark:text-gray-200">{viewingUser.department?.name || 'Platform Admin Office'}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-border/40 dark:border-dark-border/40">
                <span className="font-semibold text-text-secondary dark:text-slate-400">Classroom</span>
                <span className="col-span-2 font-medium text-text-primary dark:text-gray-200">
                  {viewingUser.classroom ? viewingUser.classroom.className : 'Unassigned'}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-border/40 dark:border-dark-border/40">
                <span className="font-semibold text-text-secondary dark:text-slate-400">Status</span>
                <span className="col-span-2 font-bold text-text-primary dark:text-gray-200">{viewingUser.status}</span>
              </div>
              <div className="flex justify-end pt-4">
                <Button size="sm" onClick={() => setViewingUser(null)}>Close View</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* B. EDIT USER PROFILE DETAILS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setEditingUser(null)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Edit User Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <Input
                  id="edit-user-name"
                  type="text"
                  label="Profile Name"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
                <Input
                  id="edit-user-email"
                  type="email"
                  label="Institutional Email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
                <Input
                  id="edit-user-phone"
                  type="text"
                  label="Phone Number"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />

                <Select
                  label="Department"
                  options={[
                    { value: '', label: 'Admin / None' },
                    ...(deptsData?.departments.map(d => ({ value: d._id, label: d.name })) || [])
                  ]}
                  value={editingUser.department?._id || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    department: e.target.value ? { _id: e.target.value, name: '', code: '' } : undefined
                  })}
                />

                <Select
                  label="Classroom Assignment"
                  options={[
                    { value: '', label: 'Unassigned / None' },
                    ...(classroomsData?.classrooms.map(c => ({ value: c._id, label: `${c.className} (${c.semester})` })) || [])
                  ]}
                  value={editingUser.classroom?._id || ''}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    classroom: e.target.value ? { _id: e.target.value, className: '', semester: '', section: '' } : undefined
                  })}
                />

                <Select
                  label="Account Status"
                  options={[
                    { value: 'Active', label: 'Active Account' },
                    { value: 'Inactive', label: 'Deactivated' }
                  ]}
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                />

                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* C. PASSWORD RESET MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setResettingUser(null)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Change password for user "{resettingUser.name}".</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <Input
                  id="reset-user-pass"
                  type="password"
                  label="New Security Password"
                  placeholder="Min. 6 characters"
                  required
                  value={resetPasswordText}
                  onChange={(e) => setResetPasswordText(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setResettingUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Confirm Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* D. EDIT CLASSROOM MODAL */}
      {editingClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setEditingClassroom(null)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Edit Classroom Section</CardTitle>
              <CardDescription>Assign advisor faculty, semesters, courses and pupil lists.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleEditClassroomSubmit} className="space-y-4">
                <Input
                  id="edit-class-name"
                  type="text"
                  label="Classroom Name"
                  required
                  value={editingClassroom.className}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, className: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="edit-class-sem"
                    type="text"
                    label="Semester"
                    required
                    value={editingClassroom.semester}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, semester: e.target.value })}
                  />
                  <Input
                    id="edit-class-sec"
                    type="text"
                    label="Section"
                    required
                    value={editingClassroom.section}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, section: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="edit-class-cap"
                    type="number"
                    label="Capacity Limit"
                    required
                    value={editingClassroom.capacity}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, capacity: parseInt(e.target.value) })}
                  />
                  <Input
                    id="edit-class-year"
                    type="text"
                    label="Academic Year"
                    required
                    value={editingClassroom.academicYear}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, academicYear: e.target.value })}
                  />
                </div>

                <Select
                  label="Assigned Faculty Advisor"
                  options={[
                    { value: '', label: 'Select Faculty Advisor' },
                    ...(usersData?.users.filter(u => u.role === 'faculty').map(f => ({ value: f._id, label: f.name })) || [])
                  ]}
                  value={editingClassroom.faculty?._id || ''}
                  onChange={(e) => setEditingClassroom({
                    ...editingClassroom,
                    faculty: e.target.value ? { _id: e.target.value, name: '', email: '' } : undefined
                  })}
                />

                <Select
                  label="Class Status"
                  options={[
                    { value: 'Active', label: 'Active Section' },
                    { value: 'Inactive', label: 'Inactive Section' }
                  ]}
                  value={editingClassroom.status}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, status: e.target.value as any })}
                />

                {/* Subjects assignments */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Assign Subjects</label>
                  <div className="border border-border dark:border-dark-border rounded p-3 h-28 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-dark-surface/40">
                    {subjectsData?.subjects.map(sub => (
                      <label key={sub._id} className="flex items-center gap-2 text-xs text-text-primary dark:text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingClassroom.subjects.some(s => s._id === sub._id)}
                          onChange={(e) => {
                            const list = e.target.checked
                              ? [...editingClassroom.subjects, sub]
                              : editingClassroom.subjects.filter(s => s._id !== sub._id);
                            setEditingClassroom({ ...editingClassroom, subjects: list });
                          }}
                          className="rounded border-border dark:border-dark-border text-primary focus:ring-primary/40 focus:ring-offset-0 focus:outline-none cursor-pointer"
                        />
                        {sub.code}: {sub.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Enrolled Students assignments */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Enroll Students</label>
                  <div className="border border-border dark:border-dark-border rounded p-3 h-32 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-dark-surface/40">
                    {usersData?.users.filter(u => u.role === 'student').map(stud => (
                      <label key={stud._id} className="flex items-center gap-2 text-xs text-text-primary dark:text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingClassroom.students.some(s => s._id === stud._id)}
                          onChange={(e) => {
                            const list = e.target.checked
                              ? [...editingClassroom.students, stud]
                              : editingClassroom.students.filter(s => s._id !== stud._id);
                            setEditingClassroom({ ...editingClassroom, students: list });
                          }}
                          className="rounded border-border dark:border-dark-border text-primary focus:ring-primary/40 focus:ring-offset-0 focus:outline-none cursor-pointer"
                        />
                        {stud.name} ({stud.email})
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingClassroom(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* E. CREATE USER MODAL */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreateUserOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Onboard New User</CardTitle>
              <CardDescription>Register a student, faculty member, or admin account.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                <Input
                  id="reg-user-name"
                  type="text"
                  label="Full Name"
                  placeholder="e.g. Alan Turing"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
                <Input
                  id="reg-user-email"
                  type="email"
                  label="Institutional Email"
                  placeholder="name@careerhub.edu"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <Input
                  id="reg-user-pass"
                  type="password"
                  label="Password"
                  placeholder="Min. 6 characters"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
                <Select
                  label="System Role"
                  options={[
                    { value: 'student', label: 'Student Scholar' },
                    { value: 'faculty', label: 'Faculty Professor' },
                    { value: 'admin', label: 'Platform Admin' }
                  ]}
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                />
                <Select
                  label="Department"
                  options={[
                    { value: '', label: 'Select Department' },
                    ...(deptsData?.departments.map(d => ({ value: d._id, label: d.name })) || [])
                  ]}
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                />
                <Input
                  id="reg-user-phone"
                  type="text"
                  label="Phone Number"
                  placeholder="e.g. +91 98765 43210"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Onboard User
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* F. CREATE CLASSROOM MODAL */}
      {isCreateClassroomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsCreateClassroomOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Create Classroom Section</CardTitle>
              <CardDescription>Define year sections, semesters, advisory staff, and enrolled students.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateClassroomSubmit} className="space-y-4">
                <Input
                  id="create-class-ref"
                  type="text"
                  label="Classroom Name"
                  placeholder="e.g. CSE - III Year - Section B"
                  required
                  value={newClassroom.className}
                  onChange={(e) => setNewClassroom({ ...newClassroom, className: e.target.value })}
                />
                <Select
                  label="Department"
                  options={[
                    { value: '', label: 'Select Department' },
                    ...(deptsData?.departments.map(d => ({ value: d._id, label: d.name })) || [])
                  ]}
                  value={newClassroom.department}
                  onChange={(e) => setNewClassroom({ ...newClassroom, department: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="create-class-sem"
                    type="text"
                    label="Semester"
                    placeholder="e.g. III Semester"
                    required
                    value={newClassroom.semester}
                    onChange={(e) => setNewClassroom({ ...newClassroom, semester: e.target.value })}
                  />
                  <Input
                    id="create-class-sec"
                    type="text"
                    label="Section"
                    placeholder="e.g. B"
                    required
                    value={newClassroom.section}
                    onChange={(e) => setNewClassroom({ ...newClassroom, section: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="create-class-cap"
                    type="number"
                    label="Capacity Limit"
                    required
                    value={newClassroom.capacity}
                    onChange={(e) => setNewClassroom({ ...newClassroom, capacity: parseInt(e.target.value) })}
                  />
                  <Input
                    id="create-class-year"
                    type="text"
                    label="Academic Year"
                    placeholder="e.g. 2026"
                    required
                    value={newClassroom.academicYear}
                    onChange={(e) => setNewClassroom({ ...newClassroom, academicYear: e.target.value })}
                  />
                </div>

                <Select
                  label="Assigned Faculty Advisor"
                  options={[
                    { value: '', label: 'Select Faculty Advisor' },
                    ...(usersData?.users.filter(u => u.role === 'faculty').map(f => ({ value: f._id, label: f.name })) || [])
                  ]}
                  value={newClassroom.faculty}
                  onChange={(e) => setNewClassroom({ ...newClassroom, faculty: e.target.value })}
                />

                <Select
                  label="Class Status"
                  options={[
                    { value: 'Active', label: 'Active Section' },
                    { value: 'Inactive', label: 'Inactive Section' }
                  ]}
                  value={newClassroom.status}
                  onChange={(e) => setNewClassroom({ ...newClassroom, status: e.target.value as any })}
                />

                {/* Checklist of subjects */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Assign Subjects</label>
                  <div className="border border-border dark:border-dark-border rounded p-3 h-28 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-dark-surface/40">
                    {subjectsData?.subjects.map(sub => (
                      <label key={sub._id} className="flex items-center gap-2 text-xs text-text-primary dark:text-gray-250 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newClassroom.selectedSubjects.includes(sub._id)}
                          onChange={(e) => {
                            const list = e.target.checked
                              ? [...newClassroom.selectedSubjects, sub._id]
                              : newClassroom.selectedSubjects.filter(id => id !== sub._id);
                            setNewClassroom({ ...newClassroom, selectedSubjects: list });
                          }}
                          className="rounded border-border dark:border-dark-border text-primary focus:ring-primary/40 focus:ring-offset-0 focus:outline-none cursor-pointer"
                        />
                        {sub.code}: {sub.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checklist of students */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Enroll Students</label>
                  <div className="border border-border dark:border-dark-border rounded p-3 h-32 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-dark-surface/40">
                    {usersData?.users.filter(u => u.role === 'student').map(stud => (
                      <label key={stud._id} className="flex items-center gap-2 text-xs text-text-primary dark:text-gray-250 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newClassroom.selectedStudents.includes(stud._id)}
                          onChange={(e) => {
                            const list = e.target.checked
                              ? [...newClassroom.selectedStudents, stud._id]
                              : newClassroom.selectedStudents.filter(id => id !== stud._id);
                            setNewClassroom({ ...newClassroom, selectedStudents: list });
                          }}
                          className="rounded border-border dark:border-dark-border text-primary focus:ring-primary/40 focus:ring-offset-0 focus:outline-none cursor-pointer"
                        />
                        {stud.name} ({stud.email})
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateClassroomOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create Section
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* G. CREATE DEPARTMENT MODAL */}
      {isCreateDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreateDeptOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Create Department</CardTitle>
              <CardDescription>Add a new university department registry.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateDeptSubmit} className="space-y-4">
                <Input
                  id="dept-name"
                  type="text"
                  label="Department Name"
                  placeholder="e.g. Computer Science"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                />
                <Input
                  id="dept-code"
                  type="text"
                  label="Department Code"
                  placeholder="e.g. CSE"
                  required
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">Description</label>
                  <textarea
                    value={newDept.description}
                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                    rows={3}
                    className="w-full p-3 text-xs bg-slate-50 border border-border rounded-md focus:outline-none focus:bg-white focus:border-primary dark:bg-dark-surface dark:border-dark-border dark:text-gray-150 dark:focus:bg-dark-card"
                    placeholder="Enter department scope description..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateDeptOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Submit Dept
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* H. CREATE SUBJECT MODAL */}
      {isCreateSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreateSubjectOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Create Course Subject</CardTitle>
              <CardDescription>Setup subject and assign HOD department.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateSubjectSubmit} className="space-y-4">
                <Input
                  id="sub-name"
                  type="text"
                  label="Subject Name"
                  placeholder="e.g. Operating Systems"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
                <Input
                  id="sub-code"
                  type="text"
                  label="Subject Code"
                  placeholder="e.g. CS302"
                  required
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                />
                <Input
                  id="sub-credits"
                  type="number"
                  label="Course Credits"
                  required
                  value={newSubject.credits}
                  onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })}
                />
                <Select
                  label="Academic Department"
                  options={[
                    { value: '', label: 'Select Department' },
                    ...(deptsData?.departments.map(d => ({ value: d._id, label: d.name })) || [])
                  ]}
                  value={newSubject.department}
                  onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateSubjectOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Submit Subject
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* I. CREATE ANNOUNCEMENT MODAL */}
      {isCreateAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreateAnnouncementOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-amber-500">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="pb-3 border-b border-border dark:border-dark-border">
              <CardTitle>Create Faculty Announcement</CardTitle>
              <CardDescription>Post a board notice visible only to all Faculty members.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreateAnnouncementSubmit} className="space-y-4">
                <Input
                  id="ann-title"
                  type="text"
                  label="Announcement Title"
                  placeholder="e.g. End of Semester Exam Syllabus"
                  required
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none font-semibold">Notice Message</label>
                  <textarea
                    required
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    rows={4}
                    className="w-full p-3 text-xs bg-slate-50 border border-border rounded-md focus:outline-none focus:bg-white focus:border-primary dark:bg-dark-surface dark:border-dark-border dark:text-gray-150 dark:focus:bg-dark-card"
                    placeholder="Enter the notice content..."
                  />
                </div>
                <Select
                  label="Priority Level"
                  options={[
                    { value: 'low', label: 'Low Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'high', label: 'High Priority' }
                  ]}
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateAnnouncementOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Post Announcement
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
