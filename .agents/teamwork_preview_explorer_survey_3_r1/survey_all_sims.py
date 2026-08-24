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

def extract_pdf_text(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    cmaps = {}
    stream_matches = list(re.finditer(rb'(\d+)\s+(\d+)\s+obj(.*?)stream[\r\n]+(.*?)[\r\n]+endstream', data, re.DOTALL))
    for m in stream_matches:
        obj_id = int(m.group(1))
        header = m.group(3)
        stream_bytes = m.group(4)
        try:
            decomp = zlib.decompress(stream_bytes)
        except Exception:
            decomp = stream_bytes
        if b'/ToUnicode' in header or b'beginbfrange' in decomp or b'beginbfchar' in decomp:
            parsed = parse_cmap(decomp)
            if parsed:
                cmaps[obj_id] = parsed
                
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
sim_files = sorted(os.listdir(mock_dir))

print(f"Found {len(sim_files)} files in Mock exams:")
for f in sim_files:
    print(f" - {f}")

print("\n" + "="*80)
print("INSPECTING RAW CONTENT OF QUESTIONS 67-70 AND HEADERS")
print("="*80)

for filename in sim_files:
    filepath = os.path.join(mock_dir, filename)
    if filename.endswith('.pdf'):
        text = extract_pdf_text(filepath)
    elif filename.endswith('.md') or filename.endswith('.txt'):
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    else:
        continue
    
    print(f"\n=======================================================")
    print(f"FILE: {filename} (Total lines: {len(text.splitlines())})")
    print(f"=======================================================")
    
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Let's find where Q60-Q70 and headers are
    in_late_section = False
    for idx, line in enumerate(lines):
        upper = line.upper()
        if any(h in upper for h in ["MODULE 4", "PART IV", "PART 4", "INTERDISCIPLINARY", "MODULE IV"]):
            print(f"  [Header Line {idx}]: {line}")
        
        q_match = re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?(\d+)[\.\)]\s*(.*)', line)
        if q_match:
            qid = int(q_match.group(1))
            if qid >= 65 and qid <= 70:
                print(f"  [Line {idx} - Q{qid}]: {line}")
                # Print next few lines (options/rubrics)
                for next_idx in range(idx + 1, min(idx + 6, len(lines))):
                    next_l = lines[next_idx]
                    if re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]', next_l) or "ANSWER KEY" in next_l.upper():
                        break
                    print(f"      -> {next_l}")
