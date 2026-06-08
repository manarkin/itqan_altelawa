import { Session, SessionStudent } from '../../types';

export interface AssignerConstraints {
  maxStudentsPerSession: number;
  minStudentsPerSession: number;
  preferTwoCommonTimeslots: boolean;
  allowOnlineFallback: boolean;
  teachersCanTeachMultiple: boolean;
}

export interface TeacherAvailability {
  [timeSlotKey: string]: {
    available: boolean;
    preferredFormat: 'online' | 'in-person' | 'both';
  };
}

export interface StudentAvailability {
  [timeSlotKey: string]: boolean;
}

export interface AlgStudent {
  id: string; // studentId or email as fallback
  firstName: string;
  lastName: string;
  fullName: string;
  studentType: 'undergrad' | 'postgrad';
  preferredFormat: 'in-person' | 'online' | 'flexible';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN' | 'UNCLASSIFIED';
  phone: string;
  email: string;
  college: string;
  cohort: string;
  timings: StudentAvailability;
}

export interface AlgTeacher {
  id: string; // employeeId or email as fallback
  firstName: string;
  lastName: string;
  fullName: string;
  isFirstTimeTeacher: boolean;
  teachingStatus: 'first_time' | 'iqraa' | 'certified';
  currentTeachingLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  teachingGoal: string;
  maxSessionsPerWeek: number;
  assignedSessionsCount: number;
  availability: TeacherAvailability;
  phone: string;
  email: string;
  avatar: string;
}

export interface ProposedSession {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN';
  teacher: {
    id: string;
    name: string;
    phone: string;
    avatar: string;
  };
  location: string;
  time: string; // e.g. "Sunday & Tuesday | 4:15-5:30"
  timeSlots: string[]; // list of exact timeslot keys, e.g. ["Sunday_4:15-5:30", "Tuesday_4:15-5:30"]
  students: SessionStudent[];
  maxStudents: number;
  format: 'online' | 'person' | 'hybrid';
  confidenceScore: number;
  conflicts: string[];
}

export interface AssignmentResult {
  proposedSessions: ProposedSession[];
  unmatchedStudents: AlgStudent[];
  logs: string[];
  statistics: {
    totalStudents: number;
    assignedStudents: number;
    utilizationRate: number; // %
    matchingRate: number; // %
    sessionsCreated: number;
    teachersUtilizedCount: number;
    inPersonCount: number;
    onlineCount: number;
    hybridCount: number;
    averageConfidence: number;
  };
}

// Map Arabic classifications to English levels for the algorithm
export function normalizeLevel(levelStr: string): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN' | 'UNCLASSIFIED' {
  const norm = (levelStr || '').toUpperCase();
  if (norm.includes('مبتد')) return 'BEGINNER';
  if (norm.includes('تمهيد') || norm.includes('متوسط')) return 'INTERMEDIATE';
  if (norm.includes('متقدم')) return 'ADVANCED';
  if (norm.includes('تمكين') || norm.includes('TAMKEEN')) return 'TAMKEEN';
  if (norm.includes('BEGINNER')) return 'BEGINNER';
  if (norm.includes('INTERMEDIATE')) return 'INTERMEDIATE';
  if (norm.includes('ADVANCED')) return 'ADVANCED';
  if (norm.includes('TAMKEEN')) return 'TAMKEEN';
  return 'UNCLASSIFIED';
}

export function assignSessions(
  allPendingStudents: AlgStudent[],
  availableTeachers: AlgTeacher[],
  constraints: AssignerConstraints,
  lang: 'ar' | 'en'
): AssignmentResult {
  const logs: string[] = [];
  const startTimer = Date.now();
  
  const isEn = lang === 'en';
  const isAr = lang === 'ar';
  const logPrefix = (enText: string, arText: string) => isEn ? enText : arText;

  logs.push(logPrefix(
    `[System] Initializing session assignment engine...`,
    `[النظام] بدء تشغيل محرك التوزيع الآلي للحلقات...`
  ));

  // Step 1: Data Preparation & Filter approvals and check capacity
  const students = [...allPendingStudents];
  const teachers = availableTeachers.map(t => ({ ...t, assignedSessionsCount: 0 }));

  logs.push(logPrefix(
    `Phase 1: Analyzing input parameters & constraint matrices`,
    `الترتيب الأول: تحليل معطيات المدخلات ومصفوفة القيود`
  ));
  logs.push(logPrefix(
    `├─ Students pending placement: ${students.length}`,
    `├─ عدد الطالبات المسجلات بانتظار التوزيع: ${students.length}`
  ));
  logs.push(logPrefix(
    `├─ Active volunteer teachers: ${teachers.length}`,
    `├─ عدد المعلمات المتطوعات المتاحات: ${teachers.length}`
  ));
  logs.push(logPrefix(
    `└─ Target constraints config: Max students per session = ${constraints.maxStudentsPerSession}, Prefer 2 common slots = ${constraints.preferTwoCommonTimeslots ? 'Yes' : 'No'}`,
    `└─ تكوين القيود المعتمد: الحد الأقصى للمقاعد = ${constraints.maxStudentsPerSession} طالباً، تفضيل حصتين مشتركتين = ${constraints.preferTwoCommonTimeslots ? 'نعم' : 'لا'}`
  ));

  const proposedSessions: ProposedSession[] = [];
  const assignedStudentIds = new Set<string>();
  const teacherWorkload: Record<string, number> = {};

  // Track availability of teachers per timeslot
  const getTeacherWorkloadCount = (teacherId: string) => {
    return teacherWorkload[teacherId] || 0;
  };

  const incrementTeacherWorkload = (teacherId: string) => {
    teacherWorkload[teacherId] = (teacherWorkload[teacherId] || 0) + 1;
  };

  // Level compliance check
  const teacherCanTeachLevel = (teacher: AlgTeacher, studentLevel: string) => {
    const status = teacher.teachingStatus; // 'first_time', 'iqraa', 'certified'
    const lvl = normalizeLevel(studentLevel);

    // RULE 1: First-time teachers teach BEGINNER only
    if (status === 'first_time') {
      return lvl === 'BEGINNER';
    }
    // RULE 2: Iqraa teachers can teach beginner & intermediate
    if (status === 'iqraa') {
      return lvl === 'BEGINNER' || lvl === 'INTERMEDIATE';
    }
    // RULE 3: Certified teachers can teach any level (advanced and tamkeen preferred)
    if (status === 'certified') {
      return true;
    }
    return false;
  };

  // Helper to extract mutual timeslots for a group of students
  const findCommonTimeslots = (studentGroup: AlgStudent[], minSlotsRequired: number): string[] => {
    const timeslotsCount: Record<string, number> = {};
    studentGroup.forEach(student => {
      Object.entries(student.timings).forEach(([slot, isAvailable]) => {
        if (isAvailable) {
          timeslotsCount[slot] = (timeslotsCount[slot] || 0) + 1;
        }
      });
    });

    // Filter slots shared by ALL/MOST students in the group
    const threshold = Math.max(minSlotsRequired, Math.ceil(studentGroup.length * 0.7)); // At least 70% of students share it
    return Object.entries(timeslotsCount)
      .filter(([_, count]) => count >= threshold)
      .map(([slot, _]) => slot)
      .sort();
  };

  // Helper to score teacher eligibility for group
  const scoreTeacherForGroup = (
    teacher: AlgTeacher,
    commonSlots: string[],
    level: string,
    studentGroup: AlgStudent[]
  ): { score: number; chosenSlotKeys: string[] } => {
    let score = 0.5; // Base score
    const chosenSlotKeys: string[] = [];

    // Find slots in commonSlots where teacher is available
    const availableSlots = commonSlots.filter(slot => teacher.availability[slot]?.available);
    if (availableSlots.length === 0) {
      return { score: 0, chosenSlotKeys: [] };
    }

    // Assign slots up to 2 (as semesters prefer 2 sessions per week)
    const requiredSlotsCount = constraints.preferTwoCommonTimeslots ? 2 : 1;
    const selectedSlots = availableSlots.slice(0, requiredSlotsCount);
    selectedSlots.forEach(s => chosenSlotKeys.push(s));

    // Bonus for matching multiple slots
    if (selectedSlots.length >= 2) {
      score += 0.25;
    } else if (constraints.preferTwoCommonTimeslots) {
      score -= 0.15; // penalty if we prefer 2 slots but teacher can only do 1
    }

    // Format compatibility check
    let formatMatchesCount = 0;
    selectedSlots.forEach(slot => {
      const teacherPref = teacher.availability[slot]?.preferredFormat || 'both';
      const studentFormatPrefs = studentGroup.map(s => s.preferredFormat);
      
      const containsUndergrass = studentGroup.some(s => s.studentType === 'undergrad');
      const resolvedGroupPref = containsUndergrass ? 'in-person' : 'online';

      if (teacherPref === 'both' || teacherPref === resolvedGroupPref) {
        formatMatchesCount++;
      }
    });

    score += (formatMatchesCount / selectedSlots.length) * 0.15;

    // Bonus for teacher status according to level
    const normLvl = normalizeLevel(level);
    if (normLvl === 'ADVANCED' || normLvl === 'TAMKEEN') {
      if (teacher.teachingStatus === 'certified') {
        score += 0.2; // Extra bonus for certified teacher on advanced students
      }
    } else if (normLvl === 'INTERMEDIATE') {
      if (teacher.teachingStatus === 'iqraa') {
        score += 0.15; // perfect fit intermediate
      }
    } else if (normLvl === 'BEGINNER') {
      if (teacher.isFirstTimeTeacher || teacher.teachingStatus === 'first_time') {
        score += 0.15; // support freshman teachers
      }
    }

    // Workload balancing penalty
    const workload = getTeacherWorkloadCount(teacher.id);
    if (workload > 0) {
      score -= workload * 0.15;
    }

    return { score: Math.max(0, Math.min(score, 1.0)), chosenSlotKeys };
  };

  // Grouping phases
  logs.push(logPrefix(
    `Phase 2: Grouping students based on level and common timetable matches`,
    `الترتيب الثاني: دمج الطالبات في مجموعات متوافقة حسب المستوى والتوقيت المشترك`
  ));

  // Group students by level first so we avoid mixed level sessions
  const studentsByLevel: Record<string, AlgStudent[]> = {
    'BEGINNER': [],
    'INTERMEDIATE': [],
    'ADVANCED': [],
    'TAMKEEN': [],
    'UNCLASSIFIED': []
  };

  students.forEach(student => {
    const lvl = normalizeLevel(student.level);
    studentsByLevel[lvl].push(student);
  });

  // Cycle through levels from Advanced down to Beginner
  const levelsOrder: ('ADVANCED' | 'TAMKEEN' | 'INTERMEDIATE' | 'BEGINNER' | 'UNCLASSIFIED')[] = [
    'ADVANCED', 'TAMKEEN', 'INTERMEDIATE', 'BEGINNER', 'UNCLASSIFIED'
  ];

  let sessionCounter = 1;

  levelsOrder.forEach(lvl => {
    const levelStudents = studentsByLevel[lvl].filter(s => !assignedStudentIds.has(s.id));
    if (levelStudents.length === 0) return;

    logs.push(logPrefix(
      `├─ Structuring level [${lvl}]: total candidates = ${levelStudents.length}`,
      `├─ معالجة مستخدمات المستوى [${lvl}]: المرشحات الأوليّات = ${levelStudents.length}`
    ));

    // Greedy grouping based on timing overlaps
    let remainingStudentsInLvl = [...levelStudents];

    while (remainingStudentsInLvl.length >= constraints.minStudentsPerSession) {
      let bestCluster: AlgStudent[] = [];
      let bestCommonSlots: string[] = [];
      let maxClusterScore = -1;

      // Seed clusters with each student and find their overlapping pairs
      for (let i = 0; i < remainingStudentsInLvl.length; i++) {
        const seedStudent = remainingStudentsInLvl[i];
        const seedTimes = Object.keys(seedStudent.timings).filter(t => seedStudent.timings[t]);

        // Find matches
        const overlappingStudents = remainingStudentsInLvl.filter(other => {
          if (other.id === seedStudent.id) return false;
          const otherTimes = Object.keys(other.timings).filter(t => other.timings[t]);
          const intersection = seedTimes.filter(t => otherTimes.includes(t));
          // Check if they share at least 1 or 2 slots based on settings
          return intersection.length >= (constraints.preferTwoCommonTimeslots ? 2 : 1);
        });

        // If we have enough overlapping students to make a viable group
        if (overlappingStudents.length >= constraints.minStudentsPerSession - 1) {
          // Select subset that fits the max capacity
          const candidateGroup = [seedStudent, ...overlappingStudents].slice(0, constraints.maxStudentsPerSession);
          const common = findCommonTimeslots(candidateGroup, constraints.preferTwoCommonTimeslots ? 2 : 1);

          if (common.length >= (constraints.preferTwoCommonTimeslots ? 2 : 1)) {
            const sizeScore = candidateGroup.length / constraints.maxStudentsPerSession;
            const timingScore = common.length / 7; // relative to active slots per day
            const clusterWeight = sizeScore * 0.7 + timingScore * 0.3;

            if (clusterWeight > maxClusterScore) {
              maxClusterScore = clusterWeight;
              bestCluster = candidateGroup;
              bestCommonSlots = common;
            }
          }
        }
      }

      // If no good overlapping group was found within 2-common times, check 1-common if allowed, or pick first matching
      if (bestCluster.length < constraints.minStudentsPerSession) {
        // Fallback to cluster the first available unassigned student with anyone sharing at least 1 slot
        const seedStudent = remainingStudentsInLvl[0];
        const seedTimes = Object.keys(seedStudent.timings).filter(t => seedStudent.timings[t]);
        const overlappingStudents = remainingStudentsInLvl.filter(other => {
          if (other.id === seedStudent.id) return false;
          const otherTimes = Object.keys(other.timings).filter(t => other.timings[t]);
          const intersection = seedTimes.filter(t => otherTimes.includes(t));
          return intersection.length >= 1;
        });

        if (overlappingStudents.length >= constraints.minStudentsPerSession - 1) {
          bestCluster = [seedStudent, ...overlappingStudents].slice(0, constraints.maxStudentsPerSession);
          bestCommonSlots = findCommonTimeslots(bestCluster, 1);
        } else {
          // Single-timeslot or isolated students, break the loop and they will go to unmatched
          break;
        }
      }

      // Now we have a candidate cluster. Find the best eligible teacher for it.
      let bestTeacher: AlgTeacher | null = null;
      let highestTeacherScore = -1;
      let finalSlotKeys: string[] = [];

      const eligibleTeachers = teachers.filter(t => {
        // Check workload limits
        const sessionCount = getTeacherWorkloadCount(t.id);
        if (sessionCount >= t.maxSessionsPerWeek && !constraints.teachersCanTeachMultiple) {
          return false;
        }
        return teacherCanTeachLevel(t, lvl);
      });

      eligibleTeachers.forEach(t => {
        const { score, chosenSlotKeys } = scoreTeacherForGroup(t, bestCommonSlots, lvl, bestCluster);
        if (score > highestTeacherScore && chosenSlotKeys.length > 0) {
          highestTeacherScore = score;
          bestTeacher = t;
          finalSlotKeys = chosenSlotKeys;
        }
      });

      if (bestTeacher) {
        // Successful pairing! Create proposed session
        const finalTeacher: AlgTeacher = bestTeacher;
        incrementTeacherWorkload(finalTeacher.id);
        finalTeacher.assignedSessionsCount = getTeacherWorkloadCount(finalTeacher.id);

        // Resolve format:
        // Undergrads prefer in-person, postgrads prefer online.
        const containsPostgrads = bestCluster.some(s => s.studentType === 'postgrad');
        const containsUndergrads = bestCluster.some(s => s.studentType === 'undergrad');

        let resolvedFormat: 'online' | 'person' | 'hybrid' = 'person';
        if (containsPostgrads && containsUndergrads) {
          resolvedFormat = 'hybrid';
        } else if (containsPostgrads) {
          resolvedFormat = 'online';
        }

        // Format validation mapping to teacher capacity
        const teacherPrefFormat = finalTeacher.availability[finalSlotKeys[0]]?.preferredFormat || 'both';
        if (teacherPrefFormat === 'online' && resolvedFormat === 'person') {
          resolvedFormat = constraints.allowOnlineFallback ? 'online' : 'hybrid';
        } else if (teacherPrefFormat === 'in-person' && resolvedFormat === 'online') {
          resolvedFormat = 'person'; // push to in-person
        }

        // Format names to presentable SQU style
        const arabicDayMap: Record<string, string> = {
          'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء',
          'Wednesday': 'الأربعاء', 'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت'
        };

        const timeString = finalSlotKeys.map(key => {
          const parts = key.split('_');
          const day = parts[0];
          const time = parts[1] || '';
          return `${isAr ? arabicDayMap[day] || day : day} | ${time}`;
        }).join(isAr ? ' و ' : ' & ');

        const arabicLvlMap: Record<string, string> = {
          'BEGINNER': 'حلقة الترتيل للمبتدئين',
          'INTERMEDIATE': 'حلقة الإتقان التمهيدية',
          'ADVANCED': 'حلقة الفوقية المتقدمة',
          'TAMKEEN': 'حلقة الإقراء والتمكين'
        };

        const sName = isAr 
          ? `${arabicLvlMap[lvl] || 'حلقة التلاوة المخصصة'} (${sessionCounter})`
          : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Tajweed Circle (${sessionCounter})`;

        // Build potential warnings list
        const conflicts: string[] = [];
        if (bestCluster.length < 4) {
          conflicts.push(isAr ? 'حضور منخفض (أقل من ٤ طالبات)' : 'Low density enrollment (under 4 reciters)');
        }
        if (resolvedFormat === 'person' && containsPostgrads) {
          conflicts.push(isAr ? 'طالبات دراسات عليا ضمن حلقة حضورية' : 'Postgraduate student assigned to direct in-person slot');
        }
        if (finalSlotKeys.length < 2 && constraints.preferTwoCommonTimeslots) {
          conflicts.push(isAr ? 'حلقة بحصة أسبوعية واحدة فقط (المطلوب حصتين)' : 'Session has only 1 weekly slot allocated (Target is 2)');
        }
        if (finalTeacher.teachingStatus === 'first_time' && lvl !== 'BEGINNER') {
          conflicts.push(isAr ? 'معلمة لأول مرة تدرس مستوى غير مبتدئ' : 'Freshman teacher assigned to teach higher levels');
        }

        const sessionStudents: SessionStudent[] = bestCluster.map((s, cIdx) => ({
          id: s.id,
          name: s.fullName,
          money: 0,
          avatar: `https://picsum.photos/seed/std_as_${s.id}/100/100`,
          absencesExcused: 0,
          absencesUnexcused: 0,
          email: s.email,
          phone: s.phone,
          college: s.college,
          cohort: s.cohort
        }));

        proposedSessions.push({
          id: `as_gen_${sessionCounter}`,
          name: sName,
          level: lvl === 'UNCLASSIFIED' ? 'BEGINNER' : lvl,
          teacher: {
            id: finalTeacher.id,
            name: finalTeacher.fullName,
            phone: finalTeacher.phone,
            avatar: finalTeacher.avatar
          },
          location: resolvedFormat === 'online' 
            ? (isAr ? 'عبر الأثير - مايكروسوفت تيمز' : 'Online MS Teams Rooms') 
            : (isAr ? 'مسجد الجامعة - قاعة الأنشطة' : 'SQU Campus Mosque - Hall B'),
          time: timeString,
          timeSlots: finalSlotKeys,
          students: sessionStudents,
          maxStudents: constraints.maxStudentsPerSession,
          format: resolvedFormat,
          confidenceScore: parseFloat(highestTeacherScore.toFixed(2)),
          conflicts
        });

        logs.push(logPrefix(
          `  ✓ Paired: [${sName}] assigned to Teacher [${finalTeacher.fullName}] with ${bestCluster.length} students. (Matches: ${finalSlotKeys.join(', ')})`,
          `  ✓ تم الربط: [${sName}] أسندت للمعلمة [${finalTeacher.fullName}] وتضم ${bestCluster.length} طالبات. (التوافق: ${finalSlotKeys.join(', ')})`
        ));

        // Mark assigned students
        bestCluster.forEach(s => assignedStudentIds.add(s.id));
        
        // Remove paired ones from local iteration pool
        const pairedIds = bestCluster.map(s => s.id);
        remainingStudentsInLvl = remainingStudentsInLvl.filter(s => !pairedIds.includes(s.id));
        sessionCounter++;
      } else {
        // No suitable teacher for this cluster, skip current seed student and try next cluster
        logs.push(logPrefix(
          `  ⚠️ Caution: No free eligible teacher verified for students at level ${lvl} sharing timeslots: ${bestCommonSlots.join(', ')}`,
          `  ⚠️ تنبيه: لم يتم العثور على معلمة متفرغة مؤهلة لمستوى ${lvl} تشترك في توقيت: ${bestCommonSlots.join(', ')}`
        ));
        // Move seed student to end to avoid search deadlock
        const skipped = remainingStudentsInLvl.shift();
        if (skipped) remainingStudentsInLvl.push(skipped);
      }
    }
  });

  const unmatchedStudents = students.filter(s => !assignedStudentIds.has(s.id));

  logs.push(logPrefix(
    `Phase 3: Assignment optimization complete in ${Date.now() - startTimer}ms. Checking unresolved fallbacks...`,
    `الترتيب الثالث: تم الانتهاء من التوزيع الذكي بنجاح في ${Date.now() - startTimer} ملّي ثانية. معالجة الحالات العالقة...`
  ));

  if (unmatchedStudents.length > 0) {
    logs.push(logPrefix(
      `├─ Note: ${unmatchedStudents.length} students remain unassigned due to strict scheduling conflicts.`,
      `├─ رصد: بقيت ${unmatchedStudents.length} طالبة خارج التوزيع بسبب عدم توفر فترات زمنية مشتركة مع معلمات متاحين.`
    ));
  } else {
    logs.push(logPrefix(
      `└─ Excellent: 100% of registrations matched effectively!`,
      `└─ نجاح: تم دمج ١٠٠٪ من المسجلات في الفرق المناسبة بنجاح!`
    ));
  }

  // Calculate statistics
  const totalAssignedCount = students.length - unmatchedStudents.length;
  const matchRate = students.length > 0 ? (totalAssignedCount / students.length) * 100 : 0;
  const utilizedTeachers = teachers.filter(t => getTeacherWorkloadCount(t.id) > 0);
  const totalConfidence = proposedSessions.reduce((acc, s) => acc + s.confidenceScore, 0);
  const averageConfidence = proposedSessions.length > 0 ? (totalConfidence / proposedSessions.length) : 0;

  const inPersonCount = proposedSessions.filter(s => s.format === 'person').length;
  const onlineCount = proposedSessions.filter(s => s.format === 'online').length;
  const hybridCount = proposedSessions.filter(s => s.format === 'hybrid').length;

  return {
    proposedSessions,
    unmatchedStudents,
    logs,
    statistics: {
      totalStudents: students.length,
      assignedStudents: totalAssignedCount,
      utilizationRate: parseFloat(((utilizedTeachers.length / teachers.length) * 100).toFixed(1)) || 0,
      matchingRate: parseFloat(matchRate.toFixed(1)),
      sessionsCreated: proposedSessions.length,
      teachersUtilizedCount: utilizedTeachers.length,
      inPersonCount,
      onlineCount,
      hybridCount,
      averageConfidence: parseFloat(averageConfidence.toFixed(2))
    }
  };
}
