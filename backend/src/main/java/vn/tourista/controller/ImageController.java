package vn.tourista.controller;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST API for image upload via Cloudinary.
 * Accessible only by ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/images")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ImageController {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * POST /api/admin/images/upload
     * Upload a single image file.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File is required"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Only JPEG, PNG, GIF, WebP, SVG files are allowed"));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "File size must be less than 10MB"));
        }

        try {
            String publicId = "tourista/" + UUID.randomUUID();
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                            "public_id", publicId,
                            "folder", "tourista",
                            "resource_type", "image"
                    )
            );

            String url = (String) result.get("secure_url");
            String publicIdFromCloud = (String) result.get("public_id");

            return ResponseEntity.ok(Map.of(
                    "url", url,
                    "publicId", publicIdFromCloud,
                    "format", result.get("format"),
                    "width", result.get("width"),
                    "height", result.get("height")
            ));

        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/images/upload-multiple
     * Upload multiple image files at once (max 10).
     */
    @PostMapping("/upload-multiple")
    public ResponseEntity<?> uploadMultiple(@RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "At least one file is required"));
        }

        if (files.size() > 10) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Maximum 10 files allowed at once"));
        }

        List<Map<String, Object>> results = files.stream()
                .map(file -> {
                    try {
                        if (file.isEmpty()) return null;
                        String contentType = file.getContentType();
                        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
                            return Map.<String, Object>of("error", "Invalid type: " + file.getOriginalFilename());
                        }
                        if (file.getSize() > MAX_FILE_SIZE) {
                            return Map.<String, Object>of("error", "File too large: " + file.getOriginalFilename());
                        }

                        String publicId = "tourista/" + UUID.randomUUID();
                        Map<?, ?> result = cloudinary.uploader().upload(
                                file.getBytes(),
                                Map.of(
                                        "public_id", publicId,
                                        "folder", "tourista",
                                        "resource_type", "image"
                                )
                        );

                        return Map.<String, Object>of(
                                "url", (String) result.get("secure_url"),
                                "publicId", (String) result.get("public_id"),
                                "format", result.get("format"),
                                "width", result.get("width"),
                                "height", result.get("height"),
                                "filename", file.getOriginalFilename()
                        );
                    } catch (Exception e) {
                        log.error("Failed to upload: {}", file.getOriginalFilename(), e);
                        return Map.<String, Object>of("error", e.getMessage(), "filename", file.getOriginalFilename());
                    }
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> successful = results.stream()
                .filter(r -> r != null && !r.containsKey("error"))
                .toList();
        List<Map<String, Object>> failed = results.stream()
                .filter(r -> r != null && r.containsKey("error"))
                .toList();

        return ResponseEntity.ok(Map.of(
                "uploaded", successful,
                "failed", failed,
                "totalUploaded", successful.size()
        ));
    }

    /**
     * DELETE /api/admin/images/{publicId}
     * Delete an image from Cloudinary.
     */
    @DeleteMapping("/{publicId}")
    public ResponseEntity<?> deleteImage(@PathVariable String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "publicId is required"));
        }

        try {
            cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image"));
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } catch (IOException e) {
            log.error("Failed to delete image: {}", publicId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Delete failed: " + e.getMessage()));
        }
    }
}
