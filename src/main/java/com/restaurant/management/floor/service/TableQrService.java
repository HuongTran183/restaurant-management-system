package com.restaurant.management.floor.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.error.StorageOperationException;
import com.restaurant.management.common.storage.LocalFileStorage;
import com.restaurant.management.common.storage.StoredObject;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableQr;
import com.restaurant.management.floor.dto.GenerateTableQrRequest;
import com.restaurant.management.floor.dto.PublicQrTableResponse;
import com.restaurant.management.floor.dto.TableQrResponse;
import com.restaurant.management.floor.repository.TableQrRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TableQrService {

    private final TableQrRepository tableQrRepository;
    private final DiningTableService diningTableService;
    private final TableSessionService tableSessionService;
    private final LocalFileStorage localFileStorage;
    private final QrProperties qrProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public TableQrService(
            TableQrRepository tableQrRepository,
            DiningTableService diningTableService,
            TableSessionService tableSessionService,
            LocalFileStorage localFileStorage,
            QrProperties qrProperties
    ) {
        this.tableQrRepository = tableQrRepository;
        this.diningTableService = diningTableService;
        this.tableSessionService = tableSessionService;
        this.localFileStorage = localFileStorage;
        this.qrProperties = qrProperties;
    }

    @Transactional
    public TableQrResponse generate(GenerateTableQrRequest request) {
        DiningTable diningTable = diningTableService.findTable(request.diningTableId());
        TableQr tableQr = tableQrRepository.findByDiningTableId(diningTable.getId()).orElseGet(TableQr::new);
        tableQr.setDiningTable(diningTable);
        tableQr.setToken(nextToken());
        tableQr.setLabel(request.label() == null || request.label().isBlank() ? diningTable.getName() : request.label());
        tableQr.setExpiresAt(request.expiresAt());
        tableQr.setActive(true);

        String landingUrl = buildLandingUrl(tableQr.getToken());
        StoredObject storedObject = localFileStorage.storeBytes(
                createQrCode(landingUrl),
                "qr-codes",
                diningTable.getCode() + "-" + tableQr.getToken() + ".png",
                "image/png"
        );
        tableQr.setImagePath(storedObject.path());
        TableQr saved = tableQrRepository.save(tableQr);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TableQrResponse getByTable(Long diningTableId) {
        TableQr tableQr = tableQrRepository.findByDiningTableId(diningTableId)
                .orElseThrow(() -> new ResourceNotFoundException("QR not found for table: " + diningTableId));
        return toResponse(tableQr);
    }

    @Transactional(readOnly = true)
    public PublicQrTableResponse resolvePublic(String token) {
        TableQr tableQr = findActiveByToken(token);
        return new PublicQrTableResponse(
                tableQr.getDiningTable().getId(),
                tableQr.getDiningTable().getCode(),
                tableQr.getDiningTable().getName(),
                tableQr.getDiningTable().getArea().getName(),
                tableQr.getDiningTable().getStatus(),
                tableSessionService.findOpenSessionByTableId(tableQr.getDiningTable().getId())
                        .map(session -> session.getId())
                        .orElse(null),
                tableQr.getToken(),
                tableQr.isActive(),
                tableQr.getExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public TableQr findActiveByToken(String token) {
        TableQr tableQr = tableQrRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("QR not found: " + token));
        if (!tableQr.isActive()) {
            throw new BusinessConflictException("QR is not active");
        }
        if (tableQr.getExpiresAt() != null && tableQr.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessConflictException("QR has expired");
        }
        if (!tableQr.getDiningTable().isActive()) {
            throw new BusinessConflictException("Dining table is inactive");
        }
        return tableQr;
    }

    private TableQrResponse toResponse(TableQr tableQr) {
        return new TableQrResponse(
                tableQr.getId(),
                tableQr.getDiningTable().getId(),
                tableQr.getDiningTable().getCode(),
                tableQr.getToken(),
                tableQr.getLabel(),
                buildLandingUrl(tableQr.getToken()),
                tableQr.getImagePath(),
                tableQr.getExpiresAt(),
                tableQr.isActive()
        );
    }

    private byte[] createQrCode(String landingUrl) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(landingUrl, BarcodeFormat.QR_CODE, 360, 360);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(MatrixToImageWriter.toBufferedImage(matrix), "png", outputStream);
            return outputStream.toByteArray();
        } catch (WriterException | IOException exception) {
            throw new StorageOperationException("Could not generate QR code", exception);
        }
    }

    private String buildLandingUrl(String token) {
        return qrProperties.getPublicBaseUrl().replaceAll("/$", "") + "/" + token;
    }

    private String nextToken() {
        byte[] buffer = new byte[24];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }
}
