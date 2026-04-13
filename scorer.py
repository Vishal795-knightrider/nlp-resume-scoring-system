"""
Resume Job Fitness Scoring System
==================================
Uses TF-IDF + Cosine Similarity to match a resume with a job description.

WHY TF-IDF?
- TF (Term Frequency): How often a word appears in a document.
- IDF (Inverse Document Frequency): Penalizes common words (like "the", "is")
  and rewards rare, important words (like "Python", "machine learning").
- Together, TF-IDF gives each word a weight that reflects its true importance.
- It's perfect for comparing documents like resumes and job descriptions.

WHY COSINE SIMILARITY?
- After TF-IDF, each document becomes a vector (list of numbers).
- Cosine Similarity measures the ANGLE between two vectors.
- If angle = 0° → perfect match (score = 1.0)
- If angle = 90° → no match (score = 0.0)
- It ignores document length, so a short resume vs a long JD is still fair.

FULL ML PIPELINE:
  Raw Text → Clean Text → TF-IDF Vectors → Cosine Similarity → Score + Keywords
"""

import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── Step 1: Stopwords list (common English words to ignore) ──────────────────
STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you",
    "your", "yours", "yourself", "he", "him", "his", "himself", "she",
    "her", "hers", "herself", "it", "its", "itself", "they", "them",
    "their", "theirs", "what", "which", "who", "whom", "this", "that",
    "these", "those", "am", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "having", "do", "does", "did", "doing",
    "a", "an", "the", "and", "but", "if", "or", "because", "as", "until",
    "while", "of", "at", "by", "for", "with", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "both", "each", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "s", "t", "can", "will", "just", "don", "should", "now", "also",
    "also", "must", "shall", "may", "might", "could", "would"
}


def preprocess(text: str) -> str:
    """
    Step 1 – Clean the raw text:
      • Lowercase everything
      • Remove special characters and numbers (keep only letters)
      • Remove stopwords (common words that add no signal)
      • Collapse extra whitespace
    """
    text = text.lower()                              # lowercase
    text = re.sub(r"[^a-z\s]", " ", text)           # keep only letters
    tokens = text.split()                            # split into words
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    return " ".join(tokens)                          # rejoin as clean string


def score_resume(resume_text: str, job_description: str):
    """
    Full scoring pipeline:
      1. Preprocess both texts
      2. Fit a TF-IDF vectorizer on them together
      3. Compute cosine similarity between the two vectors
      4. Extract top matched keywords

    Returns:
      dict with 'score' (0-100), 'matched_keywords', 'clean_resume', 'clean_jd'
    """

    # ── Step 1: Preprocess ──────────────────────────────────────────────────
    clean_resume = preprocess(resume_text)
    clean_jd = preprocess(job_description)

    # ── Step 2: TF-IDF Vectorization ────────────────────────────────────────
    # Fit the vectorizer on BOTH documents so it knows the full vocabulary
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_jd])
    # tfidf_matrix[0] = resume vector, tfidf_matrix[1] = JD vector

    # ── Step 3: Cosine Similarity ────────────────────────────────────────────
    similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
    score = round(float(similarity[0][0]) * 100, 2)   # convert to 0–100%

    # ── Step 4: Extract Top Matched Keywords ────────────────────────────────
    feature_names = vectorizer.get_feature_names_out()   # all vocabulary words
    resume_vec = tfidf_matrix[0].toarray()[0]
    jd_vec = tfidf_matrix[1].toarray()[0]

    # A keyword "matches" if it has a TF-IDF weight > 0 in BOTH documents
    matched = []
    for i, word in enumerate(feature_names):
        if resume_vec[i] > 0 and jd_vec[i] > 0:
            # Score the keyword by the product of both weights (stronger match = higher score)
            combined_score = resume_vec[i] * jd_vec[i]
            matched.append((word, combined_score))

    # Sort by combined score descending and take top 15
    matched.sort(key=lambda x: x[1], reverse=True)
    top_keywords = [word for word, _ in matched[:15]]

    return {
        "score": score,
        "matched_keywords": top_keywords,
        "clean_resume": clean_resume,
        "clean_jd": clean_jd,
        "total_keywords_matched": len(matched)
    }


def get_grade(score: float) -> tuple:
    """Return a letter grade and label for a given score."""
    if score >= 80:
        return "A", "Excellent Match 🎯"
    elif score >= 60:
        return "B", "Good Match ✅"
    elif score >= 40:
        return "C", "Average Match ⚠️"
    elif score >= 20:
        return "D", "Weak Match 📉"
    else:
        return "F", "Poor Match ❌"
