import os
import re
import zlib

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

def extract_pdf_full(filepath):
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

# Enhanced Parser and Sanitizer simulation
def is_header_line(line):
    # If line starts with question number or option, it's NOT a header
    clean = line.strip()
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

def sanitize_question_prompt(q):
    if not isinstance(q.get("question"), str):
        return
        
    # Standard CBEH ID fallback
    if 67 <= q["id"] <= 70:
        q["module"] = "Interdisciplinary"
    elif 55 <= q["id"] <= 66 and (not q.get("module") or q["module"] == "Cell Biology"):
        q["module"] = "Embryology"
    elif 31 <= q["id"] <= 54 and (not q.get("module") or q["module"] == "Cell Biology"):
        q["module"] = "Histology"
    elif 1 <= q["id"] <= 30 and not q.get("module"):
        q["module"] = "Cell Biology"
        
    text = q["question"]
    # Strip divider characters
    text = re.sub(r'[=\-\_\*]{3,}', ' ', text)
    # Strip spilled module/part headers
    text = re.sub(r'(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?', '', text, flags=re.I)
    text = re.sub(r'^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+', '', text, flags=re.I)
    text = re.sub(r'^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis)[^\]]*\]\s*', '', text, flags=re.I)
    
    # Strip leading punctuation/symbols and orphaned leading words repeatedly
    orphan_pattern = re.compile(r'^(?:[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+|\b(?:and|or|the|with|in|but|so|for|of|to|by|at|on|from|as|that|which|whereas|while|also|because|where)\b\s*)+', re.I)
    
    while True:
        prev = text
        text = orphan_pattern.sub('', text).strip()
        if text == prev:
            break
            
    if len(text) > 0:
        text = text[0].upper() + text[1:]
    text = re.sub(r'\s+', ' ', text).strip()
    q["question"] = text

def parse_simulation_text(text):
    rawLines = [l.strip() for l in text.splitlines() if l.strip()]
    lines = [l for l in rawLines if not re.match(r'^[=\-\_\*]{3,}$', l)]
    
    answerKeyStartIndex = -1
    for i, l in enumerate(lines):
        if "ANSWER KEY" in l.upper():
            answerKeyStartIndex = i
            break
    if answerKeyStartIndex == -1:
        # If no answer key divider, use all lines
        questionLines = lines
        answerLines = []
    else:
        questionLines = lines[:answerKeyStartIndex]
        answerLines = lines[answerKeyStartIndex:]
        
    parsed = []
    currentModule = "Cell Biology"
    currentQ = None
    
    for line in questionLines:
        mod = is_header_line(line)
        if mod:
            currentModule = mod
            continue
            
        qMatch = re.match(r'^(?:#+\s*)?(?:[\*\-\+]\s*)?(\d+)[\.\)]\s*(?:\(?\s*(Multiple Choice|True or False|Open Question|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*)?(.*)', line, re.I)
        if qMatch and qMatch.group(1):
            id_val = int(qMatch.group(1))
            typeStr = (qMatch.group(2) or "").lower()
            promptText = qMatch.group(3) or ""
            isNewQ = qMatch.group(2) or re.match(r'^(match|evaluate|assess|which|what|fill|select|choose|identify)', promptText, re.I) or not currentQ or id_val == (currentQ["id"] + 1)
            
            if isNewQ:
                if currentQ:
                    sanitize_question_prompt(currentQ)
                    parsed.append(currentQ)
                qtype = "multiple-choice"
                if "matching" in typeStr or re.match(r'^match\b', promptText, re.I): qtype = "matching"
                elif "true or false cluster" in typeStr or re.match(r'^(evaluate|assess)\s+the\s+following', promptText, re.I): qtype = "true-false-cluster"
                elif "true or false" in typeStr: qtype = "true-false"
                elif "fill in the gap" in typeStr or re.match(r'^fill\s+in', promptText, re.I): qtype = "fill-in-the-gap"
                elif "open question" in typeStr or re.match(r'^(explain|describe)\b', promptText, re.I): qtype = "open"
                
                # Determine module: header or fallback ID
                mod_assigned = currentModule
                if 67 <= id_val <= 70: mod_assigned = "Interdisciplinary"
                elif 55 <= id_val <= 66 and currentModule == "Cell Biology": mod_assigned = "Embryology"
                elif 31 <= id_val <= 54 and currentModule == "Cell Biology": mod_assigned = "Histology"
                
                currentQ = {
                    "id": id_val,
                    "type": qtype,
                    "module": mod_assigned,
                    "question": promptText,
                    "options": [],
                    "leftItems": [],
                    "rightItems": [],
                    "statements": []
                }
                continue
        if currentQ:
            currentQ["question"] += " " + line
            
    if currentQ:
        sanitize_question_prompt(currentQ)
        parsed.append(currentQ)
    return parsed

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
total_interdisciplinary = 0
total_all = 0

for filename in sorted(os.listdir(mock_dir)):
    filepath = os.path.join(mock_dir, filename)
    if filename.endswith(".md"):
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    elif filename.endswith(".pdf"):
        text = extract_pdf_full(filepath)
    else:
        continue
        
    qs = parse_simulation_text(text)
    inter = [q for q in qs if q["module"] == "Interdisciplinary"]
    total_interdisciplinary += len(inter)
    total_all += len(qs)
    print(f"File {filename}: {len(qs)} total questions, {len(inter)} Interdisciplinary (IDs: {[q['id'] for q in inter]})")
    for q in inter:
        print(f"   Q{q['id']}: {q['question'][:90]}")

print(f"\nTOTAL ALL QUESTIONS: {total_all}, TOTAL INTERDISCIPLINARY: {total_interdisciplinary}")
