package com.library.website.repository;

import com.library.website.models.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {
    List<ThongBao> findByMaBanDocOrderByThoiGianGuiDesc(Long maBanDoc);
}
