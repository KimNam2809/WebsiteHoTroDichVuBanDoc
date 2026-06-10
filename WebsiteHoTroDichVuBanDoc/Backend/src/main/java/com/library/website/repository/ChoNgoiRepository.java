package com.library.website.repository;

import com.library.website.models.ChoNgoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChoNgoiRepository extends JpaRepository<ChoNgoi, Long> {
    List<ChoNgoi> findByPhongMaPhong(Long maPhong);
}
