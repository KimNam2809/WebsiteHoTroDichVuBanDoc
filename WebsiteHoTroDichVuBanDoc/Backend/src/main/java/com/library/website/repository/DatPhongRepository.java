package com.library.website.repository;

import com.library.website.models.DatPhong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DatPhongRepository extends JpaRepository<DatPhong, Long> {
    List<DatPhong> findByPhongMaPhong(Long maPhong);
    List<DatPhong> findBySoDienThoai(String soDienThoai);
}
