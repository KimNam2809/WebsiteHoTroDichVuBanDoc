package com.library.website.controllers;

import com.library.website.models.DatTruoc;
import com.library.website.models.BanDoc;
import com.library.website.repository.DatTruocRepository;
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
@RequestMapping("/api/v1/dat-truoc")
public class DatTruocController {

    @Autowired
    private DatTruocRepository datTruocRepository;

    @Autowired
    private BanDocRepository banDocRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lấy tất cả các lượt đặt trước trong hệ thống.
     * Nhân viên thấy tất cả, bạn đọc chỉ thấy của mình.
     */
    @GetMapping("/")
    public ResponseEntity<?> getAllReservations() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        if ("nhanVien".equals(role)) {
            return ResponseEntity.ok(datTruocRepository.findAll());
        } else {
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (bdOpt.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            return ResponseEntity.ok(datTruocRepository.findByBanDocMaBanDoc(bdOpt.get().getMaBanDoc()));
        }
    }

    /**
     * Lấy chi tiết một lượt đặt trước bằng ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReservationById(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        Optional<DatTruoc> datTruocOpt = datTruocRepository.findById(id);
        if (datTruocOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy lượt đặt trước với id=" + id));
        }

        DatTruoc dt = datTruocOpt.get();
        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;

        // Chỉ nhân viên hoặc chính người đặt trước mới được phép xem
        if (!"nhanVien".equals(userDetails.getRole()) && !dt.getBanDoc().getMaBanDoc().equals(userDetails.getId())) {
            // Lấy maBanDoc thực sự của người đăng nhập
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (bdOpt.isEmpty() || !dt.getBanDoc().getMaBanDoc().equals(bdOpt.get().getMaBanDoc())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("detail", "Bạn không có quyền truy cập thông tin lượt đặt trước này."));
            }
        }

        return ResponseEntity.ok(dt);
    }

    /**
     * Tạo một lượt đặt trước mới sử dụng RPC fn_dat_truoc.
     */
    @PostMapping("/")
    public ResponseEntity<?> createReservation(@RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        try {
            Long maBanSao = ((Number) req.get("maBanSao")).longValue();
            Long maBanDoc = ((Number) req.get("maBanDoc")).longValue();

            // Nếu là bạn đọc thì phải tự đặt cho chính mình
            if (!"nhanVien".equals(role)) {
                Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
                if (bdOpt.isEmpty() || !bdOpt.get().getMaBanDoc().equals(maBanDoc)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Collections.singletonMap("detail", "Bạn đọc chỉ được phép đặt trước cho chính mình."));
                }
            }

            // Gọi RPC fn_dat_truoc
            String sql = "SELECT * FROM fn_dat_truoc(?, ?)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, maBanSao, maBanDoc);

            if (rows.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("detail", "Không thể đặt trước (Hàm không trả về dữ liệu)"));
            }

            Map<String, Object> result = rows.get(0);
            
            // Gửi thông báo đến độc giả trong luồng nền
            try {
                Number maDatTruocNum = (Number) (result.containsKey("maDatTruoc") ? result.get("maDatTruoc") : result.get("madattruoc"));
                Long maDatTruoc = maDatTruocNum != null ? maDatTruocNum.longValue() : null;
                
                String notifySql = "INSERT INTO thongbao (mabandoc, tieude, noidung, hinhthuc, trangthai, thoigiangui, thamchieu) " +
                                   "VALUES (?, 'Đặt trước thành công', ?, 'HeThong', 'chuaXem', NOW(), 'DatTruoc')";
                jdbcTemplate.update(notifySql, maBanDoc, "Bạn đã đặt trước thành công (Mã: " + maDatTruoc + "). Hệ thống sẽ thông báo khi có sách.");
            } catch (Exception notifyEx) {
                // Ignore notify errors
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(result);
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
     * Cập nhật trạng thái đặt trước.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(@PathVariable("id") Long id, @RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        Optional<DatTruoc> datTruocOpt = datTruocRepository.findById(id);
        if (datTruocOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy lượt đặt trước với id=" + id));
        }

        DatTruoc dt = datTruocOpt.get();
        boolean isStaff = "nhanVien".equals(userDetails.getRole());
        
        // Xác minh xem có phải chính bạn đọc đó không
        boolean isOwner = false;
        Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
        if (bdOpt.isPresent() && dt.getBanDoc().getMaBanDoc().equals(bdOpt.get().getMaBanDoc())) {
            isOwner = true;
        }

        if (!isStaff && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Bạn không có quyền cập nhật lượt đặt trước này."));
        }

        try {
            if (req.containsKey("trangThaiDatTruoc")) {
                dt.setTrangThaiDatTruoc((String) req.get("trangThaiDatTruoc"));
            } else if (req.containsKey("trangthaidattruoc")) {
                dt.setTrangThaiDatTruoc((String) req.get("trangthaidattruoc"));
            }

            if (req.containsKey("ghiChu")) {
                dt.setGhiChu((String) req.get("ghiChu"));
            } else if (req.containsKey("ghichu")) {
                dt.setGhiChu((String) req.get("ghichu"));
            }

            DatTruoc updated = datTruocRepository.save(dt);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Xóa lượt đặt trước.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservation(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        Optional<DatTruoc> datTruocOpt = datTruocRepository.findById(id);
        if (datTruocOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy lượt đặt trước với id=" + id));
        }

        DatTruoc dt = datTruocOpt.get();
        boolean isStaff = "nhanVien".equals(userDetails.getRole());
        boolean isOwner = false;
        Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
        if (bdOpt.isPresent() && dt.getBanDoc().getMaBanDoc().equals(bdOpt.get().getMaBanDoc())) {
            isOwner = true;
        }

        if (!isStaff && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Bạn không có quyền xóa lượt đặt trước này."));
        }

        try {
            datTruocRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }
}
