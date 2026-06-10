package com.library.website.repository;

import com.library.website.models.NhanVien;
import com.library.website.models.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, Long> {
    Optional<NhanVien> findByNguoiDung(NguoiDung nguoiDung);
    Optional<NhanVien> findByNguoiDungMaNguoiDung(Long maNguoiDung);
    Optional<NhanVien> findByMaNhanVienNoiBo(String maNhanVienNoiBo);
}
