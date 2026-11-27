#!/usr/bin/env python3
"""Render the reference image for designed states: OUT_DIR/<state>.png, 1170 x 2532 (390 x 844 points at 3x).

Usage: render-mocks.py STATES OUT_DIR [NAME...]    (no names: every state in STATES)

Each state names a demo page under apex-ios/ and the switches to click (design/states.json). The page is served
from this machine, because a frame loaded from file:// cannot be reached by the page around it, and headless
Chrome loads scripts/mock-frame.html, which frames the demo, clicks the switches and reports in its title.
An image replaces the old one only when the state was reached.
"""

import functools
import html
import http.server
import json
import os
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
from pathlib import Path
from urllib.parse import urlencode

# apex-ios/: the folder served, so a state's page path is also its URL path.
ROOT = Path(__file__).resolve().parent.parent
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
# Chrome takes the picture when this much page time has passed; mock-frame.html's waits fit inside it.
VIRTUAL_TIME_MS = 10000


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    """Not http.server's own server: that one looks up this machine's host name when it starts, which takes
    over 30 s on a CI runner."""

    daemon_threads = True


def render(state, port, out_dir):
    """Write OUT_DIR/<name>.png for one state, or exit naming the state and the reason."""
    name = state["name"]
    query = urlencode([("page", "/" + state["page"])] + [("click", text) for text in state.get("clicks", [])])
    with tempfile.TemporaryDirectory() as scratch:
        image = Path(scratch, "mock.png")
        command = [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--window-size=390,844",
            "--force-device-scale-factor=3",
            f"--virtual-time-budget={VIRTUAL_TIME_MS}",
            # A profile of its own: the run neither reads nor disturbs the Chrome that may be open.
            f"--user-data-dir={Path(scratch, 'profile')}",
            f"--screenshot={image}",
            "--dump-dom",
            f"http://127.0.0.1:{port}/scripts/mock-frame.html?{query}",
        ]
        try:
            dom = subprocess.run(command, capture_output=True, text=True).stdout
        except FileNotFoundError:
            sys.exit("error: Google Chrome not found (set CHROME=<path to the Chrome binary>)")
        title = re.search(r"<title>(.*?)</title>", dom)
        result = html.unescape(title.group(1)) if title else "no page"
        if result.startswith("missing:"):
            sys.exit(f"error: {name}: the demo has no switch named {result[len('missing:'):]}")
        if result == "no-render":
            sys.exit(f"error: {name}: {state['page']} never rendered a screen")
        if result != "done" or not image.is_file():
            sys.exit(f"error: {name}: Chrome did not finish ({result})")
        target = out_dir / f"{name}.png"
        shutil.move(image, target)
        print(f"wrote {target}")


def main(states_path, out_dir, names):
    states = {state["name"]: state for state in json.loads(Path(states_path).read_text())["states"]}
    for name in names:
        if name not in states:
            sys.exit(f"error: {name}: no such state in {states_path}")
    out_dir.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(QuietHandler, directory=ROOT)
    with Server(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            for name in names or states:
                render(states[name], server.server_address[1], out_dir)
        finally:
            server.shutdown()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: render-mocks.py STATES OUT_DIR [NAME...]")
    main(sys.argv[1], Path(sys.argv[2]), sys.argv[3:])
