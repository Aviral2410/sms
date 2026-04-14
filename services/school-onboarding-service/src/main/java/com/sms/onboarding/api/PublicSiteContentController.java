package com.sms.onboarding.api;

import static com.sms.onboarding.api.PublicInquiryDtos.PublicInquiryRequest;
import static com.sms.onboarding.api.PublicInquiryDtos.PublicInquiryResponse;
import static com.sms.onboarding.api.PublicInquiryDtos.PlatformPublicInquiryResponse;
import static com.sms.onboarding.api.PublicInquiryDtos.UpdatePublicInquiryStatusRequest;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicMediaAssetResponse;
import static com.sms.onboarding.api.PublicSiteContentDtos.PublicSiteContentResponse;
import static com.sms.onboarding.api.PublicSiteContentDtos.UpdatePublicSiteContentRequest;

import com.sms.common.exception.ForbiddenException;
import com.sms.onboarding.domain.PublicMediaAssetEntity;
import com.sms.onboarding.service.PublicInquiryService;
import com.sms.onboarding.service.PublicMediaAssetService;
import com.sms.onboarding.service.PublicSiteContentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Tag(name = "Public Site", description = "Public website content and inquiry workflows.")
public class PublicSiteContentController {

    private static final Set<String> PLATFORM_ROLES = Set.of("PLATFORM_ADMIN", "SUPER_ADMIN");

    private final PublicSiteContentService publicSiteContentService;
    private final PublicInquiryService publicInquiryService;
    private final PublicMediaAssetService publicMediaAssetService;

    public PublicSiteContentController(
            PublicSiteContentService publicSiteContentService,
            PublicInquiryService publicInquiryService,
            PublicMediaAssetService publicMediaAssetService
    ) {
        this.publicSiteContentService = publicSiteContentService;
        this.publicInquiryService = publicInquiryService;
        this.publicMediaAssetService = publicMediaAssetService;
    }

    @GetMapping("/api/v1/public/site-content")
    public PublicSiteContentResponse getPublicSiteContent() {
        return publicSiteContentService.getPublicContent();
    }

    @GetMapping("/api/v1/public/media/{assetId}")
    public ResponseEntity<byte[]> getPublicMedia(@PathVariable UUID assetId) {
        PublicMediaAssetEntity asset = publicMediaAssetService.getAsset(assetId);
        MediaType contentType = MediaType.parseMediaType(asset.getContentType());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ZERO).mustRevalidate().cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + asset.getFileName() + "\"")
                .contentType(contentType)
                .contentLength(asset.getFileSize() == null ? asset.getContentData().length : asset.getFileSize())
                .body(asset.getContentData());
    }

    @PatchMapping("/api/v1/platform/public-site-content")
    public PublicSiteContentResponse updatePublicSiteContent(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody UpdatePublicSiteContentRequest request
    ) {
        requirePlatformRole(role);
        return publicSiteContentService.updateContent(request);
    }

    @PostMapping(value = "/api/v1/platform/public-site-content/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PublicMediaAssetResponse uploadPublicMedia(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestParam("assetKey") String assetKey,
            @RequestPart("file") MultipartFile file
    ) {
        requirePlatformRole(role);
        return publicMediaAssetService.uploadAsset(assetKey, file, email);
    }

    @PostMapping("/api/v1/public/contact-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public PublicInquiryResponse createContactRequest(@Valid @RequestBody PublicInquiryRequest request) {
        return publicInquiryService.submitContactRequest(request);
    }

    @PostMapping("/api/v1/public/support-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public PublicInquiryResponse createSupportRequest(@Valid @RequestBody PublicInquiryRequest request) {
        return publicInquiryService.submitSupportRequest(request);
    }

    @GetMapping("/api/v1/platform/public-inquiries")
    public List<PlatformPublicInquiryResponse> listPublicInquiries(
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        requirePlatformRole(role);
        return publicInquiryService.listAll();
    }

    @PatchMapping("/api/v1/platform/public-inquiries/{inquiryId}")
    public PlatformPublicInquiryResponse updatePublicInquiryStatus(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID inquiryId,
            @Valid @RequestBody UpdatePublicInquiryStatusRequest request
    ) {
        requirePlatformRole(role);
        return publicInquiryService.updateStatus(inquiryId, request);
    }

    private static void requirePlatformRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if (!PLATFORM_ROLES.contains(normalized)) {
            throw new ForbiddenException("Access denied: Requires Platform Admin role.");
        }
    }
}
