package com.library.website.controllers;

import com.library.website.models.TuKhoa;
import com.library.website.repository.TuKhoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tu-khoa")
public class TuKhoaController {

    @Autowired
    private TuKhoaRepository tuKhoaRepository;

    @GetMapping("/")
    public ResponseEntity<List<TuKhoa>> getAll() {
        return ResponseEntity.ok(tuKhoaRepository.findAll());
    }
}
