package com.library.website.controllers;

import com.library.website.dto.UserProfileResponse;
import com.library.website.models.*;
import com.library.website.repository.*;
import com.library.website.security.JwtAuthenticationFilter;
import com.library.website.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private BanDocRepository banDocRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private TheBanDocRepository theBanDocRepository;

    @Autowired
    private YeuCauTheRepository yeuCauTheRepository;

    /**
     * API Đăng nhập nhận OAuth2 Form Data giống hệt FastAPI
     */
    @PostMapping(value = "/auth/login", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> login(@RequestParam("username") String username,
                                   @RequestParam("password") String password) {
        try {
            Optional<String> tokenOpt = authService.login(username, password);
            if (tokenOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("detail", "Tên đăng nhập hoặc mật khẩu không chính xác"));
            }

            Map<String, String> response = new HashMap<>();
            response.put("access_token", tokenOpt.get());
            response.put("token_type", "bearer");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * API Lấy hồ sơ cá nhân hiện tại
     */
    @GetMapping({"/nguoi-dung/me", "/nguoi-dung/profile"})
    public ResponseEntity<?> getMyProfile() {
        // Đọc Principal từ SecurityContext
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        NguoiDung user = nguoiDungRepository.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Tài khoản không tồn tại.");
        }

        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getMaNguoiDung());
        response.setManguoidung(user.getMaNguoiDung());
        response.setEmail(user.getEmail());
        response.setVaitro(user.getVaiTro());
        response.setSodienthoai(user.getSoDienThoai());
        response.setAnhdaidien(null);

        if ("nhanVien".equals(user.getVaiTro())) {
            Optional<NhanVien> nvOpt = nhanVienRepository.findByNguoiDungMaNguoiDung(user.getMaNguoiDung());
            if (nvOpt.isPresent()) {
                NhanVien nv = nvOpt.get();
                response.setHoten(nv.getHoTen());
                response.setMaNhanVien(nv.getMaNhanVien());
                response.setManhanviennoibo(nv.getMaNhanVienNoiBo());
                response.setPhongban(nv.getPhongBan());
                response.setChucvu(nv.getChucVu());
                response.setNgaytuyendung(nv.getNgayTuyenDung());
            } else {
                response.setHoten("Nhân viên chưa cập nhật");
            }
        } else {
            // Bạn đọc
            Optional<BanDoc> bdOpt = banDocRepository.findByNguoiDungMaNguoiDung(user.getMaNguoiDung());
            if (bdOpt.isPresent()) {
                BanDoc bd = bdOpt.get();
                response.setHoten(bd.getHoTen());
                response.setMaBanDoc(bd.getMaBanDoc());

                // Lấy thông tin thẻ nếu có
                List<TheBanDoc> cards = theBanDocRepository.findByBanDocMaBanDoc(bd.getMaBanDoc());
                if (!cards.isEmpty()) {
                    // Lấy thẻ active hoặc thẻ đầu tiên
                    TheBanDoc activeCard = cards.stream()
                            .filter(TheBanDoc::getTrangThaiThe)
                            .findFirst()
                            .orElse(cards.get(0));
                    response.setSothe(activeCard.getSoThe());
                    response.setTenthe(activeCard.getLoaiThe().getTenThe());
                    response.setNgayhethan(activeCard.getNgayHetHan());
                    response.setTrangthaithe(activeCard.getTrangThaiThe() ? "Hoạt động" : "Khóa");
                    response.setTailieumuontoida(activeCard.getLoaiThe().getTaiLieuMuonToiDa());
                }

                // Lấy yêu cầu mới nhất để hiển thị trạng thái chờ duyệt
                Optional<YeuCauThe> reqOpt = yeuCauTheRepository.findFirstByBanDocMaBanDocOrderByThoiGianBatDauDesc(bd.getMaBanDoc());
                if (reqOpt.isPresent()) {
                    response.setMa_yeu_cau_moi_nhat(reqOpt.get().getMaYeuCauThe());
                    response.setTrang_thai_yeu_cau(reqOpt.get().getTrangThaiQuyTrinh());
                }
            } else {
                // Độc giả chưa điền hồ sơ làm thẻ
                response.setHoten(user.getTenDangNhap());
            }
        }

        return ResponseEntity.ok(response);
    }
}
