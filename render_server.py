#!/usr/bin/env python3
"""静态文件服务 + 接收渲染结果 POST /__save 写入 wf.html。"""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8899"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _write_json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_POST(self):
        if self.path.rstrip("/") != "/__save":
            self._write_json({"ok": False, "error": "not found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b""
            payload = json.loads(raw.decode("utf-8"))
            fragment = payload.get("fragment", "")
            title = payload.get("title", "")
            theme = payload.get("theme", "")
            with open(os.path.join(ROOT, "wf.html"), "w", encoding="utf-8") as f:
                f.write(fragment)
            with open(os.path.join(ROOT, "wf.meta.json"), "w", encoding="utf-8") as f:
                json.dump({"title": title, "theme": theme, "len": len(fragment)},
                          f, ensure_ascii=False, indent=2)
            sys.stderr.write("[__save] wrote wf.html (%d bytes), title=%s\n" % (len(fragment), title))
            self._write_json({"ok": True, "bytes": len(fragment)})
        except Exception as e:
            self._write_json({"ok": False, "error": str(e)}, 500)


if __name__ == "__main__":
    os.chdir(ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    sys.stderr.write("serving %s on http://127.0.0.1:%d\n" % (ROOT, PORT))
    srv.serve_forever()
