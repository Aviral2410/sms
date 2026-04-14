CREATE TABLE IF NOT EXISTS schoolops.department (
    department_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    department_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.subject (
    subject_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    department_id UUID,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.academic_class (
    class_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.school_user (
    user_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    school_code VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role_name VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    theme VARCHAR(40) DEFAULT 'dark',
    active_theme VARCHAR(60) DEFAULT 'indigo-flow',
    vibe VARCHAR(40) DEFAULT 'visual',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    glass_intensity DOUBLE PRECISION DEFAULT 0.4,
    border_radius VARCHAR(40) DEFAULT '24px'
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_school_user_tenant_email
    ON schoolops.school_user (tenant_id, LOWER(email));

CREATE TABLE IF NOT EXISTS schoolops.department_hod_assignment (
    assignment_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    department_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.teacher_subject_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.teacher_class_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    class_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.class_teacher_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    class_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.class_subject_teacher_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.student_class_enrollment (
    enrollment_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    class_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.student_parent_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    parent_user_id UUID NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
