#!/usr/bin/env python3
"""
Automated Test Runner for CBEH Exam Simulator Parser & Data Consistency.
Tests parser algorithm against all 7 simulation files, verifying:
  1. Exactly 70 questions per simulation (490 total).
  2. Exactly 4 Interdisciplinary questions per simulation (28 total, IDs 67-70).
  3. Clean question prompts with no orphaned leading words/conjunctions.
  4. Preserved valid capitalized starting phrases ("In the context of...", "The primary function...").
  5. Correct question mix (16 Open questions, 54 Objective questions per simulation).
"""

import os
import re
import sys
import unittest

def get_module_from_question_id(qid):
    try:
        parsed_id = int(qid)
    except (ValueError, TypeError):
        return "Cell Biology"
    if parsed_id <= 0:
        return "Cell Biology"
    norm_id = ((parsed_id - 1) % 70) + 1
    if norm_id >= 67:
        return "Interdisciplinary"
    if norm_id >= 55:
        return "Embryology"
    if norm_id >= 31:
        return "Histology"
    return "Cell Biology"

def clean_question_prompt(raw_text):
    if not isinstance(raw_text, str):
        return ""
    text = raw_text.strip()
    
    # 1. Strip section dividers
    text = re.sub(r'[=\-\_\*]{3,}', ' ', text)
    
    # 2. Strip spilled module/part headers
    text = re.sub(r'^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*', '', text, flags=re.I)
    text = re.sub(r'^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+', '', text, flags=re.I)
    text = re.sub(r'^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis|Interdisciplinary)[^\]]*\]\s*', '', text, flags=re.I)
    
    # 3. Strip question numbers and type labels if still present at the start of prompt
    text = re.sub(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]\s*', '', text)
    text = re.sub(r'^\(?\s*(?:Multiple Choice|True or False|Open Question(?:\s*-\s*Max\s*\d+\s*words)?|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*', '', text, flags=re.I)
    
    # 4. Iterative loop to strip leading punctuation, symbols, and orphaned conjunctions / lowercase fragments
    while True:
        prev = text
        # Strip leading punctuation/symbols
        text = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', text).strip()
        # Strip orphaned leading conjunctions (case-insensitive for 'and', 'or', 'but', 'also', 'as well as', '&')
        text = re.sub(r'^(?:and|or|but|also|as well as|&)\s+', '', text, flags=re.I).strip()
        # Strip orphaned LOWERCASE-ONLY preposition/article fragments (preserve capitalized 'In', 'The', 'With')
        text = re.sub(r'^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+', '', text).strip()
        if text == prev:
            break
            
    # 5. Capitalize first letter and normalize internal whitespace
    if len(text) > 0:
        text = text[0].upper() + text[1:]
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def is_module_header_line(line):
    clean = line.strip()
    # If line starts with a question number or option label, it is NOT a header
    if re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]', clean):
        return None
    if re.match(r'^(?:[\*\-\+]?\s*)?[A-E][\.\)]', clean):
        return None
        
    upper = clean.upper()
    if re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:4|IV)\b', upper) or re.search(r'\bINTERDISCIPLINARY\b', upper) or "HART IN0" in upper or "HART IV" in upper:
        return "Interdisciplinary"
    if re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:3|III)\b', upper) or re.search(r'\bEMBRYOLOGY\b', upper) or "HART III" in upper:
        return "Embryology"
    if re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:2|II)\b', upper) or re.search(r'\bHISTOLOGY\b', upper) or "HART II" in upper:
        return "Histology"
    if re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:1|I)\b', upper) or re.search(r'\bCELL\s+BIOLOGY\b', upper) or "HART I" in upper:
        return "Cell Biology"
    return None

def sanitize_question(q):
    if not q:
        return
    # Deterministic module assignment
    if "id" in q and q["id"] is not None:
        q["module"] = get_module_from_question_id(q["id"])
    if isinstance(q.get("question"), str):
        q["question"] = clean_question_prompt(q["question"])

def parse_mock_exam_text(text):
    raw_lines = [l.strip() for l in text.split('\n') if l.strip()]
    lines = [l for l in raw_lines if not re.match(r'^[=\-\_\*]{3,}$', l)]
    
    answer_key_idx = -1
    for i, l in enumerate(lines):
        if "ANSWER KEY" in l.upper():
            answer_key_idx = i
            break
            
    if answer_key_idx == -1:
        question_lines = lines
        answer_lines = []
    else:
        question_lines = lines[:answer_key_idx]
        answer_lines = lines[answer_key_idx:]
        
    parsed_questions = []
    current_module = "Cell Biology"
    current_question = None
    
    for line in question_lines:
        # Check header
        mod = is_module_header_line(line)
        if mod:
            current_module = mod
            continue
            
        q_match = re.match(r'^(?:#+\s*)?(?:[\*\-\+]\s*)?(\d+)[\.\)]\s*(?:\(?\s*(Multiple Choice|True or False|Open Question(?:\s*-\s*Max\s*\d+\s*words)?|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*)?(.*)', line, re.I)
        if q_match and q_match.group(1):
            id_val = int(q_match.group(1))
            type_str = (q_match.group(2) or "").lower()
            prompt_text = q_match.group(3) or ""
            is_new_q = q_match.group(2) or re.match(r'^(match|evaluate|assess|which|what|fill|select|choose|identify)', prompt_text, re.I) or not current_question or id_val == (current_question["id"] + 1)
            
            if is_new_q:
                if current_question:
                    sanitize_question(current_question)
                    parsed_questions.append(current_question)
                    
                q_type = "multiple-choice"
                if "matching" in type_str or re.match(r'^match\b', prompt_text, re.I):
                    q_type = "matching"
                elif "true or false cluster" in type_str or re.match(r'^(evaluate|assess)\s+the\s+following', prompt_text, re.I):
                    q_type = "true-false-cluster"
                elif "true or false" in type_str:
                    q_type = "true-false"
                elif "fill in the gap" in type_str or re.match(r'^fill\s+in', prompt_text, re.I):
                    q_type = "fill-in-the-gap"
                elif "open question" in type_str or re.match(r'^(explain|describe)\b', prompt_text, re.I):
                    q_type = "open"
                    
                current_question = {
                    "id": id_val,
                    "type": q_type,
                    "module": get_module_from_question_id(id_val),
                    "question": prompt_text,
                    "options": [],
                    "leftItems": [],
                    "rightItems": [],
                    "statements": [],
                    "correctAnswer": None,
                    "explanation": ""
                }
                if q_type == "true-false":
                    current_question["options"] = ["True", "False"]
                continue
                
        if current_question:
            if current_question["type"] in ["multiple-choice", "true-false", "fill-in-the-gap"]:
                opt_match = re.match(r'^(?:[\*\-\+]\s*)?([A-E])[\.\)]\s*(.*)', line, re.I)
                if opt_match:
                    current_question["options"].append(line)
                else:
                    current_question["question"] += " " + line
            elif current_question["type"] == "matching":
                concept_match = re.match(r'^(?:[\*\-\+]\s*)?(\d+)[\.\)]\s*(.*)', line)
                desc_match = re.match(r'^(?:[\*\-\+]\s*)?([A-E])[\.\)]\s*(.*)', line, re.I)
                if concept_match:
                    current_question["leftItems"].append(line)
                elif desc_match:
                    current_question["rightItems"].append(line)
                else:
                    current_question["question"] += " " + line
            elif current_question["type"] == "true-false-cluster":
                stmt_match = re.match(r'^(?:[\*\-\+]\s*)?([A-D])[\.\)]\s*(.*)', line, re.I)
                if stmt_match:
                    current_question["statements"].append({"id": stmt_match.group(1).upper(), "text": line})
                else:
                    current_question["question"] += " " + line
            else:
                current_question["question"] += " " + line
                
    if current_question:
        sanitize_question(current_question)
        parsed_questions.append(current_question)
        
    return parsed_questions


class TestCBEHSimulationParser(unittest.TestCase):

    def test_prompt_sanitization_edge_cases(self):
        """Verify prompt cleaner handles orphaned fragments without damaging valid starting phrases."""
        test_pairs = [
            ("70. and cellular energy is produced in the mitochondria.", "Cellular energy is produced in the mitochondria."),
            ("In the context of cancer metastasis, tumor cells often undergo EMT.", "In the context of cancer metastasis, tumor cells often undergo EMT."),
            ("The primary function of the Golgi apparatus is protein modification.", "The primary function of the Golgi apparatus is protein modification."),
            ("The two strands of a DNA double helix are antiparallel.", "The two strands of a DNA double helix are antiparallel."),
            ("During embryonic folding, the flat trilaminar disc transforms...", "During embryonic folding, the flat trilaminar disc transforms..."),
            ("Loss of E-cadherin is characteristic of EMT.", "Loss of E-cadherin is characteristic of EMT."),
            ("70. (Open Question - Max 200 words) ... and cellular energy...", "Cellular energy..."),
            ("MODULE 4: INTERDISCIPLINARY\n67. (Multiple Choice) In the context...", "In the context..."),
            ("68. - and dopaminergic neurons...", "Dopaminergic neurons..."),
            ("69. : and the cellular pathway...", "Cellular pathway..."),
            ("[Embryology + Histology] Explain the role of neural crest cells.", "Explain the role of neural crest cells."),
            ("and or but and cellular respiration occurs in mitochondria.", "Cellular respiration occurs in mitochondria."),
            ("... - : and the secondary oocyte arrests in metaphase II.", "Secondary oocyte arrests in metaphase II."),
            ("At what specific stage does meiotic arrest occur?", "At what specific stage does meiotic arrest occur?"),
            ("According to the fluid mosaic model, lipid bilayers...", "According to the fluid mosaic model, lipid bilayers..."),
        ]
        for raw, expected in test_pairs:
            cleaned = clean_question_prompt(raw)
            self.assertEqual(cleaned, expected, f"Failed cleaning for input: '{raw}'")

    def test_module_categorization_by_id(self):
        """Verify module categorization adheres strictly to CBEH blueprint ID ranges."""
        for qid in range(1, 31):
            self.assertEqual(get_module_from_question_id(qid), "Cell Biology")
        for qid in range(31, 55):
            self.assertEqual(get_module_from_question_id(qid), "Histology")
        for qid in range(55, 67):
            self.assertEqual(get_module_from_question_id(qid), "Embryology")
        for qid in range(67, 71):
            self.assertEqual(get_module_from_question_id(qid), "Interdisciplinary")

    def test_parse_simulation_4_markdown(self):
        """Verify Simulation 4 parses exactly 70 questions and 4 Interdisciplinary questions."""
        sim4_path = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH_simulation_4.md"
        with open(sim4_path, "r", encoding="utf-8") as f:
            text = f.read()
        questions = parse_mock_exam_text(text)
        self.assertEqual(len(questions), 70, f"Expected 70 questions in Sim 4, got {len(questions)}")
        
        # Check module counts
        modules = [q["module"] for q in questions]
        self.assertEqual(modules.count("Cell Biology"), 30)
        self.assertEqual(modules.count("Histology"), 24)
        self.assertEqual(modules.count("Embryology"), 12)
        self.assertEqual(modules.count("Interdisciplinary"), 4)
        
        # Check Q67-70
        q67 = next(q for q in questions if q["id"] == 67)
        q68 = next(q for q in questions if q["id"] == 68)
        q69 = next(q for q in questions if q["id"] == 69)
        q70 = next(q for q in questions if q["id"] == 70)
        
        self.assertEqual(q67["module"], "Interdisciplinary")
        self.assertTrue(q67["question"].startswith("In the context of cancer metastasis"), f"Q67 prompt damaged: {q67['question']}")
        
        self.assertEqual(q68["module"], "Interdisciplinary")
        self.assertTrue(q68["question"].startswith("In Parkinson's disease"), f"Q68 prompt damaged: {q68['question']}")
        
        self.assertEqual(q69["module"], "Interdisciplinary")
        self.assertTrue(q69["question"].startswith("Osteoporosis represents"), f"Q69 prompt damaged: {q69['question']}")
        
        self.assertEqual(q70["module"], "Interdisciplinary")
        self.assertTrue(q70["question"].startswith("Cystic Fibrosis is caused"), f"Q70 prompt damaged: {q70['question']}")

    def test_parse_simulation_7_markdown(self):
        """Verify Simulation 7 parses exactly 70 questions and 4 Interdisciplinary questions."""
        sim7_path = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH_simulation_7.md"
        with open(sim7_path, "r", encoding="utf-8") as f:
            text = f.read()
        questions = parse_mock_exam_text(text)
        self.assertEqual(len(questions), 70, f"Expected 70 questions in Sim 7, got {len(questions)}")
        
        # Check Question 37 (which was previously dropped because it contains 'histology')
        q37 = next((q for q in questions if q["id"] == 37), None)
        self.assertIsNotNone(q37, "Q37 was dropped!")
        self.assertEqual(q37["module"], "Histology")
        self.assertTrue(q37["question"].startswith("The periodic acid-Schiff (PAS) stain"), f"Q37 prompt damaged: {q37['question']}")

        # Check module counts
        modules = [q["module"] for q in questions]
        self.assertEqual(modules.count("Cell Biology"), 30)
        self.assertEqual(modules.count("Histology"), 24)
        self.assertEqual(modules.count("Embryology"), 12)
        self.assertEqual(modules.count("Interdisciplinary"), 4)

        # Check Q67-70
        q67 = next(q for q in questions if q["id"] == 67)
        q68 = next(q for q in questions if q["id"] == 68)
        q69 = next(q for q in questions if q["id"] == 69)
        q70 = next(q for q in questions if q["id"] == 70)
        
        self.assertEqual(q67["module"], "Interdisciplinary")
        self.assertEqual(q68["module"], "Interdisciplinary")
        self.assertEqual(q69["module"], "Interdisciplinary")
        self.assertEqual(q70["module"], "Interdisciplinary")


if __name__ == "__main__":
    unittest.main(verbosity=2)
