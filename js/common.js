(function (window, document) {
  "use strict";

  var CQ = window.CQ || {};

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function clearChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text !== undefined && text !== null) {
      element.textContent = text;
    }
    return element;
  }

  function setText(id, text) {
    var element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }

  function showMessage(elementId, message, type) {
    var element = document.getElementById(elementId);
    if (!element) {
      return;
    }
    element.textContent = message;
    element.className = "inline-message show " + (type || "info");
  }

  function clearMessage(elementId) {
    var element = document.getElementById(elementId);
    if (!element) {
      return;
    }
    element.textContent = "";
    element.className = "inline-message";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var themeButton = document.getElementById("themeToggle");
    if (themeButton) {
      themeButton.textContent = theme === "dark" ? "라이트" : "다크";
    }
  }

  function initThemeToggle() {
    var settings = CQ.Storage.getSettings();
    var themeButton = document.getElementById("themeToggle");
    applyTheme(settings.theme);
    if (!themeButton) {
      return;
    }
    themeButton.addEventListener("click", function () {
      var currentSettings = CQ.Storage.getSettings();
      var nextTheme = currentSettings.theme === "dark" ? "light" : "dark";
      CQ.Storage.saveSettings({ theme: nextTheme });
      applyTheme(nextTheme);
    });
  }

  function initNavigation() {
    var currentPage = document.body.getAttribute("data-page");
    var navLinks = document.querySelectorAll(".site-nav a");
    var nav = document.getElementById("siteNav");
    var navToggle = document.getElementById("navToggle");

    navLinks.forEach(function (link) {
      if (link.getAttribute("data-page") === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });

    if (!nav || !navToggle) {
      return;
    }

    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function renderStatElements() {
    var stats = CQ.Storage.getStats();
    var values = {
      level: String(stats.level),
      totalXp: stats.totalXp + " XP",
      completionRate: stats.completionRate + "%",
      urgentTasks: String(stats.urgentTasks),
      taskCounts: "총 " + stats.totalTasks + "개 중 " + stats.completedTasks + "개 완료",
      levelProgress: stats.currentLevelXp + " / " + stats.nextLevelXp + " XP"
    };
    var elements = document.querySelectorAll("[data-cq-stat]");
    elements.forEach(function (element) {
      var key = element.getAttribute("data-cq-stat");
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        element.textContent = values[key];
      }
    });
  }

  function initCommon() {
    CQ.Storage.ensureInitialData();
    initThemeToggle();
    initNavigation();
    renderStatElements();
  }

  CQ.Common = {
    ready: ready,
    clearChildren: clearChildren,
    createElement: createElement,
    setText: setText,
    showMessage: showMessage,
    clearMessage: clearMessage,
    applyTheme: applyTheme,
    renderStatElements: renderStatElements
  };

  window.CQ = CQ;

  ready(initCommon);
})(window, document);
