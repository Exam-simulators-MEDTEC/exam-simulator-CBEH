import os
import zlib
import re

def extract_pdf_accurate(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
        
    # Find all objects
    objs = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\s*(.*?)\s*endobj', data, re.DOTALL):
        objs[int(m.group(1))] = m.group(3)
        
    # Extract ToUnicode CMaps
    font_cmaps = {}
    for obj_id, content in objs.items():
        if b'/ToUnicode' in content:
            # find reference e.g. /ToUnicode 15 0 R
            to_uni_match = re.search(rb'/ToUnicode\s+(\d+)\s+\d+\s+R', content)
            if to_uni_match:
                cmap_obj_id = int(to_uni_match.group(1))
                if cmap_obj_id in objs:
                    cmap_content = objs[cmap_obj_id]
                    # extract stream
                    stream_m = re.search(rb'stream[\r\n]+(.*?)[\r\n]+endstream', cmap_content, re.DOTALL)
                    if stream_m:
                        raw = stream_m.group(1)
                        try:
                            decomp = zlib.decompress(raw)
                        except Exception:
                            decomp = raw
                        # parse cmap
                        cmap = {}
                        # 1. bfchar
                        for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', decomp):
                            src = int(match.group(1), 16)
                            dst_hex = match.group(2).decode('ascii')
                            try:
                                dst = bytes.fromhex(dst_hex).decode('utf-16-be')
                                cmap[src] = dst
                            except Exception:
                                pass
                        # 2. bfrange
                        for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', decomp):
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
                        # 3. bfrange array
                        for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+\[(.*?)\]', decomp, re.DOTALL):
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
                        font_cmaps[obj_id] = cmap

    # Also make a master cmap
    master_cmap = {}
    for cm in font_cmaps.values():
        master_cmap.update(cm)
        
    # Also check if there are standalone CMap streams not linked via /ToUnicode
    for obj_id, content in objs.items():
        if b'beginbfrange' in content or b'beginbfchar' in content:
            stream_m = re.search(rb'stream[\r\n]+(.*?)[\r\n]+endstream', content, re.DOTALL)
            if stream_m:
                raw = stream_m.group(1)
                try:
                    decomp = zlib.decompress(raw)
                except Exception:
                    decomp = raw
                for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', decomp):
                    src = int(match.group(1), 16)
                    dst_hex = match.group(2).decode('ascii')
                    try:
                        master_cmap[src] = bytes.fromhex(dst_hex).decode('utf-16-be')
                    except Exception:
                        pass
                for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', decomp):
                    start = int(match.group(1), 16)
                    end = int(match.group(2), 16)
                    dest_start = int(match.group(3), 16)
                    for code in range(start, end + 1):
                        try:
                            dst_hex = f"{dest_start + (code - start):04x}"
                            master_cmap[code] = bytes.fromhex(dst_hex).decode('utf-16-be')
                        except Exception:
                            pass
                for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+\[(.*?)\]', decomp, re.DOTALL):
                    start = int(match.group(1), 16)
                    end = int(match.group(2), 16)
                    array_hexes = re.findall(rb'<([0-9a-fA-F]+)>', match.group(3))
                    for i, hex_code in enumerate(array_hexes):
                        code = start + i
                        if code <= end:
                            try:
                                master_cmap[code] = bytes.fromhex(hex_code.decode('ascii')).decode('utf-16-be')
                            except Exception:
                                pass
                                
    # Extract text from content streams
    full_text = []
    # Find pages or content streams in page order
    # Look for /Type /Page objects
    page_objs = []
    for obj_id, content in sorted(objs.items()):
        if b'/Type /Page' in content and b'/Type /Pages' not in content:
            page_objs.append((obj_id, content))
            
    content_stream_ids = []
    if page_objs:
        for p_id, p_content in page_objs:
            c_match = re.search(rb'/Contents\s+(\d+)\s+\d+\s+R', p_content)
            if c_match:
                content_stream_ids.append(int(c_match.group(1)))
            else:
                # array of contents
                arr_m = re.search(rb'/Contents\s*\[(.*?)\]', p_content, re.DOTALL)
                if arr_m:
                    for cid in re.findall(rb'(\d+)\s+\d+\s+R', arr_m.group(1)):
                        content_stream_ids.append(int(cid))
    else:
        content_stream_ids = [oid for oid, c in objs.items() if b'stream' in c]
        
    for cid in content_stream_ids:
        if cid not in objs:
            continue
        c_content = objs[cid]
        stream_m = re.search(rb'stream[\r\n]+(.*?)[\r\n]+endstream', c_content, re.DOTALL)
        if not stream_m:
            continue
        raw = stream_m.group(1)
        try:
            decomp = zlib.decompress(raw)
        except Exception:
            decomp = raw
            
        # Parse BT ... ET blocks
        # In each block, extract text and track Tm / Td / TL / cm
        for bt_m in re.finditer(rb'BT\s*(.*?)\s*ET', decomp, re.DOTALL):
            bt_block = bt_m.group(1)
            # Find all Tj, TJ
            block_text = ""
            for op_m in re.finditer(rb'(<[0-9a-fA-F]+>|\(.*?\)|\[.*?\])\s*(Tj|TJ|\'|\")', bt_block, re.DOTALL):
                operand = op_m.group(1)
                operator = op_m.group(2)
                if operand.startswith(b'<'):
                    hex_str = operand[1:-1].decode('ascii')
                    for i in range(0, len(hex_str), 4):
                        code = int(hex_str[i:i+4], 16)
                        block_text += master_cmap.get(code, chr(code) if 32 <= code < 127 else f"[{code:04x}]")
                elif operand.startswith(b'['):
                    for piece in re.finditer(rb'(<[0-9a-fA-F]+>|\(.*?\)|-?\d+)', operand):
                        p = piece.group(1)
                        if p.startswith(b'<'):
                            hex_str = p[1:-1].decode('ascii')
                            for i in range(0, len(hex_str), 4):
                                code = int(hex_str[i:i+4], 16)
                                block_text += master_cmap.get(code, chr(code) if 32 <= code < 127 else f"[{code:04x}]")
                        elif p.startswith(b'('):
                            block_text += p[1:-1].decode('latin1', errors='ignore')
                elif operand.startswith(b'('):
                    block_text += operand[1:-1].decode('latin1', errors='ignore')
                if operator in [b"'", b'"']:
                    block_text += "\n"
            if block_text:
                full_text.append(block_text)
                
    return "\n".join(full_text)

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
for fname in sorted(os.listdir(mock_dir)):
    fpath = os.path.join(mock_dir, fname)
    if fname.endswith(".md"):
        with open(fpath, "r", encoding="utf-8") as f:
            t = f.read()
    else:
        t = extract_pdf_accurate(fpath)
    print(f"=== {fname} ===")
    lines = [l.strip() for l in t.splitlines() if l.strip()]
    print(f"Total non-empty lines: {len(lines)}")
    # Print sample
    print("First 3 lines:", lines[:3])
    print("Last 3 lines:", lines[-3:])
