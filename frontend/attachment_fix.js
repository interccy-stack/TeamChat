/**
 * TeamChat 附件上传修复补丁
 * 只修改附件上传功能，不影响其他界面
 */

// 附件上传功能修复
(function() {
  'use strict';

  // 等待 DOM 加载
  function initAttachmentFix() {
    console.log('[Attachment Fix] Initializing...');

    // 全局附件数组
    window.composeAttachments = window.composeAttachments || [];

    // 处理文件选择
    window.handleComposeAttachments = function(files) {
      console.log('[Attachment Fix] Files selected:', files);
      if (!files || files.length === 0) {
        console.log('[Attachment Fix] No files selected');
        return;
      }

      // 确保数组已初始化
      if (!window.composeAttachments) {
        window.composeAttachments = [];
      }

      // 添加所有选中的文件
      for (var i = 0; i < files.length; i++) {
        window.composeAttachments.push(files[i]);
        console.log('[Attachment Fix] Added:', files[i].name, files[i].size);
      }

      console.log('[Attachment Fix] Total:', window.composeAttachments.length);
      window.renderComposeAttachmentList();
    };

    // 渲染附件列表
    window.renderComposeAttachmentList = function() {
      var listContainer = document.getElementById('cm-attachment-list');
      if (!listContainer) {
        console.log('[Attachment Fix] List container not found');
        return;
      }

      if (window.composeAttachments.length === 0) {
        listContainer.style.display = 'none';
        listContainer.innerHTML = '';
        return;
      }

      var html = '<div style="border:1px solid #e8e8e8;border-radius:6px;padding:10px;background:#fafafa">';
      html += '<div style="font-size:13px;color:#666;margin-bottom:8px;font-weight:500">已选择的附件 (' + window.composeAttachments.length + ' 个)</div>';

      var totalSize = 0;
      window.composeAttachments.forEach(function(file, index) {
        totalSize += file.size;
        var sizeStr = formatFileSize(file.size);
        var icon = '📄';
        if (file.type && file.type.startsWith('image/')) icon = '🖼️';
        else if (file.name.endsWith('.pdf')) icon = '📕';
        else if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) icon = '📦';

        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin:4px 0;background:white;border-radius:4px;border:1px solid #e8e8e8">';
        html += '<div style="display:flex;align-items:center;gap:8px;flex:1;overflow:hidden">';
        html += '<span style="font-size:16px">' + icon + '</span>';
        html += '<span style="font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + file.name + '</span>';
        html += '<span style="font-size:12px;color:#999;flex-shrink:0">(' + sizeStr + ')</span>';
        html += '</div>';
        html += '<button type="button" onclick="window.removeComposeAttachment(' + index + ')" style="background:#ff4d4f;color:white;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;flex-shrink:0">删除</button>';
        html += '</div>';
      });

      html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e8e8e8;font-size:12px;color:#666;text-align:right">总大小: ' + formatFileSize(totalSize) + '</div>';
      html += '</div>';

      listContainer.innerHTML = html;
      listContainer.style.display = 'block';
    };

    // 删除附件
    window.removeComposeAttachment = function(index) {
      window.composeAttachments.splice(index, 1);
      window.renderComposeAttachmentList();
    };

    // 格式化文件大小
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      var k = 1024;
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 绑定文件输入事件
    function bindFileInput() {
      var fileInput = document.getElementById('cm-attachments');
      if (fileInput && !fileInput._attachmentBound) {
        fileInput._attachmentBound = true;
        fileInput.addEventListener('change', function(e) {
          console.log('[Attachment Fix] Change event:', e.target.files);
          if (e.target.files && e.target.files.length > 0) {
            window.handleComposeAttachments(e.target.files);
            // 清空以便重复选择
            e.target.value = '';
          }
        });
        console.log('[Attachment Fix] File input bound');
      }
    }

    // 绑定拖拽事件
    function bindDragDrop() {
      var dropZone = document.getElementById('cm-attachment-zone');
      if (dropZone && !dropZone._dragBound) {
        dropZone._dragBound = true;

        dropZone.addEventListener('dragover', function(e) {
          e.preventDefault();
          e.stopPropagation();
          this.style.borderColor = '#667eea';
          this.style.background = '#f0f4ff';
        });

        dropZone.addEventListener('dragleave', function(e) {
          e.preventDefault();
          e.stopPropagation();
          this.style.borderColor = '#ccc';
          this.style.background = 'transparent';
        });

        dropZone.addEventListener('drop', function(e) {
          e.preventDefault();
          e.stopPropagation();
          this.style.borderColor = '#ccc';
          this.style.background = 'transparent';
          var files = e.dataTransfer.files;
          if (files.length > 0) {
            window.handleComposeAttachments(files);
          }
        });

        console.log('[Attachment Fix] Drag & drop bound');
      }
    }

    // 监听弹窗打开
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.id === 'compose-modal-overlay') {
              console.log('[Attachment Fix] Compose modal opened');
              // 重置附件数组
              window.composeAttachments = [];
              // 绑定事件
              setTimeout(function() {
                bindFileInput();
                bindDragDrop();
              }, 100);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[Attachment Fix] Observer started');
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAttachmentFix);
  } else {
    initAttachmentFix();
  }
})();
