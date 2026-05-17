# 楚楚顶墙 AI 设计中心前端静态页

## 目录结构

```text
cucu/
├── index.html
├── README.md
├── pages/
│   ├── admin.html
│   ├── assets.html
│   ├── image.html
│   ├── login.html
│   └── video.html
└── assets/
    ├── css/
    │   ├── admin.css
    │   ├── assets.css
    │   ├── image.css
    │   ├── index.css
    │   ├── login.css
    │   └── video.css
    ├── js/
    │   ├── auth.js
    │   ├── admin.js
    │   ├── assets.js
    │   ├── image.js
    │   ├── index.js
    │   ├── login.js
    │   └── video.js
    └── images/
        ├── favicon.png
        └── logo.png
```

## 入口说明

- 首页入口：`index.html`
- 业务页面：`pages/*.html`
- 页面样式：`assets/css/*.css`
- 页面脚本：`assets/js/*.js`
- 图片资源：`assets/images/*`
- 公共登录与本地演示数据：`assets/js/auth.js`

## 后端接入关注点

- 当前为纯静态页面，可直接用浏览器打开 `index.html` 预览。
- 登录态 key：`cucu_ai_user`
- 经销商工作台 key：`cucu_dealer_workspace`
- 目前用 `localStorage` 模拟用户、积分、设计师、交易记录。
- 后端接入时，优先替换 `assets/js/auth.js` 中的数据读写逻辑。
