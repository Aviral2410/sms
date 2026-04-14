
import sys

path = r'c:\Users\avira\sms-1\services\school-operations-service\src\main\java\com\sms\schoolops\service\SchoolOperationsService.java'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Use provided tenantId/schoolCode if context user is missing
old_logic = """                    SchoolUserRequest userRequest = new SchoolUserRequest(
                        contextUser.getTenantId(), contextUser.getSchoolId(), contextUser.getSchoolCode(), 
                        "Institutional User", request.studentFullName(), request.studentEmail(), "STUDENT", "Pass@" + request.admissionNo()
                    );"""

new_logic = """                    SchoolUserRequest userRequest = new SchoolUserRequest(
                        contextUser.getTenantId(), contextUser.getSchoolId(), contextUser.getSchoolCode(), 
                        "Institutional User", request.studentFullName(), request.studentEmail(), "STUDENT", "Pass@" + request.admissionNo()
                    );"""
# Actually, the logic should be: if contextUser exists, use it. If not, use request.tenantId().
# Wait, I'll rewrite the whole attempt block.

old_block = """                if (contextUserOpt.isPresent()) {
                    SchoolUserEntity contextUser = contextUserOpt.get();
                    SchoolUserRequest userRequest = new SchoolUserRequest(
                        contextUser.getTenantId(), contextUser.getSchoolId(), contextUser.getSchoolCode(), 
                        "Institutional User", request.studentFullName(), request.studentEmail(), "STUDENT", "Pass@" + request.admissionNo()
                    );
                    try {
                        SchoolUserResponse newUser = this.createUser(userRequest);
                        studentUserId = newUser.userId();
                    } catch (Exception e) {
                        System.err.println("Failed to auto-create user for admission: " + e.getMessage());
                    }
                }"""

new_block = """                UUID tId = request.tenantId();
                String sCode = request.schoolCode();
                
                if (contextUserOpt.isPresent()) {
                    tId = contextUserOpt.get().getTenantId();
                    sCode = contextUserOpt.get().getSchoolCode();
                }
                
                if (tId != null && sCode != null) {
                    SchoolUserRequest userRequest = new SchoolUserRequest(
                        tId, request.schoolId(), sCode, 
                        "Institutional User", request.studentFullName(), request.studentEmail(), "STUDENT", "Pass@" + request.admissionNo()
                    );
                    try {
                        SchoolUserResponse newUser = this.createUser(userRequest);
                        studentUserId = newUser.userId();
                    } catch (Exception e) {
                        System.err.println("Failed to auto-create user for admission: " + e.getMessage() + ". Proceeding with staged enrollment.");
                    }
                }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")
else:
    print("Mismatched")
