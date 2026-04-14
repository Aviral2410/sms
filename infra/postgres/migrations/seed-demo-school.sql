-- ============================================================
-- Seed Data: demo-school
-- schoolCode: demo-school
-- URL: http://demo-school.localhost:30080
--
-- NOTE: Replace the UUIDs below with actual values from your
-- identity.tenant table once the school is onboarded.
-- Run this AFTER the school has been provisioned and activated.
-- ============================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Resolve tenant_id from the school code
    SELECT tenant_id INTO v_tenant_id
    FROM identity.tenant
    WHERE school_code = 'demo-school'
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'demo-school tenant not found, skipping seed.';
        RETURN;
    END IF;

    -- ─── School Landing Profile ───────────────────────────────────────────────
    INSERT INTO onboarding.school_landing_profile (
        id, tenant_id, school_name, short_name, tagline, short_description,
        about_html, objective, mission, vision, history, why_us,
        address_line1, address_line2, city, state, country, pincode,
        latitude, longitude, phone, alternate_phone, email, website,
        office_hours, is_published, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'Demo Bright Public School', 'DBPS',
        'Nurturing tomorrow''s leaders today',
        'A premier institution committed to holistic education, academic excellence, and character development.',
        '<p>Demo Bright Public School has been a beacon of quality education since 1995. Our campus combines modern facilities with a culture of discipline, curiosity, and community.</p>',
        'To provide a world-class, value-based education that empowers every student to think independently, act responsibly, and contribute meaningfully to society.',
        'To foster an environment of inclusive learning where every child can discover their strengths and reach their fullest potential.',
        'A world where every child has access to transformative education that builds not just knowledge, but wisdom, empathy, and leadership.',
        'Founded in 1995 by visionary educators, DBPS began as a small school in Sector 12 and has grown into a renowned institution with over 3,000 students and 200 faculty members.',
        'We combine rigorous academics with a vibrant co-curricular programme, state-of-the-art infrastructure, and a caring faculty dedicated to each student''s journey.',
        '12, Knowledge Park, Sector 45', 'Near City Metro Station',
        'New Delhi', 'Delhi', 'India', '110045',
        28.6139, 77.2090,
        '+91-11-2345-6789', '+91-98765-43210',
        'info@demobps.edu.in', 'https://demobps.edu.in',
        'Mon–Sat: 8:00 AM – 4:00 PM',
        TRUE, NOW(), NOW()
    ) ON CONFLICT DO NOTHING;

    -- ─── Leaders ─────────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_leader (id, tenant_id, type, name, title, bio, message, display_order, is_published, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'founder', 'Dr. Ramesh Verma', 'Founder & Chairman',
     'Dr. Ramesh Verma holds a PhD in Education Policy from IIT Delhi and has dedicated 30 years to transforming Indian education. He founded DBPS with a vision to make quality education accessible to every child.',
     'Education is not the filling of a pail, but the lighting of a fire. At DBPS, we light that fire every single day.',
     1, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'principal', 'Mrs. Sunita Sharma', 'Principal',
     'Mrs. Sunita Sharma brings 25 years of teaching and administrative experience. Under her leadership, DBPS has achieved national recognition for academic and co-curricular excellence.',
     'Our goal is not merely to produce students who score well on exams — we aim to produce thoughtful, confident, and compassionate human beings.',
     2, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'director', 'Mr. Anil Verma', 'Director – Operations',
     'Mr. Anil Verma oversees campus operations, infrastructure, and administrative efficiency at DBPS.',
     'A well-run institution is a gift to its students. We strive for operational excellence so teachers can focus on teaching.',
     3, TRUE, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Branch ──────────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_branch (id, tenant_id, branch_name, address, city, state, pincode, latitude, longitude, phone, email, is_primary, is_published, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'Main Campus', '12, Knowledge Park, Sector 45', 'New Delhi', 'Delhi', '110045', 28.6139, 77.2090, '+91-11-2345-6789', 'main@demobps.edu.in', TRUE, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'South Campus', '5, Learning Avenue, Sector 78', 'New Delhi', 'Delhi', '110078', 28.5200, 77.2100, '+91-11-9876-5432', 'south@demobps.edu.in', FALSE, TRUE, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Admission Info ───────────────────────────────────────────────────────
    INSERT INTO onboarding.school_admission_info (id, tenant_id, overview, process, eligibility, contact_name, contact_phone, contact_email, is_published, created_at)
    VALUES (
        gen_random_uuid(), v_tenant_id,
        'Admissions at DBPS are open for Classes Nursery through XII. We follow a transparent, merit-and-interview based selection process.',
        '1. Submit online application form. 2. Attend aptitude assessment (Class IV and above). 3. Parent-student interview. 4. Document verification. 5. Fee payment and enrollment confirmation.',
        'Age criteria: 3.5 years for Nursery. Students should have passed the previous grade from a recognised school. Applicable CBSE guidelines apply.',
        'Mrs. Priya Nair', '+91-98200-12345', 'admissions@demobps.edu.in',
        TRUE, NOW()
    ) ON CONFLICT DO NOTHING;

    -- ─── Fee Structure ────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_fee_structure (id, tenant_id, academic_year, title, description, structured_data_json, is_published, created_at)
    VALUES (
        gen_random_uuid(), v_tenant_id,
        '2025-26', 'Annual Fee Structure 2025-26',
        'The fee structure below is applicable for all students enrolled in the academic year 2025-26. Fees are payable quarterly.',
        '[{"class":"Nursery - KG","annualFee":45000,"admissionFee":10000},{"class":"I - V","annualFee":60000,"admissionFee":12000},{"class":"VI - X","annualFee":75000,"admissionFee":15000},{"class":"XI - XII","annualFee":90000,"admissionFee":18000}]',
        TRUE, NOW()
    ) ON CONFLICT DO NOTHING;

    -- ─── Events ──────────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_event (id, tenant_id, title, slug, description, start_at, end_at, location, is_featured, is_published, status, sort_order, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'Annual Sports Day 2025', 'annual-sports-day-2025',
     'Join us for our Grand Annual Sports Day! A day of athletic excellence, team spirit, and celebration of our students'' sporting achievements.',
     NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '8 hours',
     'DBPS Main Campus – Sports Ground', TRUE, TRUE, 'UPCOMING', 1, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Science & Innovation Fair', 'science-fair-2025',
     'Students from Classes VI to XII will present innovative science projects. Open to parents and visitors.',
     NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days' + INTERVAL '6 hours',
     'DBPS Main Campus – Assembly Hall', FALSE, TRUE, 'UPCOMING', 2, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Open Day – Meet the Faculty', 'open-day-2025',
     'Prospective parents are invited for a guided campus tour and interaction with faculty members.',
     NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '4 hours',
     'DBPS Main Campus – Admin Block', FALSE, TRUE, 'UPCOMING', 3, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Gallery Albums ───────────────────────────────────────────────────────
    INSERT INTO onboarding.school_gallery_album (id, tenant_id, title, description, is_published, sort_order, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'Annual Day 2024', 'Highlights from our spectacular Annual Day celebration featuring student performances.', TRUE, 1, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Sports Day 2024', 'Moments of athletic excellence from our Annual Sports Day.', TRUE, 2, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Science Exhibition 2024', 'Student innovation on display at the Annual Science & Technology Exhibition.', TRUE, 3, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Testimonials ─────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_testimonial (id, tenant_id, author_name, relationship_type, designation, content, rating, display_order, is_published, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'Mrs. Ananya Singh', 'Parent', 'Mother of Aarav Singh (Class VIII)',
     'DBPS has been transformative for my son. The teachers here don''t just teach curricula — they build character. His confidence and curiosity have grown tremendously in just two years.',
     5, 1, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Rohan Mehta', 'Alumni', 'IIT Delhi, Batch 2022',
     'My foundation for getting into IIT was laid here at DBPS. The teachers pushed us to think beyond the textbook. I am forever grateful for my 12 years at this school.',
     5, 2, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Mr. Deepak Gupta', 'Parent', 'Father of Priya Gupta (Class X)',
     'The holistic approach at DBPS is what sets it apart. My daughter excels not just academically but also in music and debate. The school truly nurtures every dimension of a child.',
     5, 3, TRUE, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Achievements ─────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_achievement (id, tenant_id, title, description, achievement_year, category, is_featured, display_order, is_published, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'CBSE Top Performer – Delhi Zone', '15 students scored above 95% in Class XII Board Examinations, placing DBPS among the top 10 schools in Delhi Zone.', '2024', 'Academic', TRUE, 1, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'National Science Olympiad – Gold', 'Our student Priya Sharma won the Gold Medal at the National Science Olympiad, competing with 50,000+ students nationwide.', '2024', 'Olympiad', TRUE, 2, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'Best School – Education Excellence Award', 'Recognised as the Best CBSE School in Delhi NCR at the National Education Excellence Awards 2023.', '2023', 'Award', FALSE, 3, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'State-Level Inter-School Debate Champions', 'Our debate team won the State-Level Inter-School Debate Championship for the third consecutive year.', '2024', 'Co-Curricular', FALSE, 4, TRUE, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Infrastructure ───────────────────────────────────────────────────────
    INSERT INTO onboarding.school_infrastructure_item (id, tenant_id, type, title, description, icon, display_order, is_published, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'LAB', 'State-of-the-Art Science Labs', '6 fully-equipped labs for Physics, Chemistry, Biology, Electronics, Robotics, and Environmental Science.', 'flask', 1, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'LIBRARY', 'Central Library', 'A 5,000+ volume library with digital resources, reading zones, and a dedicated research section.', 'book', 2, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'SPORTS', 'Sports Complex', 'A 2-acre sports ground with facilities for cricket, football, basketball, badminton, and athletics.', 'trophy', 3, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'TECH', 'Smart Classrooms', 'All classrooms are equipped with interactive smart boards, projectors, and high-speed internet.', 'monitor', 4, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'TRANSPORT', 'GPS-Enabled Transport', '25 buses covering 50+ routes across Delhi NCR, all equipped with GPS tracking and CCTV.', 'bus', 5, TRUE, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Academic Content ─────────────────────────────────────────────────────
    INSERT INTO onboarding.school_academic_content (id, tenant_id, curriculum, co_curricular, scholarship_info, result_highlights, is_published, updated_at)
    VALUES (
        gen_random_uuid(), v_tenant_id,
        'DBPS follows the CBSE curriculum (Classes I–XII) with an enriched syllabus that integrates critical thinking, project-based learning, and NEP 2020 guidelines. We offer Science, Commerce, and Humanities streams in senior secondary.',
        'Our co-curricular programme includes Music (Hindustani & Western), Dance, Drama, Art & Craft, Robotics Club, Eco Club, Literary Society, Debate & MUN, NCC, and multiple sports.', 
        'Academic merit scholarships are awarded to top performers each year. Full fee waivers are available for students from economically weaker sections (EWS quota). Special sports scholarships for state/national-level athletes.',
        'Class X (2024): School average 87.4% | 15 students above 95% | Topper: 98.8%, Class XII (2024): School average 84.2% | 8 students above 95% | 100% pass rate',
        TRUE, NOW()
    ) ON CONFLICT DO NOTHING;

    -- ─── Section Config ───────────────────────────────────────────────────────
    INSERT INTO onboarding.school_section_config (id, tenant_id, section_key, is_enabled, display_order, updated_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'about', TRUE, 1, NOW()),
    (gen_random_uuid(), v_tenant_id, 'leadership', TRUE, 2, NOW()),
    (gen_random_uuid(), v_tenant_id, 'achievements', TRUE, 3, NOW()),
    (gen_random_uuid(), v_tenant_id, 'events', TRUE, 4, NOW()),
    (gen_random_uuid(), v_tenant_id, 'gallery', TRUE, 5, NOW()),
    (gen_random_uuid(), v_tenant_id, 'testimonials', TRUE, 6, NOW()),
    (gen_random_uuid(), v_tenant_id, 'infrastructure', TRUE, 7, NOW()),
    (gen_random_uuid(), v_tenant_id, 'academics', TRUE, 8, NOW()),
    (gen_random_uuid(), v_tenant_id, 'admission', TRUE, 9, NOW()),
    (gen_random_uuid(), v_tenant_id, 'fee_structure', TRUE, 10, NOW()),
    (gen_random_uuid(), v_tenant_id, 'branches', TRUE, 11, NOW()),
    (gen_random_uuid(), v_tenant_id, 'affiliation', TRUE, 12, NOW()),
    (gen_random_uuid(), v_tenant_id, 'contact', TRUE, 13, NOW()),
    (gen_random_uuid(), v_tenant_id, 'newsletter', TRUE, 14, NOW()),
    (gen_random_uuid(), v_tenant_id, 'social_links', TRUE, 15, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Social Links ─────────────────────────────────────────────────────────
    INSERT INTO onboarding.school_social_link (id, tenant_id, platform, url, display_order, is_published, created_at)
    VALUES
    (gen_random_uuid(), v_tenant_id, 'FACEBOOK', 'https://facebook.com/demobps', 1, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'INSTAGRAM', 'https://instagram.com/demobps', 2, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'YOUTUBE', 'https://youtube.com/demobps', 3, TRUE, NOW()),
    (gen_random_uuid(), v_tenant_id, 'TWITTER', 'https://twitter.com/demobps', 4, TRUE, NOW())
    ON CONFLICT DO NOTHING;

    -- ─── Affiliation Info ─────────────────────────────────────────────────────
    INSERT INTO onboarding.school_affiliation_info (id, tenant_id, board_name, affiliation_number, compliance_text, recognition_details, is_published, created_at)
    VALUES (
        gen_random_uuid(), v_tenant_id,
        'Central Board of Secondary Education (CBSE)',
        'AFF-1234567',
        'DBPS is fully affiliated with CBSE, New Delhi. All academic programmes, examinations, and certifications comply with CBSE guidelines and the National Education Policy 2020.',
        'Recognised by the Ministry of Education, Government of India. ISO 9001:2015 certified institution. Member of the Association of Schools for the Indian School Certificate Examinations.',
        TRUE, NOW()
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seed data for demo-school (tenant_id: %) inserted successfully.', v_tenant_id;
END $$;
