"""
邮件客户端单元测试
测试EmailClient类的各项功能
"""
import pytest
import sys
sys.path.insert(0, r'C:\Users\lenovo\.copaw\plugins\TeamChat')

from email_backend.routes import EmailClient


class TestEmailClient:
    """邮件客户端测试类"""
    
    @pytest.fixture
    def mock_config(self):
        """测试配置"""
        return {
            "email": "test@example.com",
            "username": "test@example.com",
            "password": "test_password",
            "smtp_host": "smtp.example.com",
            "smtp_port": 587,
            "smtp_ssl": True,
            "imap_host": "imap.example.com",
            "imap_port": 993,
            "imap_ssl": True,
            "display_name": "Test User"
        }
    
    def test_email_client_init(self, mock_config):
        """测试邮件客户端初始化"""
        client = EmailClient(mock_config)
        
        assert client.email == "test@example.com"
        assert client.smtp_host == "smtp.example.com"
        assert client.smtp_port == 587
        assert client.imap_host == "imap.example.com"
        assert client.imap_port == 993
        print("✅ 邮件客户端初始化测试通过")
    
    def test_email_client_config_validation(self):
        """测试配置验证"""
        # 测试空配置
        empty_config = {}
        client = EmailClient(empty_config)
        
        assert client.email == ""
        assert client.smtp_host == ""
        assert client.smtp_port == 587  # 默认值
        print("✅ 配置验证测试通过")
    
    def test_parse_email_structure(self, mock_config):
        """测试邮件解析结构"""
        client = EmailClient(mock_config)
        
        # 测试解析方法存在
        assert hasattr(client, '_parse_email')
        assert hasattr(client, 'send_email')
        assert hasattr(client, 'fetch_emails')
        assert hasattr(client, 'test_connection')
        print("✅ 邮件解析结构测试通过")


class TestEmailProviders:
    """邮箱服务商测试类"""
    
    def test_qq_email_config(self):
        """测试QQ邮箱配置"""
        config = {
            "email": "123456@qq.com",
            "smtp_host": "smtp.qq.com",
            "smtp_port": 465,
            "imap_host": "imap.qq.com",
            "imap_port": 993
        }
        client = EmailClient(config)
        
        assert client.smtp_host == "smtp.qq.com"
        assert client.smtp_port == 465
        print("✅ QQ邮箱配置测试通过")
    
    def test_163_email_config(self):
        """测试163邮箱配置"""
        config = {
            "email": "user@163.com",
            "smtp_host": "smtp.163.com",
            "smtp_port": 465,
            "imap_host": "imap.163.com",
            "imap_port": 993
        }
        client = EmailClient(config)
        
        assert client.smtp_host == "smtp.163.com"
        assert client.smtp_port == 465
        print("✅ 163邮箱配置测试通过")
    
    def test_gmail_config(self):
        """测试Gmail配置"""
        config = {
            "email": "user@gmail.com",
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_ssl": False,  # Gmail使用STARTTLS
            "imap_host": "imap.gmail.com",
            "imap_port": 993
        }
        client = EmailClient(config)
        
        assert client.smtp_host == "smtp.gmail.com"
        assert client.smtp_port == 587
        assert client.smtp_ssl == False
        print("✅ Gmail配置测试通过")


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])
