package com.library.website.repository;

import com.library.website.models.LoaiThe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoaiTheRepository extends JpaRepository<LoaiThe, Short> {
}
