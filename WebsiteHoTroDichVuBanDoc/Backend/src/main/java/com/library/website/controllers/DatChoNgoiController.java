package com.library.website.controllers;

import com.library.website.models.DatChoNgoi;
import com.library.website.models.BanDoc;
import com.library.website.repository.DatChoNgoiRepository;
import com.library.website.repository.BanDocRepository;
import com.library.website.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/dat-cho-ngoi")
public class DatChoNgoiController {

    @Autowired
    private DatChoNgoiRepository datChoNgoiRepository;

    @Autowired
    private BanDocRepository banDocRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/")
    public ResponseEntity<?> getAllBookings() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        if ("nhanVien".equals(role)) {
            return ResponseEntity.ok(datChoNgoiRepository.findAll());
        } else {
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (bdOpt.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            return ResponseEntity.ok(datChoNgoiRepository.findByBanDocMaBanDoc(bdOpt.get().getMaBanDoc()));
        }
    }

    @PostMapping("/")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        try {
            Long maChoNgoi = ((Number) req.get("maChoNgoi")).longValue();
            Long maBanDoc = ((Number) req.get("maBanDoc")).longValue();
            String startStr = (String) req.get("thoiGianBatDau");
            String endStr = (String) req.get("thoiGianKetThuc");

            // Execute Postgres function fn_dat_cho_ngoi
            String sql = "SELECT * FROM fn_dat_cho_ngoi(?, ?, ?::timestamptz, ?::timestamptz)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, maChoNgoi, maBanDoc, startStr, endStr);

            if (rows.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("detail", "Không thể đặt chỗ (Hàm không trả về dữ liệu)"));
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(rows.get(0));
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("BUSINESS_ERROR")) {
                String cleanMsg = msg;
                int start = msg.indexOf("MESSAGE:");
                if (start != -1) {
                    cleanMsg = msg.substring(start + 8).split("DETAIL:")[0].trim().replace("\"", "");
                }
                return ResponseEntity.badRequest().body(Collections.singletonMap("detail", cleanMsg));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("detail", msg));
        }
    }
}
