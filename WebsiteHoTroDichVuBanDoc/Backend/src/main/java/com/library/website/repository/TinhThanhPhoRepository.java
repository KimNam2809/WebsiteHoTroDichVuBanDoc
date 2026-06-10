package com.library.website.repository;

import com.library.website.models.TinhThanhPho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TinhThanhPhoRepository extends JpaRepository<TinhThanhPho, Long> {
}
