"""
app.py – Resume Fitness Scoring System (v3)
============================================
Deployed on Render — uses host="0.0.0.0" and PORT env variable.

NEW in v3:
  /score now also returns:
    • missing_keywords  — keywords in JD but absent from resume
    • suggestions       — actionable tips based on gaps
    • resume_summary    — word count, detected skills, section detection
"""

import os
import io
import re
from flask import Flask, render_template, request, jsonify
from pypdf import PdfReader
from scorer import score_resume, get_grade, preprocess, STOPWORDS
from sample_data import SAMPLES

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024   # 5 MB upload limit


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Known technical skills dictionary for resume summary
# ─────────────────────────────────────────────────────────────────────────────
KNOWN_SKILLS = {
    # Languages
    "python", "java", "javascript", "typescript", "cpp", "csharp", "ruby",
    "go", "rust", "kotlin", "swift", "scala", "php", "bash", "sql", "r",
    # Web
    "html", "css", "react", "angular", "vue", "nodejs", "flask", "django",
    "fastapi", "express", "bootstrap", "tailwind", "nextjs", "jquery",
    # Data / ML
    "pandas", "numpy", "sklearn", "scikit", "tensorflow", "pytorch", "keras",
    "matplotlib", "seaborn", "plotly", "scipy", "nltk", "spacy", "xgboost",
    "lightgbm", "mlflow", "airflow", "spark", "hadoop",
    # Cloud / DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github", "gitlab", "linux", "nginx", "redis", "kafka",
    # Databases
    "mysql", "postgresql", "mongodb", "sqlite", "cassandra", "elasticsearch",
    # Other
    "git", "rest", "graphql", "agile", "scrum", "jira", "figma", "tableau",
    "powerbi", "excel", "opencv", "selenium", "postman"
}

# Section header keywords for resume section detection
SECTION_KEYWORDS = {
    "skills":     ["skill", "skills", "technical", "technologies", "tools", "stack"],
    "experience": ["experience", "work", "employment", "career", "job", "professional"],
    "education":  ["education", "degree", "university", "college", "academic", "school", "gpa"],
    "projects":   ["project", "projects", "portfolio", "built", "developed", "created"],
    "summary":    ["summary", "objective", "profile", "about", "overview"],
    "awards":     ["award", "achievement", "certification", "certificate", "honor"],
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Extract missing keywords
# ─────────────────────────────────────────────────────────────────────────────
def get_missing_keywords(resume_text: str, jd_text: str) -> list:
    """
    Find keywords that appear in the JD but are ABSENT from the resume.

    Strategy:
      1. Preprocess both texts
      2. Get all unique tokens from JD
      3. Filter to only 'meaningful' tokens (len > 3, not stopword)
      4. Return those not found in resume tokens
    """
    clean_resume_tokens = set(preprocess(resume_text).split())
    clean_jd_tokens     = set(preprocess(jd_text).split())

    # Missing = in JD but not in resume, and length > 3 (filter noise like "use", "the")
    missing = [
        word for word in clean_jd_tokens
        if word not in clean_resume_tokens and len(word) > 3
    ]

    # Sort alphabetically for consistent display
    return sorted(missing)[:20]   # cap at 20 to keep output clean


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Generate smart suggestions
# ─────────────────────────────────────────────────────────────────────────────
def generate_suggestions(missing_keywords: list, score: float, resume_text: str) -> list:
    """
    Generate human-readable, actionable suggestions based on:
      - Missing keywords (skill gaps)
      - Overall fitness score
      - Resume content analysis
    """
    suggestions = []
    resume_lower = resume_text.lower()

    # ── 1. Skill gap suggestions ─────────────────────────────────────────────
    # Split missing keywords into known skills vs general terms
    missing_skills = [kw for kw in missing_keywords if kw in KNOWN_SKILLS]
    missing_general = [kw for kw in missing_keywords if kw not in KNOWN_SKILLS]

    if missing_skills:
        skill_list = ", ".join(missing_skills[:6])   # show max 6
        suggestions.append(
            f"🛠️ Add missing technical skills to your Skills section: {skill_list}."
        )

    if missing_general:
        term_list = ", ".join(missing_general[:5])
        suggestions.append(
            f"📝 Include these job-specific terms in your resume: {term_list}."
        )

    # ── 2. Score-based suggestions ───────────────────────────────────────────
    if score < 20:
        suggestions.append(
            "⚠️ Very low match. Consider rewriting your resume to align more closely "
            "with this job's requirements and domain."
        )
    elif score < 40:
        suggestions.append(
            "📈 Low match. Tailor your resume specifically for this role — "
            "mirror the job description's language where your experience genuinely applies."
        )
    elif score < 60:
        suggestions.append(
            "✏️ Moderate match. Strengthen your resume by adding more relevant projects "
            "and quantified achievements that relate to this job."
        )
    elif score < 80:
        suggestions.append(
            "✅ Good match! Fine-tune by adding a Professional Summary that mirrors "
            "the job description's key requirements."
        )
    else:
        suggestions.append(
            "🎯 Excellent match! Make sure your resume is ATS-formatted: "
            "use standard section headers and avoid tables or graphics."
        )

    # ── 3. Content structure suggestions ─────────────────────────────────────
    if "project" not in resume_lower and "portfolio" not in resume_lower:
        suggestions.append(
            "💡 No Projects section detected. Adding 2–3 relevant projects "
            "significantly increases your match score and credibility."
        )

    if len(resume_text.split()) < 200:
        suggestions.append(
            "📄 Your resume seems short (under 200 words). Expand with more details "
            "about responsibilities, tools used, and measurable outcomes."
        )

    if "github" not in resume_lower and "linkedin" not in resume_lower:
        suggestions.append(
            "🔗 Add links to your GitHub profile and/or LinkedIn — "
            "recruiters and ATS systems value verifiable work."
        )

    return suggestions


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: Generate resume summary
# ─────────────────────────────────────────────────────────────────────────────
def get_resume_summary(resume_text: str) -> dict:
    """
    Analyze the raw resume text and return a structured summary:
      - word_count       : total word count
      - detected_skills  : list of known tech skills found
      - skill_count      : number of detected skills
      - detected_sections: which standard resume sections are present
      - char_count       : character count
    """
    resume_lower = resume_text.lower()
    words        = resume_text.split()
    tokens       = set(preprocess(resume_text).split())

    # ── Detect known skills present in resume ────────────────────────────────
    detected_skills = sorted([s for s in KNOWN_SKILLS if s in tokens])

    # ── Detect standard resume sections ──────────────────────────────────────
    detected_sections = []
    for section_name, keywords in SECTION_KEYWORDS.items():
        if any(kw in resume_lower for kw in keywords):
            detected_sections.append(section_name.capitalize())

    return {
        "word_count":        len(words),
        "char_count":        len(resume_text),
        "skill_count":       len(detected_skills),
        "detected_skills":   detected_skills[:20],     # show top 20
        "detected_sections": detected_sections,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Route 1: Home page
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", samples=SAMPLES)


# ─────────────────────────────────────────────────────────────────────────────
# Route 2: PDF Upload (unchanged from v2)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    """Extract text from uploaded PDF and return as JSON."""
    if "resume_pdf" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    pdf_file = request.files["resume_pdf"]

    if pdf_file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not pdf_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported."}), 400

    try:
        pdf_bytes  = pdf_file.read()
        pdf_stream = io.BytesIO(pdf_bytes)
        reader     = PdfReader(pdf_stream)

        extracted_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"

        if not extracted_text.strip():
            return jsonify({
                "error": "Could not extract text. This may be a scanned PDF. "
                         "Please paste your resume as text instead."
            }), 400

        return jsonify({
            "success": True,
            "text":    extracted_text.strip(),
            "pages":   len(reader.pages)
        })

    except Exception as e:
        return jsonify({"error": f"Failed to read PDF: {str(e)}"}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Route 3: Score endpoint — UPGRADED with new fields
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/score", methods=["POST"])
def score():
    """
    Receives resume text + job description.
    Returns:
      Existing → score, grade, label, matched_keywords, total_matched
      NEW      → missing_keywords, suggestions, resume_summary
    """
    data   = request.get_json()
    resume = data.get("resume", "").strip()
    jd     = data.get("jd", "").strip()

    if not resume or not jd:
        return jsonify({"error": "Both resume and job description are required."}), 400

    # ── Existing ML scoring (unchanged) ──────────────────────────────────────
    result       = score_resume(resume, jd)
    grade, label = get_grade(result["score"])

    # ── NEW: Missing keywords ─────────────────────────────────────────────────
    missing_kw = get_missing_keywords(resume, jd)

    # ── NEW: Smart suggestions ────────────────────────────────────────────────
    suggestions = generate_suggestions(missing_kw, result["score"], resume)

    # ── NEW: Resume summary ───────────────────────────────────────────────────
    summary = get_resume_summary(resume)

    return jsonify({
        # ── Existing fields (unchanged) ──────────────────────────────────────
        "score":            result["score"],
        "grade":            grade,
        "label":            label,
        "matched_keywords": result["matched_keywords"],
        "total_matched":    result["total_keywords_matched"],
        # ── New fields ───────────────────────────────────────────────────────
        "missing_keywords": missing_kw,
        "suggestions":      suggestions,
        "resume_summary":   summary,
    })


# ─────────────────────────────────────────────────────────────────────────────
# Route 4: Sample loader (unchanged)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/sample/<int:idx>")
def get_sample(idx):
    if 0 <= idx < len(SAMPLES):
        s = SAMPLES[idx]
        return jsonify({"resume": s["resume"].strip(), "jd": s["jd"].strip()})
    return jsonify({"error": "Invalid sample index"}), 404


# ─────────────────────────────────────────────────────────────────────────────
# Render-compatible server startup
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)