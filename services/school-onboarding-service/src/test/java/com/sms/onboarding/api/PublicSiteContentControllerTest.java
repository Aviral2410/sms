package com.sms.onboarding.api;

import static com.sms.onboarding.api.PublicInquiryDtos.PublicInquiryResponse;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicMediaAssetResponse;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicRoleBenefit;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicSectionMedia;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicSiteContentResponse;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicSiteFeatureCard;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.onboarding.domain.PublicMediaAssetEntity;
import com.sms.onboarding.service.PublicInquiryService;
import com.sms.onboarding.service.PublicMediaAssetService;
import com.sms.onboarding.service.PublicSiteContentService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

@WebMvcTest(PublicSiteContentController.class)
class PublicSiteContentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PublicSiteContentService publicSiteContentService;

    @MockBean
    private PublicInquiryService publicInquiryService;

    @MockBean
    private PublicMediaAssetService publicMediaAssetService;

    @Test
    void shouldReturnPublicSiteContent() throws Exception {
        when(publicSiteContentService.getPublicContent()).thenReturn(new PublicSiteContentResponse(
                UUID.fromString("00000000-0000-0000-0000-000000000001"),
                "ElevateSmart",
                "Hero eyebrow",
                "Hero headline",
                "Hero subheadline",
                "Vision title",
                "Vision body",
                "Why title",
                "Why body",
                "Pricing title",
                "Pricing body",
                "Contact title",
                "Contact body",
                "Support title",
                "Support body",
                "Founders message",
                "Team",
                "Builders",
                "Founder title",
                "Founder body",
                "Founder signoff",
                "Start",
                "/onboarding",
                "Read",
                "/founders-message",
                List.of(new PublicSiteFeatureCard("Feature", "Description", "Category", "/hero.png", "#22d3ee", 1, List.of("One"))),
                List.of(new PublicRoleBenefit("SCHOOL_ADMIN", "School Admin", "Run ops", "Description", "#ffb663", List.of("Outcome"))),
                List.of(new PublicSectionMedia("hero", "/hero.png", "/hero.png", "Hero", "Caption")),
                Instant.parse("2026-04-09T10:00:00Z")
        ));

        mockMvc.perform(get("/api/v1/public/site-content"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brandLabel").value("ElevateSmart"))
                .andExpect(jsonPath("$.featureCards[0].title").value("Feature"))
                .andExpect(jsonPath("$.roleBenefits[0].roleKey").value("SCHOOL_ADMIN"));
    }

    @Test
    void shouldCreateContactInquiry() throws Exception {
        when(publicInquiryService.submitContactRequest(any())).thenReturn(
                new PublicInquiryResponse(UUID.randomUUID(), "CONTACT", "OPEN", Instant.parse("2026-04-09T10:15:00Z"))
        );

        mockMvc.perform(post("/api/v1/public/contact-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Asha Thomas",
                                  "email": "asha@example.com",
                                  "organization": "North Ridge Academy",
                                  "schoolName": "North Ridge Academy",
                                  "phone": "+91-9999999999",
                                  "subject": "Need a walkthrough",
                                  "message": "Please help us evaluate the platform."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inquiryType").value("CONTACT"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void shouldUpdatePublicSiteContentForPlatformAdmin() throws Exception {
        when(publicSiteContentService.updateContent(any())).thenReturn(new PublicSiteContentResponse(
                UUID.fromString("00000000-0000-0000-0000-000000000001"),
                "ElevateSmart",
                "Updated eyebrow",
                "Updated headline",
                "Updated subheadline",
                "Vision title",
                "Vision body",
                "Why title",
                "Why body",
                "Pricing title",
                "Pricing body",
                "Contact title",
                "Contact body",
                "Support title",
                "Support body",
                "Founders message",
                "Team",
                "Builders",
                "Founder title",
                "Founder body",
                "Founder signoff",
                "Start",
                "/onboarding",
                "Read",
                "/founders-message",
                List.of(),
                List.of(),
                List.of(),
                Instant.parse("2026-04-09T10:30:00Z")
        ));

        mockMvc.perform(patch("/api/v1/platform/public-site-content")
                        .header("X-User-Role", "PLATFORM_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "heroEyebrow": "Updated eyebrow",
                                  "heroHeadline": "Updated headline",
                                  "heroSubheadline": "Updated subheadline"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heroHeadline").value("Updated headline"));
    }

    @Test
    void shouldUploadPublicMediaForPlatformAdmin() throws Exception {
        when(publicMediaAssetService.uploadAsset(any(), any(), any())).thenReturn(
                new PublicMediaAssetResponse(
                        UUID.fromString("10000000-0000-0000-0000-000000000001"),
                        "hero",
                        "hero.png",
                        "image/png",
                        128L,
                        "/api/v1/public/media/10000000-0000-0000-0000-000000000001",
                        Instant.parse("2026-04-09T10:45:00Z")
                )
        );

        MockMultipartFile file = new MockMultipartFile("file", "hero.png", "image/png", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/v1/platform/public-site-content/media")
                        .file(file)
                        .param("assetKey", "hero")
                        .header("X-User-Role", "PLATFORM_ADMIN")
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assetKey").value("hero"))
                .andExpect(jsonPath("$.publicUrl").value("/api/v1/public/media/10000000-0000-0000-0000-000000000001"));
    }

    @Test
    void shouldServePublicMedia() throws Exception {
        PublicMediaAssetEntity entity = new PublicMediaAssetEntity();
        entity.setAssetId(UUID.fromString("10000000-0000-0000-0000-000000000001"));
        entity.setAssetKey("hero");
        entity.setFileName("hero.png");
        entity.setContentType("image/png");
        entity.setFileSize(3L);
        entity.setContentData(new byte[] {1, 2, 3});

        when(publicMediaAssetService.getAsset(UUID.fromString("10000000-0000-0000-0000-000000000001"))).thenReturn(entity);

        mockMvc.perform(get("/api/v1/public/media/10000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk());
    }
}
