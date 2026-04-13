# 📄 Resume Job Fitness Scoring System

A beginner-friendly ML college project that uses **TF-IDF** and **Cosine Similarity**
to measure how well a resume matches a job description.

---

## 🗂️ Project Structure

```
resume_scorer/
├── scorer.py        ← Core ML logic (TF-IDF + Cosine Similarity)
├── sample_data.py   ← 3 sample resume + JD pairs for testing
├── main.py          ← CLI runner (run all samples, print results)
├── app.py           ← Flask web app (optional UI)
├── requirements.txt ← Python dependencies
└── templates/
    └── index.html   ← Web UI for Flask app
```

---

## ⚙️ Setup & Installation

```bash
# 1. Clone or download this folder
# 2. Install dependencies
pip install -r requirements.txt

# 3. Run CLI version
python main.py

# 4. (Optional) Run Flask web app
python app.py
# Then open http://localhost:5000
```

---

## 🤔 Why TF-IDF?

| Term | Full Form | What it does |
|------|-----------|--------------|
| TF | Term Frequency | How often a word appears in the document |
| IDF | Inverse Document Frequency | Penalizes words common across all documents |

Together, TF-IDF gives each word a **weight** that reflects its true importance.
- Common words like "the", "is" → low weight
- Domain-specific words like "Python", "Kubernetes" → high weight

This lets us represent a resume as a **vector of meaningful numbers**.

---

## 📐 Why Cosine Similarity?

After TF-IDF, each document is a **vector** (list of numbers).

Cosine Similarity measures the **angle** between two vectors:
- Angle = 0° → perfect match → score = 1.0 → **100%**
- Angle = 90° → no overlap → score = 0.0 → **0%**

**Why cosine and not Euclidean distance?**
- Cosine ignores document length (a short resume vs a long JD is still fair)
- It focuses on **direction** (shared topics), not magnitude

---

## 🔄 Full ML Pipeline

```
Raw Resume + JD
     ↓
[Step 1] Preprocess
  • Lowercase all text
  • Remove special characters
  • Remove stopwords (the, is, and, ...)
     ↓
[Step 2] TF-IDF Vectorization
  • Fit vectorizer on both documents
  • Each word gets a TF-IDF weight
  • Documents → numerical vectors
     ↓
[Step 3] Cosine Similarity
  • Measure angle between resume vector and JD vector
  • Returns value 0.0 to 1.0
     ↓
[Step 4] Output
  • Score = similarity × 100 (as a percentage)
  • Keywords = words present in both with high TF-IDF weight
```

---

## 📊 Sample Results

| Resume vs Job Description | Expected | Score |
|---------------------------|----------|-------|
| Data Scientist vs ML Engineer JD | High Match | ~55–70% |
| Frontend Dev vs Backend Python JD | Low Match | ~10–20% |
| DevOps Engineer vs DevOps JD | Very High Match | ~70–85% |

---

## 🎓 Grade System

| Score | Grade | Label |
|-------|-------|-------|
| 80–100% | A | Excellent Match 🎯 |
| 60–79% | B | Good Match ✅ |
| 40–59% | C | Average Match ⚠️ |
| 20–39% | D | Weak Match 📉 |
| 0–19% | F | Poor Match ❌ |

---

## 🔧 Tech Stack

- **Python 3.8+**
- **scikit-learn** — TF-IDF, Cosine Similarity
- **pandas** — Results table and CSV export
- **Flask** *(optional)* — Simple web UI

---

## 💡 Possible Improvements (for viva/report)

1. Use **spaCy** for better NLP preprocessing (lemmatization, NER)
2. Try **BERT embeddings** instead of TF-IDF for semantic similarity
3. Add **resume section parsing** (skills vs experience vs education)
4. Build a **scoring breakdown** by section
5. Add **skill gap analysis** — what skills are missing from the resume
