import os
import re

# Let's inspect how module headers SHOULD be detected vs how they currently are detected

def is_module_header(line):
    # A module header line should NOT start with a question number like "1.", "67.", or option "* A." or "A."
    line_clean = line.strip()
    if re.match(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]', line_clean):
        return None
    if re.match(r'^(?:[\*\-\+]?\s*)?[A-E][\.\)]', line_clean):
        return None
        
    upper = line_clean.upper()
    
    # Check for Interdisciplinary
    # Variants: "MODULE 4", "MODULE IV", "PART IV", "PART 4", "SECTION IV", "SECTION 4", "INTERDISCIPLINARY", "HART IN0", "HART IV"
    if (re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:4|IV)\b', upper) or 
        re.search(r'\bINTERDISCIPLINARY\b', upper) or
        "HART IN0" in upper or "HART IV" in upper):
        return "Interdisciplinary"
        
    # Check for Embryology
    # Variants: "MODULE 3", "MODULE III", "PART III", "PART 3", "SECTION III", "SECTION 3", "EMBRYOLOGY", "HART III"
    if (re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:3|III)\b', upper) or 
        re.search(r'\bEMBRYOLOGY\b', upper) or
        "HART III" in upper):
        return "Embryology"
        
    # Check for Histology
    # Variants: "MODULE 2", "MODULE II", "PART II", "PART 2", "SECTION II", "SECTION 2", "HISTOLOGY", "HART II"
    if (re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:2|II)\b', upper) or 
        re.search(r'\bHISTOLOGY\b', upper) or
        "HART II" in upper):
        return "Histology"
        
    # Check for Cell Biology
    # Variants: "MODULE 1", "MODULE I", "PART I", "PART 1", "SECTION I", "SECTION 1", "CELL BIOLOGY", "HART I\b"
    if (re.search(r'\b(?:MODULE|PART|SECTION)\s*(?:1|I)\b', upper) or 
        re.search(r'\bCELL\s+BIOLOGY\b', upper) or
        "HART I" in upper):
        return "Cell Biology"
        
    return None

print("Testing is_module_header on lines:")
test_lines = [
    "MODULE 1: CELL BIOLOGY (30 Questions)",
    "67. (Multiple Choice) In the context of cancer metastasis, tumor cells often undergo an Epithelial-to-Mesenchymal Transition (EMT). Which histological characteristic is typically lost, and which cell biology pathway is often hyperactivated to facilitate this transition?",
    "MODULE 4: INTERDISCIPLINARY (4 Questions)",
    "MODULE IV: INTERDISCIPLINARY",
    "MODULE 4",
    "MODULE IV",
    "PART IV",
    "PART 4",
    "INTERDISCIPLINARY",
    "HART IN0 Interdisciplinary (* Iuestions)",
    "HART II0 Histology ((* Iuestions)",
    "HART III0 Embryology ('( Iuestions)"
]
for tl in test_lines:
    res = is_module_header(tl)
    print(f"'{tl[:60]}...' -> {res}")
