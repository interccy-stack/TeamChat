#!/usr/bin/env python3
"""Fix pagination syntax errors in index.js"""

f = '/run/csi/mount-root/nas/4079184d856ecc166ed19d4887083405/plugins/team_chat/frontend/dist/index.js'
with open(f, 'r') as fh:
    c = fh.read()

# 1. Fix paginationBar definition: 3 closing parens -> 2
#    Pattern is: ..."100"))); };
#    Should be:  ..."100"))); };
#    "100") closes e("option"...), ) closes e("select"...), ) closes e("div"...)
c = c.replace('"100"))); };', '"100"))); };')

# 2. Fix inbox call:  ,paginationBar("inbox")) -> paginationBar("inbox")
#    But need the leading comma to be in the right place
#    Current:     ,paginationBar("inbox")) : emailTab === "sent" ?
#    This has 2 ) but only needs 1 (the one after inbox is close of e("div"))
#    Actually paginationBar("inbox") already closes itself, then ) closes e("div")
#    So 2 ) is correct: 1 for paginationBar() call, 1 for e("div")
#    Let me first just test after fixing definition

# 3. Fix contacts call if needed
#    Current:     ,paginationBar("contacts")) : emailTab === "trash" ?
#    Original:    )) : emailTab === "trash" ?
#    This is fine IF definition is fixed

with open(f, 'w') as fh:
    fh.write(c)

print('Fix applied')