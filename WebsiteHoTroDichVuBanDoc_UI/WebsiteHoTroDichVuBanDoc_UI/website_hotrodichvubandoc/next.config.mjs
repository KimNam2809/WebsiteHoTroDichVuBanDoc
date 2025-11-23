/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                // Cho phép ảnh giả lập (nếu có dùng)
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
            {
                // Cho phép ảnh từ Supabase Storage
                // Lưu ý: Thay 'PROJECT_ID' bằng ID project thực tế của Supabase nếu cần
                protocol: 'https',
                hostname: '*.supabase.co',
            }
        ]
    }
};

export default nextConfig;