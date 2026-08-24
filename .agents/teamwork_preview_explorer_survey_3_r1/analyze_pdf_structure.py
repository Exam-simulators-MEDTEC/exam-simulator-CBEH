import os
import zlib
import re

def analyze_pdf(filepath):
    print(f"\n==========================================")
    print(f"ANALYZING PDF: {os.path.basename(filepath)}")
    print(f"==========================================")
    with open(filepath, 'rb') as f:
        data = f.read()
    print(f"File size: {len(data)} bytes")
    
    # Find all objects
    objs = re.findall(rb'(\d+)\s+(\d+)\s+obj\s*(.*?)\s*endobj', data, re.DOTALL)
    print(f"Total objects: {len(objs)}")
    
    # Check Fonts
    fonts = [o for o in objs if b'/Font' in o[2] or b'/Type /Font' in o[2]]
    print(f"Font objects: {len(fonts)}")
    for f_obj in fonts[:5]:
        print(f"  Obj {f_obj[0]} header: {f_obj[2][:150]}")
        
    # Check if there are streams
    streams = re.findall(rb'(\d+)\s+(\d+)\s+obj\s*(.*?)\s*stream[\r\n]+(.*?)[\r\n]+endstream', data, re.DOTALL)
    print(f"Stream objects: {len(streams)}")
    for s_obj in streams:
        header = s_obj[2]
        stream_bytes = s_obj[3]
        try:
            decomp = zlib.decompress(stream_bytes)
        except Exception:
            decomp = stream_bytes
            
        if b'BT' in decomp:
            print(f"  Content stream in obj {s_obj[0]}: length decompressed = {len(decomp)}")
            # Let's inspect some operators in this content stream
            # Look for Tj, TJ, etc.
            sample_tjs = re.findall(rb'(\(.*?\)|<[0-9a-fA-F]+>|\[.*?\])\s*(Tj|TJ|\'|\")', decomp)
            print(f"    Text operations count: {len(sample_tjs)}")
            if sample_tjs:
                print(f"    First 5 operations: {sample_tjs[:5]}")
                print(f"    Sample decomp snippet: {decomp[:300]}")

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
for fname in sorted(os.listdir(mock_dir)):
    if fname.endswith(".pdf"):
        analyze_pdf(os.path.join(mock_dir, fname))
