#!/usr/bin/python3
import sys
import re
#State for model vp_res_(23,29) is <-1,0,0,-100,-300>
def main(in_file, out_file):
    # 
    # 
    print('time,x,y,prev_inhaled,curr_inhaled,previous_state,current_state,prev_type,curr_type', file=out_file)
    time = 0
    for line in in_file:
        if re.match(r'^\d+$', line.strip()):
            time = int(line)
        else:
            try:
                coords = [int(n) for n in line[line.find( '(')+1:line.find( ')')].split(',')]
                state  = [int(n) for n in line[line.rfind('<')+1:line.rfind('>')].split(',')]
                # 
                print(f'{time},{coords[0]},{coords[1]},{state[1]},{state[2]},{state[3]},{state[4]},{state[5]},{state[6]}', file=out_file)
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
