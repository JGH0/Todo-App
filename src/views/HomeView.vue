<template>
  <div>
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
  </div>
</template>

<style scoped>
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
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
