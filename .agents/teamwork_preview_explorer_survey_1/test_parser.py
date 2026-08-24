import os
import re
import zlib

# We can run a full node or python extraction and parse all 7 files with parseMockExamText logic
# Let's implement the exact parseMockExamText in python to see what questions are extracted from each file!

def simulate_parseMockExamText(text):
    rawLines = [l.strip() for l in text.splitlines() if l.strip()]
    lines = [l for l in rawLines if not re.match(r'^[=\-\_\*]{3,}$', l)]
    
    answerKeyStartIndex = -1
    for i, l in enumerate(lines):
        if "ANSWER KEY" in l.upper():
            answerKeyStartIndex = i
            break
            
    if answerKeyStartIndex == -1:
        return []
        
    questionLines = lines[:answerKeyStartIndex]
    answerLines = lines[answerKeyStartIndex:]
    
    parsedQuestions = []
    currentModule = "Cell Biology"
    currentQuestion = None
    
    for line in questionLines:
        upperLine = line.upper()
        if any(h in upperLine for h in ["CELL BIOLOGY", "MODULE 1:", "PART I:", "PART 1:", "SECTION I", "SECTION 1"]):
            currentModule = "Cell Biology"
            continue
        elif any(h in upperLine for h in ["HISTOLOGY", "MODULE 2:", "PART II:", "PART 2:", "SECTION II", "SECTION 2"]):
            currentModule = "Histology"
            continue
        elif any(h in upperLine for h in ["EMBRYOLOGY", "MODULE 3:", "PART III:", "PART 3:", "SECTION III", "SECTION 3"]):
            currentModule = "Embryology"
            continue
        elif any(h in upperLine for h in ["INTERDISCIPLINARY", "MODULE 4:", "PART IV:", "PART 4:", "SECTION IV", "SECTION 4"]):
            currentModule = "Interdisciplinary"
            continue
            
        qMatch = re.match(r'^(?:#+\s*)?(?:[\*\-\+]\s*)?(\d+)[\.\)]\s*(?:\(?\s*(Multiple Choice|True or False|Open Question|Fill in\s+(?:\w+\s+)?the\s+gap|Matching|True or False Cluster)(?:[^)]*)?\)?\:?\s*)?(.*)', line, re.I)
        if qMatch and qMatch.group(1):
            id_val = int(qMatch.group(1))
            typeStr = (qMatch.group(2) or "").lower()
            promptText = qMatch.group(3) or ""
            isNewQ = qMatch.group(2) or re.match(r'^(match|evaluate|assess|which|what|fill|select|choose|identify)', promptText, re.I) or not currentQuestion or id_val == (currentQuestion["id"] + 1)
            
            if isNewQ:
                if currentQuestion:
                    parsedQuestions.append(currentQuestion)
                qtype = "multiple-choice"
                if "matching" in typeStr or re.match(r'^match\b', promptText, re.I): qtype = "matching"
                elif "true or false cluster" in typeStr or re.match(r'^(evaluate|assess)\s+the\s+following', promptText, re.I): qtype = "true-false-cluster"
                elif "true or false" in typeStr: qtype = "true-false"
                elif "fill in the gap" in typeStr or re.match(r'^fill\s+in', promptText, re.I): qtype = "fill-in-the-gap"
                elif "open question" in typeStr or re.match(r'^(explain|describe)\b', promptText, re.I): qtype = "open"
                
                currentQuestion = {
                    "id": id_val,
                    "type": qtype,
                    "module": currentModule,
                    "question": promptText,
                    "options": [],
                    "leftItems": [],
                    "rightItems": [],
                    "statements": [],
                    "correctAnswer": None
                }
                continue
        if currentQuestion:
            currentQuestion["question"] += " " + line
            
    if currentQuestion:
        parsedQuestions.append(currentQuestion)
    return parsedQuestions

# Let's test on simulation 4 and simulation 7
with open('/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH_simulation_4.md') as f:
    sim4_q = simulate_parseMockExamText(f.read())
print(f"Sim 4 questions parsed: {len(sim4_q)}")
for q in sim4_q:
    if q["id"] >= 65:
        print(f"  Q{q['id']} ({q['module']}): {q['question'][:80]}")

with open('/Users/alessandronicoletti11/Desktop/exam simulator/Mock exams/CBEH_simulation_7.md') as f:
    sim7_q = simulate_parseMockExamText(f.read())
print(f"\nSim 7 questions parsed: {len(sim7_q)}")
for q in sim7_q:
    if q["id"] >= 65:
        print(f"  Q{q['id']} ({q['module']}): {q['question'][:80]}")
