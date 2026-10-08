import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
    grade: student?.grade || '중2',
    regularTeacher: student?.regularTeacher || '최광민 선생님'
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

  // Comprehensive teacher comment
  let defaultComment = '';
  if (attendanceRate === 100 && assignmentCompletionRate >= 95) {
    defaultComment = `${safeStudent.name} 학생은 이번 달 결석 없이 전 수업에 성실히 출석하였으며, 부여된 모든 수학 과제를 100%에 가깝게 완벽히 완수하여 매우 뛰어난 성취도를 보였습니다. 심화 개념 이해도 및 문제 해결력이 탄탄하게 성장하고 있으니, 가정에서도 아낌없는 칭찬과 격려를 부탁드립니다.`;
  } else if (assignmentCompletionRate >= 80) {
    defaultComment = `${safeStudent.name} 학생은 수업 참여도가 매우 우수하며 정규 수학 과제를 성실하게 수행하고 있습니다. 일부 고난도 서술형 문항 및 오답 노트를 꼼꼼히 복습한다면 다음 평가에서 더 큰 도약이 기대됩니다. 원에서도 1:1 맞춤 피드백을 지속하겠습니다.`;
  } else if (assignmentCompletionRate >= 60) {
    defaultComment = `${safeStudent.name} 학생은 수업 태도가 양호하나 일부 단원의 과제 완성도가 다소 미흡한 회차가 있었습니다. 취약 단원 개념을 보강하고 매일 일정 분량씩 꾸준히 과제를 해결할 수 있도록 가정에서도 함께 학습 점검을 격려해 주시기를 권장합니다.`;
  } else {
    defaultComment = `${safeStudent.name} 학생의 과제 미제출 및 복습 부족이 확인되어 개별 클리닉과 보충 학습을 집중 지도하고 있습니다. 기초 연산과 개념 노트를 우선적으로 점검하고 있으니, 학원과 가정이 연계하여 과제 수행 습관을 함께 잡아주시기를 부탁드립니다.`;
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

/**
 * HTML 요소를 고해상도 캔버스로 변환하여 글자 깨짐 없는 한글 완벽 지원 PDF 다운로드
 */
export const exportReportElementToPdf = async (
  element: HTMLElement,
  filename: string
): Promise<boolean> => {
  try {
    // 2x 스케일로 렌더링하여 고해상도 인쇄 품질 보장
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 8; // 8mm margin
    const contentWidth = pageWidth - margin * 2; // 194mm
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    if (contentHeight <= pageHeight - margin * 2) {
      // 1페이지에 딱 맞게 배치
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
    } else {
      // 내용이 길 경우 1페이지 높이에 비례 축소 맞춤하거나 멀티페이지 처리
      const maxPageH = pageHeight - margin * 2;
      if (contentHeight <= maxPageH * 1.3) {
        // 약간 긴 경우 깔끔하게 1페이지에 맞춤
        const scale = maxPageH / contentHeight;
        const fitW = contentWidth * scale;
        const xOffset = margin + (contentWidth - fitW) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, margin, fitW, maxPageH);
      } else {
        // 여러 페이지로 깔끔하게 분할
        let leftHeight = contentHeight;
        let position = 0;
        let page = 0;

        while (leftHeight > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            margin - position,
            contentWidth,
            contentHeight
          );
          leftHeight -= maxPageH;
          position += maxPageH;
          page++;
        }
      }
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to export PDF with html2canvas:', err);
    return false;
  }
};

/**
 * 이전 호환용 exportMonthlyReportToPdf (element가 없을 시 기본 실행)
 */
export const exportMonthlyReportToPdf = async (
  student: Student,
  summary: MonthlyAchievementSummary,
  records: AssignmentRecord[],
  settings: AcademySettings,
  element?: HTMLElement | null
) => {
  const filename = `${summary.yearMonth}_${student.name}_월간학습성취도리포트.pdf`;
  if (element) {
    return await exportReportElementToPdf(element, filename);
  }

  // Fallback: If no DOM element passed, trigger window.print
  window.print();
  return true;
};
