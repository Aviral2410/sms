
import sys

path = r'c:\Users\avira\sms-1\services\school-operations-service\src\main\java\com\sms\schoolops\service\SchoolOperationsService.java'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update createStudentAdmission
old_block = """        if (studentUserId == null) {
            if (request.studentEmail() == null || request.studentFullName() == null) {
                throw new IllegalArgumentException("Student email and full name are required if studentUserId is not provided.");
            }
            Optional<SchoolUserEntity> existingUser = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId()).stream().filter(u -> u.getEmail().equalsIgnoreCase(request.studentEmail())).findFirst();
            if (existingUser.isPresent()) {
                studentUserId = existingUser.get().getUserId();
            } else {
                SchoolUserEntity contextUser = (SchoolUserEntity)this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId()).stream().findFirst().orElseThrow(() -> new IllegalArgumentException("Cannot automate student creation: No existing users found to derive school context (tenantId/schoolCode)."));
                SchoolUserRequest userRequest = new SchoolUserRequest(contextUser.getTenantId(), contextUser.getSchoolId(), contextUser.getSchoolCode(), "Institutional User", request.studentFullName(), request.studentEmail(), "STUDENT", "Pass@" + request.admissionNo());
                SchoolUserResponse newUser = this.createUser(userRequest);
                studentUserId = newUser.userId();
            }
        }"""

new_block = """        if (studentUserId == null) {
            if (request.studentEmail() == null || request.studentFullName() == null) {
                throw new IllegalArgumentException("Student email and full name are required if studentUserId is not provided.");
            }
            Optional<SchoolUserEntity> existingUser = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId())
                    .stream().filter(u -> u.getEmail().equalsIgnoreCase(request.studentEmail())).findFirst();
            if (existingUser.isPresent()) {
                studentUserId = existingUser.get().getUserId();
            } else {
                Optional<SchoolUserEntity> contextUserOpt = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId())
                        .stream().findFirst();
                if (contextUserOpt.isPresent()) {
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
                }
            }
        }"""

# entity settings
old_entity_set = """        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(studentUserId);"""

new_entity_set = """        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(studentUserId);
        entity.setStudentFullName(request.studentFullName());
        entity.setStudentEmail(request.studentEmail());"""

# notification
old_notif = """        try {
            (this.communicationRestClient.post().uri("/api/v1/communication/notifications", new Object[0])).body(Map.of("recipientId", entity.getStudentUserId(), "title", "Admission Confirmed", "message", "Welcome to the school! Your admission " + entity.getAdmissionNo() + " is confirmed.", "type", "ADMISSION_CONFIRMATION", "channel", "PUSH")).retrieve().toBodilessEntity();
        }
        catch (Exception e) {
            System.err.println("Failed to send admission notification: " + e.getMessage());
        }"""

new_notif = """        if (entity.getStudentUserId() != null) {
            try {
                (this.communicationRestClient.post().uri("/api/v1/communication/notifications", new Object[0])).body(Map.of("recipientId", entity.getStudentUserId(), "title", "Admission Confirmed", "message", "Welcome to the school! Your admission " + entity.getAdmissionNo() + " is confirmed.", "type", "ADMISSION_CONFIRMATION", "channel", "PUSH")).retrieve().toBodilessEntity();
            }
            catch (Exception e) {
                System.err.println("Failed to send admission notification: " + e.getMessage());
            }
        }"""

# toAdmissionResponse
old_mapping = """        String fullName = "";
        String email = "";
        try {
            SchoolUserEntity user = this.schoolUserRepository.findById(entity.getStudentUserId())
                    .orElse(null);
            if (user != null) {
                fullName = user.getFullName();
                email = user.getEmail();
            }
        }"""

new_mapping = """        String fullName = entity.getStudentFullName() != null ? entity.getStudentFullName() : "";
        String email = entity.getStudentEmail() != null ? entity.getStudentEmail() : "";
        try {
            if (entity.getStudentUserId() != null) {
                SchoolUserEntity user = this.schoolUserRepository.findById(entity.getStudentUserId())
                        .orElse(null);
                if (user != null) {
                    fullName = user.getFullName();
                    email = user.getEmail();
                }
            }
        }"""

content = content.replace(old_block, new_block)
content = content.replace(old_entity_set, new_entity_set)
content = content.replace(old_notif, new_notif)
content = content.replace(old_mapping, new_mapping)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
