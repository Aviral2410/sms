INSERT INTO onboarding.required_document_template (document_name, display_order, active)
SELECT 'School registration certificate', 1, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM onboarding.required_document_template
    WHERE document_name = 'School registration certificate'
);

INSERT INTO onboarding.required_document_template (document_name, display_order, active)
SELECT 'Board affiliation proof', 2, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM onboarding.required_document_template
    WHERE document_name = 'Board affiliation proof'
);

INSERT INTO onboarding.required_document_template (document_name, display_order, active)
SELECT 'Principal identification document', 3, TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM onboarding.required_document_template
    WHERE document_name = 'Principal identification document'
);
