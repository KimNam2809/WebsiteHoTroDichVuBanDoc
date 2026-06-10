package com.library.website.repository;

import com.library.website.models.PhuongXa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhuongXaRepository extends JpaRepository<PhuongXa, Long> {
    List<PhuongXa> findByTinhThanhPhoMaTinhThanhPho(Long maTinhThanhPho);
}
