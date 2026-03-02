#!/usr/bin/env python3
"""
Merge Legacy Risk Data with QUBE AI Risk Data

This script:
1. Reads legacy IBM and MIT JSON files
2. Converts them to YAML format
3. Deduplicates against existing Atlas Nexus data
4. Creates merged YAML files
"""

import json
import yaml
import os
from pathlib import Path
from difflib import SequenceMatcher

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DOCS_DIR = PROJECT_ROOT / "docs"
DATA_DIR = PROJECT_ROOT / "src/lib/ai-atlas-nexus/data"

def load_json(filepath):
    """Load a JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def load_yaml(filepath):
    """Load a YAML file"""
    with open(filepath, 'r') as f:
        return yaml.safe_load(f)

def save_yaml(data, filepath):
    """Save data to YAML file"""
    with open(filepath, 'w') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def similarity(a, b):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def is_duplicate(name, existing_names, threshold=0.85):
    """Check if a name is a duplicate of any existing name"""
    for existing in existing_names:
        if similarity(name, existing) >= threshold:
            return True, existing
    return False, None

def convert_legacy_risk(risk, source, index):
    """Convert legacy risk format to QUBE format"""
    risk_id = f"qube-{source}-{index:04d}"

    return {
        'id': risk_id,
        'name': risk.get('Summary', ''),
        'description': risk.get('Description', ''),
        'isDefinedByTaxonomy': f'qube-legacy-{source}',
        'tag': source,
        # Keep original metadata
        'riskCategory': risk.get('Risk Category', ''),
        'severity': map_severity(risk.get('Risk Severity', 'Moderate')),
        'likelihood': risk.get('Likelihood', 'Possible'),
    }

def map_severity(legacy_severity):
    """Map legacy severity to standard format"""
    mapping = {
        'Catastrophic': 'Critical',
        'Major': 'High',
        'Moderate': 'Medium',
        'Minor': 'Low',
        'Negligible': 'Low',
    }
    return mapping.get(legacy_severity, 'Medium')

def get_existing_risk_names():
    """Get all existing risk names from YAML files"""
    existing_names = set()

    yaml_files = [
        'risk_atlas_data.yaml',
        'air_2024_data.yaml',
        'credo.yaml',
        'mit_ai_risk_repository_data.yaml',
        'nist_ai_rmf_data.yaml',
        'owasp_llm_2.0_data.yaml',
        'ailuminate.yaml',
    ]

    for filename in yaml_files:
        filepath = DATA_DIR / filename
        if filepath.exists():
            try:
                data = load_yaml(filepath)
                if data and 'risks' in data:
                    for risk in data['risks']:
                        if risk and 'name' in risk:
                            existing_names.add(risk['name'])
            except Exception as e:
                print(f"Warning: Could not load {filename}: {e}")

    return existing_names

def main():
    print("=" * 60)
    print("QUBE AI Risk Data Merger")
    print("=" * 60)

    # Load existing risk names for deduplication
    print("\n[1/5] Loading existing QUBE risk names...")
    existing_names = get_existing_risk_names()
    print(f"  Found {len(existing_names)} existing risk names")

    # Load legacy IBM data
    print("\n[2/5] Loading legacy IBM Risk Atlas...")
    ibm_filepath = DOCS_DIR / "IBMAIRISKDB.json"
    ibm_risks = load_json(ibm_filepath)
    print(f"  Found {len(ibm_risks)} IBM risks")

    # Load legacy MIT data
    print("\n[3/5] Loading legacy MIT AI Risk Repository...")
    mit_filepath = DOCS_DIR / "MITAIRISKDB.json"
    mit_risks = load_json(mit_filepath)
    print(f"  Found {len(mit_risks)} MIT risks")

    # Convert and deduplicate IBM risks
    print("\n[4/5] Converting and deduplicating IBM risks...")
    ibm_converted = []
    ibm_duplicates = 0

    for i, risk in enumerate(ibm_risks, 1):
        name = risk.get('Summary', '')
        is_dup, match = is_duplicate(name, existing_names)

        if is_dup:
            ibm_duplicates += 1
            # print(f"  Duplicate: '{name}' ~ '{match}'")
        else:
            converted = convert_legacy_risk(risk, 'ibm', i)
            ibm_converted.append(converted)
            existing_names.add(name)  # Add to prevent MIT duplicates

    print(f"  IBM: {len(ibm_converted)} unique, {ibm_duplicates} duplicates removed")

    # Convert and deduplicate MIT risks
    print("\n[5/5] Converting and deduplicating MIT risks...")
    mit_converted = []
    mit_duplicates = 0

    for i, risk in enumerate(mit_risks, 1):
        name = risk.get('Summary', '')
        is_dup, match = is_duplicate(name, existing_names)

        if is_dup:
            mit_duplicates += 1
            # print(f"  Duplicate: '{name}' ~ '{match}'")
        else:
            converted = convert_legacy_risk(risk, 'mit', i)
            mit_converted.append(converted)
            existing_names.add(name)

    print(f"  MIT: {len(mit_converted)} unique, {mit_duplicates} duplicates removed")

    # Create YAML for legacy IBM risks
    ibm_yaml = {
        'taxonomies': [{
            'id': 'qube-legacy-ibm',
            'name': 'QUBE Legacy IBM Risk Atlas',
            'description': 'Legacy IBM AI Risk Atlas imported into QUBE AI Risk Data',
        }],
        'risks': ibm_converted,
    }

    ibm_output_path = DATA_DIR / "qube_legacy_ibm_risks.yaml"
    save_yaml(ibm_yaml, ibm_output_path)
    print(f"\n  Saved: {ibm_output_path}")

    # Create YAML for legacy MIT risks
    mit_yaml = {
        'taxonomies': [{
            'id': 'qube-legacy-mit',
            'name': 'QUBE Legacy MIT AI Risk Repository',
            'description': 'Legacy MIT AI Risk Repository imported into QUBE AI Risk Data',
        }],
        'risks': mit_converted,
    }

    mit_output_path = DATA_DIR / "qube_legacy_mit_risks.yaml"
    save_yaml(mit_yaml, mit_output_path)
    print(f"  Saved: {mit_output_path}")

    # Summary
    total_legacy = len(ibm_converted) + len(mit_converted)
    total_duplicates = ibm_duplicates + mit_duplicates

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Original IBM risks:     {len(ibm_risks)}")
    print(f"  Original MIT risks:     {len(mit_risks)}")
    print(f"  Total original:         {len(ibm_risks) + len(mit_risks)}")
    print(f"  Duplicates removed:     {total_duplicates}")
    print(f"  Unique legacy risks:    {total_legacy}")
    print(f"  Existing QUBE risks:    {len(existing_names) - total_legacy}")
    print(f"  TOTAL MERGED RISKS:     {len(existing_names)}")
    print("=" * 60)

    return {
        'ibm_unique': len(ibm_converted),
        'mit_unique': len(mit_converted),
        'total_legacy': total_legacy,
        'duplicates': total_duplicates,
        'total_merged': len(existing_names),
    }

if __name__ == "__main__":
    main()
