/* -------------------------------------------------------
 *  ARMONIA THESAURUS TOOL - FRONTEND LOGIC (Simplified)
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
 *  Auto-comma when user hits Enter, Auto-analysis when user hits Enter
 *  eg:
 *   - Only when ENTER is pressed
 *   - Only on the line before the cursor, using the last word
 *   - Only if that line has non-whitespace content
 *   - Wrapping doesnt add commas
 * -----------------------------------------------------*/
function getWordBeforeComma(fullLine) {
  // Find the FIRST comma (or last — both work for your use case)
  const commaIndex = fullLine.indexOf(",");
  if (commaIndex === -1) return null;

  // Pull ONLY the text BEFORE the comma
  const beforeComma = fullLine.slice(0, commaIndex).trim();

  // Split into words (handles spaces, tabs, multiple gaps)
  const parts = beforeComma.split(/\s+/);

  // If nothing is found return null
  if (parts.length === 0) return null;

  // LAST token = the target word
  const target = parts[parts.length - 1];

  // Safety: remove punctuation like "." "?" "!" if trailing
  return target.replace(/[.,!?]+$/, "");
}

function getTargetBeforeComma(text) {
  const commaIndex = text.indexOf(",");
  if (commaIndex === -1) return null;

  // isolate everything before comma
  const before = text.slice(0, commaIndex).trim();

  // split into words and take LAST one
  const parts = before.split(/\s+/);
  const lastWord = parts[parts.length - 1];

  return lastWord || null;
}

// Automatically send target word to thesaurus API
function autoAnalyzeFromEnter(target) {
  synOutput.innerHTML = "<p><em>Analyzing…</em></p>";

  fetch("/synonyms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: [target] })   // Thesaurus expects "lines"
  })
    .then(res => res.json())
    .then(data => {
      synOutput.innerHTML = renderMarkdown(data.output);
    })
    .catch(err => {
      console.error(err);
      synOutput.innerHTML = "<p><strong>Error analyzing word.</strong></p>";
    });
}

// IMPORTANT: this is for user convenience when adding their own lines AND AUTO ANALYSIS
synInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  e.preventDefault(); // we handle newline manually

  const value = synInput.value;
  const selectionStart = synInput.selectionStart;
  const selectionEnd = synInput.selectionEnd;

  // If user is selecting a range, don't mess with it
  if (selectionStart !== selectionEnd) {
    return;
  }

 // ================================
// STEP 1 — Extract last word ONLY
// ================================
const caret = synInput.selectionStart;
const textBefore = synInput.value.slice(0, caret);

// Match last word before caret
const match = textBefore.match(/([\w'-]+)\s*$/);
const targetWord = match ? match[1] : null;

// Force backend to ONLY use this word
window.__thesaurusTarget = targetWord;


  // 2. If we found a word, send it to the backend RIGHT NOW
  if (targetWord) {
    window.__forcedThesaurusTarget = targetWord; 
    analyzeSynonyms(); // ← DO NOT pass targetWord
}
  // -----------------------------
  // 3. Now run your existing comma + newline logic
  // -----------------------------
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionStart);

  // Find the current line start
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

  updateLineNumbers();
});

//MIRROR for my caret position

const caretMirror = document.createElement("div");
caretMirror.id = "caret-mirror";
document.body.appendChild(caretMirror);

//Highlights active line
let currentActiveLine = 1;

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
 *  Send to Worker -> Display Output
 * -----------------------------------------------------*/
window.__forcedThesaurusTarget = null;

async function analyzeSynonyms() {
  const text = synInput.value.trim();
  if (!text) {
    synOutput.innerHTML = "<em>Enter lyrics or text for analysis.</em>";
    return;
  }

    const target = getThesaurusTarget();

    if (!target) {
      synOutput.innerHTML = "<p>No text selected or active line is empty.</p>";
      return;
    }

    synOutput.innerHTML = "<p><em>Analyzing…</em></p>";

    try {
      const resp = await fetch("/synonyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
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

// Get the accurate active line number (1-based)
function getAccurateActiveLine() {
  const text = synInput.value;
  const pos = synInput.selectionStart;

  // Count how many newline characters occur before caret
  return text.slice(0, pos).split("\n").length;
}

// For the Analyze Synonyms button
synButton?.addEventListener("click", analyzeSynonyms);

/* -------------------------------------------------------
 *  SEND TARGETED WORD/LINE TO WORKER MANUALLY
 * -----------------------------------------------------*/
function getThesaurusTarget() {

  if (window.__forcedThesaurusTarget) {
    const t = window.__forcedThesaurusTarget;
    window.__forcedThesaurusTarget = null;
    return t;
  }
  
  const text = synInput.value;
  const start = synInput.selectionStart;
  const end = synInput.selectionEnd;

  // --- Highlighted text takes priority ---
  const highlighted = text.slice(start, end).trim();
  if (highlighted.length > 0) {
    return highlighted;
  }

  // --- No highlight -> use active line ---
  const lines = text.split("\n");
  const activeLine = getAccurateActiveLine();
  const lineIndex = activeLine - 1;

  if (lineIndex >= 0 && lineIndex < lines.length) {
    const line = lines[lineIndex]?.trim();
    if (line.length > 0) return line;
  }

  // --- nothing found ---
  return null;
}