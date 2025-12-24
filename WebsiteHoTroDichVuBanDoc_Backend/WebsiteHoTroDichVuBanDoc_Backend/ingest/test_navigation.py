import requests
import time

API_URL = "http://127.0.0.1:8000/api/v1/chatbot/chat"
TEST_USER_ID = 8
SESSION_ID = f"nav_test_{int(time.time())}"

def send(msg):
    print(f"\n👱 User: {msg}")
    print("⏳ AI đang xử lý...", end="", flush=True)
    try:
        res = requests.post(API_URL, json={
            "user_id": TEST_USER_ID, "session_id": SESSION_ID, "message": msg
        })
        data = res.json()
        print(f"\r🤖 AI Text: {data['reply']}")

        if data.get('action'):
            print(f"🚀 ACTION TRIGGERED: {data['action']['type']}")
            print(f"   Label: {data['action']['label']}")
            print(f"   URL: {data['action']['payload']}")
        else:
            print("   (No Action)")

    except Exception as e:
        print(f"\n❌ Error: {e}")

def run():
    print("🚀 TEST ĐIỀU HƯỚNG & PHÂN LOẠI NGHIỆP VỤ")

    # 1. Test Hỏi đáp RAG (Nhóm 1)
    send("Thư viện mở cửa mấy giờ?")
    time.sleep(2)

    # 2. Test Tool Action (Nhóm 2)
    send("Tôi đang mượn sách gì?")
    time.sleep(2)

    # 3. Test Navigation (Nhóm 3) - Đăng ký thẻ
    send("Tôi muốn đăng ký làm thẻ thư viện.")
    time.sleep(2)

    # 4. Test Navigation (Nhóm 3) - Đặt phòng
    send("Lớp tôi muốn mượn phòng họp nhóm.")

if __name__ == "__main__":
    run()