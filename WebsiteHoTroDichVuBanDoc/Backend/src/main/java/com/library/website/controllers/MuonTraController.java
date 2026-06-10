package com.library.website.controllers;

import com.library.website.dto.*;
import com.library.website.models.BanDoc;
import com.library.website.models.MuonTra;
import com.library.website.models.NhanVien;
import com.library.website.repository.BanDocRepository;
import com.library.website.repository.NhanVienRepository;
import com.library.website.security.JwtAuthenticationFilter;
import com.library.website.services.MuonTraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/muon-tra")
public class MuonTraController {

    @Autowired
    private MuonTraService muonTraService;

    @Autowired
    private BanDocRepository banDocRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * API Lấy lịch sử mượn trả (role-based)
     */
    @GetMapping("/danh-sach-chi-tiet-muon-tra")
    public ResponseEntity<?> getLoanHistory(
            @RequestParam(value = "trang_thai", required = false) String trangThai,
            @RequestParam(value = "phan_loai", required = false) String phanLoai) {

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        String role = userDetails.getRole();

        try {
            String sql = "SELECT m.mamuontra, m.mabansao, m.thoigianmuon, m.ngaytra, m.ngaytrathucte, m.trangthaimuon, m.tienphat, m.manhanvien, " +
                    "b.mabansaonoibo, t.tentacpham, t.anhbia, bd.hoten, bd.thongtinbosung " +
                    "FROM muontra m " +
                    "JOIN bansao b ON m.mabansao = b.mabansao " +
                    "JOIN tacpham t ON b.matacpham = t.matacpham " +
                    "JOIN bandoc bd ON m.mabandoc = bd.mabandoc WHERE 1=1";

            List<Object> params = new ArrayList<>();

            if (!"nhanVien".equals(role)) {
                // Độc giả chỉ xem được của chính mình
                Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
                if (bdOpt.isEmpty()) {
                    return ResponseEntity.ok(Collections.emptyList());
                }
                sql += " AND m.mabandoc = ?";
                params.add(bdOpt.get().getMaBanDoc());
            }

            if ("choXacNhan".equals(phanLoai)) {
                sql += " AND m.trangthaimuon = 'daMuon' AND m.manhanvien IS NULL";
            } else if ("dangMuon".equals(phanLoai)) {
                sql += " AND m.trangthaimuon = 'daMuon' AND m.manhanvien IS NOT NULL";
            } else if (trangThai != null && !trangThai.isEmpty()) {
                sql += " AND m.trangthaimuon = ?";
                params.add(trangThai);
            }

            sql += " ORDER BY m.thoigianmuon DESC";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
            List<MuonTraItemResponse> response = new ArrayList<>();

            for (Map<String, Object> row : rows) {
                MuonTraItemResponse item = new MuonTraItemResponse();
                item.setMaMuonTra((Long) row.get("mamuontra"));
                item.setMaBanSao((Long) row.get("mabansao"));
                
                Timestamp tm = (Timestamp) row.get("thoigianmuon");
                if (tm != null) item.setNgayMuon(tm.toLocalDateTime());

                java.sql.Date d1 = (java.sql.Date) row.get("ngaytra");
                if (d1 != null) item.setNgayTraDuKien(d1.toLocalDate());

                Timestamp tm2 = (Timestamp) row.get("ngaytrathucte");
                if (tm2 != null) item.setNgayTraThucTe(tm2.toLocalDateTime());

                item.setTrangThai((String) row.get("trangthaimuon"));
                item.setTienPhat((BigDecimal) row.get("tienphat"));
                item.setMaBanSaoNoiBo((String) row.get("mabansaonoibo"));
                item.setTenTacPham((String) row.get("tentacpham"));
                item.setAnhBia((String) row.get("anhbia"));
                item.setNguoiMuon((String) row.get("hoten"));

                response.add(item);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * API Tạo một lượt mượn (độc giả đăng ký mượn)
     */
    @PostMapping("/")
    public ResponseEntity<?> createLoan(@RequestBody MuonTraCreate req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;

        try {
            Long finalNhanVienId = null;

            if ("nhanVien".equals(userDetails.getRole())) {
                Optional<NhanVien> nvOpt = nhanVienRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
                if (nvOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nhân viên chưa có hồ sơ.");
                }
                finalNhanVienId = nvOpt.get().getMaNhanVien();
            } else {
                // Bạn đọc chỉ tự tạo cho chính mình
                Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
                if (bdOpt.isEmpty() || !bdOpt.get().getMaBanDoc().equals(req.getMaBanDoc())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn đọc chỉ được tự đăng ký mượn cho chính mình.");
                }
            }

            Map<String, Object> result = muonTraService.muonTaiLieu(
                    req.getMaBanSao(),
                    req.getMaBanDoc(),
                    finalNhanVienId,
                    req.getNgayTra()
            );

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * API Trả sách (Nhân viên xác nhận)
     */
    @PostMapping("/{id}/tra-sach")
    public ResponseEntity<?> returnBook(@PathVariable("id") Long id, @RequestBody MuonTraTraSach req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới có quyền trả sách.");
        }

        try {
            Optional<NhanVien> nvOpt = nhanVienRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            if (nvOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nhân viên không có hồ sơ hợp lệ.");
            }
            Long staffId = nvOpt.get().getMaNhanVien();

            Map<String, Object> result = muonTraService.traSach(id, staffId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * API Cập nhật phiếu mượn (Duyệt mượn sách)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLoan(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới có quyền cập nhật phiếu mượn.");
        }

        try {
            String trangThaiMuon = (String) (body.containsKey("trangThaiMuon") ? body.get("trangThaiMuon") : body.get("trangthaimuon"));
            Number maNhanVien = (Number) (body.containsKey("maNhanVien") ? body.get("maNhanVien") : body.get("manhanvien"));

            String sql = "UPDATE muontra SET trangthaimuon = ?, manhanvien = ?, updated_at = NOW() WHERE mamuontra = ?";
            int updated = jdbcTemplate.update(sql, 
                trangThaiMuon != null ? trangThaiMuon : "daMuon", 
                maNhanVien != null ? maNhanVien.longValue() : null, 
                id
            );

            if (updated == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy phiếu mượn.");
            }

            // Gửi thông báo đến độc giả trong luồng nền
            try {
                Long maBanDoc = jdbcTemplate.queryForObject("SELECT mabandoc FROM muontra WHERE mamuontra = ?", Long.class, id);
                if (maBanDoc != null) {
                    String notifySql = "INSERT INTO thongbao (mabandoc, tieude, noidung, hinhthuc, trangthai, thoigiangui, thamchieu) " +
                                       "VALUES (?, 'Thông báo mượn tài liệu', 'Phiếu mượn #' || ? || ' đã được phê duyệt.', 'HeThong', 'chuaXem', NOW(), 'MuonTra')";
                    jdbcTemplate.update(notifySql, maBanDoc, id);
                }
            } catch (Exception notifyEx) {
                // Ignore notify errors
            }

            return ResponseEntity.ok(Collections.singletonMap("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("detail", e.getMessage()));
        }
    }
}
