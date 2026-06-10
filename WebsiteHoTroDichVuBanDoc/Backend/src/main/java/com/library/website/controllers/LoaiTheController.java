package com.library.website.controllers;

import com.library.website.models.LoaiThe;
import com.library.website.repository.LoaiTheRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loai-the")
public class LoaiTheController {

    @Autowired
    private LoaiTheRepository loaiTheRepository;

    @GetMapping("/")
    public ResponseEntity<List<LoaiThe>> getAllLoaiThe() {
        return ResponseEntity.ok(loaiTheRepository.findAll());
    }

}
