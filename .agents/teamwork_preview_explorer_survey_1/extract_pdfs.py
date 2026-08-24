import os
import re
import zlib

def parse_cmap(cmap_stream):
    cmap = {}
    # look for bfrange and bfchar
    # 1. bfchar
    for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', cmap_stream):
        src = int(match.group(1), 16)
        dst_hex = match.group(2).decode('ascii')
        # decode dst_hex as utf-16be
        try:
            dst = bytes.fromhex(dst_hex).decode('utf-16-be')
            cmap[src] = dst
        except Exception:
            pass
    # 2. bfrange <start> <end> <dest_start>
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
    # 3. bfrange with array: <start> <end> [ <hex> <hex> ... ]
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

def extract_skia_pdf(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
        
    # Find all objects and streams
    # Find CMaps
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
                
    # Combine all cmaps into a general glyph resolver fallback
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
            
        # Check if decomp has BT ... ET (content streams)
        if b'BT' in decomp and b'ET' in decomp:
            # find all hex text operations <00120034> Tj or [ <0012> 12 <0034> ] TJ
            # Also regular (ascii) Tj
            page_text = ""
            for hex_m in re.finditer(rb'<([0-9a-fA-F]+)>\s*T[jJ]', decomp):
                hex_str = hex_m.group(1).decode('ascii')
                # decode 2-byte glyphs
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
for filename in sorted(os.listdir(mock_dir)):
    if filename.endswith(".pdf"):
        filepath = os.path.join(mock_dir, filename)
        txt = extract_skia_pdf(filepath)
        print(f"=== {filename} (length {len(txt)}) ===")
        for line in txt.splitlines():
            line_str = line.strip()
            if any(k in line_str.upper() for k in ["MODULE", "PART", "INTERDISCIPLINARY", "ANSWER KEY"]):
                print(f"  Header: {line_str}")
            elif re.search(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?(?:6[7-9]|70)[\.\)]', line_str):
                print(f"  Q: {line_str[:120]}")
