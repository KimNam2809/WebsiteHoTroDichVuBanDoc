package com.library.website.controllers;

import com.library.website.models.PhuongXa;
import com.library.website.repository.PhuongXaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/phuong-xa")
public class PhuongXaController {

    @Autowired
    private PhuongXaRepository repository;

    @GetMapping("/tinh/{tinhId}")
    public ResponseEntity<List<PhuongXa>> getByTinh(@PathVariable("tinhId") Long tinhId) {
        return ResponseEntity.ok(repository.findByTinhThanhPhoMaTinhThanhPho(tinhId));
    }
}
