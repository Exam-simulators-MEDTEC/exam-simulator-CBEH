import re

def clean_prompt(prompt):
    if not isinstance(prompt, str):
        return prompt
    text = prompt
    # Strip divider marks
    text = re.sub(r'[=\-\_\*]{3,}', ' ', text)
    # Strip unstripped module/part headers
    text = re.sub(r'^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*', '', text, flags=re.I)
    text = re.sub(r'^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+', '', text, flags=re.I)
    text = re.sub(r'^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis)[^\]]*\]\s*', '', text, flags=re.I)
    
    # Strip leading punctuation/symbols (like ":", "-", ".", "*", ")", "]", ">")
    text = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', text).strip()
    
    # Strip orphaned leading conjunctions (case-insensitive for and/or/but/also/as well as, or lowercase for other fragments)
    # Examples: "and cellular energy...", "or in the mitochondria...", "and the cellular..."
    while True:
        prev = text
        # 1. Leading conjunctions: and, or, but, &
        text = re.sub(r'^(?:and|or|but|also|as well as|&)\s+', '', text, flags=re.I).strip()
        # 2. Leading lowercase prepositions/fragments that indicate a truncated sentence start: e.g. "with cellular...", "in which...", "to produce..."
        text = re.sub(r'^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while)\s+', '', text).strip()
        # 3. Strip any punctuation exposed after removing words
        text = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', text).strip()
        if text == prev:
            break
            
    if len(text) > 0:
        text = text[0].upper() + text[1:]
    text = re.sub(r'\s+', ' ', text).strip()
    return text

test_prompts = [
    "and cellular energy is produced in the mitochondria.",
    "70. and cellular energy...",
    "... and cellular energy is required.",
    "- and cellular energy is synthesized via ATP synthase.",
    "In the context of cancer metastasis, tumor cells often undergo an EMT.",
    "The primary function of the nucleolus is rRNA synthesis.",
    "Which type of simple epithelium is specialized for rapid diffusion?",
    "MODULE 4: INTERDISCIPLINARY 67. In the context of cancer...",
    "[Embryology + Histology] What is the origin of...",
    ": and or the membrane potential is maintained by Na+/K+ ATPase."
]

for p in test_prompts:
    res = clean_prompt(p)
    print(f"BEFORE: {p}\nAFTER:  {res}\n")
