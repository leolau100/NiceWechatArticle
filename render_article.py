#!/usr/bin/env python3
"""06 仓库标准渲染脚本 → 生成 wf.html（供 publish.py 发布）。

用法：
    python3 render_article.py --md /abs/path/to/article.md --theme deepsea
    python3 render_article.py --md _tmp_xxx.md                # md 已在 06 根目录

约定（footer v2，2026-09-08 起）：
  * footer 默认 = footer.html，只含「关于作者 + 加作者好友二维码」。
  * 不再合并 footer-custom.html（已弃用，原「往期推荐 + 支持一下」）
    —— 上一篇/下一篇 改由微信【合集+文末连续阅读】提供，关注卡片为微信原生。
  * 主题 id 从 src/components/ThemeSelector.vue 的 id↔中文名 映射查
    （如 deepsea=静海蓝调、ocean=海洋）。
"""
import os
import re
import sys
import time
import pathlib
import argparse
import subprocess

NA = "/Users/liulei/Product/06_NiceWeChatFile"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", required=True,
                    help="文章 md 绝对路径（自动复制到 06 根），或已在 06 根的相对文件名")
    ap.add_argument("--theme", default="ocean")
    ap.add_argument("--footer", default="footer.html",
                    help="v2 默认 footer.html；传空字符串表示不加 footer")
    ap.add_argument("--port", type=int, default=8901)
    a = ap.parse_args()

    os.chdir(NA)

    md = a.md
    if os.path.isabs(md):
        stem = re.sub(r"[^\w\u4e00-\u9fff-]", "_", pathlib.Path(md).stem)
        md = f"_tmp_{stem}.md"
        open(f"{NA}/{md}", "w", encoding="utf-8").write(open(a.md, encoding="utf-8").read())
    print(f"[render] md={md} theme={a.theme} footer={a.footer or '(none)'}")

    env = {**os.environ, "PORT": str(a.port)}
    proc = subprocess.Popen(["python3", "render_server.py"], cwd=NA, env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    try:
        from playwright.sync_api import sync_playwright
        url = (f"http://127.0.0.1:{a.port}/render-harness.html"
               f"?theme={a.theme}&md={md}")
        if a.footer:
            url += f"&footer={a.footer}"
        url += "&save=/__save"
        with sync_playwright() as p:
            b = p.chromium.launch(channel="chrome", headless=True)
            pg = b.new_page(viewport={"width": 720, "height": 1280})
            pg.goto(url, wait_until="domcontentloaded")
            saved = False
            for _ in range(90):
                try:
                    if pg.evaluate("() => window.__saved === true"):
                        saved = True
                        break
                except Exception:
                    pass
                time.sleep(1)
            pg.wait_for_timeout(1200)
            b.close()
    finally:
        proc.terminate()
        proc.wait(timeout=5)

    if not saved:
        print("[FAIL] 渲染未保存（检查 md 路径是否是 06 根相对路径）")
        return 1

    h = open(f"{NA}/wf.html", encoding="utf-8").read()
    n_img = len(re.findall(r"<img", h))
    n_webp = len(re.findall(r"data:image/webp", h))
    print(f"[ok] wf.html 生成完毕：{n_img} 张图（webp {n_webp} 张，发布时自动转 PNG）")
    for k in ("关于作者", "加作者好友", "往期推荐", "支持一下"):
        print(f"     {k}: {'有' if k in h else '—'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
