import json

log_path = '/home/canoz/.gemini/antigravity/brain/593e3a0d-ad21-4445-9424-71f43904da98/.system_generated/logs/overview.txt'
target_file = '/home/canoz/Desktop/UBUNTU_DEPO/G_project/websitem/3D-threejs-spiral-gallery/index.html'

with open(log_path, 'r') as f:
    lines = f.readlines()

with open(target_file, 'r') as f:
    content = f.read()

applied_count = 0

for line in lines:
    try:
        entry = json.loads(line)
        if entry.get('source') == 'MODEL' and entry.get('type') == 'PLANNER_RESPONSE':
            tool_calls = entry.get('tool_calls', [])
            for tc in tool_calls:
                if tc.get('name') == 'replace_file_content':
                    args = tc.get('args', {})
                    tf = args.get('TargetFile', '')
                    if 'index.html' in tf:
                        try:
                            # The args are serialized as JSON strings inside the JSON dict!
                            target_text = json.loads(args.get('TargetContent', '""'))
                            repl_text = json.loads(args.get('ReplacementContent', '""'))
                            if target_text and repl_text and target_text in content:
                                content = content.replace(target_text, repl_text)
                                applied_count += 1
                                print("Applied an edit.")
                            elif target_text and target_text not in content:
                                print("Warning: could not find target text in current content")
                                print("TARGET TEXT START:", repr(target_text[:100]))
                        except Exception as e:
                            print("Error parsing strings:", e)
    except Exception as e:
        pass

with open(target_file, 'w') as f:
    f.write(content)

print(f"Applied {applied_count} edits to {target_file}")
