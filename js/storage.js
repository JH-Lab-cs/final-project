(function (window) {
  "use strict";

  var CQ = window.CQ || {};
  var TASK_KEY = "cq.tasks";
  var SESSION_KEY = "cq.sessions";
  var SETTINGS_KEY = "cq.settings";
  var DAY_MS = 24 * 60 * 60 * 1000;
  var PRIORITY_XP = {
    high: 35,
    medium: 25,
    low: 15
  };

  function readJson(key, fallbackValue) {
    var rawValue;
    try {
      rawValue = window.localStorage.getItem(key);
      if (rawValue === null) {
        return fallbackValue;
      }
      return JSON.parse(rawValue);
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return false;
    }
    return true;
  }

  function createId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function padNumber(value) {
    var text = String(value);
    return text.length < 2 ? "0" + text : text;
  }

  function toDateInputValue(date) {
    return date.getFullYear() + "-" + padNumber(date.getMonth() + 1) + "-" + padNumber(date.getDate());
  }

  function addDays(date, days) {
    var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  function parseDateOnly(value) {
    var parts = String(value).split("-");
    if (parts.length !== 3) {
      return null;
    }
    var year = Number(parts[0]);
    var month = Number(parts[1]) - 1;
    var day = Number(parts[2]);
    if (!year || month < 0 || month > 11 || !day) {
      return null;
    }
    return new Date(year, month, day);
  }

  function isValidDateInput(value) {
    var date = parseDateOnly(value);
    if (!date) {
      return false;
    }
    return toDateInputValue(date) === value;
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function normalizePriority(priority) {
    if (priority === "high" || priority === "medium" || priority === "low") {
      return priority;
    }
    return "medium";
  }

  function normalizeTask(task) {
    var estimatedMinutes;
    var completed;

    if (!isPlainObject(task)) {
      return null;
    }
    if (typeof task.id !== "string" || task.id.length === 0) {
      return null;
    }
    if (typeof task.title !== "string" || task.title.trim().length === 0) {
      return null;
    }
    if (typeof task.course !== "string" || task.course.trim().length === 0) {
      return null;
    }
    if (typeof task.dueDate !== "string" || !isValidDateInput(task.dueDate)) {
      return null;
    }

    estimatedMinutes = Number(task.estimatedMinutes);
    if (!isFinite(estimatedMinutes) || estimatedMinutes < 5 || estimatedMinutes > 300) {
      estimatedMinutes = 30;
    }

    completed = task.completed === true;

    return {
      id: task.id,
      title: task.title.trim().slice(0, 40),
      course: task.course.trim().slice(0, 30),
      dueDate: task.dueDate,
      priority: normalizePriority(task.priority),
      estimatedMinutes: Math.round(estimatedMinutes),
      completed: completed,
      createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
      completedAt: completed && typeof task.completedAt === "string" ? task.completedAt : null
    };
  }

  function normalizeSession(session) {
    var durationSeconds;
    var startedAt;

    if (!isPlainObject(session)) {
      return null;
    }
    if (typeof session.id !== "string" || session.id.length === 0) {
      return null;
    }
    startedAt = new Date(session.startedAt);
    if (isNaN(startedAt.getTime())) {
      return null;
    }
    durationSeconds = Number(session.durationSeconds);
    if (!isFinite(durationSeconds) || durationSeconds < 60) {
      return null;
    }
    return {
      id: session.id,
      startedAt: startedAt.toISOString(),
      durationSeconds: Math.floor(durationSeconds),
      note: typeof session.note === "string" ? session.note.trim().slice(0, 80) : ""
    };
  }

  function normalizeArray(items, normalizer) {
    var normalizedItems = [];
    if (!Array.isArray(items)) {
      return normalizedItems;
    }
    items.forEach(function (item) {
      var normalized = normalizer(item);
      if (normalized) {
        normalizedItems.push(normalized);
      }
    });
    return normalizedItems;
  }

  function getTodayDate() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function getDayDiff(dueDate) {
    var due = parseDateOnly(dueDate);
    if (!due) {
      return 0;
    }
    return Math.round((due.getTime() - getTodayDate().getTime()) / DAY_MS);
  }

  function getDdayLabel(task) {
    if (task.completed) {
      return "완료";
    }
    var diff = getDayDiff(task.dueDate);
    if (diff === 0) {
      return "D-Day";
    }
    if (diff > 0) {
      return "D-" + diff;
    }
    return "D+" + Math.abs(diff);
  }

  function isUrgentTask(task) {
    return !task.completed && getDayDiff(task.dueDate) <= 2;
  }

  function createDemoTasks() {
    var today = getTodayDate();
    return [
      {
        id: createId("task"),
        title: "웹프로그래밍 기말 프로젝트",
        course: "웹프로그래밍",
        dueDate: toDateInputValue(addDays(today, 3)),
        priority: "high",
        estimatedMinutes: 120,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      },
      {
        id: createId("task"),
        title: "JavaScript 발표 준비",
        course: "웹프로그래밍",
        dueDate: toDateInputValue(addDays(today, 1)),
        priority: "medium",
        estimatedMinutes: 60,
        completed: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        completedAt: null
      },
      {
        id: createId("task"),
        title: "데이터베이스 정리",
        course: "데이터베이스",
        dueDate: toDateInputValue(addDays(today, 5)),
        priority: "medium",
        estimatedMinutes: 90,
        completed: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: null
      },
      {
        id: createId("task"),
        title: "영어 과제 제출",
        course: "교양영어",
        dueDate: toDateInputValue(addDays(today, 7)),
        priority: "low",
        estimatedMinutes: 40,
        completed: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        completedAt: null
      }
    ];
  }

  function ensureInitialData() {
    if (window.localStorage.getItem(TASK_KEY) === null) {
      writeJson(TASK_KEY, createDemoTasks());
    }
    if (window.localStorage.getItem(SESSION_KEY) === null) {
      writeJson(SESSION_KEY, []);
    }
    if (window.localStorage.getItem(SETTINGS_KEY) === null) {
      writeJson(SETTINGS_KEY, { theme: "light" });
    }
  }

  function getTasks() {
    var tasks = readJson(TASK_KEY, []);
    return normalizeArray(tasks, normalizeTask);
  }

  function saveTasks(tasks) {
    writeJson(TASK_KEY, normalizeArray(tasks, normalizeTask));
  }

  function addTask(task) {
    var tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);
  }

  function updateTask(taskId, updater) {
    var tasks = getTasks();
    var updatedTasks = tasks.map(function (task) {
      if (task.id !== taskId) {
        return task;
      }
      return normalizeTask(updater(task));
    }).filter(function (task) {
      return task !== null;
    });
    saveTasks(updatedTasks);
  }

  function deleteTask(taskId) {
    var tasks = getTasks().filter(function (task) {
      return task.id !== taskId;
    });
    saveTasks(tasks);
  }

  function getSessions() {
    var sessions = readJson(SESSION_KEY, []);
    return normalizeArray(sessions, normalizeSession);
  }

  function saveSessions(sessions) {
    writeJson(SESSION_KEY, normalizeArray(sessions, normalizeSession));
  }

  function addSession(session) {
    var sessions = getSessions();
    sessions.push(session);
    saveSessions(sessions);
  }

  function deleteSession(sessionId) {
    var sessions = getSessions().filter(function (session) {
      return session.id !== sessionId;
    });
    saveSessions(sessions);
  }

  function clearSessions() {
    saveSessions([]);
  }

  function getSettings() {
    var settings = readJson(SETTINGS_KEY, { theme: "light" });
    if (!settings || (settings.theme !== "light" && settings.theme !== "dark")) {
      return { theme: "light" };
    }
    return settings;
  }

  function saveSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
  }

  function isSameLocalDay(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate();
  }

  function getTaskXp(tasks) {
    return tasks.reduce(function (total, task) {
      if (!task.completed) {
        return total;
      }
      return total + (PRIORITY_XP[task.priority] || 0);
    }, 0);
  }

  function getFocusSeconds(sessions) {
    return sessions.reduce(function (total, session) {
      var seconds = Number(session.durationSeconds);
      if (!isFinite(seconds) || seconds < 0) {
        return total;
      }
      return total + seconds;
    }, 0);
  }

  function getTodayFocusSeconds(sessions) {
    var today = new Date();
    return sessions.reduce(function (total, session) {
      var startedAt = new Date(session.startedAt);
      if (isNaN(startedAt.getTime()) || !isSameLocalDay(startedAt, today)) {
        return total;
      }
      return total + Number(session.durationSeconds || 0);
    }, 0);
  }

  function getFocusXp(totalFocusSeconds) {
    return Math.floor(totalFocusSeconds / (25 * 60)) * 10;
  }

  function getStats() {
    var tasks = getTasks();
    var sessions = getSessions();
    var completedTasks = tasks.filter(function (task) {
      return task.completed;
    });
    var urgentTasks = tasks.filter(isUrgentTask);
    var totalFocusSeconds = getFocusSeconds(sessions);
    var taskXp = getTaskXp(tasks);
    var focusXp = getFocusXp(totalFocusSeconds);
    var totalXp = taskXp + focusXp;
    var currentLevelXp = totalXp % 100;
    var level = Math.floor(totalXp / 100) + 1;
    var totalTasks = tasks.length;

    return {
      totalTasks: totalTasks,
      completedTasks: completedTasks.length,
      activeTasks: totalTasks - completedTasks.length,
      urgentTasks: urgentTasks.length,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100),
      taskXp: taskXp,
      focusXp: focusXp,
      totalXp: totalXp,
      level: level,
      currentLevelXp: currentLevelXp,
      nextLevelXp: 100,
      progressPercent: currentLevelXp,
      nextLevelRemaining: 100 - currentLevelXp,
      totalFocusSeconds: totalFocusSeconds,
      todayFocusSeconds: getTodayFocusSeconds(sessions),
      sessionCount: sessions.length
    };
  }

  function getUrgentTasks(limit) {
    var tasks = getTasks().filter(isUrgentTask);
    tasks.sort(function (taskA, taskB) {
      var diffA = getDayDiff(taskA.dueDate);
      var diffB = getDayDiff(taskB.dueDate);
      if (diffA !== diffB) {
        return diffA - diffB;
      }
      return new Date(taskA.createdAt).getTime() - new Date(taskB.createdAt).getTime();
    });
    if (limit) {
      return tasks.slice(0, limit);
    }
    return tasks;
  }

  function formatTimer(totalSeconds) {
    var seconds = Math.max(0, Math.floor(totalSeconds));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainingSeconds = seconds % 60;
    return padNumber(hours) + ":" + padNumber(minutes) + ":" + padNumber(remainingSeconds);
  }

  function formatShortDuration(totalSeconds) {
    var seconds = Math.max(0, Math.floor(totalSeconds));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && minutes > 0) {
      return hours + "시간 " + minutes + "분";
    }
    if (hours > 0) {
      return hours + "시간";
    }
    return minutes + "분";
  }

  function resetDemoData() {
    writeJson(TASK_KEY, createDemoTasks());
    writeJson(SESSION_KEY, []);
    writeJson(SETTINGS_KEY, { theme: "light" });
  }

  CQ.Storage = {
    createId: createId,
    ensureInitialData: ensureInitialData,
    getTasks: getTasks,
    saveTasks: saveTasks,
    addTask: addTask,
    updateTask: updateTask,
    deleteTask: deleteTask,
    getSessions: getSessions,
    addSession: addSession,
    deleteSession: deleteSession,
    clearSessions: clearSessions,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getStats: getStats,
    getUrgentTasks: getUrgentTasks,
    getDayDiff: getDayDiff,
    getDdayLabel: getDdayLabel,
    isUrgentTask: isUrgentTask,
    isValidDateInput: isValidDateInput,
    formatTimer: formatTimer,
    formatShortDuration: formatShortDuration,
    toDateInputValue: toDateInputValue,
    resetDemoData: resetDemoData
  };

  window.CQ = CQ;
})(window);
