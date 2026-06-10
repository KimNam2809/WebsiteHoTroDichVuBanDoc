package com.library.website.controllers;

import com.library.website.models.NguoiDung;
import com.library.website.repository.NguoiDungRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/nguoi-dung")
public class NguoiDungController {

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * API Lấy danh sách tất cả người dùng kèm Họ tên
     */
    @GetMapping("/")
    public ResponseEntity<?> getAllUsers() {
        try {
            // Join với ban doc và nhan vien để lấy ho ten
            String sql = "SELECT u.manguoidung, u.tendangnhap, u.email, u.sodienthoai, u.vaitro, u.trangthai, u.ngaytao, " +
                         "COALESCE(b.hoten, n.hoten, 'Chưa cập nhật') as hoten " +
                         "FROM nguoidung u " +
                         "LEFT JOIN bandoc b ON u.manguoidung = b.manguoidung " +
                         "LEFT JOIN nhanvien n ON u.manguoidung = n.manguoidung " +
                         "ORDER BY u.manguoidung ASC";
            List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
            
            // Convert key names to match Next.js fields (camelCase)
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> u : list) {
                Map<String, Object> map = new HashMap<>();
                map.put("manguoidung", u.get("manguoidung"));
                map.put("tenDangNhap", u.get("tendangnhap"));
                map.put("email", u.get("email"));
                map.put("soDienThoai", u.get("sodienthoai"));
                map.put("vaitro", u.get("vaitro"));
                map.put("trangthai", u.get("trangthai"));
                map.put("ngaytao", u.get("ngaytao"));
                map.put("hoten", u.get("hoten"));
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * API Cập nhật trạng thái người dùng (Khóa/Mở khóa)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserStatus(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        Optional<NguoiDung> userOpt = nguoiDungRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        NguoiDung user = userOpt.get();
        if (body.containsKey("trangThai")) {
            user.setTrangThai((Boolean) body.get("trangThai"));
        } else if (body.containsKey("trangthai")) {
            user.setTrangThai((Boolean) body.get("trangthai"));
        }
        
        nguoiDungRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("manguoidung", user.getMaNguoiDung());
        response.put("trangthai", user.getTrangThai());
        return ResponseEntity.ok(response);
    }
}
