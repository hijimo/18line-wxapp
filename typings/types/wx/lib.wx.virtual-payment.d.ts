/*! *****************************************************************************
本地补充声明：wx.requestVirtualPayment（米大师虚拟支付）

项目的 miniprogram-api-typings 版本为 ^2.8.3-1，其 lib.wx.api.d.ts 中
**不含** requestVirtualPayment，直接调用会编译报错。本文件通过 declaration
merging 扩展 WechatMiniprogram.Wx 补上该 API。

字段严格对照官方文档（2026-09-28 抓取原文核对）：
https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html

⚠️ 两个容易踩错的点：
1. **顶层只有 signData / paySig / signature 三个业务字段**。
   `mode`、`env`、`offerId`、`currencyType` 都在 **signData 内部**，不是顶层参数。
   （网络上部分踩坑帖写成顶层传 env/mode/offerId，与官方文档不符。）
2. signData 的类型标注是 Object，但**必须以 string 形式传递**——
   后端已序列化并基于该字符串算签名，前端重新 JSON.stringify 会导致
   字段顺序/空格变化而签名失效（errCode -15006）。

基础库 2.19.2 起支持；**不支持 Promise 风格**；小程序插件中不支持。
***************************************************************************** */

declare namespace WechatMiniprogram {
  /**
   * signData 的结构说明（仅作文档与后端契约对照用）。
   * 实际调用时该对象由**后端序列化成字符串**下发，前端不构造、不修改。
   */
  interface RequestVirtualPaymentSignData {
    /** MP → 虚拟支付 → 基础配置中的 offerid */
    offerId: string
    /** 购买数量，打赏场景固定为 1 */
    buyQuantity: number
    /** 0 正式环境 / 1 沙箱环境，默认 0。现网版本只能填 0，否则 -15011 */
    env?: number
    /** 币种，合法值仅 CNY，否则 -15004 */
    currencyType: string
    /** 道具ID，mode=short_series_goods 时必填。未发布报 -15010，发布未生效报 -15014 */
    productId?: string
    /** 道具单价（分），mode=short_series_goods 时必填。与后台道具价不一致报 -15013 */
    goodsPrice?: number
    /** 道具优惠价（分），需与 goodsPrice 一起传，传入后即为实际下单价 */
    activitySellingPrice?: number
    /** 业务订单号，8-32 字符，不能以下划线开头。重复使用报 -15002 */
    outTradeNo: string
    /** 透传数据，发货通知时原样回传。本项目约定 = outTradeNo */
    attach: string
    /** 支付类型：short_series_goods 道具直购 / short_series_coin 代币充值 */
    mode: string
  }

  interface RequestVirtualPaymentSuccessCallbackResult {
    /** 调用成功信息 */
    errMsg: string
  }

  interface RequestVirtualPaymentFailCallbackResult {
    /** 错误信息 */
    errMsg: string
    /**
     * 错误码。关键值：
     * -1 支付失败、-2 支付取消（用户主动，非异常）、-4 风控拦截、-5 开通签约结果未知、
     * -15001 参数错误、-15002 outTradeNo 重复、-15004 currencyType 错误、
     * -15005 用户态签名 signature 错误、-15006 支付签名 paySig 错误、
     * -15007 session_key 过期（需重新 wx.login）、-15008 二级商户进件未完成、
     * -15010 道具未发布、-15011 现网 env 只能为 0、-15012 米大师关单需换新单号、
     * -15013 goodsPrice 与后台道具价不符、-15014 道具发布未生效（约 10 分钟）、
     * -15016 signData 格式错误、-15017/-15019 商家受限、-15020 操作过快、-15021 小程序被限频
     */
    errCode: number
  }

  interface RequestVirtualPaymentOption {
    /**
     * 具体支付参数，**需以 string 形式传递**。
     * 后端 /wx/reward/order 返回的 signData 原样传入，禁止二次序列化。
     */
    signData: string
    /** 支付签名（HMAC-SHA256(appKey, "requestVirtualPayment&" + signData)） */
    paySig: string
    /** 用户态签名（HMAC-SHA256(sessionKey, signData)，无 uri 前缀） */
    signature: string
    success?: (res: RequestVirtualPaymentSuccessCallbackResult) => void
    fail?: (err: RequestVirtualPaymentFailCallbackResult) => void
    complete?: () => void
  }

  interface Wx {
    /**
     * [wx.requestVirtualPayment(Object object)](https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html)
     *
     * 发起米大师虚拟支付。基础库 2.19.2 开始支持，低版本需做兼容处理。
     * **不支持 Promise 风格调用**，只能用 success/fail 回调。
     *
     * ⚠️ success 回调**不能作为支付成功的最终凭证**：真实到账以微信服务端
     * 发货推送（xpay_goods_deliver_notify）落库为准，前端必须轮询
     * GET /wx/reward/order/{outTradeNo} 读服务端状态。
     */
    requestVirtualPayment(option: RequestVirtualPaymentOption): void
  }
}
