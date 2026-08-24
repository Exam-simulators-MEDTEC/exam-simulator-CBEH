import os
import zlib
import re

with open("/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH simulation 1 .pdf", "rb") as f:
    data = f.read()

# find all /Font objects
font_objs = re.findall(rb'(\d+)\s+(\d+)\s+obj\s*(.*?<<.*?>>)\s*endobj', data, re.DOTALL)
for oid, gen, body in font_objs:
    if b'/Font' in body or b'/Type /Font' in body:
        print(f"Font Obj {oid}:")
        print(body.decode('latin1', errors='ignore'))
        print("-" * 40)
