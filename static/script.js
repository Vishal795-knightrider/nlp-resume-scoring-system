/* =============================================================================
   script.js — Resume Fitness Scoring System v3
   All frontend logic: PDF upload, scoring API calls, results rendering
   ============================================================================= */


/* ── PDF Upload Logic ────────────────────────────────────────────────────── */

/**
 * Triggered when user picks a PDF file.
 * Sends it to /upload-pdf, then fills the resume textarea with extracted text.
 */
async function onPdfChange(input) {
  const file = input.files[0];
  if (!file) return;

  setUploadStatus("loading", "⏳ Extracting text from PDF...");

  const formData = new FormData();
  formData.append("resume_pdf", file);          // key must match Flask route

  try {
    const res  = await fetch("/upload-pdf", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      setUploadStatus("error", "❌ " + data.error);
      input.value = "";
      return;
    }

    document.getElementById("resume").value = data.text;
    setUploadStatus(
      "success",
      `✅ ${file.name}  ·  ${data.pages} page${data.pages !== 1 ? "s" : ""}  ·  ${data.text.length} chars`
    );

  } catch (err) {
    setUploadStatus("error", "❌ Upload failed. Is the server running?");
    input.value = "";
  }
}

/**
 * Update upload status pill.
 * @param {string} state   - "loading" | "success" | "error"
 * @param {string} message - Text to display
 */
function setUploadStatus(state, message) {
  const el     = document.getElementById("uploadStatus");
  const textEl = document.getElementById("uploadStatusText");
  el.className = "upload-status visible " + state;
  textEl.textContent = message;
}

/** Reset the PDF upload area and clear the resume textarea. */
function clearPdf() {
  document.getElementById("pdfInput").value  = "";
  document.getElementById("resume").value    = "";
  document.getElementById("uploadStatus").className = "upload-status";
}

// Drag-and-drop visual feedback
document.addEventListener("DOMContentLoaded", () => {
  const zone = document.getElementById("uploadZone");
  if (!zone) return;
  zone.addEventListener("dragover",  (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
  zone.addEventListener("dragleave", ()  => zone.classList.remove("drag-over"));
  zone.addEventListener("drop",      (e) => { e.preventDefault(); zone.classList.remove("drag-over"); });
});


/* ── Sample Loader ───────────────────────────────────────────────────────── */

async function loadSample(idx) {
  const res  = await fetch(`/sample/${idx}`);
  const data = await res.json();

  // ✅ pehle clear karo (PDF state reset)
  clearPdf();

  // ✅ fir sample data fill karo
  document.getElementById("resume").value = data.resume;
  document.getElementById("jd").value     = data.jd;

  document.getElementById("results").style.display = "none";
}


/* ── Main Analyze Function ───────────────────────────────────────────────── */

async function analyze() {
  const resume = document.getElementById("resume").value.trim();
  const jd     = document.getElementById("jd").value.trim();
  const errEl  = document.getElementById("errorMsg");
  const btn    = document.getElementById("analyzeBtn");

  errEl.style.display = "none";

  if (!resume || !jd) {
    errEl.textContent    = "Please provide both a resume and a job description.";
    errEl.style.display  = "block";
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Analyzing...";

  try {
    const res  = await fetch("/score", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ resume, jd })
    });
    const data = await res.json();

    if (data.error) {
      errEl.textContent   = data.error;
      errEl.style.display = "block";
      return;
    }

    displayResults(data);

  } catch (e) {
    errEl.textContent   = "Server error. Make sure the app is running.";
    errEl.style.display = "block";
  } finally {
    btn.disabled    = false;
    btn.textContent = "⚡ Analyze Match";
  }
}


/* ── Results Rendering ───────────────────────────────────────────────────── */

function displayResults(data) {
  document.getElementById("results").style.display = "block";
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "nearest" });

  renderScoreCard(data);
  renderStats(data);
  renderMatchedKeywords(data.matched_keywords);
  renderMissingKeywords(data.missing_keywords);   // NEW
  renderSuggestions(data.suggestions);            // NEW
  renderResumeSummary(data.resume_summary);       // NEW
}

/* Score card with animated counter and progress bar */
function renderScoreCard(data) {
  // Animated score counter
  const scoreEl = document.getElementById("scoreDisplay");
  let current   = 0;
  const target  = data.score;
  const step    = target / 60;
  const iv      = setInterval(() => {
    current = Math.min(current + step, target);
    scoreEl.textContent = current.toFixed(1) + "%";
    if (current >= target) clearInterval(iv);
  }, 16);

  // Progress bar
  setTimeout(() => {
    document.getElementById("barFill").style.width = data.score + "%";
  }, 100);

  // Grade badge
  const gradeEl     = document.getElementById("gradeBadge");
  gradeEl.textContent = `${data.grade}  —  ${data.label}`;
  gradeEl.className   = `grade-badge grade-${data.grade}`;
}

/* Stats row */
function renderStats(data) {
  document.getElementById("statScore").textContent = data.score + "%";
  document.getElementById("statKw").textContent    = data.total_matched;
  document.getElementById("statGrade").textContent = data.grade;
}

/* Matched keywords tags */
function renderMatchedKeywords(keywords) {
  const el = document.getElementById("matchedKeywords");
  el.innerHTML = "";
  if (!keywords || keywords.length === 0) {
    el.innerHTML = '<span class="kw-empty">No significant keywords matched.</span>';
    return;
  }
  keywords.forEach((kw, i) => {
    const tag = document.createElement("span");
    tag.className   = i < 3 ? "kw-tag kw-top" : "kw-tag";
    tag.textContent = kw;
    el.appendChild(tag);
  });
}

/* Missing keywords tags — NEW */
function renderMissingKeywords(keywords) {
  const el = document.getElementById("missingKeywords");
  el.innerHTML = "";
  if (!keywords || keywords.length === 0) {
    el.innerHTML = '<span class="kw-empty">🎉 No significant keywords missing!</span>';
    return;
  }
  keywords.forEach(kw => {
    const tag = document.createElement("span");
    tag.className   = "kw-tag kw-missing";
    tag.textContent = kw;
    el.appendChild(tag);
  });
}

/* Suggestions list — NEW */
function renderSuggestions(suggestions) {
  const el = document.getElementById("suggestionsList");
  el.innerHTML = "";
  if (!suggestions || suggestions.length === 0) {
    el.innerHTML = '<li class="suggestion-item">No specific suggestions — great resume!</li>';
    return;
  }
  suggestions.forEach(s => {
    const li = document.createElement("li");
    li.className   = "suggestion-item";
    li.textContent = s;
    el.appendChild(li);
  });
}

/* Resume summary panel — NEW */
function renderResumeSummary(summary) {
  if (!summary) return;

  document.getElementById("summaryWordCount").textContent  = summary.word_count;
  document.getElementById("summarySkillCount").textContent = summary.skill_count;
  document.getElementById("summaryCharCount").textContent  = summary.char_count;

  // Detected sections badges
  const sectionsEl = document.getElementById("summarySections");
  sectionsEl.innerHTML = "";
  if (summary.detected_sections && summary.detected_sections.length > 0) {
    summary.detected_sections.forEach(sec => {
      const badge = document.createElement("span");
      badge.className   = "section-badge";
      badge.textContent = sec;
      sectionsEl.appendChild(badge);
    });
  } else {
    sectionsEl.innerHTML = '<span class="kw-empty">No standard sections detected.</span>';
  }

  // Detected skills tags
  const skillsEl = document.getElementById("summarySkills");
  skillsEl.innerHTML = "";
  if (summary.detected_skills && summary.detected_skills.length > 0) {
    summary.detected_skills.forEach(skill => {
      const tag = document.createElement("span");
      tag.className   = "kw-tag kw-skill";
      tag.textContent = skill;
      skillsEl.appendChild(tag);
    });
  } else {
    skillsEl.innerHTML = '<span class="kw-empty">No known tech skills detected.</span>';
  }
}