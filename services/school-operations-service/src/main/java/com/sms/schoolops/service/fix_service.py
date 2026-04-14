import os

file_path = r'c:\Users\avira\sms-1\services\school-operations-service\src\main\java\com\sms\schoolops\service\SchoolOperationsService.java'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Add domain import
    if 'import com.sms.schoolops.domain.AcademicClassEntity;' in line:
        new_lines.append(line)
        new_lines.append('import com.sms.schoolops.domain.ClassSubjectTeacherMappingEntity;\n')
    # Add repository import
    elif 'import com.sms.schoolops.repository.AcademicClassRepository;' in line:
        new_lines.append(line)
        new_lines.append('import com.sms.schoolops.repository.ClassSubjectTeacherMappingRepository;\n')
    # Add final field
    elif 'private final TimetableSlotRepository timetableSlotRepository;' in line:
        new_lines.append(line)
        new_lines.append('    private final ClassSubjectTeacherMappingRepository classSubjectTeacherMappingRepository;\n')
    # Add initialization in constructor body
    # We find the specific spot where constructor body logic starts
    elif 'this.timetableSlotRepository = timetableSlotRepository;' in line:
        new_lines.append(line)
        new_lines.append('        this.classSubjectTeacherMappingRepository = classSubjectTeacherMappingRepository;\n')
    # Add new methods before the last closing brace
    elif line.strip() == '}' and line == lines[-1]:
        new_lines.append('\n')
        new_lines.append('    @Transactional\n')
        new_lines.append('    public ClassSubjectTeacherMappingView assignClassSubjectTeacher(ClassSubjectTeacherMappingView request) {\n')
        new_lines.append('        ClassSubjectTeacherMappingEntity entity = new ClassSubjectTeacherMappingEntity();\n')
        new_lines.append('        entity.setMappingId(UUID.randomUUID());\n')
        new_lines.append('        entity.setSchoolId(request.schoolId());\n')
        new_lines.append('        entity.setClassId(request.classId());\n')
        new_lines.append('        entity.setSubjectId(request.subjectId());\n')
        new_lines.append('        entity.setTeacherUserId(request.teacherUserId());\n')
        new_lines.append('        entity.setCreatedAt(Instant.now());\n')
        new_lines.append('        this.classSubjectTeacherMappingRepository.save(entity);\n')
        new_lines.append('        return new ClassSubjectTeacherMappingView(entity.getMappingId(), entity.getSchoolId(), entity.getClassId(), entity.getSubjectId(), entity.getTeacherUserId(), entity.getCreatedAt());\n')
        new_lines.append('    }\n')
        new_lines.append('\n')
        new_lines.append('    public List<ClassSubjectTeacherMappingView> listClassSubjectTeacherMappings(UUID schoolId) {\n')
        new_lines.append('        return this.classSubjectTeacherMappingRepository.findBySchoolId(schoolId).stream()\n')
        new_lines.append("                .map(m -> new ClassSubjectTeacherMappingView(m.getMappingId(), m.getSchoolId(), m.getClassId(), m.getSubjectId(), m.getTeacherUserId(), m.getCreatedAt()))\n")
        new_lines.append('                .toList();\n')
        new_lines.append('    }\n')
        new_lines.append('}\n')
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File patched successfully")
