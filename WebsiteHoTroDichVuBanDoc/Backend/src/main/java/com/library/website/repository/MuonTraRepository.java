package com.library.website.repository;

import com.library.website.models.MuonTra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MuonTraRepository extends JpaRepository<MuonTra, Long> {
    List<MuonTra> findByBanDocMaBanDoc(Long maBanDoc);
    List<MuonTra> findByTrangThaiMuon(String trangThaiMuon);
    List<MuonTra> findByBanDocMaBanDocAndTrangThaiMuon(Long maBanDoc, String trangThaiMuon);
}
