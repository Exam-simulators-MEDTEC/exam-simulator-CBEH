import os
import re
import zlib
import json

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

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"

# Let's inspect the exact lines of questions 67-70 in all files
results = {}
for fname in sorted(os.listdir(mock_dir)):
    fpath = os.path.join(mock_dir, fname)
    if fname.endswith(".md"):
        with open(fpath, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        text = extract_pdf_full(fpath)
    
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    results[fname] = lines

print("="*80)
print("AUDITING QUESTIONS 67-70 IN EACH SIMULATION")
print("="*80)

for fname, lines in results.items():
    print(f"\n>>> Simulation: {fname}")
    
    # Find all question header lines (1-70)
    q_lines = {}
    answer_key_idx = -1
    for idx, l in enumerate(lines):
        if "ANSWER KEY" in l.upper():
            answer_key_idx = idx
            break
            
    scan_lines = lines[:answer_key_idx] if answer_key_idx != -1 else lines
    
    current_q = None
    for idx, l in enumerate(scan_lines):
        m = re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?(\d+)[\.\)]\s*(.*)', l)
        if m:
            qid = int(m.group(1))
            if 1 <= qid <= 70:
                if qid not in q_lines:
                    q_lines[qid] = []
                q_lines[qid].append(l)
                current_q = qid
        elif current_q is not None and not re.match(r'^(?:[\*\-\+]?\s*)?[A-E][\.\)]', l):
            # Continuation line
            q_lines[current_q].append(l)

    print(f"Total distinct question IDs found in test body: {len(q_lines)} (IDs: {min(q_lines.keys()) if q_lines else None} to {max(q_lines.keys()) if q_lines else None})")
    
    for qid in [67, 68, 69, 70]:
        if qid in q_lines:
            full_prompt = " ".join(q_lines[qid])
            print(f"  Q{qid}: {full_prompt[:160]}")
        else:
            print(f"  Q{qid}: [NOT FOUND IN SCAN]")
