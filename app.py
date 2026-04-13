"""
app.py – Flask Web Application
================================
Run with:  python app.py
Then open: http://localhost:5000
"""

from flask import Flask, render_template, request, jsonify
from scorer import score_resume, get_grade
from sample_data import SAMPLES

app = Flask(__name__)
app.jinja_env.globals.update(enumerate=enumerate)


@app.route("/")
def index():
    """Serve the main UI page."""
    return render_template("index.html", samples=SAMPLES)


@app.route("/score", methods=["POST"])
def score():
    """
    API endpoint: receives resume + JD, returns JSON with score and keywords.
    Called by the frontend JavaScript via fetch().
    """
    data = request.get_json()
    resume = data.get("resume", "").strip()
    jd = data.get("jd", "").strip()

    if not resume or not jd:
        return jsonify({"error": "Both resume and job description are required."}), 400

    result = score_resume(resume, jd)
    grade, label = get_grade(result["score"])

    return jsonify({
        "score": result["score"],
        "grade": grade,
        "label": label,
        "matched_keywords": result["matched_keywords"],
        "total_matched": result["total_keywords_matched"]
    })


@app.route("/sample/<int:idx>")
def get_sample(idx):
    """Return a sample resume and JD by index (0, 1, or 2)."""
    if 0 <= idx < len(SAMPLES):
        s = SAMPLES[idx]
        return jsonify({"resume": s["resume"].strip(), "jd": s["jd"].strip()})
    return jsonify({"error": "Invalid sample index"}), 404


if __name__ == "__main__":
    print("Starting Resume Fitness Scorer...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True)
