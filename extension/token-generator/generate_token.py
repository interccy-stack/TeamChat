#!/usr/bin/env python3
"""
AI PRO Token 生成器
====================
功能：
  1. 自动从 TeamChat 后端获取 Token（需后端运行在 localhost:8088）
  2. 后端不可用时，生成本地 Token 供扩展使用
  3. 支持命令行参数

用法：
  python generate_token.py              # 自动模式
  python generate_token.py --local      # 生成本地 Token
  python generate_token.py --fetch      # 强制从后端获取
  python generate_token.py --copy       # 生成后自动复制到剪贴板
  python generate_token.py --serve      # 启动本地 Token 服务（端口 8099）

输出格式：
  Token 会打印到控制台，且自动保存到 token_output.txt
"""

import json
import os
import sys
import uuid
import hashlib
import time
import base64
import argparse
import http.server
import socketserver
import urllib.request
import urllib.error
import threading

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "token_output.txt")
BACKEND_URL = "http://localhost:8088/api/plugins/team_chat/bookmarklet/token"


def generate_local_token(user_id="extension_user"):
    """生成本地 Token（UUID + 时间戳 + 哈希）"""
    uid = str(uuid.uuid4())
    timestamp = str(int(time.time()))
    raw = f"{user_id}:{uid}:{timestamp}:ai-pro-local"
    hash_part = hashlib.sha256(raw.encode()).hexdigest()[:16]
    token = f"local_{uid[:8]}_{timestamp[-6:]}_{hash_part}"
    return token


def fetch_remote_token(user_id="extension_user"):
    """从 TeamChat 后端获取 Token"""
    try:
        data = json.dumps({"user_id": user_id}).encode("utf-8")
        req = urllib.request.Request(
            BACKEND_URL,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            token = result.get("token") or result.get("data") or result.get("access_token") or ""
            if token:
                return token, "backend"
    except urllib.error.URLError:
        pass
    except Exception:
        pass
    return None, None


def copy_to_clipboard(text):
    """复制到剪贴板（跨平台）"""
    try:
        import subprocess
        if sys.platform == "win32":
            subprocess.run("clip", input=text.encode("utf-16-le"), check=False, shell=True)
            return True
        elif sys.platform == "darwin":
            subprocess.run("pbcopy", input=text.encode(), check=False)
            return True
        else:
            subprocess.run("xclip -selection clipboard", input=text.encode(), check=False, shell=True)
            return True
    except Exception:
        return False


def save_token(token, source):
    """保存 Token 到文件"""
    content = {
        "token": token,
        "source": source,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "generator": "AI PRO Token Generator v1.0"
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(token)
    json_file = OUTPUT_FILE.replace(".txt", ".json")
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(content, f, indent=2, ensure_ascii=False)
    print(f"  Token saved to: {OUTPUT_FILE}")
    print(f"  Details saved to: {json_file}")


def print_banner():
    print("""
+==========================================+
|     AI PRO Token Generator v1.0         |
|     TeamChat Browser Extension Tool      |
+==========================================+
""")


class TokenHandler(http.server.BaseHTTPRequestHandler):
    """Token Generate HTTP Service"""

    def do_GET(self):
        if self.path in ("/", "/token"):
            self._handle_token()
        elif self.path == "/health":
            self._send_json({"status": "ok", "service": "AI PRO Token Generator"})
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == "/token":
            self._handle_token()
        else:
            self.send_error(404)

    def _handle_token(self):
        token, source = generate_token_routine()
        self._send_json({
            "token": token,
            "source": source,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        })

    def _send_json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        print(f"[Server] {args[0]}")


def generate_token_routine(user_id="extension_user"):
    """Generate token: prefer backend, fallback to local"""
    print("  Trying TeamChat backend...")
    token, source = fetch_remote_token(user_id)
    if token:
        print("  Backend token obtained!")
        return token, source

    print("  Backend unavailable, generating local token...")
    token = generate_local_token(user_id)
    print("  Local token generated!")
    return token, "local"


def run_server(port=8099):
    """Start HTTP server"""
    try:
        with socketserver.TCPServer(("", port), TokenHandler) as httpd:
            print(f"\n  Server running at: http://localhost:{port}")
            print(f"  Get Token: curl http://localhost:{port}/token")
            print(f"  Health:    curl http://localhost:{port}/health")
            print(f"  Press Ctrl+C to stop\n")
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e) or "10048" in str(e):
            print(f"  ERROR: Port {port} in use, try: --serve --port {port+1}")
        else:
            print(f"  ERROR: {e}")
    except KeyboardInterrupt:
        print("\n  Server stopped.")


def main():
    parser = argparse.ArgumentParser(description="AI PRO Token Generator")
    parser.add_argument("--local", action="store_true", help="Force local token generation")
    parser.add_argument("--fetch", action="store_true", help="Force backend fetch only")
    parser.add_argument("--copy", action="store_true", help="Copy token to clipboard")
    parser.add_argument("--serve", action="store_true", help="Start HTTP token service")
    parser.add_argument("--port", type=int, default=8099, help="Service port (default 8099)")
    parser.add_argument("--user", type=str, default="extension_user", help="User ID")
    args = parser.parse_args()

    print_banner()

    if args.serve:
        token, source = generate_token_routine(args.user)
        save_token(token, source)
        run_server(args.port)
        return

    # Generate
    if args.local:
        print("[Local Mode]")
        token = generate_local_token(args.user)
        source = "local"
    elif args.fetch:
        print("[Backend Mode]")
        token, source = fetch_remote_token(args.user)
        if not token:
            print("  ERROR: Backend connection failed!")
            print("  Ensure TeamChat is running at http://localhost:8088")
            print("  Or use --local for local token generation")
            sys.exit(1)
    else:
        print("[Auto Mode]")
        token, source = generate_token_routine(args.user)

    print(f"\n{'='*44}")
    print(f"  TOKEN: {token}")
    print(f"  SOURCE: {source}")
    print(f"{'='*44}\n")

    save_token(token, source)

    if args.copy:
        if copy_to_clipboard(token):
            print("  Copied to clipboard!")
        else:
            print("  Auto-copy failed, please copy manually.")

    print("\n  How to use:")
    print("    1. Click the extension icon in browser toolbar")
    print("    2. Paste the Token into the popup")
    print("    3. Click Activate")
    print("    4. Ready to use - no page refresh needed!\n")


if __name__ == "__main__":
    main()