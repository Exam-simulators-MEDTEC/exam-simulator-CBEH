import os
from check_all_extracts import extract_pdf_text

mock_dir = "/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams"
txt1 = extract_pdf_text(os.path.join(mock_dir, "CBEH simulation 1 .pdf"))
print(f"--- Sim 1 First 20 lines ---")
for l in txt1.splitlines()[:20]:
    print(repr(l))

print(f"--- Sim 1 Last 50 lines ---")
for l in txt1.splitlines()[-50:]:
    print(repr(l))
