import os

file_path = r'c:\Users\avira\sms-1\frontend\src\pages\school\teachers\TeacherDetailsDrawer.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old props block and new props block
old_props = """type Props = {
  teacher: SchoolUser | null;
  open: boolean;
  onClose: () => void;
  performance: TeacherPerformance | null;
  classes: any[];
  classIds: string[];
};"""

new_props = """type Props = {
  teacher: SchoolUser | null;
  open: boolean;
  onClose: () => void;
  performance: TeacherPerformance | null;
};"""

if old_props in content:
    content = content.replace(old_props, new_props)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("TeacherDetailsDrawer fixed successfully")
else:
    # Try a more fuzzy match if needed, but let's see
    print("Could not find exact props block")
    # Let's try to just find the lines and remove them
    lines = content.splitlines()
    new_lines = []
    skip = False
    for line in lines:
        if 'classes: any[];' in line or 'classIds: string[];' in line:
            continue
        new_lines.append(line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')
    print("TeacherDetailsDrawer fixed via line filtering")
