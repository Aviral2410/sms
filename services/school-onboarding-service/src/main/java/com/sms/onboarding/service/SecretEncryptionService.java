package com.sms.onboarding.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Encrypts and decrypts platform-managed secrets before they are persisted.
 */
@Service
public class SecretEncryptionService {

    private static final String AES_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_BITS = 128;
    private static final int IV_LENGTH = 12;
    private static final String ENCRYPTION_VERSION = "v1";

    private final SecureRandom secureRandom = new SecureRandom();
    private final SecretKeySpec secretKeySpec;

    public SecretEncryptionService(@Value("${app.platform-config-encryption-key}") String rawKey) {
        this.secretKeySpec = new SecretKeySpec(deriveKey(rawKey), "AES");
    }

    /**
     * Encrypts a plain-text secret for storage.
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }

        try {
            byte[] iv = new byte[IV_LENGTH];
            this.secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, this.secretKeySpec, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(encrypted, 0, payload, iv.length, encrypted.length);
            return ENCRYPTION_VERSION + ":" + Base64.getEncoder().encodeToString(payload);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to encrypt platform configuration secret.", exception);
        }
    }

    /**
     * Decrypts an encrypted secret value for internal service consumption.
     */
    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return "";
        }

        String[] parts = cipherText.split(":", 2);
        if (parts.length != 2 || !ENCRYPTION_VERSION.equals(parts[0])) {
            // Legacy support for existing plaintext values until they are rotated through the admin UI.
            return cipherText;
        }

        try {
            byte[] payload = Base64.getDecoder().decode(parts[1]);
            byte[] iv = Arrays.copyOfRange(payload, 0, IV_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(payload, IV_LENGTH, payload.length);

            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, this.secretKeySpec, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to decrypt platform configuration secret.", exception);
        }
    }

    private byte[] deriveKey(String rawKey) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest((rawKey == null ? "" : rawKey).getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to derive platform configuration encryption key.", exception);
        }
    }
}
