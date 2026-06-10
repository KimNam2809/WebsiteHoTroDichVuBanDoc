package com.library.website.repository;

import com.library.website.models.DatTruoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DatTruocRepository extends JpaRepository<DatTruoc, Long> {
    List<DatTruoc> findByBanDocMaBanDoc(Long maBanDoc);
    List<DatTruoc> findByBanDocMaBanDocAndTrangThaiDatTruoc(Long maBanDoc, String trangThai);
    List<DatTruoc> findByBanSaoMaBanSaoAndTrangThaiDatTruoc(Long maBanSao, String trangThai);
}
