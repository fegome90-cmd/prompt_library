#!/usr/bin/env python3
import os
import re
import sys

# Configuration
GRID_4PX_MULTIPLES = {i * 4 for i in range(0, 101)}  # 0 to 400px
CSS_PROPERTY_REGEX = re.compile(
    r"(padding|margin|gap|top|left|right|bottom)(?:-[\w]+)?:\s*(\d+)px"
)


def check_file(file_path):
    errors = []
    try:
        with open(file_path, "r") as f:
            lines = f.readlines()

        for i, line in enumerate(lines):
            line_num = i + 1

            # 1. 4px Grid Violation (Tailwind arbitrary)
            arbitrary_matches = re.findall(r"\[(\d+)px\]", line)
            for val in arbitrary_matches:
                if int(val) not in GRID_4PX_MULTIPLES:
                    errors.append(
                        f"L{line_num}: Grid Violation - Arbitrary value [{val}px] is not a multiple of 4."
                    )

            # 2. 4px Grid Violation (CSS)
            css_matches = CSS_PROPERTY_REGEX.finditer(line)
            for match in css_matches:
                prop, val = match.groups()
                if int(val) not in GRID_4PX_MULTIPLES:
                    errors.append(
                        f"L{line_num}: Grid Violation - {prop} value {val}px is not a multiple of 4."
                    )

            # 3. Symmetry Violation (px/py mismatch)
            px_m = re.search(r"px-(\d+)", line)
            py_m = re.search(r"py-(\d+)", line)
            if px_m and py_m:
                if px_m.group(1) != py_m.group(1):
                    errors.append(
                        f"L{line_num}: Symmetry Violation - Asymmetric padding (px-{px_m.group(1)} vs py-{py_m.group(1)})."
                    )

            # 4. Global Performance checks (line based)
            if "await" in line and (".map(" in line or "foreach" in line.lower()):
                errors.append(
                    f"L{line_num}: Perf Warning - Possible 'await' in a synchronous-looking loop."
                )

    except Exception as e:
        errors.append(f"System: Could not read file: {e}")

    return errors


def main():
    if len(sys.argv) > 1:
        # Audit specific files or directories provided as arguments
        found_targets = sys.argv[1:]
    else:
        # Default scan
        root_dirs = ["src", "app", "components"]
        found_targets = [d for d in root_dirs if os.path.exists(d)]
        if not found_targets:
            found_targets = ["."]

    all_errors = {}

    for target in found_targets:
        if os.path.isfile(target):
            file_errors = check_file(target)
            if file_errors:
                all_errors[target] = file_errors
        else:
            for root, dirs, files in os.walk(target):
                if "node_modules" in dirs:
                    dirs.remove("node_modules")
                if ".next" in dirs:
                    dirs.remove(".next")
                for file in files:
                    if file.endswith((".tsx", ".ts", ".css")) and not file.endswith(
                        ".d.ts"
                    ):
                        file_path = os.path.join(root, file)
                        file_errors = check_file(file_path)
                        if file_errors:
                            all_errors[file_path] = file_errors

    if all_errors:
        print("\n=== PREMIUM QUALITY AUDIT REPORT ===\n")
        count = 0
        for path, errors in sorted(all_errors.items()):
            if count > 50:
                print("... (and more files)")
                break
            print(f"FILE: {path}")
            for err in errors:
                print(f"  - {err}")
            print("")
            count += 1
        print(f"Total files with quality issues: {len(all_errors)}")
    else:
        print("\n✅ All quality gates passed! (Design + Performance)")


if __name__ == "__main__":
    main()
