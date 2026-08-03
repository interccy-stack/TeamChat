/**
 * TeamChat 模块加载器 v5.2.3
 * 支持代码分割和懒加载
 */

const ModuleLoader = {
  // 已加载的模块缓存
  _cache: {},
  
  // 模块配置
  _modules: {
    'ai-chat': {
      url: '/api/plugins/team_chat/static/modules/ai-chat.module.js',
      size: '120KB',
      priority: 'low'
    },
    'email': {
      url: '/api/plugins/team_chat/static/modules/email.module.js',
      size: '80KB',
      priority: 'low'
    },
    'ai-fenshen': {
      url: '/api/plugins/team_chat/static/modules/ai-fenshen.module.js',
      size: '150KB',
      priority: 'medium'
    },
    'animation': {
      url: '/api/plugins/team_chat/static/modules/animation.module.js',
      size: '60KB',
      priority: 'low'
    },
    'onboarding': {
      url: '/api/plugins/team_chat/static/modules/onboarding.module.js',
      size: '40KB',
      priority: 'low'
    }
  },
  
  /**
   * 预加载模块（不执行，只下载）
   */
  preload: function(moduleName) {
    const config = this._modules[moduleName];
    if (!config) return Promise.reject('模块不存在: ' + moduleName);
    
    if (this._cache[moduleName]) {
      return Promise.resolve(this._cache[moduleName]);
    }
    
    return fetch(config.url)
      .then(r => r.text())
      .then(code => {
        this._cache[moduleName] = { code, loaded: false };
        return this._cache[moduleName];
      });
  },
  
  /**
   * 加载并执行模块
   */
  load: function(moduleName) {
    const config = this._modules[moduleName];
    if (!config) return Promise.reject('模块不存在: ' + moduleName);
    
    if (this._cache[moduleName] && this._cache[moduleName].executed) {
      return Promise.resolve(this._cache[moduleName].exports);
    }
    
    return this.preload(moduleName).then(module => {
      // 创建模块上下文
      const moduleContext = {
        exports: {}
      };
      
      // 执行模块代码
      const fn = new Function('module', 'exports', module.code);
      fn(moduleContext, moduleContext.exports);
      
      module.executed = true;
      module.exports = moduleContext.exports;
      
      console.log('[ModuleLoader] 模块已加载:', moduleName);
      return module.exports;
    });
  },
  
  /**
   * 按需加载（首次使用时加载）
   */
  loadOnDemand: function(moduleName, callback) {
    if (this._cache[moduleName] && this._cache[moduleName].executed) {
      callback(this._cache[moduleName].exports);
      return;
    }
    
    this.load(moduleName).then(exports => {
      callback(exports);
    }).catch(err => {
      console.error('[ModuleLoader] 加载失败:', moduleName, err);
    });
  },
  
  /**
   * 预加载所有低优先级模块（空闲时）
   */
  preloadAll: function() {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        Object.keys(this._modules).forEach(name => {
          if (this._modules[name].priority === 'low') {
            this.preload(name);
          }
        });
      });
    }
  }
};

// 暴露到全局
window.ModuleLoader = ModuleLoader;

// 空闲时预加载低优先级模块
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ModuleLoader.preloadAll());
} else {
  ModuleLoader.preloadAll();
}
