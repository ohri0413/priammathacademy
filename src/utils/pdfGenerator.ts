import { jsPDF } from 'jspdf';
import { Student, AssignmentRecord, AcademySettings, MonthlyAchievementSummary } from '../types';

export const calculateMonthlySummary = (
  student: Student,
  assignments: AssignmentRecord[],
  yearMonth: string // YYYY-MM
): {
  summary: MonthlyAchievementSummary;
  records: AssignmentRecord[];
} => {
  const safeStudent = {
    id: student?.id || '',
    name: student?.name || '학생',
    school: student?.school || '미지정',
    grade: student?.grade || '중2'
  };

  const monthRecords = (assignments || []).filter(
    (a) => a && a.studentId === safeStudent.id && typeof a.date === 'string' && a.date.startsWith(yearMonth)
  ).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  const totalClasses = monthRecords.length;
  const absentClasses = monthRecords.filter((a) => a.isAbsent).length;
  const attendedClasses = totalClasses - absentClasses;
  const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

  // Assignment stats (excluding absent sessions)
  const assignedRecords = monthRecords.filter((a) => !a.isAbsent);
  const totalAssignments = assignedRecords.length;
  const completedAssignments = assignedRecords.filter((a) => a.status === 'completed').length;
  const partialAssignments = assignedRecords.filter((a) => a.status === 'partial').length;
  const incompleteAssignments = assignedRecords.filter((a) => a.status === 'incomplete').length;

  const scoreSum = assignedRecords.reduce((acc, curr) => acc + (curr.achievementScore || 0), 0);
  const averageScore = totalAssignments > 0 ? Math.round(scoreSum / totalAssignments) : 0;

  const assignmentCompletionRate = totalAssignments > 0
    ? Math.round(((completedAssignments + partialAssignments * 0.5) / totalAssignments) * 100)
    : 100;

  // Build a summary teacher comment
  let defaultComment = '';
  if (assignmentCompletionRate >= 90) {
    defaultComment = `${safeStudent.name} 학생은 이번 달 성실하게 모든 수학 과제를 완수하며 높은 학업 성취도를 보였습니다. 꾸준한 수학 학습 태도를 계속 격려해 주세요.`;
  } else if (assignmentCompletionRate >= 70) {
    defaultComment = `대체로 수학 과제 수행이 양호하였으나, 일부 고난도 문항 오답 정리 및 취약 유형 복습에 조금 더 집중이 필요합니다. 원에서도 지속적으로 1:1 클리닉을 진행하겠습니다.`;
  } else {
    defaultComment = `수학 과제 미제출 및 개념 보충이 필요한 단원이 있어 개별 클리닉을 병행하고 있습니다. 가정에서도 수학 과제 점검을 함께 확인해 주시길 부탁드립니다.`;
  }

  return {
    summary: {
      studentId: safeStudent.id,
      studentName: safeStudent.name,
      school: safeStudent.school,
      grade: safeStudent.grade,
      yearMonth,
      totalClasses,
      attendedClasses,
      absentClasses,
      attendanceRate,
      totalAssignments,
      completedAssignments,
      partialAssignments,
      incompleteAssignments,
      assignmentCompletionRate,
      averageScore,
      teacherComment: defaultComment
    },
    records: monthRecords
  };
};

export const exportMonthlyReportToPdf = (
  student: Student,
  summary: MonthlyAchievementSummary,
  records: AssignmentRecord[],
  settings: AcademySettings
) => {
  const doc = new jsPDF();

  const [year, month] = summary.yearMonth.split('-');

  // Header banner
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`${settings.academyName} - Monthly Achievement Report`, 14, 18);

  // Student Info Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(`Report Period: ${year} / ${month}`, 14, 38);
  doc.text(`Student: ${student.name} (${student.school} / ${student.grade})`, 14, 46);
  doc.text(`Teacher: ${student.regularTeacher}`, 14, 54);
  doc.text(`Exam Teacher: ${student.examTeacher}`, 14, 62);
  doc.text(`Parent Contact: ${student.parentPhone}`, 120, 46);
  doc.text(`Class Days: ${student.classDays.join(', ')}`, 120, 54);

  // Summary Metrics Table Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 70, 182, 38, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Sessions: ${summary.totalClasses}`, 22, 80);
  doc.text(`Attended: ${summary.attendedClasses} | Absent: ${summary.absentClasses}`, 22, 88);
  doc.text(`Attendance Rate: ${summary.attendanceRate}%`, 22, 96);

  doc.text(`Assignments: ${summary.totalAssignments}`, 105, 80);
  doc.text(`Completed: ${summary.completedAssignments} | Incomplete: ${summary.incompleteAssignments}`, 105, 88);
  doc.text(`Completion Rate: ${summary.assignmentCompletionRate}% (Avg Score: ${summary.averageScore} pts)`, 105, 96);

  // Teacher comment box
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, 116, 182, 32, 2, 2, 'FD');

  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.text(`[Teacher's Monthly Assessment]`, 20, 126);
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  const splitComment = doc.splitTextToSize(summary.teacherComment, 170);
  doc.text(splitComment, 20, 134);

  // Records Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, 156, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Date', 18, 161);
  doc.text('Mode', 42, 161);
  doc.text('Textbook / Assignment', 65, 161);
  doc.text('Status', 140, 161);
  doc.text('Score', 175, 161);

  // Records Table Rows
  let y = 170;
  records.slice(0, 10).forEach((rec) => {
    doc.setTextColor(30, 41, 59);
    doc.text(`${rec.date} (${rec.dayOfWeek})`, 18, y);
    doc.text(rec.mode === 'exam' ? 'Exam Prep' : 'Regular', 42, y);
    const titleSnippet = (rec.bookTitle ? `${rec.bookTitle} ` : '') + (rec.pageRange || '');
    doc.text(doc.splitTextToSize(titleSnippet || rec.content || '-', 70)[0] || '-', 65, y);
    doc.text(rec.isAbsent ? 'ABSENT' : rec.status.toUpperCase(), 140, y);
    doc.text(rec.isAbsent ? '-' : `${rec.achievementScore || 0} pts`, 175, y);
    y += 8;
  });

  if (records.length > 10) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`... and ${records.length - 10} more records in this month`, 18, y + 2);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued by ${settings.academyName} (${settings.academyPhone}) | Generated on ${new Date().toLocaleDateString()}`, 14, 285);

  doc.save(`${student.name}_${summary.yearMonth}_성취도리포트.pdf`);
};
