(function (window, document) {
  "use strict";

  var CQ = window.CQ || {};
  var TARGET_LEVELS = {
    1: 0,
    3: 200,
    5: 400,
    8: 700
  };

  function renderEvolutionStatus() {
    var stats = CQ.Storage.getStats();
    var statusText = "현재 저장된 데이터 기준 레벨 " + stats.level + ", 총 " + stats.totalXp + " XP입니다.";
    CQ.Common.setText("evolutionCurrentText", statusText);
  }

  function resetDemoData() {
    if (!window.confirm("Campus Quest 데이터를 초기화하고 예시 과제를 다시 생성할까요?")) {
      return;
    }
    CQ.Storage.resetDemoData();
    CQ.Common.applyTheme("light");
    CQ.Common.renderStatElements();
    renderEvolutionStatus();
    CQ.Common.showMessage("guideMessage", "데모 데이터가 초기화되었습니다. 예시 과제가 다시 준비되었습니다.", "success");
  }

  function applyEvolutionLevel(targetLevel) {
    var targetXp = TARGET_LEVELS[targetLevel];
    var previousTheme = CQ.Storage.getSettings().theme;
    var requiredBlocks;
    var durationSeconds;

    if (targetXp === undefined) {
      CQ.Common.showMessage("evolutionMessage", "확인할 수 없는 레벨입니다.", "error");
      return;
    }

    CQ.Storage.resetDemoData();
    CQ.Storage.saveSettings({ theme: previousTheme });
    CQ.Common.applyTheme(previousTheme);

    requiredBlocks = targetXp / 10;
    durationSeconds = requiredBlocks * 25 * 60;
    if (durationSeconds >= 60) {
      CQ.Storage.addSession({
        id: CQ.Storage.createId("session"),
        startedAt: new Date().toISOString(),
        durationSeconds: durationSeconds,
        note: "큐비 레벨 " + targetLevel + " 진화 확인용 기록"
      });
    }

    CQ.Common.renderStatElements();
    renderEvolutionStatus();
    CQ.Common.showMessage("evolutionMessage", "레벨 " + targetLevel + " 확인용 데이터가 적용되었습니다. 대시보드에서 큐비 진화를 확인하세요.", "success");
  }

  function initEvolutionButtons() {
    var buttons = document.querySelectorAll("[data-evolution-level]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyEvolutionLevel(Number(button.getAttribute("data-evolution-level")));
      });
    });
  }

  function initGuide() {
    var resetButton = document.getElementById("resetDemoButton");
    if (resetButton) {
      resetButton.addEventListener("click", resetDemoData);
    }
    initEvolutionButtons();
    renderEvolutionStatus();
  }

  CQ.Common.ready(initGuide);
})(window, document);
