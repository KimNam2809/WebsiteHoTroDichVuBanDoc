package com.library.website.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.website.models.NhanVien;
import com.library.website.repository.NhanVienRepository;
import com.library.website.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;

import java.sql.Array;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@RestController
@RequestMapping("/api/v1/bai-viet")
public class BaiVietController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String supabaseServiceRoleKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Upload nhiều ảnh cùng lúc (Batch Upload)
     */
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMultipleImages(@RequestParam("files") MultipartFile[] files) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới được phép upload ảnh.");
        }

        try {
            List<Map<String, Object>> results = new ArrayList<>();
            long startTime = System.currentTimeMillis();

            for (MultipartFile file : files) {
                Map<String, Object> result = new HashMap<>();
                result.put("original_name", file.getOriginalFilename());
                try {
                    String cleanName = file.getOriginalFilename().replaceAll("[^a-zA-Z0-9_.-]", "");
                    String fileName = "batch_" + System.currentTimeMillis() + "_" + cleanName;
                    
                    // Upload to bucket 'news_images'
                    String uploadUrl = supabaseUrl + "/storage/v1/object/news_images/" + fileName;

                    HttpHeaders headers = new HttpHeaders();
                    headers.set("Authorization", "Bearer " + supabaseServiceRoleKey);
                    headers.setContentType(MediaType.valueOf(file.getContentType()));

                    HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
                    restTemplate.postForLocation(uploadUrl, entity);

                    String publicUrl = supabaseUrl + "/storage/v1/object/public/news_images/" + fileName;

                    result.put("url", publicUrl);
                    result.put("success", true);
                } catch (Exception e) {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                }
                results.add(result);
            }

            double processTime = (double)(System.currentTimeMillis() - startTime) / 1000.0;

            Map<String, Object> response = new HashMap<>();
            response.put("data", results);
            response.put("process_time_seconds", processTime);
            response.put("total_files", files.length);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Lấy danh sách bài viết (Phân trang & Lọc)
     */
    @GetMapping("/")
    public ResponseEntity<?> getListPosts(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "15") int limit,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search) {

        try {
            int offset = (page - 1) * limit;

            String countSql = "SELECT COUNT(*) FROM baiviet WHERE 1=1";
            String selectSql = "SELECT mabaiviet, manhanvien, tieude, noidung, anhdaidien, ngaydang, ngaycapnhat, trangthai, soluotxem, soluotchiase, tukhoa, ghichu FROM baiviet WHERE 1=1";

            List<Object> params = new ArrayList<>();
            String filterSql = "";

            // Nếu người dùng không phải nhân viên/admin thì chỉ xem các bài viết hiển thị (trangthai = true)
            boolean isStaff = false;
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof JwtAuthenticationFilter.MapUserDetails) {
                String role = ((JwtAuthenticationFilter.MapUserDetails) principal).getRole();
                if ("nhanVien".equals(role)) {
                    isStaff = true;
                }
            }

            if (!isStaff) {
                filterSql += " AND trangthai = true";
            }

            if (category != null && !category.isEmpty() && !"all".equalsIgnoreCase(category)) {
                // Mapping category sang DB value giống FastAPI
                String dbCategoryValue = category;
                if ("tin-tuc".equalsIgnoreCase(category)) dbCategoryValue = "tin tức";
                else if ("su-kien".equalsIgnoreCase(category)) dbCategoryValue = "sự kiện";
                else if ("hoat-dong".equalsIgnoreCase(category)) dbCategoryValue = "hoạt động";
                else if ("thong-bao".equalsIgnoreCase(category)) dbCategoryValue = "thông báo";
                else if ("noi-bat".equalsIgnoreCase(category)) dbCategoryValue = "nổi bật";

                filterSql += " AND ? = ANY(tukhoa)";
                params.add(dbCategoryValue);
            }

            if (search != null && !search.isEmpty()) {
                filterSql += " AND tieude ILIKE ?";
                params.add("%" + search + "%");
            }

            // Đếm tổng số bài viết
            int totalItems = jdbcTemplate.queryForObject(countSql + filterSql, Integer.class, params.toArray());

            // Lấy dữ liệu phân trang
            String querySql = selectSql + filterSql + " ORDER BY ngaydang DESC LIMIT ? OFFSET ?";
            List<Object> queryParams = new ArrayList<>(params);
            queryParams.add(limit);
            queryParams.add(offset);

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(querySql, queryParams.toArray());
            List<Map<String, Object>> data = new ArrayList<>();

            for (Map<String, Object> row : rows) {
                data.add(parsePostRow(row));
            }

            int totalPages = (int) Math.ceil((double) totalItems / limit);

            Map<String, Object> response = new HashMap<>();
            response.put("data", data);
            
            Map<String, Object> meta = new HashMap<>();
            meta.put("current_page", page);
            meta.put("items_per_page", limit);
            meta.put("total_items", totalItems);
            meta.put("total_pages", totalPages);
            meta.put("has_next", page < totalPages);
            meta.put("has_prev", page > 1);
            
            response.put("meta", meta);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Chi tiết bài viết
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable("id") Long id) {
        try {
            String sql = "SELECT * FROM baiviet WHERE mabaiviet = ?";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id);
            if (rows.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("detail", "Không tìm thấy bài viết với id=" + id));
            }
            return ResponseEntity.ok(parsePostRow(rows.get(0)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Lấy 4 bài viết liên quan (Mới nhất)
     */
    @GetMapping("/lien-quan/{id}")
    public ResponseEntity<?> getRelatedPosts(@PathVariable("id") Long id) {
        try {
            String sql = "SELECT mabaiviet, tieude, anhdaidien, ngaydang, tukhoa, soluotxem FROM baiviet WHERE mabaiviet != ? AND trangthai = true ORDER BY ngaydang DESC LIMIT 4";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id);
            List<Map<String, Object>> data = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                data.add(parsePostRow(row));
            }
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Tăng lượt xem
     */
    @PostMapping("/{id}/tang-luot-xem")
    public ResponseEntity<?> increaseViewCount(@PathVariable("id") Long id) {
        try {
            String updateSql = "UPDATE baiviet SET soluotxem = COALESCE(soluotxem, 0) + 1 WHERE mabaiviet = ?";
            int updated = jdbcTemplate.update(updateSql, id);
            if (updated == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("detail", "Bài viết không tồn tại"));
            }
            Integer currentView = jdbcTemplate.queryForObject("SELECT soluotxem FROM baiviet WHERE mabaiviet = ?", Integer.class, id);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("new_view", currentView);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Tạo bài viết mới (Chỉ nhân viên)
     */
    @PostMapping("/")
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới được phép viết bài.");
        }

        try {
            Optional<NhanVien> nvOpt = nhanVienRepository.findByNguoiDungMaNguoiDung(userDetails.getId());
            Long maNhanVien = nvOpt.isPresent() ? nvOpt.get().getMaNhanVien() : null;

            String tieuDe = (String) req.get("tieude");
            String noiDung = (String) req.get("noidung");
            String ghiChu = (String) req.get("ghichu");
            Boolean trangThai = req.containsKey("trangthai") ? (Boolean) req.get("trangthai") : true;

            // Xử lý ảnh đại diện
            String anhDaiDienJson = null;
            if (req.containsKey("danh_sach_anh") && req.get("danh_sach_anh") instanceof List) {
                List<?> list = (List<?>) req.get("danh_sach_anh");
                Map<String, String> imgMap = new HashMap<>();
                for (int i = 0; i < list.size(); i++) {
                    if (list.get(i) instanceof Map) {
                        Map<?, ?> imgObj = (Map<?, ?>) list.get(i);
                        imgMap.put("anh_" + (i + 1), (String) imgObj.get("url"));
                    }
                }
                if (!imgMap.isEmpty()) {
                    anhDaiDienJson = objectMapper.writeValueAsString(imgMap);
                }
            } else if (req.containsKey("anhdaidien")) {
                Object add = req.get("anhdaidien");
                if (add instanceof Map) {
                    anhDaiDienJson = objectMapper.writeValueAsString(add);
                } else if (add instanceof String) {
                    anhDaiDienJson = (String) add;
                }
            }

            // Xử lý từ khóa
            List<?> rawKeywords = (List<?>) req.get("tukhoa");
            String[] keywords = rawKeywords != null 
                    ? rawKeywords.stream().map(Object::toString).toArray(String[]::new)
                    : new String[0];

            try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                String sql = "INSERT INTO baiviet (manhanvien, tieude, noidung, anhdaidien, tukhoa, ghichu, trangthai, soluotxem, soluotchiase) " +
                             "VALUES (?, ?, ?, ?::jsonb, ?, ?, ?, 0, 0) RETURNING mabaiviet";
                
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    if (maNhanVien != null) ps.setLong(1, maNhanVien);
                    else ps.setNull(1, java.sql.Types.BIGINT);
                    ps.setString(2, tieuDe);
                    ps.setString(3, noiDung);
                    ps.setString(4, anhDaiDienJson);
                    
                    Array array = conn.createArrayOf("text", keywords);
                    ps.setArray(5, array);
                    ps.setString(6, ghiChu);
                    ps.setBoolean(7, trangThai);

                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            long newId = rs.getLong(1);
                            return getPostById(newId);
                        }
                    }
                }
            }
            return ResponseEntity.badRequest().body("Lỗi tạo bài viết.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Cập nhật bài viết (Chỉ nhân viên)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable("id") Long id, @RequestBody Map<String, Object> req) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới được phép cập nhật bài viết.");
        }

        try {
            String updateFieldsSql = "";
            List<Object> params = new ArrayList<>();

            if (req.containsKey("tieude")) {
                updateFieldsSql += ", tieude = ?";
                params.add(req.get("tieude"));
            }
            if (req.containsKey("noidung")) {
                updateFieldsSql += ", noidung = ?";
                params.add(req.get("noidung"));
            }
            if (req.containsKey("ghichu")) {
                updateFieldsSql += ", ghichu = ?";
                params.add(req.get("ghichu"));
            }
            if (req.containsKey("trangthai")) {
                updateFieldsSql += ", trangthai = ?";
                params.add(req.get("trangthai"));
            }

            // Xử lý ảnh
            String anhDaiDienJson = null;
            boolean hasImageUpdate = false;
            if (req.containsKey("danh_sach_anh") && req.get("danh_sach_anh") instanceof List) {
                hasImageUpdate = true;
                List<?> list = (List<?>) req.get("danh_sach_anh");
                Map<String, String> imgMap = new HashMap<>();
                for (int i = 0; i < list.size(); i++) {
                    if (list.get(i) instanceof Map) {
                        Map<?, ?> imgObj = (Map<?, ?>) list.get(i);
                        imgMap.put("anh_" + (i + 1), (String) imgObj.get("url"));
                    }
                }
                if (!imgMap.isEmpty()) {
                    anhDaiDienJson = objectMapper.writeValueAsString(imgMap);
                }
            } else if (req.containsKey("anhdaidien")) {
                hasImageUpdate = true;
                Object add = req.get("anhdaidien");
                if (add instanceof Map) {
                    anhDaiDienJson = objectMapper.writeValueAsString(add);
                } else if (add instanceof String) {
                    anhDaiDienJson = (String) add;
                }
            }

            if (hasImageUpdate) {
                updateFieldsSql += ", anhdaidien = ?::jsonb";
                params.add(anhDaiDienJson);
            }

            // Xử lý từ khóa
            Array keywordsArray = null;
            if (req.containsKey("tukhoa") && req.get("tukhoa") instanceof List) {
                List<?> rawKeywords = (List<?>) req.get("tukhoa");
                String[] keywords = rawKeywords.stream().map(Object::toString).toArray(String[]::new);
                try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                    keywordsArray = conn.createArrayOf("text", keywords);
                }
                updateFieldsSql += ", tukhoa = ?";
                params.add(keywordsArray);
            }

            if (updateFieldsSql.isEmpty()) {
                return ResponseEntity.ok(getPostById(id).getBody());
            }

            String sql = "UPDATE baiviet SET ngaycapnhat = NOW(), updated_at = NOW()" + updateFieldsSql + " WHERE mabaiviet = ?";
            params.add(id);

            int updated = jdbcTemplate.update(sql, params.toArray());
            if (updated == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("detail", "Không tìm thấy bài viết để cập nhật."));
            }

            return ResponseEntity.ok(getPostById(id).getBody());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Xóa bài viết
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable("id") Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtAuthenticationFilter.MapUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Chưa đăng nhập.");
        }

        JwtAuthenticationFilter.MapUserDetails userDetails = (JwtAuthenticationFilter.MapUserDetails) principal;
        if (!"nhanVien".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Chỉ nhân viên mới được phép xóa bài viết.");
        }

        try {
            int deleted = jdbcTemplate.update("DELETE FROM public.baiviet WHERE mabaiviet = ?", id);
            if (deleted == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("detail", "Không tìm thấy bài viết để xóa."));
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", e.getMessage()));
        }
    }

    /**
     * Parse raw database row to Jackson-friendly JSON formats
     */
    private Map<String, Object> parsePostRow(Map<String, Object> row) {
        Map<String, Object> parsed = new HashMap<>(row);
        
        // 1. Chuyển đổi PostgreSQL Array sang Java List
        if (row.containsKey("tukhoa") && row.get("tukhoa") != null) {
            try {
                Array sqlArray = (Array) row.get("tukhoa");
                String[] array = (String[]) sqlArray.getArray();
                parsed.put("tukhoa", Arrays.asList(array));
            } catch (Exception e) {
                parsed.put("tukhoa", Collections.emptyList());
            }
        } else {
            parsed.put("tukhoa", Collections.emptyList());
        }

        // 2. Chuyển đổi JSONB anhdaidien sang Map
        if (row.containsKey("anhdaidien") && row.get("anhdaidien") != null) {
            try {
                Object val = row.get("anhdaidien");
                Map<?, ?> map = objectMapper.readValue(val.toString(), Map.class);
                parsed.put("anhdaidien", map);
            } catch (Exception e) {
                // If it's a simple string url, store it directly or wrap it
                Map<String, String> map = new HashMap<>();
                map.put("anh_1", row.get("anhdaidien").toString());
                parsed.put("anhdaidien", map);
            }
        } else {
            parsed.put("anhdaidien", Collections.emptyMap());
        }

        // Đảm bảo tương thích snake_case cho các trường
        parsed.put("mabaiviet", row.get("mabaiviet"));
        parsed.put("manhanvien", row.get("manhanvien"));
        parsed.put("tieude", row.get("tieude"));
        parsed.put("noidung", row.get("noidung"));
        parsed.put("ngaydang", row.get("ngaydang"));
        parsed.put("ngaycapnhat", row.get("ngaycapnhat"));
        parsed.put("trangthai", row.get("trangthai"));
        parsed.put("soluotxem", row.get("soluotxem"));
        parsed.put("soluotchiase", row.get("soluotchiase"));
        parsed.put("ghichu", row.get("ghichu"));

        return parsed;
    }
}
