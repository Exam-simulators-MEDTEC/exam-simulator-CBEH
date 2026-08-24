import re

def check_sim7_dropped():
    with open('/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH_simulation_7.md') as f:
        text = f.read()
    rawLines = [l.strip() for l in text.splitlines() if l.strip()]
    lines = [l for l in rawLines if not re.match(r'^[=\-\_\*]{3,}$', l)]
    
    answerKeyStartIndex = -1
    for i, l in enumerate(lines):
        if "ANSWER KEY" in l.upper():
            answerKeyStartIndex = i
            break
    questionLines = lines[:answerKeyStartIndex]
    
    for idx, l in enumerate(questionLines):
        upperLine = l.upper()
        is_header = False
        if any(h in upperLine for h in ["CELL BIOLOGY", "MODULE 1:", "PART I:", "PART 1:", "SECTION I", "SECTION 1"]):
            is_header = True
        elif any(h in upperLine for h in ["HISTOLOGY", "MODULE 2:", "PART II:", "PART 2:", "SECTION II", "SECTION 2"]):
            is_header = True
        elif any(h in upperLine for h in ["EMBRYOLOGY", "MODULE 3:", "PART III:", "PART 3:", "SECTION III", "SECTION 3"]):
            is_header = True
        elif any(h in upperLine for h in ["INTERDISCIPLINARY", "MODULE 4:", "PART IV:", "PART 4:", "SECTION IV", "SECTION 4"]):
            is_header = True
            
        qMatch = re.match(r'^(?:#+\s*)?(?:[\*\-\+]\s*)?(\d+)[\.\)]\s*(?:\(?\s*(Multiple Choice|True or False|Open Question|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*)?(.*)', l, re.I)
        if qMatch and is_header:
            print(f"Line {idx} dropped because it matched header AND question regex: {l}")

check_sim7_dropped()
