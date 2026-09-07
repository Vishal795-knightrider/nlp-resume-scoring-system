/* =============================================================================
   script.js — ResumeFit AI Resume Intelligence (v3 UI Redesign)
   Fully compatible with Flask backend: /upload-pdf, /score, /sample/<idx>
   Zero fake results: All values dynamically bound from backend responses.
   ============================================================================= */

// Global state tracking
let analysisTimer = null;

/* ── DOM Ready Initializer ────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  setupNavbarScroll();
  setupTextareaCounters();
  setupDragAndDrop();
});

/* ── Navbar Sticky Scroll Treatment ───────────────────────────────────────── */
function setupNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }, { passive: true });
}

/* ── Real-Time Character Counters ─────────────────────────────────────────── */
function setupTextareaCounters() {
  const resumeEl = document.getElementById("resume");
  const jdEl = document.getElementById("jd");
  const resumeCount = document.getElementById("resumeCharCount");
  const jdCount = document.getElementById("jdCharCount");

  const updateResume = () => {
    const len = resumeEl ? resumeEl.value.length : 0;
    if (resumeCount) resumeCount.textContent = `${len.toLocaleString()} characters`;
  };

  const updateJd = () => {
    const len = jdEl ? jdEl.value.length : 0;
    if (jdCount) jdCount.textContent = `${len.toLocaleString()} characters`;
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

/* ── Error Banner Toast ───────────────────────────────────────────────────── */
function showError(message) {
  const errBanner = document.getElementById("errorMsg");
  const errText = document.getElementById("errorMsgText");
  if (errText) errText.textContent = message;
  if (errBanner) {
    errBanner.classList.add("visible");
    errBanner.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function dismissError() {
  const errBanner = document.getElementById("errorMsg");
  if (errBanner) errBanner.classList.remove("visible");
}

/* ── Drag & Drop Handling ─────────────────────────────────────────────────── */
function setupDragAndDrop() {
  const zone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("pdfInput");
  if (!zone) return;

  ["dragenter", "dragover"].forEach(eventName => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove("drag-over");
    });
  });

  zone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      if (fileInput) {
        fileInput.files = files;
      }
      onPdfChange({ files: files });
    }
  });
}

/* ── PDF Upload Logic (Preserving API Contract: /upload-pdf) ───────────────── */
async function onPdfChange(input) {
  const file = input.files ? input.files[0] : null;
  if (!file) return;

  dismissError();

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showError("Please select a valid PDF file.");
    return;
  }

  // 5 MB upload limit
  if (file.size > 5 * 1024 * 1024) {
    showError("File size exceeds 5MB limit. Please upload a smaller PDF.");
    return;
  }

  setUploadStatus("loading", `Extracting text from ${file.name}...`);

  const formData = new FormData();
  formData.append("resume_pdf", file); // Key matches Flask route exactly

  try {
    const res = await fetch("/upload-pdf", { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      setUploadStatus("error", data.error);
      showError(data.error);
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
      `✓ ${file.name} (${data.pages} page${data.pages !== 1 ? "s" : ""} · ${data.text.length.toLocaleString()} chars)`
    );

  } catch (err) {
    setUploadStatus("error", "Upload failed. Please verify server connection.");
    showError("Could not process PDF. Please paste resume text manually.");
    const pdfInput = document.getElementById("pdfInput");
    if (pdfInput) pdfInput.value = "";
  }
}

/**
 * Update upload status pill.
 * @param {string} state - "loading" | "success" | "error"
 * @param {string} message - Text to display
 */
function setUploadStatus(state, message) {
  const el = document.getElementById("uploadStatus");
  const textEl = document.getElementById("uploadStatusText");
  if (!el || !textEl) return;

  el.className = "upload-status visible " + state;
  textEl.textContent = message;
}

/** Reset the PDF upload area and clear the resume textarea. */
function clearPdf() {
  const pdfInput = document.getElementById("pdfInput");
  if (pdfInput) pdfInput.value = "";

  const statusEl = document.getElementById("uploadStatus");
  if (statusEl) statusEl.className = "upload-status";
}

/* ── Sample Loader (Preserving API Contract: /sample/<idx>) ───────────────── */
async function loadSample(idx) {
  dismissError();

  try {
    const res = await fetch(`/sample/${idx}`);
    if (!res.ok) throw new Error("Could not load sample");
    const data = await res.json();

    // Reset upload state
    clearPdf();

    // Fill inputs
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

    // Reset results display to empty state until user clicks analyze
    const resultsEl = document.getElementById("results");
    const emptyEl = document.getElementById("emptyState");
    if (resultsEl) resultsEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "block";

    // Scroll smoothly to workspace
    const workspace = document.getElementById("workspace");
    if (workspace) {
      workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  } catch (err) {
    showError("Failed to load sample dataset. Please check your network connection.");
  }
}

/* ── Main Analyze Function (Preserving API Contract: /score) ──────────────── */
async function analyze() {
  const resumeEl = document.getElementById("resume");
  const jdEl = document.getElementById("jd");
  const btn = document.getElementById("analyzeBtn");
  const loader = document.getElementById("analysisLoader");

  const resume = resumeEl ? resumeEl.value.trim() : "";
  const jd = jdEl ? jdEl.value.trim() : "";

  dismissError();

  if (!resume || !jd) {
    showError("Please provide both your resume and a job description before analyzing.");
    return;
  }

  // Set loading state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>Analyzing Resume Alignment...</span>";
  }
  if (loader) {
    loader.classList.add("active");
    startLoaderAnimation();
  }

  try {
    const startTime = Date.now();
    const res = await fetch("/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd })
    });
    const data = await res.json();

    // Ensure a brief pleasant transition for the loader animation
    const elapsed = Date.now() - startTime;
    if (elapsed < 600) {
      await new Promise(r => setTimeout(r, 600 - elapsed));
    }

    if (data.error) {
      showError(data.error);
      return;
    }

    displayResults(data);

  } catch (e) {
    showError("Server error while evaluating resume. Please ensure the backend is running.");
  } finally {
    stopLoaderAnimation();
    if (loader) loader.classList.remove("active");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "<span>⚡ Analyze Match</span>";
    }
  }
}

/* ── Multi-Stage Step Loader Animation ───────────────────────────────────── */
function startLoaderAnimation() {
  const steps = [
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4")
  ];

  steps.forEach(s => {
    if (s) {
      s.className = "loader-step";
      const icon = s.querySelector(".step-icon");
      if (icon) icon.textContent = "○";
    }
  });

  let currentStep = 0;

  function advanceStep() {
    if (currentStep < steps.length && steps[currentStep]) {
      const step = steps[currentStep];
      step.className = "loader-step active";
      const icon = step.querySelector(".step-icon");
      if (icon) icon.textContent = "→";

      if (currentStep > 0 && steps[currentStep - 1]) {
        const prev = steps[currentStep - 1];
        prev.className = "loader-step completed";
        const prevIcon = prev.querySelector(".step-icon");
        if (prevIcon) prevIcon.textContent = "✓";
      }
      currentStep++;
      analysisTimer = setTimeout(advanceStep, 250);
    }
  }

  advanceStep();
}

function stopLoaderAnimation() {
  if (analysisTimer) {
    clearTimeout(analysisTimer);
    analysisTimer = null;
  }
}

/* ── Dynamic Results Dashboard Rendering ──────────────────────────────────── */
function displayResults(data) {
  const resultsEl = document.getElementById("results");
  const emptyEl = document.getElementById("emptyState");

  if (emptyEl) emptyEl.style.display = "none";
  if (resultsEl) {
    resultsEl.style.display = "block";
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Render components dynamically with real backend payload
  renderScoreHero(data);
  renderQuickMetrics(data);
  renderKeywordsSplit(data);
  renderSuggestions(data.suggestions);
  renderResumeSummary(data.resume_summary);

  const timestampEl = document.getElementById("resultsTimestamp");
  if (timestampEl) {
    timestampEl.textContent = `Analyzed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

/* ── Score Hero & Progress Gauge ──────────────────────────────────────────── */
function renderScoreHero(data) {
  const score = data.score;
  const scoreDisplay = document.getElementById("scoreDisplay");
  const gradeBadge = document.getElementById("gradeBadge");
  const scoreQualitative = document.getElementById("scoreQualitative");
  const gaugeProgress = document.getElementById("scoreGaugeProgress");
  const barFill = document.getElementById("barFill");

  // Animate numeric counter
  if (scoreDisplay) {
    let current = 0;
    const target = score;
    const duration = 1000;
    const steps = 40;
    const increment = target / steps;
    const stepTime = duration / steps;

    const counterInterval = setInterval(() => {
      current = Math.min(current + increment, target);
      scoreDisplay.textContent = current.toFixed(1) + "%";
      if (current >= target) {
        clearInterval(counterInterval);
        scoreDisplay.textContent = target.toFixed(1) + "%";
      }
    }, stepTime);
  }

  // Animate circular SVG progress gauge
  if (gaugeProgress) {
    const radius = 65;
    const circumference = 2 * Math.PI * radius; // ~408.4
    gaugeProgress.style.strokeDasharray = `${circumference}`;

    // Color coordination based on score
    let strokeColor = "#2563EB";
    if (score >= 80) strokeColor = "#059669";
    else if (score >= 60) strokeColor = "#2563EB";
    else if (score >= 40) strokeColor = "#D97706";
    else strokeColor = "#DC2626";

    gaugeProgress.style.stroke = strokeColor;

    const offset = circumference - (score / 100) * circumference;
    setTimeout(() => {
      gaugeProgress.style.strokeDashoffset = `${offset}`;
    }, 50);
  }

  // Linear bar fill
  if (barFill) {
    setTimeout(() => {
      barFill.style.width = `${Math.min(Math.max(score, 2), 100)}%`;
    }, 100);
  }

  // Grade badge styling
  if (gradeBadge) {
    gradeBadge.textContent = `${data.grade} — ${data.label}`;
    gradeBadge.className = `grade-badge grade-${data.grade}`;
  }

  // Qualitative summary text
  if (scoreQualitative) {
    if (score >= 80) {
      scoreQualitative.textContent = "High Compatibility — Strong alignment with key requirements";
    } else if (score >= 60) {
      scoreQualitative.textContent = "Good Alignment — Strong foundation with minor keyword gaps";
    } else if (score >= 40) {
      scoreQualitative.textContent = "Moderate Alignment — Significant domain gaps to address";
    } else {
      scoreQualitative.textContent = "Low Alignment — Recommend substantial tailoring for this position";
    }
  }
}

/* ── 4 Quick Stat Metric Tiles ────────────────────────────────────────────── */
function renderQuickMetrics(data) {
  const statScore = document.getElementById("statScore");
  const statKw = document.getElementById("statKw");
  const statMissingCount = document.getElementById("statMissingCount");
  const statGrade = document.getElementById("statGrade");

  if (statScore) statScore.textContent = `${data.score}%`;
  if (statKw) statKw.textContent = data.total_matched;
  if (statMissingCount) {
    statMissingCount.textContent = (data.missing_keywords || []).length;
  }
  if (statGrade) statGrade.textContent = data.grade;
}

/* ── Matched & Missing Keywords Rendering ─────────────────────────────────── */
function renderKeywordsSplit(data) {
  // Matched Keywords
  const matchedContainer = document.getElementById("matchedKeywords");
  const matchedBadge = document.getElementById("matchedCountBadge");
  const matchedList = data.matched_keywords || [];

  if (matchedBadge) {
    matchedBadge.textContent = `${matchedList.length} matched`;
  }

  if (matchedContainer) {
    matchedContainer.innerHTML = "";
    if (matchedList.length === 0) {
      matchedContainer.innerHTML = '<span class="kw-empty">No significant common keywords identified.</span>';
    } else {
      matchedList.forEach((kw, index) => {
        const chip = document.createElement("span");
        chip.className = index < 4 ? "kw-tag kw-top" : "kw-tag";
        chip.textContent = kw;
        matchedContainer.appendChild(chip);
      });
    }
  }

  // Missing Keywords
  const missingContainer = document.getElementById("missingKeywords");
  const missingBadge = document.getElementById("missingCountBadge");
  const missingList = data.missing_keywords || [];

  if (missingBadge) {
    missingBadge.textContent = `${missingList.length} missing`;
  }

  if (missingContainer) {
    missingContainer.innerHTML = "";
    if (missingList.length === 0) {
      missingContainer.innerHTML = '<span class="kw-empty">🎉 No significant job keywords are missing! Excellent coverage.</span>';
    } else {
      missingList.forEach(kw => {
        const chip = document.createElement("span");
        chip.className = "kw-tag kw-missing";
        chip.textContent = kw;
        missingContainer.appendChild(chip);
      });
    }
  }
}

/* ── Recommendations List Rendering ───────────────────────────────────────── */
function renderSuggestions(suggestions) {
  const listEl = document.getElementById("suggestionsList");
  if (!listEl) return;

  listEl.innerHTML = "";
  const items = suggestions || [];

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.innerHTML = '<span class="suggestion-bullet-icon">✨</span><div>No critical gaps detected — your resume structure and phrasing closely mirror the job requirements.</div>';
    listEl.appendChild(li);
    return;
  }

  items.forEach(text => {
    const li = document.createElement("li");
    li.className = "suggestion-item";

    // Extract leading emoji if present, else provide a standard icon
    const iconMatch = text.match(/^([\p{Emoji}]+)\s*/u);
    let icon = "💡";
    let content = text;

    if (iconMatch) {
      icon = iconMatch[1];
      content = text.substring(iconMatch[0].length);
    }

    li.innerHTML = `<span class="suggestion-bullet-icon">${icon}</span><div>${content}</div>`;
    listEl.appendChild(li);
  });
}

/* ── Resume Structural Insights Rendering ─────────────────────────────────── */
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
        const badge = document.createElement("span");
        badge.className = "section-badge";
        badge.innerHTML = `<span>✓</span><span>${sec}</span>`;
        sectionsEl.appendChild(badge);
      });
    } else {
      sectionsEl.innerHTML = '<span class="kw-empty">No standard section headers detected. Consider adding Experience, Education, and Skills.</span>';
    }
  }

  // Detected Skills
  if (skillsEl) {
    skillsEl.innerHTML = "";
    const skills = summary.detected_skills || [];
    if (skills.length > 0) {
      skills.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "kw-tag kw-skill";
        tag.textContent = skill;
        skillsEl.appendChild(tag);
      });
    } else {
      skillsEl.innerHTML = '<span class="kw-empty">No specific technical keywords from dictionary detected in resume.</span>';
    }
  }
}