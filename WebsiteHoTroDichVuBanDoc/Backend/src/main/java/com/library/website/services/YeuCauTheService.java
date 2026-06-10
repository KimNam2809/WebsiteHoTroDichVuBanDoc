package com.library.website.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.library.website.models.*;
import com.library.website.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class YeuCauTheService {

    @Autowired
    private YeuCauTheRepository yeuCauTheRepository;

    @Autowired
    private BanDocRepository banDocRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private TheBanDocRepository theBanDocRepository;

    @Autowired
    private LoaiTheRepository loaiTheRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Xác thực thông tin công dân giả lập (eKYC)
     */
    public Map<String, Object> performVerification(String cccd, String hoTen, String ngaySinh, String sdt, String filename) {
        double faceScore = 0.98;
        if (filename.toLowerCase().contains("fail")) {
            faceScore = 0.65;
        } else if (filename.toLowerCase().contains("fake")) {
            faceScore = 0.30;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("face_match_score", faceScore);

        String riskLevel = "LOW";
        String status = "MATCH";

        if (faceScore < 0.85) {
            riskLevel = "MEDIUM";
            status = "MISMATCH";
        }
        if (faceScore < 0.50) {
            riskLevel = "HIGH";
            status = "MISMATCH";
        }

        result.put("risk_level", riskLevel);
        result.put("status", status);
        return result;
    }

    /**
     * Đảm bảo hồ sơ bạn đọc tồn tại trong bảng public.bandoc
     */
    private BanDoc ensureReaderExists(Long userId, Map<String, Object> info) {
        Optional<BanDoc> banDocOpt = banDocRepository.findByNguoiDungMaNguoiDung(userId);
        BanDoc banDoc;
        
        if (banDocOpt.isPresent()) {
            banDoc = banDocOpt.get();
        } else {
            banDoc = new BanDoc();
            NguoiDung nguoiDung = nguoiDungRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
            banDoc.setNguoiDung(nguoiDung);
        }

        banDoc.setHoTen((String) info.get("ho_ten"));
        banDoc.setNgaySinh(LocalDate.parse((String) info.get("ngay_sinh")));
        banDoc.setGioiTinh((String) info.get("gioi_tinh"));
        banDoc.setCccd((String) info.get("cccd"));
        banDoc.setDiaChi((String) info.get("dia_chi"));
        banDoc.setMaPhuongXa(Long.valueOf(info.get("ma_phuong_xa").toString()));
        banDoc.setNgheNghiep((String) info.get("nghe_nghiep"));

        try {
            Map<String, Object> thongTinBoSung = new HashMap<>();
            thongTinBoSung.put("anh_the_url", info.get("anh_the_url"));
            banDoc.setThongTinBoSung(objectMapper.writeValueAsString(thongTinBoSung));
        } catch (Exception e) {
            log.error("Lỗi khi viết thongtinbosung json: {}", e.getMessage());
        }

        return banDocRepository.save(banDoc);
    }

    /**
     * Xử lý xác thực ngầm hồ sơ bất đồng bộ
     */
    @Async
    @Transactional
    public void processCardApplicationAsync(Long maYeuCau, Map<String, Object> formValues, String filename) {
        log.info("🚀 Bắt đầu xác thực ngầm hồ sơ #{}...", maYeuCau);
        try {
            Thread.sleep(2000); // Giả lập thời gian xử lý API cổng quốc gia

            Map<String, Object> verifyResult = performVerification(
                    (String) formValues.get("cccd"),
                    (String) formValues.get("ho_ten"),
                    (String) formValues.get("ngay_sinh"),
                    (String) formValues.get("sdt"),
                    filename
            );

            String risk = (String) verifyResult.get("risk_level");
            log.info("🔍 Kết quả xác thực hồ sơ #{}: Risk={}", maYeuCau, risk);

            YeuCauThe request = yeuCauTheRepository.findById(maYeuCau)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu thẻ."));

            // Cập nhật thông tin bổ sung chứa kết quả xác thực
            Map<String, Object> info = objectMapper.readValue(request.getThongTinBoSung(), Map.class);
            info.put("ket_qua_xac_thuc", verifyResult);

            if ("LOW".equals(risk)) {
                // Luồng Xanh -> Tạo luôn BanDoc (nếu chưa có) và cho phép thanh toán
                Long userId = Long.valueOf(info.get("ma_nguoi_dung_dang_ky").toString());
                BanDoc banDoc = ensureReaderExists(userId, info);

                info.put("qr_payment_content", "PAYMENT|" + maYeuCau + "|" + request.getLePhi());
                info.put("tong_tien", request.getLePhi());

                request.setBanDoc(banDoc);
                request.setTrangThaiQuyTrinh("choDuyet"); // Chờ duyệt chính thức sau khi nộp phí
            } else if ("MEDIUM".equals(risk)) {
                // Luồng Vàng -> Chờ nhân viên check thủ công
                request.setTrangThaiQuyTrinh("choDuyet");
            } else {
                // Luồng Đỏ -> Tự động từ chối
                request.setTrangThaiQuyTrinh("tuChoi");
                request.setGhiChu("Hệ thống tự động từ chối do thông tin không khớp CSDL quốc gia.");
                request.setThoiGianXuLy(LocalDateTime.now());
            }

            request.setThongTinBoSung(objectMapper.writeValueAsString(info));
            yeuCauTheRepository.save(request);

        } catch (Exception e) {
            log.error("Lỗi khi xử lý ngầm hồ sơ: {}", e.getMessage());
        }
    }

    /**
     * Admin duyệt hồ sơ thủ công và phát hành thẻ
     */
    @Transactional
    public String approveCardRequest(Long maYeuCau, String status, String rejectReason, Long staffId) {
        YeuCauThe request = yeuCauTheRepository.findById(maYeuCau)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu làm thẻ."));

        if ("daDuyet".equals(request.getTrangThaiQuyTrinh())) {
            throw new RuntimeException("Yêu cầu này đã được duyệt trước đó.");
        }

        try {
            Map<String, Object> info = objectMapper.readValue(request.getThongTinBoSung(), Map.class);
            info.put("ngay_xu_ly", LocalDateTime.now().toString());

            if ("tuChoi".equals(status)) {
                info.put("ly_do_tu_choi", rejectReason);
                request.setTrangThaiQuyTrinh("tuChoi");
                request.setMaNhanVien(staffId);
                request.setThoiGianXuLy(LocalDateTime.now());
                request.setThongTinBoSung(objectMapper.writeValueAsString(info));
                yeuCauTheRepository.save(request);
                return "Đã từ chối cấp thẻ.";
            }

            // Xử lý Duyệt -> Tạo thẻ thư viện
            Long userId = Long.valueOf(info.get("ma_nguoi_dung_dang_ky").toString());
            BanDoc banDoc = ensureReaderExists(userId, info);

            // Tạo mã số thẻ mới ngẫu nhiên
            String soTheMoi = "TV" + System.currentTimeMillis() / 1000;
            LocalDate ngayHetHan = LocalDate.now().plusYears(1);

            TheBanDoc card = new TheBanDoc();
            card.setBanDoc(banDoc);
            card.setLoaiThe(request.getLoaiThe());
            card.setSoThe(soTheMoi);
            card.setMaNhanVien(staffId);
            card.setNgayHetHan(ngayHetHan);
            card.setTrangThaiThe(true);
            card.setPhuongThucVanChuyen("TaiQuay");
            theBanDocRepository.save(card);

            // Cập nhật Yêu cầu thẻ
            request.setTrangThaiQuyTrinh("daDuyet");
            request.setBanDoc(banDoc);
            request.setMaNhanVien(staffId);
            request.setThoiGianXuLy(LocalDateTime.now());
            request.setNoiNhanThe("Tại quầy thư viện");
            request.setThoiGianDuKien(LocalDateTime.now().plusDays(7));
            
            info.put("thoi_gian_du_kien", request.getThoiGianDuKien().toString());
            request.setThongTinBoSung(objectMapper.writeValueAsString(info));
            yeuCauTheRepository.save(request);

            return soTheMoi;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi phê duyệt thẻ: " + e.getMessage());
        }
    }
}
