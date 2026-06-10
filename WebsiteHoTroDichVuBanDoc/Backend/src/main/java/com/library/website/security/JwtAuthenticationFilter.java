package com.library.website.security;

import com.library.website.models.NguoiDung;
import com.library.website.repository.NguoiDungRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromJWT(jwt);
                String role = tokenProvider.getRoleFromJWT(jwt);
                Long id = tokenProvider.getUserIdFromJWT(jwt);
                String soDienThoai = null;

                if (id != null) {
                    soDienThoai = nguoiDungRepository.findById(id)
                            .map(NguoiDung::getSoDienThoai)
                            .orElse(null);
                }

                // Vai trò trong Spring Security thường có tiền tố "ROLE_"
                // FastAPI: vaitro = "nhanVien", "nguoiDung" (hoặc "banDoc"...)
                // Ánh xạ thành GrantedAuthority
                String authorityName = "ROLE_" + role.toUpperCase();
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(authorityName);

                // Tạo đối tượng Principal (ta lưu trữ Map chứa thông tin username, id, role)
                MapUserDetails principal = new MapUserDetails(id, username, role, soDienThoai);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal, null, Collections.singletonList(authority));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // Helper class để đại diện cho Principal trong SecurityContext
    public static class MapUserDetails {
        private final Long id;
        private final String username;
        private final String role;
        private final String soDienThoai;

        public MapUserDetails(Long id, String username, String role, String soDienThoai) {
            this.id = id;
            this.username = username;
            this.role = role;
            this.soDienThoai = soDienThoai;
        }

        public Long getId() {
            return id;
        }

        public String getUsername() {
            return username;
        }

        public String getRole() {
            return role;
        }

        public String getSoDienThoai() {
            return soDienThoai;
        }
    }
}
