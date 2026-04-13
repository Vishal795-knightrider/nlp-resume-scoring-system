"""
main.py – Run the Resume Fitness Scorer on sample data
========================================================
Run with:  python main.py
"""

from scorer import score_resume, get_grade
from sample_data import SAMPLES
import pandas as pd


def print_separator(char="─", width=60):
    print(char * width)


def display_result(sample_name, result, expected):
    score = result["score"]
    grade, label = get_grade(score)

    print_separator("═")
    print(f"  TEST CASE: {sample_name}")
    print(f"  Expected : {expected}")
    print_separator()
    print(f"  Fitness Score      : {score}%")
    print(f"  Grade              : {grade}  →  {label}")
    print(f"  Keywords Matched   : {result['total_keywords_matched']}")
    print(f"  Top Keywords       : {', '.join(result['matched_keywords'][:10])}")
    print_separator("═")
    print()


def run_batch(samples):
    """Run all sample pairs and collect results into a DataFrame."""
    rows = []
    for sample in samples:
        print(f"  Processing: {sample['name']} ...")
        result = score_resume(sample["resume"], sample["jd"])
        grade, label = get_grade(result["score"])
        display_result(sample["name"], result, sample["expected"])
        rows.append({
            "Test Case": sample["name"],
            "Score (%)": result["score"],
            "Grade": grade,
            "Label": label,
            "Keywords Matched": result["total_keywords_matched"],
            "Top 5 Keywords": ", ".join(result["matched_keywords"][:5])
        })

    return pd.DataFrame(rows)


def run_custom():
    """Let user enter their own resume and JD interactively."""
    print("\n" + "═" * 60)
    print("  CUSTOM INPUT MODE")
    print("═" * 60)
    print("Paste your RESUME text (press Enter twice when done):")

    lines = []
    while True:
        line = input()
        if line == "" and lines and lines[-1] == "":
            break
        lines.append(line)
    resume = "\n".join(lines)

    print("\nPaste the JOB DESCRIPTION text (press Enter twice when done):")
    lines = []
    while True:
        line = input()
        if line == "" and lines and lines[-1] == "":
            break
        lines.append(line)
    jd = "\n".join(lines)

    result = score_resume(resume, jd)
    display_result("Your Custom Input", result, "—")


if __name__ == "__main__":
    print()
    print("=" * 60)
    print("   RESUME JOB FITNESS SCORING SYSTEM")
    print("   Powered by TF-IDF + Cosine Similarity")
    print("=" * 60)
    print()

    # Run all sample test cases
    df = run_batch(SAMPLES)

    # Print a clean summary table
    print("\n" + "═" * 60)
    print("  SUMMARY TABLE")
    print("═" * 60)
    print(df[["Test Case", "Score (%)", "Grade", "Label"]].to_string(index=False))
    print()

    # Save results to CSV
    df.to_csv("results.csv", index=False)
    print("  ✅ Results saved to results.csv")
    print()
