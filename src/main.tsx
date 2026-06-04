import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import I18nProvider from './i18n/I18nProvider';
import './styles/tokens.css';
import './styles/app.css';
import './styles/prose.css';
import './styles/templates/qingye.css';
import './styles/templates/haibao.css';
import './styles/templates/ningmeng.css';
import './styles/templates/chongying.css';
import './styles/templates/huabao.css';
import './styles/templates/yinzhang.css';
import './styles/templates/geshan.css';
import './styles/templates/shouzha.css';
import './styles/templates/jiguang.css';
import './styles/templates/zhangye.css';
import './styles/templates/juanshou.css';
import './styles/templates/jiekan.css';
import './styles/templates/yuebao.css';
import './styles/templates/hongbang.css';
import './styles/templates/shishang.css';
import './styles/templates/chuanbo.css';
import './styles/templates/wenyi.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
