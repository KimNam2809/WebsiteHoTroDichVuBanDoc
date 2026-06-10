package com.library.website.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.website.dto.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class LibraryBrainService {

    @Autowired
    private RAGService ragService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api-key}")
    private String groqApiKey;

    @Value("${groq.url}")
    private String groqUrl;

    @Value("${groq.model}")
    private String groqModel;

    public LibraryBrainService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    /**
     * Gọi Groq API để sinh văn bản/xử lý prompt
     */
    private String callGroqLLM(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);

            Map<String, Object> request = new HashMap<>();
            request.put("model", groqModel);
            request.put("messages", Collections.singletonList(message));
            request.put("temperature", 0.0);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(groqUrl, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("choices").path(0).path("message").path("content").asText();
            }
        } catch (Exception e) {
            log.error("Lỗi khi kết nối Groq API: {}", e.getMessage());
        }
        return "Xin lỗi, hệ thống AI đang gặp sự cố kết nối.";
    }

    /**
     * Trích xuất các thực thể từ câu hỏi sử dụng LLM
     */
    private Map<String, Object> extractEntities(String query, String history) {
        String prompt = "Nhiệm vụ: Trích xuất thông tin từ câu hỏi.\n" +
                "BẮT BUỘC: Chỉ trả về JSON, không giải thích.\n" +
                "[Cấu trúc JSON]:\n" +
                "{\n" +
                "    \"book_name\": \"tên sách\",\n" +
                "    \"author\": \"tên tác giả\",\n" +
                "    \"category\": \"thể loại/chủ đề\",\n" +
                "    \"device_name\": \"tên thiết bị\",\n" +
                "    \"article_topic\": \"chủ đề bài viết\",\n" +
                "    \"room_name\": \"tên phòng\",\n" +
                "    \"staff_name\": \"tên nhân viên\",\n" +
                "    \"department\": \"phòng ban\",\n" +
                "    \"policy_topic\": \"chủ đề chính sách\",\n" +
                "    \"available\": true/false\n" +
                "}\n" +
                "[LỊCH SỬ]: " + history + "\n" +
                "[CÂU HỎI]: " + query + "\n" +
                "JSON:";
        try {
            String llmOutput = callGroqLLM(prompt).strip();
            int startIdx = llmOutput.indexOf("{");
            int endIdx = llmOutput.lastIndexOf("}");
            if (startIdx != -1 && endIdx != -1) {
                String jsonStr = llmOutput.substring(startIdx, endIdx + 1);
                return objectMapper.readValue(jsonStr, Map.class);
            }
        } catch (Exception e) {
            log.error("Lỗi parse entities: {}", e.getMessage());
        }
        return Collections.emptyMap();
    }

    private Long getBanDocId(Long userId) {
        try {
            String sql = "SELECT mabandoc FROM bandoc WHERE manguoidung = ? LIMIT 1";
            return jdbcTemplate.queryForObject(sql, Long.class, userId);
        } catch (Exception e) {
            return null;
        }
    }

    public ChatResponse processChat(String userQuery, Long userId, String sessionId) {
        String qLower = userQuery.toLowerCase();
        String history = ""; // Để đơn giản hóa, ta bỏ qua history lưu trong DB hoặc lấy trống
        Map<String, Object> entities = extractEntities(userQuery, history);

        // A. TRA CỨU NHÂN VIÊN
        if (qLower.contains("nhân viên") || qLower.contains("ai quản lý") || qLower.contains("trưởng phòng")) {
            String name = (String) entities.get("staff_name");
            String dept = (String) entities.get("department");
            String reply = searchStaff(name, dept);
            return new ChatResponse(reply, sessionId, null);
        }

        // B. TRA CỨU CHÍNH SÁCH / THÈ
        if (qLower.contains("phí làm thẻ") || qLower.contains("quy định thẻ") || qLower.contains("hạn mức mượn") || qLower.contains("loại thẻ")) {
            String reply = getLibraryPolicies(qLower);
            return new ChatResponse(reply, sessionId, null);
        }

        // C. TRA CỨU ĐƠN GIAO SÁCH
        if (qLower.contains("giao sách") || qLower.contains("đơn ship") || qLower.contains("vận chuyển")) {
            String reply = checkShippingStatus(userId);
            return new ChatResponse(reply, sessionId, null);
        }

        // D. TRA CỨU CÁ NHÂN (Dashboard / Fines)
        if (qLower.contains("thông báo")) {
            String reply = checkNotifications(userId);
            return new ChatResponse(reply, sessionId, null);
        }
        if (qLower.contains("phạt") || qLower.contains("nợ") || qLower.contains("tiền")) {
            String reply = checkFineHistory(userId);
            return new ChatResponse(reply, sessionId, null);
        }
        if (qLower.contains("tôi đang mượn") || qLower.contains("sách đã mượn") || qLower.contains("hạn trả") || qLower.contains("lịch sử mượn")) {
            String reply = checkPersonalDashboard(userId);
            return new ChatResponse(reply, sessionId, null);
        }

        // E. ĐIỀU HƯỚNG LINK
        if (qLower.contains("link") || qLower.contains("trang web")) {
            Map<String, String> navMap = new HashMap<>();
            navMap.put("đăng ký thẻ", "/dang_ky_the");
            navMap.put("nội quy", "/dang_ky_the/noi_quy");
            navMap.put("đặt phòng", "/dich_vu/dat_lich");
            navMap.put("giao sách", "/van_chuyen/giao_sach");

            for (Map.Entry<String, String> entry : navMap.entrySet()) {
                if (qLower.contains(entry.getKey())) {
                    Map<String, Object> action = new HashMap<>();
                    action.put("type", "navigate");
                    Map<String, String> payload = new HashMap<>();
                    payload.put("url", entry.getValue());
                    payload.put("label", "Đến trang " + entry.getKey());
                    action.put("payload", payload);
                    return new ChatResponse("Mời bạn truy cập tại đây:", sessionId, action);
                }
            }
        }

        // F. TÌM SÁCH
        if (entities.containsKey("book_name") || entities.containsKey("author") || qLower.contains("tìm sách") || qLower.contains("có sách")) {
            String bookName = (String) entities.get("book_name");
            String author = (String) entities.get("author");
            String category = (String) entities.get("category");
            return searchBooks(bookName, author, category);
        }

        // G. THIẾT BỊ / TIỆN ÍCH / BÀI VIẾT
        if (qLower.contains("máy tính") || qLower.contains("máy chiếu") || qLower.contains("thiết bị") || qLower.contains("wifi")) {
            String device = (String) entities.get("device_name");
            String room = (String) entities.get("room_name");
            String reply = searchEquipment(device, room);
            return new ChatResponse(reply, sessionId, null);
        }
        if (qLower.contains("bài viết") || qLower.contains("tin tức") || qLower.contains("sự kiện")) {
            String topic = (String) entities.get("article_topic");
            String reply = searchArticles(topic);
            return new ChatResponse(reply, sessionId, null);
        }
        if (qLower.contains("chỗ ngồi") || qLower.contains("đặt chỗ") || qLower.contains("phòng")) {
            String room = (String) entities.get("room_name");
            String reply = getFacilityStatus(room);
            return new ChatResponse(reply, sessionId, null);
        }

        // H. FALLBACK TO RAG
        String context = ragService.queryRAGContext(userQuery);
        String prompt = "<SYSTEM>\n" +
                "Nhiệm vụ: Hỗ trợ bạn đọc Thư viện Đà Nẵng.\n" +
                "[Dữ liệu]: " + context + "\n" +
                "[Lịch sử]: \n" +
                "[Yêu cầu]:\n" +
                "- Trả lời dựa trên dữ liệu.\n" +
                "- Nếu hỏi về giờ làm việc, địa chỉ -> Dùng RAG.\n" +
                "- Thân thiện, ngắn gọn, đầy đủ.\n" +
                "</SYSTEM>\n" +
                "User: " + userQuery + "\n" +
                "Assistant:";

        String finalResponse = callGroqLLM(prompt);
        return new ChatResponse(finalResponse, sessionId, null);
    }

    // Các hàm phụ trợ gọi SQL database tương ứng với db_tools.py và action_tools.py
    private String searchStaff(String name, String department) {
        try {
            String sql = "SELECT hoten, chucvu, phongban FROM nhanvien WHERE 1=1";
            List<Object> params = new ArrayList<>();
            if (name != null && !name.isEmpty()) {
                sql += " AND hoten ILIKE ?";
                params.add("%" + name + "%");
            }
            if (department != null && !department.isEmpty()) {
                sql += " AND phongban ILIKE ?";
                params.add("%" + department + "%");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
            if (rows.isEmpty()) return "Không tìm thấy nhân viên phù hợp.";
            
            StringBuilder sb = new StringBuilder("👥 **Danh sách nhân viên:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- **").append(row.get("hoten")).append("** (")
                  .append(row.get("chucvu")).append(") - ").append(row.get("phongban")).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi tra cứu nhân viên.";
        }
    }

    private String getLibraryPolicies(String topic) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT tenthe, lephi, tailieumuontoida, songaymuonmacdinh FROM loaithe");
            StringBuilder sb = new StringBuilder("💳 **Chính sách thẻ bạn đọc:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- **").append(row.get("tenthe")).append("**: Phí ")
                  .append(row.get("lephi")).append("đ, mượn tối đa ")
                  .append(row.get("tailieumuontoida")).append(" cuốn (")
                  .append(row.get("songaymuonmacdinh")).append(" ngày).\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi tra cứu chính sách.";
        }
    }

    private String checkShippingStatus(Long userId) {
        Long mbd = getBanDocId(userId);
        if (mbd == null) return "Bạn chưa đăng ký dịch vụ.";
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT diachi, trangthai, thoigianyeucau FROM yeucaugiao WHERE mabandoc = ? ORDER BY thoigianyeucau DESC LIMIT 3", mbd);
            if (rows.isEmpty()) return "Bạn chưa có yêu cầu giao sách nào.";
            StringBuilder sb = new StringBuilder("🚚 **Đơn giao sách:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- Giao tới **").append(row.get("diachi")).append("**: ")
                  .append(row.get("trangthai")).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi kiểm tra vận chuyển.";
        }
    }

    private String checkNotifications(Long userId) {
        Long mbd = getBanDocId(userId);
        if (mbd == null) return "Không tìm thấy hồ sơ.";
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT tieude, noidung, thoigiangui FROM thongbao WHERE mabandoc = ? ORDER BY thoigiangui DESC LIMIT 5", mbd);
            if (rows.isEmpty()) return "🔕 Bạn không có thông báo mới nào.";
            StringBuilder sb = new StringBuilder("🔔 **Thông báo của bạn:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- **").append(row.get("tieude")).append("**: ").append(row.get("noidung")).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi lấy thông báo.";
        }
    }

    private String checkFineHistory(Long userId) {
        Long mbd = getBanDocId(userId);
        if (mbd == null) return "Không tìm thấy hồ sơ.";
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT m.ngaytra, m.tienphat, t.tentacpham FROM muontra m " +
                    "JOIN bansao b ON m.mabansao = b.mabansao " +
                    "JOIN tacpham t ON b.matacpham = t.matacpham " +
                    "WHERE m.mabandoc = ? AND m.tienphat > 0 ORDER BY m.ngaytra DESC", mbd);
            if (rows.isEmpty()) return "🎉 Hồ sơ của bạn sạch! Không có khoản phạt nào.";
            StringBuilder sb = new StringBuilder("💸 **Lịch sử phạt vi phạm:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- ").append(row.get("ngaytra")).append(": **").append(row.get("tienphat")).append("đ** (Sách: ").append(row.get("tentacpham")).append(")\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi tra cứu phạt.";
        }
    }

    private String checkPersonalDashboard(Long userId) {
        Long mbd = getBanDocId(userId);
        if (mbd == null) return "⚠️ Bạn chưa có hồ sơ bạn đọc.";
        try {
            StringBuilder sb = new StringBuilder("👤 **Thông tin hoạt động của bạn:**\n");
            
            // Sách đang mượn
            List<Map<String, Object>> loans = jdbcTemplate.queryForList(
                    "SELECT t.tentacpham, m.ngaytra FROM muontra m " +
                    "JOIN bansao b ON m.mabansao = b.mabansao " +
                    "JOIN tacpham t ON b.matacpham = t.matacpham " +
                    "WHERE m.mabandoc = ? AND m.trangthaimuon = 'daMuon'", mbd);
            
            if (loans.isEmpty()) {
                sb.append("\n📚 **Đang mượn:** Không có sách nào.");
            } else {
                sb.append("\n📚 **Đang mượn (").append(loans.size()).append("):**\n");
                for (Map<String, Object> l : loans) {
                    sb.append("- ").append(l.get("tentacpham")).append(" (Hạn: ").append(l.get("ngaytra")).append(")\n");
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi tải dashboard.";
        }
    }

    private ChatResponse searchBooks(String title, String author, String category) {
        try {
            String sql = "SELECT matacpham, tentacpham, tacgia, anhbia FROM tacpham WHERE 1=1";
            List<Object> params = new ArrayList<>();
            if (title != null && !title.isEmpty()) {
                sql += " AND tentacpham ILIKE ?";
                params.add("%" + title + "%");
            }
            if (author != null && !author.isEmpty()) {
                sql += " AND tacgia ILIKE ?";
                params.add("%" + author + "%");
            }
            sql += " LIMIT 5";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
            if (rows.isEmpty()) {
                return new ChatResponse("Không tìm thấy cuốn sách nào phù hợp.", "", null);
            }

            List<Map<String, Object>> booksPayload = new ArrayList<>();
            StringBuilder textReply = new StringBuilder("Tôi tìm thấy vài tài liệu:\n");

            for (Map<String, Object> row : rows) {
                textReply.append("- **").append(row.get("tentacpham")).append("** - ").append(row.get("tacgia")).append("\n");

                Map<String, Object> item = new HashMap<>();
                item.put("id", row.get("matacpham"));
                item.put("title", row.get("tentacpham"));
                item.put("author", row.get("tacgia"));
                item.put("cover", row.get("anhbia") != null ? row.get("anhbia") : "/images/default-book.png");
                booksPayload.add(item);
            }

            Map<String, Object> action = new HashMap<>();
            action.put("type", "show_books");
            action.put("payload", booksPayload);

            return new ChatResponse(textReply.toString(), "", action);
        } catch (Exception e) {
            return new ChatResponse("Lỗi tìm kiếm sách.", "", null);
        }
    }

    private String searchEquipment(String name, String room) {
        try {
            String sql = "SELECT t.tenthietbi, t.trangthai, p.tenphong FROM thietbi t JOIN phong p ON t.maphong = p.maphong WHERE 1=1";
            List<Object> params = new ArrayList<>();
            if (name != null && !name.isEmpty()) {
                sql += " AND t.tenthietbi ILIKE ?";
                params.add("%" + name + "%");
            }
            if (room != null && !room.isEmpty()) {
                sql += " AND p.tenphong ILIKE ?";
                params.add("%" + room + "%");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
            if (rows.isEmpty()) return "Không tìm thấy thiết bị này.";
            
            StringBuilder sb = new StringBuilder("💻 **Thiết bị tìm thấy:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- ").append(row.get("tenthietbi")).append(" (").append(row.get("trangthai")).append(") @ ").append(row.get("tenphong")).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi tìm kiếm thiết bị.";
        }
    }

    private String searchArticles(String topic) {
        try {
            String sql = "SELECT tieude, noidung, ngaydang FROM baiviet WHERE trangthai = true";
            List<Object> params = new ArrayList<>();
            if (topic != null && !topic.isEmpty()) {
                sql += " AND (tieude ILIKE ? OR noidung ILIKE ?)";
                params.add("%" + topic + "%");
                params.add("%" + topic + "%");
            }
            sql += " ORDER BY ngaydang DESC LIMIT 3";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
            if (rows.isEmpty()) return "Không có bài viết nào.";
            
            StringBuilder sb = new StringBuilder("📰 **Tin tức thư viện:**\n");
            for (Map<String, Object> row : rows) {
                sb.append("- **").append(row.get("tieude")).append("**\n  ").append(row.get("noidung").toString().substring(0, Math.min(row.get("noidung").toString().length(), 100))).append("...\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi tìm bài viết.";
        }
    }

    private String getFacilityStatus(String roomName) {
        try {
            if (roomName == null || roomName.isEmpty()) return "Vui lòng nhập tên phòng.";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT tenphong, trangthai FROM phong WHERE tenphong ILIKE ? LIMIT 1", "%" + roomName + "%");
            if (rows.isEmpty()) return "Không tìm thấy phòng " + roomName;
            Map<String, Object> p = rows.get(0);
            return "🏢 **" + p.get("tenphong") + "**\n- Trạng thái: " + p.get("trangthai");
        } catch (Exception e) {
            return "Lỗi tra cứu phòng.";
        }
    }
}
