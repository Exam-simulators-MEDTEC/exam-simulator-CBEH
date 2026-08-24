import os
import re
import zlib
import subprocess
import json

# 1. PDF Text Extractor using CMap stream decoder (identical to PDF.js)
def parse_cmap(cmap_stream):
    cmap = {}
    for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', cmap_stream):
        src = int(match.group(1), 16)
        dst_hex = match.group(2).decode('ascii')
        try:
            cmap[src] = bytes.fromhex(dst_hex).decode('utf-16-be')
        except Exception:
            pass
    for match in re.finditer(rb'<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>', cmap_stream):
        start = int(match.group(1), 16)
        end = int(match.group(2), 16)
        dest_start = int(match.group(3), 16)
        for code in range(start, end + 1):
            try:
                dst_hex = f"{dest_start + (code - start):04x}"
                cmap[code] = bytes.fromhex(dst_hex).decode('utf-16-be')
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
                    cmap[code] = bytes.fromhex(hex_code.decode('ascii')).decode('utf-16-be')
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
        try: decomp = zlib.decompress(stream_bytes)
        except Exception: decomp = stream_bytes
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
        try: decomp = zlib.decompress(stream_bytes)
        except Exception: decomp = stream_bytes
            
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

# 2. Test harness executing app.js via osascript
def parse_with_app_js(raw_text):
    temp_json_path = "/Users/alessandronicoletti11/Desktop/exam simulator/temp_exam_input.txt"
    with open(temp_json_path, "w", encoding="utf-8") as f:
        f.write(raw_text)
        
    osa_script = """
    const fs = $.NSFileManager.defaultManager;
    const inputPath = $("/Users/alessandronicoletti11/Desktop/exam simulator/temp_exam_input.txt");
    const inputData = $.NSString.stringWithContentsOfFileEncodingError(inputPath, $.NSUTF8StringEncoding, null);
    const inputText = ObjC.unwrap(inputData);

    const appJsPath = $("/Users/alessandronicoletti11/Desktop/exam simulator/app.js");
    const appJsData = $.NSString.stringWithContentsOfFileEncodingError(appJsPath, $.NSUTF8StringEncoding, null);
    const appJsCode = ObjC.unwrap(appJsData);

    function createDummy() {
      return {
        classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false },
        style: {},
        textContent: "",
        value: "",
        addEventListener: ()=>{},
        appendChild: ()=>{},
        click: ()=>{}
      };
    }

    const mockDoc = {
      body: { dataset: {} },
      getElementById: () => createDummy(),
      querySelector: () => createDummy(),
      querySelectorAll: () => [],
      createElement: () => createDummy(),
      addEventListener: (e, cb) => { if (e === "DOMContentLoaded") cb(); }
    };
    const mockWindow = { CBEH_QUESTIONS: [] };

    const testFn = new Function("window", "document", "localStorage", "console", `
      var globalObj = typeof globalThis !== "undefined" ? globalThis : this;
      globalObj.window = window; globalObj.document = document; globalObj.localStorage = localStorage;
      ${appJsCode}
      return window.parseMockExamText || globalObj.parseMockExamText;
    `);

    const parseMockExamText = testFn(mockWindow, mockDoc, { getItem: ()=>null, setItem: ()=>{}, removeItem: ()=>{} }, { log: ()=>{}, error: ()=>{} });
    const questions = parseMockExamText(inputText);

    const output = JSON.stringify(questions);
    $.NSFileHandle.fileHandleWithStandardOutput.writeData($(output).dataUsingEncoding($.NSUTF8StringEncoding));
    """
    
    res = subprocess.run(["osascript", "-l", "JavaScript", "-e", osa_script], capture_output=True, text=True)
    if res.returncode != 0:
        print("Error executing JS:", res.stderr)
        return []
    try:
        return json.loads(res.stdout)
    except Exception as e:
        print("JSON parse error:", e, "Stdout was:", res.stdout[:200])
        return []

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
all_simulations = sorted(os.listdir(mock_dir))

total_questions = 0
total_interdisciplinary = 0
results_summary = []

for filename in all_simulations:
    filepath = os.path.join(mock_dir, filename)
    if filename.endswith(".md"):
        with open(filepath, "r", encoding="utf-8") as f:
            raw_text = f.read()
    elif filename.endswith(".pdf"):
        raw_text = extract_pdf_text(filepath)
    else:
        continue
        
    questions = parse_with_app_js(raw_text)
    q_count = len(questions)
    total_questions += q_count
    
    cb_count = sum(1 for q in questions if q.get("module") == "Cell Biology")
    hist_count = sum(1 for q in questions if q.get("module") == "Histology")
    emb_count = sum(1 for q in questions if q.get("module") == "Embryology")
    ind_count = sum(1 for q in questions if q.get("module") == "Interdisciplinary")
    total_interdisciplinary += ind_count
    
    missing_ids = [i for i in range(1, 71) if not any(q.get("id") == i for q in questions)]
    
    # Check matching questions
    matching_issues = []
    for q in questions:
        if q.get("type") == "matching":
            if len(q.get("leftItems", [])) == 0 or len(q.get("rightItems", [])) == 0:
                matching_issues.append(f"Q{q.get('id')} (left={len(q.get('leftItems',[]))}, right={len(q.get('rightItems',[]))})")
                
    # Check fill-in-the-gap blanks
    blank_issues = []
    for q in questions:
        if q.get("type") == "fill-in-the-gap":
            prompt = q.get("question", "")
            if "_" not in prompt and "..." not in prompt and "[" not in prompt:
                blank_issues.append(f"Q{q.get('id')}: {prompt[:60]}")
                
    results_summary.append({
        "file": filename,
        "total": q_count,
        "cb": cb_count,
        "hist": hist_count,
        "emb": emb_count,
        "ind": ind_count,
        "missing_ids": missing_ids,
        "matching_issues": matching_issues,
        "blank_issues": blank_issues
    })

print("================================================================================")
print("              EMPIRICAL RESULTS ACROSS ALL 7 MOCK EXAM FILES")
print("================================================================================")
for r in results_summary:
    print(f"\nFile: {r['file']}")
    print(f"  Total Questions: {r['total']} / 70")
    print(f"  Distribution: CB={r['cb']}, Hist={r['hist']}, Emb={r['emb']}, Interdisciplinary={r['ind']}")
    if r['missing_ids']:
        print(f"  ❌ Missing IDs: {r['missing_ids']}")
    else:
        print(f"  ✅ All IDs 1-70 present")
    if r['matching_issues']:
        print(f"  ❌ Matching Issues (empty left/right): {r['matching_issues']}")
    else:
        print(f"  ✅ Matching Questions OK")
    if r['blank_issues']:
        print(f"  ⚠️ Fill-in-the-Gap Blank Destroyed: {r['blank_issues']}")
    else:
        print(f"  ✅ Fill-in-the-Gap Blanks OK")

print("\n--------------------------------------------------------------------------------")
print(f"GRAND TOTAL: {total_questions} Questions parsed across 7 mock exams.")
print(f"INTERDISCIPLINARY TOTAL: {total_interdisciplinary} / 28 Interdisciplinary questions.")
print("================================================================================")

# Clean up temp file
if os.path.exists("/Users/alessandronicoletti11/Desktop/exam simulator/temp_exam_input.txt"):
    os.remove("/Users/alessandronicoletti11/Desktop/exam simulator/temp_exam_input.txt")
