#!/usr/bin/python3
import sys
import re

def main(in_file, out_file):
    states = {}
    print('time,x,y,inhaled,state,type', file=out_file)
    time = 0
    for line in in_file:
        if re.match(r'^\d+$', line.strip()):
            time = int(line)
        else:
            try:
                x,   y = [int(n) for n in line[line.find('(')+1:line.find(')')].split(',')]
                s1, s2, s3 = [int(n) for n in line[line.rfind('<')+1:line.rfind('>')].split(',')]
                if f"{x},{y}" in states:
                    print(f'{time},{x},{y},{states[f"{x},{y}"]},{s2},{s3}', file=out_file)
                states[f"{x},{y}"] = s2
            except:
                print(f'line contents ::{line}::', file=sys.stderr)
                raise
"""
if(len(sys.argv) >2):
    with open(sys.argv[1]) as in_file, open(sys.argv[2], 'w') as out_file:
       main(in_file, out_file)
elif len(sys.argv) >1:
    with open(sys.argv[1]) as in_file:
        main(in_file, sys.stdout)
else:
    main(sys.stdin, sys.stdout)
"""
in_file_path = "state.txt"
out_file_path = "state_change.csv"
with open(in_file_path) as in_file, open(out_file_path, 'w') as out_file:
    main(in_file, out_file)
