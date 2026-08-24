import re

def clean_prompt_advanced(prompt):
    if not isinstance(prompt, str):
        return prompt
    text = prompt
    # Strip divider marks
    text = re.sub(r'[=\-\_\*]{3,}', ' ', text)
    # Strip unstripped module/part headers
    text = re.sub(r'^(?:MODULE|PART|SECTION)\s*(?:\d+|[IVX]+)[\:\s\-–—]*(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)?(?:\s*\(\d+\s*Questions\))?[\:\s\-–—]*', '', text, flags=re.I)
    text = re.sub(r'^(?:CELL BIOLOGY|HISTOLOGY|EMBRYOLOGY|INTERDISCIPLINARY)[\:\s\-–—]+', '', text, flags=re.I)
    text = re.sub(r'^\[(?:Embryology|Histology|Cell Biology|Stem Cells|Apoptosis)[^\]]*\]\s*', '', text, flags=re.I)
    
    # Strip redundant leading question numbers and type tags if present
    text = re.sub(r'^(?:#+\s*)?(?:[\*\-\+]?\s*)?\d+[\.\)]\s*', '', text)
    text = re.sub(r'^\(?\s*(?:Multiple Choice|True or False|Open Question|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*', '', text, flags=re.I)
    
    # Strip leading punctuation/symbols
    text = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', text).strip()
    
    # Repeatedly strip orphaned leading conjunctions / lowercase fragments / leftover punctuation
    while True:
        prev = text
        # 1. Leading conjunctions: and, or, but, &
        text = re.sub(r'^(?:and|or|but|also|as well as|&)\s+', '', text, flags=re.I).strip()
        # 2. Leading lowercase prepositions/fragments
        text = re.sub(r'^(?:with|in|to|for|of|by|at|on|from|that|which|whereas|while)\s+', '', text).strip()
        # 3. Strip any punctuation exposed
        text = re.sub(r'^[\:\.\,\-\–—\_\*\•\#\>\~\]\)\/\s]+', '', text).strip()
        if text == prev:
            break
            
    if len(text) > 0:
        text = text[0].upper() + text[1:]
    text = re.sub(r'\s+', ' ', text).strip()
    return text

print("Test with 70. and cellular energy...:")
print(clean_prompt_advanced("70. and cellular energy..."))
print("Test with 70. (Open Question - Max 100 words) and cellular energy...:")
print(clean_prompt_advanced("70. (Open Question - Max 100 words) and cellular energy..."))
