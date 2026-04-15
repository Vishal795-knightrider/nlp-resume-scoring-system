# 🚀 Resume Fitness Scoring System (AI-Powered)

An intelligent web application that evaluates how well a candidate's resume matches a job description using Machine Learning techniques like **TF-IDF** and **Cosine Similarity**.

---

## 📌 Features

* 📄 Upload Resume (PDF support using pypdf)
* ✍️ Manual Resume Input
* 📋 Job Description Input
* 🤖 ML-based Matching (TF-IDF + Cosine Similarity)
* 📊 Match Score (0–100%)
* 🏆 Grade System (A–F)
* 🔍 Top Matched Keywords
* ⚡ Fast and Interactive UI (Flask + JS)

---

## 🧠 KESE KAAM KRTA HAI YEH (ML Pipeline)
F
1. **Input**

   * Resume (text or PDF)
   * Job Description

2. **PDF Parsing**

   * Extract text using `pypdf`

3. **Text Preprocessing**

   * Lowercasing
   * Removing stopwords & special characters

4. **TF-IDF Vectorization**

   * Converts text into numerical vectors
   * Assigns importance to words

5. **Cosine Similarity**

   * Measures similarity between resume & job vectors

6. **Score Generation**

   * Outputs match percentage (0–100%)

7. **Keyword Matching**

   * Displays top matched keywords

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **ML/NLP:** scikit-learn (TF-IDF, Cosine Similarity)
* **PDF Parsing:** pypdf
* **Frontend:** HTML, CSS, JavaScript

---

## 📂 Project Structure

```
Resume_Project/
│
├── app.py
├── scorer.py
├── sample_data.py
├── requirements.txt
│
└── templates/
    └── index.html
```

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```
git clone https://github.com/your-username/resume-fitness-scoring.git
cd resume-fitness-scoring
```

### 2. Install Dependencies

```
pip install -r requirements.txt
```

### 3. Run the Application

```
python app.py
```

### 4. Open in Browser

```
http://localhost:5000
```

---

## 📊 Example Output

* Match Score: **31.5%**
* Grade: **D (Weak Match)**
* Keywords: Python, ML, Pandas, SQL, Data Analysis

---

## ⚠️ Limitations

* Keyword-based matching (no deep semantic understanding)
* Cannot detect synonyms effectively
* Performance depends on input text quality

---

## 🚀 Future Improvements

* Use **BERT / NLP embeddings** for better semantic matching
* Add **skill extraction using Named Entity Recognition (NER)**
* Improve UI/UX
* Deploy on cloud (AWS / Render / Vercel)

---

## 👨‍💻 Author

**Vishal Kashyap**
Computer Science Student

---

## ⭐ Contribute

Feel free to fork, improve, and submit pull requests!

---

## 📜 License

This project is for educational purposes.
