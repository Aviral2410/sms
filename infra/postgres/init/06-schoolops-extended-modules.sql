CREATE TABLE IF NOT EXISTS schoolops.student_admission (
    admission_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    student_full_name VARCHAR(255),
    student_email VARCHAR(255),
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
    ADD COLUMN IF NOT EXISTS student_full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS student_email VARCHAR(255),
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

-- Academics: Exams (schedule-first model) ------------------------------------

CREATE TABLE IF NOT EXISTS schoolops.exam (
    exam_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(40) NOT NULL,
    term VARCHAR(80),
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, COMPLETED, PUBLISHED
    created_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exam_school_year
    ON schoolops.exam (school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_exam_school_status
    ON schoolops.exam (school_id, status);

CREATE TABLE IF NOT EXISTS schoolops.exam_schedule_item (
    schedule_item_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    exam_id UUID NOT NULL REFERENCES schoolops.exam(exam_id) ON DELETE CASCADE,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    exam_date DATE NOT NULL,
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    room_name VARCHAR(120),
    max_marks NUMERIC(8,2) NOT NULL,
    pass_marks NUMERIC(8,2),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_schedule_exam_class_subject
    ON schoolops.exam_schedule_item (exam_id, class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_school_exam_date
    ON schoolops.exam_schedule_item (school_id, exam_id, exam_date);

-- Grading schemes (optional; used for auto-grade computation)
CREATE TABLE IF NOT EXISTS schoolops.grading_scheme (
    scheme_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    scheme_name VARCHAR(120) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_grading_scheme_default
    ON schoolops.grading_scheme (school_id)
    WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS schoolops.grading_band (
    band_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    scheme_id UUID NOT NULL REFERENCES schoolops.grading_scheme(scheme_id) ON DELETE CASCADE,
    grade VARCHAR(20) NOT NULL,
    min_percentage NUMERIC(5,2) NOT NULL,
    max_percentage NUMERIC(5,2) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grading_band_scheme
    ON schoolops.grading_band (school_id, scheme_id, sort_order);

-- Marks entered against an exam schedule.
CREATE TABLE IF NOT EXISTS schoolops.exam_mark (
    mark_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    exam_id UUID NOT NULL REFERENCES schoolops.exam(exam_id) ON DELETE CASCADE,
    schedule_item_id UUID REFERENCES schoolops.exam_schedule_item(schedule_item_id) ON DELETE SET NULL,
    student_user_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    marks_obtained NUMERIC(8,2) NOT NULL,
    max_marks NUMERIC(8,2) NOT NULL,
    grade VARCHAR(20),
    entered_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_mark_exam_student_subject
    ON schoolops.exam_mark (exam_id, student_user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_mark_school_exam
    ON schoolops.exam_mark (school_id, exam_id);

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
    description TEXT,
    subject VARCHAR(255),
    grade_level VARCHAR(255),
    tags TEXT,
    uploaded_by_user_id UUID,
    file_size BIGINT,
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

CREATE TABLE IF NOT EXISTS schoolops.resource_bookmark (
    bookmark_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.resource_view_log (
    log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.school_user_document (
    document_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    document_type VARCHAR(120) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    access_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_question (
    question_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(40) NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_answer (
    answer_id UUID PRIMARY KEY,
    question_id UUID NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_flag (
    flag_id UUID PRIMARY KEY,
    target_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_vote (
    vote_id UUID PRIMARY KEY,
    target_id UUID NOT NULL,
    voter_id UUID NOT NULL,
    vote_type INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_point_log (
    log_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    school_id UUID NOT NULL,
    points INTEGER NOT NULL,
    point_type VARCHAR(80) NOT NULL,
    reference_id UUID,
    "timestamp" TIMESTAMPTZ NOT NULL
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
    translations TEXT,
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

ALTER TABLE schoolops.school_user
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

ALTER TABLE schoolops.attendance_record
    ADD COLUMN IF NOT EXISTS session_id UUID,
    ADD COLUMN IF NOT EXISTS capture_source VARCHAR(40),
    ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS schoolops.attendance_policy (
    policy_id UUID PRIMARY KEY,
    school_id UUID NOT NULL UNIQUE,
    warning_threshold INTEGER NOT NULL,
    critical_threshold INTEGER NOT NULL,
    enabled_channels VARCHAR(500) NOT NULL,
    auto_absent_enabled BOOLEAN NOT NULL,
    auto_absent_minutes INTEGER NOT NULL,
    gps_enabled BOOLEAN NOT NULL,
    gps_mode VARCHAR(40) NOT NULL,
    geofence_latitude DOUBLE PRECISION,
    geofence_longitude DOUBLE PRECISION,
    geofence_radius_meters DOUBLE PRECISION,
    voice_enabled BOOLEAN NOT NULL,
    face_enabled BOOLEAN NOT NULL,
    ai_prediction_enabled BOOLEAN NOT NULL,
    reminder_enabled BOOLEAN NOT NULL,
    reminder_frequency VARCHAR(40) NOT NULL,
    face_confidence_threshold DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.attendance_session (
    session_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    period_number INTEGER NOT NULL,
    timetable_slot_id UUID,
    session_status VARCHAR(40) NOT NULL,
    gps_verification_status VARCHAR(40),
    gps_message TEXT,
    gps_latitude DOUBLE PRECISION,
    gps_longitude DOUBLE PRECISION,
    gps_distance_meters DOUBLE PRECISION,
    submit_note TEXT,
    submitted_at TIMESTAMPTZ,
    last_edited_at TIMESTAMPTZ,
    auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_session_school_class_subject_date_period
    ON schoolops.attendance_session (school_id, class_id, subject_id, attendance_date, period_number);

CREATE INDEX IF NOT EXISTS idx_attendance_session_school_teacher_date
    ON schoolops.attendance_session (school_id, teacher_user_id, attendance_date DESC);

CREATE TABLE IF NOT EXISTS schoolops.attendance_audit_log (
    audit_log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    session_id UUID NOT NULL,
    attendance_id UUID,
    student_user_id UUID NOT NULL,
    previous_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,
    edit_reason TEXT,
    changed_by VARCHAR(255) NOT NULL,
    changed_role VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_log_session_created
    ON schoolops.attendance_audit_log (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS schoolops.student_absence_reason (
    absence_reason_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    attendance_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    category VARCHAR(40) NOT NULL,
    description TEXT,
    review_status VARCHAR(40) NOT NULL,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_absence_reason_attendance
    ON schoolops.student_absence_reason (attendance_id);

CREATE TABLE IF NOT EXISTS schoolops.attendance_alert_event (
    alert_event_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    class_id UUID,
    alert_level VARCHAR(40) NOT NULL,
    attendance_percentage DOUBLE PRECISION NOT NULL,
    active BOOLEAN NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    channels_sent VARCHAR(1000),
    notification_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_attendance_alert_event_student_active
    ON schoolops.attendance_alert_event (school_id, student_user_id, active, triggered_at DESC);

CREATE TABLE IF NOT EXISTS schoolops.attendance_voice_command_log (
    voice_log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    session_id UUID NOT NULL,
    actor_user_id UUID NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    transcript TEXT NOT NULL,
    parsed_commands TEXT,
    rejected_commands TEXT,
    processing_status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_voice_log_session_created
    ON schoolops.attendance_voice_command_log (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS schoolops.attendance_face_scan (
    face_scan_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    session_id UUID NOT NULL,
    matched_student_user_id UUID,
    confidence DOUBLE PRECISION,
    capture_reference TEXT,
    provider_status VARCHAR(80),
    review_outcome VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_face_scan_session_created
    ON schoolops.attendance_face_scan (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS schoolops.attendance_prediction_snapshot (
    prediction_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    class_id UUID,
    snapshot_date DATE NOT NULL,
    current_attendance_percentage DOUBLE PRECISION NOT NULL,
    predicted_attendance_percentage DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(40) NOT NULL,
    risk_drivers TEXT,
    generated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_prediction_student_generated
    ON schoolops.attendance_prediction_snapshot (school_id, student_user_id, generated_at DESC);

-- HR / Operations -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS schoolops.staff_leave_request (
    leave_request_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    requester_user_id UUID NOT NULL,
    requester_role VARCHAR(80) NOT NULL,
    leave_type VARCHAR(40) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(40) NOT NULL,
    reviewed_by_user_id UUID,
    review_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_school_created
    ON schoolops.staff_leave_request (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_leave_school_requester
    ON schoolops.staff_leave_request (school_id, requester_user_id, created_at DESC);
