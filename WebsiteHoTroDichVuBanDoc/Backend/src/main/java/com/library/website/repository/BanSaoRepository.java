package com.library.website.repository;

import com.library.website.models.BanSao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BanSaoRepository extends JpaRepository<BanSao, Long> {
    List<BanSao> findByTacPhamMaTacPham(Long maTacPham);
    Optional<BanSao> findByMaBanSaoNoiBo(String maBanSaoNoiBo);
}
