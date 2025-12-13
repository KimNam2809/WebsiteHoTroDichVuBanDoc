import google.generativeai as genai
from app.connect.config import settings

genai.configure(api_key=settings.GOOGLE_API_KEY)

print("--- 📡 ĐANG KẾT NỐI GOOGLE AI ĐỂ KIỂM TRA MODEL ---")
try:
    print(f"API Key đang dùng: {settings.GOOGLE_API_KEY[:5]}...*****")

    models = genai.list_models()
    found_any = False
    for m in models:
        # Chỉ liệt kê các model có khả năng tạo nội dung (generateContent)
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Model khả dụng: {m.name}")
            found_any = True

    if not found_any:
        print("⚠️ Không tìm thấy model nào hỗ trợ generateContent. Kiểm tra lại API Key.")

except Exception as e:
    print(f"❌ Lỗi kết nối: {e}")