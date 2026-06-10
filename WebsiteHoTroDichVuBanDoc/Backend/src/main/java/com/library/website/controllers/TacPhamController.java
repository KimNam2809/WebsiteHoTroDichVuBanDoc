package com.library.website.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.website.models.BanSao;
import com.library.website.models.TacPham;
import com.library.website.repository.BanSaoRepository;
import com.library.website.repository.TacPhamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/tac-pham")
public class TacPhamController {

    @Autowired
    private TacPhamRepository tacPhamRepository;

    @Autowired
    private BanSaoRepository banSaoRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * API Tìm kiếm nâng cao phân trang gọi hàm RPC fn_tim_kiem_nang_cao trong Database
     */
    @GetMapping("/tim-kiem-nang-cao")
    public ResponseEntity<?> searchAdvanced(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "danh_muc_id", required = false) Long danhMucId,
            @RequestParam(value = "tu_khoa_id", required = false) Long tuKhoaId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "8") int limit) {

        try {
            int offset = (page - 1) * limit;

            // Gọi RPC Postgres
            String sql = "SELECT * FROM fn_tim_kiem_nang_cao(?, ?, ?, ?, ?)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, q, danhMucId, tuKhoaId, limit, offset);

            if (rows.isEmpty() || rows.get(0).get("fn_tim_kiem_nang_cao") == null) {
                Map<String, Object> fallback = new HashMap<>();
                fallback.put("data", Collections.emptyList());
                fallback.put("total", 0);
                fallback.put("page", page);
                fallback.put("limit", limit);
                fallback.put("total_pages", 0);
                return ResponseEntity.ok(fallback);
            }

            // Kết quả trả về của fn_tim_kiem_nang_cao là một chuỗi JSON
            Object rawResult = rows.get(0).get("fn_tim_kiem_nang_cao");
            String jsonOutput = rawResult != null ? rawResult.toString() : null;
            Map<String, Object> result = objectMapper.readValue(jsonOutput, Map.class);

            int total = ((Number) result.get("total")).intValue();
            int totalPages = (int) Math.ceil((double) total / limit);

            result.put("page", page);
            result.put("limit", limit);
            result.put("total_pages", totalPages);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("detail", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Lấy chi tiết tác phẩm
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTacPham(@PathVariable("id") Long id) {
        Optional<TacPham> tp = tacPhamRepository.findById(id);
        if (tp.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tp.get());
    }

    /**
     * Lấy các bản sao của tác phẩm
     */
    @GetMapping("/{id}/ban-sao")
    public ResponseEntity<List<BanSao>> getBanSaoList(@PathVariable("id") Long id) {
        List<BanSao> list = banSaoRepository.findByTacPhamMaTacPham(id);
        return ResponseEntity.ok(list);
    }

    /**
     * Lấy thông tin chi tiết đầy đủ (Full Info)
     */
    @GetMapping("/{id}/full-info")
    public ResponseEntity<?> getFullInfo(@PathVariable("id") Long id) {
        Optional<TacPham> tpOpt = tacPhamRepository.findById(id);
        if (tpOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TacPham tp = tpOpt.get();
        List<BanSao> listBanSao = banSaoRepository.findByTacPhamMaTacPham(id);

        long coSan = listBanSao.stream().filter(BanSao::getTrangThaiChoMuon).count();

        Map<String, Object> res = new HashMap<>();
        res.put("thong_tin_chung", tp);
        res.put("ban_sao", listBanSao);
        // Để tương thích DTO Python, mock các trường liên kết
        res.put("danh_muc", Collections.emptyList());
        res.put("so_luong_tong", listBanSao.size());
        res.put("so_luong_co_san", coSan);

        return ResponseEntity.ok(res);
    }
}
