/**
 * @OnlyCurrentDoc
 */

const GIRLS_ROTA_SHEET_ID = "1N6RMXBu7zAMVsAERXfiWmleeGXpjBK9tAbsPG3pNPOY";
const GIRLS_ROTA_TAB = "CORRIDOR DUTY (GIRLS)";
const GIRLS_ROTA_SYNC_URL =
  "https://kulmkrqoadsoaocuovpe.supabase.co/functions/v1/sync-girls-corridor";

const GIRLS_ROTA_LESSON_TIMES = [
  null,
  ["07:40", "08:35"],
  ["08:40", "09:25"],
  ["09:30", "10:35"],
  ["10:40", "11:20"],
  ["11:25", "12:35"],
  ["12:40", "13:20"],
  ["13:25", "14:15"],
];

const GIRLS_ROTA_BLOCKS = [
  { day: 1, titleRow: 1, titleColumn: 1, firstDutyRow: 3, locationColumn: 1, firstLessonColumn: 2, lessonCount: 7 },
  { day: 2, titleRow: 1, titleColumn: 9, firstDutyRow: 3, locationColumn: 9, firstLessonColumn: 10, lessonCount: 7 },
  { day: 3, titleRow: 6, titleColumn: 1, firstDutyRow: 8, locationColumn: 1, firstLessonColumn: 2, lessonCount: 7 },
  { day: 4, titleRow: 6, titleColumn: 9, firstDutyRow: 8, locationColumn: 9, firstLessonColumn: 10, lessonCount: 7 },
  { day: 5, titleRow: 11, titleColumn: 7, firstDutyRow: 13, locationColumn: 7, firstLessonColumn: 8, lessonCount: 4 },
];

const GIRLS_ROTA_EXPECTED_TITLES = [
  [1, 1, "MONDAY"],
  [1, 9, "TUESDAY"],
  [6, 1, "WEDNESDAY"],
  [6, 9, "THURSDAY"],
  [11, 7, "FRIDAY"],
];

function girlsRotaSyncOnOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Duty tracker")
    .addItem("Sync girls’ corridor rota now", "syncGirlsCorridorRotaNow")
    .addToUi();
}

function installGirlsCorridorRotaSync() {
  const spreadsheet = getBoundGirlsRotaSpreadsheet_();
  const existing = ScriptApp.getProjectTriggers();

  if (!existing.some((trigger) => trigger.getHandlerFunction() === "girlsRotaSyncOnEdit")) {
    ScriptApp.newTrigger("girlsRotaSyncOnEdit")
      .forSpreadsheet(spreadsheet)
      .onEdit()
      .create();
  }

  if (!existing.some((trigger) => trigger.getHandlerFunction() === "girlsRotaSyncOnOpen")) {
    ScriptApp.newTrigger("girlsRotaSyncOnOpen")
      .forSpreadsheet(spreadsheet)
      .onOpen()
      .create();
  }

  girlsRotaSyncOnOpen();
}

function girlsRotaSyncOnEdit(event) {
  if (
    !event ||
    !event.range ||
    event.range.getSheet().getName() !== GIRLS_ROTA_TAB
  ) {
    return;
  }

  if (!isGirlsRotaAssignmentEdit_(event.range)) {
    return;
  }

  syncGirlsCorridorRota_(false, event.source);
}

function syncGirlsCorridorRotaNow() {
  syncGirlsCorridorRota_(true, getBoundGirlsRotaSpreadsheet_());
}

function getBoundGirlsRotaSpreadsheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet || spreadsheet.getId() !== GIRLS_ROTA_SHEET_ID) {
    throw new Error("Open the approved girls’ corridor rota spreadsheet to run this sync.");
  }
  return spreadsheet;
}

function syncGirlsCorridorRota_(showToast, spreadsheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (!spreadsheet || spreadsheet.getId() !== GIRLS_ROTA_SHEET_ID) {
      throw new Error("The sync can only run from the approved girls’ corridor rota spreadsheet.");
    }

    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty("ROTA_SYNC_SECRET");
    if (!secret) {
      throw new Error("Set the ROTA_SYNC_SECRET script property before syncing.");
    }

    const sheet = spreadsheet.getSheetByName(GIRLS_ROTA_TAB);
    if (!sheet) {
      throw new Error(`The tab “${GIRLS_ROTA_TAB}” was not found.`);
    }

    const values = sheet.getRange("A1:P14").getDisplayValues();
    validateGirlsRotaHeaders_(values);
    const assignments = readGirlsRotaAssignments_(values);

    const response = UrlFetchApp.fetch(GIRLS_ROTA_SYNC_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "x-rota-sync-secret": secret },
      payload: JSON.stringify({
        spreadsheet_id: GIRLS_ROTA_SHEET_ID,
        sheet_name: GIRLS_ROTA_TAB,
        assignments,
      }),
      muteHttpExceptions: true,
    });

    const status = response.getResponseCode();
    const responseText = response.getContentText();
    if (status < 200 || status >= 300) {
      throw new Error(`Duty tracker rejected the rota (${status}): ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log(JSON.stringify(result));
    if (showToast) {
      spreadsheet.toast("Girls’ corridor rota synced to the duty tracker.", "Duty tracker", 5);
    }
  } finally {
    lock.releaseLock();
  }
}

function validateGirlsRotaHeaders_(values) {
  for (const [row, column, expected] of GIRLS_ROTA_EXPECTED_TITLES) {
    const actual = values[row - 1][column - 1].trim().toUpperCase();
    if (actual !== expected) {
      throw new Error(
        `Expected ${expected} in ${columnToLetter_(column)}${row}; the sheet layout may have changed. Nothing was synced.`,
      );
    }
  }
}

function readGirlsRotaAssignments_(values) {
  const assignments = [];
  const simultaneousDuties = new Set();

  for (const block of GIRLS_ROTA_BLOCKS) {
    for (let locationIndex = 0; locationIndex < 2; locationIndex += 1) {
      const rowNumber = block.firstDutyRow + locationIndex;
      const row = values[rowNumber - 1];
      const rawLocation = row[block.locationColumn - 1].trim().toLowerCase();
      const location = rawLocation.includes("new building")
        ? "New Building Corridor"
        : rawLocation.includes("old building")
          ? "Old Building Corridor"
          : "";

      if (!location) {
        throw new Error(`The corridor label at ${columnToLetter_(block.locationColumn)}${rowNumber} is missing or unrecognized. Nothing was synced.`);
      }

      for (let lesson = 1; lesson <= block.lessonCount; lesson += 1) {
        const column = block.firstLessonColumn + lesson - 1;
        const assignedName = row[column - 1].trim().replace(/\s+/g, " ");
        if (!assignedName) {
          throw new Error(`Lesson ${lesson} on weekday ${block.day} is blank. Nothing was synced.`);
        }

        const clashKey = `${block.day}:${lesson}:${assignedName.toLocaleLowerCase()}`;
        if (simultaneousDuties.has(clashKey)) {
          throw new Error(`${assignedName} is assigned to two corridors in weekday ${block.day}, lesson ${lesson}. Nothing was synced.`);
        }
        simultaneousDuties.add(clashKey);

        const [startTime, regularEndTime] = GIRLS_ROTA_LESSON_TIMES[lesson];
        const endTime = block.day === 5 && lesson === 4 ? "14:15" : regularEndTime;
        assignments.push({
          day_of_week: block.day,
          start_time: startTime,
          end_time: endTime,
          duty_name: `Girls corridor duty - Lesson ${lesson}`,
          location,
          assigned_name: assignedName,
        });
      }
    }
  }

  if (assignments.length !== 64) {
    throw new Error(`Expected 64 assignments, found ${assignments.length}. Nothing was synced.`);
  }

  return assignments;
}

function isGirlsRotaAssignmentEdit_(range) {
  const row = range.getRow();
  const lastRow = row + range.getNumRows() - 1;
  const column = range.getColumn();
  const lastColumn = column + range.getNumColumns() - 1;
  const weekdayAssignmentRows = [3, 4, 8, 9];
  const weekdayAssignmentColumnRange = [2, 16];
  const fridayAssignmentRows = [13, 14];
  const fridayAssignmentColumnRange = [8, 11];

  const overlaps = (first, last, targetFirst, targetLast) =>
    first <= targetLast && last >= targetFirst;

  return (
    weekdayAssignmentRows.some((targetRow) => row <= targetRow && lastRow >= targetRow) &&
    overlaps(column, lastColumn, weekdayAssignmentColumnRange[0], weekdayAssignmentColumnRange[1])
  ) || (
    fridayAssignmentRows.some((targetRow) => row <= targetRow && lastRow >= targetRow) &&
    overlaps(column, lastColumn, fridayAssignmentColumnRange[0], fridayAssignmentColumnRange[1])
  );
}

function columnToLetter_(column) {
  let current = column;
  let letters = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    current = Math.floor((current - 1) / 26);
  }
  return letters;
}
