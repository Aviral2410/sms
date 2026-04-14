package com.sms.onboarding.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.onboarding.api.PublicSiteContentDtos.PublicRoleBenefit;
import com.sms.onboarding.api.PublicSiteContentDtos.PublicSectionMedia;
import com.sms.onboarding.api.PublicSiteContentDtos.PublicSiteContentResponse;
import com.sms.onboarding.api.PublicSiteContentDtos.PublicSiteFeatureCard;
import com.sms.onboarding.api.PublicSiteContentDtos.PublicTestimonial;
import com.sms.onboarding.api.PublicSiteContentDtos.UpdatePublicSiteContentRequest;
import com.sms.onboarding.domain.PublicSiteContentEntity;
import com.sms.onboarding.repository.PublicSiteContentRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicSiteContentService {

    private static final UUID DEFAULT_CONTENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final PublicSiteContentRepository repository;
    private final ObjectMapper objectMapper;

    public PublicSiteContentService(PublicSiteContentRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public PublicSiteContentResponse getPublicContent() {
        PublicSiteContentEntity entity = repository.findById(DEFAULT_CONTENT_ID).orElseGet(this::buildDefaultEntity);
        return toResponse(entity);
    }

    @Transactional
    public PublicSiteContentResponse updateContent(UpdatePublicSiteContentRequest request) {
        PublicSiteContentEntity entity = repository.findById(DEFAULT_CONTENT_ID).orElseGet(this::buildDefaultEntity);

        if (request.brandLabel() != null) entity.setBrandLabel(request.brandLabel());
        if (request.heroEyebrow() != null) entity.setHeroEyebrow(request.heroEyebrow());
        if (request.heroHeadline() != null) entity.setHeroHeadline(request.heroHeadline());
        if (request.heroSubheadline() != null) entity.setHeroSubheadline(request.heroSubheadline());
        if (request.visionTitle() != null) entity.setVisionTitle(request.visionTitle());
        if (request.visionBody() != null) entity.setVisionBody(request.visionBody());
        if (request.whyTitle() != null) entity.setWhyTitle(request.whyTitle());
        if (request.whyBody() != null) entity.setWhyBody(request.whyBody());
        if (request.pricingHeadline() != null) entity.setPricingHeadline(request.pricingHeadline());
        if (request.pricingBody() != null) entity.setPricingBody(request.pricingBody());
        if (request.contactHeadline() != null) entity.setContactHeadline(request.contactHeadline());
        if (request.contactBody() != null) entity.setContactBody(request.contactBody());
        if (request.supportHeadline() != null) entity.setSupportHeadline(request.supportHeadline());
        if (request.supportBody() != null) entity.setSupportBody(request.supportBody());
        if (request.founderTitle() != null) entity.setFounderTitle(request.founderTitle());
        if (request.founderName() != null) entity.setFounderName(request.founderName());
        if (request.founderRole() != null) entity.setFounderRole(request.founderRole());
        if (request.founderMessageTitle() != null) entity.setFounderMessageTitle(request.founderMessageTitle());
        if (request.founderMessageBody() != null) entity.setFounderMessageBody(request.founderMessageBody());
        if (request.founderSignoff() != null) entity.setFounderSignoff(request.founderSignoff());
        if (request.primaryCtaLabel() != null) entity.setPrimaryCtaLabel(request.primaryCtaLabel());
        if (request.primaryCtaUrl() != null) entity.setPrimaryCtaUrl(request.primaryCtaUrl());
        if (request.secondaryCtaLabel() != null) entity.setSecondaryCtaLabel(request.secondaryCtaLabel());
        if (request.secondaryCtaUrl() != null) entity.setSecondaryCtaUrl(request.secondaryCtaUrl());
        if (request.featureCards() != null) entity.setFeatureCardsJson(writeJson(sortFeatureCards(request.featureCards())));
        if (request.roleBenefits() != null) entity.setRoleBenefitsJson(writeJson(request.roleBenefits()));
        if (request.mediaGallery() != null) entity.setMediaGalleryJson(writeJson(request.mediaGallery()));
        if (request.testimonials() != null) entity.setTestimonialsJson(writeJson(sortTestimonials(request.testimonials())));

        return toResponse(repository.save(entity));
    }

    private PublicSiteContentResponse toResponse(PublicSiteContentEntity entity) {
        return new PublicSiteContentResponse(
                entity.getContentId(),
                entity.getBrandLabel(),
                entity.getHeroEyebrow(),
                entity.getHeroHeadline(),
                entity.getHeroSubheadline(),
                entity.getVisionTitle(),
                entity.getVisionBody(),
                entity.getWhyTitle(),
                entity.getWhyBody(),
                entity.getPricingHeadline(),
                entity.getPricingBody(),
                entity.getContactHeadline(),
                entity.getContactBody(),
                entity.getSupportHeadline(),
                entity.getSupportBody(),
                entity.getFounderTitle(),
                entity.getFounderName(),
                entity.getFounderRole(),
                entity.getFounderMessageTitle(),
                entity.getFounderMessageBody(),
                entity.getFounderSignoff(),
                entity.getPrimaryCtaLabel(),
                entity.getPrimaryCtaUrl(),
                entity.getSecondaryCtaLabel(),
                entity.getSecondaryCtaUrl(),
                readList(entity.getFeatureCardsJson(), PublicSiteFeatureCard.class, defaultFeatureCards()),
                readList(entity.getRoleBenefitsJson(), PublicRoleBenefit.class, defaultRoleBenefits()),
                readList(entity.getMediaGalleryJson(), PublicSectionMedia.class, defaultMediaGallery()),
                readList(entity.getTestimonialsJson(), PublicTestimonial.class, defaultTestimonials()),
                entity.getUpdatedAt()
        );
    }

    private PublicSiteContentEntity buildDefaultEntity() {
        PublicSiteContentEntity entity = new PublicSiteContentEntity();
        entity.setContentId(DEFAULT_CONTENT_ID);
        entity.setBrandLabel("ElevateSmart");
        entity.setHeroEyebrow("The operational intelligence layer for modern education");
        entity.setHeroHeadline("One connected campus system for admissions, academics, finance, communication, transport, and AI-assisted teaching.");
        entity.setHeroSubheadline("ElevateSmart helps institutions replace fragmented tools with a living operating system. Every workflow stays connected, every role sees the right intelligence, and every school grows with more clarity.");
        entity.setVisionTitle("Why we built ElevateSmart");
        entity.setVisionBody("Schools should not need separate systems for onboarding, billing, communication, classroom operations, transport, and analytics. We built ElevateSmart to give institutions one shared operational language so leaders can move faster, teachers can teach better, and families can stay informed without friction.");
        entity.setWhyTitle("Built for institutional momentum");
        entity.setWhyBody("The platform is designed to turn scattered admin effort into coordinated motion. When onboarding, subscriptions, student records, announcements, attendance, performance, and support all flow through one platform, institutions can scale without losing trust or operational control.");
        entity.setPricingHeadline("Commercial plans aligned to rollout depth and operational capacity");
        entity.setPricingBody("Choose the pricing lane that matches launch speed, institution size, and how much workflow depth you want live from day one.");
        entity.setContactHeadline("Talk to the team behind the platform");
        entity.setContactBody("Use this route for real conversations about rollout planning, partnerships, implementation timing, or whether the platform fits your operating model.");
        entity.setSupportHeadline("Raise support without losing context");
        entity.setSupportBody("Bring rollout blockers, production issues, access failures, and operational questions here so the platform team can triage with full context.");
        entity.setFounderTitle("Vision");
        entity.setFounderName("ElevateSmart Product Team");
        entity.setFounderRole("Platform builders for institutions that want continuity, operational depth, and fewer disconnected systems.");
        entity.setFounderMessageTitle("Education software should feel like infrastructure, not admin debt.");
        entity.setFounderMessageBody("We created ElevateSmart after seeing how often good schools were slowed down by disconnected systems and duplicate effort. The goal was never just dashboards. It was to build a dependable operating layer that helps institutions lead with more visibility, more empathy, and more follow-through across every role in the campus ecosystem.");
        entity.setFounderSignoff("Built for schools that want operational depth, not surface-level software.");
        entity.setPrimaryCtaLabel("Start school onboarding");
        entity.setPrimaryCtaUrl("/onboarding");
        entity.setSecondaryCtaLabel("See the vision");
        entity.setSecondaryCtaUrl("/vision");
        entity.setFeatureCardsJson(writeJson(defaultFeatureCards()));
        entity.setRoleBenefitsJson(writeJson(defaultRoleBenefits()));
        entity.setMediaGalleryJson(writeJson(defaultMediaGallery()));
        entity.setTestimonialsJson(writeJson(defaultTestimonials()));
        entity.setUpdatedAt(Instant.now());
        return entity;
    }

    private List<PublicSiteFeatureCard> sortFeatureCards(List<PublicSiteFeatureCard> featureCards) {
        return featureCards.stream()
                .sorted(Comparator.comparing(card -> card.sortOrder() == null ? Integer.MAX_VALUE : card.sortOrder()))
                .toList();
    }

    private <T> List<T> readList(String raw, Class<T> itemClass, List<T> fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }

        try {
            JavaType listType = objectMapper.getTypeFactory().constructCollectionType(List.class, itemClass);
            return objectMapper.readValue(raw, listType);
        } catch (JsonProcessingException ex) {
            return fallback;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize public site content.", ex);
        }
    }

    private List<PublicSiteFeatureCard> defaultFeatureCards() {
        return List.of(
                new PublicSiteFeatureCard(
                        "Admissions and onboarding",
                        "Launch new institutions, provision school access, and move from registration to activation with one coordinated flow.",
                        "Growth",
                        "/admissions-story.svg",
                        "#ffb663",
                        1,
                        List.of("Structured school onboarding", "Activation workflows", "Platform review visibility")
                ),
                new PublicSiteFeatureCard(
                        "Academic operations",
                        "Manage attendance, classes, exams, report cards, timetables, and student records from a connected operational core.",
                        "Academics",
                        "/academics-story.svg",
                        "#22d3ee",
                        2,
                        List.of("Attendance intelligence", "Exam and timetable workflows", "Student and teacher records")
                ),
                new PublicSiteFeatureCard(
                        "Finance and subscriptions",
                        "Track plans, billing structures, and institutional capacity with commercial data that stays connected to rollout decisions.",
                        "Commercial",
                        "/finance-story.svg",
                        "#34d399",
                        3,
                        List.of("Plan-aware onboarding", "Fee structures", "Commercial visibility for platform teams")
                ),
                new PublicSiteFeatureCard(
                        "Communication and announcements",
                        "Deliver parent-facing and institution-facing updates through public notices, internal announcements, and workflow-linked messaging.",
                        "Communication",
                        "/communication-network.svg",
                        "#a78bfa",
                        4,
                        List.of("Public announcements", "Workflow notifications", "Role-aware communication paths")
                ),
                new PublicSiteFeatureCard(
                        "Transport and movement visibility",
                        "Coordinate routes, live movement, assignment workflows, and transport experiences across school operations.",
                        "Transport",
                        "/transport-network.svg",
                        "#f97316",
                        5,
                        List.of("Route and stop management", "Driver and conductor views", "Subscriber-facing transport access")
                ),
                new PublicSiteFeatureCard(
                        "AI-assisted teaching and decision support",
                        "Use AI copilot patterns for planning, visualization, examples, and institutional insight without fragmenting the main workflow.",
                        "AI",
                        "/ai-story.svg",
                        "#60a5fa",
                        6,
                        List.of("Teaching assistance", "Learning visualizations", "Decision support inside operational flows")
                )
        );
    }

    private List<PublicRoleBenefit> defaultRoleBenefits() {
        return List.of(
                new PublicRoleBenefit("PLATFORM_ADMIN", "Platform Admin", "Control rollout, provisioning, and system posture.", "View institutional growth, manage onboarding queues, control platform settings, and supervise health from a central command layer.", "#ffb663", List.of("Platform-wide visibility", "Commercial and onboarding control", "Operational decision support")),
                new PublicRoleBenefit("SCHOOL_ADMIN", "School Admin", "Run the institution without juggling disconnected systems.", "Handle admissions, billing, classes, staff, transport, and communication through one operating surface.", "#22d3ee", List.of("Unified school operations", "Fewer fragmented tools", "Cleaner institutional oversight")),
                new PublicRoleBenefit("TEACHER", "Teachers", "Stay inside the teaching flow while the system handles complexity.", "Access classes, attendance, analytics, resources, communication, and AI assistance without bouncing between products.", "#a78bfa", List.of("Faster class execution", "Better student visibility", "AI support built into the workflow")),
                new PublicRoleBenefit("STUDENT", "Students", "Get a clearer picture of progress and learning access.", "Students can see attendance, classroom signals, resources, and learning support in a structured digital workspace.", "#34d399", List.of("Progress visibility", "Resource access", "More consistent learning support")),
                new PublicRoleBenefit("PARENT", "Parents", "Stay informed without chasing the institution for updates.", "Parents gain transparent access to student context, communication, and role-specific services such as transport updates.", "#f472b6", List.of("Better transparency", "Faster updates", "Stronger school-family trust")),
                new PublicRoleBenefit("STAFF", "Staff and Operations", "Keep support functions inside the same institutional rhythm.", "Administrative and support teams can work inside the same campus system rather than maintaining side channels.", "#f59e0b", List.of("Less operational drift", "Shared context across teams", "Clearer support workflows")),
                new PublicRoleBenefit("TRANSPORT", "Transport Teams", "Operate movement and safety workflows with real context.", "Drivers, conductors, and transport managers work with route-aware views designed for live operational use.", "#38bdf8", List.of("Route visibility", "Role-specific consoles", "Safer day-to-day coordination"))
        );
    }

    private List<PublicSectionMedia> defaultMediaGallery() {
        return List.of(
                new PublicSectionMedia("hero", "/operational-viewpoint.svg", "/operational-viewpoint.svg", "Platform operational illustration", "A text-free visual that mirrors the connected operating model described on the landing page."),
                new PublicSectionMedia("story", "/institution-flow.svg", "/institution-flow.svg", "Institutional workflow illustration", "Signals moving across onboarding, academics, communication, transport, and finance."),
                new PublicSectionMedia("founder", "/institution-flow.svg", "/institution-flow.svg", "Institutional systems illustration", "A connected systems visual for the platform vision story.")
        );
    }

    private List<PublicTestimonial> sortTestimonials(List<PublicTestimonial> testimonials) {
        return testimonials.stream()
                .sorted(Comparator.comparing(item -> item.sortOrder() == null ? Integer.MAX_VALUE : item.sortOrder()))
                .toList();
    }

    private List<PublicTestimonial> defaultTestimonials() {
        return List.of(
                new PublicTestimonial(
                        "We finally stopped stitching together admissions spreadsheets, transport chats, and fee follow-ups. The platform gave our leadership team one operational picture.",
                        "Asha Nair",
                        "Principal",
                        "North Ridge Academy",
                        "/operational-viewpoint.svg",
                        "#22d3ee",
                        1
                ),
                new PublicTestimonial(
                        "The rollout felt grounded because the platform team understood institutional workflow, not just software setup. That made the difference for our staff adoption.",
                        "Rohan Bedi",
                        "Operations Lead",
                        "Bakshi Memorial Public School",
                        "/institution-flow.svg",
                        "#ffb663",
                        2
                ),
                new PublicTestimonial(
                        "Teachers got clarity instead of another admin portal. Attendance, notices, and learning support now feel connected instead of fragmented.",
                        "Meera Joshi",
                        "Academic Coordinator",
                        "Summit Public School",
                        "/ai-story.svg",
                        "#a78bfa",
                        3
                )
        );
    }
}
