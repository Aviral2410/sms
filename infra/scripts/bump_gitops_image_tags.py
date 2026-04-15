#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: bump_gitops_image_tags.py <values-file> <git-sha>", file=sys.stderr)
        return 2

    values_path = Path(sys.argv[1])
    git_sha = sys.argv[2].strip()

    if not re.fullmatch(r"[0-9a-fA-F]{7,40}", git_sha):
        print(f"invalid git sha: {git_sha!r}", file=sys.stderr)
        return 2

    text = values_path.read_text(encoding="utf-8")

    # Also support updating previous commits by rewriting tag lines inside this values file.
    # We only touch tags that look like commit SHAs to avoid clobbering non-sha tags.
    text = re.sub(r"(^\s*tag:\s*)([0-9a-fA-F]{7,40})\s*$", rf"\g<1>{git_sha}", text, flags=re.MULTILINE)

    # Replace "latest" tags to the current commit SHA (GitOps rollouts).
    text = re.sub(r"(^\s*tag:\s*)latest\s*$", rf"\g<1>{git_sha}", text, flags=re.MULTILINE)

    values_path.write_text(text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

