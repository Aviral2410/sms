import os

file_path = r'c:\Users\avira\sms-1\frontend\src\lib\api.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Add interface
    if 'export interface TeacherSubjectMappingView {' in line:
        new_lines.append('export interface ClassSubjectTeacherMappingView {\n')
        new_lines.append('  mappingId: string;\n')
        new_lines.append('  schoolId: string;\n')
        new_lines.append('  classId: string;\n')
        new_lines.append('  subjectId: string;\n')
        new_lines.append('  teacherUserId: string;\n')
        new_lines.append('  createdAt: string;\n')
        new_lines.append('}\n\n')
        new_lines.append(line)
    # Add API methods in schoolOpsApi
    elif 'listTeacherSubjectMappings: (schoolId: string) =>' in line:
        new_lines.append(line)
        new_lines.append('    listClassSubjectTeacherMappings: (schoolId: string) =>\n')
        new_lines.append('      request<ClassSubjectTeacherMappingView[]>(`/school-ops/assignments/class-subject-teacher?schoolId=${schoolId}`),\n\n')
    elif 'assignTeacherSubject: (body: { schoolId: string; primaryId: string; secondaryId: string }) =>' in line:
        new_lines.append(line)
        new_lines.append('  assignClassSubjectTeacher: (body: ClassSubjectTeacherMappingView) =>\n')
        new_lines.append("    request<ClassSubjectTeacherMappingView>('/school-ops/assignments/class-subject-teacher', { method: 'POST', body: JSON.stringify(body) }),\n\n")
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("api.ts patched successfully")
