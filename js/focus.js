(function (window, document) {
  "use strict";

  var CQ = window.CQ || {};
  var elapsedSeconds = 0;
  var timerId = null;
  var sessionStartedAt = null;

  function renderTimer() {
    CQ.Common.setText("timerDisplay", CQ.Storage.formatTimer(elapsedSeconds));
  }

  function renderFocusStats() {
    var stats = CQ.Storage.getStats();
    CQ.Common.setText("todayFocus", CQ.Storage.formatShortDuration(stats.todayFocusSeconds));
    CQ.Common.setText("totalFocus", CQ.Storage.formatShortDuration(stats.totalFocusSeconds));
    CQ.Common.setText("sessionCount", String(stats.sessionCount));
    CQ.Common.setText("focusXpValue", stats.focusXp + " XP");
  }

  function createRecordCard(session) {
    var card = CQ.Common.createElement("article", "record-card");
    var top = CQ.Common.createElement("div", "record-card-top");
    var titleBlock = CQ.Common.createElement("div");
    var date = new Date(session.startedAt);
    var dateText = isNaN(date.getTime()) ? "날짜 없음" : date.toLocaleDateString("ko-KR");
    var timeText = isNaN(date.getTime()) ? "" : date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    var title = CQ.Common.createElement("strong", "", CQ.Storage.formatShortDuration(session.durationSeconds));
    var note = CQ.Common.createElement("p", "", session.note || "메모 없음");
    var meta = CQ.Common.createElement("div", "record-meta");
    var deleteButton = CQ.Common.createElement("button", "btn btn-danger btn-small", "삭제");

    deleteButton.type = "button";
    deleteButton.setAttribute("data-id", session.id);
    titleBlock.appendChild(title);
    titleBlock.appendChild(note);
    top.appendChild(titleBlock);
    top.appendChild(deleteButton);
    meta.appendChild(CQ.Common.createElement("span", "", dateText));
    if (timeText) {
      meta.appendChild(CQ.Common.createElement("span", "", timeText));
    }
    card.appendChild(top);
    card.appendChild(meta);
    return card;
  }

  function renderSessions() {
    var list = document.getElementById("sessionList");
    var sessions = CQ.Storage.getSessions().slice();
    if (!list) {
      return;
    }
    sessions.sort(function (sessionA, sessionB) {
      return new Date(sessionB.startedAt).getTime() - new Date(sessionA.startedAt).getTime();
    });

    CQ.Common.clearChildren(list);
    renderFocusStats();

    if (sessions.length === 0) {
      var empty = CQ.Common.createElement("div", "empty-state");
      empty.appendChild(CQ.Common.createElement("strong", "", "아직 집중 기록이 없습니다"));
      empty.appendChild(CQ.Common.createElement("p", "", "60초 이상 집중한 뒤 세션을 저장해 보세요."));
      list.appendChild(empty);
      return;
    }

    sessions.forEach(function (session) {
      list.appendChild(createRecordCard(session));
    });
  }

  function startTimer() {
    if (timerId !== null) {
      return;
    }
    if (!sessionStartedAt) {
      sessionStartedAt = new Date().toISOString();
    }
    timerId = window.setInterval(function () {
      elapsedSeconds += 1;
      renderTimer();
    }, 1000);
    CQ.Common.showMessage("focusMessage", "집중 타이머가 실행 중입니다.", "info");
  }

  function pauseTimer() {
    if (timerId === null) {
      return;
    }
    window.clearInterval(timerId);
    timerId = null;
    CQ.Common.showMessage("focusMessage", "타이머가 일시정지되었습니다.", "info");
  }

  function resetTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    elapsedSeconds = 0;
    sessionStartedAt = null;
    renderTimer();
    CQ.Common.showMessage("focusMessage", "타이머가 초기화되었습니다.", "info");
  }

  function saveSession() {
    var noteInput = document.getElementById("sessionNote");
    var note = noteInput.value.trim();

    if (elapsedSeconds < 60) {
      CQ.Common.showMessage("focusMessage", "집중 세션은 최소 60초 이상이어야 저장할 수 있습니다.", "error");
      return;
    }

    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }

    CQ.Storage.addSession({
      id: CQ.Storage.createId("session"),
      startedAt: sessionStartedAt || new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      note: note
    });

    elapsedSeconds = 0;
    sessionStartedAt = null;
    noteInput.value = "";
    renderTimer();
    renderSessions();
    CQ.Common.showMessage("focusMessage", "집중 세션이 저장되었습니다.", "success");
  }

  function deleteSession(sessionId) {
    if (!window.confirm("이 집중 기록을 삭제할까요?")) {
      return;
    }
    CQ.Storage.deleteSession(sessionId);
    renderSessions();
    CQ.Common.showMessage("focusMessage", "집중 기록이 삭제되었습니다.", "success");
  }

  function clearAllSessions() {
    var sessions = CQ.Storage.getSessions();
    if (sessions.length === 0) {
      CQ.Common.showMessage("focusMessage", "삭제할 집중 기록이 없습니다.", "info");
      return;
    }
    if (!window.confirm("모든 집중 기록을 삭제할까요?")) {
      return;
    }
    CQ.Storage.clearSessions();
    renderSessions();
    CQ.Common.showMessage("focusMessage", "모든 집중 기록이 삭제되었습니다.", "success");
  }

  function bindEvents() {
    document.getElementById("startTimer").addEventListener("click", startTimer);
    document.getElementById("pauseTimer").addEventListener("click", pauseTimer);
    document.getElementById("resetTimer").addEventListener("click", resetTimer);
    document.getElementById("saveSession").addEventListener("click", saveSession);
    document.getElementById("clearSessions").addEventListener("click", clearAllSessions);
    document.getElementById("sessionList").addEventListener("click", function (event) {
      var button = event.target.closest("button[data-id]");
      if (!button) {
        return;
      }
      deleteSession(button.getAttribute("data-id"));
    });
  }

  function initFocus() {
    bindEvents();
    renderTimer();
    renderSessions();
  }

  CQ.Common.ready(initFocus);
})(window, document);
