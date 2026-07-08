#!/usr/bin/env python3
import os
import sys
import json
import random
import pandas as pd

# Seed for deterministic random spread when group fallbacks are used
random.seed(42)

def classify_task(task_text):
    text = task_text.lower()
    
    # Force coding, programming, debugging, and software development tasks to High Risk
    # but exclude human-centric communication, consulting, and collaboration
    coding_keywords = [
        "write code", "writing code", "computer program", "programming", 
        "debugging", "develop software", "software development", "coding",
        "software application", "software system"
    ]
    human_centric_keywords = [
        "consult", "negotiate", "collaborate", "confer", "counsel", "advise",
        "liaison", "teach", "mentor", "represent", "lobby", "mediator"
    ]
    if any(k in text for k in coding_keywords) and not any(h in text for h in human_centric_keywords):
        return "high", "Software coding, programming, or application development task highly susceptible to automated generation."
    
    # Low Risk (High Resilience) indicators: Strategic, leadership, interpersonal, high empathy, unstructured, highly creative
    low_indicators = [
        "direct", "plan", "negotiate", "lead", "manage", "collaborate", "innovate", 
        "design", "coach", "teach", "consult", "advise", "strategize", "formulate", 
        "confer", "lobby", "develop", "counsel", "treat", "diagnose", "recommend", 
        "resolve", "guide", "coordinate", "mentor", "supervise", "arbitrate", "mediator",
        "liaison", "preside", "chair", "represent", "establish", "motivate", "influence",
        "advocate", "sponsor", "authorize", "oversee", "conceptualize", "creative",
        "therapy", "empathy", "patient", "counseling", "psychological", "clinical",
        "surgery", "surgical", "dentistry", "emergency response", "police", "investigate",
        "artistic", "perform", "paint", "compose", "choreograph", "craft"
    ]
    
    # High Risk indicators: Repetitive, structured data entry, simple math, document processing, repetitive manual assembly, sorting
    high_indicators = [
        "record", "enter data", "typing", "transcribe", "file document", "sorting", 
        "copying", "logging", "post transactions", "tabulate", "rekey", "scan document",
        "reconcile accounts", "invoice processing", "data entry", "inputting",
        "calculate interest", "compute tax", "billing", "receipts", "bookkeeping",
        "repetitive", "assembly line", "packaging", "stacking", "loading cargo", "unloading",
        "sweeping", "mopping", "sorting mail", "envelope stuffing", "feeding machines",
        "operating cash register", "cashiering", "filing records", "clearing tables"
    ]
    
    # Count occurrences
    low_score = sum(1 for ind in low_indicators if f" {ind}" in f" {text}" or f"{ind} " in f"{text} ")
    high_score = sum(1 for ind in high_indicators if f" {ind}" in f" {text}" or f"{ind} " in f"{text} ")
    
    # Boosts for clear patterns
    if any(phrase in text for phrase in ["strategic plan", "policy development", "board of directors", "overall direction", "long-term goals"]):
        low_score += 2
    if any(phrase in text for phrase in ["data entry", "inputting data", "keying data", "repetitive tasks", "routine billing"]):
        high_score += 2
        
    if low_score > high_score:
        return "low", "Complex problem-solving, strategic leadership, or high-empathy task requiring human judgment."
    elif high_score > low_score:
        return "high", "Routine cognitive or manual task with high vulnerability to automation."
    else:
        # Default to medium if ambiguous or equal
        if any(w in text for w in ["analyze", "evaluate", "inspect", "assess", "monitor", "review", "audit", "diagnose"]):
            return "medium", "Semi-structured cognitive task involving analysis, inspection, or monitoring."
        return "medium", "Semi-structured task combining routine and non-routine responsibilities."

def parse_numeric(val):
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip()
    if val_str == '*' or not val_str:
        return None
    try:
        val_str = val_str.replace(',', '')
        return float(val_str)
    except ValueError:
        return None

def get_major_group_default(soc_code):
    # Fallback heuristics if SOC code matches nothing in BLS database
    major_group = soc_code.split("-")[0]
    mapping = {
        "11": (125000, "High"),
        "13": (85000, "Medium"),
        "15": (115000, "Very High"),
        "17": (98000, "Medium-High"),
        "19": (88000, "Medium"),
        "21": (55000, "Medium"),
        "23": (130000, "High"),
        "25": (65000, "Medium"),
        "27": (60000, "Medium"),
        "29": (90000, "High"),
        "31": (38000, "High"),
        "33": (58000, "Medium"),
        "35": (32000, "Low"),
        "37": (35000, "Low"),
        "39": (36000, "Medium"),
        "41": (52000, "Medium"),
        "43": (44000, "Low"),
        "45": (33000, "Low"),
        "47": (54000, "Medium"),
        "49": (56000, "Medium"),
        "51": (42000, "Low"),
        "53": (40000, "Medium")
    }
    base_sal, demand = mapping.get(major_group, (50000, "Medium"))
    salary = int(base_sal * random.uniform(0.95, 1.05))
    return salary, demand

def main():
    workspace_dir = "/Users/jorgefernandezilufi/Documents/_giniloh_front_end"
    occupations_path = os.path.join(workspace_dir, "occupations.txt")
    tasks_path = os.path.join(workspace_dir, "tasks.txt")
    oews_path = os.path.join(workspace_dir, "national.xlsx")
    output_dir = os.path.join(workspace_dir, "public", "data", "careers")
    
    print("Ingesting O*NET data...")
    if not os.path.exists(occupations_path) or not os.path.exists(tasks_path):
        print("Error: occupations.txt or tasks.txt missing in workspace root!")
        sys.exit(1)
        
    os.makedirs(output_dir, exist_ok=True)
    
    # Load BLS OEWS dataset if available
    bls_data = {}
    if os.path.exists(oews_path):
        print("Parsing BLS OEWS national.xlsx file...")
        try:
            df = pd.read_excel(oews_path)
            for _, row in df.iterrows():
                occ_code = str(row.get("OCC_CODE", "")).strip()
                if not occ_code:
                    continue
                
                # Retrieve wage (prefer median annual, fallback to mean annual)
                salary = parse_numeric(row.get("A_MEDIAN"))
                if salary is None:
                    salary = parse_numeric(row.get("A_MEAN"))
                    
                # Retrieve employment level
                tot_emp = parse_numeric(row.get("TOT_EMP"))
                
                if salary is not None or tot_emp is not None:
                    bls_data[occ_code] = {
                        "salary": salary,
                        "tot_emp": tot_emp
                    }
            print(f"Loaded statistics for {len(bls_data)} BLS occupations.")
        except Exception as e:
            print(f"Warning: Failed to parse national.xlsx: {e}")
    else:
        print("Warning: national.xlsx not found, falling back to heuristics.")

    # Read O*NET Occupations
    occupations = {}
    with open(occupations_path, "r", encoding="utf-8", errors="replace") as f:
        header = f.readline().strip().split("\t")
        for line in f:
            parts = line.strip("\r\n").split("\t")
            if len(parts) >= 2:
                soc_code = parts[0].strip()
                title = parts[1].strip()
                desc = parts[2].strip() if len(parts) > 2 else ""
                occupations[soc_code] = {
                    "code": soc_code,
                    "title": title,
                    "description": desc,
                    "tasks": []
                }
                
    print(f"Loaded {len(occupations)} occupations.")
    
    # Read O*NET Tasks
    tasks_loaded = 0
    with open(tasks_path, "r", encoding="utf-8", errors="replace") as f:
        header = f.readline().strip().split("\t")
        for line in f:
            parts = line.strip("\r\n").split("\t")
            if len(parts) >= 3:
                soc_code = parts[0].strip()
                task_id = parts[1].strip()
                task_text = parts[2].strip()
                task_type = parts[3].strip() if len(parts) > 3 else "Core"
                
                if soc_code in occupations:
                    risk, rationale = classify_task(task_text)
                    occupations[soc_code]["tasks"].append({
                        "id": task_id,
                        "text": task_text,
                        "type": task_type,
                        "risk": risk,
                        "rationale": rationale
                    })
                    tasks_loaded += 1
                    
    print(f"Loaded and classified {tasks_loaded} tasks.")
    
    # Process, aggregate, and output data
    index_data = []
    direct_matches = 0
    fallback_matches = 0
    heuristic_fallbacks = 0
    
    for soc_code, occ in occupations.items():
        tasks = occ["tasks"]
        if not tasks:
            tasks = [{
                "id": "fallback",
                "text": f"Perform general duties related to {occ['title']}.",
                "type": "Core",
                "risk": "medium",
                "rationale": "General job responsibility."
            }]
            occ["tasks"] = tasks
            
        high_count = sum(1 for t in tasks if t["risk"] == "high")
        medium_count = sum(1 for t in tasks if t["risk"] == "medium")
        low_count = sum(1 for t in tasks if t["risk"] == "low")
        total = len(tasks)
        
        # Calculate dynamic risk score (0-100)
        risk_score = round((high_count * 100 + medium_count * 50) / total)
        
        # Determine Salary and Demand using hierarchical fallbacks
        soc_prefix = soc_code.split(".")[0] # e.g. "11-1011"
        
        salary = None
        tot_emp = None
        match_type = "heuristic"
        
        # Step 1: Direct detailed SOC code match
        if soc_prefix in bls_data:
            salary = bls_data[soc_prefix]["salary"]
            tot_emp = bls_data[soc_prefix]["tot_emp"]
            match_type = "direct"
            direct_matches += 1
            
        # Step 2: Broad occupation group match (e.g. 11-1010, 11-1000, 11-0000)
        if salary is None:
            # Try minor group mapping
            group_codes = [
                soc_prefix[:-1] + "0",              # e.g. 11-1010
                soc_prefix[:4] + "00",               # e.g. 11-1000
                soc_prefix[:3] + "0000"              # e.g. 11-0000
            ]
            for gc in group_codes:
                if gc in bls_data:
                    salary = bls_data[gc]["salary"]
                    tot_emp = bls_data[gc]["tot_emp"]
                    match_type = "fallback"
                    fallback_matches += 1
                    break
                    
        # Step 3: Heuristic defaults
        if salary is None:
            salary, _ = get_major_group_default(soc_prefix)
            match_type = "heuristic"
            heuristic_fallbacks += 1
            
        if tot_emp is None:
            tot_emp = 50000  # Default fallback employment (representing 50k workers)
            
        # Classify Demand based on TOT_EMP statistics (using detailed BLS thresholds)
        # TOT_EMP >= 300k -> Very High, >= 100k -> High, >= 25k -> Medium, else Low
        if tot_emp >= 300000:
            demand = "Very High"
        elif tot_emp >= 100000:
            demand = "High"
        elif tot_emp >= 25000:
            demand = "Medium"
        else:
            demand = "Low"
            
        # Add a minor deterministic spread if it's a fallback or heuristic to prevent complete point stacking in scatter plot
        if match_type != "direct":
            salary = int(salary * random.uniform(0.95, 1.05))
            
        occ["risk_score"] = risk_score
        occ["salary"] = int(salary)
        occ["demand"] = demand
        
        # Write individual file
        with open(os.path.join(output_dir, f"{soc_code}.json"), "w", encoding="utf-8") as out_f:
            json.dump(occ, out_f, indent=2)
            
        # Add to index list
        index_data.append({
            "code": soc_code,
            "title": occ["title"],
            "description": occ["description"],
            "risk_score": risk_score,
            "tasks_count": total,
            "salary": int(salary),
            "demand": demand,
            "category_distribution": {
                "high": high_count,
                "medium": medium_count,
                "low": low_count
            }
        })
        
    # Write index file
    with open(os.path.join(output_dir, "index.json"), "w", encoding="utf-8") as out_f:
        json.dump(index_data, out_f, indent=2)
        
    print(f"Pipeline completed. Wrote {len(index_data)} occupations to database.")
    print(f"Mapping breakdown: {direct_matches} direct SOC matches, {fallback_matches} broad/minor group fallbacks, {heuristic_fallbacks} heuristic fallbacks.")

if __name__ == "__main__":
    main()
