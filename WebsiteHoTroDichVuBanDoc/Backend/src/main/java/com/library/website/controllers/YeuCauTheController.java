package com.library.website.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.website.dto.*;
import com.library.website.models.LoaiThe;
import com.library.website.models.YeuCauThe;
import com.library.website.repository.LoaiTheRepository;
import com.library.website.repository.YeuCauTheRepository;
import com.library.website.security.JwtAuthenticationFilter;
import com.library.website.services.YeuCauTheService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/yeu-cau-the")
@Slf4j
public class YeuCauTheController {

    @Autowired
    private YeuCauTheService yeuCauTheService;

    @Autowired
    private YeuCauTheRepository yeuCauTheRepository;

    @Autowired
    private LoaiTheRepository loaiTheRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String supabaseServiceRoleKey;

    @Value("${supabase.storage-bucket-cards}")
    private String storageBucketCards;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Upload tệp lên Supabase Storage qua HTTP POST
     */
    private String uploadToSupabaseStorage(MultipartFile file, String fileName) throws Exception {
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + storageBucketCards + "/" + fileName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseServiceRoleKey);
        headers.setContentType(MediaType.valueOf(file.getContentType()));

        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
        restTemplate.postForLocation(uploadUrl, entity);

        return supabaseUrl + "/storage/v1/object/public/" + storageBucketCards + "/" + fileName;
    }

    /**
     * API Đăng ký thẻ (nhận form-data kèm ảnh)
     */
    @PostMapping(value = "/dang-ky", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerCard(
            @RequestParam("ho_ten") String hoTen,
            @RequestParam("ngay_sinh") String ngaySinh,
            @RequestParam("gioi_tinh") String gioiTinh,
            @RequestParam("nghe_nghiep") String ngheNghiep,
            @RequestParam("cccd") String cccd,
            @RequestParam("dia_chi") String diaChi,
            @RequestParam("email") String email,
            @RequestParam("sdt") String sdt,
            @RequestParam("ma_loai_the") Short maLoaiThe,
            @RequestParam("ma_phuong_xa") Long maPhuongXa,
            @RequestParam(value = "giao_hang", defaultValue = "false") boolean giaoHang,
            @RequestParam(value = "anh_the", required = false) MultipartFile anhThe) {

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        Long userId = userDetails.getId();

        try {
            String anhTheUrl = null;
            if (anhThe != null && !anhThe.isEmpty()) {
                String cleanName = anhThe.getOriginalFilename().replaceAll("[^a-zA-Z0-9_.-]", "");
                String fileName = "u" + userId + "_" + System.currentTimeMillis() + "_" + cleanName;
                anhTheUrl = uploadToSupabaseStorage(anhThe, fileName);
            }

            // Tạo cấu trúc thongtinbosung JSON giống y hệt FastAPI
            Map<String, Object> thongTinBoSung = new HashMap<>();
            thongTinBoSung.put("ho_ten", hoTen);
            thongTinBoSung.put("ngay_sinh", ngaySinh);
            thongTinBoSung.put("gioi_tinh", gioiTinh);
            thongTinBoSung.put("nghe_nghiep", ngheNghiep);
            thongTinBoSung.put("cccd", cccd);
            thongTinBoSung.put("dia_chi", diaChi);
            thongTinBoSung.put("ma_phuong_xa", maPhuongXa);
            thongTinBoSung.put("email", email);
            thongTinBoSung.put("sdt", sdt);
            thongTinBoSung.put("giao_hang", giaoHang);
            thongTinBoSung.put("anh_the_url", anhTheUrl);
            thongTinBoSung.put("ma_nguoi_dung_dang_ky", userId);

            Optional<LoaiThe> loaiTheOpt = loaiTheRepository.findById(maLoaiThe);
            BigDecimal lePhi = loaiTheOpt.isPresent() ? loaiTheOpt.get().getLePhi() : BigDecimal.ZERO;

            YeuCauThe request = new YeuCauThe();
            request.setLoaiThe(loaiTheOpt.orElse(null));
            request.setHinhThucYeuCau("Online");
            request.setLePhi(lePhi);
            request.setTrangThaiQuyTrinh("dangXuLy");
            request.setThongTinBoSung(objectMapper.writeValueAsString(thongTinBoSung));

            YeuCauThe saved = yeuCauTheRepository.save(request);

            // Chạy bất đồng bộ tiến trình eKYC xác thực
            yeuCauTheService.processCardApplicationAsync(saved.getMaYeuCauThe(), thongTinBoSung,
                    anhThe != null ? anhThe.getOriginalFilename() : "");

            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("mayeucauthe", saved.getMaYeuCauThe());
            dataMap.put("trangthai", saved.getTrangThaiQuyTrinh());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Hồ sơ đã gửi thành công. Hệ thống đang xử lý.");
            response.put("data", dataMap);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Lỗi đăng ký thẻ: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * API Kiểm tra trạng thái hồ sơ (Polling)
     */
    @GetMapping("/{id}/trang-thai")
    public ResponseEntity<?> checkRequestStatus(@PathVariable("id") Long id) {
        try {
            Optional<YeuCauThe> reqOpt = yeuCauTheRepository.findById(id);
            if (reqOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy yêu cầu.");
            }

            YeuCauThe req = reqOpt.get();
            Map<String, Object> info = objectMapper.readValue(req.getThongTinBoSung(), Map.class);
            String trangThai = req.getTrangThaiQuyTrinh();

            String lyDo = null;
            if ("tuChoi".equals(trangThai)) {
                lyDo = (String) info.get("ly_do_tu_choi");
                if (lyDo == null) {
                    lyDo = req.getGhiChu();
                }
            }

            String msg = null;
            if ("daDuyet".equals(trangThai)) {
                msg = "Chúc mừng! Hồ sơ của bạn đã được duyệt và thẻ đã được tạo.";
            }

            Map<String, Object> response = new HashMap<>();
            response.put("mayeucauthe", id);
            response.put("trangthai", trangThai);
            response.put("ket_qua_xac_thuc", info.get("ket_qua_xac_thuc"));
            response.put("ly_do_tu_choi", lyDo);
            response.put("message", msg);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * API Lấy chi tiết đầy đủ một yêu cầu thẻ (Admin/Staff)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCardRequestDetail(@PathVariable("id") Long id) {
        try {
            Optional<YeuCauThe> reqOpt = yeuCauTheRepository.findById(id);
            if (reqOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy yêu cầu.");
            }
            YeuCauThe req = reqOpt.get();
            Map<String, Object> info = objectMapper.readValue(req.getThongTinBoSung(), Map.class);
            
            Number maPhuongXaNum = (Number) info.get("ma_phuong_xa");
            if (maPhuongXaNum != null) {
                Long maPhuongXa = maPhuongXaNum.longValue();
                try {
                    String sql = "SELECT px.tenphuongxa, ttp.tentinhthanhpho FROM phuongxa px " +
                                 "LEFT JOIN tinhthanhpho ttp ON px.matinhthanhpho = ttp.matinhthanhpho " +
                                 "WHERE px.maphuongxa = ? LIMIT 1";
                    List<Map<String, Object>> pxRows = jdbcTemplate.queryForList(sql, maPhuongXa);
                    if (!pxRows.isEmpty()) {
                        Map<String, Object> pxRow = pxRows.get(0);
                        String tenPhuong = (String) pxRow.get("tenphuongxa");
                        String tenTinh = (String) pxRow.get("tentinhthanhpho");
                        info.put("ten_phuong_xa", tenPhuong);
                        info.put("ten_tinh_thanh_pho", tenTinh);
                        String diaChiFull = (String) info.get("dia_chi");
                        info.put("dia_chi_hien_thi", (diaChiFull != null ? diaChiFull : "") + ", " + (tenPhuong != null ? tenPhuong : "") + ", " + (tenTinh != null ? tenTinh : ""));
                    }
                } catch (Exception pxEx) {
                    log.warn("Lỗi tra cứu phường xã: {}", pxEx.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("mayeucauthe", req.getMaYeuCauThe());
            response.put("thoigianbatdau", req.getThoiGianBatDau());
            response.put("tenloaithe", req.getLoaiThe() != null ? req.getLoaiThe().getTenThe() : "Không rõ");
            response.put("thongtinbosung", info);
            response.put("lephi", req.getLePhi());
            response.put("trangthaiquytrinh", req.getTrangThaiQuyTrinh());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * API Duyệt thẻ thủ công (Nhân viên/Admin)
     */
    @PutMapping("/phe-duyet/{id}")
    public ResponseEntity<?> approveRequest(@PathVariable("id") Long id, @RequestBody DuyetTheRequest duyetIn) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới có quyền duyệt thẻ.");
        }

        try {
            // Lấy ID nhân viên
            String sql = "SELECT manhanvien FROM nhanvien WHERE manguoidung = ? LIMIT 1";
            Long staffId = jdbcTemplate.queryForObject(sql, Long.class, userDetails.getId());

            String result = yeuCauTheService.approveCardRequest(id, duyetIn.getTrang_thai(), duyetIn.getLy_do(), staffId);
            return ResponseEntity.ok(Collections.singletonMap("message", "Thao tác thành công: " + result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * API Lấy danh sách chờ duyệt (Admin)
     */
    @GetMapping("/danh-sach-cho-duyet")
    public ResponseEntity<?> getPendingRequests() {
        try {
            List<YeuCauThe> list = yeuCauTheRepository.findByTrangThaiQuyTrinh("choDuyet");
            List<Map<String, Object>> response = new ArrayList<>();

            for (YeuCauThe item : list) {
                Map<String, Object> info = objectMapper.readValue(item.getThongTinBoSung(), Map.class);
                Map<String, Object> map = new HashMap<>();
                map.put("ma_ho_so", item.getMaYeuCauThe());
                map.put("ho_ten", info.get("ho_ten"));
                map.put("loai_the", item.getLoaiThe() != null ? item.getLoaiThe().getTenThe() : "Không rõ");
                map.put("ngay_dang_ky", item.getThoiGianBatDau());
                map.put("trang_thai", item.getTrangThaiQuyTrinh());
                map.put("anh_the_url", info.get("anh_the_url"));
                map.put("email", info.get("email"));
                map.put("sdt", info.get("sdt"));
                response.add(map);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * API Tra cứu công khai (Public search)
     */
    @PostMapping("/tra-cuu")
    public ResponseEntity<?> queryRequests(@RequestBody TraCuuRequest req) {
        if (req.getKeyword() == null || req.getKeyword().length() < 6) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        try {
            List<YeuCauThe> list = yeuCauTheRepository.searchRequestsBySdtOrCccd(req.getKeyword());
            List<TraCuuYeuCauResponse> responseList = new ArrayList<>();

            for (YeuCauThe item : list) {
                Map<String, Object> info = objectMapper.readValue(item.getThongTinBoSung(), Map.class);
                TraCuuYeuCauResponse res = new TraCuuYeuCauResponse();
                res.setMa_yeu_cau(item.getMaYeuCauThe());
                res.setHo_ten((String) info.get("ho_ten"));
                res.setCccd((String) info.get("cccd"));
                res.setSdt((String) info.get("sdt"));
                res.setTen_loai_the(item.getLoaiThe() != null ? item.getLoaiThe().getTenThe() : "Thẻ thành viên");
                res.setNgay_dang_ky(item.getThoiGianBatDau());
                res.setTrang_thai(item.getTrangThaiQuyTrinh());
                res.setLy_do_tu_choi((String) info.get("ly_do_tu_choi"));
                res.setAnh_the_url((String) info.get("anh_the_url"));
                res.setGiao_hang((Boolean) info.get("giao_hang"));
                responseList.add(res);
            }

            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
