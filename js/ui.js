export const UI = {

  startOverlay: null,
  pauseOverlay: null,
  gameOverOverlay: null,

  crosshair: null,
  stats: null,
  inventory: null,

  settings: {
    musicMuted: false,
    stepsMuted: false
  },

  init(onStart) {

    // INVENTORY
    this.inventory = document.createElement("div");
    this.inventory.style.position = "fixed";
    this.inventory.style.top = "10px";
    this.inventory.style.left = "10px";
    this.inventory.style.color = "white";
    this.inventory.style.fontFamily = "monospace";
    this.inventory.style.fontSize = "16px";
    this.inventory.style.zIndex = "9999";
    this.inventory.innerText = "";
    document.body.appendChild(this.inventory);

    // STATS
    this.stats = document.createElement("div");
    this.stats.style.position = "fixed";
    this.stats.style.top = "10px";
    this.stats.style.right = "10px";
    this.stats.style.color = "white";
    this.stats.style.opacity = "0.85";
    this.stats.style.fontFamily = "monospace";
    this.stats.style.fontSize = "12px";
    this.stats.style.zIndex = "9999";
    this.stats.style.whiteSpace = "pre";
    this.stats.style.display = "none";
    this.stats.innerText = "FPS: --\nVitesse: --";
    document.body.appendChild(this.stats);

    // CROSSHAIR
    this.crosshair = document.createElement("div");
    this.crosshair.style.position = "fixed";
    this.crosshair.style.left = "50%";
    this.crosshair.style.top = "50%";
    this.crosshair.style.width = "10px";
    this.crosshair.style.height = "10px";
    this.crosshair.style.transform = "translate(-50%, -50%)";
    this.crosshair.style.borderRadius = "50%";
    this.crosshair.style.background = "rgba(255,255,255,0.8)";
    this.crosshair.style.boxShadow = "0 0 6px rgba(0,0,0,0.6)";
    this.crosshair.style.zIndex = "9999";
    this.crosshair.style.display = "none";
    document.body.appendChild(this.crosshair);

    this.showStart(onStart);
  },

  showStart(onStart) {

    if (this.startOverlay) this.startOverlay.remove();

    this.startOverlay = document.createElement("div");
    this.startOverlay.style.position = "fixed";
    this.startOverlay.style.inset = "0";
    this.startOverlay.style.background = "rgba(0,0,0,0.88)";
    this.startOverlay.style.display = "flex";
    this.startOverlay.style.alignItems = "center";
    this.startOverlay.style.justifyContent = "center";
    this.startOverlay.style.zIndex = "10000";
    document.body.appendChild(this.startOverlay);

    const panel = document.createElement("div");
    panel.style.width = "360px";
    panel.style.background = "#101217";
    panel.style.border = "1px solid rgba(255,255,255,0.12)";
    panel.style.borderRadius = "14px";
    panel.style.padding = "18px";
    panel.style.color = "white";
    panel.style.fontFamily = "Arial, sans-serif";
    panel.style.boxShadow = "0 14px 40px rgba(0,0,0,0.55)";
    this.startOverlay.appendChild(panel);

    panel.innerHTML = `
      <div style="font-size:26px; font-weight:700; margin-bottom:6px;">VBMaze</div>
      <div style="opacity:0.8; margin-bottom:14px;">Mini FPS labyrinthe (Three.js vanilla)</div>

      <div style="margin:10px 0 14px 0; padding:12px; background:#0b0d12; border-radius:10px;">
        <label style="display:block; margin-bottom:10px;">
          <input type="checkbox" id="music" style="transform:scale(1.1); margin-right:8px;">
          Mute musique
        </label>
        <label style="display:block;">
          <input type="checkbox" id="steps" style="transform:scale(1.1); margin-right:8px;">
          Mute pas
        </label>
      </div>

      <button id="startBtn" style="
        width:100%;
        padding:10px 12px;
        font-size:16px;
        font-weight:600;
        border-radius:10px;
        border:0;
        cursor:pointer;
      ">Start</button>

      <div style="margin-top:10px; opacity:0.7; font-size:12px; line-height:1.4;">
        Start active le pointer-lock et l'audio (si non muté<br>
        ESC = pause / menu.
      </div>
    `;

    const music = panel.querySelector("#music");
    const steps = panel.querySelector("#steps");
    const startBtn = panel.querySelector("#startBtn");

    music.checked = this.settings.musicMuted;
    steps.checked = this.settings.stepsMuted;

    startBtn.onclick = () => {
      this.settings.musicMuted = music.checked;
      this.settings.stepsMuted = steps.checked;

      this.startOverlay.style.display = "none";
      this.crosshair.style.display = "block";
      this.stats.style.display = "block";

      onStart();
    };
  },

  showPause(onResume, onQuitToMenu) {

    if (this.pauseOverlay) this.pauseOverlay.remove();

    this.pauseOverlay = document.createElement("div");
    this.pauseOverlay.style.position = "fixed";
    this.pauseOverlay.style.inset = "0";
    this.pauseOverlay.style.background = "rgba(0,0,0,0.88)";
    this.pauseOverlay.style.display = "flex";
    this.pauseOverlay.style.alignItems = "center";
    this.pauseOverlay.style.justifyContent = "center";
    this.pauseOverlay.style.zIndex = "10001";

    const panel = document.createElement("div");
    panel.style.width = "320px";
    panel.style.background = "#101217";
    panel.style.border = "1px solid rgba(255,255,255,0.12)";
    panel.style.borderRadius = "14px";
    panel.style.padding = "16px";
    panel.style.color = "white";
    panel.style.fontFamily = "Arial, sans-serif";
    this.pauseOverlay.appendChild(panel);

    panel.innerHTML = `
      <div style="font-size:22px; font-weight:700; margin-bottom:12px;">Pause</div>
      <button id="resume" style="width:100%; padding:10px; border-radius:10px; border:0; cursor:pointer; font-weight:600;">Resume</button>
      <div style="height:10px"></div>
      <button id="quit" style="width:100%; padding:10px; border-radius:10px; border:0; cursor:pointer;">Quitter (menu)</button>
    `;

    panel.querySelector("#resume").onclick = () => {
      this.pauseOverlay.remove();
      this.pauseOverlay = null;
      onResume();
    };

    panel.querySelector("#quit").onclick = () => {
      if (this.pauseOverlay) this.pauseOverlay.remove();
      this.pauseOverlay = null;
      onQuitToMenu();
    };

    document.body.appendChild(this.pauseOverlay);
  },

  hidePause() {
    if (this.pauseOverlay) this.pauseOverlay.remove();
    this.pauseOverlay = null;
  },

  showGameOver(onRestart, onQuitToMenu) {

    if (this.gameOverOverlay) this.gameOverOverlay.remove();

    this.gameOverOverlay = document.createElement("div");
    this.gameOverOverlay.style.position = "fixed";
    this.gameOverOverlay.style.inset = "0";
    this.gameOverOverlay.style.background = "rgba(0,0,0,0.95)";
    this.gameOverOverlay.style.color = "white";
    this.gameOverOverlay.style.display = "flex";
    this.gameOverOverlay.style.flexDirection = "column";
    this.gameOverOverlay.style.alignItems = "center";
    this.gameOverOverlay.style.justifyContent = "center";
    this.gameOverOverlay.style.zIndex = "10002";

    const title = document.createElement("div");
    title.style.fontFamily = "Arial, sans-serif";
    title.style.fontSize = "44px";
    title.style.fontWeight = "800";
    title.style.marginBottom = "10px";
    title.innerText = "YOU LOST";

    const sub = document.createElement("div");
    sub.style.opacity = "0.8";
    sub.style.marginBottom = "16px";
    sub.style.fontFamily = "Arial, sans-serif";
    sub.innerText = "Essaie encore.";

    const restart = document.createElement("button");
    restart.innerText = "Restart";
    restart.style.padding = "10px 14px";
    restart.style.borderRadius = "10px";
    restart.style.border = "0";
    restart.style.cursor = "pointer";
    restart.style.fontWeight = "600";
    restart.style.marginBottom = "10px";

    const quit = document.createElement("button");
    quit.innerText = "Quitter (menu)";
    quit.style.padding = "10px 14px";
    quit.style.borderRadius = "10px";
    quit.style.border = "0";
    quit.style.cursor = "pointer";

    restart.onclick = onRestart;
    quit.onclick = onQuitToMenu;

    this.gameOverOverlay.appendChild(title);
    this.gameOverOverlay.appendChild(sub);
    this.gameOverOverlay.appendChild(restart);
    this.gameOverOverlay.appendChild(quit);

    document.body.appendChild(this.gameOverOverlay);
  },

  hideGameOver() {
    if (this.gameOverOverlay) this.gameOverOverlay.remove();
    this.gameOverOverlay = null;
  },

  setInventory(text) {
    if (!this.inventory) return;
    this.inventory.innerText = text;
  },

  setStats({ fps, speed }) {
    if (!this.stats) return;
    const fpsTxt = (typeof fps === "number") ? fps.toFixed(0) : "--";
    const spdTxt = (typeof speed === "number") ? speed.toFixed(2) : "--";
    this.stats.innerText = `FPS: ${fpsTxt}\nVitesse: ${spdTxt}`;
  }

};
