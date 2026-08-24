import struct
import zlib
import re
import os

def parse_ttf_cmap(ttf_bytes):
    # TTF header
    if len(ttf_bytes) < 12:
        return {}
    sfnt_ver, num_tables = struct.unpack(">4sH", ttf_bytes[:6])
    tables = {}
    for i in range(num_tables):
        off = 12 + i * 16
        tag, check_sum, t_off, t_len = struct.unpack(">4sIII", ttf_bytes[off:off+16])
        tables[tag] = (t_off, t_len)
        
    if b'cmap' not in tables:
        return {}
        
    cmap_off, _ = tables[b'cmap']
    cmap_ver, num_cmap_tables = struct.unpack(">HH", ttf_bytes[cmap_off:cmap_off+4])
    
    # We want Unicode cmap (platform 0, or platform 3 encoding 1/10)
    best_subtable_off = None
    for i in range(num_cmap_tables):
        p_off = cmap_off + 4 + i * 8
        plat_id, enc_id, sub_off = struct.unpack(">HHI", ttf_bytes[p_off:p_off+8])
        if (plat_id == 0) or (plat_id == 3 and enc_id in (1, 10)) or (plat_id == 1 and enc_id == 0):
            best_subtable_off = cmap_off + sub_off
            if plat_id == 3 and enc_id == 1:
                break
                
    if not best_subtable_off:
        return {}
        
    fmt = struct.unpack(">H", ttf_bytes[best_subtable_off:best_subtable_off+2])[0]
    glyph_to_char = {}
    
    if fmt == 4:
        length, lang, seg_count_x2 = struct.unpack(">HHH", ttf_bytes[best_subtable_off+2:best_subtable_off+8])
        seg_count = seg_count_x2 // 2
        off = best_subtable_off + 14
        end_codes = struct.unpack(f">{seg_count}H", ttf_bytes[off:off+seg_count*2])
        off += seg_count * 2 + 2 # skip reservedPad
        start_codes = struct.unpack(f">{seg_count}H", ttf_bytes[off:off+seg_count*2])
        off += seg_count * 2
        id_deltas = struct.unpack(f">{seg_count}h", ttf_bytes[off:off+seg_count*2])
        off += seg_count * 2
        id_range_offsets_off = off
        id_range_offsets = struct.unpack(f">{seg_count}H", ttf_bytes[off:off+seg_count*2])
        
        for i in range(seg_count):
            start = start_codes[i]
            end = end_codes[i]
            delta = id_deltas[i]
            ro = id_range_offsets[i]
            if start == 0xFFFF:
                break
            for c in range(start, end + 1):
                if ro == 0:
                    gid = (c + delta) & 0xFFFF
                else:
                    ro_addr = id_range_offsets_off + i * 2 + ro
                    glyph_index_addr = ro_addr + (c - start) * 2
                    gid = struct.unpack(">H", ttf_bytes[glyph_index_addr:glyph_index_addr+2])[0]
                    if gid != 0:
                        gid = (gid + delta) & 0xFFFF
                if gid != 0 and gid not in glyph_to_char:
                    glyph_to_char[gid] = chr(c)
    elif fmt == 0:
        # 256 byte array
        length, lang = struct.unpack(">HH", ttf_bytes[best_subtable_off+2:best_subtable_off+6])
        for c in range(256):
            gid = ttf_bytes[best_subtable_off + 6 + c]
            if gid != 0 and gid not in glyph_to_char:
                glyph_to_char[gid] = chr(c)
    elif fmt == 12:
        # 32-bit segment mapping
        _, length, lang, num_groups = struct.unpack(">HII", ttf_bytes[best_subtable_off+2:best_subtable_off+16])
        off = best_subtable_off + 16
        for _ in range(num_groups):
            start_c, end_c, start_gid = struct.unpack(">III", ttf_bytes[off:off+12])
            off += 12
            for c in range(start_c, end_c + 1):
                gid = start_gid + (c - start_c)
                if gid not in glyph_to_char:
                    try:
                        glyph_to_char[gid] = chr(c)
                    except Exception:
                        pass
    return glyph_to_char

def extract_pdf_with_ttf(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
        
    objs = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\s*(.*?)\s*endobj', data, re.DOTALL):
        objs[int(m.group(1))] = m.group(3)
        
    # Find all fonts and their TTF files
    font_maps = {}
    for oid, content in objs.items():
        if b'/Type /Font' in content or b'/Font' in content:
            # check FontDescriptor
            fd_m = re.search(rb'/FontDescriptor\s+(\d+)\s+\d+\s+R', content)
            if fd_m:
                fd_id = int(fd_m.group(1))
                if fd_id in objs:
                    fd_content = objs[fd_id]
                    ff2_m = re.search(rb'/FontFile2\s+(\d+)\s+\d+\s+R', fd_content)
                    if ff2_m:
                        ff2_id = int(ff2_m.group(1))
                        if ff2_id in objs:
                            stream_m = re.search(rb'stream[\r\n]+(.*?)[\r\n]+endstream', objs[ff2_id], re.DOTALL)
                            if stream_m:
                                raw = stream_m.group(1)
                                try:
                                    decomp = zlib.decompress(raw)
                                except Exception:
                                    decomp = raw
                                g2c = parse_ttf_cmap(decomp)
                                font_maps[oid] = g2c

    # Also extract ToUnicode CMaps
    to_unicode_maps = {}
    for oid, content in objs.items():
        if b'/ToUnicode' in content:
            tu_m = re.search(rb'/ToUnicode\s+(\d+)\s+\d+\s+R', content)
            if tu_m:
                tu_id = int(tu_m.group(1))
                if tu_id in objs:
                    stream_m = re.search(rb'stream[\r\n]+(.*?)[\r\n]+endstream', objs[tu_id], re.DOTALL)
                    if stream_m:
                        raw = stream_m.group(1)
                        try:
                            decomp = zlib.decompress(raw)
                        except Exception:
                            decomp = raw
                        cmap = {}
                        for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', decomp):
                            src = int(match.group(1), 16)
                            dst_hex = match.group(2).decode('ascii')
                            try:
                                cmap[src] = bytes.fromhex(dst_hex).decode('utf-16-be')
                            except Exception:
                                pass
                        for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', decomp):
                            start = int(match.group(1), 16)
                            end = int(match.group(2), 16)
                            dest_start = int(match.group(3), 16)
                            for code in range(start, end + 1):
                                try:
                                    cmap[code] = bytes.fromhex(f"{dest_start + (code - start):04x}").decode('utf-16-be')
                                except Exception:
                                    pass
                        to_unicode_maps[oid] = cmap

    # Master fallback map combining all
    master_map = {}
    for tu in to_unicode_maps.values():
        master_map.update(tu)
    for fm in font_maps.values():
        for gid, ch in fm.items():
            if gid not in master_map:
                master_map[gid] = ch

    # Now extract pages text
    page_objs = []
    for oid, content in sorted(objs.items()):
        if b'/Type /Page' in content and b'/Type /Pages' not in content:
            page_objs.append((oid, content))
            
    content_stream_ids = []
    if page_objs:
        for p_id, p_content in page_objs:
            c_match = re.search(rb'/Contents\s+(\d+)\s+\d+\s+R', p_content)
            if c_match:
                content_stream_ids.append(int(c_match.group(1)))
            else:
                arr_m = re.search(rb'/Contents\s*\[(.*?)\]', p_content, re.DOTALL)
                if arr_m:
                    for cid in re.findall(rb'(\d+)\s+\d+\s+R', arr_m.group(1)):
                        content_stream_ids.append(int(cid))
    else:
        content_stream_ids = [oid for oid, c in objs.items() if b'stream' in c]
        
    full_text = []
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
            
        for bt_m in re.finditer(rb'BT\s*(.*?)\s*ET', decomp, re.DOTALL):
            bt_block = bt_m.group(1)
            block_text = ""
            for op_m in re.finditer(rb'(<[0-9a-fA-F]+>|\(.*?\)|\[.*?\])\s*(Tj|TJ|\'|\")', bt_block, re.DOTALL):
                operand = op_m.group(1)
                operator = op_m.group(2)
                if operand.startswith(b'<'):
                    hex_str = operand[1:-1].decode('ascii')
                    for i in range(0, len(hex_str), 4):
                        code = int(hex_str[i:i+4], 16)
                        block_text += master_map.get(code, chr(code) if 32 <= code < 127 else "?")
                elif operand.startswith(b'['):
                    for piece in re.finditer(rb'(<[0-9a-fA-F]+>|\(.*?\)|-?\d+)', operand):
                        p = piece.group(1)
                        if p.startswith(b'<'):
                            hex_str = p[1:-1].decode('ascii')
                            for i in range(0, len(hex_str), 4):
                                code = int(hex_str[i:i+4], 16)
                                block_text += master_map.get(code, chr(code) if 32 <= code < 127 else "?")
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
    if fname.endswith(".pdf"):
        t = extract_pdf_with_ttf(fpath)
        print(f"\n=== {fname} ===")
        print(f"Extracted length: {len(t)}")
        lines = [l.strip() for l in t.splitlines() if l.strip()]
        for l in lines[:10]:
            print("  ", repr(l))
        # Look for Q67-70
        for l in lines:
            if re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?(?:6[7-9]|70)[\.\)]', l):
                print("  FOUND:", l[:120])
