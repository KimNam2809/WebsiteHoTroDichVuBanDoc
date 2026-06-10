package com.library.website.services;

import com.library.website.models.MuonTra;
import com.library.website.repository.MuonTraRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class MuonTraService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MuonTraRepository muonTraRepository;

    /**
     * Thực hiện nghiệp vụ mượn sách bằng cách gọi hàm RPC fn_muon_tai_lieu trên Database.
     */
    @Transactional
    public Map<String, Object> muonTaiLieu(Long maBanSao, Long maBanDoc, Long maNhanVien, LocalDate ngayTra) {
        try {
            // Chạy gọi RPC Postgres
            String sql = "SELECT * FROM fn_muon_tai_lieu(?, ?, ?, ?)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, maBanSao, maBanDoc, maNhanVien, ngayTra);

            if (rows.isEmpty()) {
                throw new RuntimeException("Lỗi hệ thống database: Không trả về dữ liệu phiếu mượn.");
            }

            return rows.get(0);
        } catch (Exception e) {
            log.error("Lỗi gọi RPC fn_muon_tai_lieu: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Thực hiện nghiệp vụ trả sách bằng cách gọi hàm RPC fn_tra_sach trên Database.
     */
    @Transactional
    public Map<String, Object> traSach(Long maMuonTra, Long maNhanVienTra) {
        try {
            // Chạy gọi RPC Postgres
            String sql = "SELECT * FROM fn_tra_sach(?, ?)";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, maMuonTra, maNhanVienTra);

            if (rows.isEmpty()) {
                throw new RuntimeException("Lỗi hệ thống database: Không trả về dữ liệu phiếu trả.");
            }

            return rows.get(0);
        } catch (Exception e) {
            log.error("Lỗi gọi RPC fn_tra_sach: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
}
