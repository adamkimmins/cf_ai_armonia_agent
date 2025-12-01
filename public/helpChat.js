// const chatLog = document.getElementById("chat-log");
// // const form = document.getElementById("chat-form");
// const input = document.getElementById("chat-input");
// // const statusEl = document.getElementById("chat-status");
// const sendBtn = document.getElementById("chat-send");

// // Keep conversation on the client; we send it to the Worker each turn.
// const history = []; 

// function appendMessage(role, text) {
//     const row = document.createElement("div");
//     row.className = `msg-row ${role}`;

//     const bubble = document.createElement("div");
//     bubble.className = "msg-bubble";
//     bubble.textContent = text;

//     row.appendChild(bubble);
//     chatLog.appendChild(row);
//     chatLog.scrollTop = chatLog.scrollHeight;
// }

// async function sendMessage(message) {
//     statusEl.textContent = "Thinking…";
//     sendBtn.disabled = true;

//     try {
//         const resp = await fetch("/chat", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ history, message }),
//         });

//         if (!resp.ok) {
//             const errText = await resp.text();
//             statusEl.textContent = "Error from worker.";
//             console.error("Chat error:", errText);
//             return;
//         }

//         const data = await resp.json();
//         const answer = data.answer ?? "[No answer field returned]";

//         // Update history we send on subsequent turns
//         history.push({ role: "user", content: message });
//         history.push({ role: "assistant", content: answer });

//         appendMessage("assistant", answer);
//         statusEl.textContent = "";
//     } catch (err) {
//         console.error(err);
//         statusEl.textContent = "Network error.";
//     } finally {
//         sendBtn.disabled = false;
//     }
// }

// // Initial heading from /message (optional, but mirrors the old example)
// fetch("/message")
//     .then((resp) => resp.text())
//     .then((text) => {
//         if (text && text.trim()) {
//             headingEl.textContent = text;
//         }
//     })
//     .catch(() => { });

// // Start with a friendly assistant greeting
// appendMessage(
//     "assistant",
//     "Hey! I’m Armonia’s built-in assistant. Ask me about recording, mixing, or how to structure your song."
// );

// form.addEventListener("submit", (event) => {
//     event.preventDefault();
//     const value = input.value.trim();
//     if (!value) return;

//     input.value = "";
//     appendMessage("user", value);
//     sendMessage(value);
// });

/* -------------------------------------------------------
 *  ARMONIA HELP CHAT — ENHANCED VERSION
 *  Features:
 *   ✓ Animated typing indicator
 *   ✓ Auto-expanding input field
 *   ✓ Scrollable chat with history trimming (25 max)
 * -----------------------------------------------------*/

// DOM references
const helpLog = document.getElementById("help-chat-log");
const helpInput = document.getElementById("help-chat-input");
const helpSend = document.getElementById("help-chat-send");

// Internal message history (sent to backend)
let helpHistory = [];

// Maximum number of chat messages shown in the UI
const MAX_MESSAGES = 25;

// Typing indicator element (added dynamically)
let typingIndicator = null;

/* -------------------------------------------------------
 *  AUTO-EXPANDING INPUT (ChatGPT-style)
 * -----------------------------------------------------*/
helpInput?.addEventListener("input", () => {
  helpInput.style.height = "auto";            // reset
  helpInput.style.height = helpInput.scrollHeight + "px"; // adjust to content
});

/* -------------------------------------------------------
 *  Append message bubble to chat log
 * -----------------------------------------------------*/
function helpAppend(role, text) {
  if (!helpLog) return;

  const row = document.createElement("div");
  row.className = `msg-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  helpLog.appendChild(row);

  trimHistoryUI();
  scrollChatToBottom();
}

function scrollChatToBottom() {
  helpLog.scrollTop = helpLog.scrollHeight;
}

/* -------------------------------------------------------
 *  Trim UI chat history to keep it lightweight
 * -----------------------------------------------------*/
function trimHistoryUI() {
  const rows = helpLog.querySelectorAll(".msg-row");
  if (rows.length > MAX_MESSAGES) {
    // remove oldest messages
    const excess = rows.length - MAX_MESSAGES;
    for (let i = 0; i < excess; i++) {
      rows[i].remove();
    }
  }
}

/* -------------------------------------------------------
 *  Show / hide typing indicator
 * -----------------------------------------------------*/
function showTypingIndicator() {
  // if (typingIndicator) return; // already exists

  // typingIndicator = document.createElement("div");
  // typingIndicator.className = "msg-row assistant";

  // const bubble = document.createElement("div");
  // bubble.className = "msg-bubble";
  // bubble.innerHTML = `
  //   <span class="typing-dot"></span>
  //   <span class="typing-dot"></span>
  //   <span class="typing-dot"></span>
  // `;

  // typingIndicator.appendChild(bubble);
  // helpLog.appendChild(typingIndicator);

  // scrollChatToBottom();
  const typing = document.createElement("div");
    typing.classList.add("msg-row", "assistant");
    typing.id = "typing-indicator";
    typing.innerHTML = `
        <div class="msg-bubble">
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>`;
    helpLog.appendChild(typing);
    helpLog.scrollTop = helpLog.scrollHeight;
}

function hideTypingIndicator() {
  // if (typingIndicator) {
  //   typingIndicator.remove();
  //   typingIndicator = null;
  // }
  const el = document.getElementById("typing-indicator");
    if (el) el.remove();
}

/* -------------------------------------------------------
 *  Send message to worker
 * -----------------------------------------------------*/
async function helpSendMessage(message) {
  helpSend.disabled = true;
  showTypingIndicator();

  try {
    const resp = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: helpHistory,
        message: message
      })
    });

    hideTypingIndicator();

    if (!resp.ok) {
      helpAppend("assistant", "⚠️ Server error. Try again.");
      helpSend.disabled = false;
      return;
    }

    const data = await resp.json();
    const answer = data.answer || "⚠️ No response received.";

    helpHistory.push({ role: "user", content: message });
    helpHistory.push({ role: "assistant", content: answer });

    helpAppend("assistant", answer);

  } catch (e) {
    hideTypingIndicator();
    helpAppend("assistant", "⚠️ Network issue. Try again.");
  }

  helpSend.disabled = false;
}

/* -------------------------------------------------------
 *  User sends a message
 * -----------------------------------------------------*/
helpSend?.addEventListener("click", () => {
  const msg = helpInput.value.trim();
  if (!msg) return;

  helpInput.value = "";
  helpInput.style.height = "auto"; // reset expanded height

  helpAppend("user", msg);
  helpSendMessage(msg);
});

// ENTER to send
helpInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    helpSend.click();
  }
});

/* -------------------------------------------------------
 *  Initial greeting
 * -----------------------------------------------------*/
helpAppend(
  "assistant",
  "Hey! I'm Armonia’s help assistant. Ask me about recording, mixing, arranging, or how to use any feature!"
);
