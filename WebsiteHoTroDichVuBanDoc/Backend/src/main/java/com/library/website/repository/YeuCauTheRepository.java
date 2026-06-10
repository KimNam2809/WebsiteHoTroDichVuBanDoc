package com.library.website.repository;

import com.library.website.models.YeuCauThe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface YeuCauTheRepository extends JpaRepository<YeuCauThe, Long> {
    List<YeuCauThe> findByTrangThaiQuyTrinh(String trangThaiQuyTrinh);
    Optional<YeuCauThe> findFirstByBanDocMaBanDocOrderByThoiGianBatDauDesc(Long maBanDoc);

    // Tự động tìm kiếm theo thông tin bổ sung chứa SDT hoặc CCCD (qua JSONB)
    @Query(value = "SELECT * FROM yeucauthe WHERE thongtinbosung->>'sdt' = :keyword OR thongtinbosung->>'cccd' = :keyword ORDER BY thoigianbatdau DESC", nativeQuery = true)
    List<YeuCauThe> searchRequestsBySdtOrCccd(@Param("keyword") String keyword);
}
