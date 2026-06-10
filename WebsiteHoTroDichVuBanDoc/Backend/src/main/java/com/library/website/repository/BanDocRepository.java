package com.library.website.repository;

import com.library.website.models.BanDoc;
import com.library.website.models.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BanDocRepository extends JpaRepository<BanDoc, Long> {
    Optional<BanDoc> findByNguoiDung(NguoiDung nguoiDung);
    Optional<BanDoc> findByNguoiDungMaNguoiDung(Long maNguoiDung);
    Optional<BanDoc> findByCccd(String cccd);
}
