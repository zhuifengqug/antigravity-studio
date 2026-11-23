"""Read-only post-compact memory rehydration helper for Antigravity Studio.

Extracts concise, secret-redacted session context (active goals, touched files,
task/plan checklist items, and recent user/checkpoint cues) from a conversation's
brain directory and transcript.jsonl so context remains coherent after compaction.
"""
import argparse
import json
import os
import re
import sys
import time

SECRET_PATTERNS = [
    re.compile(r'(sk-[A-Za-z0-9_\-]{10,}|AIza[A-Za-z0-9_\-]{12,}|ghp_[A-Za-z0-9]{12,}|Bearer\s+[A-Za-z0-9._\-]{8,})', re.I),
    re.compile(r'(access_token|refresh_token|client_secret|password|api_key)\s*[:=]\s*["\']?[^\s"\']{6,}', re.I),
]

FILE_PATH_RE = re.compile(
    r'(?:[A-Za-z]:\\[^\s"\'<>|*?`]+|(?:src|scripts|dist|test|lib|packages|app)/[A-Za-z0-9_.\-/]+)'
)


def _redact(text):
    out = str(text or '')
    for pat in SECRET_PATTERNS:
        out = pat.sub('[REDACTED]', out)
    return out


def _get_antigravity_dirs():
    home = os.path.expanduser('~')
    ag_dir = os.environ.get('AG_DIR') or os.environ.get('ANTIGRAVITY_APP_DATA_DIR') or os.path.join(home, '.gemini', 'antigravity')
    cli_dir = os.environ.get('AG_CLI_DIR') or os.path.join(home, '.gemini', 'antigravity-cli')
    return ag_dir, cli_dir


def _locate_brain_dir(cascade_id, explicit_brain_dir=None):
    if explicit_brain_dir and os.path.isdir(explicit_brain_dir):
        return explicit_brain_dir
    if not cascade_id:
        return None
    ag_dir, cli_dir = _get_antigravity_dirs()
    for base in (ag_dir, cli_dir):
        cand = os.path.join(base, 'brain', cascade_id)
        if os.path.isdir(cand):
            return cand
    return None


def _read_text_safe(path, max_bytes=262144):
    try:
        if not path or not os.path.isfile(path):
            return ''
        size = os.path.getsize(path)
        with open(path, 'rb') as f:
            if size > max_bytes:
                f.seek(size - max_bytes)
            raw = f.read(max_bytes)
        return raw.decode('utf-8', errors='replace')
    except Exception:
        return ''


def _extract_from_transcript(transcript_path, max_user_goals=6, max_files=24):
    raw = _read_text_safe(transcript_path, max_bytes=512 * 1024)
    if not raw:
        return [], [], []
    user_goals = []
    touched_files = []
    checkpoints = []
    seen_files = set()

    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except Exception:
            continue

        ev_type = str(ev.get('type') or ev.get('role') or '').upper()
        content = ev.get('content')
        if not isinstance(content, str):
            content = ev.get('text') if isinstance(ev.get('text'), str) else ''

        if ev_type in ('USER_INPUT', 'USER'):
            source = str(ev.get('source') or '')
            if source != 'SYSTEM_SDK' and content.strip():
                cleaned = _redact(' '.join(content.strip().split()))[:220]
                if cleaned:
                    user_goals.append(cleaned)
        elif ev_type == 'CHECKPOINT' or ev.get('sessionSummary'):
            summary = ev.get('sessionSummary') or content
            if isinstance(summary, str) and summary.strip():
                checkpoints.append(_redact(' '.join(summary.strip().split()))[:360])

        for tc in (ev.get('tool_calls') or []):
            if not isinstance(tc, dict):
                continue
            args = tc.get('args')
            if isinstance(args, dict):
                for key in ('Path', 'path', 'TargetFile', 'file_path', 'AbsolutePath'):
                    val = args.get(key)
                    if isinstance(val, str) and val.strip():
                        norm = val.strip().replace('\\', '/')
                        if norm not in seen_files and len(touched_files) < max_files:
                            seen_files.add(norm)
                            touched_files.append(norm)

        if content:
            for match in FILE_PATH_RE.findall(content):
                norm = match.strip().replace('\\', '/')
                if norm not in seen_files and len(touched_files) < max_files:
                    seen_files.add(norm)
                    touched_files.append(norm)

    return user_goals[-max_user_goals:], touched_files, checkpoints[-3:]


def _extract_task_items(brain_dir, max_items=15):
    if not brain_dir:
        return []
    items = []
    for fname in ('task.md', 'implementation_plan.md'):
        fpath = os.path.join(brain_dir, fname)
        txt = _read_text_safe(fpath, max_bytes=65536)
        if not txt:
            continue
        for line in txt.splitlines():
            s = line.strip()
            if re.match(r'^-\s*\[[ xX/\-]\]\s+', s):
                items.append(_redact(s[:160]))
                if len(items) >= max_items:
                    return items
    return items


def build_rehydration_payload(cascade_id=None, brain_dir=None, transcript_path=None):
    resolved_brain = _locate_brain_dir(cascade_id, brain_dir)
    if not transcript_path and resolved_brain:
        for cand in (
            os.path.join(resolved_brain, '.system_generated', 'logs', 'transcript.jsonl'),
            os.path.join(resolved_brain, 'transcript.jsonl'),
        ):
            if os.path.isfile(cand):
                transcript_path = cand
                break

    user_goals, touched_files, checkpoints = _extract_from_transcript(transcript_path) if transcript_path else ([], [], [])
    task_items = _extract_task_items(resolved_brain)

    sections = []
    if checkpoints:
        sections.append('## Recent Checkpoint Summaries\n' + '\n'.join(f'- {c}' for c in checkpoints))
    if user_goals:
        sections.append('## Active User Goals\n' + '\n'.join(f'- {g}' for g in user_goals))
    if task_items:
        sections.append('## Task Checklist\n' + '\n'.join(task_items))
    if touched_files:
        sections.append('## Referenced / Modified Files\n' + '\n'.join(f'- {p}' for p in touched_files))

    memory_block = '\n\n'.join(sections).strip()
    return {
        'ok': True,
        'cascadeId': cascade_id or None,
        'brainDir': resolved_brain,
        'transcriptPath': transcript_path,
        'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'userGoalsCount': len(user_goals),
        'taskItemsCount': len(task_items),
        'touchedFilesCount': len(touched_files),
        'checkpointsCount': len(checkpoints),
        'userGoals': user_goals,
        'taskItems': task_items,
        'touchedFiles': touched_files,
        'checkpoints': checkpoints,
        'memoryBlock': memory_block,
    }


def main():
    parser = argparse.ArgumentParser(description='Antigravity Studio post-compact memory rehydration helper')
    parser.add_argument('--cascade-id', default='', help='Conversation cascade UUID')
    parser.add_argument('--brain-dir', default='', help='Explicit brain directory path')
    parser.add_argument('--transcript', default='', help='Explicit transcript.jsonl path')
    parser.add_argument('--stdin-json', action='store_true', help='Read parameters from stdin JSON')
    args = parser.parse_args()

    cascade_id = args.cascade_id.strip()
    brain_dir = args.brain_dir.strip() or None
    transcript = args.transcript.strip() or None

    if args.stdin_json or (not cascade_id and not brain_dir and not transcript and not sys.stdin.isatty()):
        try:
            raw_in = sys.stdin.read().strip()
            if raw_in:
                data = json.loads(raw_in)
                if isinstance(data, dict):
                    cascade_id = str(data.get('cascadeId') or data.get('cascade_id') or cascade_id).strip()
                    brain_dir = data.get('brainDir') or data.get('brain_dir') or brain_dir
                    transcript = data.get('transcriptPath') or data.get('transcript_path') or transcript
        except Exception as exc:
            json.dump({'ok': False, 'error': str(exc)}, sys.stdout, ensure_ascii=True)
            return

    res = build_rehydration_payload(cascade_id=cascade_id or None, brain_dir=brain_dir, transcript_path=transcript)
    json.dump(res, sys.stdout, ensure_ascii=True)


if __name__ == '__main__':
    main()
