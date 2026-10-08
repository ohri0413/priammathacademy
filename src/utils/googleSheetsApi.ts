import { Student, AssignmentRecord, ActivityLog, AcademySettings } from '../types';

// 기본 웹 앱 URL 상수 (사용자가 직접 입력하거나 설정 창에서 변경 가능)
export const DEFAULT_GAS_WEBAPP_URL = "여기에_복사한_구글_웹앱_URL_붙여넣기";

const GAS_URL_STORAGE_KEY = 'primamath_gas_webapp_url';

export const getGasWebAppUrl = (): string => {
  try {
    const customUrl = localStorage.getItem(GAS_URL_STORAGE_KEY);
    if (customUrl && customUrl.trim() && customUrl !== DEFAULT_GAS_WEBAPP_URL) {
      return customUrl.trim();
    }
  } catch (e) {
    console.warn('Storage access warning:', e);
  }
  return DEFAULT_GAS_WEBAPP_URL;
};

export const setGasWebAppUrl = (url: string): void => {
  try {
    localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
  } catch (e) {
    console.warn('Storage save warning:', e);
  }
};

export const isGasConfigured = (): boolean => {
  const url = getGasWebAppUrl();
  return !!url && url !== DEFAULT_GAS_WEBAPP_URL && url.startsWith('https://script.google.com');
};

export interface SheetSyncData {
  students: Student[];
  assignments: AssignmentRecord[];
  logs: ActivityLog[];
  settings?: AcademySettings;
  teachers?: string[];
}

/**
 * 구글 스프레드시트 데이터 불러오기 (GET)
 */
export const fetchGoogleSheetsData = async (): Promise<SheetSyncData | null> => {
  const url = getGasWebAppUrl();
  if (!isGasConfigured()) {
    return null;
  }

  try {
    // 캐시 방지 파라미터 추가
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`Google Sheets API responded with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Failed to fetch from Google Sheets (using local storage):', err);
    return null;
  }
};

/**
 * 구글 스프레드시트에 데이터 저장하기 (POST)
 * CORS Preflight (OPTIONS) 문제를 방지하기 위해 Content-Type을 text/plain으로 전송합니다.
 */
export const postGoogleSheetsData = async (
  action: 'saveStudent' | 'deleteStudent' | 'saveAssignment' | 'deleteAssignment' | 'syncAll' | 'saveSettings' | 'saveLog',
  payload: any
): Promise<any> => {
  const url = getGasWebAppUrl();
  if (!isGasConfigured()) {
    return null;
  }

  try {
    const bodyData = JSON.stringify({
      action,
      payload,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: bodyData,
      redirect: 'follow'
    }).catch((networkErr) => {
      console.warn('Network or CORS warning during Google Sheets post:', networkErr);
      return null;
    });

    if (!response) {
      // In Google Apps Script, cross-origin 302 redirects can trigger opaque responses, but the POST was received
      return { success: true, warning: 'Redirected without readable body' };
    }

    if (!response.ok && response.status !== 0) {
      return { success: false, status: response.status, offline: true };
    }

    const result = await response.json().catch(() => ({ success: true }));
    return result;
  } catch (err) {
    console.warn('Failed to post to Google Sheets (local copy preserved):', err);
    return { success: false, error: err };
  }
};

/**
 * 구글 시트에 붙여넣을 Google Apps Script (GAS) 코드 예시
 */
export const SAMPLE_APPS_SCRIPT_CODE = `/**
 * [프리마 수학학원 x 구글 스프레드시트 실시간 연동 스크립트]
 * 1. 스프레드시트 상단 메뉴 > [확장 프로그램] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 코드를 전체 붙여넣기
 * 3. [배포] > [새 배포] 클릭
 *    - 유형: "웹 앱(Web app)" 선택
 *    - 설명: "프리마 수학학원 API v2"
 *    - 액세스 권한: "모든 사용자(Anyone)" 반드시 선택!
 * 4. [배포] 버튼 클릭 후 표시되는 웹 앱 URL을 복사하여 학원 설정에 입력하세요.
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {
      students: getSheetDataAsJson(ss, "Students"),
      assignments: getSheetDataAsJson(ss, "Assignments"),
      logs: getSheetDataAsJson(ss, "Logs"),
      settings: getSettingsData(ss),
      teachers: getTeachersData(ss)
    };
    
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var raw = e.postData.contents;
    var req = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = req.action;
    var payload = req.payload;

    if (action === "syncAll") {
      if (payload.students) saveJsonToSheet(ss, "Students", payload.students);
      if (payload.assignments) saveJsonToSheet(ss, "Assignments", payload.assignments);
      if (payload.logs) saveJsonToSheet(ss, "Logs", payload.logs);
      if (payload.settings) saveSettingsData(ss, payload.settings);
      if (payload.teachers) saveTeachersData(ss, payload.teachers);
    } else if (action === "saveStudent") {
      upsertRow(ss, "Students", "id", payload);
    } else if (action === "deleteStudent") {
      deleteRow(ss, "Students", "id", payload.id);
    } else if (action === "saveAssignment") {
      upsertRow(ss, "Assignments", "id", payload);
    } else if (action === "deleteAssignment") {
      deleteRow(ss, "Assignments", "id", payload.id);
    } else if (action === "saveLog") {
      appendLogRow(ss, payload);
    } else if (action === "saveSettings") {
      if (payload.settings) saveSettingsData(ss, payload.settings);
      if (payload.teachers) saveTeachersData(ss, payload.teachers);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetDataAsJson(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var headers = rows[0];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      if (!key) continue;
      var val = row[j];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch(e){}
      }
      obj[key] = val;
    }
    result.push(obj);
  }
  return result;
}

function saveJsonToSheet(ss, sheetName, items) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  if (!items || items.length === 0) return;
  
  // Collect all unique keys across all items
  var headerSet = [];
  items.forEach(function(item) {
    Object.keys(item).forEach(function(k) {
      if (headerSet.indexOf(k) === -1) headerSet.push(k);
    });
  });

  var values = [headerSet];
  items.forEach(function(item) {
    var row = headerSet.map(function(h) {
      var v = item[h];
      if (v === true || v === false) return v;
      if (typeof v === 'object' && v !== null) return JSON.stringify(v);
      return (v !== undefined && v !== null) ? v : "";
    });
    values.push(row);
  });
  sheet.getRange(1, 1, values.length, headerSet.length).setValues(values);
}

function upsertRow(ss, sheetName, keyName, item) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    saveJsonToSheet(ss, sheetName, [item]);
    return;
  }
  var data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0][0] === "")) {
    saveJsonToSheet(ss, sheetName, [item]);
    return;
  }

  var headers = data[0];
  // Ensure all keys in item exist in header
  var updatedHeaders = false;
  for (var k in item) {
    if (headers.indexOf(k) === -1) {
      headers.push(k);
      updatedHeaders = true;
    }
  }
  if (updatedHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  var keyCol = headers.indexOf(keyName);
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Primary ID match
    if (keyCol !== -1 && row[keyCol] && row[keyCol] == item[keyName]) {
      rowIndex = i + 1;
      break;
    }
    // Assignment composite match: studentId + date (+ mode)
    if (sheetName === "Assignments") {
      var sIdCol = headers.indexOf("studentId");
      var dateCol = headers.indexOf("date");
      var modeCol = headers.indexOf("mode");
      if (sIdCol !== -1 && dateCol !== -1) {
        var matchMode = modeCol === -1 || !item.mode || row[modeCol] == item.mode;
        if (row[sIdCol] == item.studentId && row[dateCol] == item.date && matchMode) {
          rowIndex = i + 1;
          break;
        }
      }
    }
    // Student composite match: name + phone
    if (sheetName === "Students") {
      var nameCol = headers.indexOf("name");
      var phoneCol = headers.indexOf("studentPhone");
      if (nameCol !== -1 && phoneCol !== -1 && row[nameCol] == item.name && row[phoneCol] == item.studentPhone) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var rowData = headers.map(function(h) {
    var v = item[h];
    if (v === true || v === false) return v;
    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
    return (v !== undefined && v !== null) ? v : "";
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function appendLogRow(ss, log) {
  var sheet = ss.getSheetByName("Logs");
  if (!sheet) {
    saveJsonToSheet(ss, "Logs", [log]);
    return;
  }
  var data = sheet.getDataRange().getValues();
  if (data.length < 1 || (data.length === 1 && data[0][0] === "")) {
    saveJsonToSheet(ss, "Logs", [log]);
    return;
  }
  var headers = data[0];
  var rowData = headers.map(function(h) {
    var v = log[h];
    return (v !== undefined && v !== null) ? v : "";
  });
  sheet.appendRow(rowData);
}

function deleteRow(ss, sheetName, keyName, keyValue) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  var headers = data[0];
  var keyCol = headers.indexOf(keyName);
  if (keyCol === -1) return;
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][keyCol] == keyValue) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function getSettingsData(ss) {
  var sheet = ss.getSheetByName("Settings");
  if (!sheet) return null;
  var val = sheet.getRange(1, 1).getValue();
  if (!val) return null;
  try { return JSON.parse(val); } catch(e) { return null; }
}

function saveSettingsData(ss, settings) {
  var sheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
  sheet.getRange(1, 1).setValue(JSON.stringify(settings));
}

function getTeachersData(ss) {
  var sheet = ss.getSheetByName("Teachers");
  if (!sheet) return null;
  var rows = sheet.getDataRange().getValues();
  if (!rows || rows.length === 0) return null;
  return rows.map(function(r) { return r[0]; }).filter(Boolean);
}

function saveTeachersData(ss, teachers) {
  var sheet = ss.getSheetByName("Teachers") || ss.insertSheet("Teachers");
  sheet.clear();
  if (!teachers || teachers.length === 0) return;
  var values = teachers.map(function(t) { return [t]; });
  sheet.getRange(1, 1, values.length, 1).setValues(values);
}
`;
