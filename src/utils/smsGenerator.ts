import { AssignmentRecord, Student, AcademySettings } from '../types';

export const calculateSmsBytes = (text: string): number => {
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
  record: AssignmentRecord,
  student: Student | undefined,
  settings: AcademySettings
): string => {
  let template = settings.regularSmsTemplate;
  if (record.isAbsent) {
    template = settings.absentSmsTemplate;
  } else if (record.mode === 'exam') {
    template = settings.examSmsTemplate;
  }

  const replacements: Record<string, string> = {
    '{studentName}': record.studentName || (student?.name ?? '학생'),
    '{school}': student?.school ?? '',
    '{grade}': student?.grade ?? '',
    '{date}': record.date,
    '{dayOfWeek}': record.dayOfWeek,
    '{teacher}': record.teacher,
    '{bookTitle}': record.bookTitle || '지정 교재',
    '{pageRange}': record.pageRange || '수업 중 공지 범위',
    '{content}': record.content || '과제 내용 없음',
    '{dueDate}': record.dueDate || '다음 수업 시간',
    '{teacherComment}': record.teacherComment || '성실하게 과제를 완료할 수 있도록 응원 부탁드립니다.',
    '{absentReason}': record.absentReason || '개인 사정으로 인한 결석',
    '{academyName}': settings.academyName,
    '{academyPhone}': settings.academyPhone,
    '{parentPhone}': student?.parentPhone ?? ''
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }

  return result.trim();
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
