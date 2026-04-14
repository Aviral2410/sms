package com.sms.onboarding.service;

import java.util.UUID;

public class PublicMediaAssetNotFoundException extends RuntimeException {

    public PublicMediaAssetNotFoundException(UUID assetId) {
        super("Public media asset not found: " + assetId);
    }
}
