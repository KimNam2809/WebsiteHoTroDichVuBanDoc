import requests
import time
import uuid

API_URL = "http://127.0.0.1:8000/api/v1/chatbot/chat"
TEST_USER_ID = 6
# Tạo session mới mỗi lần chạy test để đảm bảo sạch sẽ
SESSION_ID = f"test_session_{int(time.time())}"

def send_message(message):
    payload = {
        "user_id": TEST_USER_ID,
        "session_id": SESSION_ID,
        "message": message
    }
    print(f"\n👱 User: {message}")

    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"🤖 AI: {data['reply']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

def run_test():
    print(f"🧪 BẮT ĐẦU TEST VỚI SESSION: {SESSION_ID}")

    # 1. Hỏi đáp chung về thư viện
    send_message("Các bài viết về sự kiện của thư viện là những bài viết nào?")
    time.sleep(2) # Chờ DB lưu

    # 2. Hỏi đáp cụ thể về địa chỉ
    send_message("Có các chỗ ngồi nào hiện có thể đặt chỗ không?")
    time.sleep(2) # Chờ DB lưu

    # 3. Hỏi giờ mở cửa
    send_message("Thư viện có các loại thẻ nào?")
    time.sleep(2) # Chờ DB lưu

    # 3. Hỏi giờ mở cửa
    send_message("Phòng đọc có các thiết bị nào?")
    time.sleep(2) # Chờ DB lưu

if __name__ == "__main__":
    run_test()