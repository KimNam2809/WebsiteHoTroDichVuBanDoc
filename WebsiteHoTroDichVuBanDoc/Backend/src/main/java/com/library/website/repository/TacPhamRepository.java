package com.library.website.repository;

import com.library.website.models.TacPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TacPhamRepository extends JpaRepository<TacPham, Long> {
}
