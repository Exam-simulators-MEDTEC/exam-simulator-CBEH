import re

def clean_question_prompt(raw_text):
    if not isinstance(raw_text, str):
        return ""
    text = raw_text.strip()
    
    # 1. Strip section dividers
    text = re.sub(r'[=\-\_\*]{3,}', ' ', text)
    
    # 2. Strip spilled module/part headers
    text = re.sub(r'^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*', '', text, flags=re.I)
    text = re.sub(r'^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+', '', text, flags=re.I)
    text = re.sub(r'^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis|Interdisciplinary)[^\]]*\]\s*', '', text, flags=re.I)
    
    # 3. Strip question numbers and type labels if still present at the start of prompt
    text = re.sub(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]\s*', '', text)
    text = re.sub(r'^\(?\s*(?:Multiple Choice|True or False|Open Question(?:\s*-\s*Max\s*\d+\s*words)?|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*', '', text, flags=re.I)
    
    # 4. Iterative loop to strip leading punctuation, symbols, and orphaned conjunctions / lowercase fragments
    while True:
        prev = text
        # Strip leading punctuation/symbols
        text = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', text).strip()
        # Strip orphaned leading conjunctions (case-insensitive for 'and', 'or', 'but', 'also', 'as well as', '&')
        text = re.sub(r'^(?:and|or|but|also|as well as|&)\s+', '', text, flags=re.I).strip()
        # Strip orphaned LOWERCASE-ONLY preposition fragments (do NOT strip capitalized 'In', 'The', 'With', etc.)
        text = re.sub(r'^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while|because|the|a|an)\s+', '', text).strip()
        if text == prev:
            break
            
    # 5. Capitalize first letter and normalize internal whitespace
    if len(text) > 0:
        text = text[0].upper() + text[1:]
    text = re.sub(r'\s+', ' ', text).strip()
    return text

test_cases = [
    ("70. and cellular energy is produced in the mitochondria.", "Cellular energy is produced in the mitochondria."),
    ("In the context of cancer metastasis, tumor cells often undergo EMT.", "In the context of cancer metastasis, tumor cells often undergo EMT."),
    ("The primary function of the Golgi apparatus is protein modification.", "The primary function of the Golgi apparatus is protein modification."),
    ("70. (Open Question - Max 200 words) ... and cellular energy is produced...", "Cellular energy is produced..."),
    ("MODULE 4: INTERDISCIPLINARY (4 Questions)\n67. (Multiple Choice) In the context of cancer metastasis...", "In the context of cancer metastasis..."),
    ("68. - and dopaminergic neurons...", "Dopaminergic neurons..."),
    ("69. : and the cellular pathway is activated...", "Cellular pathway is activated..."),
    ("[Embryology + Histology] Explain the role of neural crest cells.", "Explain the role of neural crest cells."),
    ("67. (Multiple Choice) Loss of E-cadherin is characteristic of EMT.", "Loss of E-cadherin is characteristic of EMT."),
    ("The two strands of a DNA double helix are antiparallel.", "The two strands of a DNA double helix are antiparallel."),
    ("During embryonic folding, the flat trilaminar disc transforms...", "During embryonic folding, the flat trilaminar disc transforms..."),
    ("and or but and cellular respiration occurs in mitochondria.", "Cellular respiration occurs in mitochondria."),
    ("... - : and the secondary oocyte arrests in metaphase II.", "Secondary oocyte arrests in metaphase II."),
]

print("="*80)
print("TESTING PROMPT SANITIZATION")
print("="*80)
all_passed = True
for raw, expected in test_cases:
    cleaned = clean_question_prompt(raw)
    passed = cleaned == expected
    if not passed:
        all_passed = False
    print(f"[{'PASS' if passed else 'FAIL'}]")
    print(f"  Input:    {raw}")
    print(f"  Expected: {expected}")
    print(f"  Output:   {cleaned}\n")

print(f"Overall Result: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
