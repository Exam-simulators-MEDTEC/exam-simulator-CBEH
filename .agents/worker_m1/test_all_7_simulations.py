#!/usr/bin/env python3
"""
Comprehensive Verification Suite for CBEH Exam Simulator - Milestone 1
Tests all 7 simulation files (5 PDFs, 2 MDs) with exact parser and sanitizer rules.
"""

import os
import re
import sys
import zlib
import unittest

def parse_cmap(cmap_stream):
    cmap = {}
    for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', cmap_stream):
        src = int(match.group(1), 16)
        dst_hex = match.group(2).decode('ascii')
        try:
            dst = bytes.fromhex(dst_hex).decode('utf-16-be')
            cmap[src] = dst
        except Exception:
            pass
    for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', cmap_stream):
        start = int(match.group(1), 16)
        end = int(match.group(2), 16)
        dest_start = int(match.group(3), 16)
        for code in range(start, end + 1):
            try:
                dst_hex = f"{dest_start + (code - start):04x}"
                dst = bytes.fromhex(dst_hex).decode('utf-16-be')
                cmap[code] = dst
            except Exception:
                pass
    for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+\[(.*?)\]', cmap_stream, re.DOTALL):
        start = int(match.group(1), 16)
        end = int(match.group(2), 16)
        array_hexes = re.findall(rb'<([0-9a-fA-F]+)>', match.group(3))
        for i, hex_code in enumerate(array_hexes):
            code = start + i
            if code <= end:
                try:
                    dst = bytes.fromhex(hex_code.decode('ascii')).decode('utf-16-be')
                    cmap[code] = dst
                except Exception:
                    pass
    return cmap

def extract_pdf_text(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    cmaps = {}
    stream_matches = list(re.finditer(rb'(\d+)\s+(\d+)\s+obj(.*?)stream[\r\n]+(.*?)[\r\n]+endstream', data, re.DOTALL))
    for m in stream_matches:
        header = m.group(3)
        stream_bytes = m.group(4)
        try:
            decomp = zlib.decompress(stream_bytes)
        except Exception:
            decomp = stream_bytes
        if b'/ToUnicode' in header or b'beginbfrange' in decomp or b'beginbfchar' in decomp:
            parsed = parse_cmap(decomp)
            if parsed:
                cmaps[int(m.group(1))] = parsed
    merged_cmap = {}
    for c in cmaps.values():
        merged_cmap.update(c)
        
    full_text_lines = []
    for m in stream_matches:
        stream_bytes = m.group(4)
        try:
            decomp = zlib.decompress(stream_bytes)
        except Exception:
            decomp = stream_bytes
            
        for tj in re.finditer(rb'\((.*?)\)\s*T[jJ]', decomp):
            full_text_lines.append(tj.group(1).decode('latin1', errors='ignore'))
            
        if b'BT' in decomp and b'ET' in decomp:
            page_text = ""
            for hex_m in re.finditer(rb'<([0-9a-fA-F]+)>\s*T[jJ]', decomp):
                hex_str = hex_m.group(1).decode('ascii')
                decoded = ""
                for i in range(0, len(hex_str), 4):
                    code = int(hex_str[i:i+4], 16)
                    decoded += merged_cmap.get(code, chr(code) if code < 128 else '?')
                page_text += decoded + "\n"
            for tj_arr in re.finditer(rb'\[(.*?)\]\s*TJ', decomp, re.DOTALL):
                arr_content = tj_arr.group(1)
                for hex_piece in re.finditer(rb'<([0-9a-fA-F]+)>', arr_content):
                    hex_str = hex_piece.group(1).decode('ascii')
                    decoded = ""
                    for i in range(0, len(hex_str), 4):
                        code = int(hex_str[i:i+4], 16)
                        decoded += merged_cmap.get(code, chr(code) if code < 128 else '?')
                    page_text += decoded
                page_text += "\n"
            if page_text:
                full_text_lines.append(page_text)
                
    return "\n".join(full_text_lines)

def get_module_from_question_id(id_val):
    try:
        parsed_id = int(id_val)
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

def clean_question_prompt_text(text):
    if not isinstance(text, str):
        return ""
    s = text.strip()
    
    # 1. Strip section dividers
    s = re.sub(r'[=\-\_\*]{3,}', ' ', s)
    
    # 2. Strip leaked module/part/section headers and topic lines
    s = re.sub(r'^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*', '', s, flags=re.I)
    s = re.sub(r'^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+', '', s, flags=re.I)
    s = re.sub(r'^TOPIC[\:\s\-–—]+[^\n\r]+', '', s, flags=re.I)
    s = re.sub(r'^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis|Interdisciplinary)[^\]]*\]\s*', '', s, flags=re.I)
    
    # 3. Strip redundant question numbers and types at start of prompt if present
    s = re.sub(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]\s*', '', s)
    s = re.sub(r'^\(?\s*(?:Multiple Choice|True or False|Open Question(?:\s*-\s*Max\s*\d+\s*words)?|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*', '', s, flags=re.I)
    
    # 4. Iterative loop: strip leading punctuation, symbols, bullets, orphaned conjunctions & lowercase-only fragment prepositions
    while True:
        prev = s
        s = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', s).strip()
        s = re.sub(r'^(?:and|or|but|also|as well as|&)\s+', '', s, flags=re.I).strip()
        s = re.sub(r'^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+', '', s).strip()
        if s == prev:
            break
            
    # 5. Capitalize first character and normalize internal whitespace
    if len(s) > 0:
        s = s[0].upper() + s[1:]
    return re.sub(r'\s+', ' ', s).strip()

def sanitize_question(q):
    if not q:
        return
    if "id" in q and q["id"] is not None:
        q["module"] = get_module_from_question_id(q["id"])
    if isinstance(q.get("question"), str):
        q["question"] = clean_question_prompt_text(q["question"])

def is_module_header_line(line):
    clean = line.strip()
    if re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]', clean):
        return None
    if re.match(r'^(?:[\*\-\+]?\s*)?[A-E][\.\)]', clean, re.I):
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
        mod = is_module_header_line(line)
        if mod:
            current_module = mod
            continue
            
        q_match = re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?(\d+)[\.\)]\s*(?:\(?\s*(Multiple Choice|True or False|Open Question(?:\s*-\s*Max\s*\d+\s*words)?|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*)?(.*)', line, re.I)
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
                    "module": current_module or get_module_from_question_id(id_val),
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
        
    for q in parsed_questions:
        sanitize_question(q)
        
    return parsed_questions


class TestAllSevenSimulations(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
        cls.files = sorted(os.listdir(cls.mock_dir))
        cls.all_questions = []
        cls.sim_results = {}
        
        for filename in cls.files:
            filepath = os.path.join(cls.mock_dir, filename)
            if filename.endswith(".md"):
                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()
            elif filename.endswith(".pdf"):
                text = extract_pdf_text(filepath)
            else:
                continue
                
            qs = parse_mock_exam_text(text)
            for q in qs:
                q["sourceFilename"] = filename
            cls.sim_results[filename] = qs
            cls.all_questions.extend(qs)

    def test_total_question_count(self):
        """Verify exactly 7 simulation files exist and parse to exactly 490 total questions (70 per sim)."""
        self.assertEqual(len(self.sim_results), 7, f"Expected 7 simulations, found {len(self.sim_results)}")
        self.assertEqual(len(self.all_questions), 490, f"Expected 490 total questions, got {len(self.all_questions)}")
        for filename, qs in self.sim_results.items():
            self.assertEqual(len(qs), 70, f"File '{filename}' parsed {len(qs)} questions instead of 70")

    def test_interdisciplinary_count_and_ids(self):
        """Verify exactly 28 total Interdisciplinary questions across 7 files (IDs 67-70)."""
        ind_questions = [q for q in self.all_questions if q["module"] == "Interdisciplinary"]
        self.assertEqual(len(ind_questions), 28, f"Expected 28 Interdisciplinary questions, got {len(ind_questions)}")
        
        for filename, qs in self.sim_results.items():
            ind = [q for q in qs if q["module"] == "Interdisciplinary"]
            self.assertEqual(len(ind), 4, f"File '{filename}' has {len(ind)} Interdisciplinary questions instead of 4")
            ind_ids = [q["id"] for q in ind]
            self.assertEqual(ind_ids, [67, 68, 69, 70], f"File '{filename}' Interdisciplinary IDs mismatch: {ind_ids}")

    def test_module_breakdown_across_all_simulations(self):
        """Verify standard CBEH blueprint module distribution across all 490 questions."""
        cb = [q for q in self.all_questions if q["module"] == "Cell Biology"]
        hist = [q for q in self.all_questions if q["module"] == "Histology"]
        emb = [q for q in self.all_questions if q["module"] == "Embryology"]
        ind = [q for q in self.all_questions if q["module"] == "Interdisciplinary"]
        
        self.assertEqual(len(cb), 210, f"Expected 210 Cell Biology questions (30x7), got {len(cb)}")
        self.assertEqual(len(hist), 168, f"Expected 168 Histology questions (24x7), got {len(hist)}")
        self.assertEqual(len(emb), 84, f"Expected 84 Embryology questions (12x7), got {len(emb)}")
        self.assertEqual(len(ind), 28, f"Expected 28 Interdisciplinary questions (4x7), got {len(ind)}")

    def test_question_types_breakdown(self):
        """Verify exactly 16 Open Questions and 54 Auto-Graded questions per simulation (112 Open, 378 Auto overall)."""
        open_qs = [q for q in self.all_questions if q["type"] == "open"]
        auto_qs = [q for q in self.all_questions if q["type"] != "open"]
        
        self.assertEqual(len(open_qs), 112, f"Expected 112 Open questions (16x7), got {len(open_qs)}")
        self.assertEqual(len(auto_qs), 378, f"Expected 378 Auto-Graded questions (54x7), got {len(auto_qs)}")

    def test_prompt_sanitization_no_orphaned_words(self):
        """Verify prompt cleaner eliminates orphaned conjunctions and leading symbols across all 490 prompts."""
        for q in self.all_questions:
            prompt = q["question"]
            self.assertFalse(re.match(r'^(?:and|or|but|also|as well as|&)\s+', prompt, re.I),
                             f"Prompt in {q['sourceFilename']} Q{q['id']} starts with orphaned conjunction: '{prompt}'")
            self.assertFalse(re.match(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/]', prompt),
                             f"Prompt in {q['sourceFilename']} Q{q['id']} starts with leading punctuation: '{prompt}'")
            self.assertTrue(len(prompt) > 0 and prompt[0].isupper() or prompt[0].isdigit() or prompt[0] == '"' or prompt[0] == "'",
                            f"Prompt in {q['sourceFilename']} Q{q['id']} does not start with capital letter: '{prompt}'")


if __name__ == "__main__":
    unittest.main(verbosity=2)
