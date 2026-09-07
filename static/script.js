/* =============================================================================
   ResumeFit — Frontend Logic (script.js)
   Clean developer tool implementation.
   Preserves Flask API contracts (/upload-pdf, /score, /sample/<idx>).
   Strictly zero emojis in the UI.
   ============================================================================= */

/* ── Emoji Stripping Sanitizer ────────────────────────────────────────────── */
/**
 * Strips all Unicode emojis, emoticons, and decorative pictographs from backend text.
 */
function stripEmojis(text) {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── DOM Initializer ──────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  setupTextareaCounters();
  setupDragAndDrop();
});

/* ── Real-Time Character Counters ─────────────────────────────────────────── */
function setupTextareaCounters() {
  const resumeEl = document.getElementById("resume");
  const jdEl = document.getElementById("jd");
  const resumeCount = document.getElementById("resumeCharCount");
  const jdCount = document.getElementById("jdCharCount");

  const updateResume = () => {
    const count = resumeEl ? resumeEl.value.length : 0;
    if (resumeCount) resumeCount.textContent = `${count.toLocaleString()} chars`;
  };

  const updateJd = () => {
    const count = jdEl ? jdEl.value.length : 0;
    if (jdCount) jdCount.textContent = `${count.toLocaleString()} chars`;
  };

  if (resumeEl) {
    resumeEl.addEventListener("input", updateResume);
    updateResume();
  }
  if (jdEl) {
    jdEl.addEventListener("input", updateJd);
    updateJd();
  }
}

/* ── Quick Clear Buttons ──────────────────────────────────────────────────── */
function clearResumeText() {
  const el = document.getElementById("resume");
  if (el) {
    el.value = "";
    el.dispatchEvent(new Event("input"));
  }
  clearPdf();
}

function clearJdText() {
  const el = document.getElementById("jd");
  if (el) {
    el.value = "";
    el.dispatchEvent(new Event("input"));
  }
}

/* ── Error Banner ─────────────────────────────────────────────────────────── */
function showError(message) {
  const banner = document.getElementById("errorMsg");
  const text = document.getElementById("errorMsgText");
  if (text) text.textContent = stripEmojis(message);
  if (banner) {
    banner.classList.add("visible");
    banner.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function dismissError() {
  const banner = document.getElementById("errorMsg");
  if (banner) banner.classList.remove("visible");
}

/* ── Drag & Drop PDF Handling ─────────────────────────────────────────────── */
function setupDragAndDrop() {
  const zone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("pdfInput");
  if (!zone) return;

  ["dragenter", "dragover"].forEach(name => {
    zone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach(name => {
    zone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove("drag-over");
    });
  });

  zone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      if (fileInput) fileInput.files = files;
      onPdfChange({ files: files });
    }
  });
}

/* ── PDF Upload Logic (/upload-pdf) ───────────────────────────────────────── */
async function onPdfChange(input) {
  const file = input.files ? input.files[0] : null;
  if (!file) return;

  dismissError();

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showError("Only PDF files are supported.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError("File exceeds 5MB limit. Please upload a smaller PDF.");
    return;
  }

  setUploadStatus("loading", `Extracting text from ${file.name}...`);

  const formData = new FormData();
  formData.append("resume_pdf", file); // Route expects 'resume_pdf'

  try {
    const res = await fetch("/upload-pdf", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      setUploadStatus("error", stripEmojis(data.error));
      showError(stripEmojis(data.error));
      const pdfInput = document.getElementById("pdfInput");
      if (pdfInput) pdfInput.value = "";
      return;
    }

    const resumeArea = document.getElementById("resume");
    if (resumeArea) {
      resumeArea.value = data.text;
      resumeArea.dispatchEvent(new Event("input"));
    }

    setUploadStatus(
      "success",
      `${file.name} (${data.pages} page${data.pages !== 1 ? "s" : ""}, ${data.text.length.toLocaleString()} characters)`
    );

  } catch (err) {
    setUploadStatus("error", "Failed to process PDF.");
    showError("Could not extract text from PDF. You may paste your resume text directly.");
    const pdfInput = document.getElementById("pdfInput");
    if (pdfInput) pdfInput.value = "";
  }
}

function setUploadStatus(state, message) {
  const el = document.getElementById("uploadStatus");
  const textEl = document.getElementById("uploadStatusText");
  if (!el || !textEl) return;

  el.className = `upload-status visible ${state}`;
  textEl.textContent = stripEmojis(message);
}

function clearPdf() {
  const pdfInput = document.getElementById("pdfInput");
  if (pdfInput) pdfInput.value = "";

  const statusEl = document.getElementById("uploadStatus");
  if (statusEl) statusEl.className = "upload-status";
}

/* ── Sample Loader (/sample/<idx>) ────────────────────────────────────────── */
async function loadSample(idx) {
  dismissError();

  try {
    const res = await fetch(`/sample/${idx}`);
    if (!res.ok) throw new Error("Could not load sample");
    const data = await res.json();

    clearPdf();

    const resumeEl = document.getElementById("resume");
    const jdEl = document.getElementById("jd");

    if (resumeEl) {
      resumeEl.value = data.resume;
      resumeEl.dispatchEvent(new Event("input"));
    }
    if (jdEl) {
      jdEl.value = data.jd;
      jdEl.dispatchEvent(new Event("input"));
    }

    // Reset results visibility until user clicks Analyze
    const resultsEl = document.getElementById("results");
    const emptyEl = document.getElementById("emptyState");
    if (resultsEl) resultsEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";

    const workspace = document.getElementById("workspace");
    if (workspace) {
      workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  } catch (err) {
    showError("Could not load sample dataset. Verify the server is running.");
  }
}

/* ── Main Analyze Function (/score) ───────────────────────────────────────── */
async function analyze() {
  const resumeEl = document.getElementById("resume");
  const jdEl = document.getElementById("jd");
  const btn = document.getElementById("analyzeBtn");
  const loader = document.getElementById("analysisLoader");

  const resume = resumeEl ? resumeEl.value.trim() : "";
  const jd = jdEl ? jdEl.value.trim() : "";

  dismissError();

  if (!resume || !jd) {
    showError("Both resume and job description are required.");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Analyzing...";
  }
  if (loader) {
    loader.classList.add("active");
  }

  try {
    const res = await fetch("/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd })
    });
    const data = await res.json();

    if (data.error) {
      showError(stripEmojis(data.error));
      return;
    }

    displayResults(data);

  } catch (e) {
    showError("Server error while processing resume. Check terminal logs.");
  } finally {
    if (loader) loader.classList.remove("active");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Analyze Resume";
    }
  }
}

/* ── Results Rendering ────────────────────────────────────────────────────── */
function displayResults(data) {
  const resultsEl = document.getElementById("results");
  const emptyEl = document.getElementById("emptyState");

  if (emptyEl) emptyEl.style.display = "none";
  if (resultsEl) {
    resultsEl.style.display = "block";
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderScoreOverview(data);
  renderMetricsStrip(data);
  renderKeywords(data);
  renderSuggestions(data.suggestions);
  renderResumeSummary(data.resume_summary);

  const timestampEl = document.getElementById("resultsTimestamp");
  if (timestampEl) {
    timestampEl.textContent = `Analyzed ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

/* Score Overview with Gauge */
function renderScoreOverview(data) {
  const score = data.score;
  const scoreDisplay = document.getElementById("scoreDisplay");
  const gradeBadge = document.getElementById("gradeBadge");
  const scoreQualitative = document.getElementById("scoreQualitative");
  const gaugeProgress = document.getElementById("scoreGaugeProgress");
  const barFill = document.getElementById("barFill");

  // Animate numeric score counter
  if (scoreDisplay) {
    let current = 0;
    const target = score;
    const steps = 30;
    const increment = target / steps;
    const interval = setInterval(() => {
      current = Math.min(current + increment, target);
      scoreDisplay.textContent = current.toFixed(1) + "%";
      if (current >= target) {
        clearInterval(interval);
        scoreDisplay.textContent = target.toFixed(1) + "%";
      }
    }, 20);
  }

  // Circular gauge (radius 45 -> circumference ~282.74)
  if (gaugeProgress) {
    const circumference = 2 * Math.PI * 45;
    gaugeProgress.style.strokeDasharray = `${circumference}`;

    let strokeColor = "#2563EB";
    if (score >= 80) strokeColor = "#166534";
    else if (score >= 60) strokeColor = "#2563EB";
    else if (score >= 40) strokeColor = "#B45309";
    else strokeColor = "#991B1B";

    gaugeProgress.style.stroke = strokeColor;
    const offset = circumference - (score / 100) * circumference;
    setTimeout(() => {
      gaugeProgress.style.strokeDashoffset = `${offset}`;
    }, 40);
  }

  // Fallback linear bar fill
  if (barFill) {
    setTimeout(() => {
      barFill.style.width = `${Math.min(Math.max(score, 2), 100)}%`;
    }, 50);
  }

  // Grade badge & label (clean, without emojis)
  const cleanLabel = stripEmojis(data.label);
  if (gradeBadge) {
    gradeBadge.textContent = `Grade ${data.grade} — ${cleanLabel}`;
    gradeBadge.className = `score-grade-badge grade-${data.grade}`;
  }

  if (scoreQualitative) {
    if (score >= 80) scoreQualitative.textContent = "High Compatibility";
    else if (score >= 60) scoreQualitative.textContent = "Good Alignment";
    else if (score >= 40) scoreQualitative.textContent = "Moderate Alignment";
    else scoreQualitative.textContent = "Low Alignment";
  }
}

/* 4 Metrics Strip */
function renderMetricsStrip(data) {
  const statScore = document.getElementById("statScore");
  const statKw = document.getElementById("statKw");
  const statMissingCount = document.getElementById("statMissingCount");
  const statSkillCount = document.getElementById("statSkillCount");

  if (statScore) statScore.textContent = `${data.score}%`;
  if (statKw) statKw.textContent = data.total_matched;
  if (statMissingCount) statMissingCount.textContent = (data.missing_keywords || []).length;
  if (statSkillCount) {
    statSkillCount.textContent = data.resume_summary ? (data.resume_summary.skill_count || 0) : 0;
  }
}

/* Keyword Lists */
function renderKeywords(data) {
  // Matched Keywords
  const matchedContainer = document.getElementById("matchedKeywords");
  const matchedBadge = document.getElementById("matchedCountBadge");
  const matchedList = data.matched_keywords || [];

  if (matchedBadge) matchedBadge.textContent = matchedList.length;

  if (matchedContainer) {
    matchedContainer.innerHTML = "";
    if (matchedList.length === 0) {
      matchedContainer.innerHTML = '<span class="kw-none">No shared domain keywords identified.</span>';
    } else {
      matchedList.forEach(kw => {
        const pill = document.createElement("span");
        pill.className = "kw-pill kw-matched";
        pill.textContent = kw;
        matchedContainer.appendChild(pill);
      });
    }
  }

  // Missing Keywords
  const missingContainer = document.getElementById("missingKeywords");
  const missingBadge = document.getElementById("missingCountBadge");
  const missingList = data.missing_keywords || [];

  if (missingBadge) missingBadge.textContent = missingList.length;

  if (missingContainer) {
    missingContainer.innerHTML = "";
    if (missingList.length === 0) {
      missingContainer.innerHTML = '<span class="kw-none">No critical keywords are missing from the resume.</span>';
    } else {
      missingList.forEach(kw => {
        const pill = document.createElement("span");
        pill.className = "kw-pill kw-missing";
        pill.textContent = kw;
        missingContainer.appendChild(pill);
      });
    }
  }
}

/* Suggestions List (Clean numbered rows) */
function renderSuggestions(suggestions) {
  const listEl = document.getElementById("suggestionsList");
  if (!listEl) return;

  listEl.innerHTML = "";
  const items = suggestions || [];

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "suggestion-row";
    li.innerHTML = '<span class="suggestion-num">1.</span><span>No critical suggestions. The resume vocabulary aligns well with the job requirements.</span>';
    listEl.appendChild(li);
    return;
  }

  items.forEach((item, index) => {
    const cleanText = stripEmojis(item);
    const li = document.createElement("li");
    li.className = "suggestion-row";
    li.innerHTML = `<span class="suggestion-num">${index + 1}.</span><span>${cleanText}</span>`;
    listEl.appendChild(li);
  });
}

/* Resume Summary & Insights */
function renderResumeSummary(summary) {
  if (!summary) return;

  const wordEl = document.getElementById("summaryWordCount");
  const skillEl = document.getElementById("summarySkillCount");
  const charEl = document.getElementById("summaryCharCount");
  const sectionsEl = document.getElementById("summarySections");
  const skillsEl = document.getElementById("summarySkills");

  if (wordEl) wordEl.textContent = (summary.word_count || 0).toLocaleString();
  if (skillEl) skillEl.textContent = summary.skill_count || 0;
  if (charEl) charEl.textContent = (summary.char_count || 0).toLocaleString();

  // Detected Sections
  if (sectionsEl) {
    sectionsEl.innerHTML = "";
    const sections = summary.detected_sections || [];
    if (sections.length > 0) {
      sections.forEach(sec => {
        const tag = document.createElement("span");
        tag.className = "section-tag";
        tag.textContent = sec;
        sectionsEl.appendChild(tag);
      });
    } else {
      sectionsEl.innerHTML = '<span class="kw-none">No standard section headers detected.</span>';
    }
  }

  // Detected Skills
  if (skillsEl) {
    skillsEl.innerHTML = "";
    const skills = summary.detected_skills || [];
    if (skills.length > 0) {
      skills.forEach(skill => {
        const pill = document.createElement("span");
        pill.className = "kw-pill kw-neutral";
        pill.textContent = skill;
        skillsEl.appendChild(pill);
      });
    } else {
      skillsEl.innerHTML = '<span class="kw-none">No recognized technical skills found.</span>';
    }
  }
}