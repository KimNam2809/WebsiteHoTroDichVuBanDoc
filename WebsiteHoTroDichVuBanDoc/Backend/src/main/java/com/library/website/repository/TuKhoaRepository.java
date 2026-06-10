package com.library.website.repository;

import com.library.website.models.TuKhoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TuKhoaRepository extends JpaRepository<TuKhoa, Long> {
}
