#!/usr/bin/env python3
"""Local preview server for the HTTrack mirror in ./belgradearbor.rs.

The mirror can't be opened as plain files: the Next.js code asks for root paths
(/home/..., /_next/image?url=...) and the original asset names, while HTTrack
saved renamed copies (e.g. font.otf -> fontde78.otf). This server maps requests
back to the files on disk.

Usage:  python3 serve.py [port]      then open http://localhost:8080/en
"""
import os
import re
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "belgradearbor.rs")
SUFFIX = "de78"  # HTTrack's rename tag in this mirror
RENAMED = re.compile(rb"de78\.(js|css|woff2|otf)\b")
# Decorative masks the mirror never downloaded: a full rectangle keeps them invisible-but-harmless.
BLANK_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100"/></svg>'


def tilde_names():
    """Original chunk names containing "~" (HTTrack saved them with "_"), read from the JS and HTML."""
    names = set()
    for d, _, files in os.walk(ROOT):
        for f in files:
            if f.endswith((".js", ".html")):
                with open(os.path.join(d, f), "rb") as fh:
                    names.update(re.findall(rb"chunks/([A-Za-z0-9_.~-]*~[A-Za-z0-9_.~-]*\.(?:js|css))", fh.read()))
    return names


TILDE_NAMES = tilde_names()


def candidates(path):
    """Yield on-disk paths that may hold the asset requested at `path`."""
    yield path
    base, ext = os.path.splitext(path)
    if ext:
        yield base + SUFFIX + ext
        tilde = base.replace("~", "_")
        yield tilde + ext
        yield tilde + SUFFIX + ext
    else:
        yield path.rstrip("/") + ".html"
        yield os.path.join(path, "index.html")


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urllib.parse.urlsplit(path)
        req = urllib.parse.unquote(parsed.path)
        # Next.js image optimizer: serve the original image instead.
        if req == "/_next/image":
            q = urllib.parse.parse_qs(parsed.query)
            if "url" in q:
                req = q["url"][0]
        if req == "/":
            req = "/en"
        # HTTrack turned a few asset links into "<asset>de78.html" error pages.
        if req.endswith(SUFFIX + ".html") and os.path.splitext(req[: -len(SUFFIX) - 5])[1]:
            req = req[: -len(SUFFIX) - 5]
        for c in candidates(req):
            full = os.path.normpath(os.path.join(ROOT, c.lstrip("/")))
            if not full.startswith(ROOT):
                break
            if os.path.isfile(full):
                return full
        # HTTrack saved optimized images as /_next/<name><hash>.<ext> (e.g. front.webp -> frontc6a8.jpg).
        stem = os.path.splitext(os.path.basename(req))[0]
        if stem:
            for f in sorted(os.listdir(os.path.join(ROOT, "_next"))):
                if f.startswith(stem) and os.path.splitext(f)[1] in (".jpg", ".webp", ".png") and len(f) - len(stem) <= 9:
                    return os.path.join(ROOT, "_next", f)
        return os.path.join(ROOT, req.lstrip("/"))

    def send_head(self):
        req = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        full = self.translate_path(self.path)
        if full.endswith(".html") and os.path.isfile(full):
            # Turbopack registers chunks by their original file names, so point the
            # HTML back at those names; translate_path maps them to the renamed files.
            with open(full, "rb") as fh:
                body = RENAMED.sub(rb".\1", fh.read())
            # HTTrack also turned "~" into "_" and made paths relative; restore both.
            for name in TILDE_NAMES:
                body = body.replace(b"chunks/" + name.replace(b"~", b"_"), b"chunks/" + name)
            body = re.sub(rb'(\\?")(?:\.\./)*_next/', rb"\1/_next/", body)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        if req.endswith(".svg") and not os.path.isfile(self.translate_path(self.path)):
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml")
            self.send_header("Content-Length", str(len(BLANK_SVG)))
            self.end_headers()
            self.wfile.write(BLANK_SVG)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if args and str(args[1]).startswith("4"):
            sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Preview: http://localhost:{port}/en")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
