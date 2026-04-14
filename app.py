"""
app.py – Flask Web Application (v2 — with PDF Upload)
=======================================================
NEW in v2:
  • /upload-pdf  endpoint: receives a PDF file, extracts text using pypdf,
                           returns the extracted text as JSON
  • /score       endpoint: unchanged — still takes resume text + JD text

Run with:  python app.py
Then open: http://localhost:5000

New dependency needed:
  pip install pypdf
"""

import io                                      # to read uploaded file bytes in memory
from flask import Flask, render_template, request, jsonify
from pypdf import PdfReader                    # NEW: for reading PDF files
from scorer import score_resume, get_grade
from sample_data import SAMPLES

app = Flask(__name__)

# ── Max allowed PDF size: 5 MB (safety limit) ───────────────────────────────
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024   # 5 MB in bytes


# ─────────────────────────────────────────────────────────────────────────────
# Route 1: Home page
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Serve the main UI page."""
    return render_template("index.html", samples=SAMPLES)


# ─────────────────────────────────────────────────────────────────────────────
# Route 2: PDF Upload — NEW ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    """
    Receives a PDF file from the browser (via multipart/form-data),
    extracts all text from it using pypdf, and returns the text as JSON.

    The frontend will then place this text into the resume textarea.

    Error handling:
      - No file provided → 400 error
      - Not a PDF file → 400 error
      - PDF has no readable text (scanned image PDF) → 400 error
      - Any unexpected error → 500 error
    """

    # ── Step 1: Check that a file was actually sent ──────────────────────────
    if "resume_pdf" not in request.files:
        return jsonify({"error": "No file uploaded. Please select a PDF file."}), 400

    pdf_file = request.files["resume_pdf"]   # get the uploaded file object

    # ── Step 2: Check that a file was selected (not empty filename) ──────────
    if pdf_file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    # ── Step 3: Validate that the file is a PDF ──────────────────────────────
    if not pdf_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported. Please upload a .pdf file."}), 400

    # ── Step 4: Extract text from the PDF ───────────────────────────────────
    try:
        # Read the file bytes into memory (no saving to disk needed)
        pdf_bytes = pdf_file.read()
        pdf_stream = io.BytesIO(pdf_bytes)     # wrap bytes in a file-like object

        # Open the PDF with pypdf
        reader = PdfReader(pdf_stream)

        # Loop through all pages and collect their text
        extracted_text = ""
        for page_number, page in enumerate(reader.pages):
            page_text = page.extract_text()    # extract text from this page
            if page_text:                      # some pages may be blank
                extracted_text += page_text + "\n"

        # ── Step 5: Check if any text was actually found ─────────────────────
        # Scanned PDFs (image-only) won't have extractable text
        if not extracted_text.strip():
            return jsonify({
                "error": (
                    "Could not extract text from this PDF. "
                    "It may be a scanned image. Please paste your resume as text instead."
                )
            }), 400

        # ── Step 6: Return the extracted text ───────────────────────────────
        return jsonify({
            "success": True,
            "text": extracted_text.strip(),
            "pages": len(reader.pages)         # bonus: tell the user how many pages
        })

    except Exception as e:
        # Catch any unexpected errors (corrupted PDF, etc.)
        return jsonify({"error": f"Failed to read PDF: {str(e)}"}), 500


# ─────────────────────────────────────────────────────────────────────────────
# Route 3: Score endpoint — unchanged from v1
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/score", methods=["POST"])
def score():
    """
    Receives resume text + job description as JSON.
    Returns fitness score, grade, and matched keywords.

    This route is UNCHANGED from v1. Whether the resume came from
    a PDF upload or manual text input, it arrives here as plain text.
    """
    data = request.get_json()
    resume = data.get("resume", "").strip()
    jd = data.get("jd", "").strip()

    # Validate inputs
    if not resume or not jd:
        return jsonify({"error": "Both resume and job description are required."}), 400

    # Run the TF-IDF + cosine similarity scoring (unchanged)
    result = score_resume(resume, jd)
    grade, label = get_grade(result["score"])

    return jsonify({
        "score": result["score"],
        "grade": grade,
        "label": label,
        "matched_keywords": result["matched_keywords"],
        "total_matched": result["total_keywords_matched"]
    })


# ─────────────────────────────────────────────────────────────────────────────
# Route 4: Sample data loader — unchanged from v1
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/sample/<int:idx>")
def get_sample(idx):
    """Return a sample resume and JD by index (0, 1, or 2)."""
    if 0 <= idx < len(SAMPLES):
        s = SAMPLES[idx]
        return jsonify({"resume": s["resume"].strip(), "jd": s["jd"].strip()})
    return jsonify({"error": "Invalid sample index"}), 404


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "=" * 52)
    print("  Resume Fitness Scorer v2 – Flask App")
    print("  PDF Upload + TF-IDF + Cosine Similarity")
    print("  Open http://localhost:5000")
    print("=" * 52 + "\n")
    import os

app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))