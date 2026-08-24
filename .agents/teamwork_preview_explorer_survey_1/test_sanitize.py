# Test the exact JS logic in python to demonstrate current behavior vs desired behavior

def simulate_js_sanitize(q):
    # exact JS code from app.js lines 2120-2155
    if isinstance(q.get("question"), str):
        upperQ = q["question"].upper()
        
        # 1. fallback by ID
        if 67 <= q["id"] <= 70:
            q["module"] = "Interdisciplinary"
        elif 55 <= q["id"] <= 66 and (not q.get("module") or q["module"] == "Cell Biology"):
            q["module"] = "Embryology"
        elif 31 <= q["id"] <= 54 and (not q.get("module") or q["module"] == "Cell Biology"):
            q["module"] = "Histology"
        elif 1 <= q["id"] <= 30 and not q.get("module"):
            q["module"] = "Cell Biology"
            
        # 2. check text in upperQ
        if "INTERDISCIPLINARY" in upperQ or "MODULE 4:" in upperQ:
            q["module"] = "Interdisciplinary"
        elif "EMBRYOLOGY" in upperQ or "MODULE 3:" in upperQ:
            q["module"] = "Embryology"
        elif "HISTOLOGY" in upperQ or "MODULE 2:" in upperQ:
            q["module"] = "Histology"

# Let's test with Question 69 of sim 4:
q69 = {
    "id": 69,
    "question": "Osteoporosis represents a severe disruption in the balance of bone tissue. Integrating histology and cell biology: Describe the respective functions and histological origins of the two primary cell types governing bone remodeling. Mention at least one molecular signaling pathway or receptor (e.g., RANK/RANKL) that regulates this balance.",
    "module": "Interdisciplinary"
}

simulate_js_sanitize(q69)
print("Q69 module after sanitizeQuestion:", q69["module"])

# Let's test with Question 70 of sim 4:
q70 = {
    "id": 70,
    "question": "Cystic Fibrosis is caused by a genetic mutation in the CFTR channel, leading to defective chloride transport. At the tissue level, this primarily affects the ________ epithelium of the respiratory tract, impairing the mucociliary escalator.",
    "module": "Interdisciplinary"
}
simulate_js_sanitize(q70)
print("Q70 module after sanitizeQuestion:", q70["module"])
