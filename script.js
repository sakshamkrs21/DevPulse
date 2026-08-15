// =========================================================
// DEVPULSE
// GitHub API + Analytics + Insights + Tasks
// =========================================================

// =========================================================
// SELECT HTML ELEMENTS
// =========================================================

const themeBtn = document.getElementById("themeBtn");
const searchBtn = document.getElementById("searchBtn");
const usernameInput = document.getElementById("usernameInput");

const profileName = document.getElementById("profileName");
const profileUsername = document.getElementById("profileUsername");
const profileBio = document.getElementById("profileBio");
const githubProfileLink = document.getElementById("githubProfileLink");

const repoCount = document.getElementById("repoCount");
const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");

const repositoriesContainer = document.getElementById("repositories");
const repoSearch = document.getElementById("repoSearch");

const taskList = document.getElementById("taskList");
const addTaskBtn = document.getElementById("addTaskBtn");

const taskProgressText = document.getElementById("taskProgressText");
const taskProgressBar = document.getElementById("taskProgressBar");

const totalTaskCount = document.getElementById("totalTaskCount");
const completedTaskCount = document.getElementById("completedTaskCount");
const pendingTaskCount = document.getElementById("pendingTaskCount");

// =========================================================
// STATE
// =========================================================

let allRepositories = [];

let tasks = JSON.parse(localStorage.getItem("devpulseTasks")) || [];

// =========================================================
// DARK / LIGHT MODE
// =========================================================

if (themeBtn) {
  themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
      themeBtn.textContent = "☀️";
    } else {
      themeBtn.textContent = "🌙";
    }
  });
}

// =========================================================
// GITHUB SEARCH
// =========================================================

if (searchBtn) {
  searchBtn.addEventListener("click", function () {
    const username = usernameInput.value.trim();

    if (!username) {
      alert("Please enter a GitHub username.");

      usernameInput.focus();

      return;
    }

    getGitHubUser(username);
  });
}

if (usernameInput) {
  usernameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchBtn.click();
    }
  });
}

// =========================================================
// GET GITHUB USER
// =========================================================

async function getGitHubUser(username) {
  try {
    showLoading();

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
    );

    if (response.status === 403) {
      throw new Error("GitHub API rate limit reached. Please try again later.");
    }

    if (response.status === 404) {
      throw new Error("GitHub user not found.");
    }

    if (!response.ok) {
      throw new Error("Unable to connect to GitHub.");
    }

    const userData = await response.json();

    displayUser(userData);

    await getRepositories(username);
  } catch (error) {
    console.error("GitHub profile error:", error);

    showError(error.message || "Something went wrong. Please try again.");
  }
}

// =========================================================
// DISPLAY USER
// =========================================================

function displayUser(user) {
  if (profileName) {
    profileName.textContent = user.name || user.login;
  }

  if (profileUsername) {
    profileUsername.textContent = `@${user.login}`;
  }

  if (profileBio) {
    profileBio.textContent = user.bio || "No bio available.";
  }

  if (repoCount) {
    repoCount.textContent = user.public_repos;
  }

  if (followersCount) {
    followersCount.textContent = user.followers;
  }

  if (followingCount) {
    followingCount.textContent = user.following;
  }

  // Avatar

  const avatar = document.querySelector(".avatar");

  if (avatar) {
    avatar.innerHTML = "";

    const image = document.createElement("img");

    image.src = user.avatar_url;
    image.alt = `${user.login} avatar`;

    avatar.appendChild(image);
  }

  // GitHub profile link

  if (githubProfileLink) {
    githubProfileLink.href = user.html_url;

    githubProfileLink.target = "_blank";

    githubProfileLink.rel = "noopener noreferrer";
  }

  // Status

  const statusDot = document.querySelector(".status-dot");

  if (statusDot) {
    statusDot.style.background = "#7ee787";
  }
}

// =========================================================
// GET REPOSITORIES
// =========================================================

async function getRepositories(username) {
  if (!repositoriesContainer) {
    return;
  }

  repositoriesContainer.innerHTML = `

        <div class="repo-loading">

            <div class="repo-loading-spinner"></div>

            <span class="repo-loading-text">
                Loading repositories...
            </span>

        </div>

    `;

  try {
    /*
     * Fetch up to 100 repositories.
     * This gives analytics much better accuracy
     * than only fetching 10 repositories.
     */

    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
    );

    if (response.status === 403) {
      throw new Error("GitHub API rate limit reached.");
    }

    if (!response.ok) {
      throw new Error("Unable to load repositories.");
    }

    const repositories = await response.json();

    allRepositories = repositories;

    // Analytics

    updateGitHubAnalytics(repositories);

    // Languages

    updateLanguageAnalytics(repositories);

    // Developer insights

    updateRepositoryInsights(repositories);

    // Repository cards

    displayRepositories(repositories);
  } catch (error) {
    console.error("Repository error:", error);

    repositoriesContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    Unable to load repositories
                </h3>

                <p>
                    ${
                      error.message ||
                      "Please check your internet connection and try again."
                    }
                </p>

            </div>

        `;
  }
}

// =========================================================
// GITHUB ANALYTICS
// =========================================================

function updateGitHubAnalytics(repositories) {
  const totalRepos = repositories.length;

  const totalStars = repositories.reduce(function (total, repo) {
    return total + (repo.stargazers_count || 0);
  }, 0);

  const totalForks = repositories.reduce(function (total, repo) {
    return total + (repo.forks_count || 0);
  }, 0);

  const totalReposElement = document.getElementById("totalRepos");

  const totalStarsElement = document.getElementById("totalStars");

  const totalForksElement = document.getElementById("totalForks");

  if (totalReposElement) {
    totalReposElement.textContent = totalRepos;
  }

  if (totalStarsElement) {
    totalStarsElement.textContent = totalStars;
  }

  if (totalForksElement) {
    totalForksElement.textContent = totalForks;
  }
}

// =========================================================
// LANGUAGE ANALYTICS
// =========================================================

function updateLanguageAnalytics(repositories) {
  const languageStats = document.getElementById("languageStats");

  if (!languageStats) {
    return;
  }

  const languages = {};

  repositories.forEach(function (repo) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });

  const languageEntries = Object.entries(languages);

  if (languageEntries.length === 0) {
    languageStats.innerHTML = `

            <p class="language-empty">
                No language data available.
            </p>

        `;

    return;
  }

  const sortedLanguages = languageEntries
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, 5);

  const maxCount = sortedLanguages[0][1];

  languageStats.innerHTML = sortedLanguages
    .map(function ([language, count]) {
      const percentage = Math.round((count / maxCount) * 100);

      return `

                    <div class="language-row">

                        <span
                            class="language-name"
                            title="${escapeHTML(language)}"
                        >
                            ${escapeHTML(language)}
                        </span>


                        <div class="language-bar">

                            <div
                                class="language-bar-fill"
                                style="width: ${percentage}%"
                            ></div>

                        </div>


                        <span class="language-count">
                            ${count}
                        </span>

                    </div>

                `;
    })
    .join("");
}

// =========================================================
// DEVELOPER INSIGHTS
// =========================================================

function updateRepositoryInsights(repositories) {
  const mostStarredElement = document.getElementById("mostStarredRepo");

  const mostForkedElement = document.getElementById("mostForkedRepo");

  const latestRepoElement = document.getElementById("latestRepo");

  const mostUsedLanguageElement = document.getElementById("mostUsedLanguage");

  const averageStarsElement = document.getElementById("averageStars");

  if (
    !mostStarredElement ||
    !mostForkedElement ||
    !latestRepoElement ||
    !mostUsedLanguageElement ||
    !averageStarsElement
  ) {
    return;
  }

  // No repositories

  if (repositories.length === 0) {
    mostStarredElement.textContent = "—";
    mostForkedElement.textContent = "—";
    latestRepoElement.textContent = "—";
    mostUsedLanguageElement.textContent = "—";
    averageStarsElement.textContent = "—";

    return;
  }

  // Most starred

  const mostStarred = repositories.reduce(function (best, repo) {
    return (repo.stargazers_count || 0) > (best.stargazers_count || 0)
      ? repo
      : best;
  }, repositories[0]);

  // Most forked

  const mostForked = repositories.reduce(function (best, repo) {
    return (repo.forks_count || 0) > (best.forks_count || 0) ? repo : best;
  }, repositories[0]);

  // Latest updated

  const latestRepo = repositories.reduce(function (latest, repo) {
    return new Date(repo.updated_at) > new Date(latest.updated_at)
      ? repo
      : latest;
  }, repositories[0]);

  // Most used language

  const languages = {};

  repositories.forEach(function (repo) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  });

  let mostUsedLanguage = "—";

  if (Object.keys(languages).length > 0) {
    mostUsedLanguage = Object.entries(languages).sort(function (a, b) {
      return b[1] - a[1];
    })[0][0];
  }

  // Average stars

  const totalStars = repositories.reduce(function (total, repo) {
    return total + (repo.stargazers_count || 0);
  }, 0);

  const averageStars = (totalStars / repositories.length).toFixed(1);

  // Update UI

  mostStarredElement.textContent = mostStarred.name;

  mostForkedElement.textContent = mostForked.name;

  latestRepoElement.textContent = latestRepo.name;

  mostUsedLanguageElement.textContent = mostUsedLanguage;

  averageStarsElement.textContent = averageStars;
}

// =========================================================
// DISPLAY REPOSITORIES
// =========================================================

function displayRepositories(repositories) {
  if (!repositoriesContainer) {
    return;
  }

  if (repositories.length === 0) {
    repositoriesContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⌘
                </div>

                <h3>
                    No repositories found
                </h3>

                <p>
                    No public repositories match your search.
                </p>

            </div>

        `;

    return;
  }

  repositoriesContainer.innerHTML = "";

  repositories.forEach(function (repo) {
    const repoCard = document.createElement("div");

    repoCard.classList.add("repo-card");

    const updatedDate = new Date(repo.updated_at);

    const formattedDate = updatedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const description = repo.description || "No description available.";

    const language = repo.language || "Unknown";

    repoCard.innerHTML = `

            <div class="repo-title-row">

                <h3
                    title="${escapeHTML(repo.name)}"
                >
                    ${escapeHTML(repo.name)}
                </h3>


                <a
                    href="${repo.html_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="repo-external-link"
                    title="Open repository"
                >
                    ↗
                </a>

            </div>


            <p class="repo-description">
                ${escapeHTML(description)}
            </p>


            <div class="repo-meta">

                <span>
                    ⭐ ${repo.stargazers_count || 0}
                </span>


                <span>
                    🍴 ${repo.forks_count || 0}
                </span>


                <span class="repo-language">

                    <span class="language-dot"></span>

                    ${escapeHTML(language)}

                </span>

            </div>


            <p class="repo-updated">
                Updated ${formattedDate}
            </p>


            <a
                href="${repo.html_url}"
                target="_blank"
                rel="noopener noreferrer"
                class="repo-view-btn"
            >

                View Repository

                <span>↗</span>

            </a>

        `;

    repositoriesContainer.appendChild(repoCard);
  });
}

// =========================================================
// REPOSITORY SEARCH
// =========================================================

if (repoSearch) {
  repoSearch.addEventListener("input", function () {
    const searchText = repoSearch.value.toLowerCase().trim();

    const filteredRepositories = allRepositories.filter(function (repo) {
      return repo.name.toLowerCase().includes(searchText);
    });

    displayRepositories(filteredRepositories);
  });
}

// =========================================================
// LOADING STATE
// =========================================================

function showLoading() {
  if (profileName) {
    profileName.textContent = "Loading profile...";
  }

  if (profileUsername) {
    profileUsername.textContent = "@loading";
  }

  if (profileBio) {
    profileBio.textContent = "Fetching GitHub profile data...";
  }

  if (repoCount) {
    repoCount.textContent = "...";
  }

  if (followersCount) {
    followersCount.textContent = "...";
  }

  if (followingCount) {
    followingCount.textContent = "...";
  }

  // Avatar

  const avatar = document.querySelector(".avatar");

  if (avatar) {
    avatar.innerHTML = `

            <span class="avatar-placeholder loading-avatar">
                ...
            </span>

        `;
  }

  // Repositories

  if (repositoriesContainer) {
    repositoriesContainer.innerHTML = `

            <div class="repo-loading">

                <div class="repo-loading-spinner"></div>

                <span class="repo-loading-text">
                    Loading repositories...
                </span>

            </div>

        `;
  }

  // Analytics

  ["totalRepos", "totalStars", "totalForks"].forEach(function (id) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = "...";
    }
  });

  // Languages

  const languageStats = document.getElementById("languageStats");

  if (languageStats) {
    languageStats.innerHTML = `

            <p class="language-empty">
                Loading language analytics...
            </p>

        `;
  }

  // Insights

  [
    "mostStarredRepo",
    "mostForkedRepo",
    "latestRepo",
    "mostUsedLanguage",
    "averageStars",
  ].forEach(function (id) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = "...";
    }
  });
}

// =========================================================
// ERROR STATE
// =========================================================

function showError(message) {
  if (profileName) {
    profileName.textContent = "User not found";
  }

  if (profileUsername) {
    profileUsername.textContent = "@unknown";
  }

  if (profileBio) {
    profileBio.textContent = message || "Unable to load GitHub profile.";
  }

  if (repoCount) {
    repoCount.textContent = "0";
  }

  if (followersCount) {
    followersCount.textContent = "0";
  }

  if (followingCount) {
    followingCount.textContent = "0";
  }

  // Reset avatar

  const avatar = document.querySelector(".avatar");

  if (avatar) {
    avatar.innerHTML = `

            <span class="avatar-placeholder">
                ?
            </span>

        `;
  }

  // Reset profile link

  if (githubProfileLink) {
    githubProfileLink.href = "#";
    githubProfileLink.removeAttribute("target");
  }

  // Reset status

  const statusDot = document.querySelector(".status-dot");

  if (statusDot) {
    statusDot.style.background = "";
  }

  // Reset analytics

  ["totalRepos", "totalStars", "totalForks"].forEach(function (id) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = "0";
    }
  });

  // Reset language

  const languageStats = document.getElementById("languageStats");

  if (languageStats) {
    languageStats.innerHTML = `

            <p class="language-empty">
                Search a valid GitHub profile to see language usage.
            </p>

        `;
  }

  // Reset insights

  [
    "mostStarredRepo",
    "mostForkedRepo",
    "latestRepo",
    "mostUsedLanguage",
    "averageStars",
  ].forEach(function (id) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = "—";
    }
  });

  // Repository error

  if (repositoriesContainer) {
    repositoriesContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    GitHub profile not found
                </h3>

                <p>
                    ${escapeHTML(
                      message || "Check the username and try again.",
                    )}
                </p>

            </div>

        `;
  }
}

// =========================================================
// TASK MANAGER
// =========================================================

function saveTasks() {
  localStorage.setItem("devpulseTasks", JSON.stringify(tasks));
}

function renderTasks() {
  if (!taskList) {
    return;
  }

  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `

            <p style="color:#666; font-size:13px;">
                No tasks yet. Add your first task!
            </p>

        `;
  } else {
    tasks.forEach(function (task) {
      const taskElement = document.createElement("div");

      taskElement.classList.add("task");

      taskElement.innerHTML = `

                <input
                    type="checkbox"
                    ${task.completed ? "checked" : ""}
                    data-id="${task.id}"
                >


                <span>
                    ${escapeHTML(task.text)}
                </span>


                <small
                    class="priority-badge ${task.priority || "medium"}"
                >
                    ${escapeHTML(task.priority || "medium")}
                </small>


                <button
                    class="delete-task"
                    data-id="${task.id}"
                    aria-label="Delete task"
                >
                    ×
                </button>

            `;

      taskList.appendChild(taskElement);
    });
  }

  updateTaskProgress();
}

// =========================================================
// TASK MODAL
// =========================================================

const taskModal = document.getElementById("taskModal");

const closeModal = document.getElementById("closeModal");

const cancelModal = document.getElementById("cancelModal");

const saveTaskBtn = document.getElementById("saveTaskBtn");

const taskInput = document.getElementById("taskInput");

const formError = document.getElementById("formError");

// =========================================================
// OPEN MODAL
// =========================================================

if (addTaskBtn) {
  addTaskBtn.addEventListener("click", function () {
    taskModal.classList.add("active");

    taskInput.focus();
  });
}

// =========================================================
// CLOSE MODAL
// =========================================================

function closeTaskModal() {
  if (!taskModal) {
    return;
  }

  taskModal.classList.remove("active");

  if (taskInput) {
    taskInput.value = "";
  }

  if (formError) {
    formError.textContent = "";
  }
}

if (closeModal) {
  closeModal.addEventListener("click", closeTaskModal);
}

if (cancelModal) {
  cancelModal.addEventListener("click", closeTaskModal);
}

// =========================================================
// CLOSE MODAL OUTSIDE
// =========================================================

if (taskModal) {
  taskModal.addEventListener("click", function (event) {
    if (event.target === taskModal) {
      closeTaskModal();
    }
  });
}

// =========================================================
// SAVE TASK
// =========================================================

if (saveTaskBtn) {
  saveTaskBtn.addEventListener("click", function () {
    const taskText = taskInput.value.trim();

    const selectedPriority = document.querySelector(
      'input[name="priority"]:checked',
    );

    if (!taskText) {
      formError.textContent = "Please enter a task.";

      taskInput.focus();

      return;
    }

    if (!selectedPriority) {
      formError.textContent = "Please select a priority.";

      return;
    }

    const newTask = {
      id: Date.now(),

      text: taskText,

      completed: false,

      priority: selectedPriority.value,
    };

    tasks.push(newTask);

    saveTasks();

    renderTasks();

    closeTaskModal();
  });
}

// =========================================================
// TASK ACTIONS
// =========================================================

if (taskList) {
  taskList.addEventListener("click", function (event) {
    const id = Number(event.target.dataset.id);

    // Complete / uncomplete

    if (event.target.type === "checkbox") {
      const task = tasks.find(function (task) {
        return task.id === id;
      });

      if (task) {
        task.completed = event.target.checked;

        saveTasks();

        renderTasks();
      }
    }

    // Delete

    if (event.target.classList.contains("delete-task")) {
      tasks = tasks.filter(function (task) {
        return task.id !== id;
      });

      saveTasks();

      renderTasks();
    }
  });
}

// =========================================================
// TASK PROGRESS
// =========================================================

function updateTaskProgress() {
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(function (task) {
    return task.completed;
  }).length;

  const pendingTasks = totalTasks - completedTasks;

  let percentage = 0;

  if (totalTasks > 0) {
    percentage = Math.round((completedTasks / totalTasks) * 100);
  }

  if (taskProgressText) {
    taskProgressText.textContent = `${completedTasks} / ${totalTasks}`;
  }

  if (taskProgressBar) {
    taskProgressBar.style.width = `${percentage}%`;
  }

  if (totalTaskCount) {
    totalTaskCount.textContent = totalTasks;
  }

  if (completedTaskCount) {
    completedTaskCount.textContent = completedTasks;
  }

  if (pendingTaskCount) {
    pendingTaskCount.textContent = pendingTasks;
  }
}

// =========================================================
// HTML ESCAPE
// Prevents API/user text from breaking the UI
// =========================================================

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================================
// LOAD SAVED TASKS
// =========================================================

renderTasks();
