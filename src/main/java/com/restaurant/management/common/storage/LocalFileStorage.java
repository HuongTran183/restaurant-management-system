package com.restaurant.management.common.storage;

import com.restaurant.management.common.error.StorageOperationException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalFileStorage {

    private final StorageProperties storageProperties;

    public LocalFileStorage(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    public StoredObject storeMultipart(MultipartFile file, String folder, String filenamePrefix) {
        try {
            String extension = extractSafeExtension(file.getOriginalFilename());
            String storedFileName = normalizeFilename(filenamePrefix + "-" + UUID.randomUUID() + extension);
            Path filePath = preparePath(folder, storedFileName);
            Files.write(filePath, file.getBytes(), StandardOpenOption.CREATE_NEW);
            String contentType = file.getContentType() == null || file.getContentType().isBlank()
                    ? "application/octet-stream"
                    : file.getContentType();
            return new StoredObject(storedFileName, filePath.toString(), contentType);
        } catch (IOException exception) {
            throw new StorageOperationException("Could not store multipart file", exception);
        }
    }

    public StoredObject storeBytes(byte[] content, String folder, String filename, String contentType) {
        try {
            String storedFileName = normalizeFilename(filename);
            Path filePath = preparePath(folder, storedFileName);
            Files.write(filePath, content, StandardOpenOption.CREATE_NEW);
            String resolvedContentType = contentType == null || contentType.isBlank()
                    ? "application/octet-stream"
                    : contentType;
            return new StoredObject(storedFileName, filePath.toString(), resolvedContentType);
        } catch (IOException exception) {
            throw new StorageOperationException("Could not store binary file", exception);
        }
    }

    private Path preparePath(String folder, String filename) throws IOException {
        Path rootPath = Path.of(storageProperties.getRoot()).toAbsolutePath().normalize();
        Path targetDirectory = rootPath.resolve(normalizeFolder(folder)).normalize();
        if (!targetDirectory.startsWith(rootPath)) {
            throw new StorageOperationException("Invalid storage folder");
        }

        Files.createDirectories(targetDirectory);
        Path targetFile = targetDirectory.resolve(filename).normalize();
        if (!targetFile.startsWith(targetDirectory)) {
            throw new StorageOperationException("Invalid storage path");
        }

        return targetFile;
    }

    private String normalizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            throw new StorageOperationException("Storage folder must not be blank");
        }

        String normalized = folder.replace('\\', '/');
        if (normalized.contains("..")) {
            throw new StorageOperationException("Storage folder must not contain parent traversal");
        }

        return normalized.replaceAll("[^A-Za-z0-9/_-]", "-");
    }

    private String normalizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new StorageOperationException("Storage filename must not be blank");
        }

        final String candidate;
        try {
            candidate = Path.of(filename).getFileName().toString();
        } catch (InvalidPathException exception) {
            throw new StorageOperationException("Invalid storage filename", exception);
        }

        if (candidate.isBlank()) {
            throw new StorageOperationException("Storage filename must not be blank");
        }

        int extensionStart = candidate.lastIndexOf('.');
        String baseName = extensionStart > 0 ? candidate.substring(0, extensionStart) : candidate;
        String extension = extensionStart > 0 ? candidate.substring(extensionStart) : "";

        String sanitizedBaseName = baseName.replaceAll("[^A-Za-z0-9._-]", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^[.-]+|[.-]+$", "");
        if (sanitizedBaseName.isBlank()) {
            sanitizedBaseName = UUID.randomUUID().toString();
        }

        String sanitizedExtension = extension.matches("\\.[A-Za-z0-9]{1,10}")
                ? extension.toLowerCase(Locale.ROOT)
                : "";
        return sanitizedBaseName + sanitizedExtension;
    }

    private String extractSafeExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return ".bin";
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        return extension.matches("\\.[A-Za-z0-9]{1,10}")
                ? extension.toLowerCase(Locale.ROOT)
                : ".bin";
    }
}
