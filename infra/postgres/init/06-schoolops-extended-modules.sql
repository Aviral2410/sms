CREATE TABLE IF NOT EXISTS schoolops.student_admission (
    admission_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    admission_no VARCHAR(100) NOT NULL,
    roll_no VARCHAR(40),
    admitted_on DATE NOT NULL,
    date_of_birth DATE,
    guardian_name VARCHAR(255) NOT NULL,
    guardian_phone VARCHAR(80) NOT NULL,
    address TEXT,
    previous_school VARCHAR(255),
    admission_status VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE schoolops.student_admission
    ADD COLUMN IF NOT EXISTS roll_no VARCHAR(40);

CREATE TABLE IF NOT EXISTS schoolops.timetable_slot (
    slot_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    room_name VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.fee_record (
    fee_record_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    fee_category VARCHAR(120) NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_status VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.attendance_record (
    attendance_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_name VARCHAR(80) NOT NULL,
    class_id UUID,
    teacher_user_id UUID,
    subject_id UUID,
    attendance_mode VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    timetable_slot_id UUID,
    period_number INTEGER,
    attendance_date DATE NOT NULL,
    attendance_status VARCHAR(40) NOT NULL,
    marked_by VARCHAR(255) NOT NULL,
    recorded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS class_id UUID;
ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS teacher_user_id UUID;
ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS subject_id UUID;
ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS attendance_mode VARCHAR(20) NOT NULL DEFAULT 'DAILY';
ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS timetable_slot_id UUID;
ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS period_number INTEGER;
ALTER TABLE schoolops.attendance_record ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attendance_school_class_date
    ON schoolops.attendance_record (school_id, class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_teacher_date
    ON schoolops.attendance_record (school_id, teacher_user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_mode_date
    ON schoolops.attendance_record (school_id, attendance_mode, attendance_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_daily
    ON schoolops.attendance_record (school_id, class_id, user_id, attendance_date, attendance_mode)
    WHERE attendance_mode = 'DAILY';

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_period
    ON schoolops.attendance_record (school_id, class_id, user_id, attendance_date, attendance_mode, period_number)
    WHERE attendance_mode = 'PERIOD';

CREATE TABLE IF NOT EXISTS schoolops.homework_item (
    homework_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.notice_board_item (
    notice_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience VARCHAR(120) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.exam_result_record (
    result_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(40) NOT NULL,
    marks_obtained NUMERIC(8,2) NOT NULL,
    max_marks NUMERIC(8,2) NOT NULL,
    grade VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.teacher_monthly_report (
    report_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    report_month VARCHAR(20) NOT NULL,
    academic_year VARCHAR(40) NOT NULL,
    classes_handled INTEGER NOT NULL,
    attendance_percentage NUMERIC(5,2) NOT NULL,
    biometric_compliance VARCHAR(80) NOT NULL,
    principal_note TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.student_monitoring_report (
    report_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    report_month VARCHAR(20) NOT NULL,
    academic_year VARCHAR(40) NOT NULL,
    attendance_percentage NUMERIC(5,2) NOT NULL,
    academic_note TEXT,
    behaviour_note TEXT,
    wellbeing_note TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.co_curricular_activity (
    activity_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    activity_type VARCHAR(120) NOT NULL,
    event_date DATE NOT NULL,
    coordinator_user_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.library_resource (
    resource_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    author_name VARCHAR(255),
    access_url TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.note_share (
    note_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    shared_by_user_id UUID NOT NULL,
    class_id UUID,
    subject_id UUID,
    title VARCHAR(255) NOT NULL,
    access_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_route (
    route_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(120) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_phone VARCHAR(80) NOT NULL,
    attendant_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    capacity INTEGER DEFAULT 40,
    conductor_name VARCHAR(255),
    conductor_phone VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL
);

-- Route stops (ordered waypoints)
CREATE TABLE IF NOT EXISTS schoolops.transport_stop (
    stop_id UUID PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    school_id UUID NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    stop_order INTEGER NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    pickup_time VARCHAR(10),
    drop_time VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL
);

-- Student → Route assignment
CREATE TABLE IF NOT EXISTS schoolops.transport_student_assignment (
    assignment_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    stop_id UUID REFERENCES schoolops.transport_stop(stop_id),
    created_at TIMESTAMPTZ NOT NULL
);

-- Vehicle GPS position log (latest + history)
CREATE TABLE IF NOT EXISTS schoolops.transport_vehicle_position (
    position_id UUID PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    school_id UUID NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    speed NUMERIC(6,2),
    heading NUMERIC(5,2),
    recorded_at TIMESTAMPTZ NOT NULL
);

-- Pickup/Drop log (conductor marks)
CREATE TABLE IF NOT EXISTS schoolops.transport_pickup_log (
    log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    student_user_id UUID NOT NULL,
    stop_id UUID REFERENCES schoolops.transport_stop(stop_id),
    action VARCHAR(10) NOT NULL,  -- PICKUP or DROP
    marked_by VARCHAR(255) NOT NULL,
    trip_date DATE NOT NULL,
    marked_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transport_stop_route ON schoolops.transport_stop(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignment_route ON schoolops.transport_student_assignment(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignment_student ON schoolops.transport_student_assignment(student_user_id);
CREATE INDEX IF NOT EXISTS idx_transport_position_route ON schoolops.transport_vehicle_position(route_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_pickup_log_date ON schoolops.transport_pickup_log(route_id, trip_date);

CREATE TABLE IF NOT EXISTS schoolops.voice_note (
    voice_note_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    related_user_id UUID,
    audience VARCHAR(120) NOT NULL,
    title VARCHAR(255) NOT NULL,
    transcript TEXT,
    audio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.reminder (
    reminder_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    reminder_type VARCHAR(120) NOT NULL,
    target_user_id UUID,
    message TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    reminder_status VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
