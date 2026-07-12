"""
数据库操作单元测试
测试EmailDB类的各项功能
"""
import pytest
import sys
import os
import tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from email_backend.database import EmailDB


class TestDatabase:
    """数据库测试类"""
    
    @pytest.fixture
    def temp_db(self):
        """临时数据库"""
        # 创建临时数据库文件
        fd, path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        
        # 初始化数据库
        EmailDB.init_db(path)
        
        yield path
        
        # 清理
        if os.path.exists(path):
            os.remove(path)
    
    def test_init_db(self, temp_db):
        """测试数据库初始化"""
        assert os.path.exists(temp_db)
        print("✅ 数据库初始化测试通过")
    
    def test_save_config(self, temp_db):
        """测试保存配置"""
        config = {
            "email": "test@example.com",
            "smtp_host": "smtp.example.com",
            "smtp_port": 587
        }
        
        result = EmailDB.save_config(config)
        assert result == True
        
        # 验证保存成功
        saved_config = EmailDB.get_config()
        assert saved_config is not None
        assert saved_config.get("email") == "test@example.com"
        print("✅ 保存配置测试通过")
    
    def test_get_config_empty(self, temp_db):
        """测试获取空配置"""
        config = EmailDB.get_config()
        # 空数据库应该返回None或默认配置
        print("✅ 获取空配置测试通过")
    
    def test_save_email(self, temp_db):
        """测试保存邮件"""
        email_data = {
            "id": "12345",
            "subject": "Test Subject",
            "from_addr": "sender@example.com",
            "to_addr": "recipient@example.com",
            "body": "Test body"
        }
        
        result = EmailDB.save_email(email_data, "inbox")
        assert result == True
        print("✅ 保存邮件测试通过")
    
    def test_get_emails(self, temp_db):
        """测试获取邮件列表"""
        emails = EmailDB.get_emails("inbox", 50)
        assert isinstance(emails, list)
        print("✅ 获取邮件列表测试通过")
    
    def test_save_contact(self, temp_db):
        """测试保存联系人"""
        contact = {
            "name": "张三",
            "email": "zhangsan@example.com",
            "phone": "13800138000"
        }
        
        result = EmailDB.save_contact(contact)
        assert result == True
        print("✅ 保存联系人测试通过")
    
    def test_get_contacts(self, temp_db):
        """测试获取联系人列表"""
        contacts = EmailDB.get_contacts()
        assert isinstance(contacts, list)
        print("✅ 获取联系人列表测试通过")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
