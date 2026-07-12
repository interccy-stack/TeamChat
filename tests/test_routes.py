"""
API路由单元测试
测试FastAPI路由的各项功能
"""
import pytest
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from email_backend.routes import router


class TestRoutes:
    """API路由测试类"""
    
    @pytest.fixture
    def client(self):
        """测试客户端"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(router)
        return TestClient(app)
    
    def test_get_config(self, client):
        """测试获取配置接口"""
        response = client.get("/api/teamchat/email/config")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        print("✅ 获取配置接口测试通过")
    
    def test_save_config(self, client):
        """测试保存配置接口"""
        config = {
            "email": "test@example.com",
            "smtp_host": "smtp.example.com",
            "smtp_port": 587,
            "imap_host": "imap.example.com",
            "imap_port": 993,
            "username": "test@example.com",
            "password": "test_password"
        }
        
        response = client.post("/api/teamchat/email/config", json=config)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✅ 保存配置接口测试通过")
    
    def test_get_emails(self, client):
        """测试获取邮件列表接口"""
        response = client.get("/api/teamchat/email/emails/inbox?limit=50")
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        assert isinstance(data["emails"], list)
        print("✅ 获取邮件列表接口测试通过")
    
    def test_get_contacts(self, client):
        """测试获取联系人接口"""
        response = client.get("/api/teamchat/email/contacts")
        assert response.status_code == 200
        data = response.json()
        assert "contacts" in data
        assert isinstance(data["contacts"], list)
        print("✅ 获取联系人接口测试通过")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
