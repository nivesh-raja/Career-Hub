import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import {
  Clock,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Download,
  AlertCircle,
  Upload,
  Search,
  X
} from 'lucide-react';

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  description?: string;
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
  }[];
  subjects: Subject[];
  academicYear: string;
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
  dueDate: string;
  maxMarks: number;
  attachments: string[];
  status: string;
}

interface Submission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    maxMarks: number;
  };
  student: string;
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
  category: string;
  fileUrl: string;
  downloads: number;
}

interface QuestionPaper {
  _id: string;
  title: string;
  fileUrl: string;
  semester: string;
  subject: {
    name: string;
    code: string;
  };
  category: string;
  academicYear: string;
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  targetClassroom?: {
    className: string;
  };
  publishDate: string;
}

interface Timetable {
  _id: string;
  classroom: string;
  dayOfWeek: string;
  slots: {
    time: string;
    room: string;
    subject: {
      name: string;
      code: string;
    };
    faculty: {
      name: string;
    };
  }[];
}

export const StudentDashboard: React.FC<{ view?: string }> = ({ view = 'overview' }) => {
  const { user } = useAuth();

  // Submit modal states
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<string>('');

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Search/Filters
  const [materialSearch, setMaterialSearch] = useState('');
  const [paperSearch, setPaperSearch] = useState('');

  // Queries
  const { data: classroomsData } = useQuery<{ success: boolean; classrooms: Classroom[] }>({
    queryKey: ['classrooms'],
    queryFn: async () => (await api.get('/classrooms')).data,
  });

  const myClassroom = classroomsData?.classrooms.find(c => c.students.some(s => s._id === user?._id)) || null;


  const { data: assignmentsData, refetch: refetchAssignments } = useQuery<{ success: boolean; assignments: Assignment[] }>({
    queryKey: ['myAssignments'],
    queryFn: async () => (await api.get('/assignments')).data,
  });

  const { data: submissionsData, refetch: refetchSubmissions } = useQuery<{ success: boolean; submissions: Submission[] }>({
    queryKey: ['mySubmissions'],
    queryFn: async () => (await api.get('/submissions')).data,
  });

  const { data: materialsData } = useQuery<{ success: boolean; materials: StudyMaterial[] }>({
    queryKey: ['myMaterials'],
    queryFn: async () => (await api.get('/materials')).data,
  });

  const { data: papersData } = useQuery<{ success: boolean; questionPapers: QuestionPaper[] }>({
    queryKey: ['myPapers'],
    queryFn: async () => (await api.get('/question-papers')).data,
  });

  const { data: announcementsData } = useQuery<{ success: boolean; announcements: Announcement[] }>({
    queryKey: ['myAnnouncements'],
    queryFn: async () => (await api.get('/announcements')).data,
  });

  const { data: timetablesData } = useQuery<{ success: boolean; timetables: Timetable[] }>({
    queryKey: ['myTimetable'],
    queryFn: async () => (await api.get('/timetable')).data,
  });


  const pendingAssignmentsCount = assignmentsData?.assignments.filter(as =>
    !submissionsData?.submissions.some(sub => sub.assignment?._id === as._id)
  ).length || 0;

  // Handlers
  const handleMaterialDownload = async (id: string, url: string) => {
    try {
      await api.patch(`/materials/${id}/download`);
      window.open(url, '_blank');
      showToast('Downloading document file...');
    } catch (err) {
      showToast('Failed to count download', 'error');
    }
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !submissionFile) return;
    try {
      await api.post('/submissions', {
        assignment: submittingAssignment._id,
        files: [submissionFile]
      });
      showToast('Assignment submitted successfully!');
      setSubmittingAssignment(null);
      setSubmissionFile('');
      refetchAssignments();
      refetchSubmissions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit assignment', 'error');
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-dropdown border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto transform animate-slideIn ${t.type === 'success' ? 'bg-success-light border-success/20 text-success-text' : 'bg-danger-light border-danger/20 text-danger-text'
              }`}
          >
            <span>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-text-secondary hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Student Welcome Banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">Welcome Back, {user?.name}!</h1>
          <p className="text-xs text-text-secondary">
            Department: {user?.department?.name || 'Academic Division'} • Student Academic Portal
          </p>
        </div>
        <Badge variant="primary" className="px-3 py-1 font-semibold text-xs select-none">
          REG-{user?._id.substring(user?._id.length - 6).toUpperCase()}
        </Badge>
      </div>

      {/* Dashboard Overview view */}
      {view === 'overview' && (
        <div className="space-y-6">
          {/* Live KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white ch-card-vibrant">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Your Classroom</p>
                  <h4 className="text-sm font-bold text-text-primary mt-1">
                    {myClassroom ? myClassroom.className : 'Unassigned'}
                  </h4>
                </div>
                <div className="p-2 bg-primary-light text-primary rounded border border-primary/5">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white ch-card-vibrant">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Subjects Enrolled</p>
                  <h4 className="text-sm font-bold text-text-primary mt-1">
                    {myClassroom?.subjects.length || 0} Course Subjects
                  </h4>
                </div>
                <div className="p-2 bg-success-light text-success-text rounded border border-success/10">
                  <BookOpen className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white ch-card-vibrant">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Assignments Pending</p>
                  <h4 className="text-sm font-bold text-text-primary mt-1">
                    {pendingAssignmentsCount} Tasks Pending
                  </h4>
                </div>
                <div className="p-2 bg-warning-light text-warning-text rounded border border-warning/10">
                  <CheckSquare className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side: Schedule and Assignments checklist */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's schedule */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Today's Schedule Lectures</CardTitle>
                  <CardDescription>Class lecture schedule slots mapped to your section.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timetablesData?.timetables
                    .filter(t => t.classroom === myClassroom?._id)
                    .flatMap(t => t.slots.map(s => ({ day: t.dayOfWeek, ...s })))
                    .map((lecture, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary-light text-primary rounded border border-primary/5 shrink-0">
                            <Clock className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-text-primary">{lecture.subject?.name}</h4>
                            <p className="text-[10px] text-text-secondary mt-1">
                              Instructor: {lecture.faculty?.name} • Day: {lecture.day}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs font-bold text-text-primary">{lecture.time}</p>
                          <span className="text-[10px] text-text-secondary">Room {lecture.room}</span>
                        </div>
                      </div>
                    ))}
                  {(!timetablesData || timetablesData.timetables.length === 0) && (
                    <div className="py-6 text-center text-xs text-text-secondary italic">
                      No lecture schedule registered for this section.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Tasks Pending */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Course Assignments Checklist</CardTitle>
                  <CardDescription>Homework submissions ledger.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignmentsData?.assignments.map(as => {
                    const sub = submissionsData?.submissions.find(s => s.assignment?._id === as._id);
                    return (
                      <div key={as._id} className="p-4 border border-border rounded-lg flex items-center justify-between gap-4 bg-slate-50/30">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-text-primary truncate">{as.title}</h4>
                          <p className="text-[10px] text-text-secondary mt-1">
                            Course: {as.subject?.name} • Due Date: {new Date(as.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {sub ? (
                            <Badge variant={sub.status === 'Reviewed' ? 'success' : 'secondary'} className="text-[10px]">
                              {sub.status === 'Reviewed' ? `Graded: ${sub.marks}/${as.maxMarks}` : 'Submitted'}
                            </Badge>
                          ) : (
                            <button
                              onClick={() => setSubmittingAssignment(as)}
                              className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded shadow-subtle hover:bg-primary/90 flex items-center gap-1.5"
                            >
                              <Upload className="h-3 w-3" /> Upload Solution
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(!assignmentsData || assignmentsData.assignments.length === 0) && (
                    <div className="py-6 text-center text-xs text-text-secondary italic">
                      No assignments published for your classroom section.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notices Board */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Notices Board Board</CardTitle>
                <CardDescription>College bulletin bulletins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcementsData?.announcements.map(ann => (
                  <div key={ann._id} className="p-4 border border-border bg-slate-50/50 rounded-lg space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="text-xs font-bold text-text-primary leading-tight">{ann.title}</h4>
                      <Badge variant={ann.priority === 'high' ? 'danger' : 'secondary'} className="text-[8px] py-0 px-1">
                        {ann.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{ann.message}</p>
                    <span className="text-[9px] text-text-secondary font-semibold block pt-1">
                      Posted: {new Date(ann.publishDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {(!announcementsData || announcementsData.announcements.length === 0) && (
                  <div className="py-8 text-center text-xs text-text-secondary italic">
                    Notice board is empty.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div >
      )
      }

      {/* Classroom view */}
      {
        view === 'classroom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <Card className="md:col-span-2 bg-white">
              <CardHeader>
                <CardTitle>My Classroom Details</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                  <div>
                    <span className="font-semibold text-text-secondary">Class Name</span>
                    <p className="font-bold text-text-primary mt-0.5">{myClassroom?.className || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-text-secondary">Semester & Section</span>
                    <p className="font-bold text-text-primary mt-0.5">{myClassroom ? `${myClassroom.semester} (Sec ${myClassroom.section})` : 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                  <div>
                    <span className="font-semibold text-text-secondary">Academic Year</span>
                    <p className="font-bold text-text-primary mt-0.5">{myClassroom?.academicYear || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-text-secondary">Department</span>
                    <p className="font-bold text-text-primary mt-0.5">{myClassroom?.department?.name || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-text-secondary">Advisor Faculty</span>
                  <p className="font-bold text-primary text-sm mt-1">{myClassroom?.faculty?.name || 'Unassigned Advisor'}</p>
                  <span className="text-[10px] text-text-secondary block">{myClassroom?.faculty?.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Roster of classmate peers */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Enrolled Peers</CardTitle>
                <CardDescription>Classmates enrolled in your division section.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-80 overflow-y-auto">
                <div className="divide-y divide-border/60">
                  {myClassroom?.students.map(st => (
                    <div key={st._id} className="p-3 flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-100 border border-border flex items-center justify-center font-bold text-text-primary text-[10px]">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">{st.name}</h5>
                        <span className="text-[9px] text-text-secondary">{st.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Subjects View */}
      {
        view === 'subjects' && (
          <Card className="bg-white animate-fadeIn">
            <CardHeader>
              <CardTitle>Course Syllabus & Mapped Subjects</CardTitle>
              <CardDescription>View curriculum subjects mapped to your section.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myClassroom?.subjects.map(sub => (
                <div key={sub._id} className="p-4 border border-border rounded-lg bg-slate-50/20">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="primary" className="text-[10px] font-bold">{sub.code}</Badge>
                    <span className="text-xs font-bold text-text-primary">{sub.credits} Credits</span>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary mb-1">{sub.name}</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed">{sub.description || 'Syllabus course outline.'}</p>
                </div>
              ))}
              {(!myClassroom || myClassroom.subjects.length === 0) && (
                <div className="col-span-2 py-8 text-center text-xs text-text-secondary italic">
                  No subjects assigned.
                </div>
              )}
            </CardContent>
          </Card>
        )
      }



      {/* Assignments View */}
      {
        view === 'assignments' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Assignments list */}
            <Card className="md:col-span-2 bg-white">
              <CardHeader>
                <CardTitle>Course Assignments</CardTitle>
                <CardDescription>Track homework task details and submit solution assets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignmentsData?.assignments.map(as => {
                  const sub = submissionsData?.submissions.find(s => s.assignment?._id === as._id);
                  return (
                    <div key={as._id} className="p-4 border border-border rounded-lg bg-slate-50/30 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">{as.title}</h4>
                          <span className="text-[10px] text-text-secondary font-medium block mt-0.5">
                            {as.subject?.name} • Due Date: {new Date(as.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant={sub ? 'success' : 'warning'}>
                          {sub ? sub.status : 'Pending Submission'}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{as.description}</p>

                      {as.attachments.length > 0 && (
                        <div className="flex gap-2 text-[10px] text-primary font-bold">
                          <a href={as.attachments[0]} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            <Download className="h-3 w-3" /> Download Attachment
                          </a>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-border/40 text-[10px]">
                        <span className="font-bold text-primary">Max Score: {as.maxMarks} Marks</span>
                        {!sub ? (
                          <Button size="sm" onClick={() => setSubmittingAssignment(as)}>
                            Submit Homework
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setSubmittingAssignment(as)}>
                            Replace Submission
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!assignmentsData || assignmentsData.assignments.length === 0) && (
                  <div className="py-8 text-center text-xs text-text-secondary italic">
                    No homework assignments published.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submitted answers history and grading feedback */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Graded Feedback Logs</CardTitle>
                <CardDescription>Grades and feedback awarded by lecturers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submissionsData?.submissions.filter(s => s.status === 'Reviewed').map(sub => (
                  <div key={sub._id} className="p-3 border border-border bg-success-light/10 border-success/10 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-text-primary truncate max-w-[140px]">{sub.assignment?.title}</h5>
                      <Badge variant="success">
                        {sub.marks} / {sub.assignment?.maxMarks} Marks
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      <span className="font-bold block text-text-primary mb-0.5">Faculty Feedback:</span>
                      {sub.feedback || 'No comments left.'}
                    </p>
                  </div>
                ))}
                {(!submissionsData || submissionsData.submissions.filter(s => s.status === 'Reviewed').length === 0) && (
                  <div className="py-6 text-center text-xs text-text-secondary italic">
                    No graded submission feedback found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Study Materials Library */}
      {
        view === 'materials' && (
          <Card className="bg-white animate-fadeIn">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Study Materials Library</CardTitle>
                <CardDescription>Search and download lecture note resources shared with your classroom section.</CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 border border-border rounded-md focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-[9px] font-bold text-text-secondary uppercase select-none">
                      <th className="py-3.5 px-4">Document Title</th>
                      <th className="py-3.5 px-4">Subject Course</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">File download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materialsData?.materials
                      .filter(m => m.title.toLowerCase().includes(materialSearch.toLowerCase()))
                      .map(m => (
                        <tr key={m._id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-bold text-text-primary block">{m.title}</span>
                              <span className="text-[10px] text-text-secondary mt-0.5">{m.description || 'No reference context.'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">{m.subject?.name}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant="secondary">{m.category}</Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleMaterialDownload(m._id, m.fileUrl)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-border rounded text-[10px] font-semibold text-text-primary flex items-center gap-1 shadow-subtle select-none"
                            >
                              <Download className="h-3 w-3" /> Download ({m.downloads})
                            </button>
                          </td>
                        </tr>
                      ))}
                    {(!materialsData || materialsData.materials.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-text-secondary italic">
                          No lecture note documents shared.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Question Papers View */}
      {
        view === 'question-papers' && (
          <Card className="bg-white animate-fadeIn">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Previous Question papers sets</CardTitle>
                <CardDescription>Download model question papers and solution booklets.</CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search papers..."
                  value={paperSearch}
                  onChange={(e) => setPaperSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 border border-border rounded-md focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border text-[9px] font-bold text-text-secondary uppercase select-none">
                      <th className="py-3.5 px-4">Paper Booklet</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Academic Year</th>
                      <th className="py-3.5 px-4 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {papersData?.questionPapers
                      .filter(p => p.title.toLowerCase().includes(paperSearch.toLowerCase()))
                      .map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-text-primary">{p.title}</td>
                          <td className="py-3 px-4 text-text-secondary">{p.subject?.name}</td>
                          <td className="py-3 px-4 text-text-secondary font-bold">{p.category}</td>
                          <td className="py-3 px-4 text-text-secondary">{p.academicYear}</td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-border rounded text-[10px] font-semibold text-text-primary shadow-subtle"
                            >
                              <Download className="h-3 w-3" /> Fetch Booklet
                            </a>
                          </td>
                        </tr>
                      ))}
                    {(!papersData || papersData.questionPapers.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-text-secondary italic">
                          No question paper booklets uploaded for your department category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Announcements view */}
      {
        view === 'announcements' && (
          <Card className="bg-white animate-fadeIn animate-duration-300">
            <CardHeader>
              <CardTitle>Bulletin Notice board Board</CardTitle>
              <CardDescription>Official announcements chronologically listed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcementsData?.announcements.map(ann => (
                <div key={ann._id} className="p-4 border border-border bg-slate-50/50 hover:bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-text-primary leading-tight">{ann.title}</h4>
                    <Badge variant={ann.priority === 'high' ? 'danger' : 'secondary'} className="text-[8px] py-0 px-2 select-none font-bold">
                      {ann.priority} Notice
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{ann.message}</p>
                  <div className="flex gap-4 items-center text-[9px] font-semibold text-text-secondary pt-2">
                    <span>Scope: {ann.targetClassroom ? `Classroom Section: ${ann.targetClassroom.className}` : 'Department-Wide Notice'}</span>
                    <span>•</span>
                    <span>Date: {new Date(ann.publishDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!announcementsData || announcementsData.announcements.length === 0) && (
                <div className="py-8 text-center text-xs text-text-secondary italic">
                  No active announcements published.
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Schedule view */}
      {
        view === 'schedule' && (
          <Card className="bg-white animate-fadeIn">
            <CardHeader>
              <CardTitle>Timetable schedule</CardTitle>
              <CardDescription>Timetable slots mapped to your section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                const daySlots = timetablesData?.timetables
                  .filter(t => t.classroom === myClassroom?._id)
                  .flatMap(t => t.slots.map(s => ({ day: t.dayOfWeek, ...s })))
                  .filter(s => s.day === day) || [];

                return (
                  <div key={day} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                    <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide mb-2.5">{day}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {daySlots.map((slot, idx) => (
                        <div key={idx} className="p-3 border border-border rounded bg-slate-50/50">
                          <span className="text-[9px] font-bold text-primary tracking-wider uppercase block mb-1">{slot.time}</span>
                          <h5 className="text-xs font-bold text-text-primary leading-snug">{slot.subject?.name}</h5>
                          <div className="flex gap-2 text-[10px] text-text-secondary mt-2">
                            <span>Instructor: {slot.faculty?.name}</span>
                            <span>•</span>
                            <span>Room {slot.room}</span>
                          </div>
                        </div>
                      ))}
                      {daySlots.length === 0 && (
                        <span className="text-[10px] text-text-secondary italic block pt-1">No lectures scheduled.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )
      }

      {/* Profile view */}
      {
        view === 'profile' && (
          <Card className="bg-white animate-fadeIn">
            <CardHeader>
              <CardTitle>Student Profile Details</CardTitle>
              <CardDescription>Permanent institutional credentials.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-4 max-w-lg">
              <div className="flex gap-4 items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary text-xl border border-primary/10 select-none">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-base text-text-primary">{user?.name}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Register Number</span>
                <span className="col-span-2 font-bold text-text-primary">
                  REG-{user?._id.substring(user?._id.length - 6).toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Department Mapped</span>
                <span className="col-span-2 font-medium text-text-primary">{user?.department?.name || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Semester & Section</span>
                <span className="col-span-2 font-medium text-text-primary">
                  {myClassroom ? `${myClassroom.semester} (Sec ${myClassroom.section})` : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Classroom Section</span>
                <span className="col-span-2 font-medium text-text-primary">{myClassroom ? myClassroom.className : 'Unassigned'}</span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Contact Phone</span>
                <span className="col-span-2 font-medium text-text-primary">{user?.phone || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Advisor Faculty</span>
                <span className="col-span-2 font-medium text-text-primary">{myClassroom?.faculty?.name || 'Unassigned'}</span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Guardian Contact</span>
                <span className="col-span-2 font-medium text-text-primary">Guardian / Parent: N/A</span>
              </div>

              <div className="grid grid-cols-3 py-2 border-b border-border/40">
                <span className="font-semibold text-text-secondary">Admission Year</span>
                <span className="col-span-2 font-medium text-text-primary">{myClassroom?.academicYear || '2026'}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-border rounded flex gap-2.5 items-start mt-6 text-text-secondary leading-snug">
                <AlertCircle className="h-4.5 w-4.5 text-text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-text-primary">Restricted Fields Alert</p>
                  <span>To modify restricted fields (Register Number, Class, Department, etc.), contact the registrar or platform administrator office.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Profile view mapping as alternative settings */}
      {
        view === 'settings' && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Portal Settings</CardTitle>
              <CardDescription>Configure notifications and credentials configuration.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary italic">
              Default security settings active. To change password, consult the admin dashboard password reset.
            </CardContent>
          </Card>
        )
      }

      {/* ==========================================
          SUBMIT ASSIGNMENT MODAL
          ========================================== */}
      {
        submittingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <Card className="w-full max-w-md bg-white border border-border shadow-dropdown p-2 animate-fadeIn relative">
              <button onClick={() => { setSubmittingAssignment(null); setSubmissionFile(''); }} className="absolute right-4 top-4 text-text-secondary hover:text-text-primary">
                <X className="h-4.5 w-4.5" />
              </button>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle>Submit Course Assignment</CardTitle>
                <CardDescription>Upload solution assets for task "{submittingAssignment.title}".</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmissionSubmit} className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-border rounded text-xs leading-relaxed space-y-1 text-text-secondary">
                    <p className="font-bold text-text-primary">Guidelines Description:</p>
                    <span>{submittingAssignment.description}</span>
                    <span className="font-bold text-primary block mt-2">Due Date: {new Date(submittingAssignment.dueDate).toLocaleString()}</span>
                  </div>
                  <Input
                    id="sub-url"
                    type="text"
                    label="Asset File link (URL)"
                    placeholder="e.g. http://my-solution.org/bst.zip"
                    required
                    value={submissionFile}
                    onChange={(e) => setSubmissionFile(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setSubmittingAssignment(null); setSubmissionFile(''); }}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Submit Solution
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )
      }
    </div >
  );
};
