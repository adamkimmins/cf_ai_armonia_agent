/* -------------------------------------------------------
 *  ARMONIA THESAURUS TOOL — FRONTEND LOGIC (Simplified)
 *  Features:
 *    Line-numbered textarea (counts wrapped + blank lines)
 *    Auto-comma on Enter for user-created lines only
 *    Sends lines to Worker (/synonyms)
 *    Displays markdown output
 * -----------------------------------------------------*/

// DOM references
const synInput = document.getElementById("synonym-input");
const synLineNumbers = document.getElementById("line-numbers");
const synButton = document.getElementById("synonym-analyze");
const synOutput = document.getElementById("synonym-output");

//TODO 1
const mirror = document.createElement("div");
mirror.id = "synonym-mirror";
document.body.appendChild(mirror);

// Input validation
if (!synInput || !synLineNumbers || !synButton || !synOutput) {
  console.error("[Armonia Thesaurus] Missing expected DOM elements.");
}

/* -------------------------------------------------------
 *  Line Numbering (no mirror, uses textarea metrics)
 * -----------------------------------------------------*/
/**
 * Returns the number of visible lines in the textarea,
 * including soft-wrapped lines and blank lines.
 */
//TODO 2
function getVisibleLineCount() {
  // Copy styling
  const cs = window.getComputedStyle(synInput);

  mirror.style.width = synInput.clientWidth + "px";
  mirror.style.font = cs.font;
  mirror.style.lineHeight = cs.lineHeight;
  mirror.style.padding = cs.padding;
  mirror.style.border = "none";
  mirror.style.letterSpacing = cs.letterSpacing;
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.overflowWrap = "break-word";

  // Set mirror text, DO NOT DELETE
  // Fixes ENTER bug + eliminates the double line /w only if-else
  if (synInput.value.length === 0) {
    mirror.textContent = "";
  } else {
    mirror.textContent = synInput.value + "\u200B";
  }
  
  // Compute number of lines
  const lineHeight = parseFloat(cs.lineHeight);
  const height = mirror.scrollHeight;

  return Math.max(1, Math.round(height / lineHeight));
}

//For the left line numbers
function updateLineNumbers() {
  let count = getVisibleLineCount();

  if (synInput.value.length > 0 && count > 1) {
    count -= 1;
  }

  let html = "";
  for (let i = 1; i <= count; i++) {
    html += i + "<br>";
  }
  synLineNumbers.innerHTML = html;

  synLineNumbers.scrollTop = synInput.scrollTop;
}

// Update on input, scroll, and resize
synInput.addEventListener("input", updateLineNumbers);
synInput.addEventListener("scroll", () => {
  synLineNumbers.scrollTop = synInput.scrollTop;
});
window.addEventListener("resize", updateLineNumbers);

// Initial render call
updateLineNumbers();

/* -------------------------------------------------------
 *  Auto-comma when user hits Enter
 *  eg:
 *   - Only when ENTER is pressed
 *   - Only on the line before the cursor
 *   - Only if that line has non-whitespace content
 *   - Wrapping doesnt add commas
 * -----------------------------------------------------*/

synInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  const value = synInput.value;
  const selectionStart = synInput.selectionStart;
  const selectionEnd = synInput.selectionEnd;

  // If user is selecting a range, don't mess with it
  if (selectionStart !== selectionEnd) {
    return;
  }

  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionStart);

  // Find the current line
  const lastNewline = before.lastIndexOf("\n");
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  const lineText = before.slice(lineStart);

  // Decide whether to add a comma
  let newBefore = before;

  const trimmed = lineText.trim();
  if (trimmed.length > 0 && !trimmed.endsWith(",")) {
    // Preserve any trailing spaces after the last non-space char
    const trailingMatch = lineText.match(/\s*$/);
    const trailingSpacesLen = trailingMatch ? trailingMatch[0].length : 0;

    const beforeWithoutTrailing =
      before.slice(0, before.length - trailingSpacesLen);
    const trailingSpaces = before.slice(before.length - trailingSpacesLen);

    newBefore = beforeWithoutTrailing + "," + trailingSpaces;
  }

  const newValue = newBefore + "\n" + after;
  const newCaretPos = newBefore.length + 1; // after the newline

  synInput.value = newValue;
  synInput.setSelectionRange(newCaretPos, newCaretPos);

  e.preventDefault();
  updateLineNumbers();
});


//MIRROR for my caret position - TODO

const caretMirror = document.createElement("div");
caretMirror.id = "caret-mirror";
document.body.appendChild(caretMirror);

//Highlights active line - TODO
let currentActiveLine = 1;

// function updateActiveLineHighlight() {
//   const cs = window.getComputedStyle(synInput);
//   const lineHeight = parseFloat(cs.lineHeight);
//   const scrollTop = synInput.scrollTop;

//   // Find cursor position
//   const caretIndex = synInput.selectionStart;
//   const textUpToCaret = synInput.value.slice(0, caretIndex);
//   const lineNumber = textUpToCaret.split("\n").length;

//   currentActiveLine = lineNumber;

//   // Position highlight
//   const top = (lineNumber - 1) * lineHeight - scrollTop;

//   const hl = document.getElementById("active-line-highlight");

//   hl.style.top = top + "px";
//   hl.style.height = lineHeight + "px";
//   hl.style.display = "block";  // reveal
// }

function updateActiveLineHighlight() {
  const cs = window.getComputedStyle(synInput);
  const lh = parseFloat(cs.lineHeight);

  // Prepare mirror
  caretMirror.style.width = synInput.clientWidth + "px";
  caretMirror.style.font = cs.font;
  caretMirror.style.lineHeight = cs.lineHeight;
  caretMirror.style.padding = cs.padding;

  // TEXT BEFORE AND AFTER CARET
  const pos = synInput.selectionStart;
  const text = synInput.value;

  const before = text.slice(0, pos)
    .replace(/\n/g, "\n"); // keep newlines

  const after = text.slice(pos);

  // Insert marker
  caretMirror.innerHTML =
    before +
    `<span id="caret-marker">|</span>` +
    after;

  // Read caret position in pixels
  const marker = document.getElementById("caret-marker");
  const caretTop = marker.offsetTop - synInput.scrollTop;

  // Move highlight
  const hl = document.getElementById("active-line-highlight");

  hl.style.top = caretTop + "px";
  hl.style.height = lh + "px";
  hl.style.display = "block";

  // Save visual line
  currentActiveLine = Math.round((marker.offsetTop + 1) / lh);
}


synInput.addEventListener("keyup", updateActiveLineHighlight);
synInput.addEventListener("click", updateActiveLineHighlight);
synInput.addEventListener("input", updateActiveLineHighlight);
synInput.addEventListener("scroll", updateActiveLineHighlight);

//End Frontend


       //  BACKEND LOGIC


/* -------------------------------------------------------
 *  Format the backend output into readable HTML
 *  (kept from your original code)
 * -----------------------------------------------------*/
function formatSynonymResponse(data) {
  if (!data || (!data.normal?.length && !data.slang?.length)) {
    return "<p>No synonyms found.</p>";
  }

  let html = "";

  // Normal Synonyms
  if (data.normal?.length) {
    html += `<div class="syn-section"><h3>Synonyms</h3>`;
    data.normal.slice(0, 5).forEach((syn) => {
      html += `<div class="syn-word">• ${syn}</div>`;
    });
    html += `</div>`;
  }

  // Slang / Loose / Dialect Synonyms
  if (data.slang?.length) {
    html += `<div class="syn-section"><h3>Slang / Loose</h3>`;
    data.slang.slice(0, 5).forEach((syn) => {
      html += `<div class="syn-slang">• ${syn}</div>`;
    });
    html += `</div>`;
  }

  return html;
}

/* -------------------------------------------------------
 *  Send to Worker → Display Output
 * -----------------------------------------------------*/
async function analyzeSynonyms() {
  const text = synInput.value.trim();
  if (!text) {
    synOutput.innerHTML = "<em>Enter lyrics or text for analysis.</em>";
    return;
  }

  const lines = text.split("\n");

  synOutput.innerHTML = "<p><em>Analyzing…</em></p>";

  try {
    const resp = await fetch("/synonyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });

    if (!resp.ok) {
      synOutput.innerHTML =
        "<p><strong>Error:</strong> Could not contact server.</p>";
      return;
    }

    const data = await resp.json();
    synOutput.innerHTML = renderMarkdown(data.output);
  } catch (err) {
    console.error("[Armonia Thesaurus] Network error:", err);
    synOutput.innerHTML =
      "<p><strong>Error:</strong> Network issue.</p>";
  }
}

// For the Analyze Synonyms button
synButton?.addEventListener("click", analyzeSynonyms);

/* -------------------------------------------------------
 *  Minimal Markdown renderer (kept as-is)
 * -----------------------------------------------------*/
function renderMarkdown(md) {
  if (!md) return "";

  let html = md;

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Headings (#, ##, ###)
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Numbered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gim, "<ol>$1</ol>");

  // Bullet lists
  html = html.replace(/^\s*-\s+(.*)$/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");

  // Line breaks → <br>
  html = html.replace(/\n/g, "<br>");

  return html.trim();
}