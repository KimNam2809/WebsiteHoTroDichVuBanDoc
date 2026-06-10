package com.library.website.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String CONFIG_FILE_PATH = "data/settings.json";

    private Map<String, Object> getDefaultConfig() {
        Map<String, Object> defaultMap = new HashMap<>();

        Map<String, Object> general = new HashMap<>();
        general.put("libraryName", "Smart Lib ĐN");
        general.put("emailContact", "contact@thuvien.danang.gov.vn");
        general.put("workingHours", "7:30 - 20:00");

        Map<String, Object> loans = new HashMap<>();
        loans.put("maxBooksPerUser", 5);
        loans.put("loanDurationDays", 14);
        loans.put("allowRenewal", true);
        loans.put("renewalDays", 7);

        Map<String, Object> fines = new HashMap<>();
        fines.put("overdueFinePerDay", 5000);
        fines.put("lostBookMultiplier", 2.0);

        defaultMap.put("general", general);
        defaultMap.put("loans", loans);
        defaultMap.put("fines", fines);

        return defaultMap;
    }

    @GetMapping("/")
    public ResponseEntity<?> getSystemConfig() {
        File file = new File(CONFIG_FILE_PATH);
        if (!file.exists()) {
            try {
                Files.createDirectories(Paths.get("data"));
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, getDefaultConfig());
                return ResponseEntity.ok(getDefaultConfig());
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(e.getMessage());
            }
        }

        try {
            Map<?, ?> config = objectMapper.readValue(file, Map.class);
            return ResponseEntity.ok(config);
        } catch (IOException e) {
            return ResponseEntity.ok(getDefaultConfig());
        }
    }

    @PutMapping("/")
    public ResponseEntity<?> updateSystemConfig(@RequestBody Map<String, Object> newConfig) {
        try {
            Files.createDirectories(Paths.get("data"));
            File file = new File(CONFIG_FILE_PATH);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, newConfig);
            return ResponseEntity.ok(newConfig);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
