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
      body: JSON.stringify({ lines })
    });

    if (!resp.ok) {
      synOutput.innerHTML = "<p><strong>Error:</strong> Could not contact server.</p>";
      return;
    }

    const data = await resp.json();
    synOutput.innerHTML = renderMarkdown(data.output);

  } catch (err) {
    console.error("[Armonia Thesaurus] Network error:", err);
    synOutput.innerHTML = "<p><strong>Error:</strong> Network issue.</p>";
  }
}


synButton?.addEventListener("click", analyzeSynonyms);

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


