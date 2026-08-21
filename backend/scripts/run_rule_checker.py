import argparse
import json
import sys

from app.services.rule_checker.checks import run_all_checks


def main():
    parser = argparse.ArgumentParser(description="Run deterministic rule checker on network outputs.")
    parser.add_argument("--file", type=str, help="Path to text file containing show command outputs.")
    args = parser.parse_args()
    
    if args.file:
        with open(args.file, 'r') as f:
            content = f.read()
    else:
        print("Reading from stdin...")
        content = sys.stdin.read()
        
    results = run_all_checks(content)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
