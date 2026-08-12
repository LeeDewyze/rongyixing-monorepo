function n(){const t=typeof navigator<"u"?navigator.userAgent.toLowerCase():"";let e="H5";return/micromessenger/.test(t)?e="WechatH5":/dingtalk/.test(t)&&(e="DingtalkH5"),`客户${e}`}export{n as r};
