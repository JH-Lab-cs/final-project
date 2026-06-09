(function (window, document) {
  "use strict";

  var CQ = window.CQ || {};
  var state = {
    filter: "all",
    search: "",
    sort: "latest"
  };

  var priorityLabels = {
    high: "긴급",
    medium: "보통",
    low: "여유"
  };

  var priorityClass = {
    high: "badge-danger",
    medium: "badge-warning",
    low: "badge-success"
  };

  var priorityRank = {
    high: 3,
    medium: 2,
    low: 1
  };

  function getFormValues() {
    return {
      title: document.getElementById("taskTitle").value.trim(),
      course: document.getElementById("taskCourse").value.trim(),
      dueDate: document.getElementById("taskDueDate").value,
      priority: document.getElementById("taskPriority").value,
      estimatedMinutes: Number(document.getElementById("taskMinutes").value)
    };
  }

  function validateTask(values) {
    if (values.title.length < 2 || values.title.length > 40) {
      return "과제명은 2자 이상 40자 이하로 입력하세요.";
    }
    if (values.course.length < 1 || values.course.length > 30) {
      return "과목명은 1자 이상 30자 이하로 입력하세요.";
    }
    if (!values.dueDate) {
      return "마감일은 반드시 입력해야 합니다.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate) || !CQ.Storage.isValidDateInput(values.dueDate)) {
      return "마감일은 실제 존재하는 날짜로 입력하세요.";
    }
    if (!Object.prototype.hasOwnProperty.call(priorityLabels, values.priority)) {
      return "올바른 중요도를 선택하세요.";
    }
    if (!isFinite(values.estimatedMinutes) || values.estimatedMinutes < 5 || values.estimatedMinutes > 300) {
      return "예상 소요 시간은 5분 이상 300분 이하의 숫자로 입력하세요.";
    }
    return "";
  }

  function createBadge(text, className) {
    return CQ.Common.createElement("span", "badge " + className, text);
  }

  function getStatusBadge(task) {
    if (task.completed) {
      return createBadge("완료", "badge-success");
    }
    if (CQ.Storage.getDayDiff(task.dueDate) < 0) {
      return createBadge("마감 지남", "badge-danger");
    }
    if (CQ.Storage.isUrgentTask(task)) {
      return createBadge("마감 임박", "badge-warning");
    }
    return createBadge("진행 중", "badge-primary");
  }

  function createTaskCard(task) {
    var card = CQ.Common.createElement("article", "task-card");
    var top = CQ.Common.createElement("div", "task-card-top");
    var titleBlock = CQ.Common.createElement("div");
    var title = CQ.Common.createElement("h3", "task-title", task.title);
    var course = CQ.Common.createElement("p", "task-course", task.course);
    var badgeRow = CQ.Common.createElement("div", "badge-row");
    var meta = CQ.Common.createElement("div", "task-meta");
    var actions = CQ.Common.createElement("div", "task-actions");
    var toggleButton = CQ.Common.createElement("button", "btn btn-primary", task.completed ? "완료 취소" : "완료 처리");
    var deleteButton = CQ.Common.createElement("button", "btn btn-danger", "삭제");

    if (task.completed) {
      card.classList.add("completed");
    }

    toggleButton.type = "button";
    toggleButton.setAttribute("data-action", "toggle");
    toggleButton.setAttribute("data-id", task.id);
    deleteButton.type = "button";
    deleteButton.setAttribute("data-action", "delete");
    deleteButton.setAttribute("data-id", task.id);

    titleBlock.appendChild(title);
    titleBlock.appendChild(course);
    top.appendChild(titleBlock);
    top.appendChild(createBadge(CQ.Storage.getDdayLabel(task), task.completed ? "badge-muted" : "badge-warning"));

    badgeRow.appendChild(getStatusBadge(task));
    badgeRow.appendChild(createBadge(priorityLabels[task.priority], priorityClass[task.priority]));

    meta.appendChild(CQ.Common.createElement("span", "", "마감일 " + task.dueDate));
    meta.appendChild(CQ.Common.createElement("span", "", "예상 " + task.estimatedMinutes + "분"));

    actions.appendChild(toggleButton);
    actions.appendChild(deleteButton);
    card.appendChild(top);
    card.appendChild(badgeRow);
    card.appendChild(meta);
    card.appendChild(actions);
    return card;
  }

  function matchesFilter(task) {
    if (state.filter === "active") {
      return !task.completed;
    }
    if (state.filter === "completed") {
      return task.completed;
    }
    if (state.filter === "urgent") {
      return CQ.Storage.isUrgentTask(task);
    }
    return true;
  }

  function matchesSearch(task) {
    var query = state.search.toLowerCase();
    if (!query) {
      return true;
    }
    return task.title.toLowerCase().indexOf(query) !== -1 || task.course.toLowerCase().indexOf(query) !== -1;
  }

  function sortTasks(tasks) {
    var sorted = tasks.slice();
    sorted.sort(function (taskA, taskB) {
      if (state.sort === "due") {
        return new Date(taskA.dueDate).getTime() - new Date(taskB.dueDate).getTime();
      }
      if (state.sort === "priority") {
        return priorityRank[taskB.priority] - priorityRank[taskA.priority];
      }
      return new Date(taskB.createdAt).getTime() - new Date(taskA.createdAt).getTime();
    });
    return sorted;
  }

  function renderFilterButtons() {
    var buttons = document.querySelectorAll("[data-filter]");
    buttons.forEach(function (button) {
      if (button.getAttribute("data-filter") === state.filter) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  function renderTasks() {
    var list = document.getElementById("taskList");
    var tasks = sortTasks(CQ.Storage.getTasks().filter(matchesFilter).filter(matchesSearch));
    if (!list) {
      return;
    }

    CQ.Common.clearChildren(list);
    renderFilterButtons();
    CQ.Common.renderStatElements();

    if (tasks.length === 0) {
      var empty = CQ.Common.createElement("div", "empty-state");
      empty.appendChild(CQ.Common.createElement("strong", "", "표시할 과제가 없습니다"));
      empty.appendChild(CQ.Common.createElement("p", "", "필터를 바꾸거나 새 과제를 등록해 보세요."));
      list.appendChild(empty);
      return;
    }

    tasks.forEach(function (task) {
      list.appendChild(createTaskCard(task));
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    var values = getFormValues();
    var errorMessage = validateTask(values);
    var form = document.getElementById("taskForm");

    if (errorMessage) {
      CQ.Common.showMessage("taskMessage", errorMessage, "error");
      return;
    }

    CQ.Storage.addTask({
      id: CQ.Storage.createId("task"),
      title: values.title,
      course: values.course,
      dueDate: values.dueDate,
      priority: values.priority,
      estimatedMinutes: values.estimatedMinutes,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    });

    form.reset();
    document.getElementById("taskPriority").value = "medium";
    CQ.Common.showMessage("taskMessage", "과제가 저장되었습니다.", "success");
    renderTasks();
  }

  function handleListClick(event) {
    var button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    var taskId = button.getAttribute("data-id");
    var action = button.getAttribute("data-action");

    if (action === "toggle") {
      CQ.Storage.updateTask(taskId, function (task) {
        return {
          id: task.id,
          title: task.title,
          course: task.course,
          dueDate: task.dueDate,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          completed: !task.completed,
          createdAt: task.createdAt,
          completedAt: task.completed ? null : new Date().toISOString()
        };
      });
      CQ.Common.showMessage("taskMessage", "과제 상태가 변경되었습니다.", "success");
      renderTasks();
      return;
    }

    if (action === "delete" && window.confirm("이 과제를 삭제할까요?")) {
      CQ.Storage.deleteTask(taskId);
      CQ.Common.showMessage("taskMessage", "과제가 삭제되었습니다.", "success");
      renderTasks();
    }
  }

  function bindEvents() {
    document.getElementById("taskForm").addEventListener("submit", handleSubmit);
    document.getElementById("taskList").addEventListener("click", handleListClick);
    document.getElementById("taskSearch").addEventListener("input", function (event) {
      state.search = event.target.value.trim();
      renderTasks();
    });
    document.getElementById("taskSort").addEventListener("change", function (event) {
      state.sort = event.target.value;
      renderTasks();
    });

    var filterButtons = document.querySelectorAll("[data-filter]");
    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        state.filter = button.getAttribute("data-filter");
        renderTasks();
      });
    });
  }

  function initTasks() {
    bindEvents();
    renderTasks();
  }

  CQ.Common.ready(initTasks);
})(window, document);
