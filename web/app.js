const log = document.getElementById("log");
const form = document.getElementById("chat");
const msg = document.getElementById("msg");
const startBtn = document.getElementById("start");
const topicEl = document.getElementById("topic");
const stanceEl = document.getElementById("stance");

const userId = localStorage.getItem("debate_user") || crypto.randomUUID();
localStorage.setItem("debate_user", userId);

function add(role, text) {
  const div = document.createElement("div");
  div.className = role;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

startBtn.addEventListener("click", () => {
  const topic = topicEl.value.trim();
  if (!topic) return alert("Pick a topic first");
  form.hidden = false;
  add("system", `Topic: ${topic} | Your stance: ${stanceEl.value.toUpperCase()}`);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = msg.value.trim();
  if (!text) return;
  const topic = topicEl.value.trim();
  const stance = stanceEl.value;

  add("user", text);
  msg.value = "";
  try {
    const res = await fetch("/api/debate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        topic,
        userMessage: text,
        userStance: stance
      })
    });
    const data = await res.json();
    add("bot", data.rebuttal);
  } catch (e) {
    add("system", "Error contacting server");
  }
});
