#!/usr/bin/env python3
"""Replace DEST with the contents of a design export zip, leaving out shots/.

Usage: design-import.py ZIP DEST
"""

import shutil
import sys
import zipfile
from pathlib import Path, PurePosixPath

# The exploration screenshots: about 140 MB, never in git.
SKIPPED = "shots"
UTF8_FLAG = 0x800


def entry_name(info):
    """The entry's name. zipfile reads a name stored without the UTF-8 flag as CP437; the macOS `zip` command
    stores UTF-8 there, so read the same bytes as UTF-8 when they are valid UTF-8."""
    if info.flag_bits & UTF8_FLAG:
        return info.filename
    try:
        return info.filename.encode("cp437").decode("utf-8")
    except UnicodeError:
        return info.filename


def import_export(zip_path, dest):
    with zipfile.ZipFile(zip_path) as archive:
        files = [(entry_name(info), info) for info in archive.infolist() if not info.is_dir()]
        # Every name is checked before anything is written.
        for name, _ in files:
            path = PurePosixPath(name)
            if path.is_absolute() or ".." in path.parts:
                sys.exit(f"error: {name} points outside the folder; nothing was imported")
        wanted = [(name, info) for name, info in files if PurePosixPath(name).parts[0] != SKIPPED]
        if not wanted:
            sys.exit(f"error: {zip_path} has nothing to import; nothing was changed")

        # Extract beside DEST, then swap: DEST is replaced whole, or not touched at all.
        staging = dest.with_name(dest.name + ".importing")
        shutil.rmtree(staging, ignore_errors=True)  # left by an interrupted run
        try:
            for name, info in wanted:
                target = staging / name
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(info) as source, open(target, "wb") as out:
                    shutil.copyfileobj(source, out)
            if dest.exists():
                shutil.rmtree(dest)
            staging.rename(dest)
        finally:
            shutil.rmtree(staging, ignore_errors=True)
    print(f"imported {len(wanted)} files, {len(files) - len(wanted)} skipped ({SKIPPED}/)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: design-import.py ZIP DEST")
    try:
        import_export(sys.argv[1], Path(sys.argv[2]))
    except (OSError, zipfile.BadZipFile) as error:
        sys.exit(f"error: {error}")
