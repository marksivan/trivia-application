#!/usr/bin/env python3
"""Convert trivia CSV question banks to JSON for the web app."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_DIR = ROOT / "trivia" / "BACKEND" / "QUESTIONS"
OUTPUT_DIR = ROOT / "docs" / "data"

CATEGORIES = [
    {"id": "math", "name": "Math", "file": "math.csv", "icon": "🔢", "color": "#6366f1"},
    {"id": "science", "name": "Science", "file": "science.csv", "icon": "🔬", "color": "#22c55e"},
    {"id": "verbalReasoning", "name": "Verbal Reasoning", "file": "verbalReasoning.csv", "icon": "📖", "color": "#f59e0b"},
    {"id": "technology", "name": "Technology", "file": "technology.csv", "icon": "💻", "color": "#3b82f6"},
    {"id": "sports", "name": "Sports", "file": "sports.csv", "icon": "⚽", "color": "#ef4444"},
    {"id": "history", "name": "World History", "file": "history.csv", "icon": "🏛️", "color": "#a855f7"},
    {"id": "geography", "name": "Geography", "file": "geography.csv", "icon": "🌍", "color": "#14b8a6"},
    {"id": "healthAndMedicine", "name": "Health & Medicine", "file": "healthAndMedicine.csv", "icon": "🩺", "color": "#ec4899"},
]


def parse_questions(csv_path: Path) -> list[dict]:
    questions = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            questions.append(
                {
                    "text": row["Question"].strip().strip('"'),
                    "options": [
                        row["Option A"].strip().strip('"'),
                        row["Option B"].strip().strip('"'),
                        row["Option C"].strip().strip('"'),
                        row["Option D"].strip().strip('"'),
                    ],
                    "correctIndex": int(row["Correct Answer Index"]),
                    "difficulty": int(row["Difficulty Level"]),
                }
            )
    return questions


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []

    for category in CATEGORIES:
        csv_path = QUESTIONS_DIR / category["file"]
        questions = parse_questions(csv_path)
        output_path = OUTPUT_DIR / f"{category['id']}.json"
        output_path.write_text(json.dumps(questions, indent=2), encoding="utf-8")
        manifest.append(
            {
                "id": category["id"],
                "name": category["name"],
                "icon": category["icon"],
                "color": category["color"],
                "count": len(questions),
            }
        )
        print(f"Wrote {len(questions)} questions to {output_path.relative_to(ROOT)}")

    (OUTPUT_DIR / "categories.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote category manifest to {OUTPUT_DIR / 'categories.json'}")


if __name__ == "__main__":
    main()
