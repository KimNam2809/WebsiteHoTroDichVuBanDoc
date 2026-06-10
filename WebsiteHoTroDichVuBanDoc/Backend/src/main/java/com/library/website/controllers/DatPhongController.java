package com.library.website.controllers;

import com.library.website.models.DatPhong;
import com.library.website.models.NhanVien;
import com.library.website.repository.DatPhongRepository;
import com.library.website.repository.NhanVienRepository;
import com.library.website.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/dat-phong")
public class DatPhongController {

    @Autowired
    private DatPhongRepository datPhongRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lấy tất cả các lượt đặt phòng trong hệ thống.
     * Nhân viên thấy tất cả, bạn đọc chỉ thấy của mình (lọc qua số điện thoại đăng ký của họ).
     */
    @GetMapping("/")
    public ResponseEntity<?> getAllBookings() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        if ("nhanVien".equals(role)) {
            return ResponseEntity.ok(datPhongRepository.findAll());
        } else {
            String soDienThoai = userDetails.getSoDienThoai();
            if (soDienThoai == null || soDienThoai.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            return ResponseEntity.ok(datPhongRepository.findBySoDienThoai(soDienThoai));
        }
    }

    /**
     * Lấy chi tiết một lượt đặt phòng bằng ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        Optional<DatPhong> datPhongOpt = datPhongRepository.findById(id);
        if (datPhongOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy lượt đặt phòng với id=" + id));
        }

        DatPhong dp = datPhongOpt.get();
        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;

        // Chỉ nhân viên hoặc chính người đặt phòng (so khớp số điện thoại) được phép xem
        if (!"nhanVien".equals(userDetails.getRole()) && !dp.getSoDienThoai().equals(userDetails.getSoDienThoai())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Bạn không có quyền truy cập thông tin lượt đặt phòng này."));
        }

        return ResponseEntity.ok(dp);
    }

    /**
     * Tạo một lượt đặt phòng học nhóm mới sử dụng RPC fn_dat_phong.
     */
    @PostMapping("/")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        try {
            Long maPhong = ((Number) req.get("maPhong")).longValue();
            String nguoiToChuc = (String) req.get("nguoiToChuc");
            String soDienThoai = (String) req.get("soDienThoai");
            String thoiGianBatDau = (String) req.get("thoiGianBatDau");
            String thoiGianKetThuc = (String) req.get("thoiGianKetThuc");
            String mucDichSuDung = (String) req.get("mucDichSuDung");
            Integer soNguoiThamDuDuKien = req.containsKey("soNguoiThamDuDuKien") 
                    ? ((Number) req.get("soNguoiThamDuDuKien")).intValue() : 0;

            String sql = "SELECT * FROM fn_dat_phong(?, ?, ?, ?::timestamptz, ?::timestamptz, ?, ?)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, 
                    maPhong, nguoiToChuc, soDienThoai, thoiGianBatDau, thoiGianKetThuc, mucDichSuDung, soNguoiThamDuDuKien);

            if (rows.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("detail", "Không thể đặt phòng (Hàm không trả về dữ liệu)"));
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

    /**
     * Cập nhật trạng thái đặt phòng (nhân viên hủy hoặc cập nhật trực tiếp).
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable("id") Long id, @RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        Optional<DatPhong> datPhongOpt = datPhongRepository.findById(id);
        if (datPhongOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy lượt đặt phòng với id=" + id));
        }

        DatPhong dp = datPhongOpt.get();
        // Bạn đọc chỉ tự hủy lượt đặt của chính mình, nhân viên hủy cho bất kỳ ai
        boolean isStaff = "nhanVien".equals(userDetails.getRole());
        boolean isOwner = dp.getSoDienThoai().equals(userDetails.getSoDienThoai());

        if (!isStaff && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Bạn không có quyền cập nhật lượt đặt phòng này."));
        }

        try {
            if (req.containsKey("trangThai")) {
                dp.setTrangThai((String) req.get("trangThai"));
            }
            if (req.containsKey("maNhanVien")) {
                if (!isStaff) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Collections.singletonMap("detail", "Chỉ nhân viên mới được cập nhật mã nhân viên duyệt."));
                }
                dp.setMaNhanVien(((Number) req.get("maNhanVien")).longValue());
            }

            DatPhong updated = datPhongRepository.save(dp);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Xóa một lượt đặt phòng (Hành chính - Chỉ nhân viên).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Chỉ nhân viên mới được phép xóa lượt đặt phòng."));
        }

        if (!datPhongRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy lượt đặt phòng với id=" + id));
        }

        try {
            datPhongRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Duyệt đặt phòng (Nhân viên duyệt sử dụng RPC fn_duyet_dat_phong).
     */
    @PostMapping("/{id}/duyet")
    public ResponseEntity<?> approveBooking(@PathVariable("id") Long id, @RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Chỉ nhân viên mới được phép duyệt đặt phòng."));
        }

        try {
            Long maNhanVien = null;
            if (req.containsKey("maNhanVien")) {
                maNhanVien = ((Number) req.get("maNhanVien")).longValue();
            } else {
                Optional<NhanVien> nvOpt = nhanVienRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
                if (nvOpt.isPresent()) {
                    maNhanVien = nvOpt.get().getMaNhanVien();
                }
            }

            if (maNhanVien == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("detail", "Thiếu thông tin mã nhân viên duyệt."));
            }

            String sql = "SELECT * FROM fn_duyet_dat_phong(?, ?)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id, maNhanVien);

            if (rows.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("detail", "Không thể duyệt phòng (Hàm không trả về dữ liệu)"));
            }

            return ResponseEntity.ok(rows.get(0));
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
