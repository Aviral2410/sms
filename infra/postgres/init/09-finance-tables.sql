-- Finance Schema Initialization

CREATE SCHEMA IF NOT EXISTS finance;

-- Fee Structure Table
CREATE TABLE IF NOT EXISTS finance.fee_structure (
    fee_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    fee_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL, -- e.g., TUITION, TRANSPORT, EXAM
    academic_year VARCHAR(20) NOT NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE finance.fee_structure
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Payment Record Table
CREATE TABLE IF NOT EXISTS finance.payment_record (
    payment_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    fee_id UUID NOT NULL REFERENCES finance.fee_structure(fee_id),
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255),
    gateway_provider VARCHAR(50), -- RAZORPAY, STRIPE
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
);

-- Create indexes for performance and multi-tenancy
CREATE INDEX idx_fee_school ON finance.fee_structure(school_id);
CREATE INDEX idx_payment_school ON finance.payment_record(school_id);
CREATE INDEX idx_payment_student ON finance.payment_record(student_user_id);
