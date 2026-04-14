package com.restaurant.management.common.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class LocalFileStorageTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldKeepStoredMultipartWithinConfiguredRoot() throws Exception {
        StorageProperties properties = new StorageProperties();
        properties.setRoot(tempDir.toString());
        LocalFileStorage storage = new LocalFileStorage(properties);

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "image.\\..\\..\\payload",
                "image/png",
                "demo".getBytes()
        );

        StoredObject storedObject = storage.storeMultipart(multipartFile, "menu-items", "pho-bo");

        Path storedPath = Path.of(storedObject.path()).toAbsolutePath().normalize();
        assertThat(storedPath).startsWith(tempDir.toAbsolutePath().normalize());
        assertThat(Files.exists(storedPath)).isTrue();
        assertThat(storedObject.filename()).endsWith(".bin");
    }
}
