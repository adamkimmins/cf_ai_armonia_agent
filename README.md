# Armonia AI - Powered by Cloudflare Workers

Armonia AI provides three purpose-built modes to accelerate creative workflow:
 **Help Chatbot**, **Lyric Assistant**, and **Thesaurus Mode**.
Each mode is optimized for *speed, clarity, and musical context*, similar to how Cloudflare tools are optimized for performance and reliability.

*Link to Cloudflare hosted Website: https://cf_ai_armonia.a-bellia.workers.dev/*

---
## Help Assistant

A built-in creative assistant for songwriting, arrangement, production, mixing, and workflow guidance.

### Key Features

* **Anchored Responses**
  The assistant stays within musical context -
  **no drifting** into off-topic discussions or unrelated domains.

* **Clean, Modern Chat Experience**

  * Auto-expanding input
  * Typing indicator
  * Scroll-managed history
  * Trimmed message backlog (25 max)
  * Markdown-enhanced replies

* **Production-Quality Knowledge**
  Ask about chord progressions, mic placement, EQ moves, structure, DAW workflow, etc.
  Responses remain concise, contextual, and actionable.

---

## Lyric Assistant

Generate style-accurate lyrics using **dialect**, **genre**, **tone**, and **diction** controls.

### Key Features

* **Dialect Control**
  Vocabulary, slang, cadence, and phrasing adapt to the selected dialect
  *(American, Southern, Bay Area, Celtic, Appalachian, etc.)*

* **Genre Awareness**
  Structure, imagery, themes, and pacing shift to match 1–2 chosen genres
  *(Folk, Indie Rock, Hip-Hop, Bluegrass, etc.)*

* **Tone Slider**
  Emotional profile mapped onto levels (Sad / Eerie / Nostalgic / Hopeful / Happy)

* **Diction Slider**
  Textual texture and clarity mapped to modes
  *(Conversational, Storytelling, Intimate, Poetic, Abstract)*

* **Instant Generation**
  Provide a description → receive fully styled lyrics that respect all parameters.

---

## Thesaurus Mode

An intelligent, real-time synonym engine tailored for lyrics and phrasing.
Works seamlessly inside a custom line-numbered text editor.

### Key Features

* **Auto-Analysis on `Enter`**
  Press `Enter` -> Armonia automatically:

  1. Extracts the last word
  2. Inserts a comma for line completion
  3. Creates a new line
  4. Instantly generates synonyms for the target word

* **Smart Target Selection**
  Priority order:

  1. Selected text
  2. Last word before Enter
  3. Entire active line

* **Custom Editor UI**

  * Accurate line numbering
  * Soft-wrap aware
  * Active line highlighting
  * Scroll-synced number gutter
  * Precise caret mirroring for correct positioning
  * Automatic comma-insertion rules for lyric structure

* **Consistent Output Format**
  The AI returns exactly:

  * **5 Normal Synonyms**
  * **5 Loose / Slang Synonyms**

  No intro text, no commentary, and fully markdown-formatted.

---

## Architecture Overview

Armonia AI uses three prompt modules:

```
/prompts/help_mode.txt
/prompts/writing_mode.txt
/prompts/thesaurus_mode.txt
```

Each mode injects parameters into a template system, producing stable, isolated behavior.

Cloudflare Workers handle:

* mode routing
* template rendering
* message passing
* AI model execution via `env.AI.run`

Result: **fast, isolated inference paths** with minimal cross-mode contamination.

                        ┌────────────────────────────────┐
                        │        User Interface           │
                        │  (Help Chat / Lyric / Thesaurus)│
                        └────────────────────────────────┘
                                      │
                                      ▼
                        ┌────────────────────────────────┐
                        │    Cloudflare Worker Router     │
                        │──────────────────────────────────│
                        │   /chat        → Help Mode       │
                        │   /lyric       → Writing Mode    │
                        │   /synonyms    → Thesaurus Mode  │
                        │   /rhyme       → Rhyme Engine    │
                        └────────────────────────────────┘
                                      │
                                      ▼
                        ┌────────────────────────────────┐
                        │     Mode-Specific Prompting     │
                        │──────────────────────────────────│
                        │ help_mode.txt     (Chat rules)   │
                        │ writing_mode.txt  (Songwriting)  │
                        │ thesaurus_mode.txt (Synonyms)    │
                        │ armonia_protocol   (Fallback)    │
                        └────────────────────────────────┘
                                      │
                                      ▼
                       ┌────────────────────────────────────┐
                       │         Template Engine             │
                       │────────────────────────────────────│
                       │ Injects:                            │
                       │   • {{MODE}}                        │
                       │   • {{DIALECT}}                     │
                       │   • {{GENRE}}                       │
                       │   • {{TONE}}                        │
                       │   • {{DICTION}}                     │
                       │   • {{TARGET}} (Thesaurus/Rhyme)    │
                       └────────────────────────────────────┘
                                      │
                                      ▼
                       ┌────────────────────────────────────┐
                       │       Cloudflare AI Inference       │
                       │        @cf/meta/llama-3.1-8b        │
                       │────────────────────────────────────│
                       │  env.AI.run(MODEL_ID, {messages})   │
                       │  Deterministic mode isolation       │
                       │  Markdown-safe outputs              │
                       └────────────────────────────────────┘
                                      │
                                      ▼
                        ┌────────────────────────────────┐
                        │     Worker JSON Serializer     │
                        │   extract() + markdown parser  │
                        └────────────────────────────────┘
                                      │
                                      ▼
                        ┌────────────────────────────────┐
                        │       Frontend Renderer         │
                        │──────────────────────────────────│
                        │ Help Chat → Markdown UI          │
                        │ Lyric Gen → Song Output Box      │
                        │ Thesaurus → Two-Column Synonyms  │
                        └────────────────────────────────┘


---
