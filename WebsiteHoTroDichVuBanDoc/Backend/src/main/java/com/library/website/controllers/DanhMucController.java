package com.library.website.controllers;

import com.library.website.models.DanhMuc;
import com.library.website.repository.DanhMucRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/danh-muc")
public class DanhMucController {

    @Autowired
    private DanhMucRepository danhMucRepository;

    @GetMapping("/")
    public ResponseEntity<List<DanhMuc>> getAll() {
        return ResponseEntity.ok(danhMucRepository.findAll());
    }
}
