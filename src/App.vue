<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="user">User XY</div>

      <nav class="top-links">
        <button class="nav-btn">+ Add a Task</button>
        <button class="nav-btn">Search</button>
        <button class="nav-btn">Filters</button>
        <button class="nav-btn">Ask AI</button>
      </nav>

      <div class="section-title">Favorites</div>
      <ul class="list">
        <li>Work</li>
        <li>Home</li>
        <li>Personal</li>
      </ul>

      <button class="settings">Settings</button>
    </aside>

    <main class="content">
      <div class="window-head">
        <span>Main Todo</span>
        <button class="close-btn">x</button>
      </div>

      <section class="card">
        <div class="row">
          <label for="task-title">Aufgabe erstellen</label>
          <input id="task-title" type="text" placeholder="Einkaufen" />
        </div>

        <div class="row toggles">
          <label><input type="checkbox" /> Sync</label>
          <label><input type="checkbox" /> Erinnerung</label>
          <label><input type="checkbox" /> Wiederholen</label>
        </div>

        <div class="row">
          <label>Kategorie</label>
          <div class="chips">
            <button class="chip active">Freizeit</button>
            <button class="chip">Alltag</button>
            <button class="chip">Schule</button>
          </div>
        </div>

        <div class="row two-col">
          <div>
            <label for="task-date">Datum</label>
            <input id="task-date" type="date" />
          </div>
          <div>
            <label for="task-time">Zeit</label>
            <input id="task-time" type="time" />
          </div>
        </div>

        <button class="save-btn">Save</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
  background: #f5f5f5;
  color: #222;
}

.sidebar {
  border-right: 1px solid #d9d9d9;
  padding: 20px 16px;
  background: #fff;
}

.user {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 18px;
}

.top-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.nav-btn,
.settings {
  background: transparent;
  border: 0;
  text-align: left;
  padding: 6px 0;
  color: #333;
  cursor: pointer;
}

.section-title {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
  margin-top: 10px;
  font-weight: 600;
}

.list {
  margin: 10px 0 14px;
  padding: 0;
  list-style: none;
}

.list li {
  padding: 6px 0;
}

.content {
  padding: 20px;
}

.window-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.close-btn {
  border: 1px solid #bbb;
  background: #fff;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.card {
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 18px;
  width: 100%;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.row label {
  font-weight: 600;
}

input {
  border: 1px solid #cfcfcf;
  background: #fff;
  padding: 10px;
  font-size: 14px;
}

.toggles {
  flex-direction: row;
  gap: 24px;
  flex-wrap: wrap;
}

.toggles label {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  border: 1px solid #cfcfcf;
  background: #fff;
  padding: 8px 12px;
  cursor: pointer;
}

.chip.active {
  border-color: #555;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.save-btn {
  border: 1px solid #bbb;
  background: #f3f3f3;
  border-radius: 18px;
  padding: 9px 22px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid #d9d9d9;
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
