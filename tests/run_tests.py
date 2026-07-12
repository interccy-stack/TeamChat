#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试运行脚本
运行所有单元测试
"""
import subprocess
import sys

def run_tests():
    """运行测试"""
    print("=" * 60)
    print("TeamChat单元测试")
    print("=" * 60)
    print()
    
    # 运行测试
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "-v", "--tb=short"],
        cwd=r'C:\Users\lenovo\.copaw\plugins\TeamChat\tests',
        capture_output=True,
        text=True
    )
    
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    print()
    print("=" * 60)
    if result.returncode == 0:
        print("✅ 所有测试通过！")
    else:
        print("❌ 测试失败")
    print("=" * 60)
    
    return result.returncode

if __name__ == "__main__":
    sys.exit(run_tests())
