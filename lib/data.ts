export interface Subject {
  id: string;
  name: string;
  semester: number;
  progress: number;
  totalTopics: number;
  completedTopics: number;
  icon: string;
  color: string;
  isBacklog: boolean;
  examDate?: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  date: string;
  duration: number;
  topicsStudied: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'assignment' | 'study' | 'revision';
  subjectId?: string;
  color: string;
}

export const SEMESTERS = [1, 2, 3, 4, 5, 6];

export const SUBJECTS: Subject[] = [
  {
    id: '1', name: 'Data Structures', semester: 3, progress: 0.72, totalTopics: 14, completedTopics: 10,
    icon: 'git-branch-outline', color: '#4A6CF7', isBacklog: false, examDate: '2025-03-15',
    topics: [
      { id: 't1', name: 'Arrays & Strings', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't2', name: 'Linked Lists', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't3', name: 'Stacks & Queues', completed: true, difficulty: 'easy', estimatedHours: 3 },
      { id: 't4', name: 'Trees (Binary, BST)', completed: true, difficulty: 'medium', estimatedHours: 5 },
      { id: 't5', name: 'AVL Trees', completed: true, difficulty: 'hard', estimatedHours: 4 },
      { id: 't6', name: 'Heaps', completed: true, difficulty: 'medium', estimatedHours: 3 },
      { id: 't7', name: 'Hashing', completed: true, difficulty: 'medium', estimatedHours: 3 },
      { id: 't8', name: 'Graphs - BFS/DFS', completed: true, difficulty: 'hard', estimatedHours: 5 },
      { id: 't9', name: 'Shortest Path Algos', completed: true, difficulty: 'hard', estimatedHours: 4 },
      { id: 't10', name: 'Sorting Algorithms', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't11', name: 'Dynamic Programming', completed: false, difficulty: 'hard', estimatedHours: 6 },
      { id: 't12', name: 'Greedy Algorithms', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't13', name: 'Backtracking', completed: false, difficulty: 'hard', estimatedHours: 4 },
      { id: 't14', name: 'Complexity Analysis', completed: false, difficulty: 'easy', estimatedHours: 2 },
    ],
  },
  {
    id: '2', name: 'Database Management', semester: 3, progress: 0.55, totalTopics: 11, completedTopics: 6,
    icon: 'server-outline', color: '#8B5CF6', isBacklog: false, examDate: '2025-03-18',
    topics: [
      { id: 't15', name: 'ER Model', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't16', name: 'Relational Model', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't17', name: 'SQL Basics', completed: true, difficulty: 'easy', estimatedHours: 3 },
      { id: 't18', name: 'Advanced SQL', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't19', name: 'Normalization', completed: true, difficulty: 'hard', estimatedHours: 5 },
      { id: 't20', name: 'Transactions', completed: true, difficulty: 'medium', estimatedHours: 3 },
      { id: 't21', name: 'Concurrency Control', completed: false, difficulty: 'hard', estimatedHours: 4 },
      { id: 't22', name: 'Recovery Systems', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't23', name: 'Indexing & Hashing', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't24', name: 'NoSQL Basics', completed: false, difficulty: 'easy', estimatedHours: 2 },
      { id: 't25', name: 'Query Optimization', completed: false, difficulty: 'hard', estimatedHours: 4 },
    ],
  },
  {
    id: '3', name: 'Operating Systems', semester: 4, progress: 0.38, totalTopics: 12, completedTopics: 4,
    icon: 'desktop-outline', color: '#06B6D4', isBacklog: false, examDate: '2025-03-20',
    topics: [
      { id: 't26', name: 'OS Introduction', completed: true, difficulty: 'easy', estimatedHours: 1 },
      { id: 't27', name: 'Process Management', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't28', name: 'CPU Scheduling', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't29', name: 'Process Synchronization', completed: true, difficulty: 'hard', estimatedHours: 5 },
      { id: 't30', name: 'Deadlocks', completed: false, difficulty: 'hard', estimatedHours: 4 },
      { id: 't31', name: 'Memory Management', completed: false, difficulty: 'hard', estimatedHours: 5 },
      { id: 't32', name: 'Virtual Memory', completed: false, difficulty: 'hard', estimatedHours: 4 },
      { id: 't33', name: 'File Systems', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't34', name: 'I/O Systems', completed: false, difficulty: 'medium', estimatedHours: 2 },
      { id: 't35', name: 'Disk Scheduling', completed: false, difficulty: 'medium', estimatedHours: 2 },
      { id: 't36', name: 'Protection & Security', completed: false, difficulty: 'easy', estimatedHours: 2 },
      { id: 't37', name: 'Linux Commands', completed: false, difficulty: 'easy', estimatedHours: 2 },
    ],
  },
  {
    id: '4', name: 'Computer Networks', semester: 4, progress: 0.25, totalTopics: 10, completedTopics: 2,
    icon: 'globe-outline', color: '#F59E0B', isBacklog: false, examDate: '2025-03-22',
    topics: [
      { id: 't38', name: 'Network Models (OSI/TCP)', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't39', name: 'Physical Layer', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't40', name: 'Data Link Layer', completed: false, difficulty: 'medium', estimatedHours: 4 },
      { id: 't41', name: 'Network Layer', completed: false, difficulty: 'hard', estimatedHours: 5 },
      { id: 't42', name: 'Routing Algorithms', completed: false, difficulty: 'hard', estimatedHours: 4 },
      { id: 't43', name: 'Transport Layer', completed: false, difficulty: 'medium', estimatedHours: 4 },
      { id: 't44', name: 'TCP/UDP', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't45', name: 'Application Layer', completed: false, difficulty: 'easy', estimatedHours: 2 },
      { id: 't46', name: 'Network Security', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't47', name: 'Wireless Networks', completed: false, difficulty: 'easy', estimatedHours: 2 },
    ],
  },
  {
    id: '5', name: 'Mathematics II', semester: 2, progress: 0.15, totalTopics: 8, completedTopics: 1,
    icon: 'calculator-outline', color: '#EF4444', isBacklog: true,
    topics: [
      { id: 't48', name: 'Matrices & Determinants', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't49', name: 'Eigenvalues', completed: false, difficulty: 'hard', estimatedHours: 5 },
      { id: 't50', name: 'Differential Equations', completed: false, difficulty: 'hard', estimatedHours: 6 },
      { id: 't51', name: 'Laplace Transforms', completed: false, difficulty: 'hard', estimatedHours: 5 },
      { id: 't52', name: 'Fourier Series', completed: false, difficulty: 'hard', estimatedHours: 5 },
      { id: 't53', name: 'Probability', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't54', name: 'Statistics', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't55', name: 'Numerical Methods', completed: false, difficulty: 'medium', estimatedHours: 4 },
    ],
  },
  {
    id: '6', name: 'Web Technologies', semester: 3, progress: 0.85, totalTopics: 10, completedTopics: 8,
    icon: 'code-slash-outline', color: '#10B981', isBacklog: false,
    topics: [
      { id: 't56', name: 'HTML5', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't57', name: 'CSS3 & Flexbox', completed: true, difficulty: 'easy', estimatedHours: 3 },
      { id: 't58', name: 'JavaScript Basics', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't59', name: 'DOM Manipulation', completed: true, difficulty: 'medium', estimatedHours: 3 },
      { id: 't60', name: 'React Basics', completed: true, difficulty: 'medium', estimatedHours: 5 },
      { id: 't61', name: 'Node.js & Express', completed: true, difficulty: 'medium', estimatedHours: 4 },
      { id: 't62', name: 'REST APIs', completed: true, difficulty: 'medium', estimatedHours: 3 },
      { id: 't63', name: 'MongoDB', completed: true, difficulty: 'easy', estimatedHours: 2 },
      { id: 't64', name: 'Authentication', completed: false, difficulty: 'medium', estimatedHours: 3 },
      { id: 't65', name: 'Deployment', completed: false, difficulty: 'easy', estimatedHours: 2 },
    ],
  },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'DS Exam', date: '2025-03-15', type: 'exam', subjectId: '1', color: '#EF4444' },
  { id: 'e2', title: 'DBMS Exam', date: '2025-03-18', type: 'exam', subjectId: '2', color: '#EF4444' },
  { id: 'e3', title: 'OS Exam', date: '2025-03-20', type: 'exam', subjectId: '3', color: '#EF4444' },
  { id: 'e4', title: 'CN Exam', date: '2025-03-22', type: 'exam', subjectId: '4', color: '#EF4444' },
  { id: 'e5', title: 'DS Revision', date: '2025-02-10', type: 'revision', subjectId: '1', color: '#4A6CF7' },
  { id: 'e6', title: 'DBMS Assignment', date: '2025-02-12', type: 'assignment', subjectId: '2', color: '#F59E0B' },
  { id: 'e7', title: 'Study: OS Deadlocks', date: '2025-02-14', type: 'study', subjectId: '3', color: '#10B981' },
  { id: 'e8', title: 'Math Backlog Prep', date: '2025-02-16', type: 'study', subjectId: '5', color: '#8B5CF6' },
];

export const STUDY_TIPS = [
  'ðŸ’¡ Focus on understanding concepts, not memorizing answers.',
  'ðŸ§  Use spaced repetition for better retention.',
  'ðŸ“ Practice previous year questions daily.',
  'â° Study in 45-min focused blocks with 10-min breaks.',
  'ðŸŽ¯ Start with your weakest topic each day.',
  'ðŸ“Š Track your progress to stay motivated.',
  'ðŸ¤ Form study groups for difficult subjects.',
  'ðŸ˜´ Get 7-8 hours of sleep before exams.',
];

export const AI_SUGGESTIONS = [
  { id: 'ai1', text: 'You\'re 72% through Data Structures! Focus on Dynamic Programming next - it\'s high-weightage.', type: 'progress' },
  { id: 'ai2', text: 'Mathematics II backlog needs attention. I\'ve created a 4-week recovery plan.', type: 'alert' },
  { id: 'ai3', text: 'Great streak! You\'ve studied 5 days in a row. Keep it up! ðŸ”¥', type: 'motivation' },
  { id: 'ai4', text: 'DS exam in 33 days. You need ~2 hrs/day to cover remaining topics.', type: 'exam' },
];
