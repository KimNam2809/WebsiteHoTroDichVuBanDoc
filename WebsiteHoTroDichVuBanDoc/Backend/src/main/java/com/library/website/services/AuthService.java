package com.library.website.services;

import com.library.website.models.NguoiDung;
import com.library.website.repository.NguoiDungRepository;
import com.library.website.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public Optional<String> login(String username, String password) {
        // Tìm theo username hoặc email
        Optional<NguoiDung> userOpt = nguoiDungRepository.findByTenDangNhapOrEmail(username, username);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        NguoiDung user = userOpt.get();

        // Kiểm tra logic Google Auth
        if ("GOOGLE_AUTH_USER".equals(user.getMatKhau())) {
            throw new RuntimeException("Tài khoản này đăng ký bằng Google. Vui lòng đăng nhập bằng Google.");
        }

        // Kiểm tra mật khẩu (hỗ trợ cả plain-text cho hạt giống thử nghiệm và bcrypt hash)
        boolean matches = false;
        if (passwordEncoder.matches(password, user.getMatKhau()) || password.equals(user.getMatKhau())) {
            matches = true;
        }

        if (!matches) {
            return Optional.empty();
        }

        if (user.getTrangThai() != null && !user.getTrangThai()) {
            throw new RuntimeException("Tài khoản đã bị khóa.");
        }

        // Tạo JWT Token
        String token = tokenProvider.generateToken(user.getTenDangNhap(), user.getMaNguoiDung(), user.getVaiTro());
        return Optional.of(token);
    }
}
