import subprocess
import os

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
os.chdir(ROOT)

def run(name, args):
    print('\n--- Running:', name, '---')
    p = subprocess.run(args, capture_output=True, text=True)
    print('returncode:', p.returncode)
    if p.stdout:
        print('stdout:\n', p.stdout)
    if p.stderr:
        print('stderr:\n', p.stderr)

run('post_unique_programhead_api.py', ['python', os.path.join('scripts','post_unique_programhead_api.py')])
run('show_recent_programheads.py', ['python', os.path.join('scripts','show_recent_programheads.py')])

print('\n--- done ---')
