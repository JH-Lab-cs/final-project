(function (window, document) {
  "use strict";

  var CQ = window.CQ || {};
  var MASCOT_STAGES = [
    {
      minLevel: 8,
      className: "stage-4",
      badge: "마스터 가디언",
      name: "아스트라 큐비",
      description: "집중 루틴이 안정된 최종 진화형입니다."
    },
    {
      minLevel: 5,
      className: "stage-3",
      badge: "집중 기사",
      name: "윙 큐비",
      description: "과제와 집중 시간을 균형 있게 쌓아 날개가 생겼습니다."
    },
    {
      minLevel: 3,
      className: "stage-2",
      badge: "성장 중",
      name: "스타 큐비",
      description: "완료한 퀘스트가 늘어나 반짝이는 힘을 얻었습니다."
    },
    {
      minLevel: 1,
      className: "stage-1",
      badge: "새내기 탐험가",
      name: "큐비",
      description: "첫 퀘스트를 준비하는 작은 학습 파트너입니다."
    }
  ];

  function getMascotStage(level) {
    var index;
    for (index = 0; index < MASCOT_STAGES.length; index += 1) {
      if (level >= MASCOT_STAGES[index].minLevel) {
        return MASCOT_STAGES[index];
      }
    }
    return MASCOT_STAGES[MASCOT_STAGES.length - 1];
  }

  function renderMascot(stats) {
    var stage = getMascotStage(stats.level);
    var mascot = document.getElementById("questMascot");
    var trackItems = document.querySelectorAll("[data-stage-level]");
    if (mascot) {
      mascot.className = "mascot " + stage.className;
    }
    trackItems.forEach(function (item) {
      var stageLevel = Number(item.getAttribute("data-stage-level"));
      item.classList.toggle("active", stageLevel <= stats.level);
      item.classList.toggle("current", stageLevel === stage.minLevel);
    });
    CQ.Common.setText("mascotStageBadge", stage.badge);
    CQ.Common.setText("mascotName", stage.name);
    CQ.Common.setText("mascotDescription", stage.description);
  }

  function renderHero(stats) {
    CQ.Common.setText("heroLevel", "레벨 " + stats.level);
    CQ.Common.setText("heroLevelXp", String(stats.currentLevelXp));
    CQ.Common.setText("heroTotalXp", stats.totalXp + " XP");
    CQ.Common.setText("heroUrgentCount", "마감 임박 " + stats.urgentTasks + "개");
    CQ.Common.setText("heroCompletionRate", "완료율 " + stats.completionRate + "%");

    var progressBar = document.getElementById("heroProgressBar");
    if (progressBar) {
      progressBar.style.width = stats.progressPercent + "%";
    }
    renderMascot(stats);
  }

  function renderStats(stats) {
    CQ.Common.setText("currentLevel", String(stats.level));
    CQ.Common.setText("totalXp", String(stats.totalXp));
    CQ.Common.setText("completionRate", stats.completionRate + "%");
    CQ.Common.setText("totalFocusTime", CQ.Storage.formatShortDuration(stats.totalFocusSeconds));
    CQ.Common.setText("remainingTasks", String(stats.activeTasks));
    CQ.Common.setText("nextLevelText", "레벨 " + (stats.level + 1) + "까지 " + stats.nextLevelRemaining + " XP");
    CQ.Common.setText("taskCompletionText", "총 " + stats.totalTasks + "개 중 " + stats.completedTasks + "개 완료");
    CQ.Common.setText("todayFocusText", "오늘 " + CQ.Storage.formatShortDuration(stats.todayFocusSeconds) + " 집중");
    CQ.Common.setText("urgentTaskText", "마감 임박 " + stats.urgentTasks + "개");
    CQ.Common.setText("openQuestCount", String(stats.activeTasks));
    CQ.Common.setText("completedQuestCount", String(stats.completedTasks));
    CQ.Common.setText("focusSessionCount", String(stats.sessionCount));
    CQ.Common.setText("focusXp", stats.focusXp + " XP");
  }

  function createUrgentItem(task) {
    var item = CQ.Common.createElement("article", "compact-item");
    var topLine = CQ.Common.createElement("div", "task-card-top");
    var titleWrap = CQ.Common.createElement("div");
    var title = CQ.Common.createElement("strong", "", task.title);
    var course = CQ.Common.createElement("span", "", task.course);
    var badge = CQ.Common.createElement("span", "badge badge-warning", CQ.Storage.getDdayLabel(task));
    var meta = CQ.Common.createElement("div", "task-meta");

    titleWrap.appendChild(title);
    titleWrap.appendChild(course);
    topLine.appendChild(titleWrap);
    topLine.appendChild(badge);
    meta.appendChild(CQ.Common.createElement("span", "", "마감일 " + task.dueDate));
    meta.appendChild(CQ.Common.createElement("span", "", task.estimatedMinutes + "분 예상"));

    item.appendChild(topLine);
    item.appendChild(meta);
    return item;
  }

  function renderUrgentTasks() {
    var list = document.getElementById("urgentTaskList");
    var tasks = CQ.Storage.getUrgentTasks(3);
    if (!list) {
      return;
    }
    CQ.Common.clearChildren(list);
    if (tasks.length === 0) {
      var empty = CQ.Common.createElement("div", "empty-state");
      empty.appendChild(CQ.Common.createElement("strong", "", "마감 임박 과제가 없습니다"));
      empty.appendChild(CQ.Common.createElement("p", "", "가까운 마감 일정은 안정적으로 관리되고 있습니다."));
      list.appendChild(empty);
      return;
    }
    tasks.forEach(function (task) {
      list.appendChild(createUrgentItem(task));
    });
  }

  function initDashboard() {
    var stats = CQ.Storage.getStats();
    renderHero(stats);
    renderStats(stats);
    renderUrgentTasks();
  }

  CQ.Common.ready(initDashboard);
})(window, document);
