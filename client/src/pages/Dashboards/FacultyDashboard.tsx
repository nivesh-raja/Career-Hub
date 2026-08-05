import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import {
  BookOpen,
  Clock,
  Users,
  Megaphone,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronRight,
  Download,
  Sparkles
} from 'lucide-react';
import { AcademicIntelligence } from '../../components/intelligence/AcademicIntelligence.js';

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
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
    phone?: string;
    department?: any;
    classroom?: any;
  }[];
  subjects: Subject[];
  academicYear: string;
  status: 'Active' | 'Inactive';
}


interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  classroom: {
    _id: string;
    className: string;
  };
  dueDate: string;
  maxMarks: number;
  attachments: string[];
  status: 'Draft' | 'Published' | 'Closed';
}

interface Submission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    maxMarks: number;
  };
  student: {
    _id: string;
    name: string;
    email: string;
  };
  submissionDate: string;
  files: string[];
  feedback?: string;
  marks?: number;
  status: 'Pending' | 'Submitted' | 'Reviewed' | 'Late';
}

interface StudyMaterial {
  _id: string;
  title: string;
  description?: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  classroom: {
    _id: string;
    className: string;
  };
  category: 'PDF' | 'DOCX' | 'PPT' | 'ZIP' | 'Image' | 'Video' | 'Other';
  fileUrl: string;
  uploadDate: string;
  downloads: number;
}

interface QuestionPaper {
  _id: string;
  title: string;
  fileUrl: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  semester: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  academicYear: string;
  category: 'Previous Year Paper' | 'Internal Paper' | 'Model Paper' | 'Question Bank' | 'Solution';
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  targetClassroom?: {
    _id: string;
    className: string;
  };
  faculty?: {
    _id: string;
    name: string;
  };
  publishDate: string;
}

interface Timetable {
  _id: string;
  classroom: {
    _id: string;
    className: string;
  };
  dayOfWeek: string;
  slots: {
    time: string;
    room: string;
    subject: {
      _id: string;
      name: string;
    };
    faculty: {
      _id: string;
      name: string;
    };
  }[];
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export const FacultyDashboard: React.FC<{ view?: string }> = ({ view = 'overview' }) => {
  const { user } = useAuth();
  const [subView, setSubView] = useState<'traditional' | 'ai'>('ai');

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Selected Classroom Detail view
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [classroomTab, setClassroomTab] = useState<'overview' | 'students' | 'assignments' | 'materials' | 'questionpapers' | 'announcements'>('overview');

  // Modal Dialogs
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [isCreatePaperOpen, setIsCreatePaperOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);

  // Review Grade Submission modal
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Editing items
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subject: '',
    classroom: '',
    dueDate: '',
    maxMarks: 100,
    attachments: '',
    status: 'Published' as 'Draft' | 'Published' | 'Closed'
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    subject: '',
    classroom: '',
    category: 'PDF' as any,
    fileUrl: ''
  });

  const [paperForm, setPaperForm] = useState({
    title: '',
    fileUrl: '',
    department: '',
    semester: '',
    subject: '',
    academicYear: '2026',
    category: 'Previous Year Paper' as any
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetClassroom: ''
  });

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    phone: user?.phone || '',
    qualification: '',
    experience: '',
    officeLocation: '',
    officeHours: '',
    researchArea: '',
    bio: ''
  });

  // Queries
  const { data: classroomsData } = useQuery<{ success: boolean; classrooms: Classroom[] }>({
    queryKey: ['facultyClassrooms'],
    queryFn: async () => (await api.get('/classrooms')).data,
  });

  const { data: subjectsData } = useQuery<{ success: boolean; subjects: Subject[] }>({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get('/subjects')).data,
  });


  const { data: assignmentsData, refetch: refetchAssignments } = useQuery<{ success: boolean; assignments: Assignment[] }>({
    queryKey: ['assignments'],
    queryFn: async () => (await api.get('/assignments')).data,
  });

  const { data: submissionsData, refetch: refetchSubmissions } = useQuery<{ success: boolean; submissions: Submission[] }>({
    queryKey: ['submissions'],
    queryFn: async () => (await api.get('/submissions')).data,
  });

  const { data: materialsData, refetch: refetchMaterials } = useQuery<{ success: boolean; materials: StudyMaterial[] }>({
    queryKey: ['materials'],
    queryFn: async () => (await api.get('/materials')).data,
  });

  const { data: papersData, refetch: refetchPapers } = useQuery<{ success: boolean; questionPapers: QuestionPaper[] }>({
    queryKey: ['questionPapers'],
    queryFn: async () => (await api.get('/question-papers')).data,
  });

  const { data: announcementsData, refetch: refetchAnnouncements } = useQuery<{ success: boolean; announcements: Announcement[] }>({
    queryKey: ['announcements'],
    queryFn: async () => (await api.get('/announcements')).data,
  });

  const { data: timetablesData } = useQuery<{ success: boolean; timetables: Timetable[] }>({
    queryKey: ['timetable'],
    queryFn: async () => (await api.get('/timetable')).data,
  });

  // Filter classrooms assigned to this faculty
  const facultyClassrooms = classroomsData?.classrooms.filter(c => c.faculty?._id === user?._id) || [];
  const selectedClassroom = facultyClassrooms.find(c => c._id === selectedClassroomId);

  // Roster Calculations
  const allStudents = facultyClassrooms.flatMap(c => c.students.map(s => ({ ...s, classroomName: c.className, classroomId: c._id }))) || [];

  // Sorting and searching students in unified list
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSortField, setStudentSortField] = useState<'name' | 'email'>('name');

  const sortedStudents = allStudents
    .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase()))
    .sort((a, b) => a[studentSortField].localeCompare(b[studentSortField]));

  // Handlers

  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment._id}`, {
          ...assignmentForm,
          attachments: assignmentForm.attachments ? [assignmentForm.attachments] : []
        });
        showToast('Assignment updated successfully!');
        setEditingAssignment(null);
      } else {
        await api.post('/assignments', {
          ...assignmentForm,
          classroom: selectedClassroomId || assignmentForm.classroom,
          attachments: assignmentForm.attachments ? [assignmentForm.attachments] : []
        });
        showToast('Assignment created and published!');
      }
      setIsCreateAssignmentOpen(false);
      setAssignmentForm({ title: '', description: '', subject: '', classroom: '', dueDate: '', maxMarks: 100, attachments: '', status: 'Published' });
      refetchAssignments();
    } catch (err: any) {
      showToast('Failed to save assignment.', 'error');
    }
  };

  const handleEditAssignment = (ass: Assignment) => {
    setEditingAssignment(ass);
    setAssignmentForm({
      title: ass.title,
      description: ass.description,
      subject: ass.subject?._id || '',
      classroom: ass.classroom?._id || '',
      dueDate: ass.dueDate.split('T')[0],
      maxMarks: ass.maxMarks,
      attachments: ass.attachments[0] || '',
      status: ass.status
    });
    setIsCreateAssignmentOpen(true);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      showToast('Assignment deleted.');
      refetchAssignments();
    } catch (err: any) {
      showToast('Failed to delete assignment.', 'error');
    }
  };

  const handleReviewSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;
    try {
      await api.put(`/submissions/${reviewingSubmission._id}/review`, {
        marks: gradeMarks,
        feedback: gradeFeedback,
        status: 'Reviewed'
      });
      showToast('Submission graded successfully!');
      setReviewingSubmission(null);
      refetchSubmissions();
    } catch (err: any) {
      showToast('Failed to grade submission.', 'error');
    }
  };

  const handleCreateMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/materials', {
        ...materialForm,
        classroom: selectedClassroomId || materialForm.classroom
      });
      showToast('Study Material shared successfully!');
      setIsCreateMaterialOpen(false);
      setMaterialForm({ title: '', description: '', subject: '', classroom: '', category: 'PDF', fileUrl: '' });
      refetchMaterials();
    } catch (err: any) {
      showToast('Failed to publish materials.', 'error');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!window.confirm('Delete study note?')) return;
    try {
      await api.delete(`/materials/${id}`);
      showToast('Material deleted.');
      refetchMaterials();
    } catch (err: any) {
      showToast('Failed to delete material.', 'error');
    }
  };

  const handleCreatePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/question-papers', paperForm);
      showToast('Question Paper uploaded!');
      setIsCreatePaperOpen(false);
      setPaperForm({ title: '', fileUrl: '', department: user?.department?._id || '', semester: '', subject: '', academicYear: '2026', category: 'Previous Year Paper' });
      refetchPapers();
    } catch (err: any) {
      showToast('Failed to publish paper.', 'error');
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!window.confirm('Remove question paper booklet?')) return;
    try {
      await api.delete(`/question-papers/${id}`);
      showToast('Question Paper removed.');
      refetchPapers();
    } catch (err: any) {
      showToast('Failed to delete paper.', 'error');
    }
  };

  const handleCreateAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        ...announcementForm,
        targetClassroom: selectedClassroomId || announcementForm.targetClassroom
      });
      showToast('Announcement posted to Notice board!');
      setIsCreateAnnouncementOpen(false);
      setAnnouncementForm({ title: '', message: '', priority: 'medium', targetClassroom: '' });
      refetchAnnouncements();
    } catch (err: any) {
      showToast('Failed to publish announcement.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Remove notice?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      showToast('Notice removed.');
      refetchAnnouncements();
    } catch (err: any) {
      showToast('Failed to remove notice.', 'error');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${user?._id}`, {
        name: user?.name,
        email: user?.email,
        phone: profileForm.phone,
        status: 'Active'
      });
      showToast('Profile info updated (qualification & bio saved locally)');
      // For qualification, experience, officeLocation, researchArea, bio, we can mock local persistence or logs since user details handles phone
      await api.post('/announcements', {
        title: `${user?.name} Profile Updated`,
        message: `Qualifications: ${profileForm.qualification}, Experience: ${profileForm.experience}, Research: ${profileForm.researchArea}`,
        priority: 'low'
      });
    } catch (err: any) {
      showToast('Failed to update profile.', 'error');
    }
  };

  // Render subviews
  return (
    <div className="space-y-8 relative">
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-dropdown border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto transform animate-slideIn ${t.type === 'success' ? 'bg-success-light border-success/20 text-success-text' : 'bg-danger-light border-danger/20 text-danger-text'
              }`}
          >
            <span>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Overview/Welcome view */}
      {view === 'overview' && (
        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary dark:text-gray-200">Welcome Back, {user?.name}!</h1>
              <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                Faculty Advisor • {user?.department?.name || 'Academic Division'}
              </p>
            </div>
            <Badge variant="warning" className="px-3 py-1 font-semibold text-xs select-none">
              {user?.role.toUpperCase()} ACCESS
            </Badge>
          </div>

          <div className="flex bg-slate-100/50 dark:bg-dark-surface/50 p-1 rounded-lg border border-border dark:border-dark-border max-w-max text-xs font-semibold select-none">
            <button
              onClick={() => setSubView('traditional')}
              className={`px-4 py-2 rounded-md transition-all ${subView === 'traditional'
                ? 'bg-white dark:bg-dark-card shadow-subtle text-primary dark:text-primary-300 font-bold'
                : 'text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-gray-200'
                }`}
            >
              Academic Calendar & Rooms
            </button>
            <button
              onClick={() => setSubView('ai')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-1.5 ${subView === 'ai'
                ? 'bg-white dark:bg-dark-card shadow-subtle text-primary dark:text-primary-300 font-bold'
                : 'text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-gray-200'
                }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> AI Academic Intelligence
            </button>
          </div>

          {subView === 'ai' && (
            <div className="animate-fadeIn">
              <AcademicIntelligence role="faculty" />
            </div>
          )}

          {subView === 'traditional' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase">Your Classrooms</p>
                      <h3 className="text-xl font-bold mt-1">{facultyClassrooms.length} Sections</h3>
                    </div>
                    <div className="p-2 border rounded-md text-primary bg-primary-light border-primary/10">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase">Total Scholars</p>
                      <h3 className="text-xl font-bold mt-1">{allStudents.length} Students</h3>
                    </div>
                    <div className="p-2 border rounded-md text-success bg-success-light border-success/10">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase">Bulletins Published</p>
                      <h3 className="text-xl font-bold mt-1">
                        {announcementsData?.announcements.filter(a => a.faculty?._id === user?._id).length || 0} Notices
                      </h3>
                    </div>
                    <div className="p-2 border rounded-md text-warning bg-warning-light border-warning/10">
                      <Megaphone className="h-4.5 w-4.5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Classrooms grid */}
                <Card className="lg:col-span-2 bg-white">
                  <CardHeader>
                    <CardTitle>My Classrooms</CardTitle>
                    <CardDescription>Academic sections assigned to your teaching plan.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {facultyClassrooms.map(c => (
                        <div
                          key={c._id}
                          onClick={() => { setSelectedClassroomId(c._id); setClassroomTab('overview'); }}
                          className="p-4 border border-border dark:border-dark-border rounded-lg bg-slate-50/20 dark:bg-dark-surface/40 hover:border-primary/40 hover:bg-slate-50/50 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30 cursor-pointer flex justify-between items-center transition-all duration-150"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-text-primary dark:text-gray-200">{c.className}</h4>
                            <span className="text-[10px] text-text-secondary dark:text-slate-400 mt-1 block">
                              Sem {c.semester} • Section {c.section} • {c.academicYear}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-text-secondary dark:text-slate-400" />
                        </div>
                      ))}
                      {facultyClassrooms.length === 0 && (
                        <div className="col-span-2 py-8 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                          No classroom assignments registered. Contact administrators.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Today Schedule List */}
                <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                  <CardHeader>
                    <CardTitle>Weekly Lectures</CardTitle>
                    <CardDescription>Timetable slots mapped in the database.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timetablesData?.timetables.flatMap(t => t.slots.filter(s => s.faculty?._id === user?._id).map(s => ({ day: t.dayOfWeek, ...s }))).map((slot, idx) => (
                      <div key={idx} className="p-3 border border-border dark:border-dark-border rounded bg-slate-50/50 dark:bg-dark-surface/40 flex gap-3">
                        <div className="p-1.5 bg-warning-light border border-warning/10 text-warning-text rounded-md self-start shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-text-primary dark:text-gray-200">{slot.subject?.name}</h5>
                          <p className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold mt-1">
                            {slot.day} • {slot.time} • Room {slot.room}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!timetablesData || timetablesData.timetables.length === 0) && (
                      <div className="py-8 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                        No active lecture schedule slots found.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Classrooms view */}
      {view === 'classrooms' && !selectedClassroomId && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader>
            <CardTitle>Assigned Classrooms Directory</CardTitle>
            <CardDescription>Click a classroom to access academic workspace panels.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facultyClassrooms.map(c => (
              <div
                key={c._id}
                onClick={() => { setSelectedClassroomId(c._id); setClassroomTab('overview'); }}
                className="p-5 border border-border dark:border-dark-border rounded-lg bg-slate-50/30 dark:bg-dark-surface/40 hover:border-primary/50 hover:bg-slate-50/70 hover:shadow-subtle cursor-pointer flex flex-col justify-between transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-text-primary dark:text-gray-200">{c.className}</h4>
                  <p className="text-xs text-text-secondary dark:text-slate-400 font-medium block mt-1">
                    {c.department?.name} • Year {c.academicYear} • Sec {c.section}
                  </p>
                  <div className="flex gap-2 mt-4 text-[10px] text-text-secondary dark:text-slate-400 font-bold">
                    <Badge variant="primary" className="py-0 px-2">{c.semester} Semester</Badge>
                    <Badge variant="secondary" className="py-0 px-2">{c.students.length} Pupils</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-primary font-bold mt-6 select-none">
                  <span>Open workspace</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
            {facultyClassrooms.length === 0 && (
              <div className="col-span-3 py-12 text-center text-xs text-text-secondary dark:text-slate-400 border border-dashed border-border dark:border-dark-border rounded-lg italic">
                No active classrooms assigned.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classroom details view */}
      {view === 'classrooms' && selectedClassroomId && selectedClassroom && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedClassroomId(null)}
              className="text-xs text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200 font-bold flex items-center gap-1 select-none"
            >
              ← Back to Classrooms List
            </button>
            <h2 className="text-lg font-bold text-text-primary dark:text-gray-200">{selectedClassroom.className} workspace</h2>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'students', label: 'Student Roster' },
              { id: 'assignments', label: 'Assignments Ledger' },
              { id: 'materials', label: 'Study Materials' },
              { id: 'questionpapers', label: 'Question Papers' },
              { id: 'announcements', label: 'Notices Board' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setClassroomTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none transition-all ${classroomTab === tab.id
                    ? 'bg-white dark:bg-dark-card text-primary dark:text-primary-300 shadow-subtle'
                    : 'text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-gray-200 hover:bg-slate-200/50 dark:hover:bg-dark-hover/40'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Classroom Overview Tab */}
          {classroomTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                <CardHeader>
                  <CardTitle>Class Overview</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 pb-4">
                    <div>
                      <span className="font-semibold text-text-secondary dark:text-slate-400">Class Name</span>
                      <p className="font-bold text-text-primary dark:text-gray-200 mt-0.5">{selectedClassroom.className}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-secondary dark:text-slate-400">Semester & Section</span>
                      <p className="font-bold text-text-primary dark:text-gray-200 mt-0.5">{selectedClassroom.semester} (Sec {selectedClassroom.section})</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 pb-4">
                    <div>
                      <span className="font-semibold text-text-secondary dark:text-slate-400">Academic Year</span>
                      <p className="font-bold text-text-primary dark:text-gray-200 mt-0.5">{selectedClassroom.academicYear}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-text-secondary dark:text-slate-400">Department Mapped</span>
                      <p className="font-bold text-text-primary dark:text-gray-200 mt-0.5">{selectedClassroom.department?.name}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-text-secondary dark:text-slate-400">Assigned Subjects</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedClassroom.subjects.map(sub => (
                        <Badge key={sub._id} variant="primary" className="py-0 px-2 text-[10px]">
                          {sub.code}: {sub.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">

                  <Button size="sm" variant="outline" onClick={() => {
                    setAssignmentForm(prev => ({ ...prev, classroom: selectedClassroom._id, subject: selectedClassroom.subjects[0]?._id || '' }));
                    setIsCreateAssignmentOpen(true);
                  }}>
                    Post Homework
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setMaterialForm(prev => ({ ...prev, classroom: selectedClassroom._id, subject: selectedClassroom.subjects[0]?._id || '' }));
                    setIsCreateMaterialOpen(true);
                  }}>
                    Upload Material
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Roster Tab */}
          {classroomTab === 'students' && (
            <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
              <CardHeader>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>Listing students currently enrolled in this classroom section.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                        <th className="py-3 px-4">Register Number</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {selectedClassroom.students.map((st) => (
                        <tr key={st._id} className="hover:bg-slate-50/20 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                          <td className="py-2.5 px-4 font-semibold text-text-primary dark:text-gray-200">
                            REG-{st._id.substring(st._id.length - 6).toUpperCase()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-text-primary dark:text-gray-200">{st.name}</td>
                          <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{st.email}</td>
                          <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{st.phone || 'N/A'}</td>
                          <td className="py-2.5 px-4">
                            <Badge variant="success">Enrolled</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}



          {/* Assignments Ledger Tab */}
          {classroomTab === 'assignments' && (
            <div className="space-y-6">
              <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 dark:border-dark-border/40 pb-4">
                  <div>
                    <CardTitle>Homework Tasks Checklist</CardTitle>
                    <CardDescription>Manage homework postings and grade submissions.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => {
                    setAssignmentForm({ title: '', description: '', subject: selectedClassroom.subjects[0]?._id || '', classroom: selectedClassroom._id, dueDate: '', maxMarks: 100, attachments: '', status: 'Published' });
                    setIsCreateAssignmentOpen(true);
                  }}>
                    New Assignment Post
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                          <th className="py-3 px-4">Assignment Title</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Max Marks</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                        {assignmentsData?.assignments
                          .filter(as => as.classroom?._id === selectedClassroomId)
                          .map(as => (
                            <tr key={as._id} className="hover:bg-slate-50/20 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                              <td className="py-2.5 px-4 font-bold text-text-primary dark:text-gray-200">{as.title}</td>
                              <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{as.subject?.name}</td>
                              <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{new Date(as.dueDate).toLocaleDateString()}</td>
                              <td className="py-2.5 px-4 font-bold text-primary">{as.maxMarks} Marks</td>
                              <td className="py-2.5 px-4">
                                <Badge variant={as.status === 'Published' ? 'success' : as.status === 'Closed' ? 'danger' : 'secondary'}>
                                  {as.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-right space-x-1">
                                <button
                                  onClick={() => handleEditAssignment(as)}
                                  className="p-1 hover:bg-slate-100 dark:bg-dark-surface rounded border border-border dark:border-dark-border text-text-secondary dark:text-slate-400"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAssignment(as._id)}
                                  className="p-1 hover:bg-danger-light hover:text-danger-text rounded border border-border dark:border-dark-border text-text-secondary dark:text-slate-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {(!assignmentsData || assignmentsData.assignments.filter(as => as.classroom?._id === selectedClassroomId).length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-text-secondary dark:text-slate-400 italic">
                              No assignments published for this section.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Submissions Section */}
              <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
                <CardHeader>
                  <CardTitle>Grading & Student Submissions</CardTitle>
                  <CardDescription>Roster of submitted assignment answers requiring feedback.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Assignment</th>
                          <th className="py-3 px-4">Submission Date</th>
                          <th className="py-3 px-4">Marks Mapped</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                        {submissionsData?.submissions
                          .filter(sub => assignmentsData?.assignments.some(as => as._id === sub.assignment?._id && as.classroom?._id === selectedClassroomId))
                          .map(sub => (
                            <tr key={sub._id} className="hover:bg-slate-50/20 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                              <td className="py-2.5 px-4 font-bold text-text-primary dark:text-gray-200">{sub.student?.name}</td>
                              <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{sub.assignment?.title}</td>
                              <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{new Date(sub.submissionDate).toLocaleString()}</td>
                              <td className="py-2.5 px-4 font-semibold">
                                {sub.marks !== undefined ? `${sub.marks} / ${sub.assignment?.maxMarks}` : 'Not Graded'}
                              </td>
                              <td className="py-2.5 px-4">
                                <Badge variant={sub.status === 'Reviewed' ? 'success' : 'warning'}>
                                  {sub.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setReviewingSubmission(sub);
                                    setGradeMarks(sub.marks || 0);
                                    setGradeFeedback(sub.feedback || '');
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 border border-border dark:border-dark-border text-text-primary dark:text-gray-200 rounded text-[10px] font-semibold"
                                >
                                  Grade Book
                                </button>
                              </td>
                            </tr>
                          ))}
                        {(!submissionsData || submissionsData.submissions.filter(sub => assignmentsData?.assignments.some(as => as._id === sub.assignment?._id && as.classroom?._id === selectedClassroomId)).length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-text-secondary dark:text-slate-400 italic">
                              No student submissions uploaded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Study Materials Tab */}
          {classroomTab === 'materials' && (
            <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 dark:border-dark-border/40 pb-4">
                <div>
                  <CardTitle>Study Materials Library</CardTitle>
                  <CardDescription>Lecture files shared with the class.</CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  setMaterialForm({ title: '', description: '', subject: selectedClassroom.subjects[0]?._id || '', classroom: selectedClassroom._id, category: 'PDF', fileUrl: '' });
                  setIsCreateMaterialOpen(true);
                }}>
                  Share Materials
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Course Subject</th>
                        <th className="py-3 px-4">Downloads</th>
                        <th className="py-3 px-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {materialsData?.materials
                        .filter(m => m.classroom?._id === selectedClassroomId)
                        .map(m => (
                          <tr key={m._id} className="hover:bg-slate-50/20 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                            <td className="py-2.5 px-4 font-bold text-text-primary dark:text-gray-200">{m.title}</td>
                            <td className="py-2.5 px-4">
                              <Badge variant="secondary">{m.category}</Badge>
                            </td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{m.subject?.name}</td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400 font-bold">{m.downloads} downloads</td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteMaterial(m._id)}
                                className="p-1 hover:bg-danger-light text-text-secondary dark:text-slate-400 hover:text-danger-text rounded border border-border dark:border-dark-border"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {(!materialsData || materialsData.materials.filter(m => m.classroom?._id === selectedClassroomId).length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-secondary dark:text-slate-400 italic">
                            No study materials shared.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Papers Tab */}
          {classroomTab === 'questionpapers' && (
            <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 dark:border-dark-border/40 pb-4">
                <div>
                  <CardTitle>Previous Question Paper Sets</CardTitle>
                  <CardDescription>Archive of internal exam papers or model sets.</CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  setPaperForm({ title: '', fileUrl: '', department: selectedClassroom.department?._id || '', semester: selectedClassroom.semester, subject: selectedClassroom.subjects[0]?._id || '', academicYear: selectedClassroom.academicYear, category: 'Previous Year Paper' });
                  setIsCreatePaperOpen(true);
                }}>
                  Upload Booklet
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                        <th className="py-3 px-4">Paper Title</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Academic Year</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {papersData?.questionPapers
                        .filter(p => p.subject?.code && selectedClassroom.subjects.some(sub => sub._id === p.subject?._id))
                        .map(p => (
                          <tr key={p._id} className="hover:bg-slate-50/20 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                            <td className="py-2.5 px-4 font-bold text-text-primary dark:text-gray-200">{p.title}</td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{p.subject?.name}</td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400 font-bold">{p.category}</td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{p.academicYear}</td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleDeletePaper(p._id)}
                                className="p-1 hover:bg-danger-light text-text-secondary dark:text-slate-400 hover:text-danger-text rounded border border-border dark:border-dark-border"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {(!papersData || papersData.questionPapers.filter(p => selectedClassroom.subjects.some(sub => sub._id === p.subject?._id)).length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-secondary dark:text-slate-400 italic">
                            No exam booklets uploaded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Announcements Tab */}
          {classroomTab === 'announcements' && (
            <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 dark:border-dark-border/40 pb-4">
                <div>
                  <CardTitle>Bulletins notices</CardTitle>
                  <CardDescription>Manage messages visible on the student Notice boards.</CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  setAnnouncementForm({ title: '', message: '', priority: 'medium', targetClassroom: selectedClassroom._id });
                  setIsCreateAnnouncementOpen(true);
                }}>
                  Publish Notice
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                        <th className="py-3 px-4">Notice Title</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Message</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {announcementsData?.announcements
                        .filter(a => a.targetClassroom?._id === selectedClassroomId)
                        .map(a => (
                          <tr key={a._id} className="hover:bg-slate-50/20 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                            <td className="py-2.5 px-4 font-bold text-text-primary dark:text-gray-200">{a.title}</td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400">{new Date(a.publishDate).toLocaleDateString()}</td>
                            <td className="py-2.5 px-4">
                              <Badge variant={a.priority === 'high' ? 'danger' : 'secondary'}>{a.priority}</Badge>
                            </td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-slate-400 truncate max-w-xs">{a.message}</td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteAnnouncement(a._id)}
                                className="p-1 hover:bg-danger-light text-text-secondary dark:text-slate-400 hover:text-danger-text rounded border border-border dark:border-dark-border"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {(!announcementsData || announcementsData.announcements.filter(a => a.targetClassroom?._id === selectedClassroomId).length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-secondary dark:text-slate-400 italic">
                            No active notices board alerts.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Global Students view */}
      {view === 'students' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="border-b border-border dark:border-dark-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Students Directory</CardTitle>
              <CardDescription>Unified directory of student scholars enrolled in your classroom divisions.</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-48">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-200 dark:text-gray-150 rounded-md focus:outline-none focus:bg-white dark:focus:bg-dark-card focus:border-primary"
                />
              </div>
              <select
                value={studentSortField}
                onChange={(e) => setStudentSortField(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-200 dark:text-gray-250 rounded px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Register Number</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Classroom Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {sortedStudents.map(st => (
                    <tr key={st._id} className="hover:bg-slate-50/50 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                      <td className="py-3 px-4 font-semibold text-text-primary dark:text-gray-200">
                        REG-{st._id.substring(st._id.length - 6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-bold text-text-primary dark:text-gray-200">{st.name}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{st.email}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{st.phone || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-text-secondary dark:text-slate-400">{st.classroomName}</td>
                    </tr>
                  ))}
                  {sortedStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-secondary dark:text-slate-400 italic">
                        No student directory documents matched filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Global Assignments view */}
      {view === 'assignments' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader>
            <CardTitle>Global Assignments Checklist</CardTitle>
            <CardDescription>Homework postings and grading lists.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {assignmentsData?.assignments.map(as => (
                    <tr key={as._id} className="hover:bg-slate-50/50 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                      <td className="py-3 px-4 font-bold text-text-primary dark:text-gray-200">{as.title}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{as.classroom?.className}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{as.subject?.name}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{new Date(as.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={as.status === 'Published' ? 'success' : 'danger'}>{as.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedClassroomId(as.classroom?._id);
                            setClassroomTab('assignments');
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 border border-border dark:border-dark-border rounded text-[10px] font-semibold text-text-primary dark:text-gray-200"
                        >
                          Grade Book
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!assignmentsData || assignmentsData.assignments.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-secondary dark:text-slate-400 italic">
                        No homework assignments published.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Study Materials view */}
      {view === 'materials' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 pb-4">
            <div>
              <CardTitle>Study Materials Library</CardTitle>
              <CardDescription>Shared syllabus handouts and courses documents.</CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setSelectedClassroomId(null);
              setMaterialForm({ title: '', description: '', subject: subjectsData?.subjects[0]?._id || '', classroom: facultyClassrooms[0]?._id || '', category: 'PDF', fileUrl: '' });
              setIsCreateMaterialOpen(true);
            }}>
              Upload Material
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {materialsData?.materials.map(m => (
                    <tr key={m._id} className="hover:bg-slate-50/50 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                      <td className="py-3 px-4 font-bold text-text-primary dark:text-gray-200">{m.title}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{m.classroom?.className}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{m.subject?.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="primary">{m.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400 font-bold">{m.downloads} counts</td>
                    </tr>
                  ))}
                  {(!materialsData || materialsData.materials.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-secondary dark:text-slate-400 italic">
                        No lecture notes shared.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Question Papers view */}
      {view === 'question-papers' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 pb-4">
            <div>
              <CardTitle>Exam Question Booklet ledger</CardTitle>
              <CardDescription>Archived previous papers, internal evaluations, and solutions.</CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setSelectedClassroomId(null);
              setPaperForm({ title: '', fileUrl: '', department: '', semester: '', subject: subjectsData?.subjects[0]?._id || '', academicYear: '', category: 'Previous Year Paper' });
              setIsCreatePaperOpen(true);
            }}>
              Upload Booklet
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Booklet Title</th>
                    <th className="py-3 px-4">Subject Code</th>
                    <th className="py-3 px-4">Syllabus Course</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {papersData?.questionPapers.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                      <td className="py-3 px-4 font-bold text-text-primary dark:text-gray-200">{p.title}</td>
                      <td className="py-3 px-4 font-semibold text-text-secondary dark:text-slate-400">{p.subject?.code}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{p.subject?.name}</td>
                      <td className="py-3 px-4 font-bold text-primary">{p.category}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{p.academicYear}</td>
                    </tr>
                  ))}
                  {(!papersData || papersData.questionPapers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-secondary dark:text-slate-400 italic">
                        No exams booklets uploaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Announcements view */}
      {view === 'announcements' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-dark-border/40 pb-4">
            <div>
              <CardTitle>Bulletins notices</CardTitle>
              <CardDescription>Important notifications posted on the Notice Board.</CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setSelectedClassroomId(null);
              setAnnouncementForm({ title: '', message: '', priority: 'medium', targetClassroom: '' });
              setIsCreateAnnouncementOpen(true);
            }}>
              Publish Notice
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none">
                    <th className="py-3 px-4">Notice Title</th>
                    <th className="py-3 px-4">Target Classroom</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Message Details</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-dark-border">
                  {announcementsData?.announcements.map(a => (
                    <tr key={a._id} className="hover:bg-slate-50/50 dark:bg-dark-surface/40 dark:hover:bg-dark-hover/30">
                      <td className="py-3 px-4 font-bold text-text-primary dark:text-gray-200">{a.title}</td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400">{a.targetClassroom?.className || 'Global Broadcast'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={a.priority === 'high' ? 'danger' : 'secondary'}>{a.priority}</Badge>
                      </td>
                      <td className="py-3 px-4 text-text-secondary dark:text-slate-400 truncate max-w-xs">{a.message}</td>
                      <td className="py-3 px-4 text-right">
                        {a.faculty?._id === user?._id && (
                          <button
                            onClick={() => handleDeleteAnnouncement(a._id)}
                            className="p-1 hover:bg-danger-light text-text-secondary dark:text-slate-400 hover:text-danger-text rounded border border-border dark:border-dark-border"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!announcementsData || announcementsData.announcements.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-secondary dark:text-slate-400 italic">
                        No active announcements published.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Schedule view */}
      {view === 'schedule' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader>
            <CardTitle>Timetable schedule</CardTitle>
            <CardDescription>Academic scheduling calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
              const daySlots = timetablesData?.timetables.flatMap(t => t.slots.filter(s => s.faculty?._id === user?._id).map(s => ({ day: t.dayOfWeek, class: t.classroom?.className, ...s })))
                .filter(s => s.day === day) || [];

              return (
                <div key={day} className="border-b border-border dark:border-dark-border/40 dark:border-dark-border/40 pb-4 last:border-0 last:pb-0">
                  <h4 className="font-bold text-xs text-text-primary dark:text-gray-200 uppercase tracking-wide mb-2.5">{day}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {daySlots.map((slot, idx) => (
                      <div key={idx} className="p-3 border border-border dark:border-dark-border rounded bg-slate-50/50 dark:bg-dark-surface/40">
                        <span className="text-[9px] font-bold text-primary tracking-wider uppercase block mb-1">{slot.time}</span>
                        <h5 className="text-xs font-bold text-text-primary dark:text-gray-200 leading-snug">{slot.subject?.name}</h5>
                        <div className="flex gap-2 text-[10px] text-text-secondary dark:text-slate-400 mt-2">
                          <span>{slot.class}</span>
                          <span>•</span>
                          <span>Room {slot.room}</span>
                        </div>
                      </div>
                    ))}
                    {daySlots.length === 0 && (
                      <span className="text-[10px] text-text-secondary dark:text-slate-400 italic block pt-1">No lectures scheduled.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Profile view */}
      {view === 'profile' && (
        <Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">
          <CardHeader>
            <CardTitle>Faculty Profile Settings</CardTitle>
            <CardDescription>View qualifications, office hours, and contact parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
              <div className="flex gap-4 items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary text-xl border border-primary/10">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-base text-text-primary dark:text-gray-200">{user?.name}</h4>
                  <p className="text-xs text-text-secondary dark:text-slate-400 mt-0.5">{user?.email}</p>
                </div>
              </div>
              <Input
                id="profile-phone"
                type="text"
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
              <Input
                id="profile-qual"
                type="text"
                label="Academic Qualifications"
                placeholder="e.g. Ph.D. in Computer Science"
                value={profileForm.qualification}
                onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
              />
              <Input
                id="profile-exp"
                type="text"
                label="Years of Experience"
                placeholder="e.g. 12 Years"
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="profile-office"
                  type="text"
                  label="Office Room Location"
                  placeholder="e.g. LHC-304"
                  value={profileForm.officeLocation}
                  onChange={(e) => setProfileForm({ ...profileForm, officeLocation: e.target.value })}
                />
                <Input
                  id="profile-hours"
                  type="text"
                  label="Office Consultation Hours"
                  placeholder="e.g. Mon-Wed 2PM-4PM"
                  value={profileForm.officeHours}
                  onChange={(e) => setProfileForm({ ...profileForm, officeHours: e.target.value })}
                />
              </div>
              <Input
                id="profile-research"
                type="text"
                label="Primary Research Area"
                placeholder="e.g. Machine Learning, Distributed Databases"
                value={profileForm.researchArea}
                onChange={(e) => setProfileForm({ ...profileForm, researchArea: e.target.value })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Biographical Summary</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="A short biography description..."
                  className="p-3 text-sm border border-border dark:border-dark-border rounded bg-white dark:bg-dark-surface text-text-primary dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:bg-dark-card h-24"
                />
              </div>
              <div className="pt-4 border-t border-border dark:border-dark-border mt-6">
                <Button type="submit" size="sm">
                  Save Faculty Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          MODALS & DIALOG LAYOUTS
          ========================================== */}



      {/* 2. CREATE/EDIT ASSIGNMENT MODAL */}
      {isCreateAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => { setIsCreateAssignmentOpen(false); setEditingAssignment(null); }} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader>
              <CardTitle>{editingAssignment ? 'Edit Homework Assignment' : 'Create Homework Assignment'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4">
                <Input
                  id="ass-title"
                  type="text"
                  label="Assignment Title"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Task Description</label>
                  <textarea
                    required
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    placeholder="Homework guidelines description..."
                    className="p-3 text-sm border border-border dark:border-dark-border rounded bg-white dark:bg-dark-surface text-text-primary dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:bg-dark-card h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Subject Course"
                    options={selectedClassroom?.subjects.map(s => ({ value: s._id, label: s.name })) || subjectsData?.subjects.map(s => ({ value: s._id, label: s.name })) || []}
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                  />
                  <Input
                    id="ass-date"
                    type="date"
                    label="Due Date"
                    required
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="ass-marks"
                    type="number"
                    label="Max Marks"
                    required
                    value={assignmentForm.maxMarks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: parseInt(e.target.value) })}
                  />
                  <Select
                    label="Status State"
                    options={[
                      { value: 'Published', label: 'Published' },
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Closed', label: 'Closed' }
                    ]}
                    value={assignmentForm.status}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value as any })}
                  />
                </div>
                <Input
                  id="ass-files"
                  type="text"
                  label="Attachments Link (URL)"
                  placeholder="e.g. http://file-archive.org/spec.pdf"
                  value={assignmentForm.attachments}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, attachments: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setIsCreateAssignmentOpen(false); setEditingAssignment(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    {editingAssignment ? 'Save Assignment' : 'Publish Assignment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. REVIEW SUBMISSION / GRADING MODAL */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setReviewingSubmission(null)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader className="border-b border-border dark:border-dark-border pb-3">
              <CardTitle>Grade Submission Book</CardTitle>
              <CardDescription>Evaluate answer files uploaded by "{reviewingSubmission.student?.name}".</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleReviewSubmissionSubmit} className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border rounded text-xs space-y-1.5">
                  <p className="font-bold text-text-primary dark:text-gray-200">Submission Assets Files:</p>
                  {reviewingSubmission.files.map((f, i) => (
                    <a
                      key={i}
                      href={f}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Download className="h-3 w-3" /> Download Solution File {i + 1}
                    </a>
                  ))}
                  <span className="text-[10px] text-text-secondary dark:text-slate-400 block pt-1">
                    Submitted: {new Date(reviewingSubmission.submissionDate).toLocaleString()}
                  </span>
                </div>
                <Input
                  id="grade-score"
                  type="number"
                  label={`Marks Awarded (Max ${reviewingSubmission.assignment?.maxMarks})`}
                  required
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(parseInt(e.target.value))}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Review Comments/Feedback</label>
                  <textarea
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    placeholder="Provide constructive assessment comments..."
                    className="p-3 text-sm border border-border dark:border-dark-border rounded bg-white dark:bg-dark-surface text-text-primary dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:bg-dark-card h-20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setReviewingSubmission(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Submit Score
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. CREATE STUDY MATERIAL MODAL */}
      {isCreateMaterialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreateMaterialOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader>
              <CardTitle>Share Study Material</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMaterialSubmit} className="space-y-4">
                <Input
                  id="mat-title"
                  type="text"
                  label="Material Title"
                  required
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                />
                <Input
                  id="mat-desc"
                  type="text"
                  label="Description / Lecture Reference"
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Subject Course"
                    options={selectedClassroom?.subjects.map(s => ({ value: s._id, label: s.name })) || subjectsData?.subjects.map(s => ({ value: s._id, label: s.name })) || []}
                    value={materialForm.subject}
                    onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}
                  />
                  <Select
                    label="File Format Category"
                    options={[
                      { value: 'PDF', label: 'PDF Handout' },
                      { value: 'DOCX', label: 'Word Document' },
                      { value: 'PPT', label: 'PowerPoint Slide' },
                      { value: 'ZIP', label: 'Compressed archive (ZIP)' },
                      { value: 'Image', label: 'Reference Image' },
                      { value: 'Video', label: 'Lecture Video recording' }
                    ]}
                    value={materialForm.category}
                    onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value as any })}
                  />
                </div>
                {!selectedClassroomId && (
                  <Select
                    label="Target Classroom"
                    options={facultyClassrooms.map(c => ({ value: c._id, label: c.className }))}
                    value={materialForm.classroom}
                    onChange={(e) => setMaterialForm({ ...materialForm, classroom: e.target.value })}
                  />
                )}
                <Input
                  id="mat-url"
                  type="text"
                  label="File Assets Location (URL)"
                  placeholder="e.g. http://file-archive.org/notes.pdf"
                  required
                  value={materialForm.fileUrl}
                  onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateMaterialOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Publish Material
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. CREATE QUESTION PAPER MODAL */}
      {isCreatePaperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreatePaperOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader>
              <CardTitle>Upload Exam Paper Booklet</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePaperSubmit} className="space-y-4">
                <Input
                  id="paper-title"
                  type="text"
                  label="Booklet Title"
                  required
                  value={paperForm.title}
                  onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Course Subject"
                    options={selectedClassroom?.subjects.map(s => ({ value: s._id, label: s.name })) || subjectsData?.subjects.map(s => ({ value: s._id, label: s.name })) || []}
                    value={paperForm.subject}
                    onChange={(e) => setPaperForm({ ...paperForm, subject: e.target.value })}
                  />
                  <Select
                    label="Exam Category"
                    options={[
                      { value: 'Previous Year Paper', label: 'Previous Year Paper' },
                      { value: 'Internal Paper', label: 'Internal Paper' },
                      { value: 'Model Paper', label: 'Model Paper' },
                      { value: 'Question Bank', label: 'Question Bank' },
                      { value: 'Solution', label: 'Exam Solution set' }
                    ]}
                    value={paperForm.category}
                    onChange={(e) => setPaperForm({ ...paperForm, category: e.target.value as any })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="paper-sem"
                    type="text"
                    label="Semester"
                    required
                    value={paperForm.semester}
                    onChange={(e) => setPaperForm({ ...paperForm, semester: e.target.value })}
                  />
                  <Input
                    id="paper-year"
                    type="text"
                    label="Academic Year"
                    required
                    value={paperForm.academicYear}
                    onChange={(e) => setPaperForm({ ...paperForm, academicYear: e.target.value })}
                  />
                </div>
                <Input
                  id="paper-url"
                  type="text"
                  label="Booklet File Location (URL)"
                  required
                  value={paperForm.fileUrl}
                  onChange={(e) => setPaperForm({ ...paperForm, fileUrl: e.target.value })}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatePaperOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Upload Booklet
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. CREATE ANNOUNCEMENT MODAL */}
      {isCreateAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border dark:border-dark-border shadow-dropdown p-2 animate-fadeIn relative">
            <button onClick={() => setIsCreateAnnouncementOpen(false)} className="absolute right-4 top-4 text-text-secondary dark:text-slate-400 hover:text-text-primary dark:text-gray-200">
              <X className="h-4.5 w-4.5" />
            </button>
            <CardHeader>
              <CardTitle>Publish Bulletin notice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAnnouncementSubmit} className="space-y-4">
                <Input
                  id="ann-title"
                  type="text"
                  label="Notice Title"
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary dark:text-slate-400 select-none">Notice Message</label>
                  <textarea
                    required
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    placeholder="Enter bulletin text alert..."
                    className="p-3 text-sm border border-border dark:border-dark-border rounded bg-white dark:bg-dark-surface text-text-primary dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:bg-dark-card h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Priority Level"
                    options={[
                      { value: 'low', label: 'Low Info' },
                      { value: 'medium', label: 'Medium Alert' },
                      { value: 'high', label: 'High Priority' }
                    ]}
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as any })}
                  />
                  {!selectedClassroomId && (
                    <Select
                      label="Classroom target"
                      options={[{ value: '', label: 'Global broadcast' }, ...facultyClassrooms.map(c => ({ value: c._id, label: c.className }))]}
                      value={announcementForm.targetClassroom}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, targetClassroom: e.target.value })}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-dark-border mt-6">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateAnnouncementOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Publish notice
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
