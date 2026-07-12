import urllib.request, json

# Test without auth
req = urllib.request.Request(
    "http://localhost:8088/api/plugins/team_chat/bookmarklet-chat",
    data=json.dumps({"message": "hi", "agent_id": "default"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    resp = urllib.request.urlopen(req, timeout=20)
    print("NO AUTH:", resp.status, resp.read().decode()[:200])
except Exception as e:
    print("NO AUTH ERROR:", e)

# Test with empty auth
req2 = urllib.request.Request(
    "http://localhost:8088/api/plugins/team_chat/bookmarklet-chat",
    data=json.dumps({"message": "hi", "agent_id": "default"}).encode(),
    headers={"Content-Type": "application/json", "Authorization": "Bearer "},
    method="POST"
)
try:
    resp2 = urllib.request.urlopen(req2, timeout=20)
    print("EMPTY AUTH:", resp2.status, resp2.read().decode()[:200])
except Exception as e:
    print("EMPTY AUTH ERROR:", e)