package com.sms.onboarding.service;

import static com.sms.onboarding.api.PublicSiteContentDtos.PublicMediaAssetResponse;

import com.sms.onboarding.domain.PublicMediaAssetEntity;
import com.sms.onboarding.repository.PublicMediaAssetRepository;
import java.io.IOException;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PublicMediaAssetService {

    private static final long MAX_FILE_SIZE_BYTES = 8L * 1024L * 1024L;

    private final PublicMediaAssetRepository repository;

    public PublicMediaAssetService(PublicMediaAssetRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PublicMediaAssetResponse uploadAsset(String assetKey, MultipartFile file, String createdBy) {
        String normalizedAssetKey = normalizeAssetKey(assetKey);
        validateFile(file);

        PublicMediaAssetEntity entity = repository.findByAssetKey(normalizedAssetKey)
                .orElseGet(() -> {
                    PublicMediaAssetEntity fresh = new PublicMediaAssetEntity();
                    fresh.setAssetId(UUID.randomUUID());
                    fresh.setAssetKey(normalizedAssetKey);
                    return fresh;
                });

        entity.setFileName(StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload.bin" : file.getOriginalFilename()));
        entity.setContentType(file.getContentType());
        entity.setFileSize(file.getSize());
        entity.setCreatedBy(createdBy == null || createdBy.isBlank() ? "platform-admin" : createdBy.trim());
        entity.setContentData(readBytes(file));

        PublicMediaAssetEntity saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PublicMediaAssetEntity getAsset(UUID assetId) {
        return repository.findById(assetId).orElseThrow(() -> new PublicMediaAssetNotFoundException(assetId));
    }

    private PublicMediaAssetResponse toResponse(PublicMediaAssetEntity entity) {
        return new PublicMediaAssetResponse(
                entity.getAssetId(),
                entity.getAssetKey(),
                entity.getFileName(),
                entity.getContentType(),
                entity.getFileSize(),
                buildPublicUrl(entity.getAssetId()),
                entity.getUpdatedAt() == null ? Instant.now() : entity.getUpdatedAt()
        );
    }

    private String buildPublicUrl(UUID assetId) {
        return "/api/v1/public/media/" + assetId;
    }

    private String normalizeAssetKey(String rawAssetKey) {
        if (rawAssetKey == null || rawAssetKey.isBlank()) {
            throw new IllegalArgumentException("Asset key is required.");
        }

        String normalized = rawAssetKey.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]+", "-");
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Asset key is invalid.");
        }
        if (normalized.length() > 120) {
            throw new IllegalArgumentException("Asset key must be 120 characters or fewer.");
        }
        return normalized;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("An image file is required.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Image uploads must be 8 MB or smaller.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Only image uploads are supported for the public site.");
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read the uploaded image.", ex);
        }
    }
}
