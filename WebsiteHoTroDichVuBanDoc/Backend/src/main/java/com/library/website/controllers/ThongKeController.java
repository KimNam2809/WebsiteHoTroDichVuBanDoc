package com.library.website.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/v1/thong-ke")
public class ThongKeController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/tong-quan")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            Long countCards = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM yeucauthe WHERE trangthaiquytrinh = 'daYeuCau'", Long.class);
            Long countLoans = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM muontra WHERE trangthaimuon = 'daMuon'", Long.class);
            Long countOverdue = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM muontra WHERE trangthaimuon = 'quaHan'", Long.class);
            Long countReaders = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM bandoc", Long.class);

            Map<String, Object> response = new HashMap<>();
            response.put("hoSoCho", countCards != null ? countCards : 0);
            response.put("sachDangMuon", countLoans != null ? countLoans : 0);
            response.put("sachQuaHan", countOverdue != null ? countOverdue : 0);
            response.put("tongBanDoc", countReaders != null ? countReaders : 0);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/bao-cao")
    public ResponseEntity<?> getDetailedReport(@RequestParam(value = "type", defaultValue = "borrowing") String type) {
        try {
            if ("borrowing".equals(type)) {
                String sql = "SELECT trangthaimuon, COUNT(*) as cnt FROM muontra GROUP BY trangthaimuon";
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
                long total = 0;
                Map<String, Long> counts = new HashMap<>();
                counts.put("daMuon", 0L);
                counts.put("daTra", 0L);
                counts.put("quaHan", 0L);
                counts.put("dangChoXacNhan", 0L);

                for (Map<String, Object> row : rows) {
                    String status = (String) row.get("trangthaimuon");
                    Long cnt = ((Number) row.get("cnt")).longValue();
                    if (status != null) {
                        counts.put(status, cnt);
                    }
                    total += cnt;
                }

                List<Map<String, Object>> report = new ArrayList<>();
                report.add(createReportRow("Đang Mượn", counts.get("daMuon"), total));
                report.add(createReportRow("Đã Trả", counts.get("daTra"), total));
                report.add(createReportRow("Quá Hạn", counts.get("quaHan"), total));
                report.add(createReportRow("Chờ Xác Nhận", counts.get("dangChoXacNhan"), total));
                return ResponseEntity.ok(report);

            } else if ("readers".equals(type)) {
                String sql = "SELECT to_char(ngaytao, 'YYYY-MM') as month, COUNT(*) as cnt " +
                             "FROM bandoc " +
                             "WHERE ngaytao >= CURRENT_DATE - INTERVAL '180 days' " +
                             "GROUP BY to_char(ngaytao, 'YYYY-MM') " +
                             "ORDER BY month";
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
                long totalNew = 0;
                for (Map<String, Object> row : rows) {
                    totalNew += ((Number) row.get("cnt")).longValue();
                }

                List<Map<String, Object>> report = new ArrayList<>();
                for (Map<String, Object> row : rows) {
                    String month = (String) row.get("month");
                    Long cnt = ((Number) row.get("cnt")).longValue();
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", "Tháng " + (month != null && month.length() > 5 ? month.substring(5) : month));
                    item.put("value", cnt);
                    item.put("ratio", totalNew > 0 ? Math.round((double) cnt / totalNew * 1000.0) / 10.0 : 0.0);
                    report.add(item);
                }
                return ResponseEntity.ok(report);

            } else if ("overdue".equals(type)) {
                String sql = "SELECT m.mamuontra, b.hoten, t.tentacpham, m.ngaytradukien " +
                             "FROM muontra m " +
                             "JOIN bandoc b ON m.mabandoc = b.mabandoc " +
                             "JOIN bansao bs ON m.mabansao = bs.mabansao " +
                             "JOIN tacpham t ON bs.matacpham = t.matacpham " +
                             "WHERE m.trangthaimuon = 'quaHan' " +
                             "LIMIT 20";
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
                List<Map<String, Object>> report = new ArrayList<>();
                for (Map<String, Object> row : rows) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", row.get("hoten"));
                    item.put("value", row.get("tentacpham"));
                    item.put("ratio", "Hạn: " + row.get("ngaytradukien"));
                    report.add(item);
                }
                return ResponseEntity.ok(report);

            } else if ("top_books".equals(type)) {
                String sql = "SELECT t.matacpham, t.tentacpham, t.tacgia, t.anhbia, COUNT(*) as cnt " +
                             "FROM muontra m " +
                             "JOIN bansao bs ON m.mabansao = bs.mabansao " +
                             "JOIN tacpham t ON bs.matacpham = t.matacpham " +
                             "WHERE m.thoigianmuon >= CURRENT_DATE - INTERVAL '30 days' " +
                             "GROUP BY t.matacpham, t.tentacpham, t.tacgia, t.anhbia " +
                             "ORDER BY cnt DESC " +
                             "LIMIT 5";
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
                List<Map<String, Object>> report = new ArrayList<>();
                for (Map<String, Object> row : rows) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", row.get("matacpham"));
                    item.put("title", row.get("tentacpham"));
                    item.put("author", row.get("tacgia"));
                    item.put("image", row.get("anhbia"));
                    item.put("count", row.get("cnt"));
                    report.add(item);
                }
                return ResponseEntity.ok(report);
            }

            return ResponseEntity.ok(Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/hoat-dong-moi")
    public ResponseEntity<?> getRecentActivity(@RequestParam(value = "limit", defaultValue = "5") int limit) {
        try {
            List<Map<String, Object>> activities = new ArrayList<>();

            // 1. Loans
            String sqlLoans = "SELECT m.thoigianmuon as time, b.hoten, t.tentacpham " +
                              "FROM muontra m " +
                              "JOIN bandoc b ON m.mabandoc = b.mabandoc " +
                              "JOIN bansao bs ON m.mabansao = bs.mabansao " +
                              "JOIN tacpham t ON bs.matacpham = t.matacpham " +
                              "ORDER BY m.thoigianmuon DESC LIMIT ?";
            List<Map<String, Object>> loans = jdbcTemplate.queryForList(sqlLoans, limit);
            for (Map<String, Object> l : loans) {
                Map<String, Object> act = new HashMap<>();
                act.put("type", "loan");
                act.put("time", l.get("time"));
                act.put("content", l.get("hoten") + " mượn sách '" + l.get("tentacpham") + "'");
                activities.add(act);
            }

            // 2. Card Requests
            String sqlCards = "SELECT y.thoigianbatdau as time, b.hoten " +
                              "FROM yeucauthe y " +
                              "JOIN bandoc b ON y.mabandoc = b.mabandoc " +
                              "ORDER BY y.thoigianbatdau DESC LIMIT ?";
            List<Map<String, Object>> cards = jdbcTemplate.queryForList(sqlCards, limit);
            for (Map<String, Object> c : cards) {
                Map<String, Object> act = new HashMap<>();
                act.put("type", "card");
                act.put("time", c.get("time"));
                act.put("content", c.get("hoten") + " gửi yêu cầu làm thẻ");
                activities.add(act);
            }

            // Sort combining loans and card requests
            activities.sort((a, b) -> {
                Object tA = a.get("time");
                Object tB = b.get("time");
                if (tA == null && tB == null) return 0;
                if (tA == null) return 1;
                if (tB == null) return -1;
                return tB.toString().compareTo(tA.toString());
            });

            if (activities.size() > limit) {
                activities = activities.subList(0, limit);
            }

            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private Map<String, Object> createReportRow(String label, long value, long total) {
        Map<String, Object> row = new HashMap<>();
        row.put("label", label);
        row.put("value", value);
        row.put("ratio", total > 0 ? Math.round((double) value / total * 1000.0) / 10.0 : 0.0);
        return row;
    }
}
