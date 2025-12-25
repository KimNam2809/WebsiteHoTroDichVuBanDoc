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
    send_message("Thư viện nằm ở đâu?")
    time.sleep(2) # Chờ DB lưu

    # 2. Hỏi đáp cụ thể về địa chỉ
    send_message("Địa chỉ cụ thể?")
    time.sleep(2) # Chờ DB lưu

    # 3. Hỏi giờ mở cửa
    send_message("Giờ mở cửa của thư viện là khi nào?")
    time.sleep(2) # Chờ DB lưu

    # 4. Hỏi sách
    send_message("Có cuốn sách nào về lập trình có thể mượn bây giờ không?")
    time.sleep(2) # Chờ DB lưu

    # 5. Hỏi vị trí (Check ngữ cảnh)
    send_message("Tôi đang mượn những sách gì?")
    time.sleep(2)

    # 6. Hỏi tác giả
    send_message("Đặt trước giúp tôi cuốn Mắt Biếc.")

if __name__ == "__main__":
    run_test()