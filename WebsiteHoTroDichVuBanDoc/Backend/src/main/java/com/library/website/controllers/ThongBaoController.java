package com.library.website.controllers;

import com.library.website.models.ThongBao;
import com.library.website.models.BanDoc;
import com.library.website.repository.ThongBaoRepository;
import com.library.website.repository.BanDocRepository;
import com.library.website.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/thong-bao")
public class ThongBaoController {

    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @Autowired
    private BanDocRepository banDocRepository;

    /**
     * Đếm số lượng thông báo chưa đọc của người dùng hiện tại.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> countUnreadNotifications() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        if ("nhanVien".equals(role)) {
            return ResponseEntity.ok(Collections.singletonMap("count", 0));
        }

        Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
        if (bdOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.singletonMap("count", 0));
        }

        Long maBanDoc = bdOpt.get().getMaBanDoc();
        List<ThongBao> allNotifs = thongBaoRepository.findByMaBanDocOrderByThoiGianGuiDesc(maBanDoc);
        long count = allNotifs.stream()
                .filter(n -> "chuaXem".equals(n.getTrangThai()))
                .count();

        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    /**
     * Lấy danh sách thông báo.
     * Nhân viên có thể lọc qua maBanDoc query parameter. Bạn đọc chỉ được xem của chính mình.
     */
    @GetMapping("/")
    public ResponseEntity<?> getNotifications(
            @RequestParam(value = "maBanDoc", required = false) Long filterMaBanDoc) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        if ("nhanVien".equals(role)) {
            if (filterMaBanDoc != null) {
                return ResponseEntity.ok(thongBaoRepository.findByMaBanDocOrderByThoiGianGuiDesc(filterMaBanDoc));
            }
            return ResponseEntity.ok(thongBaoRepository.findAll());
        } else {
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (bdOpt.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            return ResponseEntity.ok(thongBaoRepository.findByMaBanDocOrderByThoiGianGuiDesc(bdOpt.get().getMaBanDoc()));
        }
    }

    /**
     * Lấy chi tiết thông báo theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getNotificationById(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        Optional<ThongBao> thongBaoOpt = thongBaoRepository.findById(id);
        if (thongBaoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy thông báo ID " + id));
        }

        ThongBao tb = thongBaoOpt.get();
        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;

        // Cho phép nhân viên hoặc chính bạn đọc nhận thông báo được xem
        if (!"nhanVien".equals(userDetails.getRole())) {
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (bdOpt.isEmpty() || !tb.getMaBanDoc().equals(bdOpt.get().getMaBanDoc())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("detail", "Bạn không có quyền truy cập thông báo này."));
            }
        }

        return ResponseEntity.ok(tb);
    }

    /**
     * Đánh dấu thông báo đã đọc.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        Optional<ThongBao> thongBaoOpt = thongBaoRepository.findById(id);
        if (thongBaoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy thông báo"));
        }

        ThongBao tb = thongBaoOpt.get();
        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;

        // Chỉ chủ thông báo hoặc nhân viên được mark read
        if (!"nhanVien".equals(userDetails.getRole())) {
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (bdOpt.isEmpty() || !tb.getMaBanDoc().equals(bdOpt.get().getMaBanDoc())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("detail", "Bạn không có quyền cập nhật thông báo này."));
            }
        }

        tb.setTrangThai("daXem");
        ThongBao updated = thongBaoRepository.save(tb);
        return ResponseEntity.ok(updated);
    }

    /**
     * Tạo thông báo mới (Chỉ nhân viên).
     */
    @PostMapping("/")
    public ResponseEntity<?> createNotification(@RequestBody ThongBao thongBao) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Chỉ nhân viên mới được phép tạo thông báo."));
        }

        try {
            if (thongBao.getThoiGianGui() == null) {
                thongBao.setThoiGianGui(java.time.LocalDateTime.now());
            }
            if (thongBao.getTrangThai() == null) {
                thongBao.setTrangThai("chuaXem");
            }
            ThongBao saved = thongBaoRepository.save(thongBao);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Xóa thông báo (Chỉ nhân viên).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("detail", "Chỉ nhân viên mới được phép xóa thông báo."));
        }

        if (!thongBaoRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("detail", "Không tìm thấy thông báo"));
        }

        try {
            thongBaoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }
}
