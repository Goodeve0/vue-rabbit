import axios from 'axios';
import router from '@/router';
import { ElMessage, ElLoading } from 'element-plus';
import { useUserStore } from '@/stores/userStore';
import 'element-plus/theme-chalk/el-message.css';
import 'element-plus/theme-chalk/el-loading.css';
import _ from 'lodash';

// 创建 axios 实例
const httpInstance = axios.create({
    baseURL: 'http://pcapi-xiaotuxian-front-devtest.itheima.net',
    timeout: 10000
});

// Loading 管理
let loadingInstance;
let loadingRequestCount = 0;

function showLoading() {
    if (loadingRequestCount === 0) {
        console.log('显示 Loading');
        loadingInstance = ElLoading.service({
            lock: true,
            text: '加载中...',
            background: 'rgba(0, 0, 0, 0.7)',
            fullscreen: true
        });
    }
    loadingRequestCount++;
}
function hideLoading() {
    loadingRequestCount--;
    loadingRequestCount = Math.max(loadingRequestCount, 0); // 防止小于 0 的情况发生
    if (loadingRequestCount === 0) {
        console.log('隐藏 Loading');
        debounceHideLoading();
    }
}

// 防抖关闭 Loading
const debounceHideLoading = _.debounce(() => {
    if (loadingInstance) {
        loadingInstance.close();
        loadingInstance = null;
    }
}, 500);

// axios 请求拦截器
httpInstance.interceptors.request.use(config => {
    showLoading(); // 显示 Loading
    // 从 pinia 获取 token 数据
    const userStore = useUserStore();
    const token = userStore.userInfo.token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, e => {
    hideLoading(); // 隐藏 Loading
    return Promise.reject(e);
});

// axios 响应拦截器
httpInstance.interceptors.response.use(res => {
    hideLoading(); // 隐藏 Loading
    return res.data;
}, e => {
    hideLoading(); // 隐藏 Loading
    const userStore = useUserStore();
    // 统一错误提示
    ElMessage({
        type: 'warning',
        message: e.response?.data?.message || '请求出错'
    });
    // 401 token 失效处理
    if (e.response && e.response.status === 401) {
        userStore.clearUserInfo();
        router.push('/login');
    }
    return Promise.reject(e);
});

export default httpInstance;
