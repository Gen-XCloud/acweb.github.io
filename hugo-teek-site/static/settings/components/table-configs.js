/**
 * 各模块的表格配置
 */

// 致谢清单配置
const sponsorsTableConfig = {
    apiEndpoint: '/sponsors',
    title: '赞助',
    dataKey: 'sponsors',
    pageSize: 10,
    searchFields: ['name', 'message', 'amount'],
    
    columns: [
        {
            label: '姓名',
            field: 'name',
            width: '150px',
            render: (value) => `<strong>${value}</strong>`
        },
        {
            label: '金额（元）',
            field: 'amount',
            width: '120px'
        },
        {
            label: '日期',
            field: 'date',
            width: '140px'
        },
        {
            label: '留言',
            field: 'message'
        }
    ],
    
    formFields: [
        {
            name: 'name',
            label: '姓名',
            type: 'text',
            required: true,
            placeholder: '请输入姓名'
        },
        {
            name: 'amount',
            label: '金额（元）',
            type: 'text',
            required: true,
            placeholder: '请输入金额'
        },
        {
            name: 'date',
            label: '日期',
            type: 'text',
            required: true,
            placeholder: '2025/11/05',
            defaultValue: (() => {
                const today = new Date();
                return `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
            })()
        },
        {
            name: 'message',
            label: '留言',
            type: 'textarea',
            required: false,
            placeholder: '感谢支持！'
        }
    ]
};

// 友链配置
const friendLinksTableConfig = {
    apiEndpoint: '/friendlinks',
    title: '友链',
    dataKey: 'links',
    pageSize: 10,
    searchFields: ['name', 'description', 'url'],
    
    columns: [
        {
            label: '名称',
            field: 'name',
            width: '150px',
            render: (value, item) => `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${item.avatar}" style="width: 24px; height: 24px; border-radius: 50%;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><rect width=%2224%22 height=%2224%22 fill=%22%23ddd%22/></svg>'">
                    <strong>${value}</strong>
                </div>
            `
        },
        {
            label: 'URL',
            field: 'url',
            render: (value) => `<a href="${value}" target="_blank" style="color: #3b82f6; text-decoration: none;">${value}</a>`
        },
        {
            label: '描述',
            field: 'description'
        }
    ],
    
    formFields: [
        {
            name: 'name',
            label: '名称',
            type: 'text',
            required: true,
            placeholder: '请输入网站名称'
        },
        {
            name: 'url',
            label: 'URL',
            type: 'url',
            required: true,
            placeholder: 'https://example.com'
        },
        {
            name: 'avatar',
            label: '头像 URL',
            type: 'url',
            required: true,
            placeholder: 'https://example.com/avatar.png'
        },
        {
            name: 'description',
            label: '描述',
            type: 'textarea',
            required: false,
            placeholder: '网站描述'
        }
    ],
    
    // 加载后处理
    onLoad: (data) => {
        return data;
    }
};
