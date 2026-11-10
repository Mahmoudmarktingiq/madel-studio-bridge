/*
 * MADEL Studio Bridge — Photoshop panel (UXP).
 * Developed by Mahmoud Adel.
 * Based in part on Brainferno MCP Bridge (Apache-2.0).
 */

const PANEL_VERSION = "0.3.4";

const el = (id) => document.getElementById(id);
const logEl = el("log");

function homeDir() {
  return require("os").homedir().split("\\").join("/");
}

// ---- logging (panel + mirror file; UXP fs has writeFileSync but no append) --
const LOG_PATH = homeDir() + "/.brainferno-mcp-bridge/panel-photoshop.log";
let logBuffer = "";
let logWriteError = null;
function log(msg) {
  const line = "[" + new Date().toLocaleTimeString() + "] " + msg;
  logEl.textContent += line + "\n";
  logEl.scrollTop = logEl.scrollHeight;
  console.log(line);
  logBuffer += line + "\n";
  try {
    require("fs").writeFileSync(LOG_PATH, logBuffer, "utf-8");
  } catch (e) {
    if (logWriteError === null) {
      logWriteError = e && e.message ? e.message : String(e);
      logEl.textContent += "[file log unavailable: " + logWriteError + "]\n";
    }
  }
}

function setStatus(state) {
  const b = el("status");
  b.textContent = state;
  b.className = "badge " + (state === "connected" ? "on" : "off");
}

// ---- handshake file --------------------------------------------------------
function readHandshake() {
  const hs = JSON.parse(require("fs").readFileSync(homeDir() + "/.brainferno-mcp-bridge/bridge.json", "utf-8"));
  log("handshake read OK: port=" + hs.port + " protocol=" + hs.protocolVersion + " pid=" + hs.pid);
  return hs;
}

// ---- named commands (protocol v2) — implemented in commands.js -----------
const commands = AcmPhotoshopCommands;

// ---- bridge client -------------------------------------------------------
const bridge = AcmBridgeClient.create({
  appId: "photoshop",
  panelVersion: PANEL_VERSION,
  commands,
  readHandshake,
  hostVersion: async () => require("uxp").host.version,
  overrides: () => ({ port: el("port").value, token: el("token").value }),
  log,
  onStatus: setStatus,
});

// ---- buttons -------------------------------------------------------------
el("connect").addEventListener("click", () => bridge.connect());
el("kill").addEventListener("click", () => bridge.kill());
el("clear").addEventListener("click", () => {
  logEl.textContent = "";
});
el("copy").addEventListener("click", async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.setContent) {
      await navigator.clipboard.setContent({ "text/plain": logEl.textContent });
      log("log copied to clipboard");
    } else {
      log("clipboard access is disabled by security hardening policy");
    }
  } catch (e) {
    log("clipboard access disabled: " + (e && e.message ? e.message : e));
  }
});

// ---- layout: size the log box from the real panel height -----------------
// UXP does not size body/flex children to the panel, so measure and set it.
function heightOf(id) {
  const n = el(id);
  if (!n) return 0;
  const r = n.getBoundingClientRect ? n.getBoundingClientRect() : null;
  return (r && r.height ? r.height : n.offsetHeight || 0) + 8;
}
let lastFit = -1;
function fitLog() {
  const total = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
  if (!total) return;
  const used = heightOf("r1") + heightOf("r2") + heightOf("r3") + heightOf("r4") + heightOf("r5") + heightOf("hint") + heightOf("r6") + 20;
  const h = Math.max(40, Math.floor(total - used));
  if (h !== lastFit) {
    lastFit = h;
    logEl.style.height = h + "px";
  }
}
window.addEventListener("resize", fitLog);
setInterval(fitLog, 400);
fitLog();

// ---- boot ---------------------------------------------------------------
log("---- MADEL Studio Bridge loaded (" + PANEL_VERSION + ") ----");
bridge.connect();
