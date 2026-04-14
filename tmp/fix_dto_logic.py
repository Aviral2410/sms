
import sys

path = r'c:\Users\avira\sms-1\services\school-operations-service\src\main\java\com\sms\schoolops\api\SchoolOperationsDtos.java'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update StudentAdmissionRequest
old_request = """    public record StudentAdmissionRequest(
            @NotNull UUID schoolId, 
            UUID studentUserId, """

new_request = """    public record StudentAdmissionRequest(
            @NotNull UUID schoolId, 
            UUID tenantId,
            String schoolCode,
            UUID studentUserId, """

if old_request in content:
    content = content.replace(old_request, new_request)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")
else:
    # Try with different whitespace just in case
    print("Mismatched")
    # debug:
    # print(content[:500])
