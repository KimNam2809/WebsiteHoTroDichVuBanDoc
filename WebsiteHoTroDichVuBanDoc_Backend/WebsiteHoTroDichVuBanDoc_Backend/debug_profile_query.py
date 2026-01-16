import sys
import os
import json

# Add current directory to path to allow imports
sys.path.append(os.getcwd())

try:
    from app.connect.db import supabase_client
    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

def test_query():
    print("Fetching users...")
    # Lấy 10 user để tăng cơ hội tìm thấy
    users = supabase_client.table("nguoidung").select("manguoidung, email").limit(10).execute()
    
    print(f"Found {len(users.data)} users.")

    for u in users.data:
        uid = u['manguoidung']
        email = u['email']
        print(f"\n--- Checking User: {uid} ({email}) ---")

        # Query giống trong nguoi_dung_api.py
        query = """
            mabandoc,
            hoten,
            thebandoc (
                sothe
            )
        """
        # Simplest query first: just checking if thebandoc returns anything
        
        try:
            bd_res = supabase_client.table("bandoc").select(query).eq("manguoidung", uid).execute()
            print("Query Result:", json.dumps(bd_res.data, indent=2, ensure_ascii=False))
            
            if bd_res.data and len(bd_res.data) > 0:
                data = bd_res.data[0]
                if data.get("thebandoc") and len(data.get("thebandoc")) > 0:
                     print(f"User {uid} HAS CARD: {data['thebandoc'][0].get('sothe')}")
                else:
                     print(f"User {uid} HAS BANDOC BUT NO CARD.")
            else:
                print(f"User {uid} HAS NO BANDOC.")

        except Exception as e:
            print(f"QUERY ERROR for {uid}: {e}")

if __name__ == "__main__":
    test_query()
