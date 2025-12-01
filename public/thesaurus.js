/* -------------------------------------------------------
 *  ARMONIA THESAURUS TOOL — FRONTEND LOGIC
 *  Features:
 *   ✓ Line-numbered textarea
 *   ✓ Multi-line parsing
 *   ✓ Sends to Worker (/synonyms)
 *   ✓ Displays synonyms per-line
 * -----------------------------------------------------*/

// DOM references
const synInput = document.getElementById("synonym-input");
const synLineNumbers = document.getElementById("line-numbers");
const synButton = document.getElementById("synonym-analyze");
const synOutput = document.getElementById("synonym-output");

// Input validation
if (!synInput || !synLineNumbers || !synButton || !synOutput) {
  console.error("[Armonia Thesaurus] Missing expected DOM elements.");
}

/* -------------------------------------------------------
 *  Update Line Numbers on Input
 * -----------------------------------------------------*/
function updateLineNumbers() {
  const lines = synInput.value.split("\n").length;

  let html = "";
  for (let i = 1; i <= lines; i++) {
    html += i + "<br/>";
  }

  synLineNumbers.innerHTML = html;
}

synInput?.addEventListener("input", updateLineNumbers);
synInput?.addEventListener("keydown", (e) => {
  // Always update after Enter key
  setTimeout(updateLineNumbers, 0);
});

// Initialize numbers
updateLineNumbers();

/* -------------------------------------------------------
 *  Format the backend output into readable HTML
 * -----------------------------------------------------*/
function formatSynonymResponse(text) {
  if (!text.trim()) return "<p>No synonyms found.</p>";

  const lines = text.split("\n");

  let html = "";
  for (const line of lines) {
    // Example: "1. river – synonyms: waterway, stream..."
    if (/^\d+\./.test(line)) {
      html += `<div class="syn-line"><strong>${line}</strong></div>`;
    } else {
      html += `<div class="syn-detail">${line}</div>`;
    }
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
      body: JSON.stringify({ lines })
    });

    if (!resp.ok) {
      synOutput.innerHTML = "<p><strong>Error:</strong> Could not contact server.</p>";
      return;
    }

    const data = await resp.json();
    synOutput.innerHTML = formatSynonymResponse(data.output);

  } catch (err) {
    console.error("[Armonia Thesaurus] Network error:", err);
    synOutput.innerHTML = "<p><strong>Error:</strong> Network issue.</p>";
  }
}


synButton?.addEventListener("click", analyzeSynonyms);
