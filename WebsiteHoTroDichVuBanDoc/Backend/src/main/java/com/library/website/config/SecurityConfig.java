package com.library.website.config;

import com.library.website.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Cho phép truy cập công khai các tài liệu tĩnh và gốc
                .requestMatchers("/", "/static/**").permitAll()
                
                // Các API công khai
                .requestMatchers("/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/tac-pham/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/tac-pham-danh-muc/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/danh-muc/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/tu-khoa/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/bai-viet/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/loai-the/**").permitAll()
                .requestMatchers("/api/v1/yeu-cau-the/tra-cuu").permitAll()
                .requestMatchers("/api/v1/tinh-thanh-pho/**", "/api/v1/phuong-xa/**").permitAll()
                
                // Mọi API khác cần xác thực JWT
                .anyRequest().authenticated()
            );

        // Thêm JwtAuthenticationFilter vào trước UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
