import { AssignmentRecord, Student, AcademySettings } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';

export const calculateSmsBytes = (text: string): number => {
  if (!text) return 0;
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // standard EUC-KR / UTF-8 style byte count: Korean & fullwidth = 2 bytes, ASCII = 1 byte
    if (code > 127) {
      bytes += 2;
    } else {
      bytes += 1;
    }
  }
  return bytes;
};

export const generateSmsContent = (
  record?: Partial<AssignmentRecord> | null,
  student?: Partial<Student> | null,
  settings?: Partial<AcademySettings> | null
): string => {
  const safeSettings = {
    academyName: settings?.academyName || INITIAL_SETTINGS.academyName,
    academyPhone: settings?.academyPhone || INITIAL_SETTINGS.academyPhone,
    regularSmsTemplate: settings?.regularSmsTemplate || INITIAL_SETTINGS.regularSmsTemplate,
    examSmsTemplate: settings?.examSmsTemplate || INITIAL_SETTINGS.examSmsTemplate,
    absentSmsTemplate: settings?.absentSmsTemplate || INITIAL_SETTINGS.absentSmsTemplate
  };

  const isAbsent = Boolean(record?.isAbsent);
  const isExam = record?.mode === 'exam';

  let template = safeSettings.regularSmsTemplate;
  if (isAbsent) {
    template = safeSettings.absentSmsTemplate;
  } else if (isExam) {
    template = safeSettings.examSmsTemplate;
  }

  if (!template) {
    template = INITIAL_SETTINGS.regularSmsTemplate;
  }

  const studentName = record?.studentName || student?.name || '학생';
  const school = student?.school || '';
  const grade = student?.grade || '';
  const date = record?.date || new Date().toISOString().slice(0, 10);
  const dayOfWeek = record?.dayOfWeek || '수';
  const teacher = record?.teacher || student?.regularTeacher || '담당 선생님';
  const bookTitle = record?.bookTitle || '지정 교재';
  const pageRange = record?.pageRange || '수업 중 공지 범위';
  const content = record?.content || '과제 상세 내용';
  const dueDate = record?.dueDate || '다음 수업 시간까지';
  const teacherComment = record?.teacherComment || '성실하게 과제를 완료할 수 있도록 응원 부탁드립니다.';
  const absentReason = record?.absentReason || '개인 사정으로 인한 결석';
  const parentPhone = student?.parentPhone || '010-0000-0000';

  const replacements: Record<string, string> = {
    '{studentName}': studentName,
    '{school}': school,
    '{grade}': grade,
    '{date}': date,
    '{dayOfWeek}': dayOfWeek,
    '{teacher}': teacher,
    '{bookTitle}': bookTitle,
    '{pageRange}': pageRange,
    '{content}': content,
    '{dueDate}': dueDate,
    '{teacherComment}': teacherComment,
    '{absentReason}': absentReason,
    '{academyName}': safeSettings.academyName,
    '{academyPhone}': safeSettings.academyPhone,
    '{parentPhone}': parentPhone
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val ?? '');
  }

  return (result || '').trim();
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};
