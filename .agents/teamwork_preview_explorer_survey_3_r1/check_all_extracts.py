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
            # Also extract plain string Tj / TJ if no hex
            # Try both ascii literal and hex
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
                # Also handle parenthesized strings in TJ
                for paren_piece in re.finditer(rb'\((.*?)\)', arr_content):
                    page_text += paren_piece.group(1).decode('latin1', errors='ignore')
                page_text += "\n"
            for paren_m in re.finditer(rb'\((.*?)\)\s*T[jJ]', decomp):
                page_text += paren_m.group(1).decode('latin1', errors='ignore') + "\n"
            if page_text:
                full_text_lines.append(page_text)
    return "\n".join(full_text_lines)

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
sim_files = sorted(os.listdir(mock_dir))

for filename in sim_files:
    filepath = os.path.join(mock_dir, filename)
    if filename.endswith('.pdf'):
        text = extract_pdf_text(filepath)
    else:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    
    print(f"\n=======================================================")
    print(f"FILE: {filename}")
    print(f"Sample length: {len(text)}")
    print(f"=======================================================")
    for line in text.splitlines():
        line_clean = line.strip()
        if not line_clean:
            continue
        if any(h in line_clean.upper() for h in ["MODULE", "PART", "INTERDISCIPLINARY", "ANSWER KEY"]):
            print(f"  HDR: {line_clean}")
        if re.search(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?(?:6[5-9]|70)[\.\)]', line_clean):
            print(f"  Q:   {line_clean[:140]}")
