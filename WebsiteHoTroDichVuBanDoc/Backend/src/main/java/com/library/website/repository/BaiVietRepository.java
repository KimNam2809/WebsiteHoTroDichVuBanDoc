package com.library.website.repository;

import com.library.website.models.BaiViet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BaiVietRepository extends JpaRepository<BaiViet, Long> {
    List<BaiViet> findByTrangThaiOrderByNgayDangDesc(Boolean trangThai);
}
